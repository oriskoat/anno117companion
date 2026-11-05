/* Browser transport adapter. The Android app supplies its own Native interface. */
if (!window.Native) {
  window.isBrowserClient=true;
  (() => {
    let poll=null,controller=null,generation=0,demo=true,token='',address=location.origin,received=false,accessShown=false;
    const storage={get(k){try{return localStorage.getItem(k)}catch{return null}},set(k,v){try{localStorage.setItem(k,v)}catch{}},remove(k){try{localStorage.removeItem(k)}catch{}}};
    token=storage.get('anno.pairing')||'';
    const fragment=new URLSearchParams(location.hash.slice(1));let enrollment='';
    window.saveInsightsLanding=fragment.get('insights')==='1';
    window.desktopMode=fragment.get('desktop')==='1';
    if(fragment.has('pair')){const supplied=fragment.get('pair').toUpperCase();if(/^\d{6}$/.test(supplied))enrollment=supplied;else token=supplied;if(!window.desktopMode||storage.get('anno.demo')===null)storage.set('anno.demo',fragment.has('sample')?'true':'false');history.replaceState(null,'',location.pathname);}
    demo=storage.get('anno.demo')!=='false';
    function cancel(){generation++;if(poll)clearTimeout(poll);if(controller)controller.abort();}
    async function receive(id){
      controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),8000);
      try{
        const response=await fetch('/v1/snapshot',{headers:{Authorization:'Bearer '+token},signal:controller.signal,cache:'no-store'});
        if(response.status===401){if(id!==generation||demo)return;cancel();token='';storage.remove('anno.pairing');window.modeChanged(false,address,false);accessIssue('pairing','Code incorrect or expired. Check the PC window.');return;}
        if(!response.ok)throw new Error('Bridge returned HTTP '+response.status);
        const result=await response.json();if(id!==generation||demo)return;
        received=true;accessShown=false;storage.set('anno.pairing',token);window.receiveSnapshot(result,'live');window.liveAccessRecovered?.();
      }catch(error){if(id===generation&&!demo){const message='Bridge unavailable · showing the previous snapshot';window.connectionNotice(message);if(!received&&!accessShown){accessShown=true;accessIssue('offline',message);}}}
      finally{clearTimeout(timeout);if(id===generation&&!demo&&!document.hidden)poll=setTimeout(()=>receive(id),5000);}
    }
    function accessIssue(kind,message){if(window.liveAccessIssue)window.liveAccessIssue(kind,message);else{window.connectionNotice(message);window.openSettings();window.settingsError(message);}}
    async function load(){
      cancel();received=false;accessShown=false;const id=generation;storage.set('anno.demo',String(demo));window.modeChanged(demo,address,!!token);
      if(demo){try{const response=await fetch('demo.json',{cache:'no-store'});const data=await response.json();if(id===generation)window.receiveSnapshot(data,'demo');}catch{window.connectionNotice('Recorded session could not be loaded. Keep the PC server running.');}}
      else if(enrollment){const code=enrollment;enrollment='';await exchange(code);}
      else if(!token){accessIssue('pairing','Pair your PC bridge to receive live data');}
      else receive(id);
    }
    async function exchange(code){
      try{const response=await fetch('/v1/pair',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code})});const data=await response.json();if(!response.ok)throw new Error(data.error||'Pairing failed');token=data.device_token;storage.set('anno.pairing',token);demo=false;window.closeSheet();load();}
      catch(error){window.connectionNotice(error.message);window.openSettings();window.settingsError(error.message);}
    }
    window.Native={
      refreshSnapshot(){if(!demo&&token){cancel();receive(generation);}},
      async saveInsights(body){
        const response=await fetch('/v1/save-insights',{method:body?'POST':'GET',headers:{Authorization:'Bearer '+token,...(body?{'Content-Type':'application/json'}:{})},cache:'no-store',...(body?{body:JSON.stringify(body)}:{})});
        return {status:response.status,document:await response.json()};
      },
      async tradeRoutes(context,body){
        const response=await fetch('/v1/trade-routes?context='+encodeURIComponent(context),{method:body?'PUT':'GET',headers:{Authorization:'Bearer '+token,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
        return {status:response.status,document:await response.json()};
      },
      async exportReport(payload){
        const response=await fetch('/v1/report',{method:'POST',headers:{'Content-Type':'application/json',...(demo?{}:{Authorization:'Bearer '+token})},body:JSON.stringify(payload)});
        if(!response.ok){if(response.status===401)accessIssue('pairing','Pair your PC bridge to receive live data');throw new Error('PDF export HTTP '+response.status);}
        const url=URL.createObjectURL(await response.blob()),link=document.createElement('a');link.href=url;link.download='Anno117-Empire-Summary.pdf';document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
      },
      ready:load,
      useDemo(value){demo=!!value;load();},
      secure(){},
      connect(host,code){
        // Browser requests stay same-origin. Users open the correct PC address first.
        let selected;try{selected=new URL(host.startsWith('http://')?host:'http://'+host);if(selected.origin!==location.origin)throw new Error();}catch{window.settingsError('Open '+host+' in this browser first, then pair on that page.');return;}
        const next=code.trim().replace(/ /g,'').toUpperCase()||token;
        if(!next){window.settingsError('Enter the pairing code shown in the Windows app');return;}
        if(/^\d{6}$/.test(next)){exchange(next);return;}
        token=next;demo=false;window.closeSheet();load();
      },
      forget(){cancel();token='';storage.remove('anno.pairing');demo=true;window.closeSheet();load();}
    };
    document.addEventListener('visibilitychange',()=>{if(document.hidden){if(poll)clearTimeout(poll);}else if(!demo&&token){cancel();receive(generation);}});
    window.addEventListener('pagehide',cancel);
  })();
}
