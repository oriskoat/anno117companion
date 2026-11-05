'use strict';
let chainTier='all',chainGood='all',chainDlc='all';
let planner={guid:null,choices:{},productivity:{},setting:localStorage.getItem('anno.consumption')||'Low'};
// Reference grouping/order: anno.land/en/anno-117-tools/produktionsketten/ (2026-10-31).
// Additional official game recipes remain after the reference goods in their tier.
const chainTierOrder={Latium:['Infrastructure','Liberti','Plebeians','Equites','Patricians'],Albion:['Infrastructure','Waders','Smiths','Aldermen','Mercators','Nobles'],Aegyptus:['Infrastructure','Threshers','Potters','Chanters','Scribes','Gymnasiarchs']};
const chainProgressionOrder={
 'Latium/Infrastructure':['Timber','Tiles','Concrete','Marble','Mosaic','Ropes','Sails','Weapons','Armour'],
 'Latium/Liberti':['Porridge','Tunics','Pileus'],
 'Latium/Plebeians':['Bread','Garum','Soap','Sandals','Amphorae','Olive Oil'],
 'Latium/Equites':['Wine','Writing Tablets','Togas','Fine Glass','Statuettes'],
 'Latium/Patricians':['Oysters with Caviar','Loungers','Necklaces','Latrunculi Sets','Lyres'],
 'Albion/Infrastructure':['Timber','Wattle & Daub','Tiles','Concrete','Granite','Sails','Ropes','Weapons','Armour'],
 'Albion/Waders':['Reed Shoes','Tunics'],
 'Albion/Smiths':['Cheese','Beer','Trousers','Drinking Horns','Torcs','Ceremonial Shields'],
 'Albion/Aldermen':['Roast Beef','Cloaks','Fur Hats','Chariots'],
 'Albion/Mercators':['Bread','Sausages','Brooches','Amphorae'],
 'Albion/Nobles':['Bird Tongues in Aspic','Wigs','Wine','Handmirrors']
};
function chainGroupRank(c){return (c.region==='Latium'?0:c.region==='Albion'?100:200)+(chainTierOrder[c.region]?.indexOf(c.tier)??99);}
function chainSortRecord(c){const f=K.factories.find(f=>f.factory_guid===c.factory_guid),position=chainProgressionOrder[c.region+'/'+c.tier]?.indexOf(c.name)??-1;return {name:gameName(c.product_guid,c.name),id:c.factory_guid,capacity:f.outputs[0].amount_per_minute_100pct,progression:position<0?1000+K.chains.indexOf(c):position};}
function chainPage(){
 return `<div class="search">${svg('search')}<input aria-label="Search production chains" placeholder="Search good, ingredient or building…" value="${esc(chainSearch)}" oninput="chainSearch=this.value;renderChains()"></div>${browseToolbar('chains')}<div class="chain-selectors"><label>Region<select id="chainRegionFilter" onchange="chainRegion=this.value;chainTier='all';renderChains()"><option value="all">All regions</option>${Object.keys(chainTierOrder).map(r=>`<option ${chainRegion===r?'selected':''}>${r}</option>`).join('')}</select></label><label>Population tier<select id="chainTierFilter" onchange="chainTier=this.value;renderChains()"></select></label><label>Good<select id="chainGoodFilter" onchange="chainGood=this.value;renderChains()"><option value="all">All goods</option>${[...new Set(K.chains.map(c=>c.product_guid))].sort((a,b)=>gameName(a).localeCompare(gameName(b))).map(g=>`<option value="${g}" ${String(g)===chainGood?'selected':''}>${esc(gameName(g))}</option>`).join('')}</select></label><label>Recipe filter<select onchange="chainType=this.value;renderChains()"><option value="all">All production</option><option value="raw">Raw materials</option><option value="processed">Processed goods</option><option value="fuel">Uses fuel</option><option value="specialists">Specialist options</option></select></label><label>DLC<select id="chainDlcFilter" onchange="chainDlc=this.value;renderChains()"><option value="all">All content</option><option value="base">Base game only</option><option value="67902">${esc(gameName(67902,'Prophecies of Ash'))}</option><option value="67904">${esc(gameName(67904,'Dawn of the Delta'))}</option></select></label></div><p class="small-note">Browse by region, population tier and good. Nominal recipes: extracted patch 3.0. Open a chain to compare your current islands and plan additional production.</p><div id="chainCount" class="small-note"></div><div id="chainList"></div>`;
}
function renderChains(){
 $('chainDlcFilter').value=chainDlc;
 const tiers=[...new Set(K.chains.filter(c=>chainRegion==='all'||c.region===chainRegion).map(c=>c.tier))];
 if(!tiers.includes(chainTier))chainTier='all';
 $('chainTierFilter').innerHTML='<option value="all">All tiers</option>'+tiers.map(t=>`<option ${chainTier===t?'selected':''}>${esc(t)}</option>`).join('');
 const query=chainSearch.trim().toLowerCase();
 const rows=K.chains.filter(c=>{
  const f=K.factories.find(f=>f.factory_guid===c.factory_guid);
  return (chainRegion==='all'||c.region===chainRegion)&&(chainTier==='all'||c.tier===chainTier)&&(chainGood==='all'||c.product_guid===Number(chainGood))&&(chainDlc==='all'||chainDlc==='base'&&!c.dlc_unlock_guids.length||c.dlc_unlock_guids.includes(Number(chainDlc)))&&
   [gameName(c.product_guid,c.name),gameName(f.factory_guid,f.factory_name),c.product_guid,...f.inputs.map(i=>gameName(i.product_guid,i.product_name))].join(' ').toLowerCase().includes(query)&&
   (chainType==='all'||chainType==='raw'&&!f.inputs.length||chainType==='processed'&&f.inputs.length||chainType==='fuel'&&f.needs_fuel||chainType==='specialists'&&relevantSpecialists([f.factory_guid]).length);
 });
 $('chainCount').textContent=`${rows.length} chains · alternative producers available inside each good`;
 rows.sort((a,b)=>chainGroupRank(a)-chainGroupRank(b)||browseCompare('chains',chainSortRecord(a),chainSortRecord(b)));
 const groups=new Map();for(const c of rows){const id=c.region+' · '+c.tier;if(!groups.has(id))groups.set(id,[]);groups.get(id).push(c);}
 $('chainList').innerHTML=[...groups].map(([title,chains])=>`<section class="chain-group"><div class="section-title"><h2>${esc(title)}</h2><span class="badge">${chains.length}</span></div><div class="chain-grid">${chains.map(c=>{
  const f=K.factories.find(f=>f.factory_guid===c.factory_guid),p=allProducts.find(p=>p.guid===c.product_guid);
  return `<button class="card chain-card" onclick="openChain(${c.factory_guid},'','${c.region}')"><div class="route-head">${icon(c.product_guid)}<div class="route-title"><h3>${esc(gameName(c.product_guid,c.name))}</h3><p>${esc(gameName(c.factory_guid,f.factory_name))}</p></div>${svg('chevron','chevron')}</div><div class="recipe-strip">${c.nodes.map(n=>`<span>${esc(gameName(n.building_guid,n.building_name))}</span>`).join(' '+svg('arrow')+' ')}</div><div class="chain-footer"><span>${fmt(f.outputs[0].amount_per_minute_100pct)} / min at 100%</span><span class="${p?.delta<0?'negative':''}">${p?`${isDemo?'Recorded':'Current'} balance ${signed(p.delta)}`:'No game observations'}</span></div></button>`;
 }).join('')}</div></section>`).join('')||empty('No matching chains','Try another region, tier or good.');
}
function productGameContext(guid){
 const rows=allEntries.filter(e=>e.ProductGuid===Number(guid)).sort((a,b)=>a.ProductDelta-b.ProductDelta);
 const routes=(snapshot?.supply_suggestions||[]).filter(s=>s.product_guid===Number(guid));
 return `<section class="game-context"><div class="detail-title">${isDemo?'Your recorded game':'Your current game'}</div><p class="small-note">${isDemo?'Saved session':'Latest received statistics'}. Local balances exclude imports and warehouse stock. Pipe rate time unit is not yet verified; building estimates using these rates are provisional.</p>${rows.length?`<div class="island-balances">${rows.map(e=>`<button class="island-balance" onclick="openProduct(${guid},'${e.areaKey}')"><span><b>${esc(e.area.area_name)}</b><small>${areaDataLabel(e.area)}</small></span><span><small>Production / consumption</small>${fmt(e.ProductGeneration)} / ${fmt(e.ProductConsumption)}</span><strong class="${e.ProductDelta<0?'negative':'positive'}">${signed(e.ProductDelta)}</strong>${svg('chevron')}</button>`).join('')}</div>`:'<p class="small-note">No observations for this good. Open Production Statistics in the game to publish more data.</p>'}<div class="detail-title">Supply suggestions</div>${routes.length?routes.map(routeCard).join(''):`<p class="small-note">${rows.some(e=>e.ProductDelta<-.01)?'No eligible surplus is available in the received data. Check existing imports and input supply before adding production.':'No transfer suggested from the available island balances.'}</p>`}</section>`;
}
function openChain(factoryGuid,area='',preferredRegion='',balancedWithoutDeficit=false){
 const f=K.factories.find(f=>f.factory_guid===Number(factoryGuid));if(!f)return;
 const guid=f.outputs[0].product_guid,rows=allEntries.filter(e=>e.ProductGuid===guid);
 const selected=rows.find(e=>e.areaKey===area&&(!balancedWithoutDeficit||e.ProductDelta<0)),wantedRegion=preferredRegion||(procurementRegion(selected?.area)||f.regions[0]),planningRegion=f.regions.includes(wantedRegion)?wantedRegion:f.regions[0],target=selected?Math.max(0,-selected.ProductDelta):balancedChainTarget(factoryGuid,100,{}, {},planningRegion);
 const residences=K.consumption.records.filter(r=>r.product_guid===guid&&f.regions.includes(r.region));
 sheet(`<div class="kicker">PRODUCTION CHAIN · ${esc(planningRegion)}</div><div class="sheet-product">${icon(guid)}<div><h2>${esc(gameName(guid,f.outputs[0].product_name))}</h2><p class="sub">${esc(gameName(factoryGuid,f.factory_name))}</p></div></div>${productGameContext(guid)}<label class="field-label">Producer<select class="form-input" aria-label="Producer alternative" onchange="openChain(Number(this.value),'${area}','${planningRegion}',${balancedWithoutDeficit})">${producers(guid).map(p=>`<option value="${p.factory_guid}" ${p.factory_guid===factoryGuid?'selected':''}>${esc(gameName(p.factory_guid,p.factory_name))} · ${p.regions.join(' / ')}</option>`).join('')}</select></label>${f.regions.length>1?`<label class="field-label">Region<select class="form-input" aria-label="Production region" onchange="openChain(${factoryGuid},'',this.value)">${f.regions.map(r=>`<option ${r===planningRegion?'selected':''}>${esc(r)}</option>`).join('')}</select></label>`:''}<div class="detail-title">Plan additional production</div><label class="field-label">Planning basis<select id="chainBasis" class="form-input" onchange="setChainBasis(${factoryGuid})"><option value="balanced" ${!selected?'selected':''}>Balanced chain</option><option value="manual">Custom output / min</option>${rows.map(e=>`<option value="${e.areaKey}" ${selected?.areaKey===e.areaKey?'selected':''}>${esc(e.area.area_name)} · local gap ${fmt(Math.max(0,-e.ProductDelta))}</option>`).join('')}${residences.length?'<option value="residences">Additional residences</option>':''}</select></label><div id="residenceFields" hidden><div class="calculator-fields"><label>Population tier<select id="residenceTier" class="form-input" onchange="setChainBasis(${factoryGuid})">${residences.map((r,i)=>`<option value="${i}">${esc(r.region+' · '+r.tier)}${r.only_available_through_buff?' · conditional need':''}</option>`).join('')}</select></label><label>Additional houses<input id="residenceCount" class="form-input" type="number" min="1" step="1" value="50" oninput="setChainBasis(${factoryGuid})"></label><label>Consumption difficulty<select id="consumptionSetting" class="form-input" onchange="planner.setting=this.value;localStorage.setItem('anno.consumption',this.value);setChainBasis(${factoryGuid})">${['Low','Medium','High','VeryHigh'].map(s=>`<option ${planner.setting===s?'selected':''}>${s==='VeryHigh'?'Very High':s}</option>`).join('')}</select></label></div><p class="small-note">Manual expansion scenario. All needs unlocked and enabled; no consumption modifiers. Difficulty changes residence demand, not factory input ratios. Residence count is not provided by the pipe.</p></div><div class="calculator-fields"><label>Additional output / min<input id="chainTarget" class="form-input" type="number" min="0" step="0.1" value="${target}" oninput="if(document.getElementById('chainBasis').value==='balanced')document.getElementById('chainBasis').value='manual';setChainBasis(${factoryGuid})"></label><label>Default productivity %<input id="chainProductivity" class="form-input" type="number" min="1" max="1000" value="100" oninput="calculateChain(${factoryGuid})"></label></div><p id="planningNote" class="small-note"></p><p class="small-note">Counts are additional capacity for this target. Existing production is already included in a selected island's balance. Ratios use nominal output; build counts round up. Set productivity per step below; no equipped specialist is assumed.</p><div id="chainCalculation"></div><div class="detail-title">Specialists for this producer</div>${specialistCards(relevantSpecialists([factoryGuid]),[factoryGuid])}<details><summary>Original recipe and source</summary><pre>${esc(JSON.stringify(f,null,2))}</pre></details>`);
 planner={...planner,guid:factoryGuid,region:planningRegion,choices:{},productivity:{}};
 setChainBasis(factoryGuid);
}
function setChainBasis(guid){
 const f=K.factories.find(f=>f.factory_guid===guid),basis=$('chainBasis').value;
 $('residenceFields').hidden=basis!=='residences';$('chainTarget').readOnly=!['manual','balanced'].includes(basis);
 if(basis==='residences'){
  const r=K.consumption.records.filter(r=>r.product_guid===f.outputs[0].product_guid&&f.regions.includes(r.region))[Number($('residenceTier').value)];
  const count=Number($('residenceCount').value);$('chainTarget').value=Number.isFinite(count)&&count>=0?Number((r.rates[planner.setting]*count).toFixed(6)):0;
  $('planningNote').textContent=`${r.tier}: ${r.rates[planner.setting]} per house / min at ${planner.setting} consumption. ${r.activation_note}`;
 }else if(basis==='balanced'){
  $('planningNote').textContent='Smallest balanced set at the selected productivity. Fuel capacity rounds up separately.';
 }else if(basis!=='manual'){
  const e=allEntries.find(e=>e.areaKey===basis&&e.ProductGuid===f.outputs[0].product_guid);$('chainTarget').value=Math.max(0,-(e?.ProductDelta||0));
  $('planningNote').textContent=`${isDemo?'Recorded':'Received'} local deficit. Consumption already reflects the game's difficulty and modifiers. Check existing imports; a local deficit alone does not prove an actual shortage. Rate-to-minute conversion remains unverified.`;
 }else $('planningNote').textContent='Custom nominal output. Enter the additional production you want to build.';
 calculateChain(guid);
}
function chainPlan(factoryGuid,target,productivity,choices={},overrides={},preferredRegion=''){
 const root=K.factories.find(f=>f.factory_guid===Number(factoryGuid)),steps=new Map(),cycles=[];
 if(!root||!Number.isFinite(target)||target<0||!Number.isFinite(productivity)||productivity<=0)return {steps:[],cycles:['Enter valid positive productivity and nonnegative output.']};
 function add(f,productGuid,amount,path,fuelBranch=false){
  if(!amount)return;
  if(path.includes(f.factory_guid)){cycles.push('Recipe cycle: '+f.factory_name);return;}
  const pct=Number(overrides[f.factory_guid]||productivity),output=f.outputs.find(o=>o.product_guid===productGuid),rate=output?.amount_per_minute_100pct*pct/100;
  if(!(rate>0)){cycles.push('No valid output rate for '+f.factory_name);return;}
  const count=amount/rate,id=f.factory_guid+':'+productGuid,old=steps.get(id)||{factory:f,count:0,productGuid,required:0,productivity:pct,usedBy:new Set(),primaryCount:0};if(!fuelBranch)old.primaryCount+=count;if(path.length)old.usedBy.add(path[path.length-1]);old.count+=count;old.required+=amount;steps.set(id,old);
  const next=[...path,f.factory_guid];
  const inputs=[...f.inputs];if(f.needs_fuel&&!inputs.some(i=>i.product_guid===f.fuel_product_guid))inputs.push({product_guid:f.fuel_product_guid,product_name:gameName(f.fuel_product_guid,'Fuel'),amount_per_minute_100pct:f.fuel_amount_per_minute_100pct,fuelBranch:true});
  for(const i of inputs){
   const options=producers(i.product_guid).filter(p=>p.regions.some(r=>preferredRegion? r===preferredRegion:root.regions.includes(r)));
   const chosen=options.find(p=>p.factory_guid===Number(choices[i.product_guid]))||options[0];
   const needed=count*i.amount_per_minute_100pct*pct/100;
   if(chosen)add(chosen,i.product_guid,needed,next,fuelBranch||!!i.fuelBranch);else cycles.push(`External supply: ${gameName(i.product_guid,i.product_name)} · ${fmt(needed)} / min`);
  }
 }
 add(root,root.outputs[0].product_guid,target,[]);return {steps:[...steps.values()].reverse(),cycles:[...new Set(cycles)]};
}
function balancedChainTarget(guid,productivity=100,choices={},overrides={},preferredRegion=''){
 const plan=chainPlan(guid,1,productivity,choices,overrides,preferredRegion),counts=plan.steps.map(s=>s.primaryCount).filter(c=>c>1e-10);
 if(!counts.length)return 0;
 const gcd=(a,b)=>{while(b){const next=a%b;a=b;b=next;}return a;};
 const denominators=counts.map(count=>{for(let d=1;d<=10000;d++)if(Math.abs(count*d-Math.round(count*d))<1e-7)return d;return 10000;});
 const multiple=denominators.reduce((a,b)=>a/gcd(a,b)*b,1);
 if(!Number.isSafeInteger(multiple))return K.factories.find(f=>f.factory_guid===Number(guid)).outputs[0].amount_per_minute_100pct;
 const common=counts.map(c=>Math.round(c*multiple)).reduce((a,b)=>gcd(a,b));
 return Number((multiple/common).toFixed(9));
}
function calculateChain(guid){
 if($('chainBasis').value==='balanced')$('chainTarget').value=balancedChainTarget(guid,Number($('chainProductivity').value),planner.choices,planner.productivity,planner.region);
 const plan=chainPlan(guid,Number($('chainTarget').value),Number($('chainProductivity').value),planner.choices,planner.productivity,planner.region);
 const root=K.factories.find(f=>f.factory_guid===guid);
 const region=planner.region||root.regions[0];
 const alternatives=[...new Map(plan.steps.filter(step=>step.factory.factory_guid!==guid)
  .map(step=>[step.productGuid,step])).values()].map(step=>{
   const choices=producers(step.productGuid).filter(f=>f.regions.includes(region));
   if(choices.length<2)return '';
   return `<fieldset class="chain-source-options"><legend>${esc(gameName(step.productGuid))} · Alternative producers</legend>${choices.map(f=>`<button type="button" class="secondary" aria-pressed="${f.factory_guid===step.factory.factory_guid}" onclick="planner.choices[${step.productGuid}]=${f.factory_guid};calculateChain(${guid})">${esc(gameName(f.factory_guid,f.factory_name))} · ${fmt(f.outputs.find(o=>o.product_guid===step.productGuid).amount_per_minute_100pct)} / min</button>`).join(' ')}</fieldset>`;
 }).join('');
 $('chainCalculation').innerHTML=alternatives+plan.steps.map(s=>{
  const options=producers(s.productGuid).filter(p=>p.regions.includes(planner.region||root.regions[0]));
  return `<article class="chain-step-detail"><div class="chain-step"><button class="icon-button" aria-label="Open ${esc(gameName(s.productGuid))}" onclick="openProduct(${s.productGuid})">${icon(s.productGuid)}</button><div><button class="inline-link" onclick="openProducer(${s.factory.factory_guid})">${esc(gameName(s.factory.factory_guid,s.factory.factory_name))}</button><p>${fmt(s.count,3)} ratio · ${fmt(s.required)} output / min</p></div><strong>${Math.ceil(s.count-1e-9)}<small>additional buildings</small></strong></div><p class="chain-dependency">${s.usedBy.size?`Used by: ${[...s.usedBy].map(id=>`<button class="inline-link" onclick="openProducer(${id})">${esc(gameName(id))}</button>`).join(' · ')}`:'Final product'}</p><div class="step-controls">${options.length>1&&s.factory.factory_guid!==guid?`<label>Producer<select onchange="planner.choices[${s.productGuid}]=Number(this.value);calculateChain(${guid})">${options.map(f=>`<option value="${f.factory_guid}" ${f.factory_guid===s.factory.factory_guid?'selected':''}>${esc(gameName(f.factory_guid,f.factory_name))}${f.dlc_unlock_guids.length?' · '+f.dlc_unlock_guids.map(g=>esc(gameName(g))).join(' / '):''}</option>`).join('')}</select></label>`:''}<label>Productivity %<input type="number" min="1" max="1000" value="${s.productivity}" onchange="planner.productivity[${s.factory.factory_guid}]=Number(this.value);calculateChain(${guid})"></label></div>${typeof buildingEffects==='function'?buildingEffects(s.factory.factory_guid):''}${typeof savedBuildSuggestions==='function'?savedBuildSuggestions(s.factory,planner.importPlan?.sourceId||$('chainBasis')?.value):''}</article>`;
 }).join('')+(!plan.steps.length&&!plan.cycles.length?'<p class="small-note">No additional production needed for this target.</p>':'')+plan.cycles.map(c=>`<p class="small-note">${esc(c)}</p>`).join('');
}
function openProducer(guid){
 const f=K.factories.find(f=>f.factory_guid===Number(guid));if(!f)return;
 sheet(`<div class="kicker">PRODUCTION BUILDING · ${esc(f.regions.join(' / '))}</div><div class="sheet-product">${icon(guid)}<div><h2>${esc(gameName(guid,f.factory_name))}</h2><p class="sub">${fmt(f.cycle_seconds,0)}s cycle · 100% nominal productivity</p></div></div><div class="detail-title">Inputs</div>${f.inputs.map(i=>goodLink(i)).join('')||'<p class="small-note">Natural resource; no goods input.</p>'}${f.needs_fuel?goodLink({product_guid:f.fuel_product_guid,product_name:'Fuel',amount_per_minute_100pct:f.fuel_amount_per_minute_100pct}):''}<div class="detail-title">Outputs</div>${f.outputs.map(goodLink).join('')}<button class="primary" onclick="openChain(${guid})">Plan this chain ${svg('arrow')}</button>${typeof buildingEffects==='function'?buildingEffects(guid):''}<div class="detail-title">Relevant specialists</div>${specialistCards(relevantSpecialists([guid]),[guid])}`);
}
function goodLink(i){return `<button class="card chain-open" onclick="openProduct(${i.product_guid})">${icon(i.product_guid)}<div><b>${esc(gameName(i.product_guid,i.product_name))}</b><small>${fmt(i.amount_per_minute_100pct)} / min at 100%</small></div>${svg('chevron')}</button>`;}
function openSpecialist(guid){
 const s=K.specialists.find(s=>s.guid===Number(guid));if(!s)return;
 sheet(`<div class="kicker">SPECIALIST</div>${specialistCards([s],s.target_assets.map(t=>t.guid))}<div class="detail-title">Affected producers</div>${s.target_assets.filter(t=>!s.excluded_targets.some(e=>e.guid===t.guid)).map(t=>K.factories.some(f=>f.factory_guid===t.guid)?`<button class="card chain-open" onclick="openProducer(${t.guid})">${icon(t.guid)}<b>${esc(gameName(t.guid,t.name))}</b>${svg('chevron')}</button>`:kv(gameName(t.guid,t.name),'Target asset')).join('')}`);
}
