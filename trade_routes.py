"""User-authored route plans. The pipe never supplies or executes trade orders."""
import copy
import json
import math
import re
import threading
from pathlib import Path


def bounded_text(value,limit,empty=False):
    if not isinstance(value,str) or len(value)>limit or (not empty and not value.strip()):raise ValueError('Invalid text')
    return value.strip()


def identifier(value):
    if not isinstance(value,str) or not re.fullmatch(r'[A-Za-z0-9_-]{1,80}',value):raise ValueError('Invalid identifier')
    return value


def quantity(value,integer=False):
    if value is None:return None
    if isinstance(value,bool) or not isinstance(value,(int,float)) or not math.isfinite(value) or not 0<value<=1_000_000:raise ValueError('Invalid quantity')
    if integer and (int(value)!=value or value>100):raise ValueError('Invalid slot count')
    return value


def validate_planner(value):
    if not isinstance(value,dict):raise ValueError('Invalid planner document')
    def visit(v,depth=0):
        if depth>9:raise ValueError('Planner document too deep')
        if isinstance(v,dict):
            if len(v)>200:raise ValueError('Planner document too large')
            for k,x in v.items():
                if not isinstance(k,str) or len(k)>120:raise ValueError('Invalid planner key')
                visit(x,depth+1)
        elif isinstance(v,list):
            if len(v)>150:raise ValueError('Planner list too large')
            for x in v:visit(x,depth+1)
        elif isinstance(v,str):
            if len(v)>600:raise ValueError('Planner text too long')
        elif isinstance(v,(int,float)) and not isinstance(v,bool):
            if not math.isfinite(v) or abs(v)>1e9:raise ValueError('Invalid planner number')
        elif v is not None and not isinstance(v,bool):raise ValueError('Invalid planner value')
    visit(value)
    if len(json.dumps(value,allow_nan=False).encode())>100000:raise ValueError('Planner document too large')
    return copy.deepcopy(value)


def validate_plan(routes,skipped):
    if not isinstance(routes,list) or len(routes)>100 or not isinstance(skipped,list) or len(skipped)>1000:raise ValueError('Plan too large')
    cleaned=[];ids=set()
    for route in routes:
        rid=identifier(route['id'])
        if rid in ids:raise ValueError('Duplicate route')
        ids.add(rid);stops=[];stop_ids=set()
        if not isinstance(route['stops'],list) or not 2<=len(route['stops'])<=30:raise ValueError('Two to thirty stops required')
        for stop in route['stops']:
            sid=identifier(stop['id'])
            if sid in stop_ids:raise ValueError('Duplicate stop')
            stop_ids.add(sid)
            stops.append({'id':sid,'areaKey':bounded_text(stop.get('areaKey',''),100,True),'name':bounded_text(stop['name'],160)})
        cargo=[]
        if not isinstance(route['cargo'],list) or not 1<=len(route['cargo'])<=100:raise ValueError('Cargo required')
        cargo_ids=set()
        for item in route['cargo']:
            cid=identifier(item['id']);guid=item['productGuid']
            if cid in cargo_ids or isinstance(guid,bool) or not isinstance(guid,int) or not 0<guid<2**31:raise ValueError('Invalid cargo')
            cargo_ids.add(cid)
            if item['from'] not in stop_ids or item['to'] not in stop_ids or item['from']==item['to']:raise ValueError('Invalid cargo stops')
            cargo.append({'id':cid,'productGuid':guid,'productName':bounded_text(item.get('productName',''),160,True),'from':item['from'],'to':item['to'],
                          'amount':quantity(item.get('amount')),'hintRate':quantity(item.get('hintRate')),
                          'suggestionKey':bounded_text(item.get('suggestionKey',''),500,True)})
        cleaned.append({'id':rid,'name':bounded_text(route['name'],160),'ship':bounded_text(route.get('ship',''),160,True),
                        'slots':quantity(route.get('slots'),True),'slotCapacity':quantity(route.get('slotCapacity')),'stops':stops,'cargo':cargo})
    return cleaned,list(dict.fromkeys(bounded_text(k,500) for k in skipped))


class TradeRouteStore:
    def __init__(self,path=None):
        self.path=Path(path) if path else None;self.lock=threading.Lock();self.contexts={}
        if self.path and self.path.is_file():
            try:
                if self.path.stat().st_size>4_000_000:raise ValueError('Plan file too large')
                saved=json.loads(self.path.read_text(encoding='utf-8'))
                if saved.get('schema')!=1:raise ValueError('Unsupported plan format')
                for context,doc in saved['contexts'].items():
                    bounded_text(context,240)
                    routes,skipped=validate_plan(doc['routes'],doc.get('skipped',[]))
                    if not isinstance(doc['revision'],int) or doc['revision']<0:raise ValueError('Invalid revision')
                    self.contexts[context]={'revision':doc['revision'],'routes':routes,'skipped':skipped}
                    if 'planner' in doc:self.contexts[context]['planner']=validate_planner(doc['planner'])
            except (OSError,ValueError,KeyError,TypeError):
                # Preserve a corrupt file: saving requires an explicit repair first.
                self.contexts={};self.load_failed=True

    def index(self):
        with self.lock:
            return {'contexts':[{'context':key,'routes':len(doc['routes']),'name':doc['routes'][0]['name'] if doc['routes'] else key,'islands':list(dict.fromkeys(s['name'] for r in doc['routes'] for s in r['stops']))[:4]} for key,doc in list(self.contexts.items())[-100:]]}

    def get(self,context):
        bounded_text(context,240)
        with self.lock:return copy.deepcopy(self.contexts.get(context,{'revision':0,'routes':[],'skipped':[]}))

    def put(self,context,revision,routes,skipped,planner=None):
        bounded_text(context,240)
        if isinstance(revision,bool) or not isinstance(revision,int) or revision<0:raise ValueError('Invalid revision')
        routes,skipped=validate_plan(routes,skipped)
        if planner is not None:planner=validate_planner(planner)
        with self.lock:
            if getattr(self,'load_failed',False):raise OSError('Existing route file needs repair')
            old=self.contexts.get(context,{'revision':0,'routes':[],'skipped':[]})
            if old['revision']!=revision:return 409,copy.deepcopy(old)
            document={'revision':revision+1,'routes':routes,'skipped':skipped}
            if planner is not None or 'planner' in old:document['planner']=planner if planner is not None else copy.deepcopy(old['planner'])
            contexts={**self.contexts,context:document}
            if len(contexts)>100:raise ValueError('Too many plan collections')
            if self.path:
                body=json.dumps({'schema':1,'contexts':contexts},ensure_ascii=False,allow_nan=False)
                if len(body.encode('utf-8'))>4_000_000:raise ValueError('Plan file too large')
                self.path.parent.mkdir(parents=True,exist_ok=True)
                temp=self.path.with_suffix('.tmp');temp.write_text(body,encoding='utf-8');temp.replace(self.path)
            self.contexts=contexts
            return 200,copy.deepcopy(document)
