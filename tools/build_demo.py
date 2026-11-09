"""One deterministic fictional empire for application, tests and release screenshots."""
import json,math
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];D=ROOT/'android-probe/app/src/main/assets/dashboard'
def js(name):return json.loads((D/name).read_text(encoding='utf-8').split('=',1)[1].strip().removesuffix(';'))
def build():
    snapshot=json.loads((D/'demo.json').read_text(encoding='utf-8'));snapshot.pop('saved_insights',None)
    K,N,AR,CAP=js('knowledge.js'),js('needs-data.js'),js('advisor-data.js'),js('capability-data.js');areas=[];people=0
    for i,a in enumerate(snapshot['areas']):
        region={3245:'Latium',6627:'Albion',149679:'Aegyptus'}[a['session_guid']];key=f"{a['session_id']}:{a['island_id']}:{a['area_index']}";tiers=[t for t in N['tiers'] if t['region']==region];housing=[]
        for j,t in enumerate(tiers):
            count=12+i*3+j*2;residents=count*(10+j*8);people+=residents;housing.append({'building_guid':t['residence'],'tier_guid':t['guid'],'tier_name':t['tier'],'count':count,'residents':residents,'resident_count_recorded':count})
        fertilities=[{'guid':g,'name':'Example fertility'} for g in sorted({f['fertility_guid'] for f in K['factories'] if region in f['regions'] and f['fertility_guid']})]
        instances=[]
        for e in a['entries']:
            f=next((f for f in K['factories'] if region in f['regions'] and f['outputs'][0]['product_guid']==e['ProductGuid']),None)
            if not f or e['ProductGeneration']<=0:continue
            count=max(1,math.ceil(e['ProductGeneration']/f['outputs'][0]['amount_per_minute_100pct']));productivity=e['ProductGeneration']/count/f['outputs'][0]['amount_per_minute_100pct']
            instances.extend({'id':f'example-{i}-{f["factory_guid"]}-{n}','guid':f['factory_guid'],'productivity':productivity,'module_ids':[],'water_source_id':None} for n in range(count))
        need_states=[]
        for h in housing:
            for e in a['entries']:
                if not any(n['product_guid']==e['ProductGuid'] and n['tier']==h['tier_name'] and n['region']==region for n in N['needs']):continue
                full=h['count'] if e['ProductDelta']>=0 else h['count']//2
                need_states.append({'tier_guid':h['tier_guid'],'tier_name':h['tier_name'],'product_guid':e['ProductGuid'],'name':e['ProductNameEnglish'],'tracked_houses':h['count'],'explicit_full':full,'explicit_partial':h['count']-full,'explicit_zero':0,'omitted':0})
        area={'area_key':key,'area_id':a['session_id']|(a['island_id']<<6)|(a['area_index']<<13),'session_id':a['session_id'],'session_guid':a['session_guid'],'name':a['area_name'],'region':region,'owner':1,'fertilities':fertilities,'residence_count':sum(h['count'] for h in housing),'housing':housing,'need_states':need_states,'buildings':[],'inventory':[{'product_guid':e['ProductGuid'],'name':e['ProductNameEnglish'],'samples':[150,160,170],'latest_sample':170,'last_point_tick':0} for e in a['entries']],'production_context':{'instances':instances,'warehouses':[{'guid':150645 if region=='Aegyptus' else 3402,'registered_capacity':550}],'current_stocks':[{'guid':e['ProductGuid'],'amount':170,'full_capacity':False} for e in a['entries']],'effects':[],'session_effects':[],'religion':{'patron_guid':153803 if region=='Aegyptus' else 43594,'belief':2200+i*400},'season':{'guid':150490,'next_guid':150491,'start_tick':0,'end_tick':10800000} if region=='Aegyptus' else None,'volcano':{'guid':145352,'active':1,'remaining_ms':28.16*60000} if region=='Latium' else None}}
        areas.append(area)
    routes=[{'id':900+i,'name':'Example '+r['product_name']+' Supply','ship_ids':[100+i],'stops':[{'station_id':1000+i*2,'area_key':r['from_area_key'],'name':r['from_area'],'goods':[{'product_guid':r['product_guid'],'name':r['product_name'],'amount':50,'action':'load'}]},{'station_id':1001+i*2,'area_key':r['to_area_key'],'name':r['to_area'],'goods':[{'product_guid':r['product_guid'],'name':r['product_name'],'amount':50,'action':'unload'}]}]} for i,r in enumerate(snapshot['supply_suggestions'][:3])]
    owned=[{'instance_id':'example-specialist-'+str(i),'guid':s['guid'],'name':s['name'],'kind':'Specialist','state':'stored','source':'global','area_key':None} for i,s in enumerate([s for s in K['specialists'] if s['status']!='placeholder/test'][:3])]
    completed=[26909,81220];queued=[next(int(g) for g,t in CAP['techs'].items() if int(g) not in completed)]
    snapshot['saved_insights']={'schema':8,'synthetic':True,'profile_name':'Example Empire','campaign_fingerprint':'synthetic-example-v2','saved_at':snapshot['recorded_at'],'parsed_at':'synthetic-example-v2','simulator_clock':{'GameTotal':0},'production_context':{'global_effects':[],'flood_gate_state':0},'areas':areas,'routes':routes,'owned_items':owned,'empire':{'participant':1,'treasury':1250000,'income_per_minute':7800,'expenses_per_minute':5900,'balance_per_minute':1900,'attributes':{'population':people,'knowledge':24500,'belief':sum(a['production_context']['religion']['belief'] for a in areas),'prestige':9500},'resources':[{'guid':int(g),'amount':3+i} for i,g in enumerate(CAP['permits'])]},'progression':{'completed_techs':completed,'research_queue':queued,'tech_progress':[],'locks':[]},'transport':{'ships':[],'cycle_observations':[]},'limitations':['All example values are fictional and separate from your game.']}
    (D/'demo.json').write_text(json.dumps(snapshot,ensure_ascii=False,separators=(',',':')),encoding='utf-8');return snapshot
if __name__=='__main__':
    d=build();print('Coherent demo:',len(d['areas']),'islands,',len(d['saved_insights']['routes']),'routes')
