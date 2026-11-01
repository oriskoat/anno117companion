"""Create a reviewed, synthetic-demo source candidate and matching release assets.

No upload. Signing secrets are read only by Gradle, outside this source tree.
"""
import argparse
import hashlib
import json
import re
import shutil
import subprocess
import zipfile
from pathlib import Path
from bridge import supply_suggestions
from prepare_release import collect_licenses
from prepare_full_release import public_metadata
from version import APP_VERSION

ROOT=Path(__file__).resolve().parent
DASH=Path('android-probe/app/src/main/assets/dashboard')
FORBIDDEN={'bridge-settings','captures','game-data','node_modules','.gradle','.git','__pycache__','private','exports','tmp','local.properties'}


def synthetic_demo():
    knowledge=json.loads((ROOT/DASH/'knowledge.js').read_text(encoding='utf8').split('=',1)[1][:-1])
    goods={o['product_name']:o['product_guid'] for f in knowledge['factories'] for o in f['outputs']}
    areas=[]
    specifications=[('Example Aurelia',3245,[('Olives',9,2),('Murex Snails',9,2),('Coal',10,4),('Leather',5,1),('Bread',6,3),('Clay',2,5)]),
        ('Example Portus',3245,[('Olives',0,4),('Murex Snails',1,6),('Coal',2,6),('Leather',0,3),('Timber',8,3),('Bread',2,5)]),
        ('Example Fenbrook',6627,[('Olives',0,3),('Coal',8,3),('Cockles',5,2),('Eels',1,3),('Tunics',2,4),('Timber',3,6)]),
        ('Example Reedhaven',6627,[('Olives',0,1),('Coal',0,3),('Cockles',1,3),('Eels',5,1),('Tunics',6,2),('Timber',8,3)])]
    for i,(name,region,values) in enumerate(specifications,1):
        entries=[]
        for good,production,consumption in values:
            entries.append({'ProductGuid':goods[good],'ProductNameEnglish':good,'ProductGeneration':production,'ProductConsumption':consumption,'ProductDelta':production-consumption,'PerfectProductGeneration':production,'PerfectProductConsumption':consumption,'AmountOfBuildings':0,'TotalMaintenance':0,'TotalIncome':0,'TotalProfit':0,'AverageProductivity':0,'SummedProductivity':0,'BuildingGUIDtoAmount':{},'WorkforceGUIDtoAmount':{},'BuildingsNamed':[],'WorkforcesNamed':[]})
        areas.append({'session_id':1 if region==3245 else 2,'session_guid':region,'island_id':i,'area_index':1,'area_name':name,'received_at':'2026-11-01T10:00:00Z','game_timestamp':0,'sample_recorded':True,'stale':True,'entries':entries})
    return {'bridge_version':APP_VERSION,'synthetic':True,'mode':'demo','pipe_state':'recorded_sample','protocol_version':2,'session_name':'Example Empire','messages':0,'recorded_at':'2026-11-01T10:00:00Z','last_message_at':'2026-11-01T10:00:00Z','areas':areas,'supply_suggestions':supply_suggestions(areas)}


def stage(version):
    if version!=APP_VERSION:raise ValueError('Source version mismatch')
    destination=ROOT/'build'/f'public-{version}'/'source'
    if destination.exists():raise ValueError('Candidate already exists; use explicit sync after reviewing it')
    destination.mkdir(parents=True)
    sync(destination)
    return destination


