const settlementDrafts = new Map();
const settlementDifficulties = ['Low','Medium','High','VeryHigh'];

function settlementContext() {
 const save = advisorSaved();
 if (!save?.settlement_islands?.length) return null;
 const regions = [...new Set(save.settlement_islands.map(a => a.region))].filter(r => N.tiers.some(t => t.region === r));
 if (!regions.length) return null;
 const id = save.campaign_fingerprint;
 if (!settlementDrafts.has(id)) {
  const start = save.settlement_islands.find(a => a.owned && regions.includes(a.region))?.region || regions[0];
  let stored;
  try { stored = JSON.parse(localStorage.getItem('anno.settlement.v2.' + id)); } catch {}
  const first = save.settlement_islands.find(a=>a.owned&&a.region===start)?.area_key||'';
  settlementDrafts.set(id, {region:start, first, second:'', tier:0, next:0, houses:25, nextHouses:50,
    specialists:false, difficulty:planner.setting || 'Medium', minutes:0, ...stored});
 }
 return {save, regions, id, draft:settlementDrafts.get(id)};
}

function settlementSet(field, value) {
 const context = settlementContext();
 if (!context) return;
 const {draft, id} = context;
 if (['tier','next','houses','nextHouses','minutes'].includes(field)) value = Number(value);
 draft[field] = value;
 if (field === 'region') Object.assign(draft,{first:context.save.settlement_islands.find(a=>a.owned&&a.region===value)?.area_key||'',second:'',tier:0,next:0});
 if (field === 'tier') Object.assign(draft,{second:'',next:0});
 if (field === 'first' || field === 'next') draft.second = '';
 try { localStorage.setItem('anno.settlement.v2.' + id, JSON.stringify(draft)); } catch {}
 const expanded = [...document.querySelectorAll('.settlement-layout details[open][data-pv-key], .settlement-layout details[open][id]')]
  .map(node=>node.dataset.pvKey||node.id);
 render(true);
 for (const node of document.querySelectorAll('.settlement-layout details[data-pv-key], .settlement-layout details[id]')) {
  if (expanded.includes(node.dataset.pvKey||node.id)) node.open = true;
 }
}

