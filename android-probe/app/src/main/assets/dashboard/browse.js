'use strict';
const browseOptions={products:[['name','Name'],['production','Production'],['consumption','Consumption'],['delta','Local balance']],supply:[['rate','Suggested amount'],['progression','Progression'],['name','Name'],['from','Source island'],['to','Destination island']],islands:[['name','Name'],['gaps','Local gaps'],['count','Product rows']],chains:[['progression','Progression'],['name','Name'],['capacity','Base output / min']]};
const browseState={};
for(const page of Object.keys(browseOptions)){
 let saved={};try{saved=JSON.parse(localStorage.getItem('anno.browse.'+page)||'{}');}catch{}
 browseState[page]={field:browseOptions[page].some(([id])=>id===saved?.field)?saved.field:(page==='supply'?'rate':page==='chains'?'progression':'name'),descending:typeof saved?.descending==='boolean'?saved.descending:page==='supply',query:''};
}
function normalizeBrowse(value){return String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase();}
function browseMatches(value,query){return normalizeBrowse(value).includes(normalizeBrowse(query).trim());}
function browseCompare(page,a,b){
 const state=browseState[page],x=a[state.field],y=b[state.field];
 const order=typeof x==='number'&&typeof y==='number'?x-y:String(x??'').localeCompare(String(y??''),typeof appLanguage==='undefined'?'en':appLanguage,{numeric:true,sensitivity:'base'});
 return (state.descending?-order:order)||String(a.name??'').localeCompare(String(b.name??''))||String(a.id??'').localeCompare(String(b.id??''));
}
function browseToolbar(page,placeholder=''){
 const state=browseState[page],numeric=['production','consumption','delta','rate','gaps','count','capacity'].includes(state.field);
 return `${placeholder?`<div class="search">${svg('search')}<input id="${page}Search" aria-label="${esc(placeholder)}" placeholder="${esc(placeholder)}" value="${esc(state.query)}" oninput="setBrowseQuery('${page}',this.value)"></div>`:''}<div class="browse-sort"><label>Sort by<select aria-label="Sort ${page} by" onchange="setBrowseSort('${page}',this.value)">${browseOptions[page].map(([id,label])=>`<option value="${id}" ${state.field===id?'selected':''}>${label}</option>`).join('')}</select></label><button class="browse-direction" aria-label="Change sort direction" onclick="toggleBrowseDirection('${page}')">${svg('arrow','sort-arrow')}<span>${state.field==='progression'?(state.descending?'Reverse progression':'Progression'):numeric?(state.descending?'High to low':'Low to high'):(state.descending?'Z to A':'A to Z')}</span></button></div>`;
}
function refreshBrowse(page){
 const state=browseState[page];try{localStorage.setItem('anno.browse.'+page,JSON.stringify({field:state.field,descending:state.descending}));}catch{}
 const toolbar=document.querySelector(`.browse-sort select[onchange*="'${page}'"]`)?.closest('.browse-sort');
 if(toolbar)toolbar.outerHTML=browseToolbar(page);
 if(page==='products')renderProductList();else if(page==='supply')renderSupplyList();else if(page==='islands')renderIslandList();else renderChains();
}
function setBrowseSort(page,field){if(!browseOptions[page]?.some(([id])=>id===field))return;browseState[page].field=field;if(page==='supply')browseState[page].descending=field==='rate';refreshBrowse(page);}
function toggleBrowseDirection(page){browseState[page].descending=!browseState[page].descending;refreshBrowse(page);}
function setBrowseQuery(page,value){browseState[page].query=value;if(page==='supply')renderSupplyList();else renderIslandList();}
function islandBrowseRows(){return(snapshot?.areas||[]).filter(a=>browseMatches(a.area_name+' '+region(a),browseState.islands.query)).map(a=>({area:a,id:key(a),name:a.area_name,gaps:a.entries.filter(e=>e.ProductDelta<-.01).length,count:a.entries.length})).sort((a,b)=>browseCompare('islands',a,b));}
function renderIslandList(){
 const rows=islandBrowseRows();if(!$('islandBrowseList'))return;
 $('islandBrowseList').innerHTML=rows.map(r=>islandCard(r.area)).join('')||empty('No matching islands','Try another name.');
 $('islandBrowseCount').textContent=`${rows.length} / ${snapshot.areas.length}`;
}
function supplyBrowseRows(){return(snapshot?.supply_suggestions||[]).map(s=>({route:s,id:s.product_guid+':'+s.from_area_key+':'+s.to_area_key,name:typeof gameName==='function'?gameName(s.product_guid,s.product_name):s.product_name,from:s.from_area,to:s.to_area,rate:s.suggested_rate})).filter(r=>browseMatches([r.name,r.route.product_name,r.route.product_guid,r.from,r.to].join(' '),browseState.supply.query)).sort((a,b)=>browseCompare('supply',a,b));}
function renderSupplyList(){
 if(!$('supplyBrowseList'))return;const rows=supplyBrowseRows();
 if(typeof supplyRememberGroups==='function')supplyRememberGroups();
 $('supplyBrowseList').innerHTML=(typeof supplyListHtml==='function'?supplyListHtml(rows):rows.map(r=>routeCard(r.route)).join(''))||empty('No transfer matches yet','Try another filter or product name.');
 $('supplyBrowseCount').textContent=`${rows.length} / ${(snapshot.supply_suggestions||[]).length}`;
}
