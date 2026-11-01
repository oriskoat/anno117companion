"""Stage/verify a complete matching-source release, excluding operator data. No upload."""
import argparse
import hashlib
import json
import re
import shutil
import zipfile
from pathlib import Path
from bridge import supply_suggestions
from prepare_release import collect_licenses, zip_folder
from version import APP_VERSION

ROOT=Path(__file__).resolve().parent
DASH=Path('android-probe/app/src/main/assets/dashboard')
DOCS=['README.md','LICENSE','PRIVACY.md','ASSET_RIGHTS.md','THIRD_PARTY_NOTICES.md','CHANGELOG.md','CHANGELOG_WINDOWS.md','CHANGELOG_ANDROID.md','docs/RELEASE_HISTORY_EVIDENCE.md','docs/CHANGELOG_LEGACY.md','docs/WINDOWS_COMPATIBILITY.md','docs/windows-compatibility-results.json']
CODE=['startup_guard.py','audit_windows_bundle.py','test_startup.py','test_more_fuel.cjs','test_widget_ui.cjs','prepare_needs.py','test_needs.cjs','trade_routes.py','test_trade_routes.py','prepare_full_release.py','prepare_release.py','version.py','updater.py','test_updater.py','test_report.py','empire_report.py','bridge.py','capture.py','desktop_app.py','build_release.ps1','requirements-build.txt','test_public.py','import_content_pack.py','test_release.cjs']
FORBIDDEN={'bridge-settings','captures','game-data','.gradle','local.properties','devices.json','pairing.json','__pycache__'}

def source_root(version):return ROOT/'build'/f'full-release-{version}'/'source'

def public_metadata(value):
    if isinstance(value,dict):return {k:public_metadata(v) for k,v in value.items()}
    if isinstance(value,list):return [public_metadata(v) for v in value]
    if isinstance(value,str) and re.match(r'^[A-Za-z]:[\\/]',value):return 'local-game-data/'+value.replace('\\','/').rsplit('/',1)[-1]
    return value

def synthetic_demo():
    names={2086:'Clay',2174:'Timber',3158:'Murex Snails',2062:'Example good'}
    areas=[]
    for i,(name,region,values) in enumerate([
        ('Example Harbour',3245,[(2086,2,5),(2174,6,3),(3158,2,6)]),
        ('Example Coast',3245,[(2086,8,1),(2174,0,4),(3158,9,0)]),
        ('Example Marsh',6627,[(2086,1,2),(2174,3,1)])],1):
        entries=[]
        for guid,production,consumption in values:
            entries.append({'ProductGuid':guid,'ProductNameEnglish':names[guid],
                'ProductGeneration':production,'ProductConsumption':consumption,
                'ProductDelta':production-consumption,'PerfectProductGeneration':production,
                'PerfectProductConsumption':consumption,'AmountOfBuildings':0,
                'TotalMaintenance':0,'TotalIncome':0,'TotalProfit':0,
                'AverageProductivity':0,'SummedProductivity':0,
                'BuildingGUIDtoAmount':{},'WorkforceGUIDtoAmount':{},'BuildingsNamed':[],'WorkforcesNamed':[]})
        areas.append({'session_id':1 if region==3245 else 2,'session_guid':region,'island_id':i,'area_index':1,
            'area_name':name,'game_timestamp':0,'received_at':'2026-10-31T00:00:00Z','sample_recorded':True,'stale':True,'entries':entries})
    return {'bridge_version':'0.19.1','synthetic':True,'mode':'demo','pipe_state':'recorded_sample',
        'session_name':'Synthetic demo','protocol_version':2,'messages':0,'recorded_at':'2026-10-31T00:00:00Z',
        'last_message_at':'2026-10-31T00:00:00Z','areas':areas,'supply_suggestions':supply_suggestions(areas)}

