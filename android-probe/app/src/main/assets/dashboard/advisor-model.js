/* Deterministic planning scenarios. No game commands or inferred ship throughput. */
(function(root){'use strict';
const finite=(v,fallback=0)=>Number.isFinite(Number(v))?Number(v):fallback;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const f32=Math.fround;
const recipe=typeof module!=='undefined'?require('./production-model.js'):root.ProductionModel;
function upgrade(base,entries){let a=base,r=0;for(const e of entries){const v=Math.trunc(f32(f32(e.value)*f32(e.scale??1)));if(e.percental)r+=v;else a+=v;}return Math.max(0,a+Math.trunc(a*r/100));}
function buffs(rules,entries){const groups=new Map();for(const entry of entries){const b=rules.buffs[entry.guid];if(!b)continue;const g=groups.get(entry.guid)||[];if(!g.length||b.stackable)g.push(entry);groups.set(entry.guid,g);}return [...groups.values()].flatMap(g=>g.map(()=>({...g.at(-1),buff:rules.buffs[g.at(-1).guid]})));}
function scenario(factory,good,rules,options={},phase='dry'){
 const out=factory.outputs.find(o=>o.product_guid===good);if(!out)return {rate:0,inputs:[],reason:'No matching output'};
 const resolved=buffs(rules,options.entries||[]),entries=resolved.filter(x=>x.buff.productivity).map(x=>({...x.buff.productivity,scale:x.scale??1}));
 const affected=rules.seasons.targets.includes(factory.factory_guid);
 if(affected&&phase==='flood')entries.push({value:rules.seasons.flood_relative,percental:true,scale:options.floodScale??1});
 let fertility=options.naturalFertility===false?0:1;
 if(factory.fertility_guid&&fertility<1)for(const x of resolved)if(x.buff.fertility?.guid===factory.fertility_guid)fertility+=x.buff.fertility.percent/100;
 if(!factory.fertility_guid)fertility=1;fertility=clamp(fertility,0,1);
 const speed=upgrade(finite(options.baseProductivity,100),entries)/100*clamp(finite(options.moduleFactor,1),0,5)*clamp(finite(options.workforceFactor,1),0,2)*fertility;
 const cycles=60/factory.cycle_seconds*speed*clamp(finite(options.count,1),0,500);
 let extra=affected&&phase==='dry'?rules.seasons.dry_extra_per_cycle:0,side=[];
 for(const x of resolved)for(const e of x.buff.extra||[]){if(e.limited_lode)continue;let interval=e.cycle,amount=e.amount;if(e.scale_cycle)interval=Math.max(1,Math.trunc(interval*(x.scale??1)));if(e.scale_amount)amount*=x.scale??1;amount=Math.trunc(amount+.001);if(!(interval>0))continue;const target=e.same_product?good:e.product;if(target===good)extra+=amount/interval;else side.push({guid:target,rate:cycles*amount/interval});}
 return {rate:cycles*(out.amount_per_cycle+extra),baseRate:cycles*out.amount_per_cycle,extraRate:cycles*extra,cycles,speed,fertility,affected,inputs:recipe.inputs(factory,cycles,speed*clamp(finite(options.count,1),0,500)),side};
}
function seasonAt(t,season,clock,rules){if(!season||!Number.isFinite(season.end_tick)||!Number.isFinite(clock))return 'dry';let remaining=Math.max(0,(season.end_tick-clock)/60000),phase=season.guid===rules.seasons.flood?'flood':'dry';if(t<remaining)return phase;t-=remaining;phase=phase==='dry'?'flood':'dry';for(let i=0;i<30;i++){const duration=phase==='dry'?rules.seasons.dry_minutes:rules.seasons.flood_minutes;if(t<duration)return phase;t-=duration;phase=phase==='dry'?'flood':'dry';}return phase;}
function project(nodes,transfers,horizon=300){
 horizon=clamp(finite(horizon,300),1,720);const states=nodes.map(n=>({...n,stock:n.stock===null?null:Math.max(0,finite(n.stock)),minimum:n.stock===null?null:Math.max(0,finite(n.stock)),unmet:0,spilled:0,series:[],firstEmpty:null})),byKey=new Map(states.map(n=>[n.key,n]));
 const events=[];let planned=0;
 for(const r of transfers){if(!(r.cycle>0&&r.amount>0)||r.from===r.to||!byKey.has(r.from)||!byKey.has(r.to))continue;const first=clamp(finite(r.first,0),0,720),travel=clamp(finite(r.travel,r.cycle/2),.01,720);for(let t=first;t<=horizon;t+=r.cycle){events.push({t,type:'departure',route:r,travel});if(++planned>10000)throw Error('Too many shipment events. Increase the round-trip interval.');}}
 events.sort((a,b)=>a.t-b.t);let cursor=0,arrivalQueue=[],cargoLoaded=0,cargoDelivered=0,shortLoad=0;
 for(let t=0;t<=horizon+1e-8;){
  const arrivals=arrivalQueue.filter(e=>e.t<=t+1e-8);arrivalQueue=arrivalQueue.filter(e=>e.t>t+1e-8);
  for(const e of arrivals){const n=byKey.get(e.to);if(n.stock!==null){const cap=n.capacity??Infinity,room=Math.max(0,cap-n.stock);n.spilled+=Math.max(0,e.amount-room);n.stock=Math.min(cap,n.stock+e.amount);}cargoDelivered+=e.amount;}
  while(cursor<events.length&&events[cursor].t<=t+1e-8){const e=events[cursor++],n=byKey.get(e.route.from);let amount=e.route.amount;if(n.stock!==null){amount=Math.min(amount,n.stock);n.stock-=amount;}shortLoad+=e.route.amount-amount;cargoLoaded+=amount;arrivalQueue.push({t:t+e.travel,to:e.route.to,amount});}
  for(const n of states){if(n.stock!==null){n.minimum=Math.min(n.minimum,n.stock);if(n.stock<=1e-6&&n.firstEmpty===null)n.firstEmpty=t;}n.series.push({t,stock:n.stock});}
  if(t>=horizon-1e-8)break;
  const next=Math.min(horizon,t+1,events[cursor]?.t??Infinity,...arrivalQueue.map(e=>e.t).filter(v=>v>t+1e-8),...nodes.flatMap(n=>n.breakpoints||[]).filter(v=>v>t+1e-8));if(next<=t+1e-9)throw Error('Invalid timeline');
  const dt=next-t;
  for(const n of states){const p=typeof n.production==='function'?n.production(t+dt/2):finite(n.production),c=finite(n.consumption);if(n.stock!==null){const value=n.stock+(p-c)*dt;n.unmet+=Math.max(0,-value);n.spilled+=Math.max(0,value-(n.capacity??Infinity));n.stock=clamp(value,0,n.capacity??Infinity);}}
  t=next;
 }
 return {nodes:states,cargoLoaded,cargoDelivered,shortLoad,inTransit:arrivalQueue.reduce((s,a)=>s+a.amount,0),horizon,unknownStocks:states.filter(n=>n.stock===null).length};
}
function reserve(segments){let cumulative=0,minimum=0;for(const s of segments){cumulative+=s.minutes*s.net;minimum=Math.min(minimum,cumulative);}return -minimum;}
function chainRatio(factories,raw,finished,region,visited=new Set()){
 if(raw===finished)return 1;if(visited.has(finished)||visited.size>8)return null;
 const seen=new Set(visited);seen.add(finished);const candidates=factories.filter(f=>f.regions.includes(region)&&f.outputs.some(o=>o.product_guid===finished));
 const values=[];for(const f of candidates){const output=f.outputs.find(o=>o.product_guid===finished).amount_per_cycle;let total=0,found=false;for(const input of f.inputs){const ratio=chainRatio(factories,raw,input.product_guid,region,seen);if(ratio!==null){found=true;total+=ratio*input.amount_per_cycle/output;}}if(found)values.push(total);}return values.length?Math.min(...values):null;
}
const api={upgrade,buffs,scenario,seasonAt,project,reserve,chainRatio};root.AdvisorModel=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
