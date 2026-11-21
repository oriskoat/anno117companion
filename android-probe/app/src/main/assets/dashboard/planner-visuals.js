function plannerReveal(id,identity='') {
 const section=document.getElementById(id);
 if(!section)return;
 if(section.tagName==='DETAILS')section.open=true;
 const target=identity?[...section.querySelectorAll('[data-po-panel],[data-pv-manifest]')].find(node=>
  node.dataset.poPanel===identity||node.dataset.pvManifest===identity)||section:section;
 if(target.tagName==='DETAILS')target.open=true;
 (target.querySelector('summary')||target).focus({preventScroll:true});
 target.scrollIntoView?.({block:'start',behavior:'smooth'});
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
    ${progress?`<small>In this save: ${esc(gameName(progress.guid,progress.tier))}${progress.guid===tier.guid?' · residences recorded':''}</small>`:''}</div></div>`:''}
   <p>${esc(summary)}</p>${tier?settlementTierHTML(row):''}${action?'<button class="link" onclick="plannerReveal(\''+action+'\')">Compare options '+svg('arrow')+'</button>':''}
  </div></article>`;
}

function settlementOverview(result, minutes) {
 const first = result.finalPlans[0] || result.chosen || result.first[0];
 const next = result.finalPlans[1] || result.next;
 const third = result.support[0];
 const endgame = result.stageRows.at(-1);
 const sameIsland = next && first?.island.area_key === next.island.area_key;
 const report = row => `${row.localGoods} of ${row.choices.length} goods have a local chain. ${row.open ? row.open+' inputs or goods still need a source.' : 'All planned needs have a source.'}`;
 const selected = first?.island.owned ? 'Develop this island' : result.chosen ? 'First settlement' : 'Starting recommendation';
 const starter = first && settlementStoryCard(selected,first,'settlement-first',report(first));
 const expansion = sameIsland ? `<article class="pv-placeholder"><h3>Develop the same island</h3><p>This plan advances to ${esc(gameName(next.tier.guid,next.tier.tier))} on ${esc(next.island.name)}.</p><button class="link" onclick="plannerReveal('settlement-second')">Compare other options ${svg('arrow')}</button></article>` :
  next ? settlementStoryCard('Next settlement',next,'settlement-second',report(next)) :
   '<article class="pv-placeholder"><h3>Next settlement</h3><p>Select your first island to see an expansion recommendation.</p></article>';
 return `<section class="pv-overview" aria-label="Settlement plan">
  <h2>Your settlement plan</h2><p class="pv-intro">Open a tier to see which needs are met in the save and how the plan would supply them.</p>
  <div class="pv-islands">${starter||''}${expansion}</div>
  ${third?`<section class="pv-production-island">
   <div><span>PROPOSED PRODUCTION ISLAND · ${esc(third.island.region)}</span><h3>${esc(third.island.name)}</h3></div>
   ${third.flows.map(leg=>{
    const index = endgame.routes.findIndex(route=>route.legs.some(candidate=>
     candidate.island.area_key===leg.island.area_key && candidate.destination.area_key===leg.destination.area_key));
    return `<div class="pv-production-leg"><strong>Ship to ${esc(leg.destination.name)}</strong>
     <ul>${[...leg.goods].map(([good,rate])=>`<li>${icon(good)}<b>${esc(gameName(good))}</b>
      <div class="pv-production-rate"><b>${fmt(rate)} t/min</b>${minutes?`<small>${Math.ceil(rate*minutes)} t per visit</small>`:''}</div>
     </li>`).join('')}</ul>
     ${index>=0?`<button type="button" class="secondary" onclick="settlementRoute(${result.stageRows.length-1},${index})">Plan route ${svg('arrow')}</button>`:''}</div>`;
   }).join('')}
  </section>`:''}
  ${result.stageRows.length?`<details class="pv-routes pv-route" id="settlement-shipping" data-pv-key="shipping"><summary><b>Trade by development stage</b><span>${result.stageRows.length} stages</span></summary>
   <p class="pv-empty">Each stage is a complete proposal. Review or replace earlier drafts as your settlements develop.</p>
   ${result.stageRows.map(({label,plans,routes},stage)=>`<details class="pv-route pv-stage" data-pv-key="stage-${stage}" ${stage===0?'open':''}><summary>
    <b>${esc(label)}</b><span>${routes.length} connections · ${plans.reduce((n,p)=>n+p.open,0)} open supply gaps</span></summary>
    <p>${plans.map(p=>esc(p.island.name)+' · '+esc(gameName(p.tier.guid,p.tier.tier))).join(' / ')}</p>
    ${routes.length?routes.map((route,index)=>`<details class="pv-route" data-pv-key="route-${stage}-${index}"><summary><b>${esc(route.from.name)} ${route.legs.length>1?'↔':'→'} ${esc(route.to.name)}</b><span class="pv-cargo-icons">${[...new Set(route.legs.flatMap(leg=>[...leg.goods.keys()]))].slice(0,6).map(good=>icon(good)).join('')}</span></summary>
      ${route.legs.map(leg=>`<div class="pv-leg"><b>${esc(leg.island.name)} → ${esc(leg.destination.name)}</b><ul>
       ${[...leg.goods].map(([good,rate])=>`<li>${esc(gameName(good))} · ${fmt(rate)} t/min${minutes?' · '+Math.ceil(rate*minutes)+' t per visit':''}</li>`).join('')}</ul></div>`).join('')}
      <button class="secondary" onclick="settlementRoute(${stage},${index})">Open route draft ${svg('arrow')}</button></details>`).join(''):'<p>No shipping legs assigned at this stage.</p>'}
   </details>`).join('')}</details>`:''}

 </section>`;
}

