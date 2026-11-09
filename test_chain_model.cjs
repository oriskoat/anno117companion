const assert=require('node:assert/strict'),root='./android-probe/app/src/main/assets/dashboard/';
require(root+'island-model.js');require(root+'advisor-model.js');const CM=require(root+'chain-model.js'),PM=require(root+'province-model.js');
const near=(a,b)=>assert(Math.abs(a-b)<1e-5,`${a} != ${b}`);
const makeArea=(rows,stocks={})=>({key:'A',name:'Island',entries:rows.map(([guid,production,consumption])=>({guid,production,consumption})),goods:Object.fromEntries([1,2,3].map(g=>[g,{stock:stocks[g]??100,capacity:1000,normalCapacity:1000}]))});
const make=(id,good,rate,count,inputs=[])=>({id,area:'A',good,factory:100+good,ownedCount:count,countKnown:true,inputTrusted:true,phases:[{guid:0,name:'Steady',minutes:300,rate,inputs}]});
let input={areas:[makeArea([[1,4,0],[2,4,4]])],scopeKeys:['A'],providers:[make('spinner',1,2,2,[{good:2,rate:2}]),make('hemp',2,2,2)],candidates:[]};
let result=PM.optimize(input);assert(result.converged);near(result.demands.find(d=>d.good===2).rate,0);assert.equal(result.operatingChanges.find(p=>p.profile==='hemp').pause,2);assert.equal(result.operatingChanges.find(p=>p.profile==='spinner').pause,2);
input.areas=[makeArea([[1,4,0],[2,4,6]])];result=PM.optimize(input);near(result.demands.find(d=>d.good===2).rate,2);assert.equal(result.operatingChanges.find(p=>p.profile==='hemp').keep,1);
input.providers[0].inputTrusted=false;result=PM.optimize(input);near(result.demands.find(d=>d.good===2).rate,6);assert.equal(result.accounting.credited.length,0);
// A seasonal raw material must actually exist when a downstream factory needs it.
const raw={...make('reeds',2,4,2),startIndex:1,firstRemaining:120,phases:[{name:'Dry',guid:1,minutes:180,rate:4,inputs:[]},{name:'Flood',guid:2,minutes:120,rate:.5,inputs:[]}]};
input={areas:[makeArea([[1,3,3],[2,1,3]],{1:0,2:10})],scopeKeys:['A'],providers:[raw,make('processor',1,3,1,[{good:2,rate:3}])],candidates:[]};result=PM.optimize(input);assert(result.coupled.inputShortages.some(i=>i.good===2));assert(result.coupled.producers.find(p=>p.profile==='processor').blockedMinutes>0);assert(result.coupled.unmet>0);
input.areas[0].goods[2].stock=500;result=PM.optimize(input);assert(!result.coupled.inputShortages.length);
// Do not subtract baseline inputs for unverified protected exports.
input.protectedGoods=[1];result=PM.optimize(input);assert.equal(result.accounting.credited.length,0);
// Full destination: undelivered cargo stays aboard, not discarded.
input={areas:[{key:'A',name:'A',entries:[{guid:1,production:10,consumption:0}],goods:{1:{stock:100,capacity:1000}}},{key:'B',name:'B',entries:[{guid:1,production:0,consumption:1}],goods:{1:{stock:10,capacity:10}}}],scopeKeys:['A','B'],providers:[{...make('source',1,10,1),inputTrusted:false}],candidates:[]};result=PM.optimize(input,{interval:30,travel:2,horizon:40});near(result.coupled.loaded-result.coupled.delivered,result.coupled.inTransit);assert(result.coupled.inTransit>0);
// Current/forecast recipe mismatch is kept explicit, not converted into negative demand.
input={areas:[makeArea([[1,4,1],[2,4,1]])],scopeKeys:['A'],providers:[make('mismatch',1,2,2,[{good:2,rate:2}])],candidates:[]};result=PM.optimize(input);assert(result.accounting.issues.length);near(result.demands.find(d=>d.good===2).rate,1);
// Losing optional module feed removes its bonus; base production can continue.
input={areas:[makeArea([[1,0,2]],{1:0,2:0})],scopeKeys:['A'],providers:[],candidates:[{...make('module-new',1,2,0),support:[{good:2,rate:.2}],phases:[{name:'Steady',guid:0,minutes:300,rate:2,withoutModuleRate:1,inputs:[],withoutModuleInputs:[]}]}]};result=PM.optimize(input);assert(result.coupled.inputShortages.some(i=>i.optional));assert(result.coupled.unmet>0&&result.coupled.unmet<599);
console.log('PASS: downstream reductions propagate upstream, other consumers preserved, seasonal input starvation, startup reserve, protected exports, cargo conservation, uncertain accounting.');
