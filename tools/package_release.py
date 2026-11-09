"""Verify matching EXE/APK/source and stage an offline review package. Never uploads."""
import argparse,hashlib,json,re,shutil,subprocess,sys,zipfile
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from release_manifest import ROOT,DASH,APP_VERSION,ANDROID_PACKAGE,ANDROID_CERT_SHA256,source_files,permitted,contract

def digest(path):return hashlib.sha256(path.read_bytes()).hexdigest()

def verify_exe(exe):
    from PyInstaller.archive.readers import CArchiveReader
    archive=CArchiveReader(str(exe))
    name=next(n for n in archive.toc if n.replace('\\','/')=='source-manifest.json')
    manifest=json.loads(archive.extract(name))
    for name,expected in manifest['files'].items():
        if digest(ROOT/name)!=expected:raise ValueError('Source changed after EXE build: '+name)
    return manifest

def verify_apk(apk,sdk):
    tools=sorted((sdk/'build-tools').iterdir(),reverse=True)
    signer=next(p/'apksigner.bat' for p in tools if (p/'apksigner.bat').exists())
    aapt=signer.parent/'aapt.exe'
    cert=subprocess.check_output([str(signer),'verify','--verbose','--print-certs',str(apk)],text=True,stderr=subprocess.STDOUT)
    fingerprints=re.findall(r'certificate SHA-256 digest: ([a-f0-9]+)',cert)
    if fingerprints!=[ANDROID_CERT_SHA256]:raise ValueError('APK is not signed by the public release certificate')
    badging=subprocess.check_output([str(aapt),'dump','badging',str(apk)],text=True,encoding='utf-8')
    if f"name='{ANDROID_PACKAGE}'" not in badging or f"versionName='{APP_VERSION}'" not in badging or 'application-debuggable' in badging:raise ValueError('Incorrect APK identity/version/debuggable state')
    with zipfile.ZipFile(apk) as archive:
        for p in (ROOT/DASH).rglob('*'):
            if p.is_file() and archive.read('assets/dashboard/'+p.relative_to(ROOT/DASH).as_posix())!=p.read_bytes():raise ValueError('APK/source asset mismatch: '+p.name)
    return {'certificate_sha256':fingerprints[0],'package':ANDROID_PACKAGE,'version_code':int(re.search(r"versionCode='(\d+)'",badging)[1]),'release':True}

def zip_files(path,files):
    names=set()
    with zipfile.ZipFile(path,'w',zipfile.ZIP_DEFLATED) as archive:
        for source,name in files:
            if name in names:raise ValueError('Duplicate source package entry: '+name)
            if not permitted(Path(name)):raise ValueError('Forbidden package path: '+name)
            names.add(name);archive.write(source,name)
    return len(names)

def main():
    p=argparse.ArgumentParser();p.add_argument('--sdk',type=Path,required=True);p.add_argument('--out',type=Path);p.add_argument('--source-only',action='store_true');p.add_argument('--published',action='store_true',help='Metadata for an explicitly approved public release; does not upload');a=p.parse_args()
    out=(a.out or ROOT.parent/f'local-release-{APP_VERSION}').resolve();out.mkdir(parents=True,exist_ok=True)
    files=source_files();manifest=contract();manifest['published']=a.published
    if not a.source_only:
        exe=ROOT/'releases'/f'Anno117Companion-{APP_VERSION}.exe';apk=ROOT/'android-probe/app/build/outputs/apk/release/app-release.apk'
        source_manifest=verify_exe(exe);manifest['android']=verify_apk(apk,a.sdk)
        shutil.copy2(exe,out/'Anno117Companion.exe');shutil.copy2(apk,out/f'Anno-Companion-{APP_VERSION}.apk')
        docs=[(ROOT/n,n) for n in ['START_HERE.txt','LICENSE','PRIVACY.md','THIRD_PARTY_NOTICES.md','ASSET_RIGHTS.md','CHANGELOG_WINDOWS.md']]
        zip_files(out/f'Anno117Companion-{APP_VERSION}-Windows-x64.zip',[(exe,'Anno117Companion.exe')]+docs)
        manifest['runtime_source_files']=len(source_manifest['files'])
    manifest['source_files']=zip_files(out/f'Anno117Companion-{APP_VERSION}-Source.zip',[(p,p.relative_to(ROOT).as_posix()) for p in files])
    records=[{'file':p.name,'bytes':p.stat().st_size,'sha256':digest(p)} for p in sorted(out.iterdir()) if p.suffix in {'.zip','.exe','.apk'}]
    manifest['files']=records
    (out/'release-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
    (out/'SHA256SUMS.txt').write_text(''.join(r['sha256']+'  '+r['file']+'\n' for r in records),encoding='utf-8')
    print(json.dumps(manifest,indent=2))

if __name__=='__main__':main()
