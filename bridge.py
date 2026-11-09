"""Anno local pipe -> authenticated LAN HTTP snapshot. Standard library only."""
import argparse
import copy
import hmac
import json
import math
import os
import secrets
import socket
import struct
import sys
import threading
import time
import mimetypes
from collections import deque
from version import APP_VERSION
from trade_routes import TradeRouteStore
from urllib.parse import unquote, urlsplit, parse_qs
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from capture import PIPE, decode, read_exact

ROOT = Path(sys.executable).parent if getattr(sys, 'frozen', False) else Path(__file__).parent
RESOURCE = Path(getattr(sys, '_MEIPASS', Path(__file__).parent))
WEBROOT = RESOURCE / 'android-probe/app/src/main/assets/dashboard'


class CompanionHTTPServer(ThreadingHTTPServer):
    # Browsers request many artwork files together, especially after page changes.
    request_queue_size = 128


class Pairing:
    """Short-lived six-digit enrollment code, long-lived per-device tokens."""
    def __init__(self, legacy_token=None, path=None):
        self.path = path
        self.lock = threading.Lock()
        self.tokens = set()
        if legacy_token:
            self.tokens.add(legacy_token)
        if path and path.exists():
            self.tokens.update(json.loads(path.read_text()).get('devices', []))
        self.failures = {}
        self.rotate()

    def rotate(self):
        with self.lock:
            self.code = f'{secrets.randbelow(1000000):06d}'
            self.expires = time.monotonic() + 600

    def current_code(self):
        if time.monotonic() >= self.expires:
            self.rotate()
        return self.code

    def authenticate(self, value):
        with self.lock:
            return any(hmac.compare_digest(value, token) for token in self.tokens)

    def exchange(self, ip, code):
        with self.lock:
            attempts = [t for t in self.failures.get(ip, []) if time.monotonic()-t < 60]
            if len(attempts) >= 5:
                return 429, {'error': 'Too many attempts. Try again in one minute.'}
            if time.monotonic() >= self.expires or not hmac.compare_digest(str(code), self.code):
                attempts.append(time.monotonic());self.failures[ip] = attempts
                return 401, {'error': 'Pairing code incorrect or expired. Check the PC window.'}
            token = secrets.token_urlsafe(32)
            self.tokens.add(token)
            self.failures.pop(ip, None)
            if self.path:
                self.path.write_text(json.dumps({'devices': sorted(self.tokens)}), encoding='utf-8')
            return 200, {'device_token': token}


def now():
    return datetime.now(timezone.utc).isoformat()


def supply_suggestions(areas):
    """Allocate each positive local balance once; imports and stocks are unknown."""
    products = {}
    for area in areas:
        for entry in area['entries']:
            delta = entry['ProductDelta']
            if not math.isfinite(delta) or abs(delta) < 0.01:
                continue
            products.setdefault(entry['ProductGuid'], []).append((area, entry))
    results = []
    for guid, rows in products.items():
        sources = [[a, e, e['ProductDelta']] for a, e in rows if e['ProductDelta'] > 0]
        sinks = sorted([(a, e) for a, e in rows if e['ProductDelta'] < 0], key=lambda x: x[1]['ProductDelta'])
        sources.sort(key=lambda x: -x[2])
        for target, entry in sinks:
            deficit = -entry['ProductDelta']
            for source in sources:
                amount = min(deficit, source[2])
                if amount < 0.01:
                    continue
                results.append({'product_guid': guid, 'product_name': entry.get('ProductNameEnglish'),
                                'from_area': source[0]['area_name'], 'to_area': target['area_name'],
                                'from_area_key': area_key(source[0]), 'to_area_key': area_key(target),
                                'suggested_rate': amount, 'remaining_local_deficit': max(0, deficit - amount),
                                'source_updated_at': source[0].get('received_at'), 'target_updated_at': target.get('received_at')})
                source[2] -= amount
                deficit -= amount
                if deficit < 0.01:
                    break
    return results


def area_key(area):
    return ':'.join(str(area[k]) for k in ('session_id', 'island_id', 'area_index'))


