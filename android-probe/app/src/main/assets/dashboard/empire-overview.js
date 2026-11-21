'use strict';
function empirePeople(areas){const tiers=new Map();let residents=0,houses=0,recorded=0;for(const area of areas)for(const h of area.housing||[]){const id=h.tier_guid||0,t=tiers.get(id)||{guid:id,name:h.tier_name,residents:0,houses:0,recorded:0};t.residents+=Number(h.residents)||0;t.houses+=h.count;t.recorded+=h.resident_count_recorded||0;tiers.set(id,t);residents+=Number(h.residents)||0;houses+=h.count;recorded+=h.resident_count_recorded||0;}return {tiers:[...tiers.values()].sort((a,b)=>N.tiers.findIndex(t=>t.guid===a.guid)-N.tiers.findIndex(t=>t.guid===b.guid)),residents,houses,recorded};}
function empireCount(value,partial=false){return Number.isFinite(value)?(partial?'≥ ':'')+fmt(value,0):'Not recorded';}
function empireMetric(id,label,value,art,sub=''){return `<article class="eo-metric" role="button" tabindex="0" onclick="empireMetricAction('${id}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();empireMetricAction('${id}')}"><span class="eo-symbol">${art}</span><div><small>${label}</small><b data-eo-value="${id}">${value}</b><span data-eo-sub="${id}">${sub}</span></div></article>`;}
function empireFacts(){const saved=advisorSaved(),e=saved?.empire,people=empirePeople(saved?.areas||[]),a=e?.attributes||{};return {saved,e,people,population:empireCount(a.population),treasury:empireCount(e?.treasury),balance:Number.isFinite(e?.balance_per_minute)?(e.balance_per_minute>=0?'+':'')+fmt(e.balance_per_minute,0)+'/min':'Not recorded',knowledge:empireCount(a.knowledge),belief:empireCount(a.belief),prestige:empireCount(a.prestige)};}
function empirePopulationHTML(saved) {
 const regions = new Map(islandAreas().map(a=>[a.key,a.region]));
 return empireReligionOverview(saved)+['Latium','Albion','Aegyptus'].map(region=>{
  const areas = (saved?.areas||[]).filter(a=>regions.get(a.area_key)===region);
  if (!areas.length) return '';
  const people = empirePeople(areas);
  return `<section class="eo-province"><h3>${region}</h3>
   <small>${empireCount(people.residents,people.recorded<people.houses)} recorded residents · ${fmt(people.houses,0)} residences</small>
   <div class="eo-tier-grid">${people.tiers.map(t=>{
    const tier = N.tiers.find(n=>n.guid===t.guid);
    return `<article><button class="eo-tier-link" onclick="empireOpenTier('${region}',${t.guid})">
     ${needArt(tier?.tier||'Infrastructure')}<div><b>${esc(advisorName(t.guid,t.name))}</b>
     <strong>${empireCount(t.residents,t.recorded<t.houses)}</strong><small>${fmt(t.houses,0)} residences</small></div></button></article>`;
   }).join('')}</div>
   <details class="eo-island-disclosure"><summary>Islands &amp; patrons <small>${areas.length}</small></summary>
    ${areas.map(empirePatronRow).join('')}</details></section>`;
 }).join('');
}

