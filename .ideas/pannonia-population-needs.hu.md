# Anno 117: Pannónia – részletes népesség- és igényrendszer (v2 egyeztetési változat)

## 1. Mi változik az első vázlathoz képest?

Ez a változat már nem pusztán neveket rendel a 24 kumulatív igényslothoz. Minden választásnál figyelembe veszi:

1. a Kr. u. 117-es pannóniai történeti védhetőséget;
2. a konkrét vanilla donort és az új assetigényt;
3. a termelési receptet vagy a szolgáltatás működését;
4. a tierben betöltött gazdasági szerepet;
5. a két fejlődési ág közötti valódi különbséget;
6. a Duna, a vizes élőhelyek, a civitasok, a városok és a hadsereg összekapcsolását.

Az igények kumulatív **választási lehetőségek**, nem 24 egyenként kötelező fogyasztási feltétel. Az Anno 117 kategóriánként supply pointokat és fejlődési küszöböt használ; a teljes ellátás többletnépességet, jövedelmet vagy más bónuszt adhat.

## 2. Népességnevek – pontosított javaslat

```text
T1 – Provinciales / Provinciálisok
 ├─ T2 – Vicani / Vicuslakók
 │    └─ T3 – Principes / Civitas-előkelők
 └─ T2 – Municipes / Városi polgárok
      └─ T3 – Decuriones / Decuriók
```

### Miért ez erősebb az első névsornál?

- **Provinciales** játékosbarát gyűjtőnév a tartomány szabad lakosságára. A jogilag szűkebb `peregrini` történetileg pontosabb lenne a római polgárjoggal nem rendelkező szabadokra, de angolul félreérthető és nem foglalja magába a teljes vegyes induló társadalmat.
- **Vicani** feliratos és településtörténeti szempontból hiteles név a `vicus` lakóira. Nem etnikai kategória: helyiek, veteráncsaládok, bevándorló kézművesek és kereskedők egyaránt élhetnek ilyen településen.
- **Principes** a helyi civitasok vezető elitjére használt, Pannoniában is dokumentált cím. Magyar UI-ban érdemes **Civitas-előkelőknek** fordítani, hogy ne keveredjen a „herceg” későbbi jelentésével.
- **Municipes** egy római jogú városi közösség polgárai. Magyarul a **Városi polgárok** természetesebb, míg a latin név megmaradhat az angol/klasszicizáló UI-ban.
- **Decuriones** a municipiumok és coloniák tanácsi elitje; pontos és már az Achaea-koncepció római ágával is összhangban áll.

Az ágak nem „bennszülöttek kontra rómaiak”. A bal ág a helyi civitas/vicus intézményekből kinövő provinciális fejlődés, a jobb ág a polgárjogi, municipális és birodalmi integráció. Ugyanazon család több generáció alatt átkerülhet egyikből a másikba.

## 3. Reuse-jelölés

- **V0 – közvetlen vanilla:** változatlan termék és közel változatlan épület.
- **V1 – regionális variáns:** vanilla recept/mechanika, új névvel, ikon- vagy artvariánssal.
- **V2 – hibrid:** meglévő inputok és gyártási logika, de új output vagy szolgáltatás.
- **Ú – új rendszer/asset:** csak erős identitás vagy új játékmenet esetén.

Tervezett arány: körülbelül 70–75% V0/V1, 15–20% V2, legfeljebb 10% valóban új tartalom.

## 4. Közös T1 – Provinciales / Provinciálisok

### Food

| Igény | Lánc | Donor | Tier- és régiószerep |
|---|---|---|---|
| **Gabonakása** | zab vagy általános gabona → kásafőző | Latium porridge, V0/V1 | Olcsó, szárazföldi induló étel; a játékos akkor is tud fejlődni, ha kevés a vizes terület. |
| **Édesvízi hal** | folyami halászkunyhó **vagy** holtági angolnafogó → hal | Latium Fishing Hut + Albion Eel Grabber, V1 | Egyetlen needslot két táji termelési móddal. A nyílt Duna-part és a mocsaras holtág eltérő layoutot kér, de nem hoz létre két fölösleges készterméket. |

