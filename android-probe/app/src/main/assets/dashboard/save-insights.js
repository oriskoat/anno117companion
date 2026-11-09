/* Saved evidence is independently timestamped; it never replaces pipe rates. */
const saveInsightsState={live:null,error:'',busy:false,lastRead:0,generation:0,tab:'overview',island:'all',query:'',sort:'name',limit:40,demoUse:true};
const saveInsightsRequests=new Map();
window.saveInsightsReply=function(id,reply){const request=saveInsightsRequests.get(id);if(request){clearTimeout(request.timer);saveInsightsRequests.delete(id);request.resolve(reply);}};

function saveInsightsTransport(body=null){
 if(typeof window.Native?.saveInsights!=='function')return Promise.resolve({status:0});
 if(window.isBrowserClient)return window.Native.saveInsights(body);
 return new Promise(resolve=>{const id='save-'+Date.now()+'-'+Math.random().toString(36).slice(2),timer=setTimeout(()=>{saveInsightsRequests.delete(id);resolve({status:0});},16000);saveInsightsRequests.set(id,{resolve,timer});window.Native.saveInsights(id,body?JSON.stringify(body):'');});
}

function saveInsightsDemo(){
 if(!isDemo||!snapshot?.synthetic)return null;
 if(snapshot.saved_insights?.synthetic)return {enabled:true,use_saves:saveInsightsState.demoUse,status:'ready',access:{source:'synthetic_demo'},profiles:[],interval_seconds:600,checked_at:snapshot.recorded_at,join:{matched:true,matched_area_keys:snapshot.saved_insights.areas.map(a=>a.area_key)},snapshot:snapshot.saved_insights};
 const areas=(snapshot.areas||[]).map((a,i)=>({area_key:key(a),area_id:a.session_id|(a.island_id<<6)|(a.area_index<<13),session_id:a.session_id,session_guid:a.session_guid,name:a.area_name,region:a.session_guid===3245?'Latium':a.session_guid===149679?'Aegyptus':'Albion',owner:1,
  fertilities:[{guid:2210,name:i%2?'Herbs Fertility':'Olive Fertility'}],residence_count:24+i*8,
  housing:[{building_guid:a.session_guid===3245?3087:6414,tier_guid:a.session_guid===3245?1499:1500,tier_name:a.session_guid===3245?'Liberti':a.session_guid===149679?'Threshers':'Waders',count:24+i*8}],
  inventory:(a.entries||[]).map((e,j)=>{const samples=Array.from({length:120},(_,n)=>Math.max(0,Math.round(30+j*9+i*7+Math.sin(n/9)*4+e.ProductDelta*n/7)));return {product_guid:e.ProductGuid,name:e.ProductNameEnglish,samples,latest_sample:samples.at(-1),last_point_tick:0};}),
  need_states:(a.entries||[]).filter(e=>e.ProductConsumption>0).map(e=>({tier_guid:a.session_guid===3245?1499:1500,tier_name:a.session_guid===3245?'Liberti':a.session_guid===149679?'Threshers':'Waders',product_guid:e.ProductGuid,name:e.ProductNameEnglish,tracked_houses:24+i*8,explicit_full:e.ProductDelta>=0?24+i*8:12,explicit_partial:e.ProductDelta<0?4:0,explicit_zero:0,omitted:e.ProductDelta<0?8+i*8:0})),buildings:[]}));
 for(let i=0;i<areas.length;i++){const a=areas[i],source=snapshot.areas[i],egypt=a.region==='Aegyptus';a.production_context={instances:egypt?[{id:'example-'+i,guid:151997,productivity:1,module_ids:[],water_source_id:null}]:[],warehouses:[{guid:egypt?150645:3402,registered_capacity:550}],current_stocks:source.entries.map(e=>({guid:e.ProductGuid,amount:120+i*15,full_capacity:false})),effects:[],session_effects:[],religion:{patron_guid:egypt?153803:43594,belief:800},season:egypt?{guid:150490,next_guid:150491,start_tick:0,end_tick:10800000}:null,volcano:a.region==='Latium'?{guid:145352,active:1,remaining_ms:6000000}:null};if(egypt){a.fertilities=[...new Set(K.factories.filter(f=>f.regions.includes('Aegyptus')).map(f=>f.fertility_guid).filter(Boolean))].map(guid=>({guid,name:gameName(guid)}));a.production_context.instances=[];if(source.entries.some(e=>e.ProductGuid===2103&&e.ProductGeneration>0))for(let n=0;n<2;n++)a.production_context.instances.push({id:'example-reeds-'+i+'-'+n,guid:151997,productivity:1,module_ids:[],water_source_id:null});if(source.entries.some(e=>e.ProductGuid===151679&&e.ProductGeneration>0))for(let n=0;n<7;n++){const id='example-dove-'+i+'-'+n;a.production_context.instances.push({id:'example-pome-'+i+'-'+n,guid:152145,productivity:1.5,module_ids:[id],water_source_id:null},{id,guid:153816,productivity:1,module_ids:[],water_source_id:null});}const tier=N.tiers.find(t=>t.region==='Aegyptus'&&t.tier==='Threshers');a.housing.forEach(h=>{h.tier_guid=tier?.guid;h.tier_name='Threshers';});}}
 const routes=(snapshot.supply_suggestions||[]).slice(0,2).map((r,i)=>({id:100+i,name:'Example '+r.product_name+' Supply',ship_ids:[i+1],stops:[{area_key:r.from_area_key,name:r.from_area,goods:[{product_guid:r.product_guid,name:r.product_name,amount:50,action:'load'}]},{area_key:r.to_area_key,name:r.to_area,goods:[{product_guid:r.product_guid,name:r.product_name,amount:50,action:'unload'}]}]}));
 return {enabled:true,use_saves:saveInsightsState.demoUse,status:'ready',access:{source:'synthetic_demo'},profiles:[],interval_seconds:600,checked_at:snapshot.recorded_at,join:{matched:true,matched_area_keys:areas.map(a=>a.area_key)},snapshot:{schema:1,synthetic:true,simulator_clock:{GameTotal:0},production_context:{global_effects:[]},owned_items:[],parsed_at:'synthetic-example',profile_name:'Example Empire',campaign_fingerprint:'synthetic-example',saved_at:snapshot.recorded_at,areas,routes,limitations:[]}};
}

