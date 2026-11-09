"""Bounded route-transition observations. Never guesses sea paths or exact arrivals."""
import json,copy,math
from pathlib import Path

class VoyageHistory:
    def __init__(self,path=None):
        self.path=Path(path) if path else None;self.campaigns={}
        try:
            if self.path and self.path.stat().st_size<2_000_000:
                d=json.loads(self.path.read_text(encoding='utf-8'))
                if d.get('schema')==1:self.campaigns=d.get('campaigns',{})
        except (OSError,ValueError,TypeError):pass

    def observe(self,snapshot):
        context=snapshot.get('campaign_fingerprint');clock=snapshot.get('simulator_clock',{}).get('GameTotal')
        if not context or (not isinstance(clock,(int,float)) or isinstance(clock,bool) or not math.isfinite(clock) or clock<0):return []
        state=self.campaigns.get(context,{'clock':clock,'ships':{},'cycles':[]})
        if clock<state['clock']:state={'clock':clock,'ships':{},'cycles':[]}
        routes={r['id']:{s.get('station_id') for s in r['stops']} for r in snapshot.get('routes',[])}
        for ship in snapshot.get('transport',{}).get('ships',[]):
            rid,target=ship.get('route_id'),ship.get('target_station_id');sid=ship['meta_id']
            if rid not in routes or target not in routes[rid]:continue
            previous=state['ships'].get(sid)
            if previous and previous['route']==rid and clock>previous['clock']:
                events=previous.get('events',[])
                if target!=previous['target']:
                    event={'station':previous['target'],'lo':previous['clock'],'hi':clock}
                    prior=next((e for e in reversed(events) if e['station']==event['station']),None)
                    if prior and any(e['station']!=event['station'] for e in events if e['lo']>=prior['lo']):
                        low=max(0,(event['lo']-prior['hi'])/60000);high=(event['hi']-prior['lo'])/60000
                        state['cycles'].append({'route_id':rid,'ship_id':sid,'minimum_minutes':low,'maximum_minutes':high,'resolution_minutes':(event['hi']-event['lo']+prior['hi']-prior['lo'])/60000,'observed_game_ms':clock,'status':'bounded_target_transitions'})
                    events=(events+[event])[-16:]
                previous={'route':rid,'target':target,'clock':clock,'events':events}
            else:previous={'route':rid,'target':target,'clock':clock,'events':previous.get('events',[]) if previous and previous['route']==rid else []}
            state['ships'][sid]=previous
        state['clock']=clock;state['cycles']=state['cycles'][-64:];self.campaigns[context]=state
        while len(self.campaigns)>8:self.campaigns.pop(next(iter(self.campaigns)))
        if self.path:
            try:
                self.path.parent.mkdir(parents=True,exist_ok=True);tmp=self.path.with_suffix('.tmp');tmp.write_text(json.dumps({'schema':1,'campaigns':self.campaigns},separators=(',',':')),encoding='utf-8');tmp.replace(self.path)
            except OSError:
                pass # Optional history persistence must not invalidate the save snapshot.
        return copy.deepcopy(state['cycles'])
