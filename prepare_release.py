"""Create private test artifacts and a sanitized public-source archive. No upload."""
import argparse
import hashlib
import importlib.metadata as metadata
import json
import shutil
import zipfile
from pathlib import Path

ROOT=Path(__file__).resolve().parent
DASH=ROOT/'android-probe/app/src/main/assets/dashboard'
DOCS=['README.md','LICENSE','PRIVACY.md','ASSET_RIGHTS.md','THIRD_PARTY_NOTICES.md','CHANGELOG.md','CHANGELOG_WINDOWS.md','CHANGELOG_ANDROID.md','docs/RELEASE_HISTORY_EVIDENCE.md','docs/CHANGELOG_LEGACY.md','docs/WINDOWS_COMPATIBILITY.md','docs/windows-compatibility-results.json']
CODE=['startup_guard.py','audit_windows_bundle.py','test_startup.py','.gitignore','bridge.py','capture.py','desktop_app.py','build_release.ps1','requirements-build.txt','import_content_pack.py','test_public.py']
LANGUAGES={'en':'English','de':'Deutsch','fr':'Français','it':'Italiano','es':'Español','ja':'日本語','ko':'한국어','pl':'Polski','pt-BR':'Português (Brasil)','ru':'Русский','zh-CN':'简体中文','zh-TW':'繁體中文'}

def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def zip_folder(folder,destination):
    with zipfile.ZipFile(destination,'w',zipfile.ZIP_DEFLATED) as archive:
        for path in sorted(folder.rglob('*')):
            if path.is_file():archive.write(path,path.relative_to(folder).as_posix())

def collect_licenses(destination):
    records=[]
    for dist in metadata.distributions(path=[str(ROOT/'tools/build-deps')]):
        name=dist.metadata['Name'];records.append({'name':name,'version':dist.version,'license':dist.metadata.get('License-Expression') or dist.metadata.get('License','See bundled license')})
        for item in dist.files or []:
            if any(part.lower() in {'licenses','license','license.txt','license.md','copying','notice'} for part in item.parts):
                path=Path(dist.locate_file(item))
                if path.is_file():
                    target=destination/name/Path(*item.parts[1:]);target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(path,target)
    destination.mkdir(parents=True,exist_ok=True)
    (destination/'python-packages.json').write_text(json.dumps(records,indent=2),encoding='utf-8')

