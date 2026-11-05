"""Update dashboard recipe catalogue from a verified local production export."""
import argparse, json
from pathlib import Path
from xml.etree import ElementTree as ET

def main():
    p=argparse.ArgumentParser(description=__doc__)
    for key in ('export','config','dashboard'): p.add_argument(key,type=Path)
    p.add_argument('--item-catalogue',type=Path)
    a=p.parse_args()
    def load(file):
        return json.loads((a.dashboard/file).read_text(encoding='utf8').split('=',1)[1].strip().removesuffix(';'))
    k,n=load('knowledge.js'),load('needs-data.js')
    export=json.loads(a.export.read_text(encoding='utf8'))
    assets={x.findtext('Values/Standard/GUID'):x for x in ET.parse(a.config/'assets.xml').iter('Asset') if x.findtext('Values/Standard/GUID')}
    factories={f['factory_guid']:f for f in export['factories'] if f['regions']}
    assert {r for f in factories.values() for r in f['regions']}=={'Latium','Albion','Aegyptus'}
    producers={}
    for f in factories.values():
        for r in f['regions']:
            for o in f['outputs']:
                producers.setdefault((r,o['product_guid']),[]).append((f,o['amount_per_minute_100pct']))
    previous={(c['region'],c['product_guid']):c for c in k['chains'] if c['region']!='Aegyptus'}
    tiers={t['tier']:i for i,t in enumerate(n['tiers'])}
    need_tiers={}
    for row in n['needs']:
        if not row['is_service']:
            need_tiers.setdefault((row['region'],row['product_guid']),set()).add(row['tier'])
    def recipe_nodes(f,region,active=()):
        guid=f['factory_guid']
        if guid in active: return []
        result=[]
        for i in f['inputs']:
            choices=[(x,y) for x,y in producers.get((region,i['product_guid']),[]) if x['factory_guid'] not in (*active,guid)]
            if choices:
                x,_=max(choices,key=lambda pair:pair[1])
                result.extend(recipe_nodes(x,region,(*active,guid)))
        asset=assets[str(guid)]
        result.append(dict(building_guid=guid,building_name=f['factory_name'],cycle_seconds=f['cycle_seconds'],
                           needs_fuel=f['needs_fuel'],fertility_guid=asset.findtext('Values/Factory7/NeededFertility')))
        return list({v['building_guid']:v for v in result}.values())
    groups={}
    for (region,guid),options in producers.items():
        primary=[(f,y) for f,y in options if f['outputs'][0]['product_guid']==guid]
        if not primary: continue
        old=previous.get((region,guid),{})
        f,y=next(((f,y) for f,y in primary if f['factory_guid']==old.get('factory_guid')),max(primary,key=lambda pair:pair[1]))
        tier=old.get('tier') or min(need_tiers.get((region,guid),{'Infrastructure'}),key=lambda x:tiers.get(x,-1))
        name=f['outputs'][0]['product_name']
        groups[region,guid]=dict(old,region=region,tier=tier,product_guid=guid,factory_guid=f['factory_guid'],name=name,
                                 dlc_unlock_guids=sorted(set(f['dlc_unlock_guids'])|({67904} if region=='Aegyptus' else set())),
                                 nodes=recipe_nodes(f,region))
    k['chains']=[groups.pop(key) for key in previous if key in groups]+list(groups.values())
    for f in factories.values():
        asset=assets[str(f['factory_guid'])]
        f['fertility_guid']=int(asset.findtext('Values/Factory7/NeededFertility') or 0) or None
    k['factories']=list(factories.values())
    for item in k['specialists']:
        item['fertility_grants']=[]
        for buff in item['base_buffs']:
            asset=assets.get(str(buff.get('guid')))
            if asset is not None:
                for upgrade in asset.findall('Values/FactoryUpgrade'):
                    guid=int(upgrade.findtext('AddedFertility') or 0)
                    percent=float(upgrade.findtext('FertilityPercent') or 0)
                    if guid and percent>0:
                        item['fertility_grants'].append({'guid':guid,'percent':percent})
    if a.item_catalogue:
        item_rows=json.loads(a.item_catalogue.read_text(encoding='utf8'))['items']
        k['captains']=[{'guid':i['guid'],'name':i['name'],
                        'targets':[t['guid'] for t in i['target_assets']],
                        'excluded':[t['guid'] for t in i['excluded_targets']],
                        'effects':[e for b in i['base_buffs'] for e in b.get('effects',[])
                                   if e.get('text') in ('Movement Speed','Cargo Weight Slowdown','Loading Speed')]}
                       for i in item_rows if i['item_type']=='Captains' and str(i['guid']) in assets]

    k['source']=dict(export['source'],game_data='official patch 3.0 config.rda')
    identifiers={67902,67904,149678,*(t['guid'] for t in n['tiers'])}
    for f in factories.values():
        identifiers.add(f['factory_guid'])
        identifiers.update(x['product_guid'] for x in f['inputs']+f['outputs'])
    locales=dict(zip(k['languages'],('english','german','french','italian','spanish','japanese','korean','polish','brazilian','russian','simplified_chinese','traditional_chinese')))
    for lang, file in locales.items():
        texts={t.findtext('LineId'):t.findtext('Text') for t in ET.parse(a.config/f'texts_{file}.xml').findall('Texts/Text')}
        for guid in identifiers:
            x=assets.get(str(guid))
            if x is not None and (s:=texts.get(x.findtext('Values/Text/OasisId'))):
                k['names'][lang][str(guid)]=s
    for row in n['needs']:
        g,r=row['product_guid'],row['region']
        row['local_production']=(r,g) in producers
        row['import_from_regions']=sorted({region for region in ('Latium','Albion','Aegyptus') if region!=r and (region,g) in producers})
    for filename,prefix,data in [('knowledge.js','window.annoKnowledge=',k),('needs-data.js','window.annoNeeds=',n)]:
        (a.dashboard/filename).write_text(prefix+json.dumps(data,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf8')
    print(len(k['factories']),'factories;',len(k['chains']),'chains;',sum(c['region']=='Aegyptus' for c in k['chains']),'Aegyptus chains')
if __name__=='__main__':
    main()
