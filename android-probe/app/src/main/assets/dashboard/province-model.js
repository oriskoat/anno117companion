/* Deterministic, conservative allocation. Existing input demand is never counted twice. */
(function(root){'use strict';
const EPS=1e-7;
const shipping=typeof module!=='undefined'?require('./shipping-model.js'):root.ShippingModel;
const sum=(rows,fn)=>rows.reduce((s,r)=>s+fn(r),0);
const demandKey=(area,good)=>area+'|'+good;
function average(phases,field='rate'){const duration=sum(phases,p=>p.minutes);return duration?sum(phases,p=>p[field]*p.minutes)/duration:0;}
function normalizedSettings(input={}){
 const number=(key,fallback,min,max)=>Number.isFinite(Number(input[key]))?Math.max(min,Math.min(max,Number(input[key]))):fallback;
 return {loading:number('loading',2,0,60),timingOverrides:input.timingOverrides||{},objective:['preserve','consolidate','buildings','workforce','upkeep','storage'].includes(input.objective)?input.objective:'preserve',horizon:number('horizon',300,30,720),interval:number('interval',15,1,120),travel:number('travel',5,.1,120),buffer:number('buffer',5,0,120),slots:Math.floor(number('slots',4,1,20)),slotCapacity:number('slotCapacity',50,1,1000)};
}
function makeDemands(areas,scope,extra){const map=new Map();for(const a of areas)if(scope.has(a.key))for(const e of a.entries){if(!Number.isFinite(e.consumption)||e.consumption<0)throw Error('Invalid consumption');map.set(demandKey(a.key,e.guid),{area:a.key,good:e.guid,baseline:e.consumption,rate:e.consumption});}for(const row of extra.values()){const key=demandKey(row.area,row.good),d=map.get(key)||{area:row.area,good:row.good,baseline:0,rate:0};d.rate=Math.max(0,d.rate+row.rate);map.set(key,d);}return map;}
function allocate(input,extra,settings){
 const scope=new Set(input.scopeKeys),areaMap=new Map(input.areas.map(a=>[a.key,a])),demands=makeDemands(input.areas,scope,extra),providers=input.providers.map(p=>({...p,unitAverage:average(p.phases),allocated:0,assignments:[],outside:!scope.has(p.area)}));
 const protectedGoods=new Set(input.protectedGoods||[]),capacityByAreaGood=new Map();
 for(const p of providers){p.capacity=p.unitAverage*p.ownedCount;const k=demandKey(p.area,p.good);capacityByAreaGood.set(k,(capacityByAreaGood.get(k)||0)+p.capacity);}
 for(const p of providers){const total=capacityByAreaGood.get(demandKey(p.area,p.good))||0,local=areaMap.get(p.area)?.entries.find(e=>e.guid===p.good)?.consumption||0;
  if(p.outside)p.capacity=Math.max(0,p.capacity-(total?local*p.capacity/total:0));
  else if(protectedGoods.has(p.good))p.capacity=total?p.capacity*Math.min(1,local/total):0;
 }
 const flows=[],missing=[];
 const assign=(p,d,amount)=>{if(amount<=EPS)return;p.allocated+=amount;p.assignments.push({to:d.area,rate:amount});d.remaining-=amount;if(p.area!==d.area)flows.push({from:p.area,to:d.area,good:d.good,rate:amount,outside:p.outside});};
 const rows=[...demands.values()].map(d=>({...d,remaining:d.rate})).sort((a,b)=>a.good-b.good||a.area.localeCompare(b.area));
 const score=(p,d)=>{const local=p.area===d.area,link=(input.connections||[]).some(r=>r.good===d.good&&r.from===p.area&&r.to===d.area);if(['workforce','upkeep','buildings','storage'].includes(settings.objective)){const metric=settings.objective==='upkeep'?(p.nominal?.upkeep??10000):settings.objective==='workforce'?(p.nominal?.workforce??10000):settings.objective==='storage'?root.IslandModel.designCycle(p.phases,Math.min(d.remaining,p.capacity)).reserve:1;return -metric/Math.max(EPS,p.unitAverage)*1000+(local?5:0)+(link?2:0)-(p.outside?100:0);}return settings.objective==='consolidate'?p.unitAverage*1000+(local?5:0)+(link?2:0)-(p.outside?100:0):(local?100000:0)+(link?1000:0)-(p.outside?100:0)+p.unitAverage;};
 for(const d of rows){const eligible=providers.filter(p=>p.good===d.good&&p.capacity-p.allocated>EPS).sort((a,b)=>score(b,d)-score(a,d)||a.id.localeCompare(b.id));for(const p of eligible){assign(p,d,Math.min(d.remaining,p.capacity-p.allocated));if(d.remaining<=EPS)break;}}
 for(const d of rows){if(d.remaining<=EPS)continue;const candidates=(input.candidates||[]).filter(p=>p.good===d.good&&scope.has(p.area)&&average(p.phases)>EPS).sort((a,b)=>{
   const cost=p=>{const allocated=providers.find(x=>x.id==='new:'+p.id)?.allocated||0,avg=average(p.phases);const count=Math.ceil((allocated+d.remaining)/avg-EPS)-Math.ceil(allocated/avg-EPS),weight=settings.objective==='workforce'?(p.nominal?.workforce??50):settings.objective==='upkeep'?(p.nominal?.upkeep??50):1,reserve=settings.objective==='storage'?root.IslandModel.designCycle(p.phases,d.remaining).reserve:0;return count*weight+reserve+(p.area===d.area?0:.35)+(p.conditions?.length||0)*.05;};
   return cost(a)-cost(b)||average(b.phases)-average(a.phases)||a.id.localeCompare(b.id);
  });
  const candidate=candidates[0];if(!candidate){missing.push({area:d.area,good:d.good,rate:d.remaining,reason:'No eligible spare supply or verified production location in scope.'});continue;}
  let p=providers.find(p=>p.id==='new:'+candidate.id);if(!p){p={...candidate,id:'new:'+candidate.id,unitAverage:average(candidate.phases),ownedCount:0,capacity:Infinity,allocated:0,assignments:[],outside:false,newBuild:true};providers.push(p);}assign(p,d,d.remaining);
 }
 const policies=[];for(const p of providers){if(p.outside||p.allocated<=EPS)continue;const area=areaMap.get(p.area),good=area.goods?.[p.good]||{},limit=good.normalCapacity??good.capacity??null;
  const design=root.IslandModel.designCycle(p.phases,p.allocated,limit,settings.buffer);
  if(!p.newBuild&&design.count>p.ownedCount){missing.push({area:p.area,good:p.good,rate:Math.max(0,p.allocated-p.capacity),reason:'The selected producer count cannot support its allocation.'});continue;}
  policies.push({...p,design,protected:protectedGoods.has(p.good)});
 }
 const inputDemands=new Map();for(const p of policies)if(p.newBuild&&p.design.possible){const minutes=p.design.minutes;
  for(const phase of p.design.phases)for(const item of phase.inputs||[]){const rate=item.rate*p.design.count*phase.utilization*phase.minutes/minutes,key=demandKey(p.area,item.good),old=inputDemands.get(key)||{area:p.area,good:item.good,rate:0};old.rate+=rate;inputDemands.set(key,old);}
  for(const item of p.support||[]){const key=demandKey(p.area,item.good),old=inputDemands.get(key)||{area:p.area,good:item.good,rate:0};old.rate+=item.rate*p.design.count;inputDemands.set(key,old);}
 }
 if(input.inputCredits&&root.ChainModel){inputDemands.clear();for(const [k,v] of root.ChainModel.adjustments(input,policies))inputDemands.set(k,v);}
 const combined=new Map();for(const f of flows){const k=f.from+'|'+f.to+'|'+f.good;const old=combined.get(k)||{...f,rate:0};old.rate+=f.rate;combined.set(k,old);}
 return {scope,demands:rows,providers,policies,flows:[...combined.values()],missing,inputDemands};
}
function inputDistance(a,b){const keys=new Set([...a.keys(),...b.keys()]);return Math.max(0,...[...keys].map(k=>Math.abs((a.get(k)?.rate||0)-(b.get(k)?.rate||0))));}
function routeManifests(flows,settings){
 const pairs=new Map();for(const f of flows){const key=f.from+'|'+f.to;if(!pairs.has(key))pairs.set(key,[]);pairs.get(key).push(f);}
 const routes=[];let truncated=false;
 for(const list of pairs.values()){let route=null,used=0;const next=()=>{route={from:list[0].from,to:list[0].to,interval:settings.interval,travel:settings.travel,slots:settings.slots,slotCapacity:settings.slotCapacity,...shipping.fleet({interval:settings.interval,travel:settings.travel,loading:settings.loading,cycle:settings.timingOverrides?.[list[0].from+'|'+list[0].to]}),cargo:[]};routes.push(route);used=0;};
  for(const f of list.sort((a,b)=>a.good-b.good)){let amount=f.rate*settings.interval;
   while(amount>EPS){if(routes.length>=500){truncated=true;break;}if(!route||used>=settings.slots)next();const take=Math.min(amount,(settings.slots-used)*settings.slotCapacity),slots=Math.ceil(take/settings.slotCapacity-EPS);route.cargo.push({good:f.good,amount:take,rate:take/settings.interval});used+=slots;amount-=take;}
  }
 }
 return {routes,truncated};
}
function policyTimeline(p,horizon){if(!p.design?.possible)return [];return root.IslandModel.schedule(p.design.phases.map(x=>({...x,rate:x.output})),horizon,p.startIndex||0,p.firstRemaining);}
function forecast(input,plan,settings){
 const areaMap=new Map(input.areas.map(a=>[a.key,a])),goods=new Set(plan.demands.filter(d=>d.rate>EPS).map(d=>d.good)),result=[],capacityIssues=[];
 for(const good of goods){const relevant=new Set([...plan.demands.filter(d=>d.good===good).map(d=>d.area),...plan.flows.filter(f=>f.good===good).flatMap(f=>[f.from,f.to])]),protectedGood=(input.protectedGoods||[]).includes(good),providers=plan.policies.filter(p=>p.good===good&&!p.protected),full=plan.providers.filter(p=>p.good===good&&!p.newBuild&&(p.outside||protectedGood));
  const timelines=new Map([...providers.map(p=>[p.id,policyTimeline(p,settings.horizon)]),...full.map(p=>[p.id,root.IslandModel.schedule(p.phases.map(x=>({...x,rate:x.rate*p.ownedCount})),settings.horizon,p.startIndex||0,p.firstRemaining)])]);
  const nodes=[...relevant].map(key=>{const a=areaMap.get(key),info=a.goods?.[good]||{},demand=plan.demands.find(d=>d.area===key&&d.good===good),own=[...providers,...full].filter(p=>p.area===key),base=a.entries.find(e=>e.guid===good);
   return {key,name:a.name,stock:info.stock??null,capacity:info.capacity??null,consumption:demand?.rate??base?.consumption??0,production:t=>sum(own,p=>timelines.get(p.id).find(s=>t>=s.start&&t<s.end)?.rate??0),breakpoints:own.flatMap(p=>timelines.get(p.id).map(s=>s.end))};
  });
  const transfers=plan.flows.filter(f=>f.good===good).map(f=>({from:f.from,to:f.to,amount:f.rate*settings.interval,cycle:settings.interval,travel:settings.travel,first:settings.interval}));
  const simulation=root.AdvisorModel.project(nodes,transfers,settings.horizon);result.push({good,...simulation});
 }
 // Reserves share a per-product warehouse with other producers on the same island.
 const reserves=new Map();for(const p of plan.policies){const k=demandKey(p.area,p.good),row=reserves.get(k)||{area:p.area,good:p.good,reserve:0};row.reserve+=p.design.reserve||0;reserves.set(k,row);}
 for(const r of reserves.values()){const info=areaMap.get(r.area).goods?.[r.good]||{},limit=info.normalCapacity??info.capacity??null;if(limit!==null&&r.reserve>limit+EPS)capacityIssues.push({...r,limit});}
 return {goods:result,capacityIssues,unknownStocks:sum(result,r=>r.unknownStocks),unmet:sum(result,r=>sum(r.nodes,n=>n.unmet)),spilled:sum(result,r=>sum(r.nodes,n=>n.spilled)),shortLoad:sum(result,r=>r.shortLoad)};
}
function optimize(input,options={}){
 const settings=normalizedSettings(options);if(!Array.isArray(input.areas)||!Array.isArray(input.providers)||!input.scopeKeys?.length)throw Error('Choose a province with island data.');
 if(input.areas.length>100||input.providers.length>6000||(input.candidates||[]).length>6000)throw Error('Scope exceeds this beta\'s planning limits.');
 const accounting=root.ChainModel?.baseline(input);if(accounting)input={...input,inputCredits:accounting.credits,accountingIssues:accounting.issues};
 let extra=new Map(),plan=null,converged=false,iterations=0;
 for(;iterations<(accounting?64:16);iterations++){plan=allocate(input,extra,settings);if(inputDistance(extra,plan.inputDemands)<1e-6){converged=true;break;}extra=plan.inputDemands;}
 const manifests=routeManifests(plan.flows,settings),projection=forecast(input,plan,settings),coupled=root.ChainModel?.project(input,plan,settings)||null,actions=[];
 for(const p of plan.providers){if(p.outside)continue;const policy=plan.policies.find(x=>x.id===p.id);if(p.newBuild&&policy){const restore=Math.min(p.idleCount||0,policy.design.count);if(restore)actions.push({kind:'restore',area:p.area,good:p.good,factory:p.factory,count:restore,profile:p.id,conditions:['Resolve the idle producers\' input, workforce or access constraints before relying on this capacity.']});if(policy.design.count>restore)actions.push({kind:'build',area:p.area,good:p.good,factory:p.factory,count:policy.design.count-restore,profile:p.id,conditions:p.conditions||[]});}
  if(!p.newBuild&&p.countKnown!==false&&!p.inactive&&p.phases.some(x=>x.rate>.001)){const retained=policy?.design.count||0;if(retained<p.ownedCount)actions.push({kind:'retirement_candidate',area:p.area,good:p.good,factory:p.factory,count:p.ownedCount-retained,protected:(input.protectedGoods||[]).includes(p.good),reason:(input.protectedGoods||[]).includes(p.good)?'External commitments are unresolved. Retain these producers.':'Nominal spare capacity only. Verify exports, coverage and input effects before retiring.'});}
  if(policy&&!policy.protected&&policy.design.unregulatedSurplus>.01)actions.push({kind:'regulate',area:p.area,good:p.good,factory:p.factory,profile:p.id,surplusPerCycle:policy.design.unregulatedSurplus,phases:policy.design.phases.map(x=>({name:x.name,guid:x.guid,minutes:x.minutes,output:x.output,utilization:x.utilization}))});
 }
 const operatingChanges=[];
 for(const p of plan.providers){
  if(p.newBuild||p.outside||p.inactive||p.countKnown===false||!p.phases.some(x=>x.rate>.001)||(input.protectedGoods||[]).includes(p.good))continue;
  const policy=plan.policies.find(x=>x.id===p.id),keep=policy?.design.count||0;
  const phases=p.phases.map((phase,i)=>({...phase,current:phase.rate*p.ownedCount,rate:policy?.design.phases[i]?.output||0,utilization:policy?.design.phases[i]?.utilization||0}));
  if(keep>=p.ownedCount&&phases.every(phase=>Math.abs(phase.current-phase.rate)<.001))continue;
  const timeline=root.IslandModel.schedule(phases,settings.horizon,p.startIndex||0,p.firstRemaining),currentTimeline=root.IslandModel.schedule(phases.map(phase=>({...phase,rate:phase.current})),settings.horizon,p.startIndex||0,p.firstRemaining);
  const volume=rows=>sum(rows,row=>(row.end-row.start)*row.rate),inputChanges=new Map();
  for(const phase of phases)for(const item of phase.inputs||[]){const row=inputChanges.get(item.good)||{good:item.good,before:0,after:0};row.before+=item.rate*p.ownedCount*phase.minutes;row.after+=item.rate*keep*phase.utilization*phase.minutes;inputChanges.set(item.good,row);}
  const duration=sum(phases,phase=>phase.minutes);
  for(const item of p.support||[]){const row=inputChanges.get(item.good)||{good:item.good,before:0,after:0};row.before+=item.rate*p.ownedCount*duration;row.after+=item.rate*keep*duration;inputChanges.set(item.good,row);}
  operatingChanges.push({profile:p.id,area:p.area,good:p.good,factory:p.factory,owned:p.ownedCount,keep,pause:p.ownedCount-keep,water:!!p.water,dove:!!p.dove,phases:phases.map(phase=>({name:phase.name,guid:phase.guid,minutes:phase.minutes,current:phase.current,target:phase.rate,utilization:phase.utilization})),currentVolume:volume(currentTimeline),plannedVolume:volume(timeline),avoidedVolume:Math.max(0,volume(currentTimeline)-volume(timeline)),reserve:policy?.design.reserve||0,conditions:p.conditions||[],inputChanges:[...inputChanges.values()].map(row=>({...row,before:row.before/duration,after:row.after/duration,reduction:Math.max(0,(row.before-row.after)/duration)}))});
 }
 return {...plan,settings,coupled,accounting:{credited:[...(accounting?.credits.values()||[])].map(r=>({area:r.area,good:r.good,rate:r.rate})),issues:accounting?.issues||[]},converged,iterations:iterations+1,manifests:manifests.routes,manifestLimit:manifests.truncated,projection,actions,operatingChanges,summary:{islands:input.scopeKeys.length,goods:new Set(plan.demands.map(d=>d.good)).size,consumptionPerMinute:sum(plan.demands,d=>d.rate),consumptionOverWindow:sum(plan.demands,d=>d.rate)*settings.horizon,baselineConsumption:sum(plan.demands,d=>d.baseline),additionalInputDemand:sum([...plan.inputDemands.values()],d=>d.rate),buildingsToBuild:sum(actions.filter(a=>a.kind==='build'),a=>a.count),retirementCandidates:sum(actions.filter(a=>a.kind==='retirement_candidate'&&!a.protected),a=>a.count),routeManifests:manifests.routes.length,unresolvedProducts:new Set(plan.missing.map(m=>m.good)).size}};
}
const api={average,normalizedSettings,optimize,routeManifests};root.ProvinceModel=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
