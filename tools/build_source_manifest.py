"""Fingerprint the runtime source/assets embedded by the Windows build."""
import hashlib,json
from pathlib import Path
root=Path(__file__).resolve().parents[1]
runtime=['bridge.py','capture.py','desktop_app.py','startup_guard.py','version.py','updater.py','trade_routes.py','empire_report.py','connection_tools.py','guid_map.json','save_catalogue.json']
files=[root/p for p in runtime]+list((root/'save_reader').rglob('*.py'))+list((root/'android-probe/app/src/main/assets/dashboard').rglob('*'))
records={p.relative_to(root).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in files if p.is_file() and '__pycache__' not in p.parts}
out=root/'build/source-manifest.json';out.parent.mkdir(exist_ok=True);out.write_text(json.dumps({'schema':1,'files':records},indent=2),encoding='utf-8')
print('Runtime source manifest:',len(records),'files')
