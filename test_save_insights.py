import copy
import json
import os
import struct
import tempfile
import threading
import time
import unittest
import urllib.error
import urllib.request
import zlib
from pathlib import Path
from http.server import ThreadingHTTPServer

from bridge import Bridge, handler_for
from save_reader.reader import (Catalogue, Node, SaveReadError, inflate, select,
                                inspect_object, extract_routes, area_key, SCHEMA, statistics_history, saved_items)
from save_reader.service import SaveInsightsService, preview_access, correlate


def i(name, value, size=4):
    return Node(name, int(value).to_bytes(size, 'little', signed=True))


def f(name, value):
    return Node(name, struct.pack('<f', value))


def tag(name, *children):
    return Node(name, children=list(children))


CATALOGUE = {'schema': 1, 'assets_sha256': 'test', 'texts_sha256': 'test',
             'human_profiles': [41, 42], 'text_labels': {},
             'assets': {'3142': {'name': 'Eques Residence', 'template': 'ResidenceBuilding', 'tier_guid': 1497},
                        '1497': {'name': 'Equites'}, '2153': {'name': 'Cheese'}}}


class ReaderChecks(unittest.TestCase):
    def test_saved_captain_has_instance_and_distinguishes_storage_from_assignment(self):
        payload = copy.deepcopy(CATALOGUE)
        payload['assets']['42617'] = {'name': 'Captain', 'item_kind': 'Captains'}
        catalogue = Catalogue(payload)
        def ref(iid, guid):
            return tag('ItemReference', i('ID', iid, 8), i('GUID', guid))
        stack = tag('SlotList', tag('_', tag('Stack', tag('value', tag('Stack',
                    ref(17, 42617), ref(0, 42617), ref(18, 2153))))))
        sockets = tag('SocketContainer', tag('SocketItems', tag('_', ref(17, 42617))))
        self.assertEqual([(row['kind'], row['state']) for _, row in
                          saved_items(tag('GlobalItemContainer', stack), catalogue, 'global')],
                         [('Captains', 'stored')])
        self.assertEqual([(row['kind'], row['state']) for _, row in
                          saved_items(tag('ItemContainer', sockets), catalogue, 'ship', equipped=True)],
                         [('Captains', 'assigned')])

    def test_saved_statistics_select_latest_and_do_not_invent_missing_rates(self):
        def point(tick,production,consumption):
            return tag('_',i('CreationTime',tick,8),
                       tag('GenerationPerProduct',i('_',2153),f('_',production),i('_',999),f('_',10)),
                       tag('ConsumptionPerProduct',i('_',2153),f('_',consumption)))
        history=tag('areaHistory',i('_',8513,2),tag('_',tag('Snapshots',point(200,1,3),point(100,8,1))))
        saved=statistics_history(history)[8513]
        self.assertEqual(saved['statistics_tick'],200)
        self.assertEqual(saved['entries'],[{'ProductGuid':2153,'ProductGeneration':1.,'ProductConsumption':3.,'ProductDelta':-2.}])

    def test_targeted_filedb_walk_skips_unused_subtrees_and_keeps_unknown_names(self):
        # A minimal V3 document, including a deliberately unnamed entry tag.
        tags={1:'GameSessionManager',2:'Ignored',3:'AreaInfo'}
        attrs={32768:'OwnerProfile',32769:'Unused'}
        def record(size,identifier):return struct.pack('<iI',size,identifier)
        def attr(identifier,data):return record(len(data),identifier)+data+b'\0'*((-len(data))%8)
        dom=(record(0,1)+record(0,2)+attr(32769,b'x'*100)+record(0,0)
             +record(0,3)+record(0,4)+attr(32768,struct.pack('<i',41))
             +record(0,0)+record(0,0)+record(0,0))
        def dictionary(values):return struct.pack('<i',len(values))+b''.join(struct.pack('<H',k) for k in values)+b''.join(v.encode()+b'\0' for v in values.values())
        td,ad=dictionary(tags),dictionary(attrs)
        data=dom+td+ad+struct.pack('<ii',len(dom),len(dom)+len(td))+bytes.fromhex('08000000FDFFFFFF')
        selected=list(select(data,lambda p:p==('GameSessionManager','AreaInfo')))
        self.assertEqual(len(selected),1)
        self.assertEqual(selected[0][1].children[0].name,'_')
        self.assertEqual(selected[0][1].children[0].get('OwnerProfile').data,struct.pack('<i',41))
        omitted=list(select(data,lambda p:p==('GameSessionManager',),omit=('Ignored',)))
        self.assertIsNone(omitted[0][1].get('Ignored'))

    def test_inner_stream_footer_and_bounded_decompression(self):
        data = b'hello' * 100
        self.assertEqual(inflate(zlib.compress(data)), data)
        self.assertEqual(inflate(zlib.compress(data) + zlib.compress(b'') + struct.pack('<I', len(data))), data)
        for bad in [zlib.compress(data) + b'junk', zlib.compress(data)[:-2],
                    zlib.compress(data) + zlib.compress(b'') + struct.pack('<I', 1)]:
            with self.assertRaises((SaveReadError, zlib.error)):
                inflate(bad)

    def test_missing_saturation_is_unknown_and_object_area_must_match(self):
        cat = Catalogue(CATALOGUE)
        from collections import Counter
        buildings, housing, needs = Counter(), {}, {}
        def house(aid, state):
            return tag('_', i('guid', 3142), Node('ID', struct.pack('<IHH', 1, aid, 0)),
                       tag('Residence7', tag('ConsumptionStates', i('_', 2153), tag('_', *state))))
        for state in [[f('CurrentSaturation', 1)], [f('CurrentSaturation', .5)],
                      [f('CurrentSaturation', 0)], []]:
            inspect_object(house(8513, state), 8513, buildings, housing, needs, cat)
        inspect_object(house(8961, [f('CurrentSaturation', 1)]), 8513, buildings, housing, needs, cat)
        n = needs[(1497, 2153)]
        self.assertEqual([n[k] for k in ['tracked_houses','explicit_full','explicit_partial','explicit_zero','omitted']], [4,1,1,1,1])
        self.assertEqual(housing[(3142,1497)]['count'], 4)
        self.assertEqual(area_key(8513), '1:5:1')

    def test_route_owner_filter_and_omitted_loading_direction(self):
        cat = Catalogue(CATALOGUE)
        route = tag('_', i('Owner', 41), Node('Name', 'Cheese route'.encode('utf-16-le')),
                    Node('Ships', struct.pack('<Q', 639)),
                    tag('Stations', tag('_', i('AreaID',8513,2), tag('GoodInfos',
                        tag('_',i('ProductGUID',2153),i('Amount',50),i('IsLoading',0,1)),
                        tag('_',i('ProductGUID',2153),i('Amount',50))))))
        other = copy.deepcopy(route);other.get('Owner').data = struct.pack('<i',42)
        rows = extract_routes(tag('RouteMap', i('_',1),route,i('_',2),other),41,{8513:{'name':'Juliana'}},cat)
        self.assertEqual(len(rows),1)
        self.assertEqual(rows[0]['ship_ids'],[639])
        self.assertEqual([g['action'] for g in rows[0]['stops'][0]['goods']],['unload','unspecified'])