**Döntés:** ne legyen pannóniai „cockle”. Az albioni kagylószedés tengerparti kulturális/táji tartalom; csak a marsh placement, az angolna és a halászati logika használható újra.

### Public service

| Igény | Működés | Donor | Tier- és régiószerep |
|---|---|---|---|
| **Piac** | közeli lakóházak ellátása és alapvető kereskedelmi szolgáltatás | közös Market, V0, pannóniai skin opcionális | A katonai és civil telepek közötti helyi csere alapja. |
| **Útszéli szentély – Sacellum** | kis körzetű szolgáltatás; később egy helyi/római kultuszt választhat | Albion Fanum-választás + Latium Sanctuary, V2 | A vallási szinkretizmust már T1-en bevezeti anélkül, hogy az albioni isteneket átmásolná. Útcsomópont vagy településszél mellé illik. |

### Clothing / Fashion

| Igény | Lánc | Donor | Tier- és régiószerep |
|---|---|---|---|
| **Tunica** | kender/gyapjú → fonó/szövő → tunica | vanilla Tunics, V0 | Kulturálisan semleges közös alapruha. |
| **Gyapjúköpeny** | juh → gyapjú → köpenykészítő | Albion/Latium gyapjúlánc, V1 | A hűvösebb, nedvesebb határvidékhez és a katonai/civil utazáshoz jobban illik, mint egy újabb mediterrán ruhadarab. |

### T1 játékmeneti állítás

A T1 két párhuzamos földhasználatot tanít:

- **ártér:** hal, angolna, nád, pallóutak és korlátozott építési hely;
- **szárazabb hát:** gabona, juh, fa és hagyományos úthálózat.

A teljes T1-ellátáshoz mindkét tájat érdemes használni, de a supply point rendszer miatt egyik sem lehet kötelező zsákutca.

## 5. Helyi-provinciális ág

## T2 – Vicani / Vicuslakók

### Food

| Igény | Lánc | Donor | Miért T2? |
|---|---|---|---|
| **Pannóniai gabonasör** | árpa vagy köles → malátázó/sörfőző → gabonasör | Albion beer, V1 | Erős regionális ital, közvetlen vanilla technikai donorral. A később `sabaia/sabaea` alakban adatolt elnevezés szerepelhet a leírásban, de a 117-es UI-név maradjon óvatosan „pannóniai gabonasör”. |
| **Gyümölcskosár** | gyümölcsöskert + fonott kosár → piaci gyümölcskosár | orchard/farm + basket, V2 | Az alma, körte, szilva és cseresznye kertgazdaságát összeköti a wetland kosárfonással. Nem kell minden gyümölcsnek külön fogyasztási GUID. |

### Public service

| Igény | Működés | Donor | Miért T2? |
|---|---|---|---|
| **Vicuscsarnok** | közösségi szolgáltatás; körzetében kis kézműves- és workforce-bónusz | Albion Bard’s Hearth/Alder Council logika, V2 | Nem „törzsi kunyhó”, hanem egy kevert vidéki település közösségi és gazdasági központja. |
| **Civitas-szentély** | választható pannóniai–római kultusz; eltérő gazdasági bónuszok | Fanum deity-choice, V2 | A játékos itt választ először intézményi hangsúlyt: erdő/állat, folyó/halászat, kézműipar vagy katonai kapcsolat. |

**Kultuszlista csak külön forrásaudit után véglegesíthető.** Jó mechanikai keret lehet Silvanus, folyó- és forráskultusz, helyi anyaistennők, valamint egy romanizált civitas-istenség; a későbbi Mithras-, Dolichenus- vagy monumentális Isis-kultuszt nem szabad automatikusan 117-re előrehozni.

### Clothing / Fashion

