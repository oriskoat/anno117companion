'use strict';
const localeNorm=s=>String(s).replace(/\s+/g,' ').trim().toLowerCase().replace(/\.$/,'');
const canonicalText=new WeakMap(),canonicalAttrs=new WeakMap();
function translateUI(text){
 text=window.annoUIAliases?.[localeNorm(text)]||text;
 const lang=appLanguage;if(lang==='en')return text;
 const own=window.annoUI?.[lang]||{},game=window.annoGameUI?.[lang]||{},key=localeNorm(text);
 if(own[key])return own[key];if(game[key])return game[key];
 // Compose labels containing numeric values and original game nouns. No HTML
 // or event attributes are rewritten; option values stay language-independent.
 const lexicon=localeLexicons[lang]||(localeLexicons[lang]={...game,...own});
 if(!localePatterns[lang]){
  const escaped=Object.keys(lexicon).filter(k=>k.length>1).sort((a,b)=>b.length-a.length).map(k=>k.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'));
  localePatterns[lang]=new RegExp('(?<![\\p{L}\\p{N}])('+escaped.join('|')+')(?![\\p{L}\\p{N}])','giu');
 }
 const pattern=localePatterns[lang];
 return String(text).replace(pattern,m=>lexicon[localeNorm(m)]||m).replace(/([.!?。！？])\./g,'$1');
}
const localePatterns={},localeLexicons={};
function localizeUI(root=document.body){
 if(!root||!window.annoUI)return;
 document.documentElement.lang=appLanguage;
 for(const option of root.querySelectorAll('option:not([value])'))option.setAttribute('value',option.value);
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),nodes=[];
 while(walker.nextNode())nodes.push(walker.currentNode);
 for(const node of nodes){
  if(!node.textContent.trim()||node.parentElement.closest('script,style,pre,code,[translate="no"]'))continue;
  const prior=canonicalText.get(node),source=prior&&node.textContent===prior.output?prior.source:node.textContent;
  const output=source.replace(/\S[\s\S]*\S|\S/,m=>translateUI(m));
  canonicalText.set(node,{source,output});if(node.textContent!==output)node.textContent=output;
 }
 for(const el of root.querySelectorAll('[aria-label],[placeholder],[title],[alt]')){
  if(el.closest('pre,code,[translate="no"]'))continue;
  const previous=canonicalAttrs.get(el)||{};
  for(const name of ['aria-label','placeholder','title','alt'])if(el.hasAttribute(name)){
   const current=el.getAttribute(name),old=previous[name],source=old&&current===old.output?old.source:current,output=translateUI(source);
   previous[name]={source,output};if(current!==output)el.setAttribute(name,output);
  }canonicalAttrs.set(el,previous);
 }
}
const languageChange=setGameLanguage;
setGameLanguage=function(lang){window.closeSheet();languageChange(lang);localizeUI();};
let localePending=false;
new MutationObserver(()=>{if(localePending)return;localePending=true;queueMicrotask(()=>{localePending=false;localizeUI();});}).observe(document.body,{childList:true,subtree:true,characterData:true});
localizeUI();