class ServiceChecks(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.accounts = self.root/'accounts'
        self.profile = self.accounts/'account'/'Campaign_1'
        self.profile.mkdir(parents=True)
        self.file = self.profile/'Autosave 1.a8s'
        self.file.write_bytes(b'fixture')
        old=time.time()-10;os.utime(self.file,(old,old))
        self.catalogue = self.root/'catalogue.json'
        self.catalogue.write_text(json.dumps(CATALOGUE))
        self.calls=[]
        def reader(path, catalogue, participant, cancelled):
            self.calls.append(path)
            if path.read_bytes()==b'broken':raise SaveReadError('Broken fixture')
            return {'schema':SCHEMA,'catalogue_fingerprint':catalogue.fingerprint,'areas':[], 'routes':[],
                    'campaign_fingerprint':'test','file_name':path.name,'saved_at':'2026-11-01T10:00:00Z'}
        self.reader=reader
        self.service=SaveInsightsService(self.accounts,self.root/'settings',self.catalogue,preview_access(True),reader=reader)
        self.service.catalogue=Catalogue(CATALOGUE)
        self.service.profiles=self.service._scan()
        self.identifier=next(iter(self.service.profiles))
        self.service.choose(self.identifier)

    def tearDown(self):
        self.service.stop()
        self.temp.cleanup()

    def test_skip_unchanged_refresh_and_restore_cache(self):
        before=self.file.read_bytes(),self.file.stat().st_mtime_ns
        self.service.poll_once();self.service.refresh();self.service.poll_once()
        self.assertEqual(len(self.calls),1)
        self.assertEqual(self.service.state()['diagnostics']['unchanged_checks'],1)
        self.assertEqual(before,(self.file.read_bytes(),self.file.stat().st_mtime_ns))
        replacement=SaveInsightsService(self.accounts,self.root/'settings',self.catalogue,preview_access(True),reader=self.reader)
        replacement.catalogue=Catalogue(CATALOGUE);replacement.profiles=replacement._scan();replacement._restore();replacement.poll_once()
        self.assertEqual(len(self.calls),1)

    def test_failed_new_save_retains_last_good(self):
        self.service.poll_once();good=self.service.state()['snapshot']
        new=self.profile/'Autosave 2.a8s';new.write_bytes(b'broken');old=time.time()-2;os.utime(new,(old,old))
        self.service.poll_once()
        self.assertEqual(self.service.state()['status'],'error')
        self.assertEqual(self.service.state()['snapshot'],good)

    def test_profile_switch_clears_data_and_rejects_paths(self):
        self.service.poll_once()
        for bad in ['../outside',str(self.file),'missing']:
            with self.assertRaises(ValueError):self.service.choose(bad)
        p=self.accounts/'account'/'Other';p.mkdir();(p/'Manual.a8s').write_bytes(b'x')
        profiles=self.service._scan();second=next(k for k in profiles if k!=self.identifier)
        self.service.choose(second)
        self.assertIsNone(self.service.state()['snapshot'])

    def test_disabled_entitlement_never_reads_or_exposes_cached_data(self):
        self.service.poll_once();count=len(self.calls)
        self.service.access=preview_access(False);self.service.poll_once()
        self.assertEqual(len(self.calls),count)
        self.assertIsNone(self.service.state()['snapshot'])
        with self.assertRaises(PermissionError):self.service.refresh()

    def test_no_overlapping_reads(self):
        entered=threading.Event();finish=threading.Event()
        original=self.service.reader
        def slow(*args):entered.set();finish.wait(2);return original(*args)
        self.service.reader=slow
        worker=threading.Thread(target=self.service.poll_once);worker.start();self.assertTrue(entered.wait(1))
        self.service.poll_once();finish.set();worker.join(2)
        self.assertEqual(len(self.calls),1)

    def test_toggle_persists_and_saved_dashboard_works_without_pipe(self):
        self.service.poll_once()
        self.service.snapshot.update(areas=[{'area_id':8513,'area_key':'1:5:1','name':'Juliana',
            'session_id':1,'session_guid':3245,'residence_count':20,'statistics_tick':123,
            'entries':[{'ProductGuid':2153,'ProductNameEnglish':'Cheese','ProductGeneration':0.,
                        'ProductConsumption':1.5,'ProductDelta':-1.5}]}])
        pipe={'areas':[],'session_name':None,'pipe_state':'waiting_for_game','supply_suggestions':[]}
        self.assertEqual(self.service.dashboard(pipe),pipe)
        self.service.set_use_saves(True)
        saved=self.service.dashboard(pipe)
        self.assertEqual(saved['areas'][0]['area_name'],'Juliana')
        self.assertEqual(saved['areas'][0]['entries'][0]['ProductConsumption'],1.5)
        self.assertEqual(saved['areas'][0]['data_source'],'save')
        fresh={'session_id':1,'session_guid':3245,'island_id':5,'area_index':1,'area_name':'Juliana',
               'cached':False,'stale':False,'received_at':'2026-11-01T10:01:00Z','entries':[{'ProductGuid':2153,'ProductDelta':2.}]}
        pipe.update(areas=[fresh],session_name='Campaign_1',pipe_state='connected')
        merged=self.service.dashboard(pipe)
        self.assertEqual(merged['areas'][0]['entries'][0]['ProductDelta'],2.)
        pipe['session_name']='Different campaign'
        self.assertEqual(self.service.dashboard(pipe)['areas'][0]['data_source'],'save')
        self.assertTrue(self.service.dashboard(pipe)['save_source']['conflicting_pipe'])
        self.service.set_use_saves(False)
        self.assertEqual(self.service.dashboard(pipe),pipe)
        config=json.loads((self.root/'settings/save-insights-settings.json').read_text())
        self.assertIs(config['use_saves'],False)

    def test_select_historical_save_and_return_to_automatic_latest(self):
        new=self.profile/'Manual.a8s';new.write_bytes(b'new fixture');old=time.time()-2;os.utime(new,(old,old))
        self.service.choose(self.identifier,file_name='Autosave 1.a8s');self.service.poll_once()
        self.assertEqual(self.calls[-1].name,'Autosave 1.a8s')
        self.assertEqual(self.service.state()['selected_file'],'Autosave 1.a8s')
        self.service.choose(self.identifier);self.service.poll_once()
        self.assertEqual(self.calls[-1].name,'Manual.a8s')
        with self.assertRaises(ValueError):self.service.choose(self.identifier,file_name='../secret.a8s')

    def test_new_profile_does_not_receive_old_inflight_result(self):
        original=self.service.reader
        def switching(*args):
            with self.service.lock:self.service.generation+=1
            return original(*args)
        self.service.reader=switching;self.service.poll_once()
        self.assertIsNone(self.service.state()['snapshot'])

    def test_api_requires_pairing_and_has_no_arbitrary_path_or_unlock(self):
        server=ThreadingHTTPServer(('127.0.0.1',0),handler_for(Bridge({}),'secret',insights=self.service))
        thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
        url='http://127.0.0.1:'+str(server.server_port)+'/v1/save-insights'
        def request(body=None,token='secret',origin=None):
            headers={'Authorization':'Bearer '+token}
            if origin:headers['Origin']=origin
            data=json.dumps(body).encode() if body is not None else None
            try:
                with urllib.request.urlopen(urllib.request.Request(url,data=data,headers=headers)) as r:return r.status,json.load(r)
            except urllib.error.HTTPError as e:return e.code,json.load(e)
        try:
            self.assertEqual(request(token='bad')[0],401)
            self.assertEqual(request(origin='http://evil.invalid')[0],403)
            self.assertEqual(request({'action':'select','profile_id':str(self.file)})[0],400)
            self.assertEqual(request({'action':'enable'})[0],400)
            status,body=request();self.assertEqual(status,200)
            self.assertNotIn(str(self.accounts),json.dumps(body))
            self.assertEqual(request({'action':'refresh'})[0],202)
            self.service.access=preview_access(False)
            self.assertEqual(request()[0],403)
        finally:server.shutdown();server.server_close();thread.join(2)


class JoinChecks(unittest.TestCase):
    def test_same_ids_in_another_campaign_are_not_enough(self):
        saved={'profile_name':'Campaign_1','profile_display_name':'Marcus','areas':[
            {'area_key':'1:5:1','session_guid':3245,'name':'Juliana'}]}
        pipe={'session_name':'Other','areas':[{'session_id':1,'island_id':5,'area_index':1,'session_guid':3245,'area_name':'Juliana'}]}
        self.assertFalse(correlate(saved,pipe)['matched'])
        pipe['session_name']='Campaign_1';self.assertTrue(correlate(saved,pipe)['matched'])
        pipe['areas'][0]['area_name']='Another island';self.assertFalse(correlate(saved,pipe)['matched'])


if __name__=='__main__':unittest.main()