| Igény | Lánc | Donor | Miért T2? |
|---|---|---|---|
| **Braccae – gyapjúnadrág** | gyapjú → szövet → szabóműhely | Albion trousers, V1 | Közvetlen technikai reuse, de nem „Albionból importált kelta jelmez”: a nadrág északi/provinciális viseleti forma. |
| **Norico–pannóniai fibula** | bronz → fibulaműhely → fibula | vanilla brooch/fibula logika, V1/V2 | Régészetileg erős provinciális viseleti marker. Nem szabad egyetlen etnikumhoz kötni; helyi és római viseleti formák keveredését mutatja. |

### Household

| Igény | Lánc | Donor | Miért T2? |
|---|---|---|---|
| **Pannóniai kerámia** | agyag → fazekasműhely → helyi főző- és tárolóedény | amphora/pottery rendszer, V1 | A helyi formák és a római műhelytechnika találkozása. Ugyanez a műhelycsalád később lámpára, amphorára és díszkerámiára specializálható. |
| **Fonott kosarak** | nád vagy fűzvessző → kosárfonó → kosár | Reed Gatherer + új feldolgozó, V2 | Az egyik kevés indokolt signature good: a wetland inputot háztartási és logisztikai termékké teszi, nem egyszerűen albioni nádcipővé. |

### T2 helyi ág gazdasági karaktere

- több helyi input, rövidebb lánc és kisebb importfüggés;
- jó élelmiszer-, workforce- és alapanyagtermelés;
- a mocsár, erdő, legelő és agyaglelőhely jobb kihasználása;
- kisebb adóbevétel, de erős termelékenység és regionális önellátás.

## T3 – Principes / Civitas-előkelők

### Food

| Igény | Lánc | Donor | Designindok |
|---|---|---|---|
| **Füstölt húsok** | sertés- vagy marhahús + fa/só → füstölőház → tartósított hús | vanilla livestock + smokehouse recipe, V1/V2 | A nagy állatállományt és a hadsereg ellátását köti össze; tárolható, szállítható regionális többlettermék. |
| **Pelso-vidéki bor** | szőlő → borászat → érlelőpince → bor | Latium wine, V1 | A játékos által kifejlesztett balatoni late-game gazdaság. Nem állítja, hogy 117-ben már a késő római luxusvillák teljes borvidéke létezett; importborral kiváltható. |

### Public service

| Igény | Működés | Donor | Designindok |
|---|---|---|---|
| **Civitas tanácsháza** | rendeletslotok: mezőgazdaság, kézműipar, kereskedelem vagy limes-ellátás | Alder Council/decree rendszer, V2 | A `principes` státuszának intézményi alapja; nem csak happiness-épület. |
| **Forrásfürdő és gyógyító szentély** | health + happiness; tiszta víz vagy forrásközelség mellett erősebb | Bath/Sanctuary hibrid, V2 | A helyi szent hely és a római fürdőkultúra keveredését mutatja. Nem kell minden vidéki telepre aquaeductus. |

### Clothing / Fashion

| Igény | Lánc | Donor | Designindok |
|---|---|---|---|
| **Finom gyapjúpalást** | válogatott gyapjú → finom szövet → palást | fine clothing/toga lánc, V1 | A helyi állattartás elit outputja. |
| **Borostyánékszer** | importált borostyán + bronz/ezüst → ékszerműves | brooch/jewellery rendszer, V2 | Savaria és Scarbantia Amber Road-szerepét kereskedelmi függéssé alakítja. Lehet fibula, függő vagy gyöngysor; a borostyán import, nem pannóniai bányaoutput. |

### Household

| Igény | Lánc | Donor | Designindok |
|---|---|---|---|
| **Díszkerámia** | finom agyag + fazekasműhely → pannóniai bevonatos asztali edény | pottery rendszer, V1/V2 | A 2. században megjelenő pannóniai slipped ware játékos által felfuttatott korai regionális ipar. A bevonat nem valódi máz. |
| **Hátaslovak** | lólegelő → lótenyésztő → idomítótelep → hátasló | Albion horse/pasture rendszer, V1/V2 | Elit közlekedési és presztízsigény, egyben a lovassági gazdaság civil oldala. A felszerelt katonai lóhoz külön lószerszám és erőd szükséges. |

