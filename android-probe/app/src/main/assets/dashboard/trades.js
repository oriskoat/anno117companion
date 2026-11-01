/* Saved plans belong to the PC in Live mode. Drafts and offline Demo are local. */
const tradeContexts=new Map(),tradeRequests=new Map();
const tradeClone=value=>JSON.parse(JSON.stringify(value));
const tradeId=()=>('t'+(crypto.randomUUID?.()||Date.now().toString(36)+Math.random().toString(36).slice(2))).replaceAll('-','');
function tradeContext(){return (isDemo?'demo:':'live:')+String(snapshot?.session_name||'unassigned').slice(0,230);}
function tradeState(){
 const context=tradeContext();if(!tradeContexts.has(context))tradeContexts.set(context,{context,demo:isDemo,doc:{revision:0,routes:[],skipped:[]},loaded:false,busy:false,lastRead:0,error:'',conflict:false,view:'list',draft:null,candidate:null,wizard:{route:'new',amount:''}});
 return tradeContexts.get(context);
}
function tradeNormalize(value){
 if(!value||!Number.isInteger(value.revision)||!Array.isArray(value.routes)||!Array.isArray(value.skipped)||value.routes.length>100)throw Error('Invalid shared plan');
 for(const r of value.routes){if(!/^[A-Za-z0-9_-]{1,80}$/.test(r.id)||!Array.isArray(r.stops)||!Array.isArray(r.cargo)||[...r.stops,...r.cargo].some(x=>!/^[A-Za-z0-9_-]{1,80}$/.test(x.id))||tradeValidation(r))throw Error('Invalid route');}
 return value;
}
function tradeValidation(route){
 if(!route.name?.trim())return 'Name your route.';
 if(route.stops.length<2||route.stops.length>30||route.stops.some(s=>!s.name?.trim()))return 'Name at least two island stops.';
 if(!route.cargo.length||route.cargo.length>100)return 'Add at least one good.';
 const ids=new Set(route.stops.map(s=>s.id));
 for(const c of route.cargo){if(!(c.productGuid>0)||!ids.has(c.from)||!ids.has(c.to)||c.from===c.to)return 'Choose a good and different loading and unloading stops.';if(c.amount!==null&&!(Number.isFinite(c.amount)&&c.amount>0&&c.amount<=1000000))return 'Cargo amounts must be positive.';}
 if(route.slots!==null&&(!Number.isInteger(route.slots)||route.slots<1||route.slots>100))return 'Enter a valid cargo slot count.';
 if(route.slotCapacity!==null&&!(Number.isFinite(route.slotCapacity)&&route.slotCapacity>0&&route.slotCapacity<=1000000))return 'Enter a valid capacity per slot.';
 return '';
}
function tradeCapacity(route){
 const configured=route.slots>0&&route.slotCapacity>0,edges=route.stops.map((s,i)=>({from:s,to:route.stops[(i+1)%route.stops.length],slots:0,amount:0,unknown:0,goods:{}}));
 for(const c of route.cargo){let i=route.stops.findIndex(s=>s.id===c.from),end=route.stops.findIndex(s=>s.id===c.to);if(i<0||end<0||i===end)continue;
  for(let n=0;i!==end&&n<route.stops.length;n++,i=(i+1)%route.stops.length){const edge=edges[i];if(!(c.amount>0&&c.amount<=1000000))edge.unknown++;else{edge.amount+=c.amount;edge.goods[c.productGuid]=(edge.goods[c.productGuid]||0)+c.amount;}}
 }
 if(configured)for(const e of edges)e.slots=Object.values(e.goods).reduce((n,amount)=>n+Math.ceil(amount/route.slotCapacity),0);
 return {configured,edges,overloaded:configured&&edges.some(e=>e.slots>route.slots),incomplete:!configured||edges.some(e=>e.unknown)};
}
function tradeSignature(guid,from,to){return JSON.stringify([Number(guid),from,to]);}
function tradePlanned(doc){const keys=new Set();for(const route of doc.routes)for(const c of route.cargo){const a=route.stops.find(s=>s.id===c.from),b=route.stops.find(s=>s.id===c.to);if(a?.areaKey&&b?.areaKey)keys.add(tradeSignature(c.productGuid,a.areaKey,b.areaKey));}return keys;}
function tradeSuggestions(){return [...(snapshot?.supply_suggestions||[])].sort((a,b)=>b.suggested_rate-a.suggested_rate);}
function tradePending(state){const planned=tradePlanned(state.doc);return tradeSuggestions().filter(s=>!planned.has(tradeSignature(s.product_guid,s.from_area_key,s.to_area_key))&&!state.doc.skipped.includes(tradeSignature(s.product_guid,s.from_area_key,s.to_area_key)));}
window.tradeRoutesReply=function(id,value){const pending=tradeRequests.get(id);if(pending){clearTimeout(pending.timer);tradeRequests.delete(id);pending.resolve(value);}};
function tradeTransport(state,body){
 if(window.isBrowserClient&&window.Native?.tradeRoutes)return window.Native.tradeRoutes(state.context,body);
 if(window.Native?.tradeRoutes)return new Promise((resolve,reject)=>{const id=tradeId(),timer=setTimeout(()=>{tradeRequests.delete(id);reject(Error('Shared save unavailable. Your draft is kept.'));},16000);tradeRequests.set(id,{resolve,timer});window.Native.tradeRoutes(id,state.context,body?JSON.stringify(body):'');});
 return Promise.reject(Error('Connect to the PC bridge to use shared route plans.'));
}
function tradeLoad(force=false){const state=tradeState();if(state.loading)return state.loading;if(state.busy)return Promise.resolve(false);state.loading=(async()=>{try{return await tradeRead(force);}finally{state.loading=null;}})();return state.loading;}
async function tradeRead(force=false){
 const state=tradeState();if(state.busy||(!force&&state.loaded&&Date.now()-state.lastRead<15000))return;
 state.busy=true;state.error='';state.lastAttempt=Date.now();let loaded=false;
 try{let value;if(state.demo)value=JSON.parse(localStorage.getItem('anno.trades.'+state.context)||'{"revision":0,"routes":[],"skipped":[]}');
  else{const reply=await tradeTransport(state);if(reply.status!==200)throw Error(reply.status===401?'Pair your PC bridge to use shared plans.':'Shared save unavailable. Your draft is kept.');value=reply.document;}
  state.doc=tradeNormalize(value);state.loaded=true;state.lastRead=Date.now();loaded=true;
  if(state.draft&&state.draftRevision!==state.doc.revision){state.conflict=true;state.error='Changed on another device. Your draft is kept. Save a copy or reload.';}
 }catch(error){state.error=error.message;}finally{state.busy=false;if(tradeState()===state){if(current==='routes')render(true);else if(current==='supply')renderSupplyList();else if(['home','needs'].includes(current))render(true);}}
 return loaded;
}
async function tradeCommit(state,routes,skipped=state.doc.skipped){
 if(state.busy)return false;state.busy=true;state.error='';if(tradeState()===state)document.querySelectorAll('.trade-editor input,.trade-editor select,.trade-editor button,.trade-wizard input,.trade-wizard select,.trade-wizard button').forEach(n=>n.disabled=true);
 try{let reply;const body={revision:state.doc.revision,routes,skipped};
  if(state.demo){const saved=JSON.parse(localStorage.getItem('anno.trades.'+state.context)||'{"revision":0,"routes":[],"skipped":[]}');reply=saved.revision!==body.revision?{status:409,document:saved}:{status:200,document:{revision:body.revision+1,routes,skipped}};if(reply.status===200)localStorage.setItem('anno.trades.'+state.context,JSON.stringify(reply.document));}
  else reply=await tradeTransport(state,body);
  if(reply.status===409){state.conflict=true;state.error='Changed on another device. Your draft is kept. Save a copy or reload.';return false;}
  if(reply.status!==200)throw Error('Shared save unavailable. Your draft is kept.');
  state.doc=tradeNormalize(reply.document);state.loaded=true;state.lastRead=Date.now();state.conflict=false;return true;
 }catch(error){state.error=error.message;return false;}finally{state.busy=false;}
}
function tradeGoods(){const goods=new Map();for(const f of K.factories)for(const o of f.outputs)goods.set(o.product_guid,gameName(o.product_guid,o.product_name));for(const p of allProducts)goods.set(p.guid,p.name);return [...goods].sort((a,b)=>a[1].localeCompare(b[1],appLanguage));}
function tradeField(label,html){return `<label class="trade-field"><span>${label}</span>${html}</label>`;}
function tradeNumber(value){return value===''?null:Number(value);}
function tradeRefresh(){if(current==='routes'){const top=window.scrollY;render(false);window.scrollTo(0,top);}}
function tradeNew(){const s=tradeState();s.view='editor';s.error='';s.conflict=false;s.draftRevision=s.doc.revision;s.draft={id:tradeId(),name:'',ship:'',slots:null,slotCapacity:null,stops:[{id:tradeId(),areaKey:'',name:''},{id:tradeId(),areaKey:'',name:''}],cargo:[]};tradeAddCargo(false);tradeRefresh();}
function tradeEdit(id){const s=tradeState(),route=s.doc.routes.find(r=>r.id===id);if(route){s.draft=tradeClone(route);s.draftRevision=s.doc.revision;s.view='editor';s.error='';s.conflict=false;tradeRefresh();}}
function tradeAddCargo(refresh=true){const d=tradeState().draft;d.cargo.push({id:tradeId(),productGuid:0,productName:'',from:d.stops[0].id,to:d.stops[1].id,amount:null,hintRate:null,suggestionKey:''});if(refresh)tradeRefresh();}
function tradeSetRoute(field,value){tradeState().draft[field]=['slots','slotCapacity'].includes(field)?tradeNumber(value):value;if(['slots','slotCapacity'].includes(field))tradeUpdateCapacity();}
function tradeSetCargo(id,field,value){const c=tradeState().draft.cargo.find(c=>c.id===id);if(!c)return;c[field]=field==='amount'?tradeNumber(value):field==='productGuid'?Number(value):value;if(field==='productGuid'){c.productName=gameName(c.productGuid);c.hintRate=null;c.suggestionKey='';tradeRefresh();}else tradeUpdateCapacity();}
function tradeSetStop(id,value,manual=false){const d=tradeState().draft,stop=d.stops.find(s=>s.id===id);if(manual){stop.name=value;const a=(snapshot?.areas||[]).find(a=>key(a)===stop.areaKey);if(a?.area_name!==value)stop.areaKey='';}else{const a=(snapshot?.areas||[]).find(a=>key(a)===value);stop.areaKey=value;stop.name=a?.area_name||'';tradeRefresh();}}
function tradeMoveStop(id,delta){const d=tradeState().draft,i=d.stops.findIndex(s=>s.id===id),j=i+delta;if(j<0||j>=d.stops.length)return;[d.stops[i],d.stops[j]]=[d.stops[j],d.stops[i]];tradeRefresh();}
function tradeRemoveStop(id){const s=tradeState(),d=s.draft;if(d.stops.length<=2||d.cargo.some(c=>c.from===id||c.to===id)){s.error='Remove cargo using this stop first.';}else d.stops=d.stops.filter(p=>p.id!==id);tradeRefresh();}
function tradeRemoveCargo(id){tradeState().draft.cargo=tradeState().draft.cargo.filter(c=>c.id!==id);tradeRefresh();}
function tradeAddStop(){tradeState().draft.stops.push({id:tradeId(),areaKey:'',name:''});tradeRefresh();}
async function tradeSave(copy=false){const s=tradeState();s.error=tradeValidation(s.draft);if(s.error){tradeRefresh();return;}
 let draft=tradeClone(s.draft);
 if(s.conflict){if(!copy)return;const loaded=await tradeLoad(true);if(!loaded){tradeRefresh();return;}draft.id=tradeId();}
 const routes=s.doc.routes.filter(r=>r.id!==draft.id).concat(draft);
 if(await tradeCommit(s,routes)){s.view='list';s.draft=null;s.focusRoute=draft.id;s.saved={routeId:draft.id,title:'Route saved'};}tradeRefresh();tradeRevealSaved();
}
async function tradeDelete(id){const s=tradeState(),deleted=s.doc.routes.find(r=>r.id===id);if(await tradeCommit(s,s.doc.routes.filter(r=>r.id!==id)))s.deleted=deleted;tradeRefresh();}
async function tradeUndo(){const s=tradeState();if(s.deleted&&!s.doc.routes.some(r=>r.id===s.deleted.id)&&await tradeCommit(s,[...s.doc.routes,s.deleted])){s.deleted=null;tradeRefresh();}}
async function tradeReload(discard=false){const s=tradeState();if(discard){s.draft=null;s.view='list';}await tradeLoad(true);if(!s.error)s.conflict=false;tradeRefresh();}
function tradeList(){const s=tradeState();s.view='list';s.error='';tradeRefresh();}
function tradeViewRoute(id){const s=tradeState();s.focusRoute=id;s.view='list';nav('routes');document.getElementById('trade-route-'+id)?.scrollIntoView?.({block:'center',behavior:'smooth'});}
function tradeSavedHtml(s){const saved=s.saved,route=s.doc.routes.find(r=>r.id===saved?.routeId);if(!route)return '';return `<section class="trade-saved" id="tradeSavedFeedback" role="status">${svg('check')}<div><b>${saved.title}</b><strong>${esc(route.name)}</strong>${saved.good?`<span>${esc(saved.good)} · ${esc(saved.from)} → ${esc(saved.to)} · ${saved.amount===null?'Amount not set':fmt(saved.amount)+' / visit'}</span>`:''}</div><button class="secondary" onclick="tradeViewRoute('${route.id}')">View route ${svg('chevron')}</button></section>`;}
function tradeRevealSaved(){document.getElementById('tradeSavedFeedback')?.scrollIntoView?.({block:'center',behavior:'smooth'});}