function saveInsightsData(){return isDemo?saveInsightsDemo():saveInsightsState.live;}
function savedSnapshot(){return saveInsightsData()?.snapshot||null;}
function savedContextAllowed(){const data=saveInsightsData();return !!(data?.use_saves&&(data.join?.matched||snapshot?.save_source?.campaign_fingerprint===data.snapshot?.campaign_fingerprint));}
function savedArea(areaId,requireJoin=true){const data=saveInsightsData();if(requireJoin&&!savedContextAllowed())return null;return data?.snapshot?.areas?.find(a=>a.area_key===areaId)||null;}
function savedOwnedItems(kind){
 if(!savedContextAllowed()||isDemo&&!savedSnapshot()?.synthetic)return [];
 return (savedSnapshot()?.owned_items||[]).filter(i=>i.kind===kind);
}
function ownedItemState(item){
 const location=item.area_key?savedArea(item.area_key)?.name:null;
 const state=item.state==='assigned'?'Already assigned in the save':
   item.source==='ship'?'Stored aboard a ship':
   item.source==='global'?'Stored in the saved item pool':'Stored on an island';
 return location?state+' · '+location:state;
}
function specialistAvailability(guid){
 const copies=savedOwnedItems('Specialist').filter(i=>i.guid===guid);
 if(!copies.length)return savedContextAllowed()&&!isDemo&&Array.isArray(savedSnapshot()?.owned_items)?'Not found in this save':'Ownership not checked';
 const states=[...new Set(copies.map(ownedItemState))];
 return (copies.some(i=>i.state==='stored')?'Owned · may be usable':'Owned')+' · '+states.join('; ');
}
function savedBuildSuggestions(factory,areaId=''){
 const area=savedArea(areaId);
 const owned=savedOwnedItems('Specialist');
 const rank=guid=>owned.some(i=>i.guid===guid&&i.state==='stored')?0:owned.some(i=>i.guid===guid)?1:2;
 const rows=relevantSpecialists([factory.factory_guid]).sort((a,b)=>rank(a.guid)-rank(b.guid));
 if(!rows.length)return '';
 return `<details class="building-effects"><summary><b>Specialist options (${rows.length})</b></summary>${rows.map(s=>{
   const fertility=s.fertility_grants?.find(g=>g.guid===factory.fertility_guid);
   const knownMissing=area?.fertilities?.length&&!area.fertilities.some(f=>f.guid===fertility?.guid);
   const hint=fertility?` · Adds ${esc(gameName(fertility.guid,'required fertility'))} (+${fmt(fertility.percent)}%)${knownMissing?' · Not recorded on this island':''}`:'';
   return `<p><button class="inline-link" onclick="openSpecialist(${s.guid})">${esc(gameName(s.guid,s.name))}</button><br><small>${esc(specialistAvailability(s.guid))}${hint}</small></p>`;
 }).join('')}<small>Check placement, slot requirements and current availability in game.</small></details>`;
}
function savedImportCaptains(){
 const owned=savedOwnedItems('Captains').filter(i=>i.state==='stored');
 const rows=(K.captains||[]).map(c=>({c,i:owned.find(i=>i.guid===c.guid)})).filter(r=>r.i&&r.c.effects.length&&r.c.targets.length);
 if(!rows.length)return '';
 return `<div class="building-effects"><b>Captains to consider for the shipment</b><small>Check the selected ship against the listed classes in game.</small>${rows.map(({c,i})=>`<p><b>${esc(gameName(c.guid,c.name))}</b><br><small>${ownedItemState(i)} · ${c.effects.map(e=>esc(e.text+' '+(e.value||''))).join(' · ')} · ${c.targets.filter(g=>!c.excluded.includes(g)).map(g=>esc(gameName(g))).join(', ')}</small></p>`).join('')}</div>`;
}
function savedRoutesTo(guid,destination,source=''){
 const data=saveInsightsData();if(!savedContextAllowed())return [];
 return (data.snapshot?.routes||[]).filter(r=>r.stops.some(s=>s.area_key===destination&&s.goods.some(g=>g.product_guid===Number(guid)&&g.action==='unload'))&&(!source||r.stops.some(s=>s.area_key===source&&s.goods.some(g=>g.product_guid===Number(guid)&&g.action!=='unload'))));
}
function savedNeedSummary(a,guid,tier=null){
 const records=(a?.need_states||[]).filter(n=>n.product_guid===Number(guid)&&(tier===null||n.tier_guid===Number(tier)));
 if(!records.length)return null;
 const value={tracked_houses:0,explicit_full:0,explicit_partial:0,explicit_zero:0,omitted:0};for(const n of records)for(const k of Object.keys(value))value[k]+=n[k]||0;
 return value;
}
function savedNeedText(n){return `${n.explicit_full} / ${n.tracked_houses} explicitly full${n.explicit_partial?' · '+n.explicit_partial+' partial':''}${n.explicit_zero?' · '+n.explicit_zero+' zero':''}${n.omitted?' · '+n.omitted+' unknown':''}`;}
function savedDate(value){return value?dateLabel(value):'Unknown time';}
function savedRegion(a){return a.session_guid===3245?'Latium':a.session_guid===6627?'Albion':a.session_guid===149679?'Aegyptus':a.region;}
function savedPhoto(a){const region=a.session_guid===6627?'albion':a.session_guid===149679?'aegyptus':'latium',files=window.islandGallery?.[region]||[`islands/${region}.webp`],areas=(savedSnapshot()?.areas||[]).filter(x=>x.session_guid===a.session_guid).sort((x,y)=>x.area_key.localeCompare(y.area_key));return files[Math.max(0,areas.findIndex(x=>x.area_key===a.area_key))%files.length];}
function savedName(guid,fallback){return gameName(guid,fallback)||fallback;}

