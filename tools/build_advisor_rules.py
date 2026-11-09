"""Compile patch-specific advisor rules; input is the installed game's exported assets."""
import argparse,hashlib,json,xml.etree.ElementTree as ET
from pathlib import Path
from functools import lru_cache
p=argparse.ArgumentParser();p.add_argument('--assets',required=True);p.add_argument('--dashboard',required=True);args=p.parse_args()
source=Path(args.assets);out=Path(args.dashboard);tree=ET.parse(source)
assets={int(g):a for a in tree.iter('Asset') if (g:=a.findtext('Values/Standard/GUID')) and g.isdecimal()}
@lru_cache(None)
def element(g,path):
 a=assets.get(g)
 if a is None:return None
 n=a.find(path)
 if n is not None:return n
 b=a.findtext('BaseAssetGUID');return element(int(b),path) if b else None

def value(g,path,default=None):
 n=element(g,path);return n.text if n is not None and n.text is not None else default
@lru_cache(None)
def pool(g,visited=()):
 if g in visited:return ()
 n=element(g,'Values/AssetPool')
 if n is None:return (g,)
 refs=n.findall('AssetList/Item/Asset')
 if not refs:
  b=assets[g].findtext('BaseAssetGUID');return pool(int(b),visited+(g,)) if b else ()
 return tuple(sorted({v for n in refs if n.text and n.text.isdecimal() for v in pool(int(n.text),visited+(g,))}))

def refs(g,path):
 n=element(g,path);return [int(v.text) for v in n.findall('Item/GUID') if v.text and v.text.isdecimal()] if n is not None else []
knowledge=json.loads((out/'knowledge.js').read_text(encoding='utf8').split('=',1)[1].strip().removesuffix(';'))
factories={f['factory_guid']:f for f in knowledge['factories']};buffs={};effects={};patrons={};warehouses={};definitions={}
for guid,a in assets.items():
 f=element(guid,'Values/FactoryUpgrade');w=element(guid,'Values/WarehouseUpgrade');m=element(guid,'Values/ModuleOwnerUpgrade')
 b={}
 if f is not None:
  n=f.find('ProductivityUpgrade')
  if n is not None:b['productivity']={'value':float(n.findtext('Value','0')),'percental':n.findtext('Percental','0')=='1'}
  if value(guid,'Values/FactoryUpgrade/AddedFertility'):
   b['fertility']={'guid':int(value(guid,'Values/FactoryUpgrade/AddedFertility')),'percent':float(value(guid,'Values/FactoryUpgrade/FertilityPercent','100'))}
  extras=[]
  for e in f.findall('AdditionalOutput/Item'):
   extras.append({'same_product':e.findtext('ForceProductSameAsFactoryOutput','0')=='1','product':int(e.findtext('Product','0')),'amount':float(e.findtext('Amount','1')),'cycle':int(e.findtext('AdditionalOutputCycle','1')),'scale_cycle':e.findtext('EffectScaleApplyToCycles','0')=='1','scale_amount':e.findtext('EffectScaleApplyToAmount','0')=='1','limited_lode':int(e.findtext('RequiresLimitedLodeFertility','0'))})
  if extras:b['extra']=extras
 if w is not None:
  for xmlkey,key in [('StorageCapacityModifier','capacity'),('OverflowRiskMultiplierUpgrade','overflow_risk')]:
   n=w.find(xmlkey)
   if n is not None:b[key]={'value':float(n.findtext('Value',n.text or '0')),'percental':n.findtext('Percental','0')=='1'}
 if w is not None:
  for n in w:
   if 'Overflow' in n.tag and 'Multiplier' in n.tag:b['overflow_risk']={'value':float(n.findtext('Value','0')),'percental':n.findtext('Percental','0')=='1'}
 if m is not None and m.findtext('ModuleLimitPercent'):b['module_limit_percent']=float(m.findtext('ModuleLimitPercent'))
 if b:b.update(name=value(guid,'Values/Standard/Name',str(guid)),stackable=value(guid,'Values/Buff/IsStackable','0')=='1');buffs[guid]=b
for guid,a in assets.items():
 n=element(guid,'Values/Effect')
 if n is not None:
  bs=refs(guid,'Values/Effect/Buffs');boost=refs(guid,'Values/ItemWithBoost/BoostedBuffs')
  if any(g in buffs for g in bs+boost):
   targets=set(v for g in refs(guid,'Values/Effect/Targets') for v in pool(g));exclude=set(v for g in refs(guid,'Values/Effect/ExcludeFromTargets') for v in pool(g))
   if targets&factories.keys() or n.findtext('EffectScope') in ('ModuleOwner','Radius'):
    effects[guid]={'name':value(guid,'Values/Standard/Name',str(guid)),'scope':n.findtext('EffectScope','Local'),'targets':sorted(targets-exclude),'buffs':[g for g in bs if g in buffs],'boost_buffs':[g for g in boost if g in buffs],'conditional':element(guid,'Values/ItemWithBoost/BoostCondition') is not None}
 n=element(guid,'Values/Patron')
 if n is not None:
  patrons[guid]={'name':value(guid,'Values/Standard/Name',str(guid)).replace('Patron','').strip(),'local':[]}
  for local in n.findall('LocalEffects/Item'):
   patrons[guid]['local'].append({'effect':int(local.findtext('GUID')),'milestones':[{'belief':int(v.findtext('Devotion')),'scale':float(v.findtext('BuffScaling'))} for v in local.findall('Milestones/Item')]})
 wh=element(guid,'Values/Warehouse')
 if wh is not None:
  productlist=element(guid,'Values/Warehouse/ProductStorageList')
  goods=[]
  if productlist is not None:
   goods=[int(n.text) for n in productlist.iter() if n.tag in ('Product','GUID') and n.text and n.text.isdecimal()]
  warehouses[guid]={'overflow':value(guid,'Values/Warehouse/HasOverflowStorage','0')=='1','products':goods,'risk':float(value(guid,'Values/Warehouse/OverflowRiskMultiplier','1'))}
