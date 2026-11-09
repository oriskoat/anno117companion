"""Read-only bounded probe. Private numeric evidence stays under excluded build/."""
import json,sys,struct,math
from collections import Counter
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from save_reader.reader import RDAArchive,inflate,select,integer,text
from save_reader.service import default_accounts
root=Path(__file__).resolve().parents[1]
catalogue=json.loads((root/'save_catalogue.json').read_text(encoding='utf-8'))['assets']
granaries={int(g) for g,a in catalogue.items() if 'granary' in a.get('name','').lower()}
def scalar(n):
 if n.data is None:return None
 b=n.data
 if len(b)==12:return {'xyz':[v if math.isfinite(v) else None for v in struct.unpack('<fff',b)]}
 if len(b) in (1,2,4,8):
  x={'integer':int.from_bytes(b,'little')}
  if len(b)==4:x['float']=struct.unpack('<f',b)[0] if math.isfinite(struct.unpack('<f',b)[0]) else None
  return x
 return {'bytes':len(b)}
def tree(n,depth=0):
 return scalar(n) if n.data is not None else {c.name:tree(c,depth+1) for c in n.children[:100]} if depth<6 else {'children':len(n.children)}
path=max((p for p in default_accounts().glob('*/*/*.a8s') if p.name.lower()!='accountdata.a8s'),key=lambda p:p.stat().st_mtime)
with RDAArchive(path) as archive:outer=inflate(archive.read('data.a7s'))
sessions=[];routes=[]
for where,node in select(outer,lambda p: p[:2]==('MetaGameManager','GameSessions') and len(p)==3 or p==('MetaGameManager','SessionTradeRouteManager','RouteMap')):
 if where[-1]=='RouteMap':routes=[tree(n) for n in node.children[1::2]][:8]
 else:
  b=node.at('SessionData/BinaryData')
  if b is not None and b.data:sessions.append(b.data)
del outer
found={'sea_objects':[],'object_paths':{},'ships':[],'granaries':[],'farm_buffs':[],'route_records':routes};counts=Counter()
for data in sessions:
 for where,obj in select(data,lambda p:len(p)<10 and p[-2:]==('objects','_'),omit=('Mesh','FeedbackController','Infolayer')):
  guid=integer(obj.get('guid'));
  if where[2] in ('AreaManager_1','AreaManager_2','AreaManager_3','AreaManager_4') and len(found['sea_objects'])<12:found['sea_objects'].append({'guid':guid,'fields':tree(obj)})
  asset=catalogue.get(str(guid),{});template=asset.get('template','')
  found['object_paths']['/'.join(where[:-1])]=found['object_paths'].get('/'.join(where[:-1]),0)+1
  if 'ship' in template.lower() or any(obj.get(k) is not None for k in ('Walking','Ship','Sailing','Movement','TradeRouteVehicle')):
   counts['ships']+=1
   if len(found['ships'])<4:found['ships'].append({'guid':guid,'template':template,'fields':tree(obj)})
  if guid in granaries:
   counts['granaries']+=1
   if len(found['granaries'])<4:found['granaries'].append({'guid':guid,'fields':tree(obj)})
  if obj.get('Factory7') is not None and obj.get('Buffable') is not None and len(found['farm_buffs'])<3:
   found['farm_buffs'].append({'guid':guid,'buffable':tree(obj.get('Buffable'))})
(root/'build/transport-coverage-private.json').write_text(json.dumps(found,indent=2,allow_nan=False),encoding='utf-8')
print(json.dumps({'sea_fields':[{'guid':o['guid'],'fields':list(o['fields'])} for o in found['sea_objects']],'counts':counts,'ship_fields':[list(x['fields']) for x in found['ships']],'granary_fields':[list(x['fields']) for x in found['granaries']],'farm_buff_fields':[list(x['buffable']) for x in found['farm_buffs']]}))
