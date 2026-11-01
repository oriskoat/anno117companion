# Anno 117 Companion

[English](README.md) · **Deutsch**

**Dein Imperium. Klarer im Blick.** Ein kostenloser, inoffizieller Companion für Anno 117: Pax Romana von Ádám.

[Windows-ZIP herunterladen](https://github.com/oriskoat/anno117companion/releases/download/v0.20.2/Anno117Companion-0.20.2-Windows-x64.zip) · [Android-APK herunterladen](https://github.com/oriskoat/anno117companion/releases/download/v0.20.2/Anno-Companion-0.20.2.apk) · [Alle Downloads / neueste Version](https://github.com/oriskoat/anno117companion/releases/latest)

☕ **[Spendier mir einen Kaffee](https://revolut.me/vafvyop?currency=EUR&amount=500)** — der Companion ist kostenlos. Unterstützung ist vollkommen freiwillig. Kein Tribut erforderlich.

[Windows-Änderungsverlauf](CHANGELOG_WINDOWS.md) · [Android-Änderungsverlauf](CHANGELOG_ANDROID.md) — beide auf Englisch.

Zuerst Windows, danach jedes Gerät in deinem lokalen Netzwerk: Die Windows-App liest die Produktions-Pipe des Spiels und stellt dieselbe Übersicht im eigenen Fenster, in der Android-App oder im Browser auf einem iPhone beziehungsweise weiteren Computer bereit.

## Screenshots

**Windows Companion — das tatsächliche EXE-Fenster:**

![Windows Companion mit erfundenen Beispieldaten](docs/screenshots/01-windows-home.jpg)

**Tatsächliche Android-App und Startbildschirm-Widget auf einem Samsung:**

| Versorgungsvorschläge in der App | Startbildschirm-Widget |
| --- | --- |
| <img src="docs/screenshots/07-android-supply.png" alt="Samsung-App mit vollständigen Versorgungsvorschlägen" width="300"> | <img src="docs/screenshots/09-android-widget.png" alt="Samsung-Widget mit zwischengespeicherten Live-Spieldaten ohne persönliche Verknüpfungen" width="300"> |

[Alle 13 Screenshots mit englischen Beschreibungen](docs/SCREENSHOTS.md): Windows-Versorgung, Produktionsrechner und Bedürfnisse; Routen und regionaler Import im Browser; Android-Produktdetails; illustrierter PDF-Bericht.

[Den tatsächlich exportierten Beispielbericht als PDF öffnen](docs/Example-Empire-Summary.pdf).

## Funktionen

- **Home, Islands und Products:** empfangene Produktion, Verbrauch, lokale Bilanzen, Produktivität, Gebäude, Arbeitskräfte, Wirtschaftswerte und technische Daten.
- **Supply:** Versorgungsvorschläge aus lokalen Überschüssen und Defiziten. **Trade Routes:** gemeinsam gespeicherte Pläne mit mehreren Waren und Zwischenstopps; manuelle Frachtmengen und Prüfung der Laderaumkapazität auf einer Rundroute.
- Produktionsketten nach Region, Bevölkerungsstufe, Ware und DLC, mit ausgeglichenen Gebäudeverhältnissen, Produktivität und passenden Spezialisten.
- Regionale Bau- und Importvorschläge: vor Ort produzieren, wenn möglich; andernfalls eine geeignete Produktionsinsel in der anderen Region wählen und zur ursprünglichen Zielinsel importieren.
- Bedürfnisse nach Insel, Stufe und Kategorie, nominelle Boni pro Wohnhaus, manuelle Bestätigungen und Flächeneffekte von Produktionsgebäuden.
- Illustrierter **Empire Summary**-PDF-Bericht: Auf Home befindet sich das kleine Zeitungssymbol neben den Einstellungen.
- Größenveränderbares Android-Widget mit scrollbaren Versorgungsvorschlägen/lokalen Defiziten, Warenbildern, Demo/Live, Aktualisierung und Links zur App.
- Zwölf Oberflächensprachen sowie offizielle Spielbegriffe, Dialogzeilen und Regionsbilder.
- Die zuletzt empfangenen Werte bleiben bei ausbleibenden Spielnachrichten sichtbar. Alter und Zustand der Daten werden angezeigt.

## Start unter Windows

### 1. Companion herunterladen und öffnen

1. **[Windows-ZIP direkt herunterladen](https://github.com/oriskoat/anno117companion/releases/download/v0.20.2/Anno117Companion-0.20.2-Windows-x64.zip)** oder das Windows-ZIP auf der [neuesten Release-Seite](https://github.com/oriskoat/anno117companion/releases/latest) wählen. **Code → Download ZIP** auf GitHub lädt den Quellcode herunter, nicht die startfertige App.
2. Das heruntergeladene ZIP mit der rechten Maustaste anklicken und **Alle extrahieren** wählen. Einen beschreibbaren Ordner verwenden, zum Beispiel `Dokumente\Anno117Companion`. Die EXE aus dem entpackten Ordner starten, nicht direkt aus dem ZIP.
3. **Anno117Companion.exe** öffnen. Python, Android Studio oder Entwicklungswerkzeuge sind nicht erforderlich.
4. **Demo** wählen, um das erfundene „Example Empire“ ohne laufendes Spiel kennenzulernen. Die obere Leiste enthält Serversteuerung, Demo/Live und die Kopplungsdaten für weitere Geräte. Bei Bedarf die eingeklappte Leiste öffnen.
5. Für den eigenen Spielstand `/pipe` wie unten beschrieben aktivieren und **Live** wählen. Auf dem Spiele-PC nur eine Companion-Instanz laufen lassen.

Zielplattform: Windows 10 22H2 / Windows 11 **x64**. Das integrierte Fenster benötigt .NET Framework 4.8+ und WebView2 109+. Fehlen diese Komponenten, bietet die mitgelieferte Browsersteuerung **Open browser** an. Damit lässt sich die Oberfläche im installierten Browser verwenden. Voraussetzungen werden nicht ungefragt installiert. Die EXE ist nicht digital signiert; Windows kann eine Sicherheits-/Reputationswarnung anzeigen. Eine Zertifizierung auf einer sauberen Windows-VM liegt nicht vor. [Kompatibilitätsdetails, Englisch](docs/WINDOWS_COMPATIBILITY.md).

### 2. Statistik-Pipe des Spiels aktivieren

**Das Startargument lautet `/pipe`, einschließlich des Schrägstrichs.** Es gehört in die Startoptionen des Spiels, nicht in den Companion, einen Spielchat oder eine Konsole. Nach dem Hinzufügen muss das Spiel neu gestartet werden. Ubisoft beschreibt die Aktivierung im [Anno-117-Pipe-Beispiel](https://github.com/UbisoftMainzAnno/anno117_pipe_example#activation).

**Ubisoft Connect**

1. Anno 117 beenden, falls es bereits läuft.
2. In der Ubisoft-Connect-Bibliothek **Anno 117: Pax Romana** auswählen.
3. Im Menü beziehungsweise den Einstellungen des Spiels **Eigenschaften / Properties** öffnen. Je nach Launcher-Version ist dies über das Spielmenü, einen Rechtsklick oder **Verwalten / Manage** erreichbar.
4. Den Bereich für **Startargumente / Game launch arguments / Add launch arguments** öffnen, `/pipe` hinzufügen und speichern. Bereits vorhandene Argumente beibehalten und `/pipe` mit einem Leerzeichen anhängen.
5. Anno über diesen Launcher erneut starten.

**Steam**

1. Anno beenden. In der Steam-Bibliothek mit der rechten Maustaste auf das Spiel klicken und **Eigenschaften → Allgemein** öffnen.
2. Unter **Startoptionen** `/pipe` ergänzen; vorhandene Argumente beibehalten. Eigenschaften schließen und das Spiel neu starten. [Steam-Anleitung zu Startoptionen](https://help.steampowered.com/en/faqs/view/7D01-D2DD-D75E-2955).
3. Falls die Steam-Version über Ubisoft Connect startet und keine Daten eintreffen, zusätzlich die Anno-Startargumente in Ubisoft Connect prüfen.

### 3. Erste Live-Statistiken empfangen

**Das Spiel liefert neue Statistiken nur bei laufender Simulation — nicht während einer Pause.** Lass das Spiel zunächst laufen, bis mindestens einmal Statistiken empfangen wurden. Wenn du danach pausierst, zeigt der Companion weiterhin die **zuletzt empfangenen Daten** einschließlich der daraus berechneten Versorgungsvorschläge. Ältere Werte werden als **Cached** mit ihrem Alter gekennzeichnet. Während der Pause werden keine Änderungen erfunden oder hochgerechnet. Sobald du die Simulation fortsetzt und das Spiel wieder Statistiken sendet, aktualisieren sich die Werte automatisch. Wurden noch keine Daten empfangen, kann im pausierten Zustand auch kein erster Datenstand angezeigt werden.

1. Den **lokalen Server** im Companion laufen lassen und **Live** wählen.
2. In Anno einen Spielstand laden und die **Simulation fortsetzen**.
3. Die **Produktionsstatistik** über die Statistikoberfläche des Spiels öffnen. Kurz warten: Inseln können nacheinander aktualisiert werden.
4. Den Status im Companion prüfen. **Live + cached** bedeutet, dass einige Inseln frische Daten haben und andere noch ihre vorherigen Werte verwenden. Jede Insel zeigt ihr eigenes Datenalter.
5. Beim Pausieren, Verlassen der Statistikansicht oder Beenden des Spiels kann die Datenübertragung aussetzen. Die letzten Werte bleiben als **Cached** mit Altersangabe sichtbar. Live bedeutet „meine Spielverbindung verwenden“, nicht „in diesem Augenblick trifft eine neue Nachricht ein“.

Das vollständige Werkzeug funktioniert im EXE-Fenster oder über **Open browser**. Für andere Geräte muss die Windows-App weiterlaufen. Minimieren ist möglich; Schließen beendet ihren Server.

## Android, iPhone und weiterer Computer

### Vor dem Koppeln

- Windows Companion starten und den lokalen Server laufen lassen. Die Kopplungsleiste zeigt **PC-Adresse**, **sechsstelligen Code** und **QR-Code**; gegebenenfalls aufklappen.
- PC und Telefon/Tablet/Laptop mit demselben vertrauenswürdigen Netzwerk verbinden. Der PC darf per Ethernet und das Telefon per WLAN verbunden sein.
- Die im Companion angezeigte Adresse einschließlich Port verwenden, beispielsweise `http://192.168.1.50:11780`. Das ist nur ein Beispiel: **die tatsächlich angezeigte PC-Adresse** verwenden. `localhost` auf dem Telefon bezeichnet nicht den PC. Der sechsstellige Code allein findet den PC nicht.
- Bei einer Windows-Firewall-Abfrage den Companion im vertrauenswürdigen **privaten Netzwerk** zulassen. Gast-WLAN, Geräteisolierung oder VPN können die Verbindung zwischen Geräten verhindern.

### Android-App

1. **[Android-APK direkt herunterladen](https://github.com/oriskoat/anno117companion/releases/download/v0.20.2/Anno-Companion-0.20.2.apk)** und die heruntergeladene Datei auf dem Telefon öffnen.
2. Falls Android eine Installationsberechtigung für Browser/Dateimanager verlangt, diese Installationsquelle prüfen und für die Installation erlauben. Die APK wird direkt installiert, nicht über den Play Store.
3. **Anno Companion** öffnen. Demo funktioniert ohne Kopplung und ohne Spiel.
4. **Live** wählen. Ohne Kopplung öffnet sich die Verbindungsansicht. Die PC-Adresse und den aktuellen sechsstelligen Code aus der Windows-App eingeben und verbinden.
5. Die Kopplung wird gespeichert. Bei abgelaufenem Code den aktuellen Code am PC verwenden. Windows-Benutzername, Windows-Passwort und SMB-Zugriff sind nicht erforderlich.
6. Für das Widget **More → Add home screen widget** wählen und die Platzierung im Launcher bestätigen; alternativ das Widget-Menü des Launchers verwenden. Das Widget besitzt eine eigene Demo/Live-Steuerung. Hintergrundaktualisierungen hängen von Android ab; bei Bedarf die Aktualisierungstaste verwenden.

Erfordert Android **8.0+**. Die öffentliche App-ID ist `hu.anno117.companion`. Ältere Pipe-Probe-/Entwicklungsinstallationen haben eine andere ID und bleiben getrennte Apps. Die öffentliche App einmal koppeln. Öffentliche Updates behalten Paketkennung und dedizierte Signatur bei. Der private Signaturschlüssel ist nicht im Repository enthalten.

### iPhone / iPad

1. Den QR-Code der Windows-App mit der Kamera scannen und den Link in Safari öffnen. Alternativ die angezeigte PC-Adresse eingeben und bei Aufforderung den sechsstelligen Code verwenden.
2. **Live** für die eigenen Statistiken oder **Demo** für das Beispielimperium wählen.
3. Für ein Symbol in Safari **Teilen → Zum Home-Bildschirm** verwenden. Die Bezeichnungen können je nach iOS-Version abweichen.
4. Die PC-App weiterlaufen lassen und im selben Netzwerk bleiben. Es gibt keine native iOS-App; verwendet wird die lokale Weboberfläche.

### Weiterer Computer

Die angezeigte PC-Adresse im Browser des anderen Computers öffnen, den sechsstelligen Code eingeben und Demo oder Live wählen. Auf dem Anzeigecomputer sind weder ein zweiter Bridge-Prozess noch das Spiel erforderlich.

## Wenn die Verbindung nicht funktioniert

| Anzeige / Problem | Prüfen |
| --- | --- |
| Live gewählt, aber Cached | Spiel fortsetzen; prüfen, ob `/pipe` vor dem letzten Spielstart gesetzt wurde; Produktionsstatistik schließen und erneut öffnen. Datenalter der einzelnen Inseln beachten. |
| Live + cached | Einige Inseln werden bereits aktualisiert. Andere behalten ihre letzten Werte, bis das Spiel neue Daten für sie sendet. |
| Waiting for Anno / keine Inseln | Spielstand laden und Produktionsstatistik öffnen. Nur ein Pipe-Lesewerkzeug gleichzeitig starten: Ein zweiter Companion oder anderer Pipe-Reader kann die Pipe belegen. |
| Telefon erreicht den PC nicht | Windows-Server, tatsächliche IP/Port, gemeinsames LAN, Firewall-Freigabe für private Netzwerke, Gastnetz-Isolierung und VPN prüfen. |
| Kopplungscode abgelehnt | Aktuellen sechsstelligen PC-Code verwenden. Er läuft ab beziehungsweise wechselt und ist nicht die Windows-PIN oder das Passwort. Nach mehreren Fehlversuchen eine Minute warten. |
| Integriertes Windows-Fenster nicht verfügbar | **Open browser** in der angebotenen Steuerung verwenden. Expliziter Browserstart aus dem entpackten Ordner: `Anno117Companion.exe --browser`. |
| Zweite Companion-Instanz startet nicht | Vorherige Instanz schließen. Der Serverport kann bereits belegt sein. |

Für Fehlerberichte Plattform, Companion-Version, sichtbaren Verbindungszustand und Schritte zum Nachstellen angeben. Keine `bridge-settings`, Kopplungscodes, QR-Codes, Tokens oder persönlichen Exporte hochladen.

## Bedeutung der Zahlen

Die Spiel-Pipe liefert Produktionsstatistiken, aber keine Lagerbestände, tatsächlichen Importe, Schiffe oder gemessene Wohnhaus-/Dienstleistungsabdeckung. Eine negative lokale Bilanz kann durch Handel bereits ausgeglichen sein. Vorschläge und Routen sind Pläne, die im Spiel manuell umgesetzt werden. Die App sendet keine Spielbefehle.

Die nominellen Katalogwerte stammen aus extrahierten Ressourcen von Patch 2.0. Der Schwierigkeitsgrad betrifft manuelle Wohnhaus-Bedarfsszenarien, nicht den bereits gemessenen Verbrauch oder die Rezeptverhältnisse. Wohnhausanzahl, Fruchtbarkeit, Vorkommen, Freischaltungen und aktiven DLC-Besitz im Spiel prüfen. Manuelle Bedürfnisbestätigungen werden auf dem jeweiligen Gerät gespeichert, gemeinsame Routen auf der PC-Bridge. Die Umrechnung der Raten in Minutenwerte, die Katalogabdeckung und selbst erstellte Übersetzungen haben weiterhin Prüfgrenzen. Die mitgelieferte Demo verwendet erfundene Example-Inseln; der ausdrücklich beschriftete Widget-Screenshot zeigt zwischengespeicherte Live-Daten des Autors.

## Updates und gespeicherte Daten

Die App sucht über GitHub Releases nach Updates und prüft Downloads. Windows startet zum Ersetzen der EXE neu; Android verwendet den Systeminstaller. Entwürfe und Vorabversionen werden vom stabilen Updater nicht ausgewählt. Beim Austausch der Windows-EXE den danebenliegenden Ordner `bridge-settings` beibehalten: Er enthält private Kopplungsdaten, gemeinsame Routen und den Cache. Diesen Ordner und persönliche PDFs nicht an Fehlerberichte anhängen.

## Selbst bauen und testen

**Windows:** Python **3.11 x64** mit Tk installieren, `pip install -r requirements-build.txt` und anschließend `.\build_release.ps1 -Version 0.20.2` ausführen. Der Build prüft die nativen DLL-Abhängigkeiten. Die erzeugten Dashboard-/Katalogressourcen sind enthalten; zum Bauen dieses Standes ist keine lokale Spielextraktion nötig.

**Android:** JDK 17, Android SDK Plattform 35 und den Gradle Wrapper verwenden. Eine eigene, nicht eingecheckte Datei `android-probe/local.properties` anlegen und in diesem Ordner `gradlew.bat assembleDebug lintDebug` ausführen. Ein Release-Build benötigt die privaten Signatur-Umgebungsvariablen `ANNO_KEYSTORE`, `ANNO_STORE_PASSWORD`, `ANNO_KEY_ALIAS`, `ANNO_KEY_PASSWORD`; danach `assembleRelease lintRelease`. Debug-Builds verwenden den Paket-Zusatz `.dev`. Schlüssel und Passwörter niemals einchecken.

**Tests:** `python -m unittest test_bridge test_trade_routes test_updater test_public test_startup test_report`; mit Node 22 zunächst `npm ci`, danach `npm test`.

Ein selbst gebautes APK kann mit einem eigenen Schlüssel signiert werden. Es kann offizielle Release-Installationen nur ersetzen, wenn die Signaturidentität übereinstimmt. Builds müssen zwischen verschiedenen Umgebungen nicht byteidentisch sein.

## Pannonia — eine weitere Idee

Meine nächste Idee ist eine **von Albion inspirierte pannonische Region für Anno 117**. Dafür gibt es jetzt einen eigenen [Pannonia-Konzeptordner](.ideas/README.md) in diesem Repository. Der ausführliche Entwurf beschreibt zwei Bevölkerungswege, Obstgärten und Korbflechterei, Pferdezucht, Monumente und das Grenznetz der Ripa Pannonica. Das Konzept ist vom Companion getrennt; eine spielbare Mod oder ein Veröffentlichungstermin sind nicht angekündigt. Die Konzeptbeschreibung und die ergänzenden Planungsnotizen sind auf Englisch.

## Über den Autor, Unterstützung und Rechte

Entwickelt von Ádám, einem Spieler aus Ungarn. Kostenlos nutzbar, ohne Konto, Werbung oder verpflichtende Zahlung.

[Spendier mir einen Kaffee](https://revolut.me/vafvyop?currency=EUR&amount=500) — freiwillig. Kein Tribut erforderlich. Viel Freude mit deinem Imperium!

Dies ist ein inoffizielles Community-Projekt ohne Verbindung zu oder Unterstützung durch Ubisoft. Der ursprüngliche Anwendungscode steht unter MIT-Lizenz. Anno-117-Grafiken, offizielle Spieltexte/Dialoge und aus dem Spiel abgeleitete Ressourcen bleiben Ubisoft-Materialien und werden **nicht** unter MIT neu lizenziert. Drittanbieter-Software behält ihre eigenen Lizenzen. Siehe [LICENSE](LICENSE), [ASSET_RIGHTS.md](ASSET_RIGHTS.md), [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) und `third-party/`.

[Datenschutz, Englisch](PRIVACY.md). Keine Analyse-, Werbe-SDKs oder Uploads deiner Spieldaten. GitHub verarbeitet Update-Verkehr, Revolut die freiwillige Unterstützung. Die lokale HTTP-Verbindung ist unverschlüsselt und für ein vertrauenswürdiges LAN gedacht.
