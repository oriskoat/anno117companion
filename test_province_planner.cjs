const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'android-probe/app/src/main/assets/dashboard');
require(root+'/island-model.js');require(root+'/advisor-model.js');const PM=require(root+'/province-model.js');
const near=(a,b)=>assert(Math.abs(a-b)<1e-5,`${a} != ${b}`);
const area=(key,rows,stock=1000)=>({key,name:key,region:'Aegyptus',entries:rows.map(([guid,production,consumption])=>({guid,production,consumption})),goods:Object.fromEntries([1,2,3].map(g=>[g,{stock,capacity:10000,normalCapacity:10000}]))});
const unit=(id,where,good,rate,count=1,inputs=[])=>({id,area:where,good,factory:good+100,ownedCount:count,countKnown:true,phases:[{name:'Steady',minutes:300,rate,inputs}]});
let input={areas:[area('A',[[1,6,2],[2,0,1]]),area('B',[[1,0,4],[2,0,1]])],scopeKeys:['A','B'],providers:[unit('a','A',1,3,2)],candidates:[unit('b','A',2,2,0)]};
let r=PM.optimize(input);assert(r.converged);near(r.flows.find(f=>f.good===1).rate,4);near(r.policies.filter(p=>p.good===1).reduce((s,p)=>s+p.allocated,0),6);assert.equal(r.summary.buildingsToBuild,1);assert(r.manifests.some(m=>m.cargo.length===2));assert.equal(r.summary.retirementCandidates,0);
// Spare supply is allocated once across destinations, with only the remaining deficit built.
input={areas:[area('A',[[1,5,1]]),area('B',[[1,0,4]]),area('C',[[1,0,4]])],scopeKeys:['A','B','C'],providers:[unit('a','A',1,5)],candidates:[unit('new','A',1,2,0)]};r=PM.optimize(input);near(r.policies.filter(p=>!p.newBuild).reduce((s,p)=>s+p.allocated,0),5);near(r.policies.find(p=>p.newBuild).allocated,4);assert.equal(r.summary.buildingsToBuild,2);
// Outside producers keep their own consumption and are never retired by a province plan.
input.scopeKeys=['B','C'];r=PM.optimize(input);near(r.flows.reduce((s,f)=>s+f.rate,0),4);near(r.missing.reduce((s,m)=>s+m.rate,0),4);assert.equal(r.actions.length,0);
// Existing industrial input demand is baseline; only genuinely added output adds inputs.
input={areas:[area('A',[[1,2,3],[2,5,2]])],scopeKeys:['A'],providers:[unit('a','A',1,2),unit('raw','A',2,5)],candidates:[unit('new','A',1,2,0,[{good:2,rate:2}])]};r=PM.optimize(input);assert(r.converged);near(r.demands.find(d=>d.good===2).rate,3);near(r.summary.additionalInputDemand,1);
// Recursive added inputs propagate upstream, without adding current consumption again.
input={areas:[area('A',[[1,0,2]])],scopeKeys:['A'],providers:[],candidates:[unit('final','A',1,2,0,[{good:2,rate:1}]),unit('middle','A',2,1,0,[{good:3,rate:.5}]),unit('raw','A',3,.5,0)]};r=PM.optimize(input);assert(r.converged);near(r.demands.find(d=>d.good===2).rate,1);near(r.demands.find(d=>d.good===3).rate,.5);assert.equal(r.summary.buildingsToBuild,3);
// A self-amplifying recipe cannot be presented as a completed plan.
input.candidates=[unit('cycle','A',1,1,0,[{good:1,rate:2}])];r=PM.optimize(input);assert.equal(r.converged,false);
// Seasonal output is conserved, exact phase alignment and reserves are retained.
const seasonal={...unit('seasons','A',1,1),phases:[{name:'Dry',minutes:180,rate:2},{name:'Flood',minutes:120,rate:.25}],startIndex:1,firstRemaining:30};
input={areas:[area('A',[[1,.25,1]],null)],scopeKeys:['A'],providers:[seasonal],candidates:[]};input.areas[0].goods[1].normalCapacity=20;r=PM.optimize(input);near(r.policies[0].design.reserve,95);assert.equal(r.projection.capacityIssues.length,1);assert(r.projection.unknownStocks>0);assert.equal(r.projection.goods[0].nodes[0].minimum,null);
// Protected exports cannot generate a removal instruction or donate unknown spare capacity.
input.areas=[area('A',[[1,5,1]]),area('B',[[1,0,1]])];input.scopeKeys=['A','B'];input.providers=[unit('a','A',1,5,3)];input.protectedGoods=[1];r=PM.optimize(input);assert(!r.flows.length);assert(r.actions.filter(a=>a.kind==='retirement_candidate').every(a=>a.protected));
// Idle capacity is restored before a new building is proposed.
input={areas:[area('A',[[1,0,3]])],scopeKeys:['A'],providers:[],candidates:[{...unit('idle','A',1,2,0),idleCount:1}]};r=PM.optimize(input);assert.equal(r.actions.find(a=>a.kind==='restore').count,1);assert.equal(r.actions.find(a=>a.kind==='build').count,1);
// Manifests preserve total quantities while respecting slots and grouping different goods.
const manifests=PM.routeManifests([{from:'A',to:'B',good:1,rate:9},{from:'A',to:'B',good:2,rate:4}],PM.normalizedSettings({interval:15,slots:2,slotCapacity:50}));
near(manifests.routes.flatMap(m=>m.cargo).reduce((s,c)=>s+c.amount,0),195);assert(manifests.routes.every(m=>m.cargo.reduce((s,c)=>s+Math.ceil(c.amount/m.slotCapacity-1e-9),0)<=2));