def sync(destination):
    destination=destination.resolve()
    if destination!=ROOT/'build'/f'public-{APP_VERSION}'/'source':raise ValueError('Unexpected candidate path')
    destination.mkdir(parents=True,exist_ok=True)
    names=['bridge.py','capture.py','trade_routes.py','desktop_app.py','startup_guard.py','updater.py','empire_report.py','version.py','build_release.ps1','audit_windows_bundle.py','requirements-build.txt','prepare_public_release.py','prepare_release.py','prepare_full_release.py','import_content_pack.py','LICENSE','PRIVACY.md','ASSET_RIGHTS.md','THIRD_PARTY_NOTICES.md','CHANGELOG.md','CHANGELOG_WINDOWS.md','CHANGELOG_ANDROID.md','test_bridge.py','test_trade_routes.py','test_updater.py','test_public.py','test_startup.py','test_report.py','test_release.cjs','test_procurement.cjs','test_needs.cjs']
    for name in names:shutil.copy2(ROOT/name,destination/name)
    legacy_tests=(destination/'android-probe/tests').resolve()
    if legacy_tests.exists():
        if not legacy_tests.is_relative_to(destination):raise ValueError('Unsafe staging cleanup')
        shutil.rmtree(legacy_tests)
    shutil.copytree(ROOT/DASH,destination/DASH,dirs_exist_ok=True)
    for path in (ROOT/'android-probe').rglob('*'):
        relative=path.relative_to(ROOT/'android-probe')
        if not path.is_file() or set(relative.parts)&(FORBIDDEN|{'build','assets','tests'}):continue
        if path.name in {'MainActivity.java','BridgeActivity.java','README.md'}:continue
        if path.suffix not in {'.java','.xml','.gradle','.properties','.jar','.bat','.png'} and path.name!='gradlew':continue
        target=destination/'android-probe'/relative;target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(path,target)
    shutil.copytree(ROOT/'localization',destination/'localization',dirs_exist_ok=True)
    (destination/'localization/game-text-provenance.json').unlink(missing_ok=True)
    for name,prefix in [('guid_map.json',''),(str(DASH/'knowledge.js'),'window.annoKnowledge='),(str(DASH/'needs-data.js'),'window.annoNeeds=')]:
        original=ROOT/name;data=original.read_text(encoding='utf8');value=json.loads(data.split('=',1)[1][:-1] if prefix else data)
        (destination/name).write_text(prefix+json.dumps(public_metadata(value),ensure_ascii=False)+(';' if prefix else ''),encoding='utf8')
    (destination/DASH/'demo.json').write_text(json.dumps(synthetic_demo(),ensure_ascii=False),encoding='utf8')
    for path in [destination/DASH/'app.js',destination/'android-probe/app/src/main/java/hu/anno117/pipeprobe/DashboardActivity.java']:
        text=path.read_text(encoding='utf8').replace('http://192.168.0.103:11780','http://PC-IP:11780').replace('You are exploring a real saved session: 7 islands, 103 products and 297 product rows. This is not live data.','You are exploring synthetic example data. This is not a live game connection.')
        path.write_text(text,encoding='utf8')
    (destination/'.github/workflows').mkdir(parents=True,exist_ok=True)
    (destination/'.github/FUNDING.yml').write_text((ROOT/'.github/FUNDING.yml').read_text(encoding='utf8'),encoding='utf8')
    (destination/'.github/workflows/checks.yml').write_text('''name: Candidate checks
on: [push, pull_request]
jobs:
  checks:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - run: pip install -r requirements-build.txt
      - run: python -m unittest test_bridge test_trade_routes test_updater test_public test_startup test_report
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: npm
      - run: npm ci
      - run: npm test
''',encoding='utf8')
    (destination/'package.json').write_text(json.dumps({'name':'anno117-companion-checks','version':APP_VERSION,'private':True,'scripts':{'test':'node test_release.cjs && node test_procurement.cjs && node test_needs.cjs'},'devDependencies':{'jsdom':'^30.1.3'}},indent=2),encoding='utf8')
    lock=json.loads((ROOT/'tools/ui-check/package-lock.json').read_text(encoding='utf8'));lock['name']='anno117-companion-checks';lock['version']=APP_VERSION;lock['packages']['']={'name':lock['name'],'version':APP_VERSION,'devDependencies':{'jsdom':'^30.1.3'}}
    lock['packages'].pop('node_modules/playwright-core',None)
    for name,entry in lock['packages'].items():
        if name:entry['dev']=True
    (destination/'package-lock.json').write_text(json.dumps(lock,indent=2),encoding='utf8')
    # A small test with modern module resolution, independent of private demo counts.
    text=(destination/'test_needs.cjs').read_text(encoding='utf8').replace("require('./tools/ui-check/node_modules/jsdom')","require('jsdom')")
    (destination/'test_needs.cjs').write_text(text,encoding='utf8')
    (destination/'.gitignore').write_text('build/\nreleases/\nbridge-settings/\nexports/\nnode_modules/\n__pycache__/\n*.pyc\n*.spec\n*.log\nandroid-probe/.gradle/\nandroid-probe/local.properties\nandroid-probe/app/build/\n*.jks\n*.keystore\n.env\nprivate/\n',encoding='utf8')
    docs=destination/'docs';docs.mkdir(exist_ok=True)
    for name in ['WINDOWS_COMPATIBILITY.md','windows-compatibility-results.json']:
        shutil.copy2(ROOT/'docs'/name,docs/name)
    # The history is kept as public changelogs; internal reconstruction notes are not shipped.
    (destination/'CHANGELOG.md').write_text('# Changelog\n\n[Windows EXE history](CHANGELOG_WINDOWS.md) · [Android APK history](CHANGELOG_ANDROID.md)\n\nCurrent candidate: '+APP_VERSION+'. See README for setup and build instructions.\n',encoding='utf8')
    collect_licenses(destination/'third-party')
    for source in (ROOT/'launch-kit'/APP_VERSION).glob('*'):
        if source.is_file() and source.name=='README_PUBLIC.md':shutil.copy2(source,destination/'README.md')
        elif source.is_file():shutil.copy2(source,docs/source.name)
        elif source.is_dir() and source.name=='screenshots':shutil.copytree(source,docs/'screenshots',dirs_exist_ok=True)
    (destination/'START_HERE.txt').write_text('Windows: run Anno117Companion.exe from a writable folder. No Python installation needed. Android: install the release APK. Live data requires the Windows app, /pipe and the game publishing statistics. Demo islands are invented examples. Read README and third-party notices.\n',encoding='utf8')
    print(destination)


