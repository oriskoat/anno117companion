"""Single-window Windows Companion: pairing bar above the complete dashboard."""
import base64
import argparse
import io
import json
import socket
import threading
import webbrowser
import os
import sys
import time
from updater import Updater, apply_update
from datetime import datetime
from empire_report import build_empire_pdf
from pathlib import Path
import qrcode
from bridge import BridgeService, ROOT
from version import APP_VERSION, BUILD_CHANNEL


class DesktopAPI:
    def __init__(self, service):
        self.service = service
        self.updater = Updater(ROOT)
        self.guard = threading.Lock()
        try:
            addresses = sorted({x[4][0] for x in socket.getaddrinfo(socket.gethostname(), None, socket.AF_INET)
                                if not x[4][0].startswith(('127.', '169.254.'))})
        except OSError:
            # An offline PC or a failed hostname lookup must still open the local tool.
            addresses = []
        addresses.sort(key=lambda a: (not a.startswith(('192.168.', '10.')), a))
        self.address = 'http://' + (service.host if service.host!='0.0.0.0' else addresses[0] if addresses else 'PC-IP') + ':' + str(service.port)

    def desktop_state(self):
        code = self.service.pairing.current_code()
        qr = qrcode.QRCode(box_size=5, border=2)
        qr.add_data(self.address + '/#pair=' + code)
        qr.make(fit=True)
        buffer = io.BytesIO()
        qr.make_image(fill_color='#183b60', back_color='#fffefa').save(buffer, format='PNG')
        state=self.service.bridge.snapshot() if self.service.bridge else {}
        effective=self.service.insights.dashboard(state) if self.service.insights and state else state
        game_label='Game statistics connected' if state.get('pipe_state')=='connected' and state.get('fresh_area_count',0)>0 else 'Pipe opened; waiting for game statistics' if state.get('pipe_state')=='connected' else 'Game pipe unavailable; check setup'
        if effective.get('save_source',{}).get('saved_areas',0)>0:game_label='Live + saved game statistics' if effective.get('fresh_area_count',0)>0 else 'Using saved game statistics'
        return {'running': bool(self.service.server), 'game_label':game_label, 'code': code, 'address': self.address,
                'qr': 'data:image/png;base64,' + base64.b64encode(buffer.getvalue()).decode('ascii')}

    def open_browser(self):
        pipe=self.service.bridge.snapshot() if self.service.bridge else {'areas':[]}
        effective=self.service.insights.dashboard(pipe) if self.service.insights else pipe
        sample=not effective['areas']
        webbrowser.open('http://127.0.0.1:' + str(self.service.port) + '/#pair=' + self.service.token + ('&sample=1' if sample else ''))

    def open_donation(self):
        webbrowser.open('https://revolut.me/vafvyop?currency=EUR&amount=500')

    def check_update(self,force=False):
        if BUILD_CHANNEL == 'local-beta':
            return {'status':'preview','current':APP_VERSION,'url':'https://github.com/oriskoat/anno117companion/releases'}
        return self.updater.check(bool(force))

    def download_update(self):
        return self.updater.download()

    def install_update(self):
        import webview
        result=self.updater.restart()
        threading.Timer(.5,lambda:webview.windows[0].destroy()).start()
        return result

    def export_report(self, payload):
        report=build_empire_pdf(payload)
        folder=ROOT/'exports';folder.mkdir(exist_ok=True)
        target=folder/('Anno117-Empire-Summary-'+datetime.now().strftime('%Y%m%d-%H%M%S')+'.pdf')
        target.write_bytes(report)
        os.startfile(str(target))
        return {'saved':True,'filename':target.name}

    def toggle_server(self):
        with self.guard:
            if self.service.server:
                self.service.stop()
            else:
                self.service.start()
        return self.desktop_state()


