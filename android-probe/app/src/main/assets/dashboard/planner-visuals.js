function plannerReveal(id) {
 const target = document.getElementById(id);
 if (!target) return;
 if (target.tagName === 'DETAILS') target.open = true;
 target.scrollIntoView?.({block:'start',behavior:'smooth'});
 target.querySelector('summary')?.focus({preventScroll:true});
}

function settlementStoryCard(role, row, action, summary) {
 if (!row) return '';
 const {island,tier} = row;
 const progress = tier && SettlementModel.progress(tier,island.housing);
 const art = {Latium:'latium.webp',Albion:'albion.webp',Aegyptus:'aegyptus-0.webp'}[island.region] || 'latium.webp';
 return `<article class="pv-island">
  <div class="pv-island-art" style="background-image:linear-gradient(0deg,#0d253ce8,#0d253c22),url('islands/${art}')">
   <span>${esc(role)} · ${esc(island.region)}</span><h3>${esc(island.name)}</h3>
  </div>
  <div class="pv-island-body">
   ${tier?`<div class="pv-island-tier">${needArt(tier.tier)}<div><b>${esc(gameName(tier.guid,tier.tier))}${tier.branch?' · '+esc(tier.branch)+' path':''}</b>
    <small>${row.tiers.map(t=>esc(gameName(t.guid,t.tier))).join(' → ')}</small>
    ${progress?`<small>In this save: ${esc(gameName(progress.guid,progress.tier))}${progress.guid===tier.guid?' · target reached':''}</small>`:''}</div></div>`:''}
   <p>${esc(summary)}</p>${action?'<button class="link" onclick="plannerReveal(\''+action+'\')">Compare options '+svg('arrow')+'</button>':''}
  </div></article>`;
}

function settlementOverview(result, minutes) {
 const first = result.chosen || result.first[0];
 const next = result.next;
 const third = result.support[0];
 const sameIsland = next && first?.island.area_key === next.island.area_key;
 const report = row => `${row.localGoods} of ${row.choices.length} goods have a local chain. ${row.open ? row.open+' inputs or goods still need a source.' : 'All planned needs have a source.'}`;
 const selected = result.chosen ? 'First settlement' : 'Starting recommendation';
 const starter = first && settlementStoryCard(selected,first,'settlement-first',report(first));
 const expansion = sameIsland ? `<article class="pv-placeholder"><h3>Develop the same island</h3><p>This plan advances to ${esc(gameName(next.tier.guid,next.tier.tier))} on ${esc(next.island.name)}.</p><button class="link" onclick="plannerReveal('settlement-second')">Compare other options ${svg('arrow')}</button></article>` :
  next ? settlementStoryCard('Next settlement',next,'settlement-second',report(next)) :
   '<article class="pv-placeholder"><h3>Next settlement</h3><p>Select your first island to see an expansion recommendation.</p></article>';
 const routes = [];
 if (next || result.chosen) {
  const step = next ? 'next' : 'first';
  routes.push(...settlementShipments(next||result.chosen,step).map((route,index)=>({route,step,index})));
 }
 if (third) routes.push(...settlementShipments({flows:third.flows},'support').map((route,index)=>({route,step:'support',index})));
 return `<section class="pv-overview" aria-label="Settlement plan">
  <h2>Your settlement plan</h2>
  <div class="pv-islands">${starter||''}${expansion}
   ${third?settlementStoryCard('Production island',third,'',`Can close ${third.gain} remaining supply gaps.`):''}
  </div>
  ${routes.length?`<section class="pv-routes"><h3>Trade connections</h3>
   ${routes.map(({route,step,index})=>`<details class="pv-route" data-pv-key="route-${step}-${index}"><summary><b>${esc(route.from.name)} ${route.legs.length>1?'↔':'→'} ${esc(route.to.name)}</b><span class="pv-cargo-icons">${[...new Set(route.legs.flatMap(leg=>[...leg.goods.keys()]))].slice(0,6).map(good=>icon(good)).join('')}</span></summary>
    ${route.legs.map(leg=>`<div class="pv-leg"><b>${esc(leg.island.name)} → ${esc(leg.destination.name)}</b><ul>
     ${[...leg.goods].map(([good,rate])=>`<li>${esc(gameName(good))} · ${fmt(rate)} t/min${minutes?' · '+Math.ceil(rate*minutes)+' t per visit':''}</li>`).join('')}</ul></div>`).join('')}
    <button class="secondary" onclick="settlementRoute('${step}',${index})">Open route draft ${svg('arrow')}</button></details>`).join('')}</section>`:
   first&&result.chosen?'<p class="pv-empty">No shipping legs assigned in this plan. Check for open supply gaps below.</p>':''}
 </section>`;
}

function plannerSeasonStrip(phases, reduction=false) {
 if (!phases || phases.length<2) return '';
 const values = phases.map(phase=> reduction ? phase.target : phase.output);
 const comparison = reduction ? phases.map(phase=>phase.current) : phases.map(phase=>phase.rate ?? phase.output);
 if (Math.max(...values)-Math.min(...values)<.01 && Math.max(...comparison)-Math.min(...comparison)<.01) return '';
 return `<div class="pv-phases">${phases.map((phase,i)=>`<span>${phase.guid?icon(phase.guid):''}<b>${esc(phase.name ? islandPhaseName(phase) : 'Phase '+(i+1))}</b><small>${fmt(values[i])} t/min</small></span>`).join('')}</div>`;
}