function settlementResults(context) {
 const {save, draft} = context;
 const housing = new Map((save.areas||[]).map(area=>[area.area_key,area.housing]));
 const islands = save.settlement_islands.filter(a => a.owned || a.fertilities.length || a.settlement_evidence)
  .map(a=>({...a,housing:housing.get(a.area_key)}));
 const tiers = SettlementModel.targets(draft.region);
 const anchor = islands.find(a=>a.area_key===draft.first);
 function observedBranch(target) {
  const progress = SettlementModel.progress(target,anchor?.housing);
  if (progress?.guid===target.guid) return 2;
  return progress && SettlementModel.path(target)[0].guid!==progress.guid ? 1 : 0;
 }
 const recordedTarget = tiers.filter(t=>observedBranch(t)>0)
  .sort((a,b)=>observedBranch(b)-observedBranch(a))[0];
 const selectedTarget = tiers.find(t=>t.guid===draft.tier) || recordedTarget;
 const nextTiers = context.regions.flatMap(SettlementModel.targets);
 const nextFilter = nextTiers.find(t=>t.guid===draft.next)?.guid;
 const difficulty = settlementDifficulties.includes(draft.difficulty) ? draft.difficulty : 'Medium';
 const houses = Math.max(1,Math.min(100000,Math.floor(draft.houses || 1)));
 const nextHouses = Math.max(1,Math.min(100000,Math.floor(draft.nextHouses || 1)));
 const owned = islands.filter(a => a.owned);
 const find = SettlementModel.makeFinders(draft.specialists);
 const ranked = (selectedTarget?[selectedTarget]:tiers).map(target=>{
  const rows = SettlementModel.rank(islands,target,houses,difficulty,owned,null,find);
  return {target,rows,example:rows.find(row=>row.island.area_key===draft.first)||rows[0]};
 });
 const {target:tier,rows:first} = ranked.sort((a,b)=>
  a.example&&b.example ? SettlementModel.compare(a.example,b.example) : Number(!a.example)-Number(!b.example))[0];
 const chosen = first.find(r => r.island.area_key === draft.first);
 const network = chosen ? [...new Map([...owned,chosen.island].map(a=>[a.area_key,a])).values()] : [];
 const primary = chosen && {...chosen,houses};
 const second = chosen ? SettlementModel.rankPairs(nextTiers.filter(t=>!nextFilter||t.guid===nextFilter)
   .flatMap(t=>SettlementModel.rank(islands,t,nextHouses,difficulty,network,primary,find)
    .filter(row=>row.island.area_key!==chosen.island.area_key)
    .map(row=>({...row,complementaryBranch:!!(tier.branch&&t.region===tier.region&&t.branch!==tier.branch)})))) : [];
 const next = second.find(row=>settlementPairKey(row)===draft.second) || second[0];
 const plans = next && chosen ? (next.home?[{...next.home,houses},{...next,houses:nextHouses}]:[{...next,houses:nextHouses}]) : [];
 const support = next ? SettlementModel.support(islands,[...network,next.island],plans,difficulty,find) : [];
 const finalPlans = support[0]?.plans || plans;
 const stageRows = [];
 if (chosen) {
  const targets=[{island:chosen.island,tier:chosen.tier,houses}];
  if(next)targets.push({island:next.island,tier:next.tier,houses:nextHouses});
  const earlyFind=draft.specialists?SettlementModel.makeFinders(false):find;
  const expansionSites=next?[...network,next.island]:network;
  stageRows.push({label:'Start on the first island',plans:SettlementModel.stage(network,
   [{...targets[0],tier:SettlementModel.path(chosen.tier)[0]}],difficulty,earlyFind)});
  if(next)stageRows.push({label:'Bring the second island online',plans:SettlementModel.stage(expansionSites,
   targets.map(t=>({...t,tier:SettlementModel.path(t.tier).at(-2)||t.tier})),difficulty,earlyFind)});
  stageRows.push({label:'Supply the endgame tiers',plans:finalPlans.length?finalPlans:[chosen]});
 }
 for(const row of stageRows)row.routes=settlementGroupFlows(row.plans.flatMap(p=>p.flows));
 return {tiers,tier,nextTiers,nextFilter,houses,nextHouses,difficulty,first,chosen,second,next,support,finalPlans,stageRows};

}

function settlementPairKey(row) { return row.island.area_key+'@'+row.tier.guid; }
function settlementGroupFlows(flows) {
 const pairs = new Map();
 for (const flow of flows) {
  const key = [flow.island.area_key,flow.destination.area_key].sort().join('/');
  if (!pairs.has(key)) pairs.set(key,{from:flow.island,to:flow.destination,legs:[]});
  pairs.get(key).legs.push(flow);
 }
 return [...pairs.values()];
}
function settlementRoute(step,index) {
 const context = settlementContext();
 if (!context) return;
 const result = settlementResults(context);
 const flow=result.stageRows[Number(step)]?.routes[index];
 if(!flow)return;
 const state=tradeState();
 if(state.draft) {
  state.view='editor';
  state.error='Finish or save this draft, then return to Settlement Planner to open the proposed route.';
  nav('routes');
  return;
 }
 const from = {id:tradeId(),areaKey:flow.from.area_key,name:flow.from.name};
 const to = {id:tradeId(),areaKey:flow.to.area_key,name:flow.to.name};
 const minutes = Math.min(1440,Math.max(0,context.draft.minutes || 0));
 state.view = 'editor';
 state.error = '';
 state.conflict = false;
 state.draftRevision = state.doc.revision;
 state.draft = {id:tradeId(),name:from.name+' → '+to.name,ship:'',slots:null,slotCapacity:null,
  stops:[from,to],cargo:flow.legs.flatMap(leg=>[...leg.goods].map(([good,rate])=>{
   const forward = leg.island.area_key===from.areaKey;
   return {id:tradeId(),productGuid:good,productName:gameName(good),from:forward?from.id:to.id,
    to:forward?to.id:from.id,amount:minutes?Math.ceil(rate*minutes):null,hintRate:rate,suggestionKey:''};
  }))};
 nav('routes');
}