async function loadSaveInsights(force=false,body=null){
 const s=saveInsightsState;if(isDemo){if(current==='insights')render(true);return;}
 if(!body&&(s.busy||!force&&Date.now()-s.lastRead<15000))return;
 const generation=++s.generation;s.busy=true;s.lastRead=Date.now();
 try{
  const reply=await saveInsightsTransport(body);if(generation!==s.generation||isDemo)return;
  if(reply.status===200||reply.status===202){s.live=reply.document;s.error='';if(body)native('refreshSnapshot');}
  else if(reply.status===403){s.live={enabled:false,status:'disabled',snapshot:null};s.error='';}
  else if(reply.status===401){s.live=null;s.error='Pair your PC bridge to read saved insights.';}
  else throw Error(reply.document?.error||'Save Insights is unavailable on this PC. Update the preview or check its connection.');
 }catch(error){if(generation===s.generation)s.error=error.message;}
 finally{if(generation===s.generation){s.busy=false;if(!body&&typeof window.governorBackgroundUpdate==='function'){window.governorBackgroundUpdate('save');}else if(current==='insights')render(true);else if(['home','supply','needs','more'].includes(current)||current==='planner'&&!document.activeElement?.closest('.ap-layout,.ip-filters,.ip-cycle-controls'))render(true);}}
}
function refreshSaveInsights(){return loadSaveInsights(true,{action:'refresh'});}
function selectSaveProfile(id,participant=null,fileName=null){saveInsightsState.live={...saveInsightsState.live,status:'waiting',snapshot:null};saveInsightsState.island='all';return loadSaveInsights(true,{action:'select',profile_id:id,participant,file_name:fileName});}
function setSavedTab(tab){saveInsightsState.tab=tab;saveInsightsState.limit=40;render(true);}
function setSavedIsland(value){saveInsightsState.island=value;saveInsightsState.limit=40;render(true);}
function filterSavedQuery(value){saveInsightsState.query=value;saveInsightsState.limit=40;const list=$('savedInsightsResults');if(list){list.innerHTML=savedTabContent();window.localizeUI?.(list);}}
function setSavedSort(value){saveInsightsState.sort=value;saveInsightsState.limit=40;render(true);}
function openSavedRoutes(guid=null,destination=''){
 closeSheet();saveInsightsState.tab='routes';saveInsightsState.island=destination||'all';saveInsightsState.query=guid?savedName(Number(guid),''):'';nav('insights');
}
function savedSelectedAreas(){const areas=savedSnapshot()?.areas||[];return saveInsightsState.island==='all'?areas:areas.filter(a=>a.area_key===saveInsightsState.island);}
function savedQuery(){return saveInsightsState.query.trim().toLocaleLowerCase(appLanguage);}
function savedEmpty(){return empty('No matching saved data','Try another island or search.');}

