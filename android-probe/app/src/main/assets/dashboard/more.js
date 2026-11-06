'use strict';

function moreTabs(page){
 return `<nav class="more-tabs" aria-label="More"><button ${page==='more'?'aria-current="page"':''} onclick="nav('more')">${svg('settings')}<span>More</span></button><button ${page==='help'?'aria-current="page"':''} onclick="nav('help')">${svg('info')}<span>FAQ / How To</span></button></nav>`;
}

function moreRow(mark,title,detail,action){
 return `<button class="more-row" onclick="${action}"><span class="more-mark">${svg(mark)}</span><span><b>${title}</b><small>${detail}</small></span>${svg('chevron')}</button>`;
}

function morePage(){
 return `${moreTabs('more')}<div class="more-grid">
 <section class="more-group"><h2>Connection &amp; preferences</h2>
 ${moreRow('link','PC bridge',isDemo?'Recorded sample mode':esc(pcAddress),'openSettings()')}
 <label class="more-language"><span><b>Language</b><small>Choose the language for the interface and original game text.</small></span><select class="form-input" aria-label="Language" onchange="setGameLanguage(this.value)">${Object.entries(K.languages).map(([id,label])=>`<option value="${id}" ${id===appLanguage?'selected':''}>${esc(label)}</option>`).join('')}</select></label>
 ${typeof window.Native?.pinWidget==='function'?moreRow('home','Add home screen widget','Empire summary and Supply suggestions.',"native('pinWidget')"):''}
 <div class="app-update-panel" id="appUpdatePanel">${updatePanelHtml()}</div></section>
 <section class="more-group"><h2>Game data</h2>
 ${moreRow('islands','Save Insights','Local save analysis',"nav('insights')")}
 ${moreRow('data','Data explorer','Every received field, name and identifier.','openExplorer()')}
 ${moreRow('info','About the data','What we know, and what we cannot see.','openAbout()')}
 </section></div>${communityPage()}`;
}

