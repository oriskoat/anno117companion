/* Coupled recipe accounting and inventory simulation. No game commands. */
(function(root){'use strict';
const sum=(rows,fn)=>rows.reduce((s,r)=>s+fn(r),0),key=(a,g)=>a+'|'+g,EPS=1e-7;
function baseline(input){const credits=new Map(),issues=[],scope=new Set(input.scopeKeys);
 for(const p of input.providers)if(scope.has(p.area)&&!(input.protectedGoods||[]).includes(p.good)&&p.inputTrusted&&p.countKnown!==false){const phase=(p.originalPhases||p.phases)[p.startIndex||0];for(const item of [...(phase.inputs||[]),...(p.originalSupport||p.support||[])]){const k=key(p.area,item.good),r=credits.get(k)||{area:p.area,good:item.good,rate:0,profiles:new Set()};r.rate+=item.rate*p.ownedCount;r.profiles.add(p.id);credits.set(k,r);}}
 for(const [k,r] of credits){const observed=input.areas.find(a=>a.key===r.area)?.entries.find(e=>e.guid===r.good)?.consumption;if(!Number.isFinite(observed)||r.rate>observed+.02+observed*.05){credits.delete(k);issues.push({area:r.area,good:r.good,reason:'Recipe accounting differs from received consumption; its existing demand remains unchanged.'});}else r.rate=Math.min(r.rate,observed);}
 return {credits,issues};
}
function adjustments(input,policies){const result=new Map(),credits=input.inputCredits;
 for(const [k,r] of credits)result.set(k,{area:r.area,good:r.good,rate:-r.rate});
 for(const p of policies){if(!p.design.possible)continue;const duration=p.design.minutes;
  for(const phase of p.design.phases)for(const item of phase.inputs||[]){const k=key(p.area,item.good);if(!p.newBuild&&!credits.get(k)?.profiles.has(p.id)){if(!p.proposedChanged)continue;const old=(p.originalPhases||p.phases)[p.startIndex||0].inputs?.find(i=>i.good===item.good)?.rate||0;const row=result.get(k)||{area:p.area,good:item.good,rate:0};row.rate+=Math.max(0,item.rate*p.design.count*phase.utilization-old*p.ownedCount)*phase.minutes/duration;result.set(k,row);continue;}const row=result.get(k)||{area:p.area,good:item.good,rate:0};row.rate+=item.rate*p.design.count*phase.utilization*phase.minutes/duration;result.set(k,row);}
  for(const item of p.support||[]){const k=key(p.area,item.good);if(!p.newBuild&&!credits.get(k)?.profiles.has(p.id)){if(!p.proposedChanged)continue;const old=(p.originalSupport||[]).find(i=>i.good===item.good)?.rate||0,itemDelta=Math.max(0,item.rate*p.design.count-old*p.ownedCount);const row=result.get(k)||{area:p.area,good:item.good,rate:0};row.rate+=itemDelta;result.set(k,row);continue;}const row=result.get(k)||{area:p.area,good:item.good,rate:0};row.rate+=item.rate*p.design.count;result.set(k,row);}
 }
 return result;
}
function project(input,plan,settings){const scope=new Set(input.scopeKeys),credits=input.inputCredits||new Map(),nodes=new Map(),producers=[],events=[],arrivals=[],missingInputs=new Map();let loaded=0,delivered=0,shortLoad=0;
 const ensure=(area,good)=>{const k=key(area,good);if(!nodes.has(k)){const a=input.areas.find(a=>a.key===area),info=a?.goods?.[good]||{},base=a?.entries.find(e=>e.guid===good)?.consumption||0,credit=credits.get(k)?.rate||0;nodes.set(k,{key:k,area,good,name:a?.name||area,stock:info.stock??null,capacity:info.capacity??null,normal:info.normalCapacity??info.capacity??null,minimum:info.stock??null,external:Math.max(0,base-credit),unmet:0,blocked:0,pressure:0,unknown:info.stock===null||info.stock===undefined});}return nodes.get(k);};
 for(const d of plan.demands)ensure(d.area,d.good);
 const protectedGoods=new Set(input.protectedGoods||[]);
 for(const p of plan.providers){const policy=plan.policies.find(x=>x.id===p.id),full=!p.newBuild&&(p.outside||protectedGoods.has(p.good));if(!policy&&!full)continue;
  const count=full?p.ownedCount:policy.design.count,phases=full?p.phases.map(x=>({...x,output:x.rate*count,utilization:1})):policy.design.phases;
  const schedule=root.IslandModel.schedule(phases.map((x,index)=>({...x,rate:index})),settings.horizon,p.startIndex||0,p.firstRemaining);
  ensure(p.area,p.good);for(const phase of phases)for(const i of phase.inputs||[])ensure(p.area,i.good);for(const i of p.support||[])ensure(p.area,i.good);
  producers.push({p,count,phases,schedule,blockedMinutes:0,unknownInputs:false});
 }
 // Feed raw producers before processing chains. Cyclic support still needs starting stock.
 const depth=(good,seen=new Set())=>{if(seen.has(good))return 0;const next=new Set([...seen,good]),deps=producers.filter(x=>x.p.good===good).flatMap(x=>x.phases[0].inputs||[]);return deps.length?1+Math.max(...deps.map(i=>depth(i.good,next))):0;};
 const depths=new Map([...new Set(producers.map(x=>x.p.good))].map(g=>[g,depth(g)]));producers.sort((a,b)=>depths.get(a.p.good)-depths.get(b.p.good));
 for(const f of plan.flows){ensure(f.from,f.good);ensure(f.to,f.good);for(let t=settings.interval;t<=settings.horizon;t+=settings.interval)events.push({t,f,amount:f.rate*settings.interval});}events.sort((a,b)=>a.t-b.t);let cursor=0;
 const breaks=[...new Set(producers.flatMap(x=>x.schedule.map(s=>s.end)))].sort((a,b)=>a-b);let breakIndex=0;
 for(let t=0;t<settings.horizon-EPS;){
  for(let i=arrivals.length-1;i>=0;i--){const cargo=arrivals[i];if(cargo.t>t+EPS)continue;const n=ensure(cargo.to,cargo.good);if(cargo.unknown){n.stock=null;n.unknown=true;delivered+=cargo.amount;arrivals.splice(i,1);continue;}const room=n.stock===null?Infinity:Math.max(0,(n.capacity??Infinity)-n.stock),amount=Math.min(room,cargo.amount);if(n.stock!==null)n.stock+=amount;delivered+=amount;cargo.amount-=amount;if(cargo.amount<EPS)arrivals.splice(i,1);else cargo.t=t+1;}
  while(cursor<events.length&&events[cursor].t<=t+EPS){const event=events[cursor++],n=ensure(event.f.from,event.f.good),amount=n.stock===null?event.amount:Math.min(n.stock,event.amount);if(n.stock!==null)n.stock-=amount;shortLoad+=event.amount-amount;loaded+=amount;arrivals.push({t:t+settings.travel,to:event.f.to,good:event.f.good,amount,unknown:n.stock===null});}
  while(breaks[breakIndex]<=t+EPS)breakIndex++;
  const end=Math.min(t+1,settings.horizon,events[cursor]?.t??Infinity,breaks[breakIndex]??Infinity,...arrivals.map(x=>x.t).filter(x=>x>t+EPS)),dt=end-t;if(!(dt>0))throw Error('Invalid coupled timeline');
  for(const x of producers){const segment=x.schedule.find(s=>t>=s.start-EPS&&t<s.end-EPS),phase=x.phases[segment?.rate??0],out=ensure(x.p.area,x.p.good),recipe=[];
   if(out.stock!==null&&out.capacity!==null&&out.stock>=out.capacity-EPS)continue;
   let moduleFraction=1;for(const support of x.p.support||[]){const n=ensure(x.p.area,support.good),need=support.rate*x.count*dt;if(n.stock===null)x.unknownInputs=true;else if(need>EPS){moduleFraction=Math.min(moduleFraction,n.stock/need);if(n.stock<need-EPS){const k=x.p.id+'|module|'+support.good,r=missingInputs.get(k)||{profile:x.p.id,area:x.p.area,factory:x.p.factory,product:x.p.good,good:support.good,amount:0,first:t,optional:true};r.amount+=need-n.stock;missingInputs.set(k,r);}}}moduleFraction=Math.min(1,moduleFraction);
   const fallback=phase.withoutModuleRate??phase.rate,mixedRate=(fallback+(phase.rate-fallback)*moduleFraction)*x.count,targetOutput=Math.min(phase.output,mixedRate),util=mixedRate>EPS?targetOutput/mixedRate:0,effectiveInputs=(phase.inputs||[]).map(i=>{const base=phase.withoutModuleInputs?.find(j=>j.good===i.good)?.rate??i.rate;return {...i,rate:base+(i.rate-base)*moduleFraction};});
   for(const item of effectiveInputs){const k=key(x.p.area,item.good);if(x.p.newBuild||credits.get(k)?.profiles.has(x.p.id))recipe.push({good:item.good,rate:item.rate*x.count*util});else if(x.p.proposedChanged){const old=(x.p.originalPhases||x.p.phases)[x.p.startIndex||0].inputs?.find(i=>i.good===item.good)?.rate||0;recipe.push({good:item.good,rate:Math.max(0,item.rate*x.count*util-old*x.p.ownedCount)});}}
   for(const item of x.p.support||[]){const k=key(x.p.area,item.good);if(x.p.newBuild||credits.get(k)?.profiles.has(x.p.id))recipe.push({good:item.good,rate:item.rate*x.count*moduleFraction});else if(x.p.proposedChanged){const old=(x.p.originalSupport||[]).find(i=>i.good===item.good)?.rate||0;recipe.push({good:item.good,rate:Math.max(0,item.rate*x.count*moduleFraction-old*x.p.ownedCount)});}}
   let fraction=1;for(const i of recipe){const n=ensure(x.p.area,i.good);if(n.stock===null)x.unknownInputs=true;else if(i.rate>EPS)fraction=Math.min(fraction,n.stock/(i.rate*dt));}
   const output=targetOutput*dt;if(out.stock!==null&&output>EPS)fraction=Math.min(fraction,Math.max(0,((out.capacity??Infinity)-out.stock)/output));fraction=Math.max(0,Math.min(1,fraction));
   if(fraction<1-EPS&&output>EPS)x.blockedMinutes+=dt*(1-fraction);
   for(const i of recipe){const n=ensure(x.p.area,i.good),need=i.rate*dt;if(n.stock!==null){if(n.stock<need-EPS){const k=x.p.id+'|'+i.good,r=missingInputs.get(k)||{profile:x.p.id,area:x.p.area,factory:x.p.factory,product:x.p.good,good:i.good,amount:0,first:t};r.amount+=need-n.stock;missingInputs.set(k,r);}n.stock=Math.max(0,n.stock-need*fraction);}}
   if(out.stock!==null)out.stock+=output*fraction;
  }
  for(const n of nodes.values()){if(n.stock===null)continue;const used=n.external*dt;n.unmet+=Math.max(0,used-n.stock);n.stock=Math.max(0,n.stock-used);n.minimum=Math.min(n.minimum,n.stock);if(n.normal!==null)n.pressure=Math.max(n.pressure,n.stock-n.normal);}
  t=end;
 }
 return {unverifiedInputs:producers.filter(x=>!x.p.newBuild&&!x.p.inputTrusted&&x.phases.some(p=>p.inputs?.length)).map(x=>({profile:x.p.id,area:x.p.area,good:x.p.good})),nodes:[...nodes.values()],inputShortages:[...missingInputs.values()],producers:producers.map(x=>({profile:x.p.id,area:x.p.area,good:x.p.good,blockedMinutes:x.blockedMinutes,unknownInputs:x.unknownInputs})),unknownStocks:[...nodes.values()].filter(n=>n.stock===null).length,unmet:sum([...nodes.values()],n=>n.unmet),shortLoad,loaded,delivered,inTransit:sum(arrivals,x=>x.amount),blockedCargo:arrivals.filter(c=>c.t<=settings.horizon).length,method:'One-game-minute coupled recipe simulation with exact phase and shipment boundaries'};
}
const api={baseline,adjustments,project};root.ChainModel=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