function savedSparkline(samples,large=false){
 const values=(samples||[]).filter(Number.isFinite);if(!values.length)return '';
 const width=large?600:150,height=large?150:34,min=Math.min(...values),max=Math.max(...values),range=max-min||1;
 const points=values.map((v,i)=>`${(i*width/Math.max(1,values.length-1)).toFixed(1)},${(max===min?height/2:height-3-(v-min)/range*(height-6)).toFixed(1)}`).join(' ');
 return `<svg class="saved-sparkline ${large?'saved-sparkline-large':''}" viewBox="0 0 ${width} ${height}" role="img" aria-label="Saved inventory sample history"><polyline points="${points}"/></svg>`;
}
function savedOverview(){
 const areas=savedSelectedAreas();return `<div class="saved-island-grid">${areas.map(a=>`<article class="card saved-island-card"><button class="saved-island-hero" onclick="openSavedIsland('${a.area_key}')"><img src="${esc(savedPhoto(a))}" alt="${esc(savedRegion(a))} region artwork"><span class="saved-art-label">REGION ARTWORK</span><span class="saved-island-title"><small>${esc(savedRegion(a))}</small><b>${esc(a.name)}</b></span></button><div class="saved-island-stats"><span><b>${a.residence_count}</b>Residence objects</span><span><b>${a.inventory.length}</b>Stock histories</span><span><b>${(savedSnapshot()?.routes||[]).filter(r=>r.stops.some(s=>s.area_key===a.area_key)).length}</b>Observed routes</span></div><div class="saved-island-footer"><button class="inline-link" onclick="setSavedIsland('${a.area_key}');setSavedTab('stocks')">Stock history ${svg('arrow')}</button><button class="inline-link" onclick="setSavedIsland('${a.area_key}');setSavedTab('needs')">Saved needs ${svg('arrow')}</button></div></article>`).join('')||savedEmpty()}</div>`;
}
function savedRouteCards(){
 const doc=savedSnapshot(),q=savedQuery(),rows=(doc?.routes||[]).filter(r=>(saveInsightsState.island==='all'||r.stops.some(s=>s.area_key===saveInsightsState.island))&&(!q||[r.name,...r.stops.flatMap(s=>[s.name,...s.goods.map(g=>savedName(g.product_guid,g.name))])].join(' ').toLocaleLowerCase(appLanguage).includes(q)));
 return `<p class="small-note">Observed route definitions from this save. These are separate from your editable Companion plans. A configured route does not prove delivered throughput.</p>${rows.map(r=>`<details class="card saved-observed-route"><summary><span class="saved-route-mark">${svg('supply')}</span><span><b>${esc(r.name)}</b><small>${r.stops.length} stops · ${r.ship_ids.length} assigned ship references</small><small>${r.stops.map(s=>esc(s.name)).join(' → ')}</small></span>${svg('chevron')}</summary><ol class="saved-route-stops">${r.stops.map(s=>`<li><h3>${esc(s.name)}</h3>${s.goods.length?s.goods.map(g=>`<div class="saved-route-good">${icon(g.product_guid)}<span><b>${esc(savedName(g.product_guid,g.name))}</b><small>${g.action==='unload'?'Unload':g.action==='load'?'Load':'Loading flag omitted · direction unconfirmed'}</small></span><strong>${g.amount===null?'—':fmt(g.amount)}<small>per visit</small></strong></div>`).join(''):'<p class="small-note">No goods command at this stop.</p>'}</li>`).join('')}</ol><p class="small-note">Loading defaults omitted by the save are not assumed. Ship references: ${r.ship_ids.map(esc).join(', ')}.</p></details>`).join('')||savedEmpty()}`;
}
function savedStockRows(){
 const q=savedQuery(),s=saveInsightsState,rows=savedSelectedAreas().flatMap(area=>area.inventory.map(item=>({area,item}))).filter(({area,item})=>!q||(savedName(item.product_guid,item.name)+' '+area.name).toLocaleLowerCase(appLanguage).includes(q));
 rows.sort((a,b)=>s.sort==='low'?(a.item.latest_sample??Infinity)-(b.item.latest_sample??Infinity):s.sort==='high'?(b.item.latest_sample??-Infinity)-(a.item.latest_sample??-Infinity):s.sort==='change'?Math.abs((b.item.samples.at(-1)||0)-(b.item.samples[0]||0))-Math.abs((a.item.samples.at(-1)||0)-(a.item.samples[0]||0)):savedName(a.item.product_guid,a.item.name).localeCompare(savedName(b.item.product_guid,b.item.name),appLanguage)||a.area.name.localeCompare(b.area.name));
 return `<p class="small-note">Latest saved statistics samples, not live warehouse stock. Each chart contains up to 120 recorded samples. Display units and sample timing are under validation in this preview.</p><div class="saved-stock-list">${rows.slice(0,s.limit).map(({area,item})=>`<button class="saved-stock-row" onclick="openSavedStock(${item.product_guid},'${area.area_key}')">${icon(item.product_guid)}<span class="saved-stock-label"><b>${esc(savedName(item.product_guid,item.name))}</b><small>${esc(area.name)}</small></span>${savedSparkline(item.samples)}<strong>${item.latest_sample===null?'—':fmt(item.latest_sample)}<small>Saved sample</small></strong>${svg('chevron')}</button>`).join('')||savedEmpty()}</div><p class="small-note">${Math.min(s.limit,rows.length)} / ${rows.length}</p>${rows.length>s.limit?'<button class="secondary" onclick="saveInsightsState.limit+=40;render(true)">Show more</button>':''}`;
}
function savedNeedsRows(){
 const q=savedQuery();return `<p class="small-note">Residence counts and explicit consumption states at save time. Omitted values remain unknown; they are not automatically marked unfulfilled. This is not a reconstruction of service radius or road coverage.</p>${savedSelectedAreas().map(a=>`<section class="card saved-needs-island"><h3>${esc(a.name)}</h3><div class="saved-tier-counts">${a.housing.map(h=>`<span>${icon(h.building_guid)}<span><b>${h.count}</b>${esc(savedName(h.tier_guid,h.tier_name))}</span></span>`).join('')}</div><div class="saved-needs-list">${a.need_states.filter(n=>!q||(savedName(n.product_guid,n.name)+' '+savedName(n.tier_guid,n.tier_name)).toLocaleLowerCase(appLanguage).includes(q)).sort((x,y)=>y.omitted-x.omitted||y.explicit_partial-x.explicit_partial||x.name.localeCompare(y.name)).map(n=>`<button class="saved-need-row" onclick="openSavedStock(${n.product_guid},'${a.area_key}')">${icon(n.product_guid)}<span><b>${esc(savedName(n.product_guid,n.name))}</b><small>${esc(savedName(n.tier_guid,n.tier_name))}</small><small class="${n.explicit_full===n.tracked_houses?'positive':''}">${esc(savedNeedText(n))}</small></span></button>`).join('')||savedEmpty()}</div></section>`).join('')}`;
}
function savedSiteRows(){
 const q=savedQuery();return `<p class="small-note">Fertilities and deposits recorded for each island. Remaining deposits, free space, unlocks and the feasibility of the complete chain are not confirmed.</p><div class="saved-island-grid">${savedSelectedAreas().filter(a=>!q||(a.name+' '+a.fertilities.map(f=>f.name).join(' ')).toLocaleLowerCase(appLanguage).includes(q)).map(a=>`<section class="card saved-sites"><h3>${esc(a.name)}</h3><small>${esc(savedRegion(a))}</small><div class="saved-fertilities">${a.fertilities.map(f=>`<span>${esc(savedName(f.guid,f.name))}</span>`).join('')||'<span>No fertility list recorded.</span>'}</div><details><summary>Recorded building types · ${a.buildings.length}</summary><div class="saved-building-list">${a.buildings.slice().sort((x,y)=>y.count-x.count).map(b=>`<span><b>${b.count}</b>${esc(savedName(b.guid,b.name))}</span>`).join('')}</div></details></section>`).join('')||savedEmpty()}</div>`;
}
function savedTabContent(){return ({overview:savedOverview,routes:savedRouteCards,stocks:savedStockRows,needs:savedNeedsRows,sites:savedSiteRows}[saveInsightsState.tab]||savedOverview)();}

