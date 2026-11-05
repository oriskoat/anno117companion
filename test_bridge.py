import json
import threading
import unittest
import urllib.request
import urllib.error
from pathlib import Path
from http.server import ThreadingHTTPServer
from bridge import Bridge, Pairing, handler_for, supply_suggestions, area_key


class BridgeChecks(unittest.TestCase):
    def test_six_digit_pairing_device_tokens_and_throttle(self):
        pairing = Pairing()
        self.assertRegex(pairing.current_code(), r'^\d{6}$')
        self.assertFalse(pairing.authenticate(pairing.code))
        status, body = pairing.exchange('phone', pairing.code)
        self.assertEqual(status, 200)
        self.assertTrue(pairing.authenticate(body['device_token']))
        for _ in range(5):
            self.assertEqual(pairing.exchange('bad', 'not-a-code')[0], 401)
        self.assertEqual(pairing.exchange('bad', pairing.code)[0], 429)
        previous_token = body['device_token']
        pairing.rotate()
        self.assertTrue(pairing.authenticate(previous_token))

    def test_synthetic_protocol_and_session_lifecycle(self):
        import struct
        from capture import FIELDS
        bridge = Bridge({'2086': {'name_en': 'Clay'}})
        version = bridge.accept(struct.pack('<Bi', 0, 2), None)['version']
        name = b'Example Empire'
        bridge.accept(b'\x01'+bytes([len(name)])+name, version)
        for island, production, consumption in [(1, 5, 1), (2, 0, 3)]:
            label = ('Example island '+str(island)).encode()
            payload = struct.pack('<BBBBi',3,1,island,1,3245)+bytes([len(label)])+label+struct.pack('<qi',100,1)
            values = {'ProductGuid':2086,'ProductGeneration':production,'ProductConsumption':consumption,'ProductDelta':production-consumption}
            for field, fmt in FIELDS:
                payload += struct.pack('<'+fmt, values.get(field,0))
            payload += struct.pack('<ii',0,0)
            bridge.accept(payload,version)
        snapshot = bridge.snapshot()
        self.assertEqual(len(snapshot['areas']),2)
        self.assertTrue(all(e['ProductNameEnglish']=='Clay' for a in snapshot['areas'] for e in a['entries']))
        self.assertEqual(len(snapshot['supply_suggestions']),1)
        bridge.accept(b'\x02',2)
        self.assertEqual(bridge.snapshot()['areas'],[])
        with self.assertRaises(ValueError):
            bridge.accept(b'\x00\x03\x00\x00\x00',None)

    def test_supply_does_not_allocate_surplus_twice_and_uses_ids(self):
        def area(island, delta):
            return {'session_id': 1, 'island_id': island, 'area_index': 1, 'area_name': 'Same name',
                    'entries': [{'ProductGuid': 2086, 'ProductNameEnglish': 'Clay', 'ProductDelta': delta}]}
        rows = supply_suggestions([area(1, 5), area(2, -4), area(3, -4)])
        self.assertAlmostEqual(sum(r['suggested_rate'] for r in rows), 5)
        self.assertEqual(len({r['to_area_key'] for r in rows}), 2)
        self.assertTrue(all(r['from_area_key'] != r['to_area_key'] for r in rows))

    def test_cached_areas_still_used_for_supply(self):
        bridge = Bridge({})
        for island, delta in [(1, 5), (2, -5)]:
            area = {'session_id': 1, 'island_id': island, 'area_index': 1, 'area_name': str(island),
                    'received_at': '2020-01-01T00:00:00+00:00', 'entries': [{'ProductGuid': 1, 'ProductDelta': delta}]}
            bridge.areas[area_key(area)] = area
        snapshot=bridge.snapshot()
        self.assertEqual(len(snapshot['supply_suggestions']),1)
        self.assertTrue(snapshot['supply_suggestions'][0]['cached'])
        self.assertEqual(snapshot['data_mode'],'cached')

    def test_one_old_island_does_not_mark_fresh_islands_cached(self):
        from datetime import datetime,timezone,timedelta
        from unittest.mock import patch
        clock=datetime(2026,11,1,tzinfo=timezone.utc)
        bridge=Bridge({});bridge.state['pipe_state']='connected'
        for island,age,delta in [(1,2,5),(2,3,-3),(3,86400,-2)]:
            area={'session_id':1,'island_id':island,'area_index':1,'area_name':'Example',
                  'received_at':(clock-timedelta(seconds=age)).isoformat(),
                  'entries':[{'ProductGuid':1,'ProductDelta':delta}]}
            bridge.areas[area_key(area)]=area
        with patch('bridge.time.time',return_value=clock.timestamp()):
            state=bridge.snapshot()
            self.assertEqual(state['data_mode'],'mixed')
            self.assertEqual((state['fresh_area_count'],state['cached_area_count']),(2,1))
            self.assertEqual([s['cached'] for s in state['supply_suggestions']],[False,True])
        with patch('bridge.time.time',return_value=clock.timestamp()+61):
            self.assertEqual(bridge.snapshot()['data_mode'],'cached')
        bridge.state['pipe_state']='waiting_for_game'
        with patch('bridge.time.time',return_value=clock.timestamp()):
            self.assertEqual(bridge.snapshot()['fresh_area_count'],0)

    def test_rolling_minute_freezes_during_silence_and_resumes(self):
        from unittest.mock import patch
        from datetime import datetime,timezone,timedelta
        import tempfile
        base=datetime(2026,10,31,tzinfo=timezone.utc)
        def sample(island,delta):
            return {'type':'AreaProductionStatistics','session_id':1,'island_id':island,
                    'area_index':1,'area_name':str(island),'entries':[{'ProductGuid':1,
                    'ProductDelta':delta,'BuildingGUIDtoAmount':{},'WorkforceGUIDtoAmount':{}}]}
        with tempfile.TemporaryDirectory() as directory:
            path=Path(directory)/'cache.json';bridge=Bridge({},path)
            for seconds,island,delta in [(0,1,5),(30,2,-3),(61,1,6)]:
                stamp=(base+timedelta(seconds=seconds)).isoformat()
                with patch('bridge.decode',return_value=sample(island,delta)),patch('bridge.now',return_value=stamp):
                    bridge.accept(b'',2)
            self.assertEqual(len(bridge.journal),2)
            with patch('bridge.time.time',return_value=base.timestamp()+65):
                live=bridge.snapshot()
                self.assertEqual(live['data_mode'],'live')
            with patch('bridge.time.time',return_value=base.timestamp()+900):
                cached=bridge.snapshot()
                self.assertEqual(cached['data_mode'],'cached')
                self.assertEqual(cached['history_records'],2)
                self.assertEqual(cached['supply_suggestions'][0]['suggested_rate'],3)
                self.assertEqual([a['entries'] for a in live['areas']],[a['entries'] for a in cached['areas']])
            restored=Bridge({},path).snapshot()
            self.assertEqual(restored['data_mode'],'cached')
            self.assertEqual(len(restored['areas']),2)
            self.assertEqual(restored['history_records'],2)
            # Both islands refresh: return to live, with unchanged numeric rates.
            for island,delta in [(1,6),(2,-3)]:
                stamp=(base+timedelta(seconds=901)).isoformat()
                with patch('bridge.decode',return_value=sample(island,delta)),patch('bridge.now',return_value=stamp):
                    bridge.accept(b'',2)
            with patch('bridge.time.time',return_value=base.timestamp()+902):
                self.assertEqual(bridge.snapshot()['data_mode'],'live')
            # A different session must never inherit another empire's values.
            with patch('bridge.decode',return_value={'type':'SessionStart','name':'New game'}):
                bridge.accept(b'',2)
            self.assertFalse(bridge.snapshot()['areas'])
            self.assertFalse(Bridge({},path).snapshot()['areas'])

    def test_http_authentication(self):
        server = ThreadingHTTPServer(('127.0.0.1', 0), handler_for(Bridge({}), 'test-token'))
        threading.Thread(target=server.serve_forever, daemon=True).start()
        try:
            url = 'http://127.0.0.1:' + str(server.server_port) + '/v1/snapshot'
            with self.assertRaises(urllib.error.HTTPError) as failure:
                urllib.request.urlopen(url)
            self.assertEqual(failure.exception.code, 401)
            request = urllib.request.Request(url, headers={'Authorization': 'Bearer test-token'})
            with urllib.request.urlopen(request) as response:
                self.assertEqual(json.load(response)['bridge_version'], __import__('version').APP_VERSION)
            with urllib.request.urlopen(url.replace('/v1/snapshot', '/')) as response:
                self.assertIn(b'Anno Companion', response.read())
            with self.assertRaises(urllib.error.HTTPError):
                urllib.request.urlopen(url.replace('/v1/snapshot', '/%2e%2e/guid_map.json'))
        finally:
            server.shutdown()
            server.server_close()

    def test_artwork_cache_and_conditional_request(self):
        from bridge import CompanionHTTPServer
        server = CompanionHTTPServer(('127.0.0.1', 0), handler_for(Bridge({}), 'test-token'))
        threading.Thread(target=server.serve_forever, daemon=True).start()
        try:
            url = f'http://127.0.0.1:{server.server_port}/emblem.svg'
            with urllib.request.urlopen(url) as response:
                self.assertIn('max-age=86400', response.headers['Cache-Control'])
                etag = response.headers['ETag']
                self.assertTrue(response.read())
            with self.assertRaises(urllib.error.HTTPError) as cached:
                urllib.request.urlopen(urllib.request.Request(url, headers={'If-None-Match': etag}))
            self.assertEqual(cached.exception.code, 304)
            with urllib.request.urlopen(url.replace('emblem.svg', 'index.html')) as response:
                self.assertEqual(response.headers['Cache-Control'], 'no-cache')
        finally:
            server.shutdown()
            server.server_close()

    @unittest.skipUnless(__import__('os').name == 'nt', 'Windows named pipe lifecycle')
    def test_stop_releases_a_blocked_pipe_reader(self):
        import ctypes
        import time
        import uuid
        import bridge as module
        from ctypes import wintypes as w
        kernel = ctypes.WinDLL('kernel32', use_last_error=True)
        kernel.CreateNamedPipeW.argtypes = [w.LPCWSTR, w.DWORD, w.DWORD, w.DWORD, w.DWORD, w.DWORD, w.DWORD, ctypes.c_void_p]
        kernel.CreateNamedPipeW.restype = w.HANDLE
        kernel.ConnectNamedPipe.argtypes = [w.HANDLE, ctypes.c_void_p]
        kernel.WriteFile.argtypes = [w.HANDLE, ctypes.c_void_p, w.DWORD, ctypes.POINTER(w.DWORD), ctypes.c_void_p]
        kernel.CloseHandle.argtypes = [w.HANDLE]
        name = r'\\.\pipe\anno_companion_test_' + uuid.uuid4().hex
        server = kernel.CreateNamedPipeW(name, 2, 8, 1, 1024, 0, 0, None)
        self.assertNotEqual(server, ctypes.c_void_p(-1).value)
        original = module.PIPE
        instance = Bridge({})
        def writer():
            kernel.ConnectNamedPipe(server, None)
            written = w.DWORD()
            kernel.WriteFile(server, b'\x05\x00\x00\x00\x00\x02\x00\x00\x00', 9, ctypes.byref(written), None)
        try:
            module.PIPE = name
            threading.Thread(target=writer, daemon=True).start()
            reader = threading.Thread(target=instance.run_pipe, daemon=True)
            reader.start()
            until = time.monotonic() + 3
            while instance.snapshot()['messages'] < 1 and time.monotonic() < until:
                time.sleep(.02)
            self.assertEqual(instance.snapshot()['protocol_version'], 2)
            instance.stop()
            reader.join(timeout=3)
            self.assertFalse(reader.is_alive(), 'Stop must release an idle pipe reader')
        finally:
            instance.stop()
            module.PIPE = original
            kernel.CloseHandle(server)


if __name__ == '__main__':
    unittest.main()