function plannerSeasonStrip(phases, reduction=false) {
 if (!phases?.length) return '';
 const values = phases.map(phase=> reduction ? phase.target : phase.output);
 const comparison = reduction ? phases.map(phase=>phase.current) : phases.map(phase=>phase.rate ?? phase.output);
 if (!reduction && Math.max(...values)-Math.min(...values)<.01 && Math.max(...comparison)-Math.min(...comparison)<.01) return '';
 return `<div class="pv-phases">${phases.map((phase,i)=>`<span>${phase.guid?icon(phase.guid):''}<b>${esc(phase.name ? islandPhaseName(phase) : 'Phase '+(i+1))}</b><small>${reduction?fmt(comparison[i])+' → ':''}${fmt(values[i])} t/min</small></span>`).join('')}</div>`;
}

function plannerActionCard(title, place, good, evidence, details, target, identity) {
 return `<details class="pv-action" data-po-panel="visual:${esc(identity)}"><summary>
  ${icon(good)}<span><small>${esc(place)}</small><strong>${esc(title)}</strong></span>${svg('chevron')}
 </summary><div class="pv-action-detail">${evidence?'<p>'+esc(evidence)+'</p>':''}${details}
  <button class="link" data-destination="${esc(identity)}" onclick="plannerReveal('${target}',this.dataset.destination)">See calculation ${svg('arrow')}</button></div></details>`;
}

