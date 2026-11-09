/* Canonical unit input recipe. Extra outputs do not consume additional inputs. */
(function(root){'use strict';
function inputs(factory,cycles,speed){const rows=new Map();
 const add=(guid,rate,fuel=false)=>{if(!(rate>=0&&Number.isFinite(rate)))throw Error('Invalid unit input');const row=rows.get(guid)||{guid,rate:0,fuel:false};row.rate+=rate;row.fuel=row.fuel||fuel;rows.set(guid,row);};
 for(const item of factory.inputs||[])add(item.product_guid,cycles*item.amount_per_cycle);
 if(factory.needs_fuel&&factory.fuel_product_guid&&Number.isFinite(factory.fuel_amount_per_minute_100pct))add(factory.fuel_product_guid,factory.fuel_amount_per_minute_100pct*speed,true);
 return [...rows.values()];
}
const api={inputs};root.ProductionModel=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
