"""Audit the shipped specialist catalogue against the resolved 3.0 export and raw buff XML."""
import argparse,json
from collections import Counter
from pathlib import Path
from xml.etree import ElementTree as ET

def main():
 p=argparse.ArgumentParser(description=__doc__)
 for name in ('export','assets','dashboard'):p.add_argument(name,type=Path)
 args=p.parse_args()
 src=json.loads(args.export.read_text(encoding='utf8'))
 k=json.loads((args.dashboard/'knowledge.js').read_text(encoding='utf8').split('=',1)[1].strip().removesuffix(';'))
 assets={int(g):x for x in ET.parse(args.assets).iter('Asset') if (g:=x.findtext('Values/Standard/GUID')) and g.isdecimal()}
 expected={r['guid']:r for r in src['items'] if r['item_type']=='Specialist' and r['status']!='placeholder/test'}
 assert len(k['specialists'])==len(expected)==len({s['guid'] for s in k['specialists']})
 def grants(buffs):
  for b in buffs:
   buff=assets.get(b.get('guid'))
   if buff is None:continue
   for u in buff.findall('Values/FactoryUpgrade'):
    guid=int(u.findtext('AddedFertility') or 0)
    percent=float(u.findtext('FertilityPercent') or 0)
    if guid and percent>0:yield {'guid':guid,'percent':percent}
 icons=json.loads((args.dashboard/'icons.json').read_text(encoding='utf8'))
 for s in k['specialists']:
  original=expected[s['guid']]
  for key in ('target_assets','excluded_targets','base_buffs','boost_buffs','sources','origin'):
   assert original[key]==s[key],(s['guid'],key)
  assert s['target_assets'],s['guid']
  assert all(t['guid'] in assets for t in s['target_assets']+s['excluded_targets']),s['guid']
  assert s['fertility_grants']==list(grants(original['base_buffs'])),s['guid']
  art=s.get('portrait') or icons.get(str(s['guid']))
  assert art and (args.dashboard/art).is_file(),s['guid']
 print('Specialists by origin:',dict(Counter(s['origin'] for s in k['specialists'])))
 print('Fertility grants by origin:',dict(Counter(s['origin'] for s in k['specialists'] if s['fertility_grants'])))
 for region in ('Latium','Albion','Aegyptus'):
  f={x['factory_guid'] for x in k['factories'] if region in x['regions']}
  hits=[{t['guid'] for t in s['target_assets']}&f-{t['guid'] for t in s['excluded_targets']} for s in k['specialists']]
  print(region, sum(bool(x) for x in hits),'matching specialists;',len(set().union(*hits)),'/',len(f),'producers covered')
 assert {c['guid'] for c in k['captains']}=={r['guid'] for r in src['items'] if r['item_type']=='Captains' and r['status']!='placeholder/test'}
if __name__=='__main__':main()