function plannerWorklist() {
 const r = provincePlanner.result;
 if (!r) return '';
 const policies = new Map(r.policies.map(p=>[p.id,p]));
 const builds = r.actions.filter(a=>['build','restore'].includes(a.kind));
 const reductions = r.operatingChanges || [];
 const providers=new Map((provincePlanner.input?.providers||[]).map(provider=>[provider.id,provider]));
 const groupEvidence = action => {
  const provider=providers.get(action.profile);
  return [Number.isFinite(provider?.productivity)?fmt(provider.productivity*100)+'% recorded productivity':'',
   action.water?'Linked water':'No recorded water link',
   action.dove?'Dovecote linked':provider?.module?'Module linked':'No recorded module'].filter(Boolean).join(' · ');
 };
 const groups = [
  {name:'Build & restore',tone:'build',total:builds.length,target:'pv-build-details',cards:builds.slice(0,3).map(a=>{
   const design = policies.get(a.profile)?.design;
   return plannerActionCard(`${a.kind==='build'?'Build':'Restore'} ${a.count} × ${advisorName(a.factory)}`,provinceAreaName(a.area),a.good,
    design?.reserve>0?`Keep ${fmt(design.reserve)} t as cycle reserve.`:'Check the upstream inputs and available placement.',
    plannerSeasonStrip(design?.phases)+provinceAdditionalOutputs(a.profile),a.kind==='restore'?'pv-restore-details':'pv-build-details',a.kind+':'+a.profile);
  })},
  {name:'Ship',tone:'ship',total:r.manifests.length,target:'pv-shipping-details',cards:r.manifests.slice(0,3).map((m,index)=>
   plannerActionCard(`${m.cargo.length} ${m.cargo.length===1?'good':'goods'} per trip`,provinceAreaName(m.from)+' → '+provinceAreaName(m.to),m.cargo[0]?.good,
    `Every ${m.interval} game min · ${m.requiredShips} estimated ships`,
    `<ul>${m.cargo.map(c=>`<li>${esc(advisorName(c.good))} · ${fmt(c.amount)} t per visit</li>`).join('')}</ul>`,'pv-shipping-details','shipment:'+index))},
  {name:'Reduce',tone:'reduce',total:reductions.length,target:'pv-reduce-details',cards:reductions.slice(0,3).map(a=>
   plannerActionCard(`${a.pause?'Pause '+a.pause+' of '+a.owned+' · ':'Adjust '+a.keep+' × '}${advisorName(a.factory)}`,provinceAreaName(a.area),a.good,
    groupEvidence(a)+'. '+(a.keep?`Keep ${a.keep} of ${a.owned} active · ${fmt(a.reserve)} t cycle reserve.`:'Check exports before pausing this group.'),
    plannerSeasonStrip(a.keep?a.phases:null,true)+(a.inputChanges?.some(i=>i.reduction>.001)?
      `<ul>${a.inputChanges.filter(i=>i.reduction>.001).map(i=>`<li>${esc(advisorName(i.good))} · −${fmt(i.reduction)} t/min estimated input use</li>`).join('')}</ul>`:''),'pv-reduce-details','operation:'+a.profile))}
 ];
 const targetFor = group => group.tone==='build'&&!builds.some(a=>a.kind==='build')?'pv-restore-details':group.target;
 return `<section class="pv-overview pv-worklist"><div class="pv-worklist-heading"><h2>Recommended actions</h2><small>${gameDuration(r.settings.horizon)} game time in this forecast</small></div>
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
 let index=0;return plannerVisualShipping().replace('<details ','<details id="pv-shipping-details" ').replaceAll('<article class="po-manifest"',()=>'<article tabindex="-1" data-pv-manifest="shipment:'+(index++)+'" class="po-manifest"');
};
const plannerVisualOptimizer = companionPages.optimizer.content;
companionPages.optimizer.content = function() {
 const markup = plannerVisualOptimizer();
 if(!provincePlanner.result)return markup;
 const issues=governorPlanIssues(),blocked=issues.filter(issue=>['Supply still unresolved','Input chain needs a decision'].includes(issue.label));
 const critical=blocked.length?`<aside class="pv-blockers"><b>${blocked.length} supply checks before acting</b>
 <ul>${blocked.slice(0,3).map(issue=>`<li><b>${esc(advisorName(issue.good))}</b> · ${esc(provinceAreaName(issue.area))} <small>${esc(issue.value)}</small></li>`).join('')}</ul>
 <button class="link" onclick="plannerReveal('pv-plan-checks')">Review plan checks ${svg('arrow')}</button></aside>`:'';
 const resultStart=markup.indexOf('<div class="g-plan-numbers">');
 const verdictStart=markup.indexOf('<section class="g-plan-verdict">');
 const controlsStart=markup.indexOf('</div>',markup.indexOf('class="po-toolbar"'))+6;
 if(resultStart<0||verdictStart<0||controlsStart<6)return markup;
 const work=plannerWorklist();
 const verdict=markup.slice(verdictStart).replace('<section class="g-plan-verdict">','<section tabindex="-1" id="pv-plan-checks" class="g-plan-verdict">');
 const settings=markup.slice(controlsStart,resultStart).replace(/(<div class="po-run">[\s\S]*?<\/button>)<span>[^<]*<\/span>/,'$1');
 const forecast=markup.slice(resultStart,verdictStart);
 return markup.slice(0,controlsStart)+critical+work+
  `<details class="po-block pv-optimizer-settings" data-po-panel="visual-settings"><summary>Settings & forecast</summary>${settings}${forecast}</details>`+verdict;
};
