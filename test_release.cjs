const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const root=path.join(__dirname,'android-probe/app/src/main/assets/dashboard');
const dom=new JSDOM(fs.readFileSync(root+'/index.html','utf8'),{runScripts:'dangerously',url:'http://localhost/'}),w=dom.window;
w.scrollTo=()=>{};w.Native={ready(){},secure(){}};
for(const name of [...dom.window.document.querySelectorAll('script[src]')].map(s=>s.getAttribute('src')).filter(n=>n!=='browser.js'&&n!=='desktop.js')){const s=w.document.createElement('script');s.textContent=fs.readFileSync(path.join(root,name),'utf8');w.document.body.appendChild(s);}
const sample=JSON.parse(fs.readFileSync(root+'/demo.json','utf8'));assert(sample.synthetic);assert(sample.areas.every(a=>a.area_name.startsWith('Example')));w.receiveSnapshot(sample,'demo');
assert(w.annoKnowledge.factories.length>200);assert(w.annoKnowledge.chains.some(c=>c.region==='Aegyptus'&&c.tier==='Threshers'&&c.dlc_unlock_guids.includes(67904)));assert(w.annoKnowledge.quote_ids.length>=50);
for(const page of ['home','islands','products','supply','chains','needs','routes','more']){w.nav(page);assert(w.document.getElementById('main').textContent.trim());}
w.nav('supply');const cards=[...w.document.querySelectorAll('.route-card[data-product]')];assert(cards.length);for(const card of cards){card.click();assert(!w.document.getElementById('overlay').hidden);}w.closeSheet();
w.nav('products');w.setBrowseSort('products','delta');w.toggleBrowseDirection('products');w.openProduct(3158);assert(w.document.querySelector('.product-verdict'));w.setProductTab('supply');assert(!w.document.getElementById('productPanel-supply').hidden);
for(const guid of [55962,5959,5605]){w.openChain(guid,'','Albion');assert.equal(w.document.getElementById('chainBasis').value,'balanced');assert.equal(Number(w.document.getElementById('chainTarget').value),2);}w.closeSheet();
for(const good of ['Necklaces','Ivory Caskets']){
 const chain=w.annoKnowledge.chains.find(c=>c.region==='Aegyptus'&&c.name===good);
 assert(chain);w.openChain(chain.factory_guid,'','Aegyptus');
 const options=()=>Array.from(w.document.querySelectorAll('.chain-source-options button'));
 const washer=options().find(b=>b.textContent.includes('Gold Washer'));
 const mine=options().find(b=>b.textContent.includes('Gold Mine'));
 assert(washer&&mine);
 const ratios=()=>w.document.querySelector('#chainCalculation').querySelectorAll('.chain-step strong');
 const values=()=>Array.from(ratios(),e=>e.textContent).join('|');
 washer.click();const washerValues=values();
 assert.equal(options().find(b=>b.textContent.includes('Gold Washer')).getAttribute('aria-pressed'),'true');
 options().find(b=>b.textContent.includes('Gold Mine')).click();
 assert.equal(options().find(b=>b.textContent.includes('Gold Mine')).getAttribute('aria-pressed'),'true');
 assert.notEqual(values(),washerValues);
 w.closeSheet();
}
const mixed=JSON.parse(JSON.stringify(sample));mixed.pipe_state='connected';mixed.data_mode='mixed';mixed.last_data_at=new Date().toISOString();mixed.areas.forEach((a,i)=>{a.received_at=new Date(Date.now()-(i===0?86400000:1000)).toISOString();a.cached=a.stale=i===0;});w.receiveSnapshot(mixed,'live');assert(!w.snapshotCached());assert(w.snapshotMixed());assert(w.document.getElementById('sourceLabel').textContent.includes('Live: 3 · Cached: 1'));assert(w.document.getElementById('modeTag').textContent.includes('Live + cached'));assert.equal(w.empireReportPayload().snapshot.data_mode,'mixed');mixed.areas.forEach(a=>{a.received_at=new Date(Date.now()-61000).toISOString();});w.receiveSnapshot(mixed,'live');assert(w.snapshotCached());assert(!w.snapshotMixed());w.receiveSnapshot(sample,'demo');
for(const lang of Object.keys(w.annoUI)){w.setGameLanguage(lang);w.nav('chains');w.localizeUI();assert.equal(w.document.documentElement.lang,lang);}
const artIds=new Set([149678,67904,...w.annoNeeds.tiers.map(t=>t.guid),...w.annoNeeds.needs.map(n=>n.product_guid),...w.annoKnowledge.factories.flatMap(f=>[f.factory_guid,...f.inputs.concat(f.outputs).map(p=>p.product_guid)]),...w.annoKnowledge.captains.map(c=>c.guid)]);
for(const id of artIds)assert(w.iconPaths[id],`Missing catalogue icon: ${id}`);
for(const t of w.annoNeeds.tiers.filter(t=>t.region==='Aegyptus'))assert.equal(w.annoNeeds.art[t.tier],w.iconPaths[t.guid]);
const egypt={...sample.areas[0],session_guid:149679};
assert.equal(w.supplyRegion(egypt),'Aegyptus');
assert(w.regionImage(egypt).startsWith('islands/aegyptus-'));
assert(w.savedPhoto(egypt).startsWith('islands/aegyptus-'));
assert.equal(w.islandGallery.aegyptus.length,5);
for(const file of w.islandGallery.aegyptus)assert(fs.existsSync(path.join(root,file)));
for(const file of Object.values(w.iconPaths))assert(fs.existsSync(path.join(root,file)));
assert(!JSON.stringify(sample).includes('Juliana'));assert(!JSON.stringify(sample).includes('Marcus_1'));
w.dispatchEvent(new w.Event('pagehide'));w.close();console.log('PASS: complete synthetic release demo, all eight pages, real catalogue/images/quotes, Supply selections, sorting, product tabs, twelve UI languages');
