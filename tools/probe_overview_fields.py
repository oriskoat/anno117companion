import sys,json,struct,math
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from save_reader.reader import *
from save_reader.service import default_accounts
root=Path(__file__).resolve().parents[1];cache=json.loads((root.parent/'Anno117Companion-Beta/bridge-settings/save-insights-cache.json').read_text())['snapshot'];owned={a['area_id'] for a in cache['areas']};owner=cache['participant']
path=max((p for p in default_accounts().glob('*/*/*.a8s') if p.name.lower()!='accountdata.a8s'),key=lambda p:p.stat().st_mtime)
with RDAArchive(path) as archive:outer=inflate(archive.read('data.a7s'))
def tree(n,depth=0):
 if n.data is not None:
  b=n.data;x={'bytes':len(b)}
  if len(b) in (1,2,4,8):x['i']=integer(n)
  if len(b)==4:x['f']=number(n)
  if n.name=='StrgLrg' and len(b)%4==0:x['words']=list(struct.unpack('<'+'I'*(len(b)//4),b))
  return x
 return [{c.name:tree(c,depth+1)} for c in n.children[:45]] if depth<7 else {'children':len(n.children)}
found={};sessions=[]
for p,n in select(outer,lambda p:p in [('MetaGameManager','EconomyManager'),('MetaGameManager','MetaMoneyManager')] or p[:2]==('MetaGameManager','GameSessions') and len(p)==3):
 if p[-1] in ('EconomyManager','MetaMoneyManager'):found[p[-1]]=tree(n)
 else:
  b=n.at('SessionData/BinaryData')
  if b is not None and b.data:sessions.append(b.data)
for data in sessions:
 for p,n in select(data,lambda p:len(p)==4 and p[:2]==('GameSessionManager','AreaManagers') and p[-1] in ('AreaPopulationManager','AreaEconomy','AreaKnowledgeManager','AreaNeedAttributeManager')):
  aid=int(p[2].removeprefix('AreaManager_'))
  if aid in owned and p[-1] not in found:found[p[-1]]=tree(n)
cat=Catalogue.read(root/'save_catalogue.json');residences={}
for data in sessions:
 for p,n in select(data,lambda p:len(p)==7 and p[:2]==('GameSessionManager','AreaManagers') and p[3:]==('AreaObjectManager','GameObject','objects','_'),omit=('Mesh','FeedbackController','Health','Building','Infolayer')):
  aid=int(p[2].removeprefix('AreaManager_'));g=integer(n.get('guid'));r=n.get('Residence7')
  if aid in owned and r is not None and g not in residences:
   residences[g]={'tier':cat.asset(g).get('tier_guid'),'residence':tree(r),'other':{c.name:tree(c) for c in n.children if any(k in c.name.lower() for k in ('popul','resident','attribute'))}}
found['residences']=residences
found['owner']=owner
(root/'build/overview-fields-private.json').write_text(json.dumps(found,indent=2),encoding='utf-8');print(json.dumps(found,indent=2)[:23000])