function plannerActionCard(title, place, good, evidence, details, target, identity) {
 return `<details class="pv-action" data-po-panel="visual:${esc(identity)}"><summary>
  ${icon(good)}<span><small>${esc(place)}</small><strong>${esc(title)}</strong></span>${svg('chevron')}
 </summary><div class="pv-action-detail">${evidence?'<p>'+esc(evidence)+'</p>':''}${details}
  <button class="link" onclick="plannerReveal('${target}')">See calculation ${svg('arrow')}</button></div></details>`;
}

function plannerWorklist() {
 const r = provincePlanner.result;
 if (!r) return '';
 const policies = new Map(r.policies.map(p=>[p.id,p]));
 const builds = r.actions.filter(a=>['build','restore'].includes(a.kind));
 const reductions = r.operatingChanges || [];
 const groups = [
  {name:'Build & restore',tone:'build',total:builds.length,target:'pv-build-details',cards:builds.slice(0,3).map(a=>{
   const design = policies.get(a.profile)?.design;
   return plannerActionCard(`${a.kind==='build'?'Build':'Restore'} ${a.count} × ${advisorName(a.factory)}`,provinceAreaName(a.area),a.good,
    design?.reserve>0?`Keep ${fmt(design.reserve)} t as cycle reserve.`:'Check the upstream inputs and available placement.',
    plannerSeasonStrip(design?.phases),a.kind==='restore'?'pv-restore-details':'pv-build-details',a.kind+':'+a.profile);
  })},
  {name:'Ship',tone:'ship',total:r.manifests.length,target:'pv-shipping-details',cards:r.manifests.slice(0,3).map(m=>
   plannerActionCard(`${m.cargo.length} ${m.cargo.length===1?'good':'goods'} per trip`,provinceAreaName(m.from)+' → '+provinceAreaName(m.to),m.cargo[0]?.good,
    `Every ${m.interval} game min · ${m.requiredShips} estimated ships`,
    `<ul>${m.cargo.map(c=>`<li>${esc(advisorName(c.good))} · ${fmt(c.amount)} t per visit</li>`).join('')}</ul>`,'pv-shipping-details','ship:'+m.from+':'+m.to+':'+m.cargo.map(c=>c.good).join(',')))},
  {name:'Reduce',tone:'reduce',total:reductions.length,target:'pv-reduce-details',cards:reductions.slice(0,3).map(a=>
   plannerActionCard(`${a.pause?'Pause '+a.pause+' × ':'Adjust '}${advisorName(a.factory)}`,provinceAreaName(a.area),a.good,
    a.keep?`Keep ${a.keep} active · ${fmt(a.reserve)} t cycle reserve.`:'Check exports before pausing this group.',
    plannerSeasonStrip(a.keep?a.phases:null,true)+(a.inputChanges?.some(i=>i.reduction>.001)?
      `<ul>${a.inputChanges.filter(i=>i.reduction>.001).map(i=>`<li>${esc(advisorName(i.good))} · −${fmt(i.reduction)} t/min estimated input use</li>`).join('')}</ul>`:''),'pv-reduce-details','reduce:'+a.profile))}
 ];
 const targetFor = group => group.tone==='build'&&!builds.some(a=>a.kind==='build')?'pv-restore-details':group.target;
 return `<section class="pv-overview pv-worklist"><div class="pv-worklist-heading"><h2>What to change</h2><small>${gameDuration(r.settings.horizon)} game time in this forecast</small></div>
  <div class="pv-worklist-grid">${groups.map(g=>`<section class="pv-action-group pv-${g.tone}">
   <h3>${g.name} <span>${g.total}</span></h3>${g.cards.join('')||'<p class="pv-empty">No changes proposed.</p>'}
   ${g.total>3?`<button class="link" onclick="plannerReveal('${targetFor(g)}')">Review all ${g.total} ${svg('arrow')}</button>`:''}
  </section>`).join('')}</div></section>`;
}

const plannerVisualChanges = provinceChanges;
provinceChanges = function(kind,...args) {
 const markup = plannerVisualChanges(kind,...args);
 const id = {restore:'pv-restore-details',build:'pv-build-details',regulate:'pv-reduce-details'}[kind];
 return id ? markup.replace('<details ','<details id="'+id+'" ') : markup;
};
const plannerVisualShipping = provinceShipping;
provinceShipping = function() {
 return plannerVisualShipping().replace('<details ','<details id="pv-shipping-details" ');
};
const plannerVisualOptimizer = companionPages.optimizer.content;
companionPages.optimizer.content = function() {
 const markup = plannerVisualOptimizer();
 return provincePlanner.result ? markup.replace('<section class="g-plan-verdict">',plannerWorklist()+'<section class="g-plan-verdict">') : markup;
};
