const fs=require('fs'),assert=require('assert/strict'),{JSDOM}=require('jsdom');
const root='android-probe/app/src/main/assets/dashboard/',read=n=>fs.readFileSync(root+n,'utf8');
const data=n=>JSON.parse(read(n).split('=').slice(1).join('=').trim().replace(/;$/,''));
const K=data('knowledge.js'),AR=data('advisor-data.js'),AM=require('./'+root+'advisor-model.js'),CM=require('./'+root+'catalogue-chain-model.js'),SM=require('./'+root+'specialist-model.js'),SH=require('./'+root+'shipping-model.js'),Campaign=require('./'+root+'campaign-model.js');
const near=(a,b)=>assert(Math.abs(a-b)<1e-6,`${a} != ${b}`);
let fuel=0;
for(const f of K.factories.filter(f=>f.needs_fuel&&f.fuel_product_guid)){
 for(const productivity of [50,100,175]){
  const options={baseProductivity:productivity,count:3},a=AM.scenario(f,f.outputs[0].product_guid,AR,options,'nominal');
  const main=(f.inputs||[]).filter(i=>i.product_guid===f.fuel_product_guid).reduce((s,i)=>s+a.cycles*i.amount_per_cycle,0);
  near(a.inputs.find(i=>i.guid===f.fuel_product_guid).rate,main+f.fuel_amount_per_minute_100pct*productivity/100*3);
  const state={factory:f.factory_guid,region:f.regions[0],modifiers:{},choices:{},productivity:{},defaultProductivity:productivity,season:'nominal',patron:0,belief:0};
  const c=CM.unit(f,f.outputs[0].product_guid,state,AR,AM),single=AM.scenario(f,f.outputs[0].product_guid,AR,{baseProductivity:productivity},'nominal');
  near(c.inputs.find(i=>i.good===f.fuel_product_guid).rate,single.inputs.find(i=>i.guid===f.fuel_product_guid).rate);
 }fuel++;
}
assert(fuel>=41);
assert.notEqual(Campaign.identity({session_name:'Marcus'}, {campaign_fingerprint:'A'},false),Campaign.identity({session_name:'Marcus'}, {campaign_fingerprint:'B'},false));
assert.notEqual(Campaign.identity({pipe_session_id:'A'},null,false),Campaign.identity({pipe_session_id:'B'},null,false));
const allocation=SM.allocate([{guid:7,instance_id:'only',state:'stored',area_key:'A'}],[{guid:7,area:'A'},{guid:7,area:'B'},{guid:7,area:'A'}]);
assert.equal(allocation.allocations.length,1);assert.equal(allocation.missing.length,1);
assert.equal(SM.allocate([{guid:7,state:'assigned',area_key:'A'}],[{guid:7,area:'B'}]).allocations.length,0);
assert.equal(SH.fleet({interval:10,travel:12,loading:2}).requiredShips,3);
assert.equal(SH.fleet({interval:10,travel:2,loading:2,cycle:35}).requiredShips,4);
const dom=new JSDOM(read('index.html'),{url:'http://localhost',runScripts:'dangerously'}),w=dom.window,errors=[];
w.addEventListener('error',e=>errors.push(e.error));w.scrollTo=()=>{};w.Native={ready(){},secure(){}};
for(const m of read('index.html').matchAll(/<script src="([^"]+)"/g)){if(['browser.js','updates.js'].includes(m[1]))continue;const s=w.document.createElement('script');s.textContent=read(m[1]);w.document.body.appendChild(s);}
try{
 w.receiveSnapshot(JSON.parse(read('demo.json')),'demo');
 assert(w.advisorSaved().empire.treasury>0);assert(w.advisorSaved().progression.research_queue.length);
 w.nav('needs');w.eval("needsIsland='1:1:1';needsTier='Plebeians';needsQuery='test';closedNeedCards.add('test')");
 const state=w.eval('PageState.capture()');w.eval("needsIsland='all';needsTier='all';needsQuery='';closedNeedCards.clear()");
 w.eval('PageState').restore(state);assert.equal(w.eval('needsQuery'),'test');assert(w.eval("closedNeedCards.has('test')"));
 w.nav('chains');const f=K.factories.find(f=>f.factory_name==='Wheat Farm'),s=w.ccState(f.factory_guid,'Latium');s.modifiers[f.factory_guid]={water:true};w.eval('ScenarioStore').save(s);
 w.eval('ccStates.clear()');assert(w.ccState(f.factory_guid,'Latium').modifiers[f.factory_guid].water);
 const store=w.eval('ScenarioStore');assert.deepEqual(Object.keys(store.read(s.key,'other-campaign')),[]);

 const originalAreas=w.islandAreas,fixture=JSON.parse(JSON.stringify(originalAreas()[0]));
 const oat=K.factories.find(f=>f.factory_name==='Oat Farm'&&f.regions.includes(fixture.region));assert(oat);
 const good=oat.outputs[0].product_guid;fixture.entries=[{guid:good,production:2,consumption:1,delta:1}];
 fixture.saved.production_context.instances=[{id:'paused',guid:oat.factory_guid,productivity:0,module_ids:[],water_source_id:null}];
 fixture.saved.fertilities.push({guid:oat.fertility_guid});w.islandAreas=()=>[fixture];
 for(const productivity of [0,null]){fixture.saved.production_context.instances[0].productivity=productivity;const input=w.provinceBuildInput('empire');const provider=input.providers.find(p=>p.good===good);assert.equal(provider.countKnown,false);near(provider.phases[0].rate,2);assert(input.candidates.filter(p=>p.factory===oat.factory_guid).every(p=>p.idleCount===0));}
 fixture.saved.production_context.instances[0].productivity=0;fixture.entries[0].production=0;
 const stopped=w.provinceBuildInput('empire');assert(stopped.providers.find(p=>p.good===good).countKnown);assert(stopped.candidates.some(p=>p.factory===oat.factory_guid&&p.idleCount===1));w.islandAreas=originalAreas;
 const PM=w.ProvinceModel,area={key:'A',entries:[{guid:1,production:0,consumption:2}],goods:{1:{stock:100,capacity:1000}}},candidate=(id,upkeep,workforce)=>({id,area:'A',good:1,factory:1,ownedCount:0,countKnown:true,nominal:{upkeep,workforce},phases:[{name:'Steady',minutes:300,rate:2,inputs:[]}]});
 const base={areas:[area],scopeKeys:['A'],providers:[],candidates:[candidate('cheap',1,100),candidate('few-workers',100,1)]};
 assert(PM.optimize(base,{objective:'upkeep'}).policies.some(p=>p.id==='new:cheap'));
 assert(PM.optimize(base,{objective:'workforce'}).policies.some(p=>p.id==='new:few-workers'));
 w.nav('readiness');assert(w.document.querySelector('.cap-permits'));assert(w.document.querySelector('.cap-tech'));
 const report=w.reportReadModel();assert.equal(report.schema,1);assert(report.sections.some(s=>s.title==='Population by tier'));assert(w.reportModelHtml(report).includes('report-good'));
 for(const lang of ['de','fr','it','es','ja','ko','pl','pt-BR','ru','zh-CN','zh-TW'])for(const key of ['choose different save','dispatch interval','build readiness','temporary scenario'])assert(w.annoUI[lang][key],`${lang}: ${key}`);
 assert.deepEqual(errors,[]);console.log(`PASS: ${fuel} fuel factories, multi-count parity, campaign isolation, copy allocation, fleet, page history, drafts, coherent Demo, report and 11 locale dictionaries.`);
}finally{dom.window.close();}
