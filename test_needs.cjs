const fs=require('fs'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const root='android-probe/app/src/main/assets/dashboard',dom=new JSDOM(fs.readFileSync(root+'/index.html','utf8'),{url:'http://localhost',runScripts:'dangerously'}),w=dom.window,errors=[];w.addEventListener('error',e=>errors.push(e.error));w.scrollTo=()=>{};w.Native={ready(){},secure(){}};
for(const m of fs.readFileSync(root+'/index.html','utf8').matchAll(/<script src="([^"]+)"/g)){if(['browser.js','updates.js'].includes(m[1]))continue;const s=w.document.createElement('script');s.textContent=fs.readFileSync(root+'/'+m[1],'utf8');w.document.body.appendChild(s);}
const sample=JSON.parse(fs.readFileSync(root+'/demo.json','utf8'));w.receiveSnapshot(sample,'demo');
try{
 assert.equal(w.annoNeeds.tiers.length,14);assert.deepEqual(Array.from(w.annoNeeds.tiers.filter(t=>t.region==='Aegyptus'),t=>t.tier),['Threshers','Potters','Chanters','Scribes','Gymnasiarchs']);const aegyptusNeed=w.annoNeeds.needs.find(n=>n.tier==='Threshers'&&n.rates.Low>0);assert(Math.abs(aegyptusNeed.rates.VeryHigh-aegyptusNeed.rates.Low*1.75)<1e-12);assert(w.annoNeeds.needs.some(n=>n.is_service));
 w.nav('supply');w.setSupplyFilter('region','Albion');assert(w.supplyTierOptions().includes('Waders'));
 const albion=sample.areas.find(a=>a.session_guid===6627);assert(albion);
 const c=w.supplyClassification({from_area_key:[albion.session_id,albion.island_id,albion.area_index].join(':'),product_guid:2097});assert.equal(c.tier,'Waders');const latium=sample.areas.find(a=>a.session_guid===3245);assert.equal(w.supplyClassification({from_area_key:[latium.session_id,latium.island_id,latium.area_index].join(':'),product_guid:2110}).tier,'Infrastructure');assert(w.needArt('Infrastructure').includes('infra-art'));
 w.nav('needs');assert.equal(w.document.querySelector('[aria-label="Needs island"]').value,'all');assert.equal(w.document.querySelector('#needsTier').value,'all');assert.equal(w.document.querySelectorAll('.needs-island').length,sample.areas.length);w.needsFilter('island',[albion.session_id,albion.island_id,albion.area_index].join(':'));w.needsFilter('tier','Waders');assert(w.document.querySelector('.needs-tier-heading').textContent.includes('Waders'));
 assert(w.document.querySelector('.needs-tier-heading img').src.includes('needs-1500'));assert(w.document.querySelectorAll('.need-card').length>=7);
 const cockles=w.annoNeeds.needs.find(n=>n.tier==='Waders'&&n.product_guid===2097);assert.equal(w.needsObservation(cockles),null);assert.equal(w.needsBalance(cockles),w.needsEntry(cockles)?.ProductDelta<0?'Local deficit':w.needsEntry(cockles)?w.needsEntry(cockles).ProductConsumption>0?'Local production covers demand':'No observed consumption':'No observed data');
 const cards=[...w.document.querySelectorAll('.need-card')];assert(cards.length>=2);
 const first=cards[0],second=cards[1],id=first.dataset.needCard;
 first.querySelector('summary').click();assert.equal(first.open,false);assert.equal(second.open,true);assert(first.closest('.need-category').open);
 w.needCardToggle(first);
 w.receiveSnapshot(sample,'demo');
 const refreshed=[...w.document.querySelectorAll('.need-card')].find(c=>c.dataset.needCard===id);
 assert.equal(refreshed.open,false);refreshed.querySelector('summary').click();w.needCardToggle(refreshed);assert.equal(refreshed.open,true);
 const confirmation=w.document.querySelector('.need-confirm select');confirmation.focus();w.receiveSnapshot(sample,'demo');assert.equal(w.document.activeElement,confirmation);w.setNeedObservation(cockles.need_guid,'100');assert.equal(w.needsObservation(cockles).value,100);assert(w.document.querySelector('.need-fulfilled'));assert(w.document.body.textContent.includes('Threshold confirmed'));
 const other=sample.areas.find(a=>a.session_guid===6627&&a!==albion);if(other){w.needsFilter('island',[other.session_id,other.island_id,other.area_index].join(':'));assert.equal(w.needsObservation(cockles),null);}
 w.receiveSnapshot(sample,'live');assert.equal(w.needsObservation(cockles),null);w.receiveSnapshot(sample,'demo');
 const lat=sample.areas.find(a=>a.session_guid===3245);w.needsFilter('island',[lat.session_id,lat.island_id,lat.area_index].join(':'));w.needsFilter('tier','Plebeians');
 const garum=w.annoNeeds.needs.find(n=>n.region==='Latium'&&n.tier==='Plebeians'&&n.product_guid===2139);assert.equal(garum.rewards.Money,2);assert.equal(garum.rewards.Happiness,1);
 w.needsPlan(garum.need_guid);assert(!w.document.querySelector('#overlay').hidden);w.closeSheet();
 assert(w.buildingEffects(2994).includes('-2'));assert(w.buildingEffects(2994).includes('Radius: 20'));assert(w.buildingEffects(13808).includes('Fire safety'));assert(w.buildingEffects(13808).includes('Radius: 24'));
 w.openChain(13808);assert(w.document.querySelector('#chainCalculation .building-effects'));w.closeSheet();
 assert.equal(errors.length,0,errors.map(String).join('\n'));console.log('PASS: all fourteen tiers + services, Waders grouping and portrait, unknown vs manual fulfilment, per-island/mode isolation, category thresholds, need rewards, contextual chain and building radius effects');
}finally{w.close();}
