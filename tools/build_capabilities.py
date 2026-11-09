"""Compile official construction/economy/research references; no save access."""
import argparse,hashlib,json,xml.etree.ElementTree as ET
from pathlib import Path
from functools import lru_cache

def build(path,text_path,dashboard):
    tree=ET.parse(path);assets={int(g):a for a in tree.iter('Asset') if (g:=a.findtext('Values/Standard/GUID','')).isdecimal()}
    texts={n.findtext('LineId'):n.findtext('Text','') for n in ET.parse(text_path).iter('Text') if n.find('LineId') is not None}
    @lru_cache(None)
    def node(g,p):
        a=assets.get(g)
        if a is None:return None
        n=a.find(p)
        if n is not None:return n
        base=a.findtext('BaseAssetGUID');return node(int(base),p) if base and base.isdecimal() else None
    def value(g,p,default=None):
        n=node(g,p);return n.text if n is not None and n.text is not None else default
    def name(g):return texts.get(value(g,'Values/Tech/VisibleTechName') or value(g,'Values/Text/OasisId')) or value(g,'Values/Standard/Name',str(g))
    def amounts(g,p,key):
        n=node(g,p);return [{'good':int(i.findtext(key)),'amount':float(i.findtext('Amount'))} for i in (n.findall('Item') if n is not None else []) if i.findtext(key,'').isdecimal() and i.findtext('Amount') is not None]
    @lru_cache(None)
    def pool(g,visited=()):
        if g in visited:return ()
        n=node(g,'Values/AssetPool/AssetList')
        return tuple(sorted({x for item in n.findall('Item') if (v:=item.findtext('Asset','')).isdecimal() for x in pool(int(v),visited+(g,))})) if n is not None else (g,)
    knowledge=json.loads((dashboard/'knowledge.js').read_text(encoding='utf-8').split('=',1)[1].strip().removesuffix(';'))
    factories={};techs={};permits={}
    for f in knowledge['factories']:
        g=f['factory_guid'];maint=amounts(g,'Values/Maintenance/Maintenances','Product');cost=amounts(g,'Values/Cost/Costs','Ingredient')
        factories[g]={'upkeep':next((x['amount'] for x in maint if x['good']==1010017),None),'workforce':sum(x['amount'] for x in maint if value(x['good'],'Values/Product/IsWorkforce','0')=='1'),'costs':cost,'default_locked':value(g,'Values/Locked/DefaultLockedState'),'techs':[]}
    for g,a in assets.items():
        if a.findtext('Template')=='Tech':
            rewards=node(g,'Values/Tech/Rewards/Unlocks');refs=[int(i.findtext('UnlockReward')) for i in rewards.findall('Item') if i.findtext('UnlockReward','').isdecimal()] if rewards is not None else []
            unlocks=sorted({x for ref in refs for x in pool(ref)})
            techs[g]={'name':name(g),'knowledge':float(value(g,'Values/Tech/KnowledgeNeeded','0')),'repeatable':value(g,'Values/Tech/IsRepeatable','0')=='1','unlocks':unlocks}
            for factory in set(unlocks)&factories.keys():factories[factory]['techs'].append(g)
        if a.findtext('Template')=='Product' and 'Permit' in value(g,'Values/Standard/Name',''):permits[g]={'name':name(g)}
    return {'schema':1,'assets_sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'factories':factories,'techs':techs,'permits':permits}

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--assets',required=True);p.add_argument('--texts',required=True);p.add_argument('--dashboard',required=True);a=p.parse_args();d=Path(a.dashboard);result=build(Path(a.assets),Path(a.texts),d)
    (d/'capability-data.js').write_text('window.annoCapabilities='+json.dumps(result,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf-8');print('Capabilities:',len(result['factories']),'factories,',len(result['techs']),'technologies,',len(result['permits']),'permit products')
