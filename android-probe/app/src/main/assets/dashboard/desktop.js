/* The desktop bar lives in the same window and DOM as the complete tool. */
if(window.desktopMode){
 document.body.classList.add('desktop-app');
 const bar=document.createElement('aside');bar.className='desktop-bar';bar.setAttribute('aria-label','PC server and device pairing');
 bar.innerHTML='<div class="desktop-server"><b>ANNO COMPANION</b><span id="desktopState">Starting local server…</span><small id="desktopGame">Checking game data…</small><div><button id="desktopToggle">Stop server</button><button id="desktopOpen">Open browser ↗</button></div></div><div class="desktop-pair"><span>CONNECT ANOTHER DEVICE</span><b id="desktopCode">••••••</b><small id="desktopAddress"></small></div><img id="desktopQR" alt="Scan to pair this device"><button class="desktop-collapse" aria-label="Collapse pairing bar">⌃</button>';
 document.body.insertBefore(bar,document.body.firstChild);
 const modeSwitch=document.getElementById('dataModeSwitch');if(modeSwitch)bar.querySelector('.desktop-server>div').appendChild(modeSwitch);
 let polling=null;
 function api(){return window.pywebview?.api;}
 function show(state){if(document.getElementById('desktopGame'))document.getElementById('desktopGame').textContent=state.game_label||'';document.getElementById('desktopState').textContent=state.running?'● Local server running':'○ Local server stopped';document.getElementById('desktopCode').textContent=state.code;document.getElementById('desktopAddress').textContent=state.address;document.getElementById('desktopQR').src=state.qr;document.getElementById('desktopToggle').textContent=state.running?'Stop server':'Start server';}
 async function refresh(){try{if(api())show(await api().desktop_state());}catch{document.getElementById('desktopState').textContent='Desktop connection unavailable';}}
 async function start(){await refresh();if(!polling)polling=setInterval(refresh,15000);}
 document.getElementById('desktopOpen').onclick=()=>api()?.open_browser();
 document.getElementById('desktopToggle').onclick=async()=>{const button=document.getElementById('desktopToggle');button.disabled=true;try{show(await api().toggle_server());}finally{button.disabled=false;}};
 bar.querySelector('.desktop-collapse').onclick=()=>{bar.classList.toggle('collapsed');document.body.classList.toggle('pairing-collapsed');};
 window.addEventListener('pywebviewready',start);if(api())start();window.addEventListener('pagehide',()=>clearInterval(polling));
}