### Marvel

| Marvel | Szerep | Történeti kezelés |
|---|---|---|
| **Gorsium szent kerülete** | kultusz- és fesztiválközpont; regionális happiness, diplomacy és cult-bónusz | Az 105–106 után fejlődő telep jó építési történet. A provinciai császárkultusz kizárólagos főközpontja vitatott, ezért a játék szent kerületként, nem bizonyított „hivatalos főtemplomként” kezeli. |
| **Aquincumi forrás- és fürdőnegyed** | termál-/forrásfoglalás, aquaeductus, fürdők és szentélykörzet; health, happiness és városi presztízs | Aquincum vízvezetékét a mai Rómaifürdő forrásai táplálták. A projekt a természetes vízkincset és a római mérnöki kultúrát egyesíti, ezért nem kizárólag a municipális ág „római díszlete”. |

## 6. Municipális-római ág

## T2 – Municipes / Városi polgárok

### Food

| Igény | Lánc | Donor | Miért T2? |
|---|---|---|---|
| **Kenyér** | búza → malom → pékség → kenyér | Latium bread, V0 | A sűrűbb városi népesség és a katonai tömegellátás alapja. |
| **Garum** | hal + importált/helyi só → garumműhely | Latium garum, V0/V1 | Kereskedelemre ösztönöz, és régészetileg amphorákon keresztül védhető birodalmi fogyasztási szokás. Nem kell pannóniai tengerpartot kitalálni. |

### Public service

| Igény | Működés | Donor | Miért T2? |
|---|---|---|---|
| **Közfürdő** | health/happiness; víz- és tüzelőanyag-igény | Latium Bath, V0/V1 | Tábor, canabae és városi telep közös romanizált intézménye. Korai, kisebb fürdő, nem automatikusan a későbbi monumentális romállapot. |
| **Mansio – útállomás** | lakossági szolgáltatás + közeli utak, kocsik és kereskedelmi fuvarok bónusza | Tavern/road logistics hibrid, V2 | Pannonia út-, limes- és Amber Road-szerepét aktív mechanikává teszi. Elhelyezése főút mellett optimális. |

### Clothing / Fashion

| Igény | Lánc | Donor | Miért T2? |
|---|---|---|---|
| **Szandál** | bőr → varga → szandál | Latium sandals, V0 | Közvetlen vanilla reuse és városi kézműves lánc. |
| **Finom tunica** | kender/gyapjú + festék → szabó → finom tunica | tunic/fine clothing, V1 | A T1 tunica luxusabb változata; nem új alapanyag-rendszer. |

### Household

| Igény | Lánc | Donor | Miért T2? |
|---|---|---|---|
| **Amphorák** | agyag + gyanta → fazekas → amphora | Latium amphorae, V0 | A bor, olaj és garum kereskedelmének csomagolóeszköze; az importhálózatot láthatóvá teszi. |
| **Terrakotta olajlámpák** | agyag → lámpaöntő műhely → lámpa; fogyasztáskor olívaolaj-ellátás adhat többletbónuszt | pottery/lamp asset, V1/V2 | Aquincum korai katonai fazekas- és lámpagyártásához jól kapcsolható. A lámpa tárgy és az olaj mint üzemanyag külön kezelhető, hogy ne legyen indokolatlanul hosszú alaprecept. |

### T2 municipális ág gazdasági karaktere

- magasabb adó és sűrűbb városi lakosság;
- több feldolgozás, szolgáltatás és útfüggés;
- só-, olaj-, gyanta- vagy borimport iránti kereslet;
- erős raktár-, kikötő-, kocsi- és katonai ellátási szinergia.

## T3 – Decuriones / Decuriók

### Food

