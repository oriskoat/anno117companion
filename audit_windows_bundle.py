"""Inspect a frozen EXE for required payloads and undeclared native DLL imports.

Build-time tool; needs PyInstaller/pefile only on the build machine.
"""
import argparse
import hashlib
import json
from pathlib import Path
import pefile
from PyInstaller.archive.readers import CArchiveReader

WINDOWS_DLLS = set('advapi32.dll bcrypt.dll bcryptprimitives.dll comctl32.dll comdlg32.dll crypt32.dll gdi32.dll imm32.dll iphlpapi.dll kernel32.dll mscoree.dll netapi32.dll ntdll.dll ole32.dll oleaut32.dll psapi.dll rpcrt4.dll shell32.dll user32.dll userenv.dll version.dll ws2_32.dll'.split())
REQUIRED = ['python311.dll', 'vcruntime140.dll', '_tkinter.pyd', 'tcl86t.dll', 'tk86t.dll',
            '_tcl_data/init.tcl', '_tk_data/tk.tcl', 'pythonnet/runtime/python.runtime.dll',
            'webview/lib/microsoft.web.webview2.core.dll', 'webview/lib/microsoft.web.webview2.winforms.dll',
            'webview/lib/runtimes/win-x64/native/webview2loader.dll', 'reportlab/fonts/vera.ttf',
            'reportlab/fonts/verabd.ttf', 'guid_map.json', 'android-probe/app/src/main/assets/dashboard/index.html']


def audit(path):
    reader = CArchiveReader(str(path))
    files = {name.replace('\\', '/').lower(): name for name in reader.toc}
    basenames = {name.rsplit('/', 1)[-1] for name in files}
    missing = [name for name in REQUIRED if name not in files]
    external = {};binaries = 0
    for normalized, name in files.items():
        if not normalized.endswith(('.dll', '.pyd')):
            continue
        pe = pefile.PE(data=reader.extract(name));binaries += 1
        for field in ('DIRECTORY_ENTRY_IMPORT', 'DIRECTORY_ENTRY_DELAY_IMPORT'):
            for entry in getattr(pe, field, []):
                dll = entry.dll.decode('ascii').lower()
                if dll not in basenames:
                    external.setdefault(dll, set()).add(normalized)
        pe.close()
    unexpected = sorted(name for name in external if name not in WINDOWS_DLLS and not name.startswith(('api-ms-', 'ext-ms-')))
    return {'file': path.name, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
            'binary_count': binaries, 'missing_payloads': missing, 'unexpected_external_dlls': unexpected,
            'declared_external_imports': {name: sorted(sources) for name, sources in sorted(external.items())},
            'not_bundled': ['Microsoft .NET Framework 4.8+ (embedded view only)', 'Microsoft Edge WebView2 Runtime 109+ (embedded view only)'],
            'limits': 'Static native imports do not prove all dynamic loading or operation on a clean Windows installation.',
            'ok': not missing and not unexpected}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('exe', type=Path);parser.add_argument('output', type=Path)
    args = parser.parse_args();result = audit(args.exe)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2), encoding='utf-8')
    print(json.dumps({key: result[key] for key in ('file', 'binary_count', 'missing_payloads', 'unexpected_external_dlls', 'ok')}))
    raise SystemExit(0 if result['ok'] else 1)