def audit_source(source):
    for p in source.rglob('*'):
        if not p.is_file():continue
        relative=p.relative_to(source)
        if set(relative.parts)&(FORBIDDEN|{'build','releases','third-party'}):continue
        if p.suffix.lower() in {'.jks','.keystore','.rda'}:raise ValueError('Forbidden private/raw artifact: '+str(relative))
        if p.suffix in {'.js','.json','.java','.xml','.md','.py','.txt','.gradle','.yml'}:
            text=p.read_text(encoding='utf8',errors='replace')
            if any(value in text for value in ['192.168.0.103','RZCT1089J7X','C:\\Users\\Administrator','D:\\Codex','Marcus_1']):
                # Tests may assert private fixtures are absent; they must not carry the actual recording.
                if p.name.startswith(('test_','prepare_')):continue
                raise ValueError('Private/developer marker: '+str(relative))
    sample=json.loads((source/DASH/'demo.json').read_text(encoding='utf8'))
    if not sample.get('synthetic') or not all(a['area_name'].startswith('Example') for a in sample['areas']):raise ValueError('Non-public demo')


def finalize(version):
    source=ROOT/'build'/f'public-{version}'/'source';audit_source(source)
    output=ROOT/'releases'/version;output.mkdir(parents=True,exist_ok=True)
    exe=source/'releases'/f'Anno117Companion-{version}.exe';apk=source/'android-probe/app/build/outputs/apk/release/app-release.apk'
    if not exe.exists() or not apk.exists():raise ValueError('Build both staged artifacts first')
    sdk=Path(__import__('os').environ['ANDROID_HOME']);aapt=sorted((sdk/'build-tools').glob('*/aapt.exe'))[-1]
    info=subprocess.check_output([str(aapt),'dump','badging',str(apk)],text=True,encoding='utf8',errors='replace')
    if f"versionName='{version}'" not in info or "name='hu.anno117.companion'" not in info or 'application-debuggable' in info:raise ValueError('APK identity/version/debug mismatch')
    signer=aapt.parent/'apksigner.bat'
    certificate=subprocess.check_output([str(signer),'verify','--print-certs',str(apk)],text=True,encoding='utf8',errors='replace')
    expected='d8ebc84cc0a6e419cccc0908cf56076c9e56cf318f2156a25c928beb19f34fd6'
    if expected not in certificate.lower():raise ValueError('Unexpected APK release certificate')
    with zipfile.ZipFile(apk) as archive:
        embedded=json.loads(archive.read('assets/dashboard/demo.json'))
        if not embedded.get('synthetic'):raise ValueError('APK contains private demo')
    from PyInstaller.archive.readers import CArchiveReader
    archive=CArchiveReader(str(exe));name=next(n for n in archive.toc if n.replace('\\','/').endswith('/dashboard/demo.json'))
    if not json.loads(archive.extract(name)).get('synthetic'):raise ValueError('EXE contains private demo')
    embedded_names={n.replace('\\','/'):n for n in archive.toc}
    with zipfile.ZipFile(apk) as android:
        for path in (source/DASH).rglob('*'):
            if not path.is_file():continue
            relative=path.relative_to(source/DASH).as_posix();content=path.read_bytes()
            windows_name='android-probe/app/src/main/assets/dashboard/'+relative
            if archive.extract(embedded_names[windows_name])!=content:raise ValueError('Stale EXE dashboard: '+relative)
            if android.read('assets/dashboard/'+relative)!=content:raise ValueError('Stale APK dashboard: '+relative)
    shutil.copy2(exe,output/'Anno117Companion.exe');shutil.copy2(apk,output/f'Anno-Companion-{version}.apk')
    for suffix,items in [('source',None),('Windows-x64',['README.md','START_HERE.txt','LICENSE','THIRD_PARTY_NOTICES.md','PRIVACY.md','ASSET_RIGHTS.md','CHANGELOG_WINDOWS.md'])]:
        with zipfile.ZipFile(output/f'Anno117Companion-{version}-{suffix}.zip','w',zipfile.ZIP_DEFLATED) as bundle:
            if items is None:
                for p in sorted(source.rglob('*')):
                    relative=p.relative_to(source)
                    if p.is_file() and not set(relative.parts)&(FORBIDDEN|{'build','releases'}) and p.suffix not in {'.pyc','.spec'}:bundle.write(p,relative.as_posix())
            else:
                bundle.write(exe,'Anno117Companion.exe')
                for item in items:bundle.write(source/item,item)
                for p in (source/'third-party').rglob('*'):
                    if p.is_file():bundle.write(p,p.relative_to(source).as_posix())
                for p in (source/'docs').rglob('*'):
                    if p.is_file():bundle.write(p,p.relative_to(source).as_posix())
    sample_pdf=ROOT/'launch-kit'/version/'Example-Empire-Summary.pdf'
    if sample_pdf.exists():shutil.copy2(sample_pdf,output/sample_pdf.name)
    assets=[]
    for p in sorted(output.iterdir()):
        if p.suffix in {'.exe','.apk','.zip','.pdf'}:assets.append({'file':p.name,'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
    (output/'SHA256SUMS.txt').write_text(''.join(a['sha256']+'  '+a['file']+'\n' for a in assets),encoding='utf8')
    manifest={'version':version,'published':False,'android_package':'hu.anno117.companion','android_version_code':22,'windows_signing':'unsigned','android_signing':'dedicated release certificate; fingerprint in SIGNING_CERTIFICATE.txt','demo':'synthetic Example islands','assets':assets,'source':'Exact staged source used for both binaries; private settings/keys excluded'}
    (output/'release-manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf8')
    for name in ['RELEASE_NOTES.md','SIGNING_CERTIFICATE.txt','UPLOAD_GUIDE_HU.md','REDDIT_POST.md']:
        shutil.copy2(ROOT/'launch-kit'/version/name,output/name)
    shutil.copytree(ROOT/'launch-kit'/version/'screenshots',output/'screenshots',dirs_exist_ok=True)
    print(output)


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('action',choices=['stage','sync','audit','finalize']);args=parser.parse_args()
    source=ROOT/'build'/f'public-{APP_VERSION}'/'source'
    if args.action=='stage':stage(APP_VERSION)
    elif args.action=='sync':sync(source)
    elif args.action=='audit':audit_source(source);print('Source privacy audit passed')
    else:finalize(APP_VERSION)