for guid,f in factories.items():
 definitions[guid]={'water_policy':value(guid,'Values/AqueductConsumer/AqueductConsumptionType','None'),'water_buffs':refs(guid,'Values/AqueductConsumer/AqueductConsumptionBuffEffect'),'module':int(value(guid,'Values/ModuleOwner/AdditionalModule','0')),'fertility':int(value(guid,'Values/Factory7/NeededFertility','0'))}
 node_work=element(guid,'Values/Maintenance/Maintenances')
 definitions[guid]['workforce']=[{'good':int(n.findtext('Product')),'amount':float(n.findtext('Amount','0'))} for n in node_work.findall('Item') if n.findtext('Product','').isdecimal() and value(int(n.findtext('Product')),'Values/Product/IsWorkforce','0')=='1'] if node_work is not None else []
 # ProductivityBuff is a different reference name from normal Effect/Buffs.
 node=element(guid,'Values/AqueductConsumer/AqueductConsumptionBuffEffect')
 definitions[guid]['water_buffs']=[int(n.text) for n in node.findall('Item/ProductivityBuff') if n.text and n.text.isdecimal()] if node is not None else []
# Explicit installed overflow product list: never infer that every crop causes rats.
overflow=list(pool(152970))
node=element(152970,'Values/ProductStorageList')
if node is not None:overflow=[int(n.text) for n in node.iter() if n.tag in ('Product','GUID') and n.text and n.text.isdecimal()]
# The known exported template uses ProductList/Item/Product; resolve exactly.
if len(overflow)!=17:
 a=assets[152970];overflow=[int(n.text) for n in a.iter() if n.tag=='Product' and n.text and n.text.isdecimal()]
if len(overflow)!=17:raise ValueError('Expected 17 explicitly configured overflow products')
for guid,w in warehouses.items():
 # Warehouse uses a GUID reference to ProductStorageList in the current export.
 n=value(guid,'Values/Warehouse/ProductStorageList')
 if n and n.isdecimal():
  a=assets.get(int(n));w['products']=[int(n.text) for n in a.iter() if n.tag=='Product' and n.text and n.text.isdecimal()] if a is not None else []
 w['overflow']=value(guid,'Values/Warehouse/UseOverflow','0')=='1' or value(guid,'Values/Warehouse/HasOverflowStorage','0')=='1'
# Read actual property names, not guessed defaults.
for guid in (152969,153059,153060,159123):
 wh=element(guid,'Values/Warehouse')
 if wh is not None:
  for n in wh:
   if 'Overflow' in n.tag and n.text in ('1','true'):warehouses[guid]['overflow']=True
for guid,w in warehouses.items():
 w['risk']=float(value(guid,'Values/Warehouse/OverflowStorageRiskMultiplier','1'))
 w['all_normal']=value(guid,'Values/StorageBase/CanStoreAllNormalProducts','0')=='1'
 productlist=value(guid,'Values/StorageBase/ProductStorageList')
 if productlist and productlist.isdecimal() and int(productlist) in assets:
  w['products']=[int(n.text) for n in assets[int(productlist)].iter() if n.tag=='Product' and n.text and n.text.isdecimal()]
rules={'schema':1,'game':'3.0','assets_sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'factories':definitions,'buffs':buffs,'effects':effects,'patrons':patrons,'warehouses':warehouses,'seasons':{'dry':150490,'flood':150491,'dry_minutes':180,'flood_minutes':120,'targets':list(pool(155619)),'dry_extra_per_cycle':1,'flood_relative':-75,'gate':157020},'overflow_products':overflow}
modules={}
for guid in {d['module'] for d in definitions.values() if d['module']}:
 bs=[]
 node=element(guid,'Values/Building/FunctionalEffects')
 if node is not None:
  for n in node.findall('Item/FunctionalEffect'):
   effect=effects.get(int(n.text))
   if effect and effect['scope']=='ModuleOwner':bs.extend(effect['buffs'])
 duration=float(value(guid,'Values/FactoryBase/CycleTime','0'))
 ins=element(guid,'Values/FactoryBase/FactoryInputs')
 inputs=[{'good':int(n.findtext('Product')),'rate':float(n.findtext('Amount','1'))*60/duration} for n in ins.findall('Item')] if ins is not None and duration>0 else []
 modules[guid]={'name':value(guid,'Values/Standard/Name',str(guid)),'buffs':bs,'inputs':inputs}
rules['modules']=modules
previous=out/'advisor-data.js'
if previous.exists():
 old=json.loads(previous.read_text(encoding='utf-8').split('=',1)[1].strip().removesuffix(';'))
 if old.get('assets_sha256')==rules['assets_sha256'] and old.get('volcano'):rules['volcano']=old['volcano']
(out/'advisor-data.js').write_text('window.annoAdvisorRules='+json.dumps(rules,separators=(',',':'),ensure_ascii=False)+';\n',encoding='utf8')
print('Rules:',len(effects),'effects,',len(buffs),'buffs,',len(patrons),'patrons;',len(overflow),'risk products')
