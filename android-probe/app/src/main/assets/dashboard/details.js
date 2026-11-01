'use strict';
// Keep every detail route escapable, even after scrolling a long product page.
const detailHistory=[];
let detailOrigin=null;
const originalSheet=sheet;
function captureDetail(){return {html:$('sheetBody').innerHTML,scroll:document.querySelector('.sheet').scrollTop,fields:[...$('sheetBody').querySelectorAll('input,select,textarea')].map(e=>({value:e.value,checked:e.checked})),planner:typeof planner==='undefined'?null:JSON.parse(JSON.stringify(planner))};}
function updateDetailToolbar(){const back=$('detailBack');back.hidden=!detailHistory.length;$('detailLabel').textContent=detailHistory.length?'DETAILS · '+(detailHistory.length+1):'DETAILS';}
sheet=function(html){
 if(!$('overlay').hidden){detailHistory.push(captureDetail());if(detailHistory.length>20)detailHistory.shift();}
 else{detailHistory.length=0;detailOrigin=document.activeElement;}
 const quoteId=K.quote_ids[(Math.floor(Date.now()/120000)+detailHistory.length*17+html.length)%K.quote_ids.length];
 const quote=quoteId?'<blockquote class="detail-game-quote" translate="no">'+esc(K.quotes[appLanguage]?.[quoteId]||K.quotes.en[quoteId])+'</blockquote>':'';
 originalSheet(html+quote);document.body.classList.add('detail-open');
 if(window.innerWidth>=1000){document.body.style.overflow='';document.querySelector('.sheet').setAttribute('aria-modal','false');}
 updateDetailToolbar();$('detailClose').focus({preventScroll:true});
};
const originalCloseSheet=window.closeSheet;
window.closeSheet=function(){originalCloseSheet();document.body.classList.remove('detail-open');detailHistory.length=0;const origin=detailOrigin;detailOrigin=null;if(origin?.isConnected)origin.focus({preventScroll:true});};
const detailNav=nav;
nav=function(page){if(!$('overlay').hidden)window.closeSheet();detailNav(page);};
window.backDetails=function(){
 const state=detailHistory.pop();if(!state){window.closeSheet();return;}
 $('sheetBody').innerHTML=state.html;
 [...$('sheetBody').querySelectorAll('input,select,textarea')].forEach((e,i)=>{if(state.fields[i]){e.value=state.fields[i].value;e.checked=state.fields[i].checked;}});
 if(state.planner&&typeof planner!=='undefined')planner=state.planner;
 updateDetailToolbar();document.querySelector('.sheet').scrollTop=state.scroll;
 ($('detailBack').hidden?$('detailClose'):$('detailBack')).focus({preventScroll:true});
};
document.addEventListener('keydown',event=>{
 if($('overlay').hidden)return;
 if(event.key==='Escape'){event.preventDefault();window.closeSheet();return;}
 if(event.altKey&&event.key==='ArrowLeft'){event.preventDefault();window.backDetails();return;}
 if(event.key!=='Tab'||window.innerWidth>=1000)return;
 const focusable=[...document.querySelector('.sheet').querySelectorAll('button,a[href],input,select,textarea,summary,[tabindex="0"]')].filter(e=>!e.disabled&&!e.closest('[hidden]')&&(!e.closest('details:not([open])')||e.tagName==='SUMMARY'));
 const first=focusable[0],last=focusable[focusable.length-1];
 if(event.shiftKey&&(document.activeElement===first||!focusable.includes(document.activeElement))){event.preventDefault();last?.focus();}
 else if(!event.shiftKey&&(document.activeElement===last||!focusable.includes(document.activeElement))){event.preventDefault();first?.focus();}
});