def stage(version):
    if version!=APP_VERSION:raise ValueError('Release version must match version.py')
    destination=source_root(version)
    if destination.exists():raise RuntimeError('Stage already exists; review before replacing it')
    destination.mkdir(parents=True)
    for name in DOCS+CODE:
        target=destination/name;target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(ROOT/name,target)
    shutil.copy2(ROOT/'guid_map.json',destination/'guid_map.json')
    shutil.copytree(ROOT/DASH,destination/DASH)
    for name in ['guid_map.json',str(DASH/'knowledge.js')]:
        path=destination/name;text=path.read_text(encoding='utf-8')
        data=json.loads(text.split('=',1)[1][:-1]) if path.suffix=='.js' else json.loads(text)
        path.write_text(('window.annoKnowledge=' if path.suffix=='.js' else '')+json.dumps(public_metadata(data),ensure_ascii=False)+(';' if path.suffix=='.js' else ''),encoding='utf-8')
    for path in (ROOT/'android-probe').rglob('*'):
        relative=path.relative_to(ROOT/'android-probe')
        if not path.is_file() or any(p in FORBIDDEN|{'build','assets'} for p in relative.parts):continue
        if path.name in {'MainActivity.java','BridgeActivity.java'}:continue
        if path.suffix not in {'.java','.xml','.gradle','.properties','.jar','.bat','.png'} and path.name!='gradlew':continue
        target=destination/'android-probe'/relative;target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(path,target)
    shutil.copytree(ROOT/'.github',destination/'.github')
    (destination/'localization').mkdir()
    for name in ['ui.tsv','copy-aliases.json']:shutil.copy2(ROOT/'localization'/name,destination/'localization'/name)
    (destination/'package.json').write_text(json.dumps({'private':True,'scripts':{'test':'node test_release.cjs'},'dependencies':{'jsdom':'^30.1.3'}},indent=2),encoding='utf-8')
    shutil.copy2(ROOT/'tools/ui-check/package-lock.json',destination/'package-lock.json')
    (destination/'.gitignore').write_text('__pycache__/\nexports/\nbridge-settings/\nbuild/\nreleases/\nnode_modules/\ntools/\nandroid-probe/.gradle/\nandroid-probe/app/build/\nandroid-probe/local.properties\n*.log\n*.spec\n',encoding='utf-8')
    (destination/DASH/'demo.json').write_text(json.dumps(synthetic_demo(),ensure_ascii=False),encoding='utf-8')
    # Defaults and old prose are operator-specific; release files are not.
    for path in [destination/DASH/'app.js',destination/'android-probe/app/src/main/java/hu/anno117/pipeprobe/DashboardActivity.java']:
        text=path.read_text(encoding='utf-8').replace('http://192.168.0.103:11780','http://PC-IP:11780')
        text=text.replace('You are exploring a real saved session: 7 islands, 103 products and 297 product rows. This is not live data.','This is example data, not a live game connection.')
        path.write_text(text,encoding='utf-8')
    collect_licenses(destination/'third-party')
    print(destination)

def finalize(version):
    source=source_root(version);output=ROOT/'releases'/version;output.mkdir(parents=True,exist_ok=True)
    if not (source/'releases'/f'Anno117Companion-{version}.exe').exists():raise RuntimeError('Build the staged source before finalizing')
    source_zip=output/f'Anno117Companion-{version}-source.zip'
    paths=[]
    for path in sorted(source.rglob('*')):
        relative=path.relative_to(source)
        if not path.is_file() or set(relative.parts)&(FORBIDDEN|{'build','releases','node_modules'}):continue
        if path.suffix=='.pyc':continue
        paths.append((path,relative.as_posix()))
    with zipfile.ZipFile(source_zip,'w',zipfile.ZIP_DEFLATED) as archive:
        for path,name in paths:archive.write(path,name)
    bundle=ROOT/'build'/f'full-release-{version}'/'complete';bundle.mkdir(exist_ok=True)
    for name in DOCS:
        target=bundle/name;target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(source/name,target)
    executable=source/'releases'/f'Anno117Companion-{version}.exe'
    shutil.copy2(executable,bundle/'Anno117Companion.exe')
    with zipfile.ZipFile(source_zip) as archive:archive.extractall(bundle/'source')
    shutil.copy2(executable,output/'Anno117Companion.exe')
    apk=source/'android-probe/app/build/outputs/apk/debug/app-debug.apk'
    if apk.exists():shutil.copy2(apk,output/f'Anno-Companion-{version}.apk')
    (bundle/'START_HERE.txt').write_text('Run Anno117Companion.exe. No Python installation or content download is needed. For live data launch Anno with /pipe. Demo uses invented example islands. Complete matching source/resources: source/. Details: README.md.\n',encoding='utf-8')
    zip_folder(bundle,output/f'Anno117Companion-{version}-complete.zip')
    records=[]
    for path in sorted(output.iterdir()):
        if path.suffix not in {'.zip','.apk','.exe'}:continue
        records.append({'file':path.name,'bytes':path.stat().st_size,'sha256':hashlib.sha256(path.read_bytes()).hexdigest()})
    manifest={'version':version,'published':False,'release_kind':'complete working application with matching source',
        'demo':'synthetic example islands; no private captures','game_resources':'included; Ubisoft ownership, not MIT',
        'source_file_count':len(paths),'signing':'Windows unsigned; Android debug signed','artifacts':records}
    (output/'release-manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
    (output/'SHA256SUMS.txt').write_text(''.join(r['sha256']+'  '+r['file']+'\n' for r in records),encoding='utf-8')
    for name in [source_zip.name,f'Anno117Companion-{version}-complete.zip']:
        with zipfile.ZipFile(output/name) as archive:
            assert not any(set(Path(n).parts)&FORBIDDEN for n in archive.namelist())
    print(json.dumps(manifest,indent=2))

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('action',choices=['stage','finalize']);parser.add_argument('--version',default='0.19.1')
    args=parser.parse_args();(stage if args.action=='stage' else finalize)(args.version)
