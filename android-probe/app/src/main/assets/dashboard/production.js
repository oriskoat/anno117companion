'use strict';
const K=window.annoKnowledge;
let chainRegion='all',chainSearch='',chainType='all',appLanguage=localStorage.getItem('anno.language')||'en';
if(!K.languages[appLanguage])appLanguage='en';
function gameName(guid,fallback){return K.names[appLanguage]?.[guid]||K.names.en?.[guid]||fallback||`GUID ${guid}`;}
function producers(guid,region='all'){return K.factories.filter(f=>f.outputs.some(o=>o.product_guid===Number(guid))&&(region==='all'||f.regions.includes(region)));}
function relevantSpecialists(factoryIds){return K.specialists.filter(s=>s.status==='source-linked'&&s.target_assets.some(t=>factoryIds.includes(t.guid)&&!s.excluded_targets.some(x=>x.guid===t.guid)));}
function regionImage(a){const region=a.session_guid===6627?'albion':a.session_guid===149679?'aegyptus':'latium';const files=window.islandGallery?.[region]||[`islands/${region}.webp`];const ids=(snapshot?.areas||[]).filter(x=>x.session_guid===a.session_guid).map(key).sort();return files[Math.max(0,ids.indexOf(key(a)))%files.length];}
const baseModel=model;
model=function(){baseModel();for(const p of allProducts)p.name=gameName(p.guid,p.name);for(const e of allEntries)e.ProductNameEnglish=gameName(e.ProductGuid,e.ProductNameEnglish);};
const baseRender=render;
render=function(keep=false){
 if(current==='chains'){
  const scroll=window.scrollY;document.body.classList.add('compact');document.body.dataset.page='chains';updateSource();
  $('eyebrow').textContent='FROM FIELD TO FINISHED GOOD';$('pageTitle').textContent='Production chains.';$('heroSubtitle').textContent='Plan the next step. Improve every link.';
  $('main').innerHTML=chainPage();renderChains();if(keep)window.scrollTo(0,scroll);
 }else baseRender(keep);
 const navBar=document.querySelector('.bottom-nav');
 if(!navBar.querySelector('[data-chains]')){const button=document.createElement('button');button.dataset.chains='true';button.setAttribute('aria-label','Production Chains');button.innerHTML=`<span class="nav-icon">${svg('link')}</span>Chains`;button.onclick=()=>nav('chains');navBar.insertBefore(button,navBar.lastElementChild);}
 for(const b of navBar.querySelectorAll('button')){if(current==='chains')b.classList.toggle('active',b.hasAttribute('data-chains'));}
 let quote=$('quoteBox');if(!quote){quote=document.createElement('div');quote.id='quoteBox';quote.className='game-quote';quote.setAttribute('translate','no');document.querySelector('.hero').appendChild(quote);}
 const ids=K.quote_ids, pages=['home','islands','products','supply','chains','more'];
 const id=ids[(Math.floor(Date.now()/120000)+Math.max(0,pages.indexOf(current))*13)%ids.length];
 quote.hidden=!ids.length;quote.textContent=ids.length?'“'+(K.quotes[appLanguage]?.[id]||K.quotes.en[id])+'”':'';quote.title='Original game dialogue · LineId '+id;
};
function specialistCards(items,factoryIds){return items.map(s=>`<article class="specialist-card"><div class="route-head">${s.portrait?`<img class="specialist-portrait" src="${s.portrait}" alt="">`:icon(s.guid)}<div class="route-title"><h3><button class="inline-link specialist-name" onclick="openSpecialist(${s.guid})">${esc(gameName(s.guid,s.name))}</button></h3><p>${esc(s.rarity)} · ${esc(s.allocation)} · ${esc(s.scope)}</p></div></div><p class="specialist-target">Applies to: ${s.target_assets.filter(t=>factoryIds.includes(t.guid)).map(t=>esc(gameName(t.guid,t.name))).join(', ')}</p>${s.base_buffs.flatMap(b=>b.effects||[]).filter(Boolean).map(e=>kv(e.text,e.value||'Special effect')).join('')}${s.boost_buffs.length?`<details><summary>Conditional effects · ${esc(s.boost_condition_summary)}</summary>${s.boost_buffs.flatMap(b=>b.effects||[]).filter(Boolean).map(e=>kv(e.text,e.value||'Special effect')).join('')}</details>`:''}<details><summary>Acquisition references</summary><p class="small-note">Extracted game references; availability and pool weights are not guaranteed outcomes.</p>${Object.entries(s.sources).filter(([k,v])=>v.length).map(([k,v])=>kv(k,[...new Set(v.map(x=>x.name))].join(', '))).join('')}</details></article>`).join('')||'<p class="small-note">No source-linked specialist matches in the extracted catalogue.</p>';}
const originalProduct=openProduct;
openProduct=function(guid,area=''){
 guid=Number(guid);for(const card of document.querySelectorAll('.route-card[data-product]'))card.classList.toggle('selected-route',Number(card.dataset.product)===guid);const observed=allProducts.some(p=>p.guid===guid);if(observed)originalProduct(guid,area);else sheet(`<div class="sheet-product">${icon(guid)}<div><div class="kicker">GOOD</div><h2>${esc(gameName(guid))}</h2><p class="small-note">No received game statistics for this good.</p></div></div>`);const options=producers(guid);if(!options.length){$('sheetBody').insertAdjacentHTML('beforeend',productGameContext(guid));return;}
 $('sheetBody').insertAdjacentHTML('beforeend',productGameContext(guid));const extra=document.createElement('section');extra.className='increase-section';extra.innerHTML=`<div class="detail-title">How to increase production?</div><h2>Strengthen every link.</h2><p class="sub">Check ingredient supply and compare actual with potential production above. The statistics cannot establish the cause of downtime.</p>${options.map(f=>`<button class="card chain-open" onclick="openChain(${f.factory_guid})">${icon(guid)}<div><b>${esc(gameName(f.factory_guid,f.factory_name))}</b><small>${f.regions.join(' / ')} · ${fmt(f.outputs.find(o=>o.product_guid===Number(guid)).amount_per_minute_100pct)} / min at base productivity</small></div>${svg('arrow')}</button>`).join('')}<div class="detail-title">Specialists for these producers</div>${specialistCards(relevantSpecialists(options.map(f=>f.factory_guid)),options.map(f=>f.factory_guid))}<button class="primary" onclick="openChain(${options[0].factory_guid})">Explore production chain ${svg('arrow')}</button>`;$('sheetBody').appendChild(extra);
};
const originalMore=morePage;
morePage=function(){return originalMore()+`<div class="card"><h3>Language</h3><p class="small-note">Choose the language for the interface and original game text.</p><select class="form-input" aria-label="Language" onchange="setGameLanguage(this.value)">${Object.entries(K.languages).map(([id,label])=>`<option value="${id}" ${id===appLanguage?'selected':''}>${label}</option>`).join('')}</select></div>`;};
function setGameLanguage(language){if(!K.languages[language])return;appLanguage=language;localStorage.setItem('anno.language',language);if(snapshot)model();render();}