const helpCopy={
 en:[
  ['How do I start Live on Windows?','Extract the Windows ZIP, open Anno117Companion.exe and start the local server. Add /pipe to Steam → Properties → General → Launch Options, or to the game launch arguments in Ubisoft Connect → Properties. Restart Anno, load a save, let the simulation run and open Production Statistics. Select Live in the Companion. Demo works offline with example data.'],
  ['How do I connect a phone or another computer?','Keep the Windows Companion running with its local server on. Put both devices on the same network. Scan the QR code or open the displayed PC address in a browser and enter the six-digit code. In the Android app, choose Live and use the PC address and code. On iPhone, use Safari → Share → Add to Home Screen.'],
  ['Why do I see Cached data or no connection?','While Anno is paused, no new pipe statistics arrive. Cached shows the last received values and their age. Resume and reopen Production Statistics. If you have never received data, check /pipe and restart Anno. If another device cannot connect, check the displayed address, the current code and access on your private network. Guest Wi-Fi can block connections between devices.'],
  ['How do I use Save Insights?','Open More → Save Insights and select a campaign and save on the PC. Turn Use save data on to use saved statistics across the dashboard. Fresh pipe data takes priority when it matches the selected campaign. Save Insights shows recorded routes, stock history, housing and needs. Saved statistics can be older than the save.'],
  ['How do I plan a transfer?','Open Supply and pick a suggestion to move a surplus to an island with a local deficit. Use Plan this transfer, or add multiple goods and stops manually in Routes. Enter cargo quantities per visit. These are planning notes you apply in the game. A local deficit can already be covered by existing shipments.'],
  ['How do I plan a production chain?','Open Chains or use Build chain in Needs. Balanced chain shows the smallest whole-building set at the selected productivity. Under Planning basis, choose a local gap or enter a custom output to size an expansion. If the good must be imported, choose a production region and a source island. Check fertility, deposits and unlocks in the game.'],
  ['How do I read Needs and specialist suggestions?','Needs shows the tier’s catalogue and bonuses. You can record fulfilment for each need. Pipe production balances alone cannot establish residence coverage. Build plans list relevant specialists. A matching save can show whether you own one and where it is stored or assigned when that information is available.'],
  ['How do I update or add the Android widget?','On Windows or Android, open More → Updates. A paired browser follows the PC version. On Android, use More → Add home screen widget or the launcher’s widget picker. The widget has its own Demo and Live control.']
 ],
 hu:[
  ['Hogyan indul a Live Windowson?','Csomagold ki a Windows ZIP-et, indítsd el az Anno117Companion.exe-t és a helyi szervert. Add meg a /pipe kapcsolót a Steam indítási beállításaiban vagy a Ubisoft Connect játékindítási argumentumainál. Indítsd újra az Annót, tölts be egy mentést, engedd futni a játékidőt, és nyisd meg a termelési statisztikát. A Companionban válaszd a Live módot. A Demo kapcsolat nélkül is működik.'],
  ['Hogyan kapcsolódik a telefonom vagy egy másik gép?','A Windows Companion helyi szervere fusson, és mindkét eszköz legyen ugyanazon a hálózaton. Olvasd be a QR-kódot, vagy nyisd meg a kijelzett PC-címet, és írd be a hatjegyű kódot. Androidon a Live mód kéri a címet és a kódot. iPhone-on a Safari Megosztás menüjéből hozzáadhatod az oldalt a főképernyőhöz.'],
  ['Miért Cached az adat, vagy miért nincs kapcsolat?','Szünet közben a játék nem küld új statisztikát. A Cached az utolsó értékeket és azok korát mutatja. Folytasd a játékot, és nyisd meg újra a termelési statisztikát. Ha még nem érkezett adat, ellenőrizd a /pipe kapcsolót. Párosítási hibánál ellenőrizd a PC-címet, a friss kódot és a privát hálózat elérhetőségét.'],
  ['Hogyan használjam a Save Insights nézetet?','A More → Save Insights alatt válassz kampányt és mentést a PC-n. Kapcsold be a mentésadatok használatát a teljes felülethez. Az azonos kampányból érkező friss pipe-adat elsőbbséget élvez. Itt láthatók a mentett útvonalak, készletminták, lakóházak és igények. A statisztikai adatok régebbiek is lehetnek a mentésnél.'],
  ['Hogyan tervezzek szállítást?','A Supply javaslatai egy sziget többletét párosítják egy másik helyi hiányával. Válaszd a Plan this transfer gombot, vagy adj meg kézzel több árut és megállót a Routes oldalon. A rakományt megállónként add meg, a tervet pedig a játékban állítsd be. A helyi hiányt egy meglévő útvonal már fedezheti.'],
  ['Hogyan tervezzek termelési láncot?','Nyisd meg a Chains oldalt, vagy a Needs alatt válaszd a Build chain gombot. A Balanced chain a legkisebb egész épületszámú láncot mutatja a kiválasztott termelékenységen. A Planning basis alatt helyi hiányhoz vagy egyedi célhoz méretezhetsz. Importnál válassz forrásrégiót és szigetet, majd ellenőrizd a termékenységet és a feloldásokat a játékban.'],
  ['Mit mutatnak az igények és a specialisták?','A Needs a lakossági szint igényeit és bónuszait mutatja. A teljesítést egyenként rögzítheted. A termelési egyenlegből önmagában nem derül ki a lakóházak ellátottsága. Az építési terv a releváns specialistákat mutatja, az egyező mentésből pedig az is látszhat, melyik van meg és hol található.'],
  ['Hol frissíthetek és hol van az Android-widget?','Windows és Android alatt a More → Updates oldalon frissíthetsz. A párosított böngésző a PC verzióját követi. Az Android-widgetet a More menüből vagy a telefon widgetválasztójából adhatod hozzá. Saját Demo és Live kapcsolója van.']
 ],
 de:[
  ['Wie starte ich Live unter Windows?','Entpacke die Windows-ZIP, öffne Anno117Companion.exe und starte den lokalen Server. Füge /pipe zu den Startoptionen in Steam oder Ubisoft Connect hinzu. Starte Anno neu, lade einen Spielstand, lasse die Simulation laufen und öffne die Produktionsstatistik. Wähle im Companion Live. Die Demo funktioniert offline.'],
  ['Wie verbinde ich mein Handy oder einen anderen Rechner?','Lass den Windows-Companion samt lokalem Server laufen. Beide Geräte müssen im selben Netzwerk sein. Scanne den QR-Code oder öffne die angezeigte PC-Adresse und gib den sechsstelligen Code ein. In der Android-App findest du die Kopplung unter Live. Auf dem iPhone kannst du die Seite über Safari zum Home-Bildschirm hinzufügen.'],
  ['Warum sind die Daten zwischengespeichert oder fehlt die Verbindung?','Im pausierten Spiel kommen keine neuen Pipe-Daten an. Cached zeigt die letzten Werte und ihr Alter. Setze die Simulation fort und öffne die Produktionsstatistik erneut. Wenn noch keine Daten angekommen sind, prüfe /pipe. Bei Kopplungsproblemen prüfe PC-Adresse, aktuellen Code und den Zugriff im privaten Netzwerk.'],
  ['Wie nutze ich Save Insights?','Wähle unter Mehr → Save Insights eine Kampagne und einen Spielstand auf dem PC. Aktiviere die Verwendung der Speicherdaten für das Dashboard. Neue Pipe-Daten derselben Kampagne haben Vorrang. Save Insights zeigt gespeicherte Handelsrouten, Lagerverläufe, Wohnhäuser und Bedürfnisse.'],
  ['Wie plane ich einen Transport?','Wähle unter Versorgung einen Vorschlag für einen lokalen Überschuss. Im Routenplaner kannst du mehrere Waren und Stopps eintragen. Gib die Fracht pro Besuch ein und richte die Route im Spiel ein. Ein lokales Defizit kann bereits durch bestehende Lieferungen gedeckt sein.'],
  ['Wie plane ich eine Produktionskette?','Öffne die Ketten oder wähle bei einem Bedürfnis die Schaltfläche zum Bau der Kette. Die ausgeglichene Kette zeigt die kleinste Kombination ganzer Gebäude bei der gewählten Produktivität. In der Planungsgrundlage kannst du ein lokales Defizit oder ein eigenes Ziel wählen. Prüfe bei Importen die Quellinsel, Fruchtbarkeit und Freischaltungen im Spiel.'],
  ['Was zeigen Bedürfnisse und Spezialistenvorschläge?','Die Ansicht zeigt Bedürfnisse und Boni der Bevölkerungsstufen. Die Erfüllung lässt sich einzeln erfassen. Produktionsbilanzen allein sagen nichts über die Versorgung einzelner Wohnhäuser aus. Baupläne zeigen passende Spezialisten, und ein passender Spielstand kann ihren Besitz und Standort anzeigen.'],
  ['Wie aktualisiere ich die App oder füge das Android-Widget hinzu?','Unter Windows und Android findest du Updates unter Mehr → Updates. Der gekoppelte Browser verwendet die PC-Version. Füge das Widget im Menü Mehr oder über die Widget-Auswahl des Launchers hinzu. Das Widget hat einen eigenen Demo- und Live-Schalter.']
 ]
};
const helpTabs={
 en:['Setup & pairing','Planning & tools','How to use the Companion','From your first connection to your next production plan.'],
 hu:['Beállítás és párosítás','Tervezés és eszközök','A Companion használata','Az első kapcsolódástól a következő termelési tervig.'],
 de:['Einrichtung & Kopplung','Planung & Werkzeuge','Den Companion verwenden','Von der ersten Verbindung bis zum nächsten Produktionsplan.']
};