function settlementSelect(label, field, options, selected) {
 return '<label><span>'+esc(label)+'</span><select class="form-input" onchange="settlementSet(\''+field+'\',this.value)">'+
  options.map(([id,name])=>'<option value="'+esc(String(id))+'" '+(id===selected?'selected':'')+'>'+esc(name)+'</option>').join('')+'</select></label>';
}
function settlementNumber(label, field, value, min, max) {
 return '<label><span>'+esc(label)+'</span><input class="form-input" type="number" min="'+min+'" max="'+max+
  '" value="'+value+'" onchange="settlementSet(\''+field+'\',this.value)"></label>';
}
const settlementResourceNames={149820:'Hippo Population',150506:'Gold Ore Deposit'};
function settlementResourceName(id) {
 return gameName(id,settlementResourceNames[id]||'Unnamed resource');
}
function settlementGapGoods(row) {
 return [...new Set(row.unresolved.flatMap(group=>[...group.goods.keys()]))];
}
function settlementTierNeeds(row,tier) {
 const area=advisorSaved()?.areas?.find(a=>a.area_key===row.island.area_key);
 const houses=(area?.housing||[]).filter(h=>h.tier_guid===tier.guid).reduce((n,h)=>n+h.count,0);
 const needs=N.needs.filter(n=>n.region===tier.region&&n.tier===tier.tier);
 const choices=new Map(row.choices.map(choice=>[choice.good,choice]));
 const gaps=new Set(settlementGapGoods(row));
 const goods=needs.map(need=>{
  const saved=savedNeedSummary(area,need.product_guid,tier.guid);
  const choice=choices.get(need.product_guid);
  let recorded='Unknown';
  if(saved&&(saved.explicit_zero||saved.explicit_partial))recorded='Not fully met';
  else if(saved&&houses>0&&saved.explicit_full>=houses&&!saved.omitted)recorded='Met';
  let proposed=need.is_service?'Check service coverage':need.only_available_through_buff?'Conditional need':'Supply not assessed';
  if(choice)proposed=!choice.missing.length?'Local chain':choice.missing.some(g=>gaps.has(g))?'Source needed':'Import planned';
  return {need,recorded,proposed};
 });
 return {tier,houses,goods};
}
function settlementTierHTML(row) {
 return `<div class="pv-tier-list">${row.tiers.map(tier=>{
  const {houses,goods}=settlementTierNeeds(row,tier);
  const met=goods.filter(g=>g.recorded==='Met').length;
  const low=goods.filter(g=>g.recorded==='Not fully met').length;
  const unknown=goods.length-met-low;
  const summary=houses?`${met} met · ${low} not fully met${unknown?' · '+unknown+' unknown':''}`:
   row.island.owned?'No residences recorded':'Proposed tier';
  return `<details class="pv-tier" data-pv-key="tier-${esc(row.island.area_key)}-${tier.guid}"><summary>
   ${needArt(tier.tier)}<span><b>${esc(gameName(tier.guid,tier.tier))}</b><small>${esc(summary)}</small></span>${svg('chevron')}</summary>
   <div class="pv-tier-needs"><div class="pv-tier-legend"><span>Need</span><span>In the save</span><span>In the plan</span></div>
    ${goods.map(({need,recorded,proposed})=>`<div class="pv-need-row"><span>${icon(need.product_guid)}${esc(gameName(need.product_guid,need.product_name))}</span>
     <span class="pv-need-state ${recorded==='Met'?'positive':recorded==='Not fully met'?'negative':''}">${recorded}</span><span>${proposed}</span></div>`).join('')}</div>
  </details>`;
 }).join('')}</div>`;
}
function settlementCandidateChanges(row, reference) {
 const plans = candidate => [candidate, ...(candidate.home ? [candidate.home] : [])];
 const local = candidate => candidate.choices.filter(choice=>!choice.missing.length).map(choice=>choice.good);
 const difference = (left,right) => left.filter(good=>!right.includes(good));
 const goods = ids => ids.map(good=>esc(gameName(good))).join(', ');
 const facts = [];
 const details = [];
 function measure(value, baseline, label, unit='') {
  const delta = value-baseline;
  if (Math.abs(delta)>=.005) facts.push(`${delta>0?'+':'−'}${fmt(Math.abs(delta))}${unit} ${label}`);
 }
 function names(label, ids) {
  if(ids.length) details.push(`<li><b>${label}</b> ${goods(ids)}</li>`);
 }
 measure(row.localGoods,reference.localGoods,'local chains');
 measure(row.networkBuildings??row.buildings,reference.networkBuildings??reference.buildings,'capacity buildings');
 const shipping = candidate => plans(candidate).reduce((total,plan)=>total+plan.importRate,0);
 measure(shipping(row),shipping(reference),'to ship',' t/min');
 names('Now fully local',difference(local(row),local(reference)));
 names('No longer fully local',difference(local(reference),local(row)));
 plans(row).forEach((plan,index)=>{
  const previous = plans(reference)[index];
  if (!previous) return;
  const suffix = index ? ' on the first island' : '';
  const missing = settlementGapGoods(plan);
  const oldMissing = settlementGapGoods(previous);
  names('Source found'+suffix,difference(oldMissing,missing));
  names('Still need a new source'+suffix,difference(missing,oldMissing));
  const sources = candidate => new Map(candidate.flows.flatMap(flow=>[...flow.goods.keys()].map(good=>[good,flow.island])));
  const before = sources(previous);
  for (const [good,from] of sources(plan)) {
   if (before.has(good) && before.get(good).area_key!==from.area_key) {
    details.push(`<li><b>${esc(gameName(good))} imports${suffix}</b> ${esc(before.get(good).name)} → ${esc(from.name)}</li>`);
   }
  }
 });
 return {facts,details};
}
function settlementCandidates(rows, field, selected) {
 if (!rows.length) return '<p>No eligible islands recorded for this target.</p>';
 const second = field==='second';
 const reference = selected || rows[0];
 const sameTier = rows.filter(row=>row!==reference && row.tier.guid===reference.tier.guid);
 const otherTiers = rows.filter(row=>row.tier.guid!==reference.tier.guid);
 const goods = ids => ids.map(good=>esc(gameName(good))).join(', ');
 function card(row) {
  const {island,tier} = row;
  const id = second?settlementPairKey(row):island.area_key;
  const comparable = tier.guid===reference.tier.guid;
  const {facts,details} = comparable ? settlementCandidateChanges(row,reference) :
   {facts:[`${row.localGoods}/${row.choices.length} local chains`,`${row.open} without a source`],
    details:row.open?[`<li><b>Needs a source</b> ${goods(settlementGapGoods(row))}</li>`]:[]};
  return `<article class="pv-candidate">
   <button type="button" onclick="settlementSet('${field}','${esc(id)}')" aria-label="Choose ${esc(island.name)}, ${esc(gameName(tier.guid,tier.tier))}">
    <span><strong>${esc(island.name)}</strong><small>${island.owned?'Already settled':'Settlement candidate'}${comparable?'':' · '+esc(tier.region)+' · '+esc(gameName(tier.guid,tier.tier))}</small></span>
    <span class="pv-candidate-tag">Choose island</span>${svg('chevron')}</button>
   <div class="pv-candidate-facts">${facts.map(fact=>`<span>${esc(fact)}</span>`).join('')}${!facts.length&&!details.length?'<span>Same totals, goods and import sources</span>':''}</div>
   ${details.length?`<ul class="pv-candidate-change">${details[0]}</ul>`:''}
   ${details.length>1||island.fertilities.length?`<details data-pv-key="${field}-island-${esc(id)}"><summary>${details.length>1?'More differences and resources':'Resources'}</summary>
    ${details.length>1?`<ul>${details.slice(1).join('')}</ul>`:''}
    ${island.fertilities.length?`<p><b>Recorded resources</b> ${island.fertilities.map(settlementResourceName).map(esc).join(' · ')}</p>`:''}</details>`:''}</article>`;
 }
 const missing = settlementGapGoods(reference);
 const homeMissing = reference.home ? settlementGapGoods(reference.home) : [];
 const summary = `<div class="pv-candidate-reference">
   <span>${selected?'Comparing with':'Suggested starting point'}</span>
   <strong>${esc(reference.island.name)}</strong><small>${esc(reference.tier.region)} · ${esc(gameName(reference.tier.guid,reference.tier.tier))}</small>
   <p>${reference.localGoods}/${reference.choices.length} local chains · ${reference.networkBuildings??reference.buildings} capacity buildings${second?' across both settlements':''}</p>
   ${missing.length?`<p><b>Needs a source</b> ${goods(missing)}</p>`:''}
   ${homeMissing.length?`<p><b>Still needed on the first island</b> ${goods(homeMissing)}</p>`:''}
   ${selected?'':`<button type="button" class="link" onclick="settlementSet('${field}','${esc(second?settlementPairKey(reference):reference.island.area_key)}')">Choose island ${svg('arrow')}</button>`}
  </div>`;
 const list = options => `<div class="settlement-candidates">${options.map(card).join('')}</div>`;
 return summary + (sameTier.length ? list(sameTier.slice(0,3)) : '<p>No other islands for this target.</p>') +
  (sameTier.length>3?`<details data-pv-key="${field}-more"><summary>Show ${sameTier.length-3} more islands for this target</summary>${list(sameTier.slice(3))}</details>`:'') +
  (otherTiers.length?`<details data-pv-key="${field}-other-tiers"><summary>Other target tiers · ${otherTiers.length} options</summary>${list(otherTiers)}</details>`:'');
}
function settlementDetails(result) {
 if (!result) return '';
 const label = good => esc(gameName(good));
 return `<section class="settlement-plan"><h3>${esc(result.island.name)} supply plan</h3>
  <div class="settlement-goods">${result.choices.map(c=>`<span>${icon(c.good)}<b>${label(c.good)}</b> ${fmt(c.amount)} t/min
    <small>${c.recipe ? esc(c.recipe.factory.factory_name)+(c.missing.length?' · requires imported inputs':' · local chain') : 'Import finished good'}</small></span>`).join('')}</div>
  <p>Development path: ${result.tiers.map(t=>esc(gameName(t.guid,t.tier))).join(' → ')}</p>
  <details><summary>Balanced production · ${result.buildings} nominal buildings</summary>
  ${result.production.map(row=>`<h4>${esc(row.island.name)}</h4><ul>${[...row.steps].map(([id,count])=>`<li>${Math.ceil(count-1e-9)} × ${label(id)}</li>`).join('')}</ul>`).join('')}</details>
  <details><summary>Public services and conditional needs</summary><ul>${[...result.services,...result.conditionalNeeds].map(n=>`<li>${esc(n.tier)} · ${label(n.product_guid)}${n.only_available_through_buff?' · conditional':''}</li>`).join('')}</ul></details>
  ${[result,...(result.home?[result.home]:[])].flatMap(plan=>[...plan.specialistGrants]).map(([site,ids])=>`<p>Future specialist on ${esc(site)}: ${[...ids].map(label).join(', ')}. Check acquisition and coverage.</p>`).join('')}
  ${result.home?`<p>First island after expansion: <b>${result.home.open}</b> goods or inputs still need a source. Combined nominal capacity: <b>${result.networkBuildings}</b> buildings.</p>`:''}
  ${[result,...(result.home?[result.home]:[])].flatMap(row=>row.unresolved.map(entry=>`<p class="negative">${esc(row.island.name)} needs a source for ${[...entry.goods].map(([g,rate])=>{
   const regions = SettlementModel.sourceRegions(g);
   return label(g)+' '+fmt(rate)+' t/min'+(regions.length?' (catalogue: '+esc(regions.join(' / '))+')':'');
  }).join(' · ')}.</p>`)).join('')}

 </section>`;
}

