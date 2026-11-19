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
 return {tiers,tier,nextTiers,nextFilter,houses,nextHouses,difficulty,first,chosen,second,next,support};

}

function settlementPairKey(row) { return row.island.area_key+'@'+row.tier.guid; }
function settlementShipments(result, step) {
 const flows = [...result.flows,...(step==='next'?result.home?.flows||[]:[])];
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
 const target = step === 'first' ? result.chosen : result.next;
 const flow = step==='support' ? settlementShipments({flows:result.support[0]?.flows||[]},step)[index] :
   target && settlementShipments(target,step)[index];
 if (!flow) return;
 const state = tradeState();
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
function settlementTop(rows, selected, pair=false) {
 const chosen = rows.find(row => (pair?settlementPairKey(row):row.island.area_key) === selected);
 return chosen && rows.indexOf(chosen) > 3 ? [...rows.slice(0,3),chosen] : rows.slice(0,4);
}
function settlementRest(rows, selected, pair=false) {
 const top = new Set(settlementTop(rows,selected,pair));
 return rows.filter(row=>!top.has(row));
}
function settlementCandidates(rows, field, selected, showBest=true) {
 return rows.length ? '<div class="settlement-candidates">'+rows.map((r,i)=>{
  const island = r.island;
  const id = field==='second'?settlementPairKey(r):island.area_key;
  const active = selected === id;
  return `<article><button type="button" aria-pressed="${active}" onclick="settlementSet('${field}','${esc(id)}')">
   <span><strong>${esc(island.name)}${field==='second'?' · '+esc(gameName(r.tier.guid,r.tier.tier)):''}</strong><small>${active?'Selected · ':i===0&&showBest?'Best match · ':''}${island.owned?'Already settled':field==='second'&&settlementContext()?.draft.first===island.area_key?'Continue here':'Settlement candidate'}</small></span>
   <span><b>${r.localGoods}/${r.choices.length} local goods</b><small>${esc(island.region)} · ${r.open} unresolved · ${r.networkBuildings??r.buildings} buildings</small></span>${svg('chevron')}</button>
   <details><summary>Fertilities and deposits recorded in the save</summary><p>${island.fertilities.length?island.fertilities.map(g=>esc(gameName(g))).join(' · '):'No entries recorded.'}</p></details></article>`;
 }).join('')+'</div>' : '<p>No eligible candidates recorded in this region.</p>';
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
   ${settlementCandidates(settlementTop(r.first,draft.first),'first',draft.first)}
   ${r.first.length>4?`<details><summary>Compare ${r.first.length-4} more islands</summary>${settlementCandidates(settlementRest(r.first,draft.first),'first',draft.first,false)}</details>`:''}
  </details>
  ${r.chosen?`<details class="settlement-panel pv-disclosure" id="settlement-second"><summary>Compare next settlements <small>${r.second.length} island and tier options</small></summary>
   <div class="settlement-fields">${settlementSelect('Compare endgame branches','next',[[0,'Recommend automatically'],...r.nextTiers.map(t=>[t.guid,t.region+' · '+targetName(t)])],r.nextFilter||0)}
    ${settlementNumber('Target residences','nextHouses',r.nextHouses,1,100000)}</div>
   ${settlementCandidates(settlementTop(r.second,r.next&&settlementPairKey(r.next),true),'second',r.next&&settlementPairKey(r.next))}
   ${r.second.length>4?`<details><summary>Compare ${r.second.length-4} more options</summary>${settlementCandidates(settlementRest(r.second,r.next&&settlementPairKey(r.next),true),'second',r.next&&settlementPairKey(r.next),false)}</details>`:''}
   </details>`:''}
  ${r.chosen?`<details class="settlement-panel pv-disclosure"><summary>Production, services and open supply gaps</summary>${settlementDetails(r.chosen)}${settlementDetails(r.next)}</details>`:''}
  <details class="settlement-panel"><summary>What the planner checks</summary><p>Sizes complete nominal chains for every regular good on the selected tier path. Shared goods use the highest demand across stages. Buildings round up after shared inputs are combined. Next-island recommendations compare island and tier together. Future sources require new production capacity. The two residence targets are scenarios; existing demand and deliveries still need to be checked before building a shared route.</p><p>Confirm settlement rights, harbour and buildable space, unlocks, water access, seasonal production and public services in game. A recorded resource does not establish usable capacity. The save may contain islands you have yet to scout. Only provinces present in the save are shown.</p></details>
 </div>`;
}

companionPages.settlement = {offline:true,titles:['EXPANSION PLANNING','Settlement Planner','Choose where to settle, develop your tiers and connect your islands.'],content:settlementPage};
