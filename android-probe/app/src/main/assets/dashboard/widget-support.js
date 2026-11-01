/* Share the chosen UI language with the native Android widget. */
native('widgetLanguage',appLanguage);
const widgetLanguageBase=setGameLanguage;
setGameLanguage=function(lang){widgetLanguageBase(lang);native('widgetLanguage',appLanguage);};

const widgetMoreBase=morePage;
morePage=function(){return widgetMoreBase()+(typeof window.Native?.pinWidget==='function'?`<div class="card"><h3>Android widget</h3><p class="small-note">Empire summary and Supply suggestions, without opening the app.</p><button class="secondary" onclick="native('pinWidget')">Add home screen widget</button></div>`:'');};

window.openWidgetTarget=function(page,guid,area){guid=Number(guid);if(!snapshot||!Number.isInteger(guid)||guid<=0)return;if(page==='supply'){nav('supply');supplyFilters={island:(snapshot.areas||[]).some(a=>key(a)===area)?area:'all',region:'all',tier:'all'};browseState.supply.query=String(guid);render();}else{nav('products');openProduct(guid,area);}};