function tradeWizard(candidate=null){const s=tradeState();s.view='suggestions';s.candidate=candidate?tradeClone(candidate):null;s.wizard={route:'new',amount:''};s.error='';nav('routes',true);}
async function tradeSkip(){const s=tradeState(),c=s.candidate;if(!c)return;if(await tradeCommit(s,s.doc.routes,[...s.doc.skipped,tradeSignature(c.product_guid,c.from_area_key,c.to_area_key)])){s.candidate=null;s.wizard.amount='';}tradeRefresh();}
async function tradeResetSkipped(){const s=tradeState();if(await tradeCommit(s,s.doc.routes,[]))s.candidate=null;tradeRefresh();}
function tradeSuggestionRoute(s){const c=s.candidate;if(!c)return null;const amount=tradeNumber(s.wizard.amount);if(amount!==null&&!(Number.isFinite(amount)&&amount>0&&amount<=1000000))return null;
 let route=s.doc.routes.find(r=>r.id===s.wizard.route);route=route?tradeClone(route):{id:tradeId(),name:c.from_area+' → '+c.to_area,ship:'',slots:null,slotCapacity:null,stops:[],cargo:[]};
 const stop=(areaKey,name)=>{let p=route.stops.find(p=>p.areaKey===areaKey);if(!p){p={id:tradeId(),areaKey,name};route.stops.push(p);}return p;};
 const from=stop(c.from_area_key,c.from_area),to=stop(c.to_area_key,c.to_area_key===c.from_area_key?c.from_area:c.to_area);
 route.cargo.push({id:tradeId(),productGuid:c.product_guid,productName:c.product_name||gameName(c.product_guid),from:from.id,to:to.id,amount,hintRate:c.suggested_rate,suggestionKey:tradeSignature(c.product_guid,c.from_area_key,c.to_area_key)});
 return route;
}
function tradeWizardPreview(){const route=tradeSuggestionRoute(tradeState());return route?`<div class="trade-preview"><b>Preview · not saved yet</b><div class="trade-stop-strip">${route.stops.map(p=>`<span>${esc(p.name)}</span>`).join(svg('chevron'))}${svg('arrow')}</div><div class="trade-preview-goods">${route.cargo.map(c=>`<span>${icon(c.productGuid)}${esc(gameName(c.productGuid,c.productName))} · ${c.amount===null?'—':fmt(c.amount)}</span>`).join('')}</div>${tradeCapacityHtml(route)}</div>`:'';}
function tradeUpdateWizardPreview(){const node=$('tradeWizardPreview');if(node){node.innerHTML=tradeWizardPreview();window.localizeUI?.(node);}}
async function tradeAccept(){const s=tradeState(),c=s.candidate;if(!c)return;const route=tradeSuggestionRoute(s);if(!route){s.error='Cargo amounts must be positive.';tradeRefresh();return;}
 const error=tradeValidation(route);if(error){s.error=error;tradeRefresh();return;}
 if(tradePlanned(s.doc).has(tradeSignature(c.product_guid,c.from_area_key,c.to_area_key))){s.candidate=null;tradeRefresh();return;}
 if(await tradeCommit(s,[...s.doc.routes.filter(r=>r.id!==route.id),route])){s.saved={routeId:route.id,title:'Added to route',good:gameName(c.product_guid,c.product_name),from:c.from_area,to:c.to_area,amount:tradeNumber(s.wizard.amount)};s.candidate=null;s.wizard.route=route.id;s.wizard.amount='';}tradeRefresh();tradeRevealSaved();
}
function tradeCapacityHtml(route){const c=tradeCapacity(route);return `<div class="trade-capacity ${c.overloaded?'overloaded':''}"><b>${c.overloaded?'Cargo exceeds the configured slots':c.incomplete?'Capacity check incomplete':'Fits the configured cargo slots'}</b>${!c.configured?'<p>Set the ship slots and capacity per slot to check loading.</p>':''}<div>${c.edges.map(e=>`<span>${esc(e.from.name||'…')} → ${esc(e.to.name||'…')}<b>${c.configured?`${e.slots} / ${route.slots} slots`:'—'}${e.unknown?' + ?':''}</b></span>`).join('')}</div><p>Checks one ship on a repeating route. Each good uses separate slots; cargo is unloaded before loading at a stop. Travel times and existing ships are unknown.</p></div>`;}
function tradeUpdateCapacity(){const node=$('tradeCapacity');if(node){node.innerHTML=tradeCapacityHtml(tradeState().draft);window.localizeUI?.(node);}}
function tradeEditorHtml(s){const d=s.draft,goods=tradeGoods(),islands=snapshot?.areas||[];
 return `<section class="trade-panel trade-editor"><div class="section-title"><h2>${d.name?esc(d.name):'New trade route'}</h2><button class="link" onclick="tradeList()">All routes</button></div><div class="trade-fields">${tradeField('Route name',`<input class="form-input" value="${esc(d.name)}" maxlength="160" oninput="tradeSetRoute('name',this.value)">`)}${tradeField('Ship name',`<input class="form-input" value="${esc(d.ship)}" maxlength="160" oninput="tradeSetRoute('ship',this.value)" placeholder="Optional">`)}${tradeField('Cargo slots',`<input class="form-input" type="number" min="1" max="100" value="${d.slots??''}" oninput="tradeSetRoute('slots',this.value)" placeholder="Set manually">`)}${tradeField('Capacity per slot',`<input class="form-input" type="number" min="0.01" step="any" value="${d.slotCapacity??''}" oninput="tradeSetRoute('slotCapacity',this.value)" placeholder="Set manually">`)}</div><h3>Island stops</h3><p class="small-note">The ship visits these stops in order, then returns to the first.</p><div class="trade-stops">${d.stops.map((p,i)=>`<article class="trade-stop"><b class="trade-stop-number">${i+1}</b><div>${tradeField('Island',`<select class="form-input" onchange="tradeSetStop('${p.id}',this.value)"><option value="">Custom island</option>${islands.map(a=>`<option value="${key(a)}" ${p.areaKey===key(a)?'selected':''}>${esc(a.area_name)}</option>`).join('')}</select>`)}<input class="form-input" aria-label="Island name" value="${esc(p.name)}" maxlength="160" oninput="tradeSetStop('${p.id}',this.value,true)" placeholder="Island name"></div><div class="trade-stop-actions"><button onclick="tradeMoveStop('${p.id}',-1)" ${!i?'disabled':''} aria-label="Move stop up">↑</button><button onclick="tradeMoveStop('${p.id}',1)" ${i===d.stops.length-1?'disabled':''} aria-label="Move stop down">↓</button><button onclick="tradeRemoveStop('${p.id}')" aria-label="Remove stop">×</button></div></article>`).join('')}</div><button class="secondary" onclick="tradeAddStop()">Add island stop</button><div class="section-title"><h3>Cargo on this ship</h3><button class="link" onclick="tradeAddCargo()">Add good +</button></div><p class="small-note">Set the amount per visit for each good. Several goods can share the same ship.</p><div class="trade-cargo">${d.cargo.map(c=>`<article class="trade-cargo-row">${icon(c.productGuid)}<div class="trade-cargo-fields">${tradeField('Good',`<select class="form-input" aria-label="Cargo good" onchange="tradeSetCargo('${c.id}','productGuid',this.value)"><option value="0">Choose a good</option>${goods.map(([g,n])=>`<option value="${g}" ${g===c.productGuid?'selected':''}>${esc(n)}</option>`).join('')}</select>`)}${tradeField('Load at',`<select class="form-input" onchange="tradeSetCargo('${c.id}','from',this.value)">${d.stops.map(p=>`<option value="${p.id}" ${p.id===c.from?'selected':''}>${esc(p.name||'…')}</option>`).join('')}</select>`)}${tradeField('Unload at',`<select class="form-input" onchange="tradeSetCargo('${c.id}','to',this.value)">${d.stops.map(p=>`<option value="${p.id}" ${p.id===c.to?'selected':''}>${esc(p.name||'…')}</option>`).join('')}</select>`)}${tradeField('Amount per visit',`<input class="form-input" type="number" min="0.01" step="any" value="${c.amount??''}" oninput="tradeSetCargo('${c.id}','amount',this.value)" placeholder="Set manually">`)}${c.hintRate?`<small>Suggested production rate: ${fmt(c.hintRate)} · not a shipment amount</small>`:''}</div><button class="trade-remove" onclick="tradeRemoveCargo('${c.id}')" aria-label="Remove good">×</button></article>`).join('')}</div><div id="tradeCapacity">${tradeCapacityHtml(d)}</div><button class="primary" onclick="tradeSave()" ${s.busy||s.conflict?'disabled':''}>Save route</button>${s.conflict?'<button class="secondary" onclick="tradeSave(true)">Save a copy</button>':''}</section>`;
}
function tradeWizardHtml(s){const pending=tradePending(s);if(!s.candidate)s.candidate=pending[0]?tradeClone(pending[0]):null;const c=s.candidate;
 if(!c)return `${tradeSavedHtml(s)}<section class="trade-panel"><h2>${tradeSuggestions().length?'Suggestions reviewed':'No supply suggestions yet'}</h2><p>Saved route plans are not in-game trade orders.</p><button class="primary" onclick="tradeList()">View trade routes</button>${s.doc.skipped.length?'<button class="secondary" onclick="tradeResetSkipped()">Review skipped suggestions</button>':''}</section>`;
 return `${tradeSavedHtml(s)}<section class="trade-panel trade-wizard"><div class="section-title"><h2>One suggestion at a time</h2><button class="link" onclick="tradeList()">All routes</button></div><p class="small-note">${pending.length} remaining · ${tradePlanned(s.doc).size} planned · ${s.doc.skipped.length} skipped</p><div class="trade-suggestion-good">${icon(c.product_guid)}<div><h3>${esc(gameName(c.product_guid,c.product_name))}</h3><small>Suggested production rate: ${fmt(c.suggested_rate)}</small></div></div><div class="trade-route-path"><b>${esc(c.from_area)}</b>${svg('arrow')}<b>${esc(c.to_area)}</b></div><p class="small-note">A production rate is not a cargo amount. Set the amount per visit manually; the game does not provide travel times.</p>${tradeField('Add to route',`<select class="form-input" onchange="tradeState().wizard.route=this.value;tradeUpdateWizardPreview()"><option value="new">New route</option>${s.doc.routes.map(r=>`<option value="${r.id}" ${s.wizard.route===r.id?'selected':''}>${esc(r.name)} · ${r.cargo.length} goods</option>`).join('')}</select>`)}${tradeField('Amount per visit',`<input class="form-input" type="number" min="0.01" step="any" value="${esc(s.wizard.amount)}" oninput="tradeState().wizard.amount=this.value;tradeUpdateWizardPreview()" placeholder="Set now or later">`)}<div id="tradeWizardPreview">${tradeWizardPreview()}</div><div class="trade-actions"><button class="primary" onclick="tradeAccept()" ${s.busy||s.conflict?'disabled':''}>Add and continue ${svg('arrow')}</button><button class="secondary" onclick="tradeSkip()" ${s.busy||s.conflict?'disabled':''}>Skip for now</button></div></section>`;
}
function tradePage(){const s=tradeState();if(!s.loaded&&!s.busy&&!s.error)queueMicrotask(()=>tradeLoad());
 return `<div class="trade-heading"><div><h2>Current routes</h2><p>${s.demo?'Local demo plans':'Shared plans on your PC'} · ${esc(snapshot?.session_name||'No session selected')}</p></div><button class="link" onclick="tradeReload()" ${s.busy?'disabled':''}>Refresh shared plan</button></div><div class="notice">${svg('info')}<span>These are your route plans. The game does not report existing routes, ships or cargo. Apply the plan manually in Anno.</span></div>${s.error?`<div class="trade-error" role="alert">${esc(s.error)}${s.conflict?'<button class="inline-link" onclick="tradeReload(true)">Discard draft and reload</button>':''}</div>`:''}${!s.loaded?`<div class="empty"><p>${s.busy?'Loading route plans…':'Connect to the PC bridge to use shared route plans.'}</p></div>`:s.view==='editor'?tradeEditorHtml(s):s.view==='suggestions'?tradeWizardHtml(s):`${tradeSavedHtml(s)}<div class="trade-actions"><button class="primary" onclick="tradeNew()">New trade route +</button><button class="secondary" onclick="tradeWizard()">Plan from Supply suggestions ${svg('arrow')}</button>${s.draft?'<button class="link" onclick="tradeState().view=\'editor\';tradeRefresh()">Continue draft</button>':''}</div>${s.deleted?'<div class="notice">Route removed. <button class="inline-link" onclick="tradeUndo()">Undo</button></div>':''}<div class="trade-route-grid">${s.doc.routes.map(r=>`<article id="trade-route-${r.id}" class="trade-panel trade-route-card ${s.focusRoute===r.id?'trade-route-selected':''}"><div class="section-title"><h3>${esc(r.name)}</h3><button class="link" onclick="tradeEdit('${r.id}')">Edit route</button></div><p>${esc(r.ship||'Ship not assigned')}</p><div class="trade-stop-strip">${r.stops.map(p=>`<span>${esc(p.name)}</span>`).join(svg('chevron'))}${svg('arrow')}</div><div class="trade-manifest">${r.cargo.map(c=>`<div>${icon(c.productGuid)}<span><b>${esc(gameName(c.productGuid,c.productName))}</b><small>${esc(r.stops.find(p=>p.id===c.from)?.name)} → ${esc(r.stops.find(p=>p.id===c.to)?.name)}</small></span><strong>${c.amount===null?'—':fmt(c.amount)}<small>per visit</small></strong></div>`).join('')}</div>${tradeCapacityHtml(r)}<button class="inline-link" onclick="tradeDelete('${r.id}')">Remove route</button></article>`).join('')||empty('No trade routes yet','Create a route for several goods, or work through Supply suggestions one by one.')}</div>`}`;
}
companionPages.routes={titles:['YOUR SHIPPING PLANS','Current routes.','Several goods. One ship. A clearer plan.'],content:tradePage,offline:true};
const tradeNavBase=nav;
nav=function(page,keepTradeView=false){if(page==='routes'&&!keepTradeView)tradeState().view='list';tradeNavBase(page);if(page==='routes'&&!keepTradeView)tradeLoad(true);};
const tradeRenderBase=render;
render=function(keep=false){const s=current==='routes'?tradeState():null;if(s&&keep&&s.loaded&&s.view!=='list'&&document.querySelector('.trade-panel')){updateSource();return;}
 tradeRenderBase(keep);const bar=document.querySelector('.bottom-nav');if(!bar.querySelector('[data-trades]')){const b=document.createElement('button');b.dataset.trades='true';b.setAttribute('aria-label','Trade routes');b.innerHTML=`<span class="nav-icon">${svg('supply')}</span>Routes`;b.onclick=()=>nav('routes');bar.insertBefore(b,bar.lastElementChild);}
 if(snapshot&&['home','supply'].includes(current)){const data=tradeState();if(!data.busy&&(!data.loaded?Date.now()-(data.lastAttempt||0)>15000:Date.now()-data.lastRead>15000))queueMicrotask(()=>tradeLoad());}
 if(current==='routes'){for(const b of bar.querySelectorAll('button'))b.classList.toggle('active',b.hasAttribute('data-trades'));if(s.loaded&&s.view==='list'&&!s.busy&&Date.now()-s.lastRead>15000)queueMicrotask(()=>tradeLoad());}
};
function tradeRoutesForTransfer(proposal){const signature=tradeSignature(proposal.product_guid,proposal.from_area_key,proposal.to_area_key);return tradeState().doc.routes.filter(r=>tradePlanned({routes:[r]}).has(signature));}
const tradeRouteCardBase=routeCard;
routeCard=function(proposal){const state=tradeState(),routes=state.loaded?tradeRoutesForTransfer(proposal):[];
 const controls=routes.length?`<div class="trade-supply-linked"><span>${svg('check')}Route planned</span>${routes.map(r=>`<button class="inline-link" onclick="tradeViewRoute('${r.id}')">${esc(r.name)}</button>`).join('')}<button class="trade-plan-suggestion" onclick="tradeViewRoute('${routes[0].id}')">View route ${svg('chevron')}</button></div>`:`${state.error&&!state.loaded?'<small class="trade-route-unknown">Route status unavailable</small>':''}<button class="trade-plan-suggestion" onclick="tradeWizard(${esc(JSON.stringify(proposal))})">Plan this transfer ${svg('arrow')}</button>`;
 return tradeRouteCardBase(proposal).replace('<div class="route-foot">',controls+'<div class="route-foot">');
};
window.addEventListener('pagehide',()=>{for(const {timer} of tradeRequests.values())clearTimeout(timer);tradeRequests.clear();});