function saveInsightsPage(){
 const data=saveInsightsData(),doc=data?.snapshot,s=saveInsightsState;
 if(!isDemo&&Date.now()-s.lastRead>30000)queueMicrotask(()=>loadSaveInsights());
 let html=`<div class="notice saved-preview-notice">${svg('info')}<span><b>Save Insights</b><br>Free, local, read-only save analysis.</span></div>`;
 if(isDemo)html+='<p class="saved-provenance">Invented Example Empire data · no real save file is read in Demo mode.</p>';
 else html+=savedControls(data);

 if(!doc)return html+empty('Your saved empire','Connect to the Windows Companion and choose a save profile.');
 if(s.island!=='all'&&!doc.areas.some(a=>a.area_key===s.island))s.island='all';
 html+=`<div class="saved-source"><div><div class="kicker">SAVED EVIDENCE</div><h2>${esc(doc.profile_name||doc.profile_display_name)}</h2><p>Saved ${esc(savedDate(doc.saved_at))} · ${esc(doc.file_name||'Synthetic example')}</p></div><span class="badge">${isDemo?'Demo':'Save snapshot'}</span></div>`;
 if(!isDemo&&!savedContextAllowed())html+=`<p class="notice saved-join-note">${svg('info')}<span>${esc(data.join?.reason||'Pipe session has not been matched.')} Saved data remains available here; overlays on pipe-based pages are disabled.</span></p>`;
 html+=`<div class="saved-metrics"><span><b>${doc.areas.length}</b>Islands</span><span><b>${doc.routes.length}</b>Observed routes</span><span><b>${doc.areas.reduce((n,a)=>n+a.residence_count,0)}</b>Residence objects</span><span><b>${doc.areas.reduce((n,a)=>n+a.inventory.length,0)}</b>Stock histories</span></div><div class="saved-tabs" role="group" aria-label="Save Insights sections">${[['overview','Overview'],['routes','Observed routes'],['stocks','Stock history'],['needs','Saved needs'],['sites','Production sites']].map(([id,label])=>`<button class="${s.tab===id?'active':''}" aria-pressed="${s.tab===id}" onclick="setSavedTab('${id}')">${label}</button>`).join('')}</div><div class="saved-filters"><select class="form-input" aria-label="Saved island" onchange="setSavedIsland(this.value)"><option value="all">All islands</option>${doc.areas.map(a=>`<option value="${a.area_key}" ${s.island===a.area_key?'selected':''}>${esc(a.name)}</option>`).join('')}</select>${s.tab!=='overview'?`<input class="form-input" type="search" aria-label="Search saved data" placeholder="Search saved data" value="${esc(s.query)}" oninput="filterSavedQuery(this.value)">`:''}${s.tab==='stocks'?`<select class="form-input" aria-label="Sort saved inventory" onchange="setSavedSort(this.value)">${[['name','Name'],['low','Low to high'],['high','High to low'],['change','Largest sample change']].map(([id,label])=>`<option value="${id}" ${s.sort===id?'selected':''}>${label}</option>`).join('')}</select>`:''}</div><div id="savedInsightsResults">${savedTabContent()}</div>`;
 return html;
}

function openSavedIsland(id){const a=savedArea(id,false);if(!a)return;sheet(`<div class="kicker">SAVE SNAPSHOT</div><div class="island-detail-photo"><img src="${esc(savedPhoto(a))}" alt="${esc(savedRegion(a))} region artwork"><span>REGION ARTWORK</span></div><h2>${esc(a.name)}</h2><p class="small-note">Saved ${esc(savedDate(savedSnapshot().saved_at))}</p><div class="saved-tier-counts">${a.housing.map(h=>`<span>${icon(h.building_guid)}<span><b>${h.count}</b>${esc(savedName(h.tier_guid,h.tier_name))}</span></span>`).join('')}</div><div class="saved-fertilities">${a.fertilities.map(f=>`<span>${esc(savedName(f.guid,f.name))}</span>`).join('')}</div><button class="primary" onclick="closeSheet();setSavedIsland('${id}');setSavedTab('stocks')">Stock history ${svg('arrow')}</button>`);}
function openSavedStock(guid,id){
 const a=savedArea(id,false),stock=a?.inventory.find(x=>x.product_guid===Number(guid));if(!a)return;
 const need=savedNeedSummary(a,guid),routes=(savedSnapshot()?.routes||[]).filter(r=>r.stops.some(s=>s.area_key===id&&s.goods.some(g=>g.product_guid===Number(guid)&&g.action==='unload'))),pipe=savedContextAllowed()?allEntries.find(e=>e.ProductGuid===Number(guid)&&e.areaKey===id):null;
 sheet(`<div class="kicker">SAVED PRODUCT EVIDENCE</div><div class="sheet-product">${icon(Number(guid))}<div><h2>${esc(savedName(guid,stock?.name))}</h2><p>${esc(a.name)}</p></div></div><p class="small-note">Saved ${esc(savedDate(savedSnapshot().saved_at))} · ${esc(savedSnapshot().file_name||'Synthetic example')}</p>${stock?`<div class="card saved-stock-detail"><div class="kicker">LATEST SAVED SAMPLE</div><strong>${stock.latest_sample===null?'—':fmt(stock.latest_sample)}</strong>${savedSparkline(stock.samples,true)}<p class="small-note">${stock.samples.length} recorded samples · not a live warehouse query. Sample units and clock scaling are under validation.</p></div>`:''}${pipe?`<div class="saved-source-stats"><span>Pipe production<b>${fmt(pipe.ProductGeneration)} / min</b></span><span>Pipe consumption<b>${fmt(pipe.ProductConsumption)} / min</b></span><span>Local balance<b>${fmt(pipe.ProductDelta)} / min</b></span></div><p class="small-note">${esc(areaDataLabel(pipe.area))}</p>`:''}${need?`<section class="saved-context"><h3>Saved need state</h3><p>${esc(savedNeedText(need))}</p><p class="small-note">Unknown values are not counted as confirmed failures.</p></section>`:''}<section class="saved-context"><h3>Configured delivery routes</h3>${routes.map(r=>`<p>${esc(r.name)}</p>`).join('')||'<p class="small-note">No explicit unloading command found for this good and island.</p>'}<p class="small-note">Configured deliveries do not establish actual throughput.</p></section>${routes.length?`<button class="secondary" onclick="openSavedRoutes(${Number(guid)},'${id}')">Observed routes ${svg('arrow')}</button>`:''}${pipe?`<button class="inline-link" onclick="openProduct(${Number(guid)},'${id}')">Open product ${svg('arrow')}</button>`:''}`);
}

