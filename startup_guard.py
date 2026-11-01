"""Windows startup checks before loading the optional .NET/WebView desktop host."""
import ctypes
import json
import os
import platform
import sys
import traceback
from pathlib import Path

WEBVIEW_URL = 'https://developer.microsoft.com/en-us/microsoft-edge/webview2/'
DOTNET_URL = 'https://dotnet.microsoft.com/en-us/download/dotnet-framework/net48'
MIN_WEBVIEW_MAJOR = 109


def runtime_status():
    result = {'system': platform.system(), 'machine': platform.machine(),
              'process_bits': ctypes.sizeof(ctypes.c_void_p)*8,
              'netfx_release': 0, 'webview_version': None, 'issues': []}
    if sys.platform != 'win32':
        result['issues'].append('This executable requires 64-bit Windows 10 or Windows 11.')
        return result
    import winreg
    if sys.getwindowsversion().major < 10:
        result['issues'].append('Use Windows 10 (22H2) or Windows 11. Older Windows versions are not supported.')
    if result['machine'].lower() not in ('amd64', 'x86_64'):
        result['issues'].append('This build targets x64 PCs. ARM64 emulation is not validated.')
    for view in (winreg.KEY_WOW64_64KEY, winreg.KEY_WOW64_32KEY):
        try:
            with winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, r'SOFTWARE\Microsoft\NET Framework Setup\NDP\v4\Full', 0, winreg.KEY_READ | view) as key:
                result['netfx_release'] = max(result['netfx_release'], int(winreg.QueryValueEx(key, 'Release')[0]))
        except OSError:
            pass
    if result['netfx_release'] < 528040:
        result['issues'].append('The embedded app requires .NET Framework 4.8 or newer. Browser mode does not.')
    # Match Evergreen Runtime, not the separately installed Edge browser or Insider channels.
    for hive in (winreg.HKEY_CURRENT_USER, winreg.HKEY_LOCAL_MACHINE):
        for view in (winreg.KEY_WOW64_32KEY, winreg.KEY_WOW64_64KEY):
            try:
                with winreg.OpenKey(hive, r'SOFTWARE\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}', 0, winreg.KEY_READ | view) as key:
                    value = str(winreg.QueryValueEx(key, 'pv')[0])
                    if int(value.split('.')[0]) >= MIN_WEBVIEW_MAJOR:
                        result['webview_version'] = value
            except (OSError, ValueError):
                pass
    if result['webview_version'] is None:
        result['issues'].append('Microsoft Edge WebView2 Runtime (109 or newer) is missing or outdated. Browser mode does not require it.')
    return result


def report_failure(error):
    # A --windowed EXE has no console; preserve a useful traceback and show its location.
    target = Path(os.environ.get('LOCALAPPDATA', Path.home())) / 'Anno117Companion' / 'startup-error.log'
    try:
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(''.join(traceback.format_exception(type(error), error, error.__traceback__)), encoding='utf-8')
        message = f'Anno Companion could not start.\n\n{error}\n\nDetails saved to:\n{target}'
    except OSError:
        message = f'Anno Companion could not start:\n\n{error}'
    if sys.platform == 'win32':
        ctypes.windll.user32.MessageBoxW(None, message, 'Anno 117 Companion — startup', 0x10)


def browser_window(service, issues=()):
    """Bundled Tk server controller: no WebView2/.NET, same bridge and pairing."""
    import tkinter as tk
    import webbrowser
    from tkinter import messagebox
    root = tk.Tk()
    root.title('Anno 117 Companion — browser mode')
    root.geometry('720x620');root.minsize(580, 480)
    root.configure(bg='#f5f1e9')
    try:
        from bridge import RESOURCE
        root.iconbitmap(str(RESOURCE/'android-probe/app/src/main/assets/dashboard/app-icon.ico'))
    except tk.TclError:
        pass
    frame = tk.Frame(root, bg='#f5f1e9', padx=28, pady=25);frame.pack(fill='both', expand=True)
    tk.Label(frame, text='ANNO 117 · COMPANION', font=('Georgia', 22), fg='#183b60', bg='#f5f1e9').pack(anchor='w')
    tk.Label(frame, text='Local server · browser mode', font=('Segoe UI', 12), bg='#f5f1e9', fg='#183b60').pack(anchor='w', pady=(8, 16))
    if issues:
        tk.Label(frame, text='The embedded window is unavailable. Your browser can run the same tool.\n\n'+'\n\n'.join(issues), wraplength=620, justify='left', bg='#f5f1e9', fg='#644a33').pack(anchor='w', pady=(0, 15))
    from desktop_app import DesktopAPI
    api = DesktopAPI(service)
    tk.Label(frame, text='Pair another device using this address and six-digit code:', bg='#f5f1e9', fg='#183b60').pack(anchor='w', pady=(8, 4))
    tk.Label(frame, text=api.address, bg='#f5f1e9', fg='#183b60', font=('Segoe UI', 12)).pack(anchor='w')
    code = tk.StringVar()
    tk.Label(frame, textvariable=code, bg='#f5f1e9', fg='#183b60', font=('Consolas', 26)).pack(anchor='w', pady=(5, 12))
    tk.Button(frame, text='Open browser', command=api.open_browser, bg='#183b60', fg='white', padx=18, pady=10).pack(anchor='w')
    if issues:
        tk.Button(frame, text='Microsoft WebView2 download', command=lambda:webbrowser.open(WEBVIEW_URL)).pack(anchor='w', pady=(15, 5))
        if any('.NET' in issue for issue in issues):
            tk.Button(frame, text='Microsoft .NET Framework download', command=lambda:webbrowser.open(DOTNET_URL)).pack(anchor='w', pady=5)
    tk.Label(frame, text='Keep this window open for Live data and paired devices.\nAfter installing a missing runtime, restart the EXE for the embedded view.', justify='left', wraplength=610, bg='#f5f1e9', fg='#637182').pack(anchor='w', pady=15)
    def tick():
        code.set(service.pairing.current_code());root.after(1000, tick)
    tick()
    root.mainloop()


