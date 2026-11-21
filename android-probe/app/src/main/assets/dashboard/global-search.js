'use strict';
const companionSearchPages = {
 home:'Home',islands:'Islands',products:'Products',supply:'Supply suggestions',chains:'Production chains',
 needs:'Population needs',routes:'Trade routes',planner:'Island planner',optimizer:'Supply Optimiser',
 settlement:'Settlement Planner',insights:'Save Insights',readiness:'Build readiness',more:'More',help:'FAQ / How To',
};

function companionSearchIndex() {
 const rows = [];
 const add = (kind,label,action,{guid,art,context='',aliases=[]}={})=>{
  rows.push({kind,label,action,art:art||(guid?icon(guid):svg('search')),context,aliases:[...aliases,guid||'',guid?K.names.en?.[guid]||'':'']});
 };
 for (const [page,name] of Object.entries(companionSearchPages)) {
  add('Page',translateUI(name),()=>nav(page),{art:svg(page in paths?page:'arrow'),aliases:[name,page]});
 }
 for (const area of snapshot?.areas||[]) {
  add('Island',area.area_name,()=>openIsland(key(area)),{context:region(area),art:svg('islands')});
 }
 const observed = new Map(allProducts.map(good=>[good.guid,good.name]));
 for (const factory of K.factories) {
  const goods = factory.outputs;
  if (goods.length) {
   add('Production chain',gameName(factory.factory_guid,factory.factory_name),()=>openChain(factory.factory_guid,'','',true),{
    guid:factory.factory_guid,context:factory.regions.join(' / '),
    aliases:goods.map(o=>gameName(o.product_guid,o.product_name)),
   });
  }
  for (const good of [...factory.inputs,...goods]) {
   if (!observed.has(good.product_guid)) observed.set(good.product_guid,good.product_name);
  }
 }
 for (const need of N.needs) {
  if (!need.is_service && !observed.has(need.product_guid)) observed.set(need.product_guid,need.product_name);
 }
 for (const [guid,name] of observed) {
  add('Good',gameName(guid,name),()=>openProduct(guid),{guid});
 }
 for (const tier of N.tiers) {
  add('Population tier',gameName(tier.guid,tier.tier),()=>{
   needsIsland='all';needsTier=tier.tier;needsQuery='';needsOnly='all';nav('needs');
  },{guid:tier.guid,context:tier.region,art:needArt(tier.tier)});
 }
 for (const item of K.specialists) {
  if (item.status==='placeholder/test') continue;
  add('Specialist',gameName(item.guid,item.name),()=>openSpecialist(item.guid),{guid:item.guid});
 }
 for (const [id,patron] of Object.entries(AR.patrons)) {
  const guid = Number(id);
  add('Deity',advisorName(guid,patron.name),()=>openPatronProfile(guid),{guid,aliases:[patron.name,'belief patron']});
 }
 for (const area of advisorSaved()?.areas||[]) {
  const guid = area.production_context?.religion?.patron_guid;
  if (!AR.patrons[guid]) continue;
  add('Island patron',advisorName(guid,AR.patrons[guid].name),()=>empireOpenPatron(area.area_key),
   {guid,context:area.name,aliases:['belief patron',area.name]});
 }
 for (const route of advisorSaved()?.routes||[]) {
  add('In-game route',route.name,()=>{
   saveInsightsState.routeTab='observed';
   const state=tradeState();
   state.view='list';
   state.observedOpen.add(String(route.id));
   nav('routes');
   const card = [...document.querySelectorAll('[data-observed-route]')].find(el=>el.dataset.observedRoute===String(route.id));
   if(card){card.open=true;card.querySelector('summary').focus();card.scrollIntoView({block:'center'});}
  },{art:svg('supply'),aliases:route.stops.flatMap(stop=>[stop.name,...stop.goods.map(g=>gameName(g.product_guid,g.name))])});
 }
 for (const route of tradeState().doc.routes) {
  add('Companion route',route.name,()=>{
   if(tradeState().draft){nav('routes');return;}
   nav('routes');tradeEdit(route.id);
  },{art:svg('supply'),aliases:[...route.stops.map(stop=>stop.name),...route.cargo.map(g=>g.productName)]});
 }
 return rows;
}

const companionSearchText = value => String(value??'').toLocaleLowerCase(appLanguage).normalize('NFD').replace(/\p{M}/gu,'');
const companionSearchDialog = document.createElement('dialog');
companionSearchDialog.className = 'companion-search';
companionSearchDialog.setAttribute('aria-labelledby','companion-search-title');
companionSearchDialog.innerHTML = `<div class="companion-search-head">
 <h2 id="companion-search-title">Search Companion</h2>
 <button type="button" class="sheet-close" aria-label="Close search">×</button>
 </div><label class="search companion-search-field">${svg('search')}
 <input type="search" autofocus placeholder="Search goods, islands, routes and more…" aria-label="Search Companion" autocomplete="off">
 </label><div class="companion-search-results" aria-live="polite"></div>`;
