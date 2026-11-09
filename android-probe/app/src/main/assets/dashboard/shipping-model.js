(function(root){'use strict';
function fleet({interval,travel,loading=2,cycle=null}){if(!(interval>0&&travel>=0&&loading>=0))throw Error('Invalid shipping times');const minimum=2*travel+loading,roundTrip=Number.isFinite(cycle)&&cycle>0?Math.max(cycle,minimum):minimum;return {roundTrip,requiredShips:Math.max(1,Math.ceil(roundTrip/interval-1e-9)),minimumRoundTrip:minimum,feasibleWithOne:roundTrip<=interval+1e-9,timingSource:Number.isFinite(cycle)?'selected observed cycle bound':'manual travel/loading assumptions'};}
const api={fleet};root.ShippingModel=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
