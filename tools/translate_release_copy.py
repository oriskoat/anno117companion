"""Translate authored UI text from synthetic fixtures only. Explicit network opt-in."""
import argparse,json,re,time,urllib.request,urllib.parse,concurrent.futures
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];D=ROOT/'android-probe/app/src/main/assets/dashboard'
LANGS={'de':'de','fr':'fr','it':'it','es':'es','ja':'ja','ko':'ko','pl':'pl','pt-BR':'pt','ru':'ru','zh-CN':'zh-CN','zh-TW':'zh-TW'}
EXTRA=['Build readiness','Choose different save','People & patrons','Your chain','General catalogue scenario','Same final output','Base workforce','Save mismatch','Draft saved on this device','Draft could not be saved on this device','Island scenario','Catalogue scenario','Fewer buildings','Lower base workforce','Lower nominal upkeep','Smaller seasonal reserve','Dispatch interval','Loading allowance','Research','Permit','Permits','Completed','Queued','Not completed','Resources for this proposal','Nominal upkeep / min','Specialist island allocations','Construction materials & specialist locations','Previous plans & observations','Review before importing','Previous name-based observations','Find previous plans','Import reviewed data into this campaign','Construction materials','Fleet feasibility & observed cycle bounds','Use observed cycle bound','Ships required','Ship cycle','Recorded residents','statistics may be older','Manual selection','Automatic selection','fresh pipe comparison unavailable','Unlock recorded','Research unlock recorded','Research still required','Producer recorded operating here','Check unlock and placement in game','Locked in the selected save','Stored copy reserved','Acquire or free another copy','Saved scenario','Temporary scenario','Your empire & planning','Finance & population details','Selected player','Income less expenses','Empire total','Saved population attribute','Population by province, tier and island','Islands & patrons','Explicit residents','Base setup','Shared chain assumptions','Scenario scope & season','Deity & belief','What this scenario assumes','Construction costs are one-time requirements, separate from ongoing consumption. Coverage, slots, travel and actual placement still need verification.']
def norm(s):return re.sub(r'\s+',' ',s).strip().lower().removesuffix('.')
def translate(lang,items):
 source=items[0] if len(items)==1 else '\n'.join('__ID%04d__ %s'%(i,text) for i,text in enumerate(items));q=urllib.parse.urlencode({'client':'gtx','sl':'en','tl':LANGS[lang],'dt':'t','q':source});last=None
 for attempt in range(3):
  try:
   request=urllib.request.Request('https://translate.googleapis.com/translate_a/single?'+q,headers={'User-Agent':'Anno117Companion-localization/1.0'})
   with urllib.request.urlopen(request,timeout=30) as r:data=json.load(r)
   output=''.join(x[0] for x in data[0] if x and x[0]);
   if len(items)==1:return [output.strip() or items[0]]
   parts=re.split(r'__ID\s*(\d{4})__\s*',output,flags=re.I);result={}
   for i in range(1,len(parts)-1,2):result[int(parts[i])]=parts[i+1].strip()
   if len(result)!=len(items) or any(not v or '__id' in v.lower() for v in result.values()):
    if len(items)>1:
     mid=len(items)//2;return translate(lang,items[:mid])+translate(lang,items[mid:])
    # Single marker may be changed by a language-specific tokenizer.
    result={0:re.sub(r'^.*?ID.{0,8}?(?:__|:|：)\s*','',output).strip()}
   return [result[i] for i in range(len(items))]
  except Exception as e:last=e;time.sleep(2*(attempt+1))
 raise RuntimeError(type(last).__name__+' for '+lang)
def main():
 p=argparse.ArgumentParser();p.add_argument('--allow-network',action='store_true');a=p.parse_args()
 if not a.allow_network:raise SystemExit('Explicit --allow-network required; only authored source text is eligible.')
 sources=json.loads((ROOT/'build/release-copy.json').read_text(encoding='utf-8'))+EXTRA
 cap=json.loads((D/'capability-data.js').read_text(encoding='utf-8').split('=',1)[1].strip().removesuffix(';'));game_names={t['name'] for t in cap['techs'].values()}
 sources=list(dict.fromkeys(s for s in sources if s not in game_names and s not in ['ANNO','THE COMPANION'] and not re.search(r'Nov \d|Jan \d|http://|https://|192\.168\.|__ID',s)))
 folder=ROOT/'localization/release-copy';folder.mkdir(exist_ok=True)
 def language(lang):
  file=folder/(lang+'.json');result=json.loads(file.read_text(encoding='utf-8')) if file.exists() else {};pending=[s for s in sources if norm(s) not in result];batches=[];current=[];size=0
  for text in pending:
   if current and size+len(text)>2300:batches.append(current);current=[];size=0
   current.append(text);size+=len(text)+20
  if current:batches.append(current)
  for index,batch in enumerate(batches):
   values=translate(lang,batch)
   for text,value in zip(batch,values):
    if not value or '__ID' in value:raise RuntimeError('Invalid translated UI text')
    result[norm(text)]=value
   file.write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8');time.sleep(.15)
  print(lang,len(result),'UI strings',flush=True);return lang,result
 with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:results=dict(pool.map(language,LANGS))
 js='/* Authored UI translations; official game names remain in game dictionaries. */\n(function(){const rows='+json.dumps(results,ensure_ascii=False,separators=(',',':'))+';for(const [lang,values] of Object.entries(rows)){const dict=window.annoUI[lang]||(window.annoUI[lang]={});for(const [key,value] of Object.entries(values))if(!dict[key])dict[key]=value;delete localePatterns[lang];delete localeLexicons[lang];}window.localizeUI?.();})();\n'
 (D/'release-locales.js').write_text(js,encoding='utf-8');(folder/'provenance.json').write_text(json.dumps({'provider':'Google public text translation endpoint','content':'Authored UI text collected exclusively from synthetic examples; no saves, credentials or user content','languages':list(LANGS),'source_count':len(sources),'review':'Automated completeness checks and critical-label review; not a professional translation certification'},indent=2),encoding='utf-8')
if __name__=='__main__':main()