| Igény | Lánc | Donor | Designindok |
|---|---|---|---|
| **Importált évjáratos bor** | kereskedelmi út → amphora → borkereskedő | Latium wine + trade, V0/V1 | Tudatos párja a helyi Pelso-vidéki bornak: a két ág ugyanazt a kategóriát eltérő logisztikával oldja meg. |
| **Aszalt és mézes gyümölcsök** | gyümölcs + méz → aszaló/tartósító műhely → gyümölcstál | orchard + honey, V2 | A helyi gyümölcsfelesleget elit és kereskedelmi termékké alakítja. Importált füge vagy datolya alternatív inputként gyorsíthatja, de nem helyi termésként jelenik meg. |

### Public service

| Igény | Működés | Donor | Designindok |
|---|---|---|---|
| **Forum és basilica** | adó-, adminisztrációs és kereskedelmi szolgáltatás; rendelet- vagy hivatalnokslot | Latium Forum, V0/V1 | A decuriók városi hatalmának központja. |
| **Grammaticus iskolája** | knowledge és hivatali workforce; írótáblát fogyaszthat | Latium Grammaticus, V0 | A városi igazgatás és latin írásbeliség fenntartása. |

### Clothing / Fashion

| Igény | Lánc | Donor | Designindok |
|---|---|---|---|
| **Toga** | finom szövet → toga | Latium toga, V0 | Státusz- és polgárjogi jelző, ezért csak a municipális elitnél jelenik meg. |
| **Ezüstfibula** | ezüst/importfém → ötvös → díszfibula | brooch/jewellery, V1 | A fibula mindkét ágon jelen van, de más anyaggal és jelentéssel: bal oldalon regionális viselet és borostyánút, jobb oldalon városi rang és luxus. |

### Household

| Igény | Lánc | Donor | Designindok |
|---|---|---|---|
| **Írótáblák** | fa + viasz → írótábla-készítő | vanilla writing tablets, V0 | Hadsereg, helytartói adminisztráció és városi tanács közös fogyasztási cikke. |
| **Finom üvegáru** | importált vagy helyi üveg → üvegműves/kereskedő | vanilla fine glass, V0/V1 | Elit háztartási és kereskedelmi igény, új pannóniai lánc nélkül. |

### Marvel

| Marvel | Szerep | Történeti kezelés |
|---|---|---|
| **Aquincumi helytartói palota** | tartományi adminisztráció, dunai kikötő és imperial favour | A 2. század eleji helytartói központ fejlesztéseként védhető. Nem jelenti azt, hogy a későbbi teljes aquincumi nagyváros 117-ben már készen állt. |
| **Savaria Forum–Capitoliuma** | veteráncolonia, Amber Road-kereskedelem és római városi presztízs | Claudius-kori alapítás és 117 előtti városi fejlődés miatt a legbiztonságosabb monumentális municipális/coloniai anchor. |

## 7. A két ág nem két külön gazdaság

| Helyi-provinciális export/erősség | Municipális-római export/erősség |
|---|---|
| gabona, sertés, juh, sajt | kenyér, feldolgozott élelmiszer |
| nád, kosár, fa | amphora, lámpa, tégla és városi kerámia |
| gyapjúruha, regionális fibula | finom tunica, toga és luxusfibula |
| helyi bor, bevonatos kerámia | importbor, üvegáru és írótábla |
| civitas-rendeletek és vidéki termelékenység | utak, adó, knowledge és adminisztráció |

A legerősebb város mindkét ágat fenntartja. A civitas-hátország élelmezi és nyersanyaggal látja el a canabaét és a várost; a municipális ág piacot, feldolgozást, infrastruktúrát és távolsági kapcsolatot ad vissza.

## 8. Gyümölcsöskertek és gyümölcsfeldolgozás

### Történetileg védhető készlet

A római kori pannóniai növényleletek és összefoglalók alapján három csoportot kell elkülöníteni:

- **helyben termeszthető vagy korábban is ismert:** alma, körte, cseresznye/meggy jellegű Prunus-félék, mogyoró és gyűjtött vadgyümölcsök;
- **a római kertkultúrával terjedő vagy erősödő:** szilva, őszibarack, kajszi, dió és nemesített szőlő;
- **elsősorban import:** füge, olajbogyó és datolya.

