"""Rebuild Companion residence needs from extracted 3.0 game config."""
import argparse
import json
from decimal import Decimal
from pathlib import Path
from xml.etree import ElementTree as ET

AEGYPTUS = {149684:149681, 150584:150510, 150585:150511, 150586:150534, 150587:150542}
LOCALES = dict(zip(('en','de','fr','it','es','ja','ko','pl','pt-BR','ru','zh-CN','zh-TW'),
                   ('english','german','french','italian','spanish','japanese','korean','polish','brazilian','russian','simplified_chinese','traditional_chinese')))

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('config', type=Path)
    parser.add_argument('dashboard', type=Path)
    args = parser.parse_args()
    assets = {a.findtext('Values/Standard/GUID'): a for a in ET.parse(args.config/'assets.xml').iter('Asset') if a.findtext('Values/Standard/GUID')}
    def load(file):
        return json.loads((args.dashboard/file).read_text(encoding='utf8').split('=',1)[1].strip().removesuffix(';'))
    def save(file, prefix, data):
        (args.dashboard/file).write_text(prefix+json.dumps(data,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf8')
    def txt(lang):
        return {t.findtext('LineId'): t.findtext('Text') for t in ET.parse(args.config/f'texts_{LOCALES[lang]}.xml').findall('Texts/Text')}
    def name(guid, texts):
        a=assets[str(guid)]
        return texts.get(a.findtext('Values/Text/OasisId')) or a.findtext('Values/Standard/Name')
    def amounts(node):
        return {x.tag:float(x.findtext('Value')) for x in node if x.findtext('Value') is not None} if node is not None else {}
    en=txt('en')
    data, knowledge = load('needs-data.js'), load('knowledge.js')
    old={(n['region'],n['tier'],n['need_guid']):n for n in data['needs']}
    producers={}
    for factory in knowledge['factories']:
        for product in factory['outputs']:
            producers.setdefault(product['product_guid'],set()).update(factory['regions'])
    tiers=[t for t in data['tiers'] if t['region']!='Aegyptus']
    tiers += [dict(region='Aegyptus', tier=name(t,en), guid=t, residence=r) for r,t in AEGYPTUS.items()]
    settings = next(a.find('Values/DifficultySettings/NeedConsumption') for a in assets.values() if a.find('Values/DifficultySettings/NeedConsumption') is not None)
    factors={s.tag:Decimal(s.findtext('ConsumptionFactor')) for s in settings}
    needs, consumption, ids = [], [], set()
    for t in tiers:
        region,tier,r = t['region'],t['tier'],t['residence']
        residence=assets[str(r)].find('Values/Residence7')
        t['thresholds']=amounts(residence.find('UpgradeThreshold'))
        ids.add(str(t['guid']))
        for entry in residence.findall('NeedsList/*'):
            gid=int(entry.findtext('Need'))
            a=assets[str(gid)].find('Values/Need')
            p=int(a.findtext('NeedProduct'))
            category=a.findtext('NeedCategoryType') or 'PublicServices'
            prior=old.get((region,tier,gid),{})
            raw=entry.findtext('NeedConsumptionRate')
            service=prior.get('is_service',raw is None)
            conditional=entry.findtext('IsOnlyAvailableThroughBuff')=='1'
            rates={k:float(Decimal(raw or '0')*v) for k,v in factors.items()}
            regions=producers.get(p,set())
            row=dict(region=region,tier=tier,need_guid=gid,product_guid=p,product_name=name(p,en),
                     category=category,is_service=service,only_available_through_buff=conditional,
                     activation_note='Requires the granting buff or effect.' if conditional else 'Requires the need to be unlocked and supplied.',
                     local_production=region in regions,import_from_regions=sorted(regions-{region}),
                     supply_weight=a.findtext('SupplyWeight') or '1',rewards=amounts(a.find('NeedAttributes')),rates=rates)
            needs.append(row)
            ids.update((str(gid),str(p)))
            if not service:
                consumption.append({k:row[k] for k in ('region','tier','product_guid','product_name','only_available_through_buff','activation_note','rates')} | {'residence_guid':r,'residence_name':name(r,en)})
    for lang in LOCALES:
        texts=txt(lang)
        data['names'][lang].update({g:name(g,texts) for g in ids})
    data.update(source='Game 3.0 residence needs and difficulty settings',tiers=tiers,needs=needs)
    knowledge['consumption'].update(patch='3.0',records=consumption)
    save('needs-data.js','window.annoNeeds=',data)
    save('knowledge.js','window.annoKnowledge=',knowledge)
    print(f'{len(tiers)} population groups, {len(needs)} needs, factors {factors}')

if __name__=='__main__':
    main()
