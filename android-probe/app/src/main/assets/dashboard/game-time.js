(function(root){'use strict';
function format(minutes,language='en'){if(!Number.isFinite(minutes))return 'Unknown';const total=Math.max(0,Math.round(minutes*60)),hours=Math.floor(total/3600),mins=Math.floor(total%3600/60),secs=total%60,lang=language.split('-')[0],units={en:['h','min','sec'],de:['Std.','Min.','Sek.'],fr:['h','min','s'],it:['h','min','s'],es:['h','min','s'],pl:['godz.','min','s'],pt:['h','min','s'],ru:['ч','мин','с'],ja:['時間','分','秒'],ko:['시간','분','초'],zh:['时','分','秒'],hu:['óra','perc','másodperc']}[lang]||['h','min','sec'];return [hours?hours+' '+units[0]:'',hours||mins?mins+' '+units[1]:'',secs+' '+units[2]].filter(Boolean).join(' ');}
root.GameTime={format};if(typeof module!=='undefined')module.exports=root.GameTime;
})(typeof window!=='undefined'?window:globalThis);
function gameDuration(minutes){return GameTime.format(minutes,typeof appLanguage==='string'?appLanguage:'en');}