// Secondary local effects from the game config. Values are multiplied by each
// belief step's BuffScaling and are displayed independently of production math.
const patronLocalEffects = {
 80567:[['Unit morale',1,'%'],['Upkeep and workforce upkeep',-1,'%']],
 43600:[['Population per residence',1,'']],
 30871:[['Ship health',1,'%'],['Ship upkeep',-1,'%']],
 50315:[['Passive trade profit',1,'%']],
 50313:[['Harbour building prestige',1,'']],
 80865:[['Population per residence',1,''],['Prestige per residence',2,''],['Population from needs',1,'']],
 50246:[['Health per residence',1,''],['Knowledge per residence',1,'']],
 30868:[['Knowledge per residence',1,'']],
 144804:[['Residence workforce',5,'%']],
 153582:[['Residential consumption',-1,'%']],
 153807:[['Water supply',20,''],['Irrigation capacity',20,'']],
 153812:[['Income and prestige from island knowledge',1,'%']],
};
function patronAdvancesLocal(saved=advisorSaved()) {
 return AR.patrons[saved?.production_context?.religion?.dominant_patron_guid]?.advances_local===true;
}
function patronEffectText(id) {
 return AR.religion.text[appLanguage]?.[id] || AR.religion.text.en?.[id] || '';
}
function patronWonderTitle(wonder) {
 const title = patronEffectText(wonder.title);
 return title && wonder.title!==wonder.description && title.length<80 ? title :
  wonder.asset===153816 ? 'Dovecotes' : advisorName(wonder.asset,'Wonder bonus');
}
function empireReligionOverview(saved) {
 const guid = saved?.production_context?.religion?.dominant_patron_guid;
 const patron = AR.patrons[guid];
 if (!patron) return '';
 return `<button type="button" class="eo-dominant-overview" onclick="openPatronProfile(${guid})">
  ${icon(guid)}<span><small>Dominant deity</small><b>${esc(advisorName(guid,patron.name))}</b></span>
  <span>${esc(patronEffectText(patron.dominant?.[0]?.description))}</span>${svg('chevron')}</button>`;
}
function patronMilestones(guid, belief) {
 const tracks = (AR.patrons[guid]?.local||[]).flatMap(({effect,milestones})=>{
  const rule = AR.effects[effect];
  const production = (rule?.buffs||[]).map(id=>AR.buffs[id]?.productivity).filter(Boolean);
  const definition = patronLocalEffects[effect] || production.map(p=>['Productivity',p.value,p.percental?'%':' pts']);
  const steps = IM.patronTrack(milestones,belief,patronAdvancesLocal());
  return definition.map(([label,factor,unit])=>({effect,label,factor,unit,...steps,milestones,targets:production.length?rule.targets:[]}));
 });
 return {tracks,next:tracks.flatMap(track=>track.next ? [track.next.belief] : []).sort((a,b)=>a-b)[0]};
}
function patronBonusValue(track, step) {
 return step ? signed(track.factor*step.scale)+track.unit : '—';
}
function empirePatronRow(area) {
 const p = empirePeople([area]);
 const {patron_guid:guid,belief} = area.production_context?.religion||{};
 const patron = AR.patrons[guid];
 const {tracks,next} = patronMilestones(guid,belief);
 const active = tracks.find(t=>t.active);
 const progress = Number.isFinite(belief) ? (next===undefined
  ? (tracks.length?'Final local milestone reached':'')
  : `${fmt(next-belief,0)} to next bonus · ${fmt(next,0)}`) : 'Belief not recorded';
 return `<div class="eo-patron-row">
  <button type="button" class="eo-island-name" data-island="${esc(area.area_key)}" onclick="openIsland(this.dataset.island)">
   <b>${esc(area.name)}</b><small>${empireCount(p.residents,p.recorded<p.houses)} residents</small>
  </button>
  ${guid?`<button type="button" class="eo-patron-button" data-island="${esc(area.area_key)}" onclick="empireOpenPatron(this.dataset.island)">
   ${icon(guid)}<span class="eo-patron-label"><b>${esc(advisorName(guid,patron?.name))}</b>
   <strong>${Number.isFinite(belief)?fmt(belief,0)+' belief':'Belief not recorded'}</strong></span>${svg('chevron')}
   ${active?`<small class="eo-patron-active">${esc(patronBonusValue(active,active.active))} ${esc(active.label)}</small>`:''}
   ${progress&&Number.isFinite(belief)?`<small class="eo-patron-progress">${esc(progress)}</small>`:''}
  </button>`:'<small>Patron not recorded</small>'}
 </div>`;
}
function empireOpenPatron(areaKey) {
 const area = advisorSaved()?.areas?.find(a=>a.area_key===areaKey);
 const religion = area?.production_context?.religion;
 if (religion?.patron_guid) openPatronProfile(religion.patron_guid,area);
}
function patronEmpireBonuses(guid, religion) {
 const patron=AR.patrons[guid], wonder=patron.wonder;
 const dominant=religion?.dominant_patron_guid===guid, activeWonder=religion?.patrons?.[guid]?.wonder_active;
 const status=active=>religion?(active?'Active':'Inactive'):'Save required';
 const others=Object.entries(religion?.patrons||{}).filter(([id,data])=>Number(id)!==guid && data.wonder_active && AR.patrons[id]?.wonder);
 return `<section class="eo-patron-section"><h3>Empire bonuses</h3><div class="eo-empire-bonuses">
  ${patron.dominant.map(effect=>`<article class="eo-empire-bonus ${dominant?'is-active':''}">
   <small>Dominant deity · ${status(dominant)}</small><b>${esc(patronEffectText(effect.title))}</b>
   <p>${esc(patronEffectText(effect.description))}</p>
   ${!dominant?`<small>Requires the lead and at least ${fmt(AR.religion.dominant_threshold,0)} belief.</small>`:''}</article>`).join('')}
  ${wonder?`<article class="eo-empire-bonus ${activeWonder?'is-active':''}">
   <small>Wonder bonus · ${status(activeWonder)}</small><b>${esc(patronWonderTitle(wonder))}</b>
   <p>${esc(patronEffectText(wonder.description))}</p>
   <small>Unlocks at ${fmt(AR.religion.wonder_threshold,0)} belief across the empire</small></article>`:''}</div>
  ${others.length?`<details class="eo-other-wonders"><summary>Other active wonder bonuses</summary>
   ${others.map(([id])=>`<button type="button" class="link" onclick="openPatronProfile(${Number(id)})">${icon(id)}
    ${esc(advisorName(Number(id),AR.patrons[id].name))} · ${esc(patronWonderTitle(AR.patrons[id].wonder))} ${svg('chevron')}</button>`).join('')}
  </details>`:''}</section>`;
}
function openPatronProfile(guid, area) {
 const patron = AR.patrons[guid];
 if (!patron) return;
 const belief = area?.production_context?.religion?.belief;
 const {tracks,next} = patronMilestones(guid,belief);
 const recorded = Number.isFinite(belief);
 const religion = advisorSaved()?.production_context?.religion;
 const total = religion?.patrons?.[guid]?.belief;
 const groups = new Map();
 for (const track of tracks) {
  if (!groups.has(track.effect)) groups.set(track.effect,[]);
  groups.get(track.effect).push(track);
 }
 const factories = new Map(K.factories.map(f=>[f.factory_guid,f]));
 sheet(`<div class="eo-patron-hero">${icon(guid)}<div><small>${esc(area?.name||'Patron profile')}</small>
  <h2>${esc(advisorName(guid,patron.name))}</h2>
  ${recorded?`<b>${fmt(belief,0)} island belief</b>`:''}
  ${Number.isFinite(total)?`<span>${fmt(total,0)} across the empire</span>`:''}</div></div>
  ${patronEmpireBonuses(guid,religion)}
  <section class="eo-patron-section"><div class="eo-local-heading"><h3>Island bonuses</h3>
   ${recorded&&next!==undefined?`<span>${fmt(next-belief,0)} belief to next upgrade</span>`:''}</div>
  ${recorded&&patronAdvancesLocal()?'<p class="eo-advance-note">Cernunnos is dominant. These bonuses are one stage higher.</p>':''}
  <div class="eo-bonus-list">${[...groups.values()].map(group=>{
   const first = group[0];
   const goods = [...new Set(first.targets.flatMap(id=>(factories.get(id)?.outputs||[]).map(o=>o.product_guid)))];
   return `<article class="eo-bonus">
    ${group.map(track=>{
     const effect = area?.production_context?.effects?.find(e=>e.guid===track.effect);
     const current = Number.isFinite(effect?.scale)?{scale:effect.scale}:track.active;
     return `<div class="eo-bonus-line"><strong>${esc(track.label)}</strong>
      ${recorded?`<span><b>${current?esc(patronBonusValue(track,current)):'Locked'}</b>${track.next?`<small>Next ${esc(patronBonusValue(track,track.nextValue))} at ${fmt(track.next.belief,0)}</small>`:''}</span>`:''}</div>`;
    }).join('')}
    ${goods.length?`<details class="eo-bonus-targets"><summary>Boosted goods · ${goods.length}</summary><div class="eo-bonus-goods">${goods.map(good=>`<span>${icon(good)}${esc(advisorName(good))}</span>`).join('')}</div></details>`:''}
    <details class="eo-milestones"><summary>Belief milestones · ${first.milestones.length}</summary>
    <div class="eo-milestone-grid">${first.milestones.map(step=>`<span${step===first.active?' aria-current="step"':''}>
     <small>${fmt(step.belief,0)} belief</small><b>${group.map(track=>esc(patronBonusValue(track,step))).join(' / ')}</b></span>`).join('')}</div></details>
   </article>`;
  }).join('')}</div></section>`);
}
function empireFinanceLine(e){
 const rate=value=>Number.isFinite(value)?fmt(value,0)+'/min':'Unknown';
 return 'Income '+rate(e?.income_per_minute)+' · Expenses '+rate(e?.expenses_per_minute);
}
function empireOverviewHTML(){const f=empireFacts();if(!f.saved)return '<section class="eo-empty">Read a matching save to see population, treasury, knowledge and patrons.</section>';return `<section class="empire-overview"><div class="eo-title"><small>${isDemo?'EXAMPLE EMPIRE':'YOUR SAVED EMPIRE'}</small><span>${esc(savedDate(f.saved.saved_at))}</span></div><div class="eo-metrics">${empireMetric('population','Population',f.population,'<img src="icons/resource-population.webp" alt="">','Saved population attribute')}${empireMetric('treasury','Treasury',f.treasury,'<img src="icons/resource-income.webp" alt="">','Selected player')}${empireMetric('balance','Balance',f.balance,svg('supply'),empireFinanceLine(f.e))}${empireMetric('knowledge','Knowledge',f.knowledge,'<img src="icons/resource-knowledge.webp" alt="">','Empire total')}${empireMetric('belief','Belief',f.belief,'<img src="icons/resource-belief.webp" alt="">','Empire total')}${empireMetric('prestige','Prestige',f.prestige,'<img src="icons/resource-prestige.webp" alt="">','Empire total')}</div><details class="eo-people"><summary><span>People & patrons</span><small>Population by province, tier and island</small>${svg('chevron')}</summary><div class="eo-provinces">${empirePopulationHTML(f.saved)}</div></details></section>`;}
const empireHomeBase=governorHome;governorHome=function(){return empireHomeBase().replace('<div class="g-dashboard">','<div class="g-dashboard">'+empireOverviewHTML());};
homePage=governorHome;
const empirePatchBase=governorPatchHome;governorPatchHome=function(){empirePatchBase();if(current!=='home')return;const f=empireFacts(),root=document.querySelector('.empire-overview');if(!root){const empty=document.querySelector('.eo-empty');if(empty&&f.saved)empty.outerHTML=empireOverviewHTML();return;}for(const id of ['population','treasury','balance','knowledge','belief','prestige']){const node=root.querySelector('[data-eo-value="'+id+'"]');if(node)node.textContent=f[id];}const finance=root.querySelector('[data-eo-sub=balance]');if(finance)finance.textContent=empireFinanceLine(f.e);const stamp=root.querySelector('.eo-title>span');if(stamp)stamp.textContent=savedDate(f.saved?.saved_at);const people=root.querySelector('.eo-provinces');if(people){const signature=f.saved?.parsed_at;if(people.dataset.signature!==signature){const open=[...people.querySelectorAll('details')].map(d=>d.open);people.innerHTML=empirePopulationHTML(f.saved);people.querySelectorAll('details').forEach((d,i)=>d.open=!!open[i]);people.dataset.signature=signature;}}};