def prepare(version):
    output=ROOT/'releases'/version;output.mkdir(parents=True,exist_ok=True)
    staging=ROOT/'build'/f'release-{version}'
    public=staging/'public-source';private=staging/'windows-local-testing'
    # Each generated staging tree is new; refuse stale contents rather than
    # silently include files left from an earlier packaging run.
    if public.exists() or private.exists():raise RuntimeError('Staging already exists; use a fresh version or review it explicitly')
    public.mkdir(parents=True);private.mkdir(parents=True)
    for name in DOCS+CODE:
        target=public/name;target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(ROOT/name,target)
    for name in DOCS:
        target=private/name;target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(ROOT/name,target)
    for path in (ROOT/'.github').rglob('*'):
        if path.is_file():
            target=public/path.relative_to(ROOT);target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(path,target)
    target=public/'localization';target.mkdir()
    for name in ['ui.tsv','copy-aliases.json']:shutil.copy2(ROOT/'localization'/name,target/name)
    for path in (ROOT/'android-probe').rglob('*'):
        relative=path.relative_to(ROOT/'android-probe')
        if not path.is_file() or any(p in {'build','.gradle','assets'} for p in relative.parts):continue
        if path.name in {'local.properties','MainActivity.java','BridgeActivity.java'}:continue
        if path.suffix not in {'.java','.xml','.gradle','.properties','.jar','.bat','.png'} and path.name!='gradlew':continue
        target=public/'android-probe'/relative;target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(path,target)
    public_dash=public/DASH.relative_to(ROOT);public_dash.mkdir(parents=True,exist_ok=True)
    excluded={'knowledge.js','game-locales.js','icons.js','gallery.js'}
    for path in DASH.iterdir():
        if path.is_file() and (path.suffix in {'.html','.css','.js','.webmanifest'} or path.name.startswith('app-icon') or path.name=='emblem.svg') and path.name not in excluded:
            shutil.copy2(path,public_dash/path.name)
    minimal={'source':'No local game-content pack installed','factories':[],'chains':[],'specialists':[],
             'languages':LANGUAGES,'names':{lang:{} for lang in LANGUAGES},'quotes':{lang:{} for lang in LANGUAGES},'quote_ids':[],
             'consumption':{'records':[]},'specialist_limitations':[]}
    (public_dash/'knowledge.js').write_text('window.annoKnowledge='+json.dumps(minimal,ensure_ascii=False)+';',encoding='utf-8')
    (public_dash/'game-locales.js').write_text('window.annoGameUI={};',encoding='utf-8')
    (public_dash/'icons.js').write_text('window.iconPaths={};',encoding='utf-8')
    (public_dash/'icons.json').write_text('{}',encoding='utf-8')
    (public_dash/'gallery.js').write_text('window.islandGallery={latium:["app-icon-512.png"],albion:["app-icon-512.png"]};',encoding='utf-8')
    rows=[]
    for island,delta in [(1,2),(2,-1)]:
        row={'ProductGuid':1,'ProductNameEnglish':'Example goods A','ProductGeneration':3 if delta>0 else 0,
             'ProductConsumption':1,'ProductDelta':delta,'PerfectProductGeneration':3,'PerfectProductConsumption':1,
             'AmountOfBuildings':1,'TotalMaintenance':0,'TotalIncome':0,'TotalProfit':0,'SummedProductivity':100,
             'AverageProductivity':100,'BuildingsNamed':[],'WorkforcesNamed':[]}
        rows.append({'session_id':1,'island_id':island,'area_index':1,'session_guid':0,'area_name':f'Example Island {island}',
                     'entries':[row],'sample_recorded':True,'stale':True,'received_at':'2026-10-31T00:00:00Z'})
    (public_dash/'demo.json').write_text(json.dumps({'mode':'demo','pipe_state':'recorded_sample','recorded_at':'2026-10-31T00:00:00Z','areas':rows,'supply_suggestions':[],'messages':0,'protocol_version':2,'session_name':'Synthetic example'}),encoding='utf-8')
    (public/'guid_map.json').write_text('{"guids":{}}',encoding='utf-8')
    # Remove local operator defaults from distributable application code.
    for path in [public/'android-probe/app/src/main/java/hu/anno117/pipeprobe/DashboardActivity.java',public_dash/'app.js']:
        path.write_text(path.read_text(encoding='utf-8').replace('http://192.168.0.103:11780','http://PC-IP:11780').replace('You are exploring a real saved session: 7 islands, 103 products and 297 product rows. This is not live data.','This is recorded data, not a live game connection.'),encoding='utf-8')
    collect_licenses(private/'third-party');shutil.copytree(private/'third-party',public/'third-party')
    executable=ROOT/'releases'/f'Anno117Companion-{version}.exe'
    shutil.copy2(executable,private/'Anno117Companion.exe')
    shutil.copy2(executable,ROOT/'releases/Anno117Companion.exe')
    apk=output/f'Anno-Companion-{version}-local-testing.apk'
    shutil.copy2(ROOT/'android-probe/app/build/outputs/apk/debug/app-debug.apk',apk)
    windows=output/f'Anno117Companion-{version}-windows-local-testing.zip';zip_folder(private,windows)
    source=output/f'Anno117Companion-{version}-public-source.zip';zip_folder(public,source)
    (output/'PUBLIC_UPLOAD.md').write_text('Only the public-source ZIP is prepared for public upload. The local-testing Windows ZIP and APK contain extracted game materials; redistribution clearance is not established. Nothing was uploaded. See ASSET_RIGHTS.md.\n',encoding='utf-8')
    artifacts=[{'file':source.name,'public_upload':True},{'file':windows.name,'public_upload':False},{'file':apk.name,'public_upload':False}]
    for record in artifacts:record.update(sha256=sha(output/record['file']),bytes=(output/record['file']).stat().st_size)
    manifest={'version':version,'artifacts':artifacts,'published':False,'signing':'Windows unsigned; Android debug signed','known_limits':['Pipe rate units unverified','Physical iPhone/Safari not verified','Catalogue patch 2.0','Authored UI translations need native-speaker review','Extracted game assets not cleared for public redistribution']}
    (output/'release-manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
    (output/'SHA256SUMS.txt').write_text(''.join(r['sha256']+'  '+r['file']+'\n' for r in artifacts),encoding='utf-8')
    forbidden={'bridge-settings','captures','game-data','devices.json','pairing.json','local.properties','game-text-provenance.json'}
    with zipfile.ZipFile(source) as archive:
        assert not any(set(Path(name).parts)&forbidden for name in archive.namelist())
        assert not any(name.endswith('.webp') for name in archive.namelist())
    print(json.dumps(manifest,indent=2))

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--version',default='0.11.0')
    prepare(parser.parse_args().version)
