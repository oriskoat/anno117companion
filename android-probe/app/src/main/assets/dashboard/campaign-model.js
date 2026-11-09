/* One campaign key for routes, observations, history and scenario drafts. */
(function(root){'use strict';
function identity(snapshot,saved,demo){
 if(demo)return 'demo:'+String(snapshot?.session_name||'Example Empire').slice(0,200);
 const fingerprint=snapshot?.save_source?.campaign_fingerprint||saved?.campaign_fingerprint;
 if(fingerprint)return 'live:save:'+String(fingerprint).slice(0,180);
 if(snapshot?.pipe_session_id)return 'live:pipe:'+String(snapshot.pipe_session_id).slice(0,180);
 return 'live:unverified:'+String(snapshot?.session_name||'unassigned').slice(0,180);
}
function legacy(snapshot,demo){return (demo?'demo:':'live:')+String(snapshot?.session_name||'unassigned').slice(0,230);}
const api={identity,legacy};root.CampaignModel=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