// Recommendations use actual retained counts, with one explicit forecast window.
input={areas:[area('A',[[1,12,7]])],scopeKeys:['A'],providers:[unit('group','A',1,2,6)],candidates:[]};r=PM.optimize(input,{horizon:600});assert.equal(r.operatingChanges.length,1);const op=r.operatingChanges[0];assert.equal(op.owned,6);assert.equal(op.keep,4);assert.equal(op.pause,2);near(op.phases[0].target,7);near(op.phases[0].utilization,.875);near(op.avoidedVolume,3000);near(op.plannedVolume,4200);
input.protectedGoods=[1];r=PM.optimize(input);assert.equal(r.operatingChanges.length,0);

// Use the real compiled catalog and explicit invented demo in the full UI.
const {JSDOM,VirtualConsole}=require('jsdom'),errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e));
const dom=new JSDOM(fs.readFileSync(root+'/index.html','utf8'),{runScripts:'dangerously',url:'http://localhost',virtualConsole:vc}),w=dom.window;
w.scrollTo=()=>{};w.Native={ready(){},secure(){}};
for(const name of [...w.document.querySelectorAll('script[src]')].map(s=>s.src.split('/').pop()).filter(n=>!['browser.js','desktop.js'].includes(n))){const el=w.document.createElement('script');el.textContent=fs.readFileSync(root+'/'+name,'utf8');w.document.body.appendChild(el);}
w.receiveSnapshot(JSON.parse(fs.readFileSync(root+'/demo.json','utf8')),'demo');w.nav('planner');assert(w.document.querySelector('.po-cta'));assert(w.document.querySelector('.po-empire'));
w.provinceInspectIslands();assert(w.document.querySelector('.ip-island-hero'));
w.eval("saveInsightsState.demoUse=true");
const fixture=w.provinceBuildInput('province');assert(fixture.scopeKeys.length>0);assert(fixture.candidates.every(p=>fixture.scopeKeys.includes(p.area)));const result=w.ProvinceModel.optimize(fixture);assert(result.converged);assert(result.summary.goods>0);
w.eval('provincePlanner.input=provinceBuildInput("province");provincePlanner.result=ProvinceModel.optimize(provincePlanner.input);');w.nav('optimizer');assert(w.document.querySelector('.g-plan-numbers'));assert(w.document.querySelectorAll('.po-good').length>0);assert(w.document.querySelector('.po-save'));
const panel=w.document.querySelector('.po-block');panel.open=true;const refreshed=JSON.parse(fs.readFileSync(root+'/demo.json','utf8'));w.receiveSnapshot(refreshed,'demo');assert.equal(w.document.querySelector('.po-block'),panel);assert(panel.open);w.render(true);assert(w.document.querySelector('.po-block').open);
const coverage=w.provinceGranaryEvidence({saved:{production_context:{instances:[{id:'farm',guid:151997,position:[3,9,4]}],effects:[{guid:158334,source_id:'granary',radius:5,position:[0,0,0]}]}}},2103);assert.equal(coverage.withinRadius,1);assert.equal(coverage.sourceCount,1);assert.equal(coverage.producerCount,1);

w.provinceSelectRegion('Latium');w.provinceInspectIslands();assert(!w.document.querySelector('.ip-overview').textContent.includes('Nile'));assert(w.document.querySelector('.ip-overview').textContent.includes('Goods near normal storage'));

(async()=>{w.provinceSelectRegion('Aegyptus');w.eval("provincePlanner.scope='province'");await w.provinceGenerate();assert(w.eval('provincePlanner.result.converged'));await w.provinceSaveRoutes();const routes=w.tradeState().doc.routes;assert(routes.length>0);assert(routes.every(r=>!w.tradeValidation(r)&&!w.tradeCapacity(r).overloaded));const count=routes.length;await w.provinceSaveRoutes();assert.equal(w.tradeState().doc.routes.length,count);w.tradeState().doc.revision++;await w.provinceSaveRoutes();assert(w.eval('provincePlanner.message').includes('another device'));assert.equal(w.tradeState().doc.routes.length,count);assert.deepEqual(errors,[]);dom.window.close();console.log('PASS: allocation, upstream inputs, seasonal reserves, restore-first, manifest conservation, province UI, idempotent saves and revision conflicts.');})().catch(e=>{dom.window.close();console.error(e);process.exitCode=1;});