A pontos 117-es fajlistánál óvatosnak kell maradni, mert sok pannóniai archaeobotanikai adat tág római kori vagy kifejezetten késő római rétegből származik. A design ezért nem állítja, hogy minden később dokumentált gyümölcs már 117-ben tömegtermék volt.

### Javasolt alapépület

**Gyümölcsöskert** moduláris gazdaság legyen egyetlen általános `Orchard` termőképességgel:

```text
Gyümölcsöskert
 ├─ alma–körte liget
 ├─ szilva–cseresznye liget
 └─ dió–őszibarack liget – későbbi fejlesztés
        ↓
     gyümölcs
```

Nem érdemes öt-hat külön fertilityt és öt-hat, egymást másoló gyümölcsláncot létrehozni. A modulválasztás vizuális változatosságot, kisebb eltérő bónuszokat és történeti ízt adhat, miközben mind ugyanazt a **gyümölcs** inputot termeli.

### Feldolgozás

```text
Gyümölcs + fonott kosár
 → gyümölcskosár – Vicani T2 Food

Gyümölcs + méz
 → aszalt és mézes gyümölcsök – Decuriones T3 Food

Gyümölcs
 → aszalvány – hadsereg, hajók és távolsági kereskedelem opcionális ellátmánya
```

Ez különösen jó pannóniai rendszer, mert a domboldali kertgazdaságot az ártéri kosárfonással és a városi/hadseregi piaccal köti össze. A gyümölcs nem díszlet, hanem a régió három tájtípusát egyesítő termelési hálózat.

### A kosár kettős kereslete

A **fonott kosár** egyszerre legyen:

1. önálló Vicani T2 Household igény;
2. a Gyümölcskosár kötelező csomagolóinputja;
3. opcionális input a halászat, szüret, raktározás és a Ripa Pannonica ellátás számára.

Ez valódi termelési döntést hoz létre. Ha minden kosár közvetlenül a lakóházakhoz kerül, leáll a gyümölcskosár előállítása; ha a piac túl sokat használ fel, romlik a Household-ellátás. A kosár tartós cikként lassabban, a gyümölcskosár élelmiszerként gyorsabban fogyjon, hogy a két kereslet eltérő ritmust adjon.

Első balanszvázlat:

```text
2 Gyümölcs + 1 Fonott kosár
 → 1 Gyümölcskosár
```

A fonott kosár nem visszaváltható csomagolás: a needs-rendszer absztrakciójában a sérülést, elhasználódást és folyamatos pótlást képviseli. Így nem szükséges külön üreskosár-visszaszállítási mechanika.

### Táji szerep

- **Aquincum budai dombvidéke:** kertgazdaság és városi piac;
- **Savaria–Scarbantia nyugati térsége:** utakhoz kapcsolódó gyümölcs- és diókertek;
- **Pelso-felvidék:** gyümölcsös, szőlő és villa-/farmfejlődés;
- **erdőszélek és árterek:** bodza, kökény, som és mogyoró gyűjtése opcionális wild-resource rendszerként.

## 9. Lótenyésztés, lovasság és íjak

### Lótenyésztés

A ló nem puszta modern magyar utalás. A római kori magyarországi lelőhelyeken helyi és nagyobb katonai lóállomány keveredése látszik, Aquincum–Albertfalva térségében pedig lovastábor is működött. Pannóniai eredetű lovas auxilia-egységek a birodalom más hadszínterein is szolgáltak.

Javasolt lánc:

```text
Lólegelő
 → lótenyésztő
 → idomítótelep
 ├─ hátasló – Principes household need
 ├─ igásló – gyorsabb kocsik és mezőgazdasági/logisztikai bónusz
 └─ katonai ló + lószerszám – auxilia lovasság
```

