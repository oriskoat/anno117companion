"""Import a resolved game item export into the dashboard without machine-local paths."""
import argparse,json
from pathlib import Path
from xml.etree import ElementTree as ET

def main():
 p=argparse.ArgumentParser(description=__doc__)
 for field in ('items','config','dashboard'):p.add_argument(field,type=Path)
 a=p.parse_args()
 file=a.dashboard/'knowledge.js'
 data=json.loads(file.read_text(encoding='utf8').split('=',1)[1].strip().removesuffix(';'))
 old={s['guid']:s for s in data['specialists']}
 src=json.loads(a.items.read_text(encoding='utf8'))
 assets={int(g):x for x in ET.parse(a.config/'assets.xml').iter('Asset') if (g:=x.findtext('Values/Standard/GUID')) and g.isdecimal()}
 fields=('guid','name','description','rarity','allocation','scope','origin','target_assets','excluded_targets','base_buffs','boost_buffs','boost_condition_summary','sources','status')
 specs=[];captains=[]
 for i in src['items']:
  if i['status']=='placeholder/test':continue
  if i['item_type']=='Specialist':
   s={k:i[k] for k in fields}
   s['portrait']=old.get(i['guid'],{}).get('portrait')
   s['fertility_grants']=[]
   for b in i['base_buffs']:
    buff=assets.get(b.get('guid'))
    if buff is None:continue
    for u in buff.findall('Values/FactoryUpgrade'):
     guid=int(u.findtext('AddedFertility') or 0)
     pct=float(u.findtext('FertilityPercent') or 0)
     if guid and pct>0:
      s['fertility_grants'].append(dict(guid=guid,percent=pct))
   specs.append(s)
  elif i['item_type']=='Captains':
   captains.append(dict(guid=i['guid'],name=i['name'],targets=[t['guid'] for t in i['target_assets']],
     excluded=[t['guid'] for t in i['excluded_targets']],effects=[e for b in i['base_buffs'] for e in b.get('effects',[])
      if e.get('text') in ('Movement Speed','Cargo Weight Slowdown','Loading Speed')]))
 data['specialists']=specs
 data['captains']=captains
 data['specialist_source']='Resolved game 3.0 config.rda'
 data['specialist_limitations']=['Acquisition references do not guarantee unlocks or availability.','Conditional effects may depend on the game state.']
 ids={i['guid'] for i in specs+captains}
 ids.update(t['guid'] for i in specs for t in i['target_assets']+i['fertility_grants'])
 ids.update(g for i in captains for g in i['targets'])
 languages=dict(zip(('en','de','fr','it','es','ja','ko','pl','pt-BR','ru','zh-CN','zh-TW'),('english','german','french','italian','spanish','japanese','korean','polish','brazilian','russian','simplified_chinese','traditional_chinese')))
 for lang,locale in languages.items():
  texts={t.findtext('LineId'):t.findtext('Text') for t in ET.parse(a.config/f'texts_{locale}.xml').findall('Texts/Text')}
  for g in ids:
   if g in assets and (name:=texts.get(assets[g].findtext('Values/Text/OasisId'))):
    data['names'][lang][str(g)]=name
 f={x['factory_guid'] for x in data['factories'] if 'Aegyptus' in x['regions']}
 hits=[s for s in specs if any(t['guid'] in f for t in s['target_assets'] if t['guid'] not in {x['guid'] for x in s['excluded_targets']})]
 assert hits and any(s['guid']==173071 for s in hits) and any(s['guid']==179655 and s['fertility_grants'] for s in hits)
 file.write_text('window.annoKnowledge='+json.dumps(data,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf8')
 print(f'{len(specs)} specialists; {len(captains)} captains; {len(hits)} specialists match Aegyptus production')
if __name__=='__main__':main()