function savedProductContext(guid,id){
 const a=savedArea(id);if(!a)return '';const stock=a.inventory.find(p=>p.product_guid===Number(guid)),need=savedNeedSummary(a,guid),routes=savedRoutesTo(guid,id);
 if(!stock&&!need&&!routes.length)return '';
 return `<section class="saved-context"><div class="kicker">SAVE SNAPSHOT · ${esc(savedDate(savedSnapshot().saved_at))}</div>${stock?`<p><b>Latest saved stock sample: ${stock.latest_sample===null?'—':fmt(stock.latest_sample)}</b></p>`:''}${need?`<p>${esc(savedNeedText(need))}</p>`:''}${routes.length?`<p>${routes.length} configured delivery routes</p>`:''}<button class="inline-link" onclick="openSavedStock(${Number(guid)},'${id}')">Saved evidence ${svg('arrow')}</button><p class="small-note">Saved samples and route definitions are not live delivery measurements.</p></section>`;
}

companionPages.insights={offline:true,titles:['FROM YOUR SAVE','Save Insights','Routes, stock history, homes and needs — recorded locally.'],content:saveInsightsPage};
const savedHomeBase=homePage;
homePage=function(){const doc=savedContextAllowed()?savedSnapshot():null;return savedHomeBase()+(doc?`<section class="card saved-home"><div class="kicker">SAVE INSIGHTS</div><h3>${doc.routes.length} observed routes · ${doc.areas.reduce((n,a)=>n+a.residence_count,0)} residence objects</h3><p class="small-note">${isDemo?'Invented example data':'Saved '+esc(savedDate(doc.saved_at))}</p><button class="secondary" onclick="nav('insights')">Explore saved evidence ${svg('arrow')}</button></section>`:'');};
const savedRouteBase=routeCard;
routeCard=function(proposal){const html=savedRouteBase(proposal),routes=savedRoutesTo(proposal.product_guid,proposal.to_area_key,proposal.from_area_key);if(!routes.length)return html;return html.replace('<div class="route-foot">',`<div class="saved-supply-note"><b>Existing route in save · ${routes.length}</b><button class="inline-link" onclick="openSavedRoutes(${proposal.product_guid},'${proposal.to_area_key}')">Review ${svg('arrow')}</button><small>Configured unloading found; loading defaults and delivered throughput require review.</small></div><div class="route-foot">`);};
const savedProcurementBase=procurementOverview;
procurementOverview=function(guid,scope){return savedProcurementBase(guid,scope)+savedProductContext(guid,scope);};
const savedNeedCardBase=needCard;
needCard=function(n){const html=savedNeedCardBase(n),a=savedArea(key(needsArea())),tier=N.tiers.find(t=>t.tier===n.tier&&t.region===n.region),state=savedNeedSummary(a,n.product_guid,tier?.guid);if(!state)return html;return html.replace('<div class="need-actions">',`<section class="saved-context"><b>Saved need state</b><p>${esc(savedNeedText(state))}</p><small>Saved ${esc(savedDate(savedSnapshot().saved_at))} · separate from your manual observation</small></section><div class="need-actions">`);};
const savedTierBase=needsTierBody;
needsTierBody=function(){const a=savedArea(key(needsArea())),tier=needsSelectedTier(),guid=N.tiers.find(t=>t.tier===tier?.tier&&t.region===needsRegion(needsArea()))?.guid,count=a?.housing.filter(h=>h.tier_guid===guid).reduce((n,h)=>n+h.count,0);return (a&&guid?`<div class="notice"><span><b>${count} residence objects in this save</b><br>Saved ${esc(savedDate(savedSnapshot().saved_at))}. Saved counts are independent of pipe data and manual observations.</span></div>`:'')+savedTierBase();};
const savedRenderBase=render;
render=function(keep=false){savedRenderBase(keep);renderSaveSwitch();if(current==='insights'){const more=document.querySelector('button[onclick="nav(\'more\')"]');if(more){more.classList.add('active');more.setAttribute('aria-current','page');}}};
const savedModeBase=window.modeChanged;
let savedSourceAddress='';
window.modeChanged=function(demo,address,secure){if(savedSourceAddress!==address||isDemo!==demo){saveInsightsState.generation++;saveInsightsState.busy=false;saveInsightsState.live=null;saveInsightsState.lastRead=0;saveInsightsState.error='';}savedSourceAddress=address;savedModeBase(demo,address,secure);if(!demo)queueMicrotask(()=>loadSaveInsights());};
setInterval(()=>{if(!document.hidden&&!isDemo)loadSaveInsights();},30000);
if(window.saveInsightsLanding)queueMicrotask(()=>nav('insights'));


