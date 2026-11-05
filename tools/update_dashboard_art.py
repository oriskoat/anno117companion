"""Fill missing dashboard art from the installed game's read-only archives."""
import argparse, io, json
from pathlib import Path, PurePosixPath
from xml.etree import ElementTree as ET
from PIL import Image
from save_reader.vendor.parser.rda.archive import RDAArchive

def payload(file):
    return json.loads(file.read_text(encoding='utf8').split('=',1)[1].strip().removesuffix(';'))

def webp(raw, target, size, alpha=True):
    with Image.open(io.BytesIO(raw)) as source:
        out=source.convert('RGBA' if alpha else 'RGB')
        out.thumbnail(size, Image.Resampling.LANCZOS)
        out.save(target,'WEBP',quality=91,method=4)

def main():
    p=argparse.ArgumentParser(description=__doc__)
    for key in ('archives','config','dashboard'):p.add_argument(key,type=Path)
    a=p.parse_args(); d=a.dashboard
    k=payload(d/'knowledge.js'); n=payload(d/'needs-data.js'); gallery=payload(d/'gallery.js')
    manifest=json.loads((d/'icons.json').read_text(encoding='utf8'))
    wanted={149678,67904,*(t['guid'] for t in n['tiers']),*(x['product_guid'] for x in n['needs'])}
    for f in k['factories']:
        wanted.add(f['factory_guid'])
        wanted.update(x['product_guid'] for x in f['inputs']+f['outputs'])
    wanted.update(s['guid'] for s in k['specialists'] if s['status']!='placeholder/test' and not s.get('portrait'))
    wanted.update(c['guid'] for c in k.get('captains',[]))
    assets={int(g):x for x in ET.parse(a.config/'assets.xml').iter('Asset')
            if (g:=x.findtext('Values/Standard/GUID')) and g.isdecimal()}
    def file_for(g,seen=frozenset()):
        if g in seen or g not in assets:return ''
        x=assets[g]
        name=x.findtext('Values/Standard/IconFilename')
        if name:return name.lower().replace('\\','/')
        base=x.findtext('BaseAssetGUID')
        return file_for(int(base),seen|{g}) if base and base.isdecimal() else ''
    pending={g:file_for(g) for g in sorted(wanted) if not (str(g) in manifest and (d/manifest[str(g)]).is_file())}
    exact={}
    for guid,name in pending.items():
        if name:
            path=PurePosixPath(name.replace('/fhd/','/4k/'))
            for filename in (str(path),str(path.with_name(path.stem+'_0.dds')),str(path.with_suffix('.dds'))):
                exact.setdefault(filename,[]).append(guid)
    scenes={
        'data/ui/4k/base/features/gamesetup_dlc_activation/img_dlc03_shop_province_0.dds':'aegyptus-0.webp',
        **{f'data/ui/4k/dlc03/features/images_fullscreen/img_fullscreen_dlc03_{name}_0.dds':f'aegyptus-{i}.webp'
           for i,name in enumerate(('region','dry_season','flood_season','settlement'),1)},
    }
    errors={}
    for name in ('zz_patchfiles_300','ui','graphics_ui','cdlc03_graphics','dlc03_graphics_01','dlc03_graphics_02','zz_patchfiles_210','zz_patchfiles_200','zz_patchfiles_150'):
        with RDAArchive(a.archives/(name+'.rda')) as arc:
            for entry in arc.entries:
                path=entry.filename.lower().replace('\\','/')
                ids=[g for g in exact.get(path,[]) if g in pending]
                scene=scenes.get(path)
                if not ids and not scene:continue
                try:
                    raw=arc.read(entry.filename)
                    if scene:
                        webp(raw,d/'islands'/scene,(1440,960),False)
                        scenes.pop(path)
                    for g in ids:
                        target=f'icons/{g}.webp'
                        webp(raw,d/target,(256,256))
                        manifest[str(g)]=target
                        pending.pop(g)
                except (OSError,ValueError,RuntimeError) as error:
                    errors[path]=str(error)
    for t in n['tiers']:
        if (img:=manifest.get(str(t['guid']))) and t['tier'] not in n['art']:n['art'][t['tier']]=img
    if (img:=manifest.get('149678')):n['art']['Aegyptus']=img
    gallery['aegyptus']=[f'islands/{f.name}' for f in sorted((d/'islands').glob('aegyptus-*.webp'))]
    for file,prefix,data in [('icons.json','',manifest),('icons.js','window.iconPaths=',manifest),('needs-data.js','window.annoNeeds=',n),('gallery.js','window.islandGallery=',gallery)]:
        (d/file).write_text(prefix+json.dumps(data,ensure_ascii=False,separators=(',',':'))+(';' if prefix else '')+'\n',encoding='utf8')
    print('Unresolved:',[(g,assets[g].findtext('Values/Standard/Name'),name) for g,name in pending.items() if g in assets])
    print('Decode errors:',errors)
    print('Coverage:',len(wanted)-len(pending),'/',len(wanted),'Regional images:',len(gallery['aegyptus']))
if __name__=='__main__':main()
