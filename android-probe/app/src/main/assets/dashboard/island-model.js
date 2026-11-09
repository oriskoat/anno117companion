/* Island decisions use explicit phase rates, never subtract bonuses from a final percentage. */
(function(root){'use strict';
function designCycle(phases,demand,capacity=null,bufferMinutes=0){
 if(!Number.isFinite(demand)||demand<0||!phases.length||phases.some(p=>!Number.isFinite(p.rate)||p.rate<0||!Number.isFinite(p.minutes)||p.minutes<=0))throw Error('Invalid cycle inputs');
 const minutes=phases.reduce((s,p)=>s+p.minutes,0),yieldOne=phases.reduce((s,p)=>s+p.rate*p.minutes,0);
 if(demand>0&&yieldOne===0)return {possible:false,reason:'This setup produces nothing. Check fertility, workforce and inputs.'};
 const count=demand===0?0:Math.ceil(demand*minutes/yieldOne-1e-10),outputs=phases.map(p=>Math.min(count*p.rate,demand));
 let missing=demand*minutes-outputs.reduce((s,r,i)=>s+r*phases[i].minutes,0);
 const order=phases.map((p,i)=>i).sort((a,b)=>phases[b].rate-phases[a].rate);
 for(const i of order){const add=Math.min(Math.max(0,missing),Math.max(0,count*phases[i].rate-outputs[i])*phases[i].minutes);outputs[i]+=add/phases[i].minutes;missing-=add;}
 let cumulative=0,low=0,high=0;const series=[{t:0,net:0}];let t=0;
 phases.forEach((p,i)=>{cumulative+=(outputs[i]-demand)*p.minutes;t+=p.minutes;low=Math.min(low,cumulative);high=Math.max(high,cumulative);series.push({t,net:cumulative});});
 const buffer=demand*Math.max(0,bufferMinutes),reserve=high-low+buffer;
 return {possible:missing<1e-6,count,minutes,demand,averagePerBuilding:yieldOne/minutes,unregulatedSurplus:Math.max(0,count*yieldOne-demand*minutes),reserve,startingReserve:-low+buffer,capacityFits:capacity===null?null:reserve<=capacity+1e-6,phases:phases.map((p,i)=>({...p,output:outputs[i],utilization:count*p.rate>0?outputs[i]/(count*p.rate):0})),series:series.map(p=>({...p,stock:p.net-low+buffer})),buffer};
}
function demands(areas,good,selected){const local=areas.find(a=>a.key===selected),sum=rows=>rows.reduce((s,a)=>s+(a.entries.find(e=>e.guid===good)?.consumption||0),0);return {island:local?sum([local]):0,region:local?sum(areas.filter(a=>a.region===local.region)):0,empire:sum(areas)};}
function schedule(phases,horizon,startIndex=0,firstRemaining=null){
 if(!phases.length||phases.some(p=>!Number.isFinite(p.minutes)||p.minutes<=0||!Number.isFinite(p.rate)||p.rate<0))throw Error('Invalid phase schedule');
 let i=Math.max(0,Math.min(phases.length-1,Math.trunc(startIndex))),t=0,duration=Number.isFinite(firstRemaining)&&firstRemaining>=0?firstRemaining:phases[i].minutes;const segments=[];
 for(let steps=0;t<horizon&&steps<10000;steps++){const end=Math.min(horizon,t+duration);if(end>t)segments.push({start:t,end,rate:phases[i].rate,guid:phases[i].guid});t=end;i=(i+1)%phases.length;duration=phases[i].minutes;}
 if(t<horizon)throw Error('Too many phase changes');return segments;
}
function patronEntries(rules,patron,belief,factory){const result=[];for(const local of rules.patrons[patron]?.local||[]){const effect=rules.effects[local.effect],step=local.milestones.filter(m=>m.belief<=belief).at(-1);if(step&&effect?.targets.includes(factory))for(const guid of effect.buffs)result.push({guid,scale:step.scale});}return result;}
function phaseEntries(rules,phase,factory){const result=[];for(const item of phase.effects||[]){const effect=rules.effects[item.guid];if(effect?.targets.includes(factory))for(const guid of effect.buffs)result.push({guid,scale:1});}return result;}
function nextBelief(rules,patron,belief,factoryIds){const values=[];for(const local of rules.patrons[patron]?.local||[]){if(!rules.effects[local.effect]?.targets.some(f=>factoryIds.includes(f)))continue;const next=local.milestones.find(m=>m.belief>belief);if(next)values.push(next.belief);}return values.length?Math.min(...values):null;}
const api={designCycle,demands,schedule,patronEntries,phaseEntries,nextBelief};root.IslandModel=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
