/* Catalogue plans have one explicit region and one shared modifier state. */
(function(root){'use strict';
function unit(factory,good,state,rules,AM){
 const id=factory.factory_guid, mix=state.recordedMix?.[id];
 if (!mix?.length) return singleUnit(factory,good,state,rules,AM);
 const inputs=new Map(),side=new Map(), total=mix.reduce((n,group)=>n+group.count,0);
 const combined={rate:0,gross:0,self:0,dry:0,flood:0,inputs:[],side:[],groups:[]};
 for (const group of mix) {
  const options={...state,modifiers:{...state.modifiers,[id]:{...state.modifiers?.[id],water:group.water,module:group.module}}};
  const current=singleUnit(factory,good,options,rules,AM),weight=group.count/total;
  for (const field of ['rate','gross','self','dry','flood']) combined[field]+=current[field]*weight;
  for (const input of current.inputs) {
   const row=inputs.get(input.good)||{...input,rate:0};
   row.rate+=input.rate*weight;inputs.set(input.good,row);
  }
  for (const output of current.side) side.set(output.guid,(side.get(output.guid)||0)+output.rate*weight);
  combined.groups.push({...group,rate:current.rate});
  combined.workforce=current.workforce;
 }
 combined.inputs=[...inputs.values()];
 combined.side=[...side].map(([guid,rate])=>({guid,rate}));
 combined.moduleFeed=combined.groups.reduce((sum,g)=>sum+(g.module?g.count:0),0)/total*
   (rules.modules?.[rules.factories[id]?.module]?.inputs||[]).reduce((sum,i)=>sum+i.rate,0);
 return combined;
}
function singleUnit(factory,good,state,rules,AM){const m=state.modifiers?.[factory.factory_guid]||{},rule=rules.factories[factory.factory_guid]||{},entries=[];
 if(m.water&&rule.water_policy==='Optional')for(const guid of rule.water_buffs||[])entries.push({guid});
 const module=m.module?rules.modules?.[rule.module]:null;for(const guid of module?.buffs||[])entries.push({guid});
 if(m.granary){const effect=rules.effects[m.granary];if(effect?.targets.includes(factory.factory_guid))for(const guid of effect.buffs)entries.push({guid});}
 if(m.specialist){const effect=rules.effects[m.specialist];if(effect?.targets.includes(factory.factory_guid))for(const guid of effect.buffs)entries.push({guid});}
 for(const e of state.savedEffects||[]){const effect=rules.effects[e.guid];if(effect?.targets.includes(factory.factory_guid))for(const guid of effect.buffs)entries.push({guid,scale:e.scale});}
 if(state.patron)for(const local of rules.patrons[state.patron]?.local||[]){const effect=rules.effects[local.effect],step=local.milestones.filter(x=>x.belief<=state.belief).at(-1);if(step&&effect?.targets.includes(factory.factory_guid))for(const guid of effect.buffs)entries.push({guid,scale:step.scale});}
 const nominal=state.season!=='dry'&&state.season!=='flood'&&state.season!=='cycle',configured=nominal?{...rules,seasons:{...rules.seasons,targets:[]}}:rules,options={baseProductivity:state.productivity?.[factory.factory_guid]||state.defaultProductivity||100,entries,naturalFertility:true,floodScale:state.floodScale??1},dry=AM.scenario(factory,good,configured,options,'dry'),flood=AM.scenario(factory,good,configured,options,'flood'),mix=state.season==='cycle'?rules.seasons.dry_minutes/(rules.seasons.dry_minutes+rules.seasons.flood_minutes):state.season==='flood'?0:1;
 const inputs=dry.inputs.map(i=>({good:i.guid,rate:i.rate*mix+(flood.inputs.find(j=>j.guid===i.guid)?.rate||0)*(1-mix),fuel:!!i.fuel}));
 for(const i of module?.inputs||[]){const row=inputs.find(j=>j.good===i.good);if(row)row.rate+=i.rate;else inputs.push({...i});}
 if(factory.needs_fuel&&!inputs.some(i=>i.good===factory.fuel_product_guid))inputs.push({good:factory.fuel_product_guid,rate:factory.fuel_amount_per_minute_100pct*(options.baseProductivity/100),fuel:true});
 const gross=dry.rate*mix+flood.rate*(1-mix),self=inputs.find(i=>i.good===good)?.rate||0;
 const side=new Map();
 for (const [result,weight] of [[dry,mix],[flood,1-mix]]) if(weight>0)
  for (const output of result.side) side.set(output.guid,(side.get(output.guid)||0)+output.rate*weight);
 return {rate:Math.max(0,gross-self),gross,inputs:inputs.filter(i=>i.good!==good),self,dry:dry.rate,flood:flood.rate,module,workforce:rule.workforce||[],side:[...side].map(([guid,rate])=>({guid,rate}))};
}
function plan(factories,rules,AM,state,target){const first=factories.find(f=>f.factory_guid===Number(state.factory)),steps=new Map(),warnings=[],byproducts=[];if(!first||!Number.isFinite(target)||target<0)return {steps:[],warnings:['Invalid output target.'],target,byproducts:[]};
 const add=(f,good,required,path,usedBy=null,fuelBranch=false)=>{if(!required)return;if(path.includes(f.factory_guid)){warnings.push({good,required,message:'Cyclic dependency requires external supply.'});return;}const u=unit(f,good,state,rules,AM);if(!(u.rate>0)){warnings.push({good,required,message:'No net output from this setup.'});return;}const count=required/u.rate,id=f.factory_guid+':'+good,row=steps.get(id)||{id,factory:f,good,required:0,count:0,primaryCount:0,unit:u,usedBy:new Set()};row.count+=count;if(!fuelBranch)row.primaryCount+=count;row.required+=required;if(usedBy)row.usedBy.add(usedBy);steps.set(id,row);
  const upstream=[...path,f.factory_guid];
  for(const input of u.inputs){const options=factories.filter(p=>p.regions.includes(state.region)&&p.outputs.some(o=>o.product_guid===input.good)),chosen=options.find(p=>p.factory_guid===Number(state.choices?.[input.good]))||options[0];
   let need=count*input.rate;
   for(const side of byproducts){
    if(side.guid!==input.good||upstream.includes(side.factory))continue;
    const use=Math.min(need,side.rate-side.used);
    side.used+=use;need-=use;
   }
   if(need<=1e-9)continue;
   if(chosen)add(chosen,input.good,need,upstream,good,fuelBranch||!!input.fuel);
   else warnings.push({good:input.good,required:need,message:'Import required; no producer in this region.'});
  }
  for(const side of u.side)byproducts.push({guid:side.guid,rate:side.rate*count,used:0,factory:f.factory_guid});
 };add(first,first.outputs[0].product_guid,target,[]);const rows=[...steps.values()].reverse(),workers=new Map();for(const s of rows)for(const w of s.unit.workforce)workers.set(w.good,(workers.get(w.good)||0)+Math.ceil(s.count-1e-9)*w.amount);
 const totals=new Map();
 for(const side of byproducts){const item=totals.get(side.guid)||{guid:side.guid,rate:0,used:0};item.rate+=side.rate;item.used+=side.used;totals.set(side.guid,item);}
 return {steps:rows,warnings,target,byproducts:[...totals.values()],buildings:rows.reduce((n,s)=>n+Math.ceil(s.count-1e-9),0),workers:[...workers].map(([good,amount])=>({good,amount}))};
}
function balanced(factories,rules,AM,state){const p=plan(factories,rules,AM,state,1),gcd=(a,b)=>b?gcd(b,a%b):a,counts=p.steps.map(s=>s.primaryCount).filter(c=>c>1e-9);if(!counts.length)return {target:0,exact:false};let multiple=1;for(const count of counts){let denominator=0;for(let d=1;d<=10000;d++)if(Math.abs(count*d-Math.round(count*d))<1e-7){denominator=d;break;}if(!denominator)return {target:factories.find(f=>f.factory_guid===state.factory).outputs[0].amount_per_minute_100pct,exact:false};multiple=multiple/gcd(multiple,denominator)*denominator;if(!Number.isSafeInteger(multiple)||multiple>1000000)return {target:factories.find(f=>f.factory_guid===state.factory).outputs[0].amount_per_minute_100pct,exact:false};}const common=counts.map(c=>Math.round(c*multiple)).reduce((a,b)=>gcd(a,b));return {target:multiple/common,exact:true};}
const api={unit,plan,balanced};root.CatalogueChainModel=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
