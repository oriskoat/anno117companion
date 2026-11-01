'use strict';
function productRows(guid){return allEntries.filter(e=>e.ProductGuid===Number(guid));}
function productTotals(rows){return rows.reduce((s,e)=>({production:s.production+e.ProductGeneration,consumption:s.consumption+e.ProductConsumption,delta:s.delta+e.ProductDelta}),{production:0,consumption:0,delta:0});}
function productIslandTable(rows,guid,interactive=true){
 return `<div class="product-island-table"><div class="product-island-table-head"><span>Island</span><span>Production</span><span>Consumption</span><span>Local balance</span></div>${[...rows].sort((a,b)=>a.ProductDelta-b.ProductDelta).map(e=>`<${interactive?'button':'div'} class="product-island-table-row" ${interactive?`onclick="setProductScope(${guid},'${e.areaKey}')"`:''}><span><b>${esc(e.area.area_name)}</b><small>${areaDataLabel(e.area)}</small></span><span>${fmt(e.ProductGeneration)}</span><span>${fmt(e.ProductConsumption)}</span><strong class="${e.ProductDelta<-.01?'negative':e.ProductDelta>.01?'positive':''}">${signed(e.ProductDelta)}</strong></${interactive?'button':'div'}>`).join('')}</div>`;
}
function productView(guid,scope='',tab='overview'){
 const rows=productRows(guid),selected=scope?rows.filter(e=>e.areaKey===scope):rows,totals=productTotals(selected);
 const gaps=selected.filter(e=>e.ProductDelta<-.01),routes=(snapshot?.supply_suggestions||[]).filter(s=>s.product_guid===guid&&(!scope||s.to_area_key===scope));
 const options=producers(guid),factoryIds=options.map(f=>f.factory_guid),specialists=relevantSpecialists(factoryIds);
 const title=gameName(guid,allProducts.find(p=>p.guid===guid)?.name),status=gaps.length?(totals.delta>=-.01?'Local gaps despite an overall surplus.':'Local production does not cover consumption.'):'Local production covers reported consumption.';
 const islandDetail=selected.map(e=>`<details data-area-details="${e.areaKey}"><summary>${esc(e.area.area_name)} · ${signed(e.ProductDelta)}</summary>${entryDetails(e)}</details>`).join('');
 return `<section data-product-detail="${guid}" data-scope="${esc(scope)}" data-tab="${tab}"><div class="sheet-product product-heading">${icon(guid)}<div><div class="kicker">${isDemo?'Your recorded game':notice||selected.some(e=>e.area.stale)?'Cached data':'Your current game'}</div><h2>${esc(title)}</h2></div></div><label class="product-scope">Island<select id="productDetailScope" class="form-input" onchange="setProductScope(${guid},this.value)"><option value="" ${!scope?'selected':''}>All islands</option>${(snapshot?.areas||[]).map(a=>`<option value="${key(a)}" ${key(a)===scope?'selected':''}>${esc(a.area_name)}</option>`).join('')}</select></label>${selected.length?`<div class="product-verdict ${gaps.length?'has-gaps':'covered'}"><b>${esc(status)}</b><span>${gaps.length} / ${selected.length} · Local gaps</span></div>${detailStats(totals.production,totals.consumption,totals.delta)}`:'<p class="small-note">No received game statistics for this good.</p>'}<div class="product-detail-tabs" role="tablist" aria-label="Product details">${[['overview','Overview'],['supply','Supply'],['improve','Improve'],['data','All data']].map(([id,label])=>`<button id="productTab-${id}" role="tab" aria-controls="productPanel-${id}" aria-selected="${tab===id}" tabindex="${tab===id?0:-1}" onclick="setProductTab('${id}')">${label}</button>`).join('')}</div>
 <section id="productPanel-overview" role="tabpanel" aria-labelledby="productTab-overview" ${tab!=='overview'?'hidden':''}><h3>Island balances</h3>${selected.length?productIslandTable(selected,guid):'<p class="small-note">No observations for this good. Open Production Statistics in the game.</p>'}<div class="product-next-step"><div class="kicker">Next step</div><h3>${routes.length?'Use available surplus first':gaps.length?'How to increase production?':'No local gaps'}</h3><p class="small-note">Local balances exclude imports and warehouse stock.</p><button class="primary" onclick="setProductTab('${routes.length?'supply':'improve'}')">${routes.length?'Supply suggestions':'Explore production chain'} ${svg('arrow')}</button></div>${typeof procurementOverview==='function'?procurementOverview(guid,scope):''}<details class="product-data-notes"><summary>About the data</summary><p class="small-note">Rate units need in-game verification. Building counts are estimates.</p></details></section>
 <section id="productPanel-supply" role="tabpanel" aria-labelledby="productTab-supply" ${tab!=='supply'?'hidden':''}><h3>Supply suggestions</h3><p class="small-note">Local balances exclude imports and warehouse stock.</p>${routes.length?routes.map(routeCard).join(''):'<p class="small-note">No transfer suggested from the available island balances.</p>'}${scope?`<button class="secondary" onclick="setProductScope(${guid},'')">All islands</button>`:''}</section>
 <section id="productPanel-improve" class="increase-section" role="tabpanel" aria-labelledby="productTab-improve" ${tab!=='improve'?'hidden':''}><h3>How to increase production?</h3><p class="small-note">Check inputs and compare actual with potential production. Downtime causes are unknown.</p>${options.map(f=>`<button class="card chain-open" onclick="openProcurementFactory(${f.factory_guid},'${scope}')">${icon(f.factory_guid)}<div><b>${esc(gameName(f.factory_guid,f.factory_name))}</b><small>${f.regions.join(' / ')} · ${fmt(f.outputs.find(o=>o.product_guid===guid).amount_per_minute_100pct)} / min at base productivity</small></div>${svg('chevron')}</button>`).join('')||'<p class="small-note">No nominal recipe is available in this catalogue.</p>'}<div class="detail-title">Relevant specialists</div>${specialistCards(specialists.slice(0,3),factoryIds)}${specialists.length>3?`<details><summary>More specialists (${specialists.length-3})</summary>${specialistCards(specialists.slice(3),factoryIds)}</details>`:''}</section>
 <section id="productPanel-data" role="tabpanel" aria-labelledby="productTab-data" ${tab!=='data'?'hidden':''}><h3>All data</h3><p class="small-note">Every received field, name and identifier.</p>${kv('GUID',guid)}${islandDetail||'<p class="small-note">No entries received.</p>'}</section></section>`;
}
openProduct=function(guid,scope=''){
 guid=Number(guid);for(const card of document.querySelectorAll('.route-card[data-product]'))card.classList.toggle('selected-route',Number(card.dataset.product)===guid);
 sheet(productView(guid,scope));
};
function replaceProductView(guid,scope,tab){
 const body=$('sheetBody'),quote=body.querySelector('.detail-game-quote')?.outerHTML||'';
 body.innerHTML=productView(guid,scope,tab)+quote;window.localizeUI?.(body);
}
window.setProductScope=function(guid,scope){const tab=$('sheetBody').querySelector('[data-product-detail]')?.dataset.tab||'overview';replaceProductView(Number(guid),scope,tab);};
window.setProductTab=function(tab){
 const view=$('sheetBody').querySelector('[data-product-detail]');if(!view)return;
 view.dataset.tab=tab;
 for(const button of view.querySelectorAll('[role="tab"]')){const active=button.id==='productTab-'+tab;button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1;}
 for(const panel of view.querySelectorAll('[role="tabpanel"]'))panel.hidden=panel.id!=='productPanel-'+tab;
};
document.addEventListener('keydown',event=>{
 if(!event.target.matches?.('.product-detail-tabs [role="tab"]')||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
 const tabs=[...event.target.parentElement.children],index=tabs.indexOf(event.target),next=event.key==='Home'?0:event.key==='End'?tabs.length-1:(index+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;
 event.preventDefault();setProductTab(tabs[next].id.replace('productTab-',''));tabs[next].focus();
});
const productSnapshot=window.receiveSnapshot;
window.receiveSnapshot=function(value,source){
 const view=$('sheetBody').querySelector('[data-product-detail]'),state=view&&!$('overlay').hidden?{guid:Number(view.dataset.productDetail),scope:view.dataset.scope,tab:view.dataset.tab,scroll:document.querySelector('.sheet').scrollTop,open:[...view.querySelectorAll('details[open][data-area-details]')].map(d=>d.dataset.areaDetails)}:null;
 productSnapshot(value,source);
 if(state){replaceProductView(state.guid,state.scope,state.tab);for(const el of $('sheetBody').querySelectorAll('[data-area-details]'))el.open=state.open.includes(el.dataset.areaDetails);document.querySelector('.sheet').scrollTop=state.scroll;}
};
