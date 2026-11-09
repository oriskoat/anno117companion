"""Bounded local numeric evidence for dashboard fields; never changes a save."""
import sys,json,struct,re
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from save_reader.reader import *
from save_reader.service import default_accounts
from save_reader.vendor.parser.filedb.dom import iter_dom,EventKind
root=Path(__file__).resolve().parents[1]
path=max((p for p in default_accounts().glob('*/*/*.a8s') if p.name.lower()!='accountdata.a8s'),key=lambda p:p.stat().st_mtime)
with RDAArchive(path) as archive:outer=inflate(archive.read('data.a7s'))
sessions=[]
for where,node in select(outer,lambda p:p[:2]==('MetaGameManager','GameSessions') and len(p)==3):
 b=node.at('SessionData/BinaryData')
 if b is not None and b.data:sessions.append(b.data)
def scan(data,scope):
 path=[];rows=[];seen=set()
 for event in iter_dom(data,detect_version(data),tag_section=parse_tag_section(data,detect_version(data))):
  if event.kind is EventKind.TERMINATOR:
   if path:path.pop()
   continue
  name=event.name or '_';here=path+[name];joined='/'.join(here)
  if event.kind is EventKind.TAG:path.append(name)
  # Domain path names first; capture only small scalars, never object coordinates or text.
  if len(here)<=9 and re.search(r'Population|Resident|Workforce|Knowledge|Research|Money|Balance|Income|Economy|Participant',joined,re.I):
   shape='/'.join(here)
   if shape in seen:continue
   seen.add(shape)
   b=event.content if event.kind is not EventKind.TAG else None
   row={'path':shape,'size':len(b) if b is not None else None}
   if b is not None and len(b) in (1,2,4,8):
    row['int']=int.from_bytes(b,'little',signed=True)
    if len(b)==4:
     f=struct.unpack('<f',b)[0]
     if math.isfinite(f):row['float']=f
    if len(b)==8:
     f=struct.unpack('<d',b)[0]
     if math.isfinite(f):row['double']=f
   rows.append(row)
 return rows[:2000]
rows={'outer':scan(outer,'outer'),'session':scan(sessions[0],'session')}
(root/'build/empire-overview-evidence.json').write_text(json.dumps(rows,indent=2),encoding='utf-8')
print(json.dumps({k:[r for r in v if re.search(r'Population|Resident|Knowledge|Research|Money|Balance|Income',r['path'],re.I)] for k,v in rows.items()},indent=2)[:18000])