class Bridge:
    def __init__(self, mapping, cache_path=None):
        self.names = mapping
        self.lock = threading.Lock()
        self.areas = {}
        self.journal = deque()
        self.cache_path = Path(cache_path) if cache_path else None
        self.stop_event = threading.Event()
        self.active_pipe = None
        self.state = {'bridge_version': APP_VERSION, 'pipe_state': 'waiting_for_game', 'protocol_version': None,
                      'session_name': None, 'pipe_session_id':secrets.token_hex(16), 'messages': 0, 'last_message_at': None, 'last_error': None}
        if self.cache_path and self.cache_path.is_file() and self.cache_path.stat().st_size < 16_000_000:
            try:
                saved=json.loads(self.cache_path.read_text(encoding='utf-8'))
                if saved.get('schema')==1:
                    self.areas={area_key(a):a for a in saved['areas']}
                    self.journal.extend(saved.get('journal',[]))
                    self.state.update(session_name=saved.get('session_name'),protocol_version=2,pipe_session_id=saved.get('pipe_session_id') or self.state['pipe_session_id'])
            except (OSError,ValueError,TypeError,KeyError):
                self.areas.clear();self.journal.clear()

    def persist_cache(self):
        if not self.cache_path:return
        with self.lock:
            payload={'schema':1,'pipe_session_id':self.state['pipe_session_id'],'session_name':self.state['session_name'],'areas':list(self.areas.values()),'journal':list(self.journal)}
            body=json.dumps(payload,ensure_ascii=False,allow_nan=False)
            while len(body.encode('utf-8'))>15_000_000 and payload['journal']:
                payload['journal'].pop(0);body=json.dumps(payload,ensure_ascii=False,allow_nan=False)
        try:
            self.cache_path.parent.mkdir(parents=True,exist_ok=True)
            temp=self.cache_path.with_suffix('.tmp');temp.write_text(body,encoding='utf-8');temp.replace(self.cache_path)
        except OSError:
            pass  # A read-only cache folder must not stop the live pipe reader.

    def accept(self, data, version):
        message = decode(data, version)
        if message.get('trailing_bytes', 0):
            raise ValueError('Unexpected trailing protocol bytes')
        kind = message['type']
        if kind == 'Version' and message['version'] != 2:
            raise ValueError('Unsupported Anno protocol version: ' + str(message['version']))
        received = now()
        if kind == 'AreaProductionStatistics':
            message['received_at'] = received
            for entry in message['entries']:
                entry['ProductNameEnglish'] = self.names.get(str(entry['ProductGuid']), {}).get('name_en')
                for field, dest in [('BuildingGUIDtoAmount', 'BuildingsNamed'), ('WorkforceGUIDtoAmount', 'WorkforcesNamed')]:
                    entry[dest] = [{'guid': int(guid), 'name_en': self.names.get(guid, {}).get('name_en'), 'amount': amount}
                                   for guid, amount in entry[field].items()]
            # Reject NaN/Infinity rather than emitting non-standard JSON to Android.
            json.dumps(message, allow_nan=False)
        with self.lock:
            self.state.update(pipe_state='connected', last_error=None, last_message_at=received,
                              messages=self.state['messages'] + 1, last_message_type=kind)
            if kind == 'Version':
                self.state['protocol_version'] = message['version']
            elif kind in ('SessionStart', 'SessionEnd'):
                self.areas.clear()
                self.journal.clear()
                self.state['session_name'] = message.get('name')
                self.state['pipe_session_id'] = secrets.token_hex(16)
            elif kind == 'AreaProductionStatistics':
                self.areas[area_key(message)] = message
                self.journal.append(copy.deepcopy(message))
                cutoff=datetime.fromisoformat(received).timestamp()-60
                while self.journal and datetime.fromisoformat(self.journal[0]['received_at']).timestamp()<cutoff:
                    self.journal.popleft()
        if kind in ('SessionStart','SessionEnd','AreaProductionStatistics'):self.persist_cache()
        return message

    def snapshot(self):
        with self.lock:
            result = copy.deepcopy(self.state)
            areas = copy.deepcopy(list(self.areas.values()))
            journal_times=[a['received_at'] for a in self.journal]
        current = time.time()
        for area in areas:
            age = max(0, current - datetime.fromisoformat(area['received_at']).timestamp())
            cached=age>60 or result['pipe_state']!='connected'
            area.update(age_seconds=round(age, 1),stale=cached,cached=cached)
        routes=supply_suggestions(areas)
        index={area_key(a):a for a in areas}
        for route in routes:
            route['cached']=index[route['from_area_key']]['cached'] or index[route['to_area_key']]['cached']
        cached_count=sum(a['cached'] for a in areas)
        fresh_count=len(areas)-cached_count
        result.update(server_time=now(), areas=areas,
                      data_mode='mixed' if fresh_count and cached_count else 'cached' if cached_count else 'live' if areas else 'waiting',
                      fresh_area_count=fresh_count,cached_area_count=cached_count,
                      cache_window_seconds=60,history_records=len(journal_times),
                      history_started_at=journal_times[0] if journal_times else None,
                      last_data_at=max((a['received_at'] for a in areas),default=None),
                      supply_suggestions=routes,
                      supply_note='Local balances only; stock and imports are unknown. Last known values are retained when no new game data arrives. Cached sources and data ages are marked. No rates are averaged or extrapolated.')
        return result

    def run_pipe(self):
        while not self.stop_event.is_set():
            try:
                with open(PIPE, 'rb', buffering=0) as pipe:
                    version = None
                    with self.lock:
                        self.active_pipe = pipe
                        self.state.update(pipe_state='connected', protocol_version=None)
                    while not self.stop_event.is_set():
                        size = struct.unpack('<i', read_exact(pipe, 4))[0]
                        if not 1 <= size <= 1048576:
                            raise ValueError('Invalid pipe frame size')
                        data = read_exact(pipe, size)
                        if version is None and data[0] != 0:
                            raise ValueError('Expected protocol version preamble')
                        message = self.accept(data, version)
                        if message['type'] == 'Version':
                            version = message['version']
            except (OSError, EOFError, ValueError) as error:
                with self.lock:
                    self.state.update(pipe_state='waiting_for_game', last_error=str(error))
                self.stop_event.wait(1)
            finally:
                with self.lock:
                    self.active_pipe = None

    def stop(self):
        self.stop_event.set()
        with self.lock:
            pipe = self.active_pipe
            if pipe is not None and os.name == 'nt':
                import ctypes
                import msvcrt
                from ctypes import wintypes
                cancel = ctypes.WinDLL('kernel32', use_last_error=True).CancelIoEx
                cancel.argtypes = [wintypes.HANDLE, ctypes.c_void_p]
                try:
                    cancel(msvcrt.get_osfhandle(pipe.fileno()), None)
                except (OSError, ValueError):
                    pass


