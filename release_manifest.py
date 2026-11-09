"""Single release contract. No credentials, local captures or settings are distributable."""
from pathlib import Path
from version import APP_VERSION, BUILD_CHANNEL, REPOSITORY

ROOT=Path(__file__).resolve().parent
DASH=Path('android-probe/app/src/main/assets/dashboard')
ANDROID_PACKAGE='hu.anno117.companion'
ANDROID_CERT_SHA256='d8ebc84cc0a6e419cccc0908cf56076c9e56cf318f2156a25c928beb19f34fd6'
FORBIDDEN={'bridge-settings','captures','game-data','.git','.gradle','__pycache__','node_modules','private','build','releases'}
PRIVATE_NAMES={'local.properties','PROJECT_NOTES.md','release-signing.json','devices.json','pairing.json'}

def permitted(path):
    return not (set(path.parts)&FORBIDDEN or path.name in PRIVATE_NAMES or path.suffix.lower() in {'.jks','.keystore','.a8s','.a7s','.pyc','.log'} or path.name.startswith('.env'))

def source_files(root=ROOT):
    result=[]
    for p in root.iterdir():
        if p.is_file() and (p.suffix in {'.py','.cjs','.ps1','.md'} or p.name in {'LICENSE','START_HERE.txt','.gitignore','.gitattributes','package.json','package-lock.json','requirements-build.txt','guid_map.json','save_catalogue.json'}):
            result.append(p)
    for folder in ['save_reader','android-probe','tools','localization','third-party','docs','.posters','.ideas','.github']:
        base=root/folder
        if not base.exists():continue
        # Prune forbidden trees before traversing (WebView/Gradle caches can be huge).
        import os
        for directory,dirs,files in os.walk(base):
            dirs[:]=[d for d in dirs if d not in FORBIDDEN]
            result.extend(Path(directory)/name for name in files)
    return sorted({p for p in result if permitted(p.relative_to(root))})

def contract():
    return {'version':APP_VERSION,'channel':BUILD_CHANNEL,'repository':REPOSITORY,'android_package':ANDROID_PACKAGE,'android_cert_sha256':ANDROID_CERT_SHA256,'windows_signing':'unsigned (same as previous public release)','published':False}