async function setUseSaveData(enabled){
 closeSheet();
 if(isDemo){saveInsightsState.demoUse=!!enabled;render(true);return;}
 await loadSaveInsights(true,{action:'use_saves',enabled:!!enabled});
}
function renderSaveSwitch(){
 let button=$('useSaveDataSwitch');const anchor=$('dataModeSwitch');if(!anchor)return;
 if(!button){button=document.createElement('button');button.id='useSaveDataSwitch';button.className='saved-global-switch';button.setAttribute('role','switch');button.setAttribute('aria-label','Use save data');anchor.after(button);button.onclick=()=>setUseSaveData(!saveInsightsData()?.use_saves);}
 const active=!!saveInsightsData()?.use_saves;button.setAttribute('aria-checked',String(active));button.classList.toggle('is-on',active);button.innerHTML=`<span class="saved-switch-track"><span></span></span><span>Use save data <b>${active?'ON':'OFF'}</b></span>`;button.disabled=!isDemo&&(!saveInsightsState.live?.enabled||saveInsightsState.busy);button.title=active?'Saved data is available throughout the Companion. Fresh matching pipe statistics take priority.':'Only pipe data is used outside Save Insights.';
}
function savedControls(data){
 const s=saveInsightsState,profile=(data?.profiles||[]).find(p=>p.id===data.selected_profile_id),picker=s.profilePickerOpen||!profile;
 const file=profile?.saves?.find(f=>f.name===data.selected_file),name=data?.selected_file||profile?.latest_name||'';
 let html=`<section class="card saved-selection-card"><div class="saved-selection-heading"><div><div class="kicker">YOUR SAVE SOURCE</div><h3>${profile?esc(profile.name):'Choose your campaign'}</h3><p class="small-note">${profile?`${data.selected_file?'Pinned save':'Automatically follow the newest save'} · ${esc(name)}`:'Choose a campaign below. Its newest complete save is used automatically.'}</p></div><button class="inline-link" onclick="saveInsightsState.profilePickerOpen=!saveInsightsState.profilePickerOpen;render(true)">${picker&&profile?'Close':'Change save'} ${svg('chevron')}</button></div>${profile?`<div class="saved-selection-details"><span>${svg('clock')}${esc(savedDate(file?.saved_at||profile.latest_at))}</span><span>${profile.count} saves available</span><span>${data.selected_file?'Fixed historical snapshot':'New saves checked every 10 minutes'}</span></div>`:''}<div class="saved-status-row"><span role="status">${data?.status==='reading'?'Reading the selected save in the background…':data?.status==='select_profile'?'Choose a campaign':data?.status==='no_saves'?'No local game saves found':data?.status==='ready'?'Save ready':data?.status==='disabled'?'Save Insights is unavailable on this PC':s.busy?'Connecting to the PC…':'Waiting for save data'}</span><button class="secondary" onclick="refreshSaveInsights()" ${s.busy?'disabled':''}>${svg('clock')}Check for new save</button></div>${s.error||data?.error?`<p class="saved-error">${esc(s.error||data.error)}</p>`:''}${data?.participant_candidates?.length?`<label>Human participant<select class="form-input" onchange="selectSaveProfile('${data.selected_profile_id}',Number(this.value))"><option>Choose participant</option>${data.participant_candidates.map(id=>`<option value="${id}">Participant ${id}</option>`).join('')}</select></label>`:''}</section>`;
 if(picker)html+=`<section class="saved-profile-picker"><div class="section-title"><h2>Your campaigns</h2></div><div class="saved-profile-grid">${(data?.profiles||[]).map((p,i)=>`<article class="card saved-profile-card ${p.id===data.selected_profile_id?'selected':''}"><button class="saved-profile-choice" onclick="saveInsightsState.profilePickerOpen=false;selectSaveProfile('${p.id}')"><span class="saved-profile-photo"><img src="${esc((window.islandGallery?.latium||['islands/latium.webp'])[i%(window.islandGallery?.latium?.length||1)])}" alt="Region artwork"></span><span><small>LOCAL CAMPAIGN · ${esc(p.account_label||'')}</small><b>${esc(p.name)}</b><small>${esc(p.latest_name)} · ${esc(savedDate(p.latest_at))}</small><small>${p.count} saves · Select to follow the newest save</small></span>${svg('arrow')}</button><details class="saved-file-picker"><summary>Choose a specific save · ${p.count}</summary><button class="saved-file-choice" onclick="saveInsightsState.profilePickerOpen=false;selectSaveProfile('${p.id}')"><span><b>Always use the newest save</b><small>Recommended · updates automatically</small></span>${svg('clock')}</button>${(p.saves||[]).map(f=>`<button class="saved-file-choice ${p.id===data.selected_profile_id&&f.name===data.selected_file?'selected':''}" data-profile="${p.id}" data-file="${esc(f.name)}" onclick="saveInsightsState.profilePickerOpen=false;selectSaveProfile(this.dataset.profile,null,this.dataset.file)"><span><b>${esc(f.name)}</b><small>${esc(savedDate(f.saved_at))} · ${(f.bytes/1048576).toFixed(1)} MB</small></span>${svg('arrow')}</button>`).join('')}</details></article>`).join('')||'<p class="small-note">No campaigns found in the Windows Documents game-save folder.</p>'}</div></section>`;
 return html;
}

