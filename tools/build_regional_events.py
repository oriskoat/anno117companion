"""Compile installed regional events and reuse their official extracted icons."""
import argparse,json,xml.etree.ElementTree as ET
from pathlib import Path
from PIL import Image
p=argparse.ArgumentParser();p.add_argument('--assets',required=True);p.add_argument('--dashboard',required=True);p.add_argument('--icons',required=True);args=p.parse_args()
out=Path(args.dashboard);root=ET.parse(args.assets);assets={int(g):a for a in root.iter('Asset') if (g:=a.findtext('Values/Standard/GUID')) and g.isdecimal()}
rules=json.loads((out/'advisor-data.js').read_text(encoding='utf-8').split('=',1)[1].strip().removesuffix(';'))
icons=json.loads((out/'icons.json').read_text(encoding='utf-8'));source=Path(args.icons)
phases=[]
for guid,a in assets.items():
 n=a.find('Values/VolcanoPhase')
 if n is not None:
  d=n.find('Duration');phases.append({'guid':guid,'name':a.findtext('Values/Standard/Name'),'base_minutes':float(d.findtext('BaseDuration','0'))/60000,'minimum_added_minutes':float(d.findtext('MinimumAddedTime','0'))/60000,'maximum_added_minutes':float(d.findtext('MaximumAddedTime','0'))/60000,'first_time_range':[float(d.findtext('FirstBaseDurationMin','0'))/60000,float(d.findtext('FirstBaseDurationMax','0'))/60000], 'effects':[{'guid':int(i.findtext('Buff')),'disabled_when_inactive':i.findtext('DisableWhenVolcanoInactive','0')=='1'} for i in n.findall('Buffs/Item')],'can_abort':n.findtext('CanAbortAfterThisPhase','0')=='1'})
for guid in [150490,150491,144988,145097,145099]+[p['guid'] for p in phases]:
 a=assets[guid];name=Path(a.findtext('Values/Standard/IconFilename','')).stem+'_0.dds';matches=list(source.rglob(name))
 if not matches:raise ValueError('Missing official icon '+name)
 with Image.open(matches[0]) as im:
  im=im.convert('RGBA');im.thumbnail((192,192));im.save(out/'icons'/f'{guid}.webp','WEBP',quality=94)
 icons[str(guid)]=f'icons/{guid}.webp'
rules['volcano']={'phases':phases,'schedule_variable':True,'scope':'ObjectsInSession','warning':'Configured durations are not a saved countdown. First eruption, difficulty, accumulated overtime and aborted preludes can alter the schedule.'}
(out/'advisor-data.js').write_text('window.annoAdvisorRules='+json.dumps(rules,separators=(',',':'),ensure_ascii=False)+';\n',encoding='utf-8')
(out/'icons.json').write_text(json.dumps(icons),encoding='utf-8');(out/'icons.js').write_text('window.iconPaths='+json.dumps(icons)+';',encoding='utf-8')
print('Compiled',len(phases),'volcano phases and official event icons.')