document.body.append(companionSearchDialog);
const companionSearchInput = companionSearchDialog.querySelector('input');
const companionSearchResults = companionSearchDialog.querySelector('.companion-search-results');
const companionSearchButton = document.createElement('button');
companionSearchButton.type = 'button';
companionSearchButton.className = 'round';
companionSearchButton.id = 'companion-search-button';
companionSearchButton.setAttribute('aria-label','Search Companion');
companionSearchButton.setAttribute('title','Search Companion (Ctrl+F)');
companionSearchButton.setAttribute('aria-keyshortcuts','Control+F Meta+F');
companionSearchButton.innerHTML = svg('search');
document.querySelector('.hero-actions').prepend(companionSearchButton);

let companionSearchRows = [];
let companionSearchMatches = [];
function companionSearchRender() {
 const query = companionSearchText(companionSearchInput.value).trim();
 const terms = query.split(/\s+/);
 const ranked = query ? companionSearchRows.flatMap(row=>{
  const label = companionSearchText(row.label);
  const context = companionSearchText([row.kind,row.context,...row.aliases].join(' '));
  if (!terms.every(term=>label.includes(term)||context.includes(term))) return [];
  return [{row,score:label===query?4:label.startsWith(query)?3:label.includes(query)?2:1}];
 }).sort((a,b)=>b.score-a.score||a.row.label.localeCompare(b.row.label,appLanguage)).map(match=>match.row)
  : companionSearchRows.filter(row=>row.kind==='Page');
 companionSearchMatches = ranked.slice(0,24);
 companionSearchResults.innerHTML = companionSearchMatches.map(({art,label,kind,context},index)=>`<button type="button" data-result="${index}">
  ${art}<span><b translate="no">${esc(label)}</b><small>${esc(kind)}${context?` · <span translate="no">${esc(context)}</span>`:''}</small></span>${svg('chevron')}
 </button>`).join('') || '<p>No results</p>';
 if (ranked.length>companionSearchMatches.length) {
  companionSearchResults.insertAdjacentHTML('beforeend',`<p>Showing ${companionSearchMatches.length} of ${ranked.length} matches. Add another word to narrow the search.</p>`);
 }
 localizeUI(companionSearchDialog);
 companionSearchResults.scrollTop=0;
}
function companionSearchOpen() {
 if (!companionSearchDialog.open) {
  companionSearchRows = companionSearchIndex();
  companionSearchInput.value = '';
  companionSearchRender();
  companionSearchDialog.showModal();
  const state = tradeState();
  if (!state.loaded && (isDemo || snapshot)) {
   tradeLoad().then(loaded=>{
    if (!loaded || !companionSearchDialog.open || tradeState()!==state) return;
    companionSearchRows = companionSearchIndex();
    companionSearchRender();
   });
  }
 }
 companionSearchInput.focus();
 companionSearchInput.select();
}
function companionSearchActivate(index) {
 const match = companionSearchMatches[index];
 if (!match) return;
 companionSearchDialog.close();
 match.action();
}
companionSearchButton.addEventListener('click',companionSearchOpen);
companionSearchDialog.querySelector('.sheet-close').addEventListener('click',()=>companionSearchDialog.close());
companionSearchDialog.addEventListener('click',event=>{
 if (event.target===companionSearchDialog) companionSearchDialog.close();
 const button = event.target.closest('[data-result]');
 if (button) companionSearchActivate(Number(button.dataset.result));
});
companionSearchInput.addEventListener('input',companionSearchRender);
companionSearchDialog.addEventListener('keydown',event=>{
 event.stopPropagation();
 if (event.isComposing) return;
 if (event.key==='Escape') {
  event.preventDefault();
  companionSearchDialog.close();
  return;
 }
 if (event.key==='Enter' && event.target===companionSearchInput) {
  event.preventDefault();
  companionSearchActivate(0);
 }
 const offset = event.key==='ArrowDown'?1:event.key==='ArrowUp'?-1:0;
 if (offset && companionSearchMatches.length) {
  event.preventDefault();
  const index = Number(event.target.dataset.result??(offset===1?-1:0));
  const next = (index+offset+companionSearchMatches.length)%companionSearchMatches.length;
  companionSearchResults.children[next].focus();
 }
});
window.addEventListener('keydown',event=>{
 if (event.key.toLowerCase()==='f' && (event.ctrlKey||event.metaKey) && !event.altKey && !event.shiftKey) {
  event.preventDefault();
  companionSearchOpen();
 }
},true);
const companionBackBeforeSearch = window.companionBack;
window.companionBack = function() {
 if (companionSearchDialog.open) {
  companionSearchDialog.close();
  return true;
 }
 return companionBackBeforeSearch?.();
};