// Global provenance applies to every core page, including PDF snapshot input.
const savedUpdateSourceBase=updateSource;
updateSource=function(){savedUpdateSourceBase();renderSaveSwitch();const source=snapshot?.save_source;if(!source||isDemo)return;$('modeTag').textContent=source.saved_areas===(snapshot.areas||[]).length?'SAVED DATA':'LIVE + SAVE';$('sourceLabel').textContent=`${source.profile_name} · ${source.saved_areas} saved islands · Saved ${savedDate(source.saved_at)}`;$('sourceDot').classList.toggle('live',source.saved_areas<(snapshot.areas||[]).length);};
const savedAreaLabelBase=areaDataLabel;
areaDataLabel=function(a){return a?.data_source==='save'?`Saved statistics · ${savedDate(a.received_at)}`:savedAreaLabelBase(a);};
const savedEntryDetailsBase=entryDetails;
entryDetails=function(e){if(e.data_source!=='save')return savedEntryDetailsBase(e);return `<div class="detail-title">${esc(e.area.area_name)}</div>${detailStats(e.ProductGeneration,e.ProductConsumption,e.ProductDelta)}<p class="notice">Recorded statistics history inside ${esc(snapshot?.save_source?.file_name||'the save')}. These rates may predate the save. Productivity, financial and workforce fields were not supplied by this source.</p><details><summary>Saved statistics fields</summary><pre>${esc(JSON.stringify(Object.fromEntries(Object.entries(e).filter(([k])=>!['area','areaKey'].includes(k))),null,2))}</pre></details>`;};
const savedObservationBase=needsObservation;
needsObservation=function(n){
 if(savedContextAllowed()){
  const area=savedArea(key(needsArea())),tier=N.tiers.find(t=>t.tier===n.tier&&t.region===n.region),state=savedNeedSummary(area,n.product_guid,tier?.guid);
  if(state&&state.tracked_houses>0&&!state.omitted){const value=state.explicit_full===state.tracked_houses?100:state.explicit_zero===state.tracked_houses?0:50;return {value,at:savedSnapshot().saved_at,from_save:true};}
 }
 return savedObservationBase(n);
};
const savedNeedProvenanceBase=needCard;
needCard=function(n){let html=savedNeedProvenanceBase(n);if(needsObservation(n)?.from_save)html=html.replace('Manually confirmed','Saved observation').replace('saved on this device','read from the selected save').replace('Your in-game observation','Saved need observation').replace('<select class="form-input"','<select disabled class="form-input"');return html;};
const savedGlobalRenderBase=render;
render=function(keep=false){savedGlobalRenderBase(keep);if(!snapshot?.save_source||isDemo)return;const main=$('main');if(main&&!$('savedDataNotice')){const note=document.createElement('div');note.id='savedDataNotice';note.className='notice saved-global-notice';note.innerHTML=`${svg('info')}<span><b>Use save data is ON</b><br>${snapshot.save_source.conflicting_pipe?'The pipe campaign does not match this save. Showing the selected saved campaign.':'Fresh matching pipe statistics take priority; otherwise recorded save statistics are used.'}<br>Saved ${esc(savedDate(snapshot.save_source.saved_at))} · Statistics history can be older than the save.</span>`;main.prepend(note);}for(const note of main?.querySelectorAll('.cache-notice')||[])note.remove();for(const node of main?.querySelectorAll('.small-note')||[]){if(node.textContent==='Local gaps may already be covered by imports. Stock levels and existing trade routes are not available.')node.textContent='Local gaps may already be covered by imports. Saved stock samples and configured routes are available in Save Insights.';}};

const savedProductViewBase=productView;
productView=function(...args){let html=savedProductViewBase(...args);if(snapshot?.save_source)html=html.replace('<div class="kicker">Cached data</div>','<div class="kicker">Saved statistics</div>');return html;};
const savedTradePageBase=tradePage;
tradePage=function(){
 const html=savedTradePageBase(),doc=savedContextAllowed()?savedSnapshot():null;if(!doc)return html;
 const state=tradeState(),editing=['editor','suggestions'].includes(state.view),showObserved=!editing&&(saveInsightsState.routeTab||(!state.doc.routes.length?'observed':'plans'))==='observed';
 const tabs=`<div class="saved-tabs"><button class="${showObserved?'active':''}" onclick="saveInsightsState.routeTab='observed';tradeState().view='list';render(true)">In-game routes (${doc.routes.length})</button><button class="${!showObserved?'active':''}" onclick="saveInsightsState.routeTab='plans';render(true)">Companion plans (${state.doc.routes.length})</button></div>`;
 if(!showObserved)return tabs+html.replace('The game does not report existing routes, ships or cargo.','In-game route definitions from the selected save are shown separately on the In-game routes tab.');
 const oldIsland=saveInsightsState.island,oldQuery=saveInsightsState.query;saveInsightsState.island='all';saveInsightsState.query='';const routes=savedRouteCards();saveInsightsState.island=oldIsland;saveInsightsState.query=oldQuery;
 return tabs+`<div class="section-title"><h2>In-game routes</h2><span class="badge">Saved ${esc(savedDate(doc.saved_at))}</span></div>`+routes;
};
companionPages.routes.content=tradePage;

const savedReceiveBase=window.receiveSnapshot;
window.receiveSnapshot=function(value,source){if(source!=='demo'&&saveInsightsState.live&&typeof value.use_save_data==='boolean')saveInsightsState.live.use_saves=value.use_save_data;return savedReceiveBase(value,source);};