def self_test(destination):
    """Explicit offline diagnostics; no game connection, pairing reads or installation."""
    import io
    results = {'runtime': runtime_status(), 'checks': {}}
    def check(name, fn):
        try:
            fn();results['checks'][name] = {'ok': True}
        except Exception as exc:
            results['checks'][name] = {'ok': False, 'error': str(exc)}
    def qr():
        import qrcode
        qrcode.make('Anno Companion offline dependency check').save(io.BytesIO(), format='PNG')
    def images():
        from PIL import Image
        from bridge import WEBROOT
        for path in [WEBROOT/'app-icon-192.png', WEBROOT/'icons/2085.webp']:
            with Image.open(path) as image:
                image.load()
    def pdf():
        from empire_report import build_empire_pdf
        content = build_empire_pdf({'snapshot': {'areas': [], 'supply_suggestions': [], 'session_name': 'Compatibility check'}, 'isDemo': True, 'language': 'en'})
        assert content.startswith(b'%PDF-')
    def tk():
        import tkinter
        assert tkinter.Tcl().eval('info patchlevel')
    def dotnet():
        os.environ['PYTHONNET_RUNTIME'] = 'netfx'
        import clr
        clr.AddReference('System.Windows.Forms')
        from System.Windows.Forms import Application
        assert Application is not None
    def loader():
        import webview
        path = Path(webview.__file__).parent/'lib/runtimes/win-x64/native/WebView2Loader.dll'
        if not path.exists():
            path = next(Path(webview.__file__).parent.rglob('win-x64/WebView2Loader.dll'))
        lib = ctypes.WinDLL(str(path));fn = lib.GetAvailableCoreWebView2BrowserVersionString
        fn.argtypes = [ctypes.c_wchar_p, ctypes.POINTER(ctypes.c_void_p)];fn.restype = ctypes.c_long
        value = ctypes.c_void_p();hr = fn(None, ctypes.byref(value))
        if hr != 0:raise RuntimeError(f'WebView2 runtime load failed: HRESULT {hr:#x}')
        try:
            version = ctypes.wstring_at(value)
            assert int(version.split('.')[0]) >= MIN_WEBVIEW_MAJOR
            results['webview_loader_version'] = version
        finally:
            ctypes.windll.ole32.CoTaskMemFree.argtypes = [ctypes.c_void_p]
            ctypes.windll.ole32.CoTaskMemFree(value)
    for name, fn in [('qr_png', qr), ('bundled_png_webp', images), ('pdf_fonts', pdf), ('tk_browser_controller', tk), ('dotnet_winforms', dotnet), ('webview2_loader', loader)]:
        check(name, fn)
    results['ok'] = all(c['ok'] for c in results['checks'].values())
    Path(destination).write_text(json.dumps(results, indent=2), encoding='utf-8')
    return 0 if results['ok'] else 1


def run():
    try:
        if len(sys.argv) == 3 and sys.argv[1] == '--self-test':
            return self_test(sys.argv[2])
        if len(sys.argv) == 3 and sys.argv[1] == '--apply-update':
            from updater import apply_update
            apply_update(sys.argv[2]);return 0
        # Do not inherit an unrelated machine-wide CoreCLR selection.
        os.environ['PYTHONNET_RUNTIME'] = 'netfx'
        from desktop_app import main
        main();return 0
    except Exception as exc:
        report_failure(exc);return 1


if __name__ == '__main__':
    raise SystemExit(run())
