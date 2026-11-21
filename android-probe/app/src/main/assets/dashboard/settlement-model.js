/* Expansion scenarios use catalogue recipes and recorded island metadata. */
const SettlementModel = (() => {
 const producers = new Map();
 for (const factory of K.factories) for (const output of factory.outputs) {
  if (output.amount_per_minute_100pct <= 0) continue;
  const options = producers.get(output.product_guid) || [];
  options.push({factory});
  producers.set(output.product_guid, options);
 }
 const developmentPaths = {
  Latium: [{tiers:[1499,1496,1497,1498]}],
  Albion: [
   {name:'Celtic',tiers:[1500,1501,1502]},
   {name:'Roman',tiers:[1500,1503,1504]}
  ],
  Aegyptus: [
   {name:'Egyptian',tiers:[149681,150510,150511]},
   {name:'Roman',tiers:[149681,150534,150542]}
  ]
 };
 const tierById = new Map(N.tiers.map(t=>[t.guid,t]));
 function path(tier) {
  const route = developmentPaths[tier.region]?.find(branch=>branch.tiers.includes(tier.guid));
  return route ? route.tiers.slice(0,route.tiers.indexOf(tier.guid)+1).map(id=>tierById.get(id)) : [tier];
 }
 function targets(region) {
  return (developmentPaths[region]||[]).map(branch=>({...tierById.get(branch.tiers.at(-1)),branch:branch.name}));
 }
 function progress(target,housing) {
  const recorded = new Set((housing||[]).filter(h=>h.count>0).map(h=>h.tier_guid));
  return path(target).filter(t=>recorded.has(t.guid)).at(-1) || null;
 }
 const nominal = new Map();
 const fertilitySpecialists = new Map();
 for (const specialist of K.specialists) {
  if (specialist.status==='placeholder/test') continue;
  for (const grant of specialist.fertility_grants||[]) {
   if (grant.percent>0&&!fertilitySpecialists.has(grant.guid)) fertilitySpecialists.set(grant.guid,specialist);
  }
 }
 function recipes(island, specialists) {
  const cache = new Map();
  function find(good, seen = new Set()) {
   if (!seen.size && cache.has(good)) return cache.get(good);
   if (seen.has(good)) return null;
   const path = new Set([...seen, good]);
   let best = null;
   for (const {factory} of producers.get(good) || []) {
    if (!factory.regions.includes(island.region)) continue;
    const missingFertility = factory.fertility_guid && island.fertility_recorded &&
      !island.fertilities.includes(factory.fertility_guid);
    const specialist = missingFertility && specialists && fertilitySpecialists.get(factory.fertility_guid);
    if (missingFertility && !specialist) continue;
    const unitKey = factory.factory_guid + ':' + good;
    if (!nominal.has(unitKey)) nominal.set(unitKey, CatalogueChainModel.unit(factory,good,{},AR,AM));
    const unit = nominal.get(unitKey);
    if (!(unit.rate > 0)) continue;
    const rate = unit.rate;
    const inputs = new Map(unit.inputs.filter(i=>i.rate>0).map(i=>[i.good,i.rate]));
    const waterOrSite = /SlotFactoryBuilding|Embankment|Production Area/.test(factory.template);
    let effort = 1 / rate;
    let conditional = waterOrSite || !!(factory.fertility_guid && !island.fertility_recorded);
    const grants = new Set(specialist?[specialist.guid]:[]);
    conditional ||= !!specialist;
    const imports = new Map(), steps = new Map([[factory.factory_guid,1 / rate]]);
    for (const [input, quantity] of inputs) {
     const upstream = find(input, path);
     if (!upstream) imports.set(input, (imports.get(input) || 0) + quantity / rate);
     else {
      effort += upstream.effort * quantity / rate;
      conditional ||= upstream.conditional;
      for (const id of upstream.grants) grants.add(id);
      for (const [id,count] of upstream.steps) steps.set(id,(steps.get(id)||0)+count*quantity/rate);
      for (const [id, amount] of upstream.imports) imports.set(id, (imports.get(id) || 0) + amount * quantity / rate);
     }
    }
    const score = imports.size * 10000 + (conditional ? 10 : 0) + effort;
    if (!best || score < best.score) best = {score, effort, factory, rate, imports, steps, conditional, grants};
   }
   if (!seen.size) cache.set(good, best);
   return best;
  }
  return find;
 }
 function evaluate(island, tier, houses, difficulty, network) {
  const tiers = path(tier), names = new Set(tiers.map(t=>t.tier));
  const needs = N.needs.filter(n => n.region === tier.region && names.has(n.tier));
  const choices = [], shipments = new Map(), unresolved = new Map(), production = new Map();
  const demands = new Map(), specialistGrants = new Map();
  for (const need of needs) {
   const rate = need.rates?.[difficulty];
   if (need.is_service || need.only_available_through_buff || !(rate > 0)) continue;
   const good = need.product_guid;
   // A residence moves through tiers. Size the chain for peak demand, not all stages added together.
   demands.set(good, Math.max(demands.get(good)||0,houses*rate));
  }
  function addProduction(site, recipe, amount) {
   if (!production.has(site.area_key)) production.set(site.area_key,{island:site,steps:new Map()});
   const steps = production.get(site.area_key).steps;
   if (recipe.grants.size) {
    if (!specialistGrants.has(site.name)) specialistGrants.set(site.name,new Set());
    for (const id of recipe.grants) specialistGrants.get(site.name).add(id);
   }
   for (const [id,count] of recipe.steps) steps.set(id,(steps.get(id)||0)+count*amount);
  }
  function source(good) {
   return [...network.values()].filter(n => n.island.area_key !== island.area_key)
     .map(n => ({...n,recipe:n.find(good)})).filter(n=>n.recipe&&!n.recipe.imports.size)
     .sort((a,b)=>Number(a.recipe.conditional)-Number(b.recipe.conditional) ||
       (a.island.region !== island.region)-(b.island.region !== island.region) ||
       b.island.owned-a.island.owned || a.recipe.score-b.recipe.score)[0];
  }
  function supply(good, amount) {
   const from = source(good);
   if (!from) {
    unresolved.set(good,(unresolved.get(good)||0)+amount);
    return;
   }
   if (!shipments.has(from.island.area_key)) shipments.set(from.island.area_key,{island:from.island,destination:island,goods:new Map()});
   const goods = shipments.get(from.island.area_key).goods;
   goods.set(good,(goods.get(good)||0)+amount);
   addProduction(from.island,from.recipe,amount);
  }
  for (const [good,amount] of demands) {
   const recipe = network.get(island.area_key).find(good);
   choices.push({good,amount,recipe,missing:recipe ? [...recipe.imports.keys()] : [good],
     tiers:tiers.filter(t=>needs.some(n=>n.tier===t.tier&&n.product_guid===good&&!n.only_available_through_buff))});
   if (recipe) {
    addProduction(island,recipe,amount);
    for (const [input,rate] of recipe.imports) supply(input,amount*rate);
   } else supply(good,amount);
  }
  const flows = [...shipments.values()];
  const localGoods = choices.filter(c=>!c.missing.length).length;
  const buildings = [...production.values()].reduce((total,row)=>total+[...row.steps.values()].reduce((sum,count)=>sum+Math.ceil(count-1e-9),0),0);
  return {island,tier,tiers,choices,flows,specialistGrants,production:[...production.values()],buildings,
   services:needs.filter(n=>n.is_service),conditionalNeeds:needs.filter(n=>n.only_available_through_buff&&!n.is_service),
   unresolved:unresolved.size?[{goods:unresolved}]:[],open:unresolved.size,localGoods,
   conditional:choices.filter(c=>c.recipe?.conditional).length,
   importRate:flows.reduce((total,flow)=>total+[...flow.goods.values()].reduce((sum,rate)=>sum+rate,0),0)};
 }
 function combinedBuildings(plans) {
  const totals = new Map();
  for (const plan of plans) for (const row of plan.production) for (const [id,count] of row.steps) {
   const key = row.island.area_key+':'+id;
   totals.set(key,(totals.get(key)||0)+count);
  }
  return [...totals.values()].reduce((sum,count)=>sum+Math.ceil(count-1e-9),0);
 }
 function compare(a,b) {
  return a.open-b.open || a.conditional-b.conditional || a.importRate-b.importRate ||
   a.buildings-b.buildings || Number(!a.island.owned)-Number(!b.island.owned) || a.island.name.localeCompare(b.island.name);
 }
 function makeFinders(specialists) {
  const cache = new Map();
  return island => {
   if (!cache.has(island.area_key)) cache.set(island.area_key,recipes(island,specialists));
   return cache.get(island.area_key);
  };
 }
 function rank(candidates,tier,houses,difficulty,committed,primary=null,find=makeFinders(false)) {
  function network(islands) {
   return new Map(islands.map(island=>[island.area_key,{island,find:find(island)}]));
  }
  return candidates.filter(island=>island.region===tier.region).map(island=>{
   const sites = network([...committed,island]);
   const result = evaluate(island,tier,houses,difficulty,sites);
   if (primary && island.area_key!==primary.island.area_key) {
    const home = evaluate(primary.island,primary.tier,primary.houses,difficulty,sites);
    result.home = home;
    result.networkBuildings = combinedBuildings([result,home]);
   }
   return result;
  }).sort(compare);
 }
 function rankPairs(rows) {
  return rows.sort((a,b)=>{
   const fraction = r=>r.open/Math.max(r.choices.length,1);
   const gain = r=>r.home ? r.home.open : r.open;
   return gain(a)-gain(b) || fraction(a)-fraction(b) || Number(b.complementaryBranch)-Number(a.complementaryBranch) || b.tiers.length-a.tiers.length ||
    (a.home?.importRate||0)-(b.home?.importRate||0) ||
    a.importRate/Math.max(a.choices.length,1)-b.importRate/Math.max(b.choices.length,1) ||
    (a.networkBuildings??a.buildings)-(b.networkBuildings??b.buildings) || compare(a,b);
  });
 }
 function sourceRegions(good) {
  return [...new Set((producers.get(good)||[]).flatMap(p=>p.factory.regions))];
 }
 function support(candidates, committed, plans, difficulty, find) {
  const missing = plans.reduce((sum,plan)=>sum+plan.open,0);
  if (!missing) return [];
  const selected = new Set(committed.map(a=>a.area_key));
  return candidates.filter(a=>!selected.has(a.area_key)).map(island=>{
   const network = new Map([...committed,island].map(a=>[a.area_key,{island:a,find:find(a)}]));
   const updated = plans.map(p=>evaluate(p.island,p.tier,p.houses,difficulty,network));
   const gain = missing-updated.reduce((sum,p)=>sum+p.open,0);
   const flows = updated.flatMap(p=>p.flows).filter(f=>f.island.area_key===island.area_key);
   return {island,gain,flows,plans:updated};
  }).filter(r=>r.gain>0&&r.flows.length).sort((a,b)=>b.gain-a.gain||a.flows.length-b.flows.length);
 }
 function stage(committed, plans, difficulty, find) {
  const network=new Map(committed.map(island=>[island.area_key,{island,find:find(island)}]));
  return plans.map(({island,tier,houses})=>evaluate(island,tier,houses,difficulty,network));
 }
 return {rank,rankPairs,compare,path,targets,progress,sourceRegions,makeFinders,support,stage};
})();
