'use strict';
window.setDataMode=function(demo){window.closeSheet();native('useDemo',demo);};
function updateModeSwitch(){for(const b of document.querySelectorAll('[data-demo-mode]')){const selected=(b.dataset.demoMode==='true')===isDemo;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected));}}
const modeUpdateSource=updateSource;
updateSource=function(){modeUpdateSource();updateModeSwitch();};
updateModeSwitch();
