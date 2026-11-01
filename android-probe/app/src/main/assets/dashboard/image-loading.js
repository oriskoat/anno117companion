'use strict';
const failedImages=new Set(),imageTimers=new Set();
let imageDisposed=false;
function imageFailureStatus(){
 for(const img of failedImages)if(!img.isConnected)failedImages.delete(img);
 let banner=$('imageLoadStatus');
 if(!failedImages.size){if(banner)banner.hidden=true;return;}
 if(!banner){banner=document.createElement('div');banner.id='imageLoadStatus';banner.className='image-load-status';banner.setAttribute('role','status');$('main').before(banner);}
 banner.hidden=false;banner.innerHTML=`<span>Some images could not be loaded.</span><button onclick="retryImages()">Retry images</button>`;
 window.localizeUI?.(banner);
}
function scheduleImageRetry(img,delay){
 const timer=setTimeout(()=>{imageTimers.delete(timer);if(!imageDisposed&&img.isConnected){img.removeAttribute('src');img.src=img.dataset.originalImage;}},delay);imageTimers.add(timer);
}
document.addEventListener('error',event=>{
 const img=event.target;if(!(img instanceof HTMLImageElement)||img.id==='desktopQR'||img.dataset.imageFallback==='true')return;
 if(!img.dataset.originalImage)img.dataset.originalImage=img.getAttribute('src');
 const attempts=Number(img.dataset.imageAttempts||0);
 if(attempts<2){img.dataset.imageAttempts=String(attempts+1);scheduleImageRetry(img,(attempts+1)*700);return;}
 failedImages.add(img);img.dataset.originalAlt=img.getAttribute('alt')||'';img.dataset.originalTitle=img.getAttribute('title')||'';img.dataset.imageFallback='true';img.classList.add('image-unavailable');img.alt='Image unavailable';img.title='Image unavailable';img.src='emblem.svg';imageFailureStatus();
},true);
document.addEventListener('load',event=>{
 const img=event.target;if(!(img instanceof HTMLImageElement)||img.dataset.imageFallback==='true')return;
 if(img.classList.contains('image-unavailable')){img.alt=img.dataset.originalAlt||'';if(img.dataset.originalTitle)img.title=img.dataset.originalTitle;else img.removeAttribute('title');}
 failedImages.delete(img);img.classList.remove('image-unavailable');delete img.dataset.imageAttempts;imageFailureStatus();
},true);
window.retryImages=function(){
 for(const img of [...failedImages]){
  if(!img.isConnected){failedImages.delete(img);continue;}
  img.dataset.imageFallback='false';img.dataset.imageAttempts='0';img.removeAttribute('src');img.src=img.dataset.originalImage;
 }
};
window.addEventListener('online',()=>window.retryImages());
document.addEventListener('visibilitychange',()=>{if(!document.hidden)window.retryImages();});
window.addEventListener('pagehide',()=>{imageDisposed=true;for(const timer of imageTimers)clearTimeout(timer);imageTimers.clear();});
