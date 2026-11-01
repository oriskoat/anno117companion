import sys
import types
import unittest
from unittest.mock import patch, MagicMock
import startup_guard


class RegistryKey:
    def __init__(self, path): self.path = path
    def __enter__(self): return self
    def __exit__(self, *args): pass


def registry(netfx=528040, webview='120.0.0.0'):
    def value(key, name):
        if name == 'Release': return netfx, 4
        if webview is None: raise FileNotFoundError()
        return webview, 1
    return types.SimpleNamespace(KEY_READ=1, KEY_WOW64_64KEY=2, KEY_WOW64_32KEY=4,
        HKEY_LOCAL_MACHINE=1, HKEY_CURRENT_USER=2,
        OpenKey=lambda hive,path,*args:RegistryKey(path), QueryValueEx=value)


class StartupChecks(unittest.TestCase):
    def status(self, reg):
        with patch.object(startup_guard.platform, 'system', return_value='Windows'), patch.object(sys, 'platform', 'win32'), patch.object(sys, 'getwindowsversion', return_value=types.SimpleNamespace(major=10), create=True), patch.object(startup_guard.platform, 'machine', return_value='AMD64'), patch.dict(sys.modules, {'winreg': reg}):
            return startup_guard.runtime_status()

    def test_framework_missing_is_actionable(self):
        status = self.status(registry(netfx=0))
        self.assertTrue(any('.NET' in message for message in status['issues']))

    def test_runtime_missing_and_outdated(self):
        for version in (None, '0.0.0.0', '86.0.622.0'):
            with self.subTest(version=version):
                self.assertTrue(any('WebView2' in message for message in self.status(registry(webview=version))['issues']))

    def test_current_framework_and_runtime(self):
        self.assertEqual(self.status(registry())['issues'], [])

    def test_browser_mode_skips_webview_and_stops_service(self):
        import desktop_app
        service = MagicMock()
        with patch.object(sys, 'argv', ['Companion', '--browser']), patch.object(desktop_app, 'BridgeService', return_value=service), patch.object(startup_guard, 'runtime_status', return_value={'issues': []}), patch.object(startup_guard, 'browser_window') as browser, patch.dict(sys.modules, {'webview': None}):
            desktop_app.main()
        browser.assert_called_once_with(service, ())
        service.start.assert_called_once();service.stop.assert_called_once()

    def test_missing_runtime_falls_back_without_loading_webview(self):
        import desktop_app
        service = MagicMock();issues = ['WebView2 is missing']
        with patch.object(sys, 'argv', ['Companion']), patch.object(desktop_app, 'BridgeService', return_value=service), patch.object(startup_guard, 'runtime_status', return_value={'issues': issues}), patch.object(startup_guard, 'browser_window') as browser, patch.dict(sys.modules, {'webview': None}):
            desktop_app.main()
        browser.assert_called_once_with(service, issues)
        service.stop.assert_called_once()

    def test_failed_hostname_lookup_does_not_block_local_app(self):
        import desktop_app
        service = types.SimpleNamespace(host='0.0.0.0', port=11780)
        with patch.object(desktop_app.socket, 'getaddrinfo', side_effect=OSError('offline')), patch.object(desktop_app, 'Updater'):
            api = desktop_app.DesktopAPI(service)
        self.assertEqual(api.address, 'http://PC-IP:11780')


if __name__ == '__main__':
    unittest.main()
