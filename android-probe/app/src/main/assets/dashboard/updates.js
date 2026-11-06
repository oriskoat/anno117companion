/* Native installers own downloading and verification; web clients follow the PC. */
let appUpdateState={status:'idle',current:''},appUpdateBusy=false,appUpdateStarted=false;
let appUpdateExpanded=false;
const updateMessages={idle:'Check for updates',checking:'Checking for updates…',downloading:'Downloading update…',current:'You are up to date.',available:'Update available',ready:'Update ready',restarting:'Restarting to update…',unpublished:'No published release yet.',offline:'Update check unavailable. Try again later.',incomplete:'Release files are not ready yet.',failed:'Update verification failed. Please try again.'};
function hasNativeUpdater(){return !!(window.desktopMode||window.Native?.checkUpdate);}
function updatePanelDetailsHtml(){
 if(!hasNativeUpdater())return `<div class="detail-title">Updates</div><p class="small-note">This browser updates with the PC Companion.</p>`;
 const s=appUpdateState,status=updateMessages[s.status]||updateMessages.offline;
 return `<div class="section-title"><h2>Updates</h2><span class="badge">${esc(s.current||'')}${s.latest&&s.latest!==s.current?' → '+esc(s.latest):''}</span></div><p class="small-note" role="status">${esc(status)}</p><p class="small-note">Checks GitHub for new releases. Updates keep your saved pairing.</p><div class="update-actions"><button class="secondary" onclick="callAppUpdate('check')" ${appUpdateBusy?'disabled':''}>Check for updates</button>${s.status==='available'||s.status==='failed'?`<button class="primary" onclick="callAppUpdate('download')" ${appUpdateBusy?'disabled':''}>Download update</button>`:''}${s.status==='ready'?`<button class="primary" onclick="callAppUpdate('install')">${window.desktopMode?'Restart and update':'Install update'}</button>`:''}</div>`;
}
function updatePanelHtml(){const s=appUpdateState,status=hasNativeUpdater()?(updateMessages[s.status]||updateMessages.offline):'This browser updates with the PC Companion.';return `<details class="update-details" ${appUpdateExpanded?'open':''} ontoggle="if(this.isConnected)appUpdateExpanded=this.open"><summary><b>Updates</b><span class="update-brief">${esc(status)}</span>${s.current?`<span class="badge">${esc(s.current)}</span>`:''}${svg('chevron')}</summary><div class="update-expanded">${updatePanelDetailsHtml()}</div></details>`;}
function openUpdateSettings(){appUpdateExpanded=true;nav('more');$('appUpdatePanel')?.scrollIntoView?.({block:'center'});}

function paintAppUpdate(){
 const panel=$('appUpdatePanel');if(panel){const details=panel.querySelector('.update-details');if(details)appUpdateExpanded=details.open;panel.innerHTML=updatePanelHtml();window.localizeUI?.(panel);}
 let banner=$('appUpdateBanner');const visible=['available','ready'].includes(appUpdateState.status);
 if(!banner&&visible){banner=document.createElement('aside');banner.id='appUpdateBanner';banner.className='notice app-update-banner';document.querySelector('.source-bar').after(banner);}
 if(banner){banner.hidden=!visible;if(visible){banner.innerHTML=`${svg('info')}<span>${esc(updateMessages[appUpdateState.status])} · ${esc(appUpdateState.latest||'')}</span><button class="inline-link" onclick="openUpdateSettings()">Updates ${svg('chevron')}</button>`;window.localizeUI?.(banner);}}
}
window.receiveAppUpdate=function(state){appUpdateBusy=false;appUpdateState=state;paintAppUpdate();};
async function callAppUpdate(action,automatic=false){
 if(appUpdateBusy)return;appUpdateBusy=true;appUpdateState={...appUpdateState,status:action==='download'?'downloading':action==='install'?'restarting':'checking'};paintAppUpdate();
 try{
  if(window.desktopMode){const api=window.pywebview?.api;if(!api)throw new Error('Desktop API not ready');const result=action==='check'?await api.check_update(!automatic):action==='download'?await api.download_update():await api.install_update();window.receiveAppUpdate(result);}
  else if(window.Native?.checkUpdate){if(action==='check')window.Native.checkUpdate(!automatic);else if(action==='download')window.Native.downloadUpdate();else{window.Native.installUpdate();appUpdateBusy=false;appUpdateState.status='ready';paintAppUpdate();}}
  else throw new Error('Native update API unavailable');
 }catch(error){console.error(error);window.receiveAppUpdate({...appUpdateState,status:'offline'});}
}
function startAppUpdateCheck(){if(appUpdateStarted||!hasNativeUpdater())return;if(window.desktopMode&&!window.pywebview?.api)return;appUpdateStarted=true;callAppUpdate('check',true);}
window.addEventListener('pywebviewready',startAppUpdateCheck);
startAppUpdateCheck();