function settlementPage() {
 const context = settlementContext();
 if (!context) return `<section class="settlement-panel"><h2>Start with a campaign save</h2><p>Load a recent save in Live mode and turn on Use save data. The planner reads the island list even before you found your first settlement.</p><button class="primary" onclick="nav('insights')">Choose a save</button><button class="secondary" onclick="refreshSaveInsights()">Refresh data</button></section>`;
 const {draft, save, regions} = context;
 const r = settlementResults(context);
 const minutes = Math.max(0,Math.min(1440,draft.minutes || 0));
 const targetName = t => gameName(t.guid,t.tier)+(t.branch?' · '+t.branch+' path':'');
 const options = tiers => tiers.map(t=>[t.guid,targetName(t)]);
 return `<div class="settlement-layout">
  ${settlementOverview(r,minutes)}
  <details class="settlement-panel pv-disclosure" data-pv-key="settings"><summary>Planning settings <small>${esc(save.profile_display_name||save.profile_name||save.file_name)}</small></summary>
   <div class="settlement-fields">${settlementSelect('Starting province','region',regions.map(n=>[n,n]),draft.region)}
   ${settlementSelect('Target branch','tier',[[0,'Automatic · '+targetName(r.tier)],...options(r.tiers)],r.tiers.some(t=>t.guid===draft.tier)?draft.tier:0)}
   ${settlementNumber('First island residences','houses',r.houses,1,100000)}
   ${settlementSelect('Consumption setting','difficulty',settlementDifficulties.map(n=>[n,n==='VeryHigh'?'Very high':n]),r.difficulty)}
   ${settlementNumber('Delivery interval (game min, 0 = unknown)','minutes',minutes,0,1440)}</div>
   <label><input type="checkbox" ${draft.specialists?'checked':''} onchange="settlementSet('specialists',this.checked)"> Include future fertility specialists</label>
   <button class="link" onclick="nav('insights')">Choose a different save ${svg('arrow')}</button>
   ${draft.specialists?'<p>Check acquisition and coverage for any specialist shown in the plan.</p>':''}</details>
  <details class="settlement-panel pv-disclosure" id="settlement-first" ${!r.chosen?'open':''}><summary>Compare first islands <small>${r.first.length} candidates</small></summary>
   ${settlementCandidates(r.first,'first',r.chosen)}
  </details>
  ${r.chosen?`<details class="settlement-panel pv-disclosure" id="settlement-second"><summary>Compare next settlements <small>${r.second.length} island and tier options</small></summary>
   <div class="settlement-fields">${settlementSelect('Compare endgame branches','next',[[0,'Recommend automatically'],...r.nextTiers.map(t=>[t.guid,t.region+' · '+targetName(t)])],r.nextFilter||0)}
    ${settlementNumber('Target residences','nextHouses',r.nextHouses,1,100000)}</div>
   ${settlementCandidates(r.second,'second',r.next)}
   </details>`:''}
  ${r.chosen?`<details class="settlement-panel pv-disclosure"><summary>Production, services and open supply gaps</summary>${(r.finalPlans.length?r.finalPlans:[r.chosen]).map(settlementDetails).join('')}</details>`:''}
  <details class="settlement-panel"><summary>What the planner checks</summary><p>Sizes complete nominal chains for every regular good on the selected tier path. Shared goods use the highest demand across stages. Buildings round up after shared inputs are combined. Next-island recommendations compare island and tier together. Future sources require new production capacity. The two residence targets are scenarios; existing demand and deliveries still need to be checked before building a shared route.</p><p>Confirm settlement rights, harbour and buildable space, unlocks, water access, seasonal production and public services in game. A recorded resource does not establish usable capacity. The save may contain islands you have yet to scout. Only provinces present in the save are shown.</p></details>
 </div>`;
}

companionPages.settlement = {offline:true,titles:['EXPANSION PLANNING','Settlement Planner','Choose where to settle, develop your tiers and connect your islands.'],content:settlementPage};