A nyereg- és szerszámműhely a meglévő bőr-, bronz- és vasláncot használja. Az `ala` vagy `cohors equitata` egységhez ló, lószerszám, gyapjúköpeny és fegyver kell; így a lovasság nem ingyenes kulturális bónusz, hanem összetett regionális ipar.

### Íjak és lovasíjászok

Két külön dolgot kell szétválasztani:

1. **vadász- és gyalogos íjak:** helyben is készíthető fa/szarv/ín alapú fegyverek, amelyek vadászatot vagy római auxilia íjászokat szolgálhatnak;
2. **jazig lovasíjászat:** a Dunától keletre élő Iazyges szarmatákhoz kötődő határvidéki katonai hagyomány, nem pannóniai és végképp nem „ókori magyar” egység.

Javasolt lánc:

```text
Rugalmas fa + állati ín/szarv
 → íjkészítő
 → reflexíj
```

A reflexíj önmagában gyalogos sagittarii felszerelése lehet. **Jazig lovasíjász** csak dunai kereskedelmi vagy szövetségi szerződéssel oldódjon fel, és hátaslovat + reflexíjat fogyasszon. Traianus idején a jazigok római szövetségesként is megjelenhetnek, ezért ez hiteles diplomáciai endgame, miközben nem mossa össze a provinciát a Barbaricummal. A később Intercisában dokumentált szír sagittarii-alakulatokat nem szabad 117-es kezdőegységként használni.

### Játékmeneti eredmény

- a lólegelő új értelmet ad a nagyobb száraz gyepeknek;
- a juh, sertés és ló egymással verseng a legelőért;
- a lovasság gyors reagálású limes-egység és kereskedelmi kíséret;
- a jazig kapcsolat a Duna túlpartját diplomáciai térré teszi, nem üres térképszéllé;
- a vadászíj erdei termelést, a lovasíjász pedig drága külpolitikai specializációt ad.

## 10. Két normál T3 Marvel-pár és a plusz projekt

### Normál Marvel-slotok

- **Principes:** Gorsium szent kerülete + Aquincum forrás- és fürdőnegyede.
- **Decuriones:** Aquincum helytartói palotája + Savaria Forum–Capitoliuma.

Scarbantia az Amber Road és a borostyánékszer kereskedelmi központjaként marad nélkülözhetetlen, de nem kell minden fontos várost monumentummá erőltetni. Brigetio szándékosan nem kap külön normál Marvelt, mert a plusz projekt katonai horgonya lesz. Pelso gazdasági-táji specializáció, nem erőltetett monumentum.

### Plusz monumentum: Ripa Pannonica – a dunai határrendszer

Nem egyetlen épület, hanem régiós építési lánc:

```text
Limes-út és mérföldkövek
 → őr- és jelzőtornyok
 → auxiliáris castellumok
 → folyami kikötők és átkelők
 → horreumok és utánpótlási állomások
 → Brigetio legiotábora
 → Aquincum parancsnoki és logisztikai központja
```

### A projekt ellátási szerződése

**Principes-hozzájárulás:** gabona, hús, gyapjúköpeny, kosarak, fa, hátas- és igáslovak, valamint helyi workforce.

**Decuriones-hozzájárulás:** tégla, vasáru, amphora, írótábla, pénz/adóbevétel, mérnöki és adminisztratív kapacitás.

### Végső bónusz

- gyorsabb szárazföldi és folyami árumozgás;
- nagyobb kikötői és raktári kapacitás;
- katonai termékek állandó birodalmi felvásárlása;
- kisebb raid- és tűzkár a Duna mentén;
- új kereskedelmi szerződések a Barbaricummal és más provinciákkal;
- regionális presztízs és imperial favour.

Így a plusz projekt nem csak látványosság: a teljes pannóniai gazdaság végső integrációja.

## 11. Mely új tartalmak érik meg valóban?

### Erősen indokolt új vagy hibrid tartalom