def handler_for(bridge, token, trade_store=None, insights=None):
    trade_store=trade_store if trade_store is not None else TradeRouteStore()
    pairing = token if isinstance(token, Pairing) else None
    class Handler(BaseHTTPRequestHandler):
        def insights_request(self, write=False):
            supplied = self.headers.get('Authorization', '')
            valid = (pairing.authenticate(supplied[7:]) if pairing and supplied.startswith('Bearer ')
                     else not pairing and hmac.compare_digest(supplied.encode(), ('Bearer '+token).encode()))
            if not valid:
                self.reply(401, {'error': 'Pairing required'});return
            origin = self.headers.get('Origin')
            if origin and urlsplit(origin).netloc != self.headers.get('Host'):
                self.reply(403, {'error': 'Use the bridge page'});return
            if insights is None or not insights.allowed():
                self.reply(403, {'enabled': False, 'status': 'disabled', 'billing_available': False});return
            try:
                if write:
                    length = int(self.headers.get('Content-Length', '0'))
                    if not 0 < length <= 2048:
                        raise ValueError('Invalid request size')
                    value = json.loads(self.rfile.read(length))
                    if not isinstance(value, dict):
                        raise ValueError('Invalid Save Insights request')
                    if value.get('action') == 'refresh' and set(value) == {'action'}:
                        insights.refresh()
                    elif value.get('action') == 'use_saves' and set(value) == {'action','enabled'}:
                        insights.set_use_saves(value['enabled'])
                    elif value.get('action') == 'selection_mode' and set(value) == {'action','mode'}:
                        insights.set_selection_mode(value['mode'])
                    elif value.get('action') == 'select' and set(value) <= {'action','profile_id','participant','file_name'}:
                        insights.choose(value['profile_id'], value.get('participant'), value.get('file_name'))
                    else:
                        raise ValueError('Invalid Save Insights request')
                self.reply(202 if write else 200, insights.state(bridge.snapshot()))
            except PermissionError:
                self.reply(403, {'error': 'Save Insights is not enabled.'})
            except (ValueError, KeyError, TypeError):
                self.reply(400, {'error': 'Invalid save selection. Use a discovered profile.'})
            except OSError:
                self.reply(503, {'error': 'Save settings could not be stored.'})

        def trade_request(self,write=False):
            supplied=self.headers.get('Authorization','')
            valid=pairing.authenticate(supplied[7:]) if pairing and supplied.startswith('Bearer ') else not pairing and hmac.compare_digest(supplied.encode(),('Bearer '+token).encode())
            if not valid:self.reply(401,{'error':'Pairing required'});return
            origin=self.headers.get('Origin')
            if origin and urlsplit(origin).netloc!=self.headers.get('Host'):
                self.reply(403,{'error':'Use the bridge page'});return
            try:
                context=parse_qs(urlsplit(self.path).query).get('context',[''])[0]
                if write:
                    length=int(self.headers.get('Content-Length','0'))
                    if not 0<length<=2_000_000:raise ValueError('Invalid request size')
                    value=json.loads(self.rfile.read(length))
                    status,document=trade_store.put(context,value['revision'],value['routes'],value.get('skipped',[]),value.get('planner'))
                    self.reply(status,document)
                else:self.reply(200,trade_store.index() if context=='__contexts__' else trade_store.get(context))
            except (ValueError,KeyError,TypeError):self.reply(400,{'error':'Invalid route plan'})
            except OSError:self.reply(503,{'error':'Route plans could not be saved'})

        def do_PUT(self):
            if urlsplit(self.path).path=='/v1/trade-routes':self.trade_request(True)
            else:self.reply(404,{'error':'Not found'})

        def do_POST(self):
            if urlsplit(self.path).path == '/v1/save-insights':
                self.insights_request(True);return
            if self.path == '/v1/report':
                self.report();return
            if self.path != '/v1/pair' or pairing is None:
                self.reply(404, {'error': 'Not found'});return
            # No cross-origin browser enrollment; QR opens the bridge's own origin.
            origin = self.headers.get('Origin')
            if origin and urlsplit(origin).netloc != self.headers.get('Host'):
                self.reply(403, {'error': 'Use the bridge page to pair'});return
            try:
                length = int(self.headers.get('Content-Length', '0'))
                if not 0 < length <= 512:
                    raise ValueError()
                data = json.loads(self.rfile.read(length))
                status, body = pairing.exchange(self.client_address[0], data.get('code', ''))
                self.reply(status, body)
            except (ValueError, TypeError):
                self.reply(400, {'error': 'Invalid pairing request'})

        def report(self):
            origin=self.headers.get('Origin')
            if origin and urlsplit(origin).netloc!=self.headers.get('Host'):
                self.reply(403,{'error':'Use the bridge page'});return
            try:
                length=int(self.headers.get('Content-Length','0'))
                if not 0<length<=8_000_000:raise ValueError('Report request too large')
                payload=json.loads(self.rfile.read(length))
                if not isinstance(payload,dict):raise ValueError('Invalid report request')
                if payload.get('isDemo'):
                    payload['snapshot']=json.loads((WEBROOT/'demo.json').read_text(encoding='utf-8'))
                else:
                    supplied=self.headers.get('Authorization','')
                    valid=pairing.authenticate(supplied[7:]) if pairing and supplied.startswith('Bearer ') else not pairing and hmac.compare_digest(supplied.encode(),('Bearer '+token).encode())
                    if not valid:self.reply(401,{'error':'Pairing required'});return
                from empire_report import build_empire_pdf
                body=build_empire_pdf(payload)
                self.send_response(200);self.send_header('Content-Type','application/pdf')
                self.send_header('Content-Disposition','attachment; filename="Anno117-Empire-Summary.pdf"')
                self.send_header('Content-Length',str(len(body)));self.send_header('Cache-Control','no-store');self.end_headers();self.wfile.write(body)
            except (ValueError,TypeError,KeyError):self.reply(400,{'error':'Invalid report data'})
            except (BrokenPipeError,ConnectionResetError):pass

        def do_GET(self):
            path = unquote(urlsplit(self.path).path)
            if path in ('/v1/setup','/v1/discovery'):
                supplied=self.headers.get('Authorization','')
                valid=pairing.authenticate(supplied[7:]) if pairing and supplied.startswith('Bearer ') else (not pairing and hmac.compare_digest(supplied.encode(),('Bearer '+token).encode()))
                if not valid:self.reply(401,{'error':'Pairing required'});return
                from connection_tools import launch_diagnostics,discover,save_connection_summary
                if path=='/v1/discovery':self.reply(200,{'servers':discover()})
                else:
                    state=bridge.snapshot();self.reply(200,{**launch_diagnostics(),**{k:state.get(k) for k in ('pipe_state','last_error','protocol_version','messages')},'save':save_connection_summary(insights,state)})
                return
            if path == '/v1/save-insights':self.insights_request();return
            if path=='/v1/trade-routes':self.trade_request();return
            if path != '/v1/snapshot':
                self.static(path)
                return
            supplied = self.headers.get('Authorization', '')
            valid = pairing.authenticate(supplied[7:]) if pairing and supplied.startswith('Bearer ') else (not pairing and hmac.compare_digest(supplied.encode(), ('Bearer ' + token).encode()))
            if not valid:
                self.reply(401, {'error': 'Pairing code required or incorrect'})
            elif path == '/v1/snapshot':
                pipe_snapshot = bridge.snapshot()
                effective = insights.dashboard(pipe_snapshot) if insights is not None else pipe_snapshot
                effective['use_save_data'] = bool(insights is not None and insights.allowed() and insights.use_saves)
                self.reply(200, effective)
            else:
                self.reply(404, {'error': 'Not found'})

        def static(self, path):
            requested = 'index.html' if path == '/' else path.lstrip('/')
            candidate = (WEBROOT / requested).resolve()
            if not candidate.is_relative_to(WEBROOT.resolve()) or not candidate.is_file():
                self.reply(404, {'error': 'Not found'})
                return
            content_type = mimetypes.guess_type(str(candidate))[0] or 'application/octet-stream'
            if candidate.suffix == '.webmanifest':
                content_type = 'application/manifest+json'
            if candidate.suffix in ('.html', '.js', '.css', '.json', '.webmanifest', '.svg'):
                content_type += '; charset=utf-8'
            image_asset = candidate.suffix.lower() in ('.png', '.webp', '.svg', '.ico')
            stat = candidate.stat()
            etag = f'"{stat.st_mtime_ns:x}-{stat.st_size:x}"'
            if image_asset and self.headers.get('If-None-Match') == etag:
                self.send_response(304)
                self.send_header('ETag', etag)
                self.send_header('Cache-Control', 'public, max-age=86400')
                self.end_headers()
                return
            self.send_response(200)
            self.send_header('Content-Type', content_type)
            self.send_header('Content-Length', str(stat.st_size))
            self.send_header('Cache-Control', 'public, max-age=86400' if image_asset else 'no-cache')
            if image_asset:
                self.send_header('ETag', etag)
            self.send_header('X-Content-Type-Options', 'nosniff')
            self.send_header('Referrer-Policy', 'no-referrer')
            self.end_headers()
            try:
                self.wfile.write(candidate.read_bytes())
            except (BrokenPipeError, ConnectionResetError):
                pass

        def reply(self, status, data):
            body = json.dumps(data, ensure_ascii=False, allow_nan=False).encode('utf-8')
            self.send_response(status)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Content-Length', str(len(body)))
            self.send_header('Cache-Control', 'no-store')
            self.end_headers()
            try:
                self.wfile.write(body)
            except (BrokenPipeError, ConnectionResetError):
                pass

        def log_message(self, fmt, *args):
            pass  # Never record authentication headers.
    return Handler


