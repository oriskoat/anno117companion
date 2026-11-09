/* A concrete item copy may support one island allocation, never two at once. */
(function(root){'use strict';
function allocate(items,requests){const available=items.map((item,i)=>({...item,copy:item.instance_id||item.id||String(i)})),used=new Set(),allocations=[],missing=[];
 const unique=[...new Map(requests.map(r=>[r.guid+'|'+r.area,r])).values()].sort((a,b)=>a.guid-b.guid||a.area.localeCompare(b.area));
 for(const request of unique){const copy=available.find(i=>i.guid===request.guid&&!used.has(i.copy)&&i.state==='assigned'&&i.area_key===request.area)||available.find(i=>i.guid===request.guid&&!used.has(i.copy)&&i.state==='stored');
  if(copy){used.add(copy.copy);allocations.push({...request,copy:copy.copy,location:copy.area_key||'global',assigned:copy.state==='assigned'});}else missing.push({...request,reason:'Acquire or free another copy; an assigned copy on another island is not reused.'});
 }
 return {allocations,missing,requested:unique.length};
}
const api={allocate};root.SpecialistModel=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