function empireOpenTier(region,guid){const saved=advisorSaved(),tier=N.tiers.find(t=>t.guid===guid),areas=(saved?.areas||[]).filter(a=>islandAreas().find(x=>x.key===a.area_key)?.region===region&&(a.housing||[]).some(h=>h.tier_guid===guid));sheet(`<div class="kicker">${esc(region)} - POPULATION</div><h2>${esc(advisorName(guid,tier?.tier))}</h2><p class="small-note">Explicit saved residents and residences. Review each island's recorded needs and supply.</p>${areas.map(a=>{const p=empirePeople([{housing:a.housing.filter(h=>h.tier_guid===guid)}]);return `<button class="eo-island" onclick="empireReviewNeeds('${esc(a.area_key)}',${guid})"><span><b>${esc(a.name)}</b><small>${empireCount(p.residents,p.recorded<p.houses)} residents - ${p.houses} residences</small></span><span>Review needs</span>${svg('arrow')}</button>`;}).join('')}`);}
function empireReviewNeeds(area,guid){const tier=N.tiers.find(t=>t.guid===guid);if(!tier)return;needsIsland=area;needsTier=tier.tier;needsQuery='';needsOnly='all';nav('needs');}

function empireMetricAction(id){if(id==='knowledge'){nav('readiness');return;}if(id==='population'||id==='belief'){const panel=document.querySelector('.eo-people');if(panel){panel.open=true;if(id==='belief')panel.querySelectorAll('.eo-province>details').forEach(d=>d.open=true);panel.scrollIntoView({block:'start',behavior:'smooth'});}return;}const e=advisorSaved()?.empire;sheet(`<div class="kicker">SAVED EMPIRE</div><h2>${id==='prestige'?'Prestige':'Finance & construction'}</h2>${id==='prestige'?`<p>${empireCount(e?.attributes?.prestige)} recorded prestige. Non-production prestige effects are not converted into supply bonuses.</p>`:`<div class="cap-compare"><span>Treasury<b>${empireCount(e?.treasury)}</b></span><span>Income / min<b>${empireCount(e?.income_per_minute)}</b></span><span>Expenses / min<b>${empireCount(e?.expenses_per_minute)}</b></span></div><p>Review nominal operating costs and one-time construction materials in a supply proposal. Actual taxes, buffs and paused-building maintenance can differ.</p><button class="primary" onclick="provincePlanner.settings.objective='upkeep';provinceOpen('empire')">Compare a lower-upkeep empire plan</button>`}`);}