1. **Fonott kosarak:** wetland inputból logisztikai/háztartási output.
2. **Civitas-szentély:** saját kultuszválasztás, nem Albion átnevezése.
3. **Vicuscsarnok/Civitas tanácsháza:** a helyi ág intézményi identitása.
4. **Borostyánékszer:** Amber Road és helyi ötvösség találkozása.
5. **Gyümölcskosár és moduláris gyümölcsöskert:** több gyümölcs vizuális gazdagsága egyetlen kezelhető inputrendszerrel.
6. **Lótenyésztés és auxilia lovasság:** civil needből katonai/logisztikai rendszerbe forduló lánc.
7. **Jazig szerződés és lovasíjászok:** határ menti diplomácia, nem pannóniai etnikai átnevezés.
8. **Aquincumi forrás- és fürdőnegyed:** forrásfoglalásból, aquaeductusból és fürdőkből álló termálvízi Marvel.
9. **Ripa Pannonica:** valóban új többhelyszínes regionális endgame.

### Ne kapjon fölöslegesen új GUID-ot vagy gyárat

- gabonakása, hal, tunica, kenyér, garum, sajt, bor;
- gyapjú, bőr, sertés, juh és szőlő;
- szandál, toga, amphora, írótábla és üvegáru;
- piac, fürdő, grammaticus és forum, ha regionális klónnal beköthetők.

## 12. Ellenőrzendő pontok a végleges design előtt

1. A tényleges vanilla need-GUID-ok, supply point értékek és kategóriaküszöbök.
2. A pannóniai kultuszlista helyszín- és dátumalapú összeállítása.
3. A Pannóniai bevonatos kerámia pontos induló kronológiája az észak-pannóniai/magyarországi műhelyekben.
4. A négy normál Marvel pontos 117-es építési fázisa és a játék által vállalt alternatív történelmi előrehaladás határa.
5. A marsh-compatible road rendszer valódi modolhatósága és a folyami halászat region-context korlátai.
6. A lótenyésztés, lószerszám és szárazföldi egységek vanilla assetjeinek pontos reuse-auditja.
7. A jazig szerződés 117-es politikai kerete és a reflexíj receptjének régészeti ellenőrzése.
8. Az alma, körte, szilva, cseresznye, dió és őszibarack 117-es észak-pannóniai termesztésének lelőhelyenkénti kronológiai auditja.

## 13. Fő kutatási támpontok

- Ubisoft, Optional Needs és supply point rendszer: https://www.anno-union.com/devblog-fulfil-needs-your-way/
- Ubisoft, Albion population branching és marsh economy: https://news.ubisoft.com/en-us/article/2E5rwI4XBSJFJjUzcBxU2x/anno-117-pax-romana--a-guide-to-albion-part-1
- Reed–Ožanić Roguljić, pannóniai élelmiszer, kerámia és birodalmi import: https://doi.org/10.1515/opar-2020-0105
- Aucissa fibulák Pannoniában: https://doi.org/10.1556/072.2023.00017
- Aquincum katonai fazekasipara: https://www.researchgate.net/publication/351693566_Pottery_industry_of_the_Aquincum_military_town
- Amber Road, katonai jelenlét és korai vasfeldolgozás: https://www.oeaw.ac.at/en/oeai/research/historical-archaeology/individual-research/amber-road-transit-route-and-military-presence
- Danube Limes: https://whc.unesco.org/en/list/1608/
- Aquincum aquaeductusa és forrásai: https://doi.org/10.5195/ahea.2021.424
- Jazigok Traianus-kori helyzete: https://doi.org/10.1093/acrefore/9780199381135.013.3232
- Római kori pannóniai tápláléknövények és gyümölcsök összefoglalója: https://romaikor.hu/barbaricum_a_birodalom_hataran/taplalkozas_es_annak_novenyi_forrasai_pannoniaban_es_a_barbaricumban/cikk/taplaleknovenyek_maradvanyai_pannoniaban
- Balaton-vidéki római táj- és archaeobotanikai kutatás: https://doi.org/10.17204/dissarch.2025.563


---

[Back to the Pannonia concept](README.md). Working design notes; proposals and historical references are not an announcement of implemented gameplay.
