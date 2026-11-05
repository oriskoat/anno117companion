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
from updater import Updater, apply_update
from datetime import datetime
from empire_report import build_empire_pdf
from pathlib import Path
import qrcode
from bridge import BridgeService, ROOT


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
        return {'running': bool(self.service.server), 'code': code, 'address': self.address,
                'qr': 'data:image/png;base64,' + base64.b64encode(buffer.getvalue()).decode('ascii')}

    def open_browser(self):
        sample = not self.service.bridge or not self.service.bridge.snapshot()['areas']
        webbrowser.open('http://127.0.0.1:' + str(self.service.port) + '/#pair=' + self.service.token + ('&sample=1' if sample else ''))

    def open_donation(self):
        webbrowser.open('https://revolut.me/vafvyop?currency=EUR&amount=500')

    def check_update(self,force=False):
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
    parser=argparse.ArgumentParser(description='Anno 117 Companion local server and dashboard')
    parser.add_argument('--host',default='0.0.0.0')
    parser.add_argument('--port',type=int,default=11780)
    parser.add_argument('--browser',action='store_true',help='Run the local server with the bundled browser-mode controller (no .NET/WebView2 required).')
    parser.add_argument('--save-insights-preview', action='store_true', help='Enable the local Save Insights development preview. No billing or purchase is required for this private preview.')
    parser.add_argument('--no-pipe', action='store_true', help='Do not connect another pipe reader; useful for isolated save-preview testing.')
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
        address = 'http://127.0.0.1:' + str(service.port) + '/#pair=' + service.token + '&desktop=1' + ('&insights=1' if args.save_insights_preview else '&sample=1')
        title='Anno 117 Companion'+(' — Save Insights Preview' if args.save_insights_preview else '')+(f' ({args.port})' if args.port!=11780 else '')
        webview.create_window(title, address, js_api=api, width=1360, height=960, min_size=(640, 640), maximized=True)
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
