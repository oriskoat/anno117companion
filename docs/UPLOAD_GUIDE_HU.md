> Historical 0.20.0 publication checklist. Current downloads and patch notes are in README.md and RELEASE_NOTES.md.

# GitHub feltöltés — 0.20.0

Minden helyben előkészítve. Ezzel még semmi nem került fel a GitHubra.

## 1. Forrás a repositoryba

Cél: https://github.com/oriskoat/anno117companion

A `Anno117Companion-0.20.0-source.zip` tartalmát csomagold ki egy új mappába. Ennek TARTALMA menjen a repository gyökerébe: README.md, Python fájlok, android-probe, localization, docs, third-party és a rejtett .github/.gitignore is. Ne egy külön source almappába kerüljön. GitHub Desktop vagy git használata javasolt a sok képfájl miatt; a böngészős drag-and-drop korlátokba futhat.

Ne az eredeti fejlesztői anno117-pipe mappát töltsd fel. Ne kerüljön fel bridge-settings, captures, game-data, private, node_modules, build, local.properties, keystore, napló vagy saját játékadat. A mellékelt forrás ZIP már ezek nélkül készült.

Javasolt repository description: Free unofficial Anno 117 companion for Windows, Android and local browsers: production, supply, chains and trade-route planning.
Topics: anno117, anno, companion, android, windows, production-chains, trade-routes

## 2. Release

A forrást tartalmazó commitból készíts `v0.20.0` taget és azzal GitHub Release-t. Cím: Anno 117 Companion v0.20.0. A leírás a RELEASE_NOTES.md tartalma.

Feltöltendő release assetek:

- Anno117Companion-0.20.0-Windows-x64.zip
- Anno117Companion.exe — pontosan ez a név kell a Windows updaternek
- Anno-Companion-0.20.0.apk
- Anno117Companion-0.20.0-source.zip
- SHA256SUMS.txt
- release-manifest.json
- SIGNING_CERTIFICATE.txt

A screenshots mappa képeit a README már tartalmazza docs/screenshots alatt. A release leírásba is betehetők. Az útmutató és a Reddit-tervezet nem szükséges külön release assetként.

Először draftként ellenőrizd a tartalmat. A stable updater csak a közzétett, nem prerelease kiadást fogja felajánlani. A csomag jelenleg nincs publikálva; a manifest published:false értéke ezt az előkészítési állapotot jelzi.

## 3. Próba és Reddit

Nézd meg kijelentkezett/privát böngészőből a letöltési linkeket. Windows: ZIP kibontás, EXE, Demo. Android: APK telepítés, Demo; Live-hoz új párosítás. Az új publikus Android app külön azonosítót kapott, a régi fejlesztői alkalmazást nem írja felül.

A REDDIT_POST.md tartalmazza az angol címet, szöveget és a képek sorrendjét. Csak működő nyilvános letöltés után posztold.

## Frissítések

A privát Android aláírókulcsot és a hozzá tartozó jelszavakat őrizd meg biztonságos offline mentésben. Nincsenek a csomagban. Ugyanaz a kulcs kell a későbbi frissítésekhez; a publikus tanúsítvány-ujjlenyomat nem helyettesíti. A következő verzióban mindkét platform verzióját és az APK versionCode-ját is növelni kell.

A Windows EXE nincs kódaláírva. A cél Windows 10 22H2 / Windows 11 x64; tiszta VM-teszt még nincs. A README és a release leírás ezt közli. A játékhoz tartozó képek és szövegek tulajdonosa továbbra is Ubisoft; az MIT csak az eredeti alkalmazáskódra vonatkozik.

## Frissített bemutatóképek

A screenshots mappában 11 ellenőrzött kép van: 4 natív Windows EXE, 2 helyi böngészős nézet, 3 valódi Samsung-kép (APK és widget), 2 PDF-oldal. A forrás docs/SCREENSHOTS.md fájlja minden képhez angol képaláírást ad. A Reddithez javasolt nyolcas sorrend a REDDIT_POST.md végén található. A képek Example Empire demóadatokat mutatnak, kivéve a szerző által beállított tiszta widgetoldalt, amely saját játékból származó mentett Live-adatokat jelez. Az Example-Empire-Summary.pdf valódi program-export, opcionális release assetként is feltölthető.
