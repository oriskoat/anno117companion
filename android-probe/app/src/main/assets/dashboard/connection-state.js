'use strict';
window.liveAccessIssue=function(kind,message){
 window.connectionNotice(message);
 if(window.desktopMode){window.connectionNotice('Start the local server in the top bar.');return;}
 // Open once. Background polling must not replace a code the user is typing.
 if($('liveAccessBanner')?.dataset.issue===kind)return;
 window.closeSheet();window.openSettings();
 const banner=document.createElement('div');banner.id='liveAccessBanner';banner.dataset.issue=kind;banner.className='live-access-banner';
 banner.innerHTML=`<h3>${kind==='pairing'?'Pair this device':'PC bridge is unavailable'}</h3><p>${kind==='pairing'?'Enter the six-digit code from the Windows Companion.':'Check the PC server and local network. Your saved pairing is kept.'}</p>`;
 $('sheetBody').insertBefore(banner,$('sheetBody').firstChild);
 if(kind==='pairing')$('pairingCode')?.focus({preventScroll:true});
 window.localizeUI?.($('sheetBody'));
};
window.liveAccessRecovered=function(){if($('liveAccessBanner')?.dataset.issue==='offline')window.closeSheet();};
