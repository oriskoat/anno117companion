const fs=require('node:fs'),assert=require('node:assert/strict');let JSDOM;try{({JSDOM}=require('jsdom'));}catch{({JSDOM}=require('../../tools/ui-check/node_modules/jsdom'));}
const root='android-probe/app/src/main/assets/dashboard',dom=new JSDOM(fs.readFileSync(root+'/index.html','utf8'),{url:'http://localhost',runScripts:'dangerously'}),w=dom.window;w.scrollTo=()=>{};w.Native={ready(){},secure(){}};
for(const m of fs.readFileSync(root+'/index.html','utf8').matchAll(/<script src="([^"]+)"/g)){if(['browser.js','updates.js'].includes(m[1]))continue;const s=w.document.createElement('script');s.textContent=fs.readFileSync(root+'/'+m[1],'utf8');w.document.body.appendChild(s);}
try{
 const demo=JSON.parse(fs.readFileSync(root+'/demo.json','utf8'));w.receiveSnapshot(demo,'demo');w.setUseSaveData(true);w.nav('insights');assert(w.document.body.textContent.includes('Invented Example Empire'));assert.equal(w.document.querySelectorAll('.saved-island-card').length,4);
 for(const tab of ['routes','stocks','needs','sites']){w.setSavedTab(tab);assert(w.document.querySelector('#savedInsightsResults'));}
 w.setSavedTab('stocks');assert(w.document.querySelector('.saved-stock-row'));w.document.querySelector('.saved-stock-row').click();assert(w.document.querySelector('.saved-stock-detail'));w.closeSheet();
 w.setSavedTab('needs');assert(w.document.querySelector('.saved-tier-counts'));assert(!w.document.querySelector('button button'));
 const data=w.saveInsightsDemo(),area=data.snapshot.areas[0],guid=area.inventory[0].product_guid;
 const route={id:999,name:'Actual Cheese <route>',ship_ids:[1],stops:[{area_key:data.snapshot.areas[1].area_key,name:'Source',goods:[{product_guid:guid,action:'unspecified',amount:50}]},{area_key:area.area_key,name:area.name,goods:[{product_guid:guid,action:'unload',amount:50}]}]};data.snapshot.routes=[route];
 w.eval('saveInsightsState.live='+JSON.stringify(data));w.receiveSnapshot(demo,'live');
 assert(w.savedArea(area.area_key));assert.equal(w.savedRoutesTo(guid,area.area_key).length,1);assert(w.savedProductContext(guid,area.area_key).includes('Latest saved stock sample'));
 const fertility=w.annoKnowledge.specialists.find(s=>s.status!=='placeholder/test'&&s.fertility_grants?.some(g=>w.annoKnowledge.factories.some(f=>f.fertility_guid===g.guid&&s.target_assets.some(t=>t.guid===f.factory_guid))));
 assert(fertility,'fertility specialist with matching factory');
 const factory=w.annoKnowledge.factories.find(f=>fertility.fertility_grants.some(g=>f.fertility_guid===g.guid)&&fertility.target_assets.some(t=>t.guid===f.factory_guid));
 const captain=w.annoKnowledge.captains.find(c=>c.targets.length&&c.effects.length);assert(captain);
 w.eval('saveInsightsState.live.snapshot.owned_items='+JSON.stringify([{kind:'Specialist',guid:fertility.guid,state:'assigned',source:'island'},{kind:'Captains',guid:captain.guid,state:'stored',source:'global'}]));
 assert.match(w.savedBuildSuggestions(factory,area.area_key),/Already assigned.*Adds/);
 assert.match(w.savedImportCaptains(),/Captains to consider/);
 w.eval('saveInsightsState.live.join.matched=false');assert.equal(w.savedArea(area.area_key),null);assert.equal(w.savedRoutesTo(guid,area.area_key).length,0);assert.equal(w.savedProductContext(guid,area.area_key),'');assert(w.savedArea(area.area_key,false));
 w.nav('insights');w.setSavedTab('routes');assert(w.document.body.textContent.includes('Actual Cheese <route>'));assert(!w.document.querySelector('route'));
 w.eval('saveInsightsState.live.join.matched=true');w.nav('routes');assert(w.document.body.textContent.includes('In-game routes (1)'));assert(w.document.querySelector('.saved-observed-route'));w.eval('saveInsightsState.live.use_saves=false');assert(!w.savedContextAllowed());assert.equal(w.savedProductContext(guid,area.area_key),'');w.nav('routes');assert(!w.document.querySelector('.saved-observed-route'));
 w.receiveSnapshot({...demo,synthetic:false},'demo');assert.equal(w.savedSnapshot(),null);assert(!w.savedArea(area.area_key));
 console.log('PASS: Save Insights demo, tabs, stock detail, saved needs, observed routes, escaped names, campaign-gated overlays, and Demo/Live isolation');
}finally{w.close();}