def pairing_token():
    config_dir = ROOT / 'bridge-settings'
    config_dir.mkdir(parents=True, exist_ok=True)
    config_file = config_dir / 'pairing.json'
    if config_file.exists():
        return json.loads(config_file.read_text())['pairing_code']
    token = secrets.token_hex(8).upper()
    config_file.write_text(json.dumps({'pairing_code': token}), encoding='utf-8')
    return token


class BridgeService:
    def __init__(self, port=11780, host='0.0.0.0', save_preview=False, connect_pipe=True):
        self.port = port
        self.host = host
        self.token = pairing_token()
        self.pairing = Pairing(self.token, ROOT / 'bridge-settings/devices.json')
        self.server = None
        self.bridge = None
        self.pipe_thread = None
        self.trade_store=TradeRouteStore(ROOT/'bridge-settings/trade-routes.json')
        self.save_preview = save_preview
        self.connect_pipe = connect_pipe
        self.insights = None
        self.discovery = None

    def start(self):
        if self.server:
            return
        names = json.loads((RESOURCE / 'guid_map.json').read_text(encoding='utf-8'))['guids']
        bridge = Bridge(names, ROOT/'bridge-settings/recent-game-cache.json')
        if self.insights is None:
            from save_reader.service import SaveInsightsService, preview_access, default_accounts
            self.insights = SaveInsightsService(default_accounts(),
                ROOT/'bridge-settings', RESOURCE/'save_catalogue.json', preview_access(self.save_preview))
        server = CompanionHTTPServer((self.host, self.port), handler_for(bridge, self.pairing,self.trade_store,self.insights))
        server.daemon_threads = True
        self.bridge, self.server = bridge, server
        if self.connect_pipe:
            self.pipe_thread = threading.Thread(target=bridge.run_pipe, daemon=True)
            self.pipe_thread.start()
        self.insights.start()
        threading.Thread(target=server.serve_forever, daemon=True).start()
        from connection_tools import DiscoveryServer
        self.discovery=DiscoveryServer(self.port,self.host);self.discovery.start()

    def stop(self):
        if self.discovery:self.discovery.stop()
        if self.insights:
            self.insights.stop()
        if self.bridge:
            self.bridge.stop()
        if self.server:
            self.server.shutdown()
            self.server.server_close()
            self.server = None
        if self.pipe_thread:
            self.pipe_thread.join(timeout=3)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--host', default='0.0.0.0')
    parser.add_argument('--port', type=int, default=11780)
    args = parser.parse_args()
    token = pairing_token()
    names = json.loads((RESOURCE / 'guid_map.json').read_text(encoding='utf-8'))['guids']
    bridge = Bridge(names, ROOT/'bridge-settings/recent-game-cache.json')
    try:
        server = CompanionHTTPServer((args.host, args.port), handler_for(bridge, token,TradeRouteStore(ROOT/'bridge-settings/trade-routes.json')))
    except OSError as error:
        print('Cannot start bridge:', error)
        return 1
    server.daemon_threads = True
    threading.Thread(target=bridge.run_pipe, daemon=True).start()
    print('Anno 117 Bridge '+APP_VERSION+'\nKeep this window open while playing. Start Anno with /pipe.\n')
    addresses = sorted({x[4][0] for x in socket.getaddrinfo(socket.gethostname(), None, socket.AF_INET) if not x[4][0].startswith('127.')})
    for address in addresses:
        print('PC address: http://' + address + ':' + str(args.port))
    print('Pairing code:', token)
    print('\nPhone: open Anno Companion, enter PC address + pairing code once.\nLocal HTTP, for your trusted LAN. No Windows password required.\nIf Windows Firewall asks, allow this app on your Private network.\nCtrl+C to stop.', flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        bridge.stop()
        server.server_close()
    return 0


if __name__ == '__main__':
    sys.exit(main())