let helpLanguage='';
const helpExpanded=new Set();
function setHelpLanguage(lang){
 if(!Object.hasOwn(helpCopy,lang))return;
 document.querySelectorAll('.help-question').forEach((item,id)=>rememberHelpQuestion(id,item.open));
 helpLanguage=lang;
 render(true);
}
function rememberHelpQuestion(id,open){if(open)helpExpanded.add(id);else helpExpanded.delete(id);}

function helpPage(){
 const lang=helpLanguage||(helpCopy[appLanguage]?appLanguage:'en');
 const [setup,planning,title,subtitle]=helpTabs[lang];
 const questions=helpCopy[lang];
 const group=(label,offset)=>`<section class="more-group"><h2>${esc(label)}</h2>${questions.slice(offset,offset+4).map(([question,answer],i)=>{
  const id=offset+i;
  return `<details class="help-question" ${helpExpanded.has(id)?'open':''} ontoggle="if(this.isConnected)rememberHelpQuestion(${id},this.open)"><summary>${esc(question)}${svg('chevron')}</summary><p>${esc(answer)}</p></details>`;
 }).join('')}</section>`;
 return `${moreTabs('help')}<div class="help-intro"><div lang="${lang}" translate="no"><h2>${esc(title)}</h2><p>${esc(subtitle)}</p></div><label><span>Language</span><select class="form-input" onchange="setHelpLanguage(this.value)">${Object.entries({en:'English',de:'Deutsch',hu:'Magyar'}).map(([id,name])=>`<option value="${id}" ${id===lang?'selected':''} translate="no">${name}</option>`).join('')}</select></label></div><div class="more-grid" lang="${lang}" translate="no">${group(setup,0)}${group(planning,4)}</div>`;
}

companionPages.more={offline:true,titles:['YOUR COMPANION','More','Connection, preferences and game data.'],content:morePage};
companionPages.help={offline:true,titles:['YOUR COMPANION','FAQ / How To',''],content:helpPage};