def main():
    local_beta = BUILD_CHANNEL == 'local-beta'
    parser=argparse.ArgumentParser(description='Anno 117 Companion local server and dashboard')
    parser.add_argument('--host',default='0.0.0.0')
    default_port=11790 if local_beta else 11780
    try:
        port_hint=json.loads((ROOT/'bridge-settings/listen-port.json').read_text(encoding='utf-8')).get('port')
        if isinstance(port_hint,int) and not isinstance(port_hint,bool) and 1024<=port_hint<=65535:default_port=port_hint
    except (OSError,ValueError,TypeError,AttributeError):pass
    parser.add_argument('--port',type=int,default=default_port)
    parser.add_argument('--browser',action='store_true',help='Run the local server with the bundled browser-mode controller (no .NET/WebView2 required).')
    parser.add_argument('--save-insights-preview', action='store_true', help='Enable the local Save Insights development preview. No billing or purchase is required for this private preview.')
    parser.add_argument('--no-pipe', action='store_true', help='Do not connect another pipe reader; useful for isolated save-preview testing.')
    parser.add_argument('--production-planner', action='store_true', default=local_beta, help='Open the local Production Planner beta.')
    args=parser.parse_args()
    from startup_guard import runtime_status, browser_window
    import tempfile
    try:
        with tempfile.TemporaryFile(dir=ROOT):
            pass
    except OSError as error:
        raise RuntimeError('The Companion folder is not writable. Extract the app to a folder you own (for example Documents), keeping bridge-settings beside the EXE.') from error
    status=runtime_status()
    service = BridgeService(args.port,args.host,save_preview=True,connect_pipe=not args.no_pipe)
    try:
        service.start()
    except OSError as error:
        # A second full client must not silently control another process's server.
        import tkinter as tk
        from tkinter import messagebox
        root = tk.Tk();root.withdraw()
        messagebox.showerror('Anno Companion', f'The local server could not start on port {args.port}.\n\n{error}\n\nClose any previous Companion using this port, or choose a free port with --port.')
        root.destroy()
        return
    try:
        if args.browser or status['issues']:
            browser_window(service, () if args.browser else status['issues'])
            return
        import webview
        api = DesktopAPI(service)
        address = 'http://127.0.0.1:' + str(service.port) + '/#pair=' + service.token + '&desktop=1' + ('&planner=1' if args.production_planner else '&insights=1' if args.save_insights_preview else '')
        title='Anno 117 Companion'+(' — Production Planner Beta' if args.production_planner else ' — Save Insights Preview' if args.save_insights_preview else '')+(f' ({args.port})' if args.port!=11780 else '')
        window = webview.create_window(title, address, js_api=api, width=1360, height=960, min_size=(640, 640), maximized=True)
        if args.production_planner:
            def verify_planner_window():
                target = ROOT / 'bridge-settings/planner-ui-status.json'
                for _ in range(30):
                    try:
                        value = window.evaluate_js("JSON.stringify({page:document.body.dataset.page,plannerVisible:!!document.querySelector('.ap-layout'),source:typeof advisorCompute==='function'?advisorCompute().source?.name:null,saveMatched:typeof savedContextAllowed==='function'&&savedContextAllowed(),width:innerWidth,scrollWidth:document.documentElement.scrollWidth})")
                        status = json.loads(value) if isinstance(value, str) else value
                        if status.get('plannerVisible') and status.get('saveMatched'):
                            target.write_text(json.dumps(status), encoding='utf-8')
                            return
                    except Exception:
                        pass
                    time.sleep(1)
            window.events.loaded += lambda: threading.Thread(target=verify_planner_window, daemon=True).start()
        try:
            webview.start(gui='edgechromium', private_mode=False, storage_path=str(ROOT / 'bridge-settings/webview'))
        except Exception as error:
            browser_window(service, ['The embedded window could not initialize: '+str(error)])
    finally:
        service.stop()


if __name__ == '__main__':
    if len(sys.argv)==3 and sys.argv[1]=='--apply-update':
        apply_update(sys.argv[2])
    else:
        main()
