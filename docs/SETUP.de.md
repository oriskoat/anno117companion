# Einrichtung & Fehlerbehebung

[← Companion-Übersicht](../README.de.md) · [English](SETUP.md)

## Start unter Windows

### 1. Companion herunterladen und öffnen

1. **[Windows-ZIP direkt herunterladen](https://github.com/oriskoat/anno117companion/releases/download/v0.28.0/Anno117Companion-0.28.0-Windows-x64.zip)** oder das Windows-ZIP auf der [neuesten Release-Seite](https://github.com/oriskoat/anno117companion/releases/latest) wählen. **Code → Download ZIP** auf GitHub lädt den Quellcode herunter, nicht die startfertige App.
2. Das heruntergeladene ZIP mit der rechten Maustaste anklicken und **Alle extrahieren** wählen. Einen beschreibbaren Ordner verwenden, zum Beispiel `Dokumente\Anno117Companion`. Die EXE aus dem entpackten Ordner starten, nicht direkt aus dem ZIP.
3. **Anno117Companion.exe** öffnen. Python, Android Studio oder Entwicklungswerkzeuge sind nicht erforderlich.
4. **Demo** wählen, um das erfundene „Example Empire“ ohne laufendes Spiel kennenzulernen. Die obere Leiste enthält Serversteuerung, Demo/Live und die Kopplungsdaten für weitere Geräte. Bei Bedarf die eingeklappte Leiste öffnen.
5. Für den eigenen Spielstand `/pipe` wie unten beschrieben aktivieren und **Live** wählen. Auf dem Spiele-PC nur eine Companion-Instanz laufen lassen.

Zielplattform: Windows 10 22H2 / Windows 11 **x64**. Das integrierte Fenster benötigt .NET Framework 4.8+ und WebView2 109+. Fehlen diese Komponenten, bietet die mitgelieferte Browsersteuerung **Open browser** an. Damit lässt sich die Oberfläche im installierten Browser verwenden. Voraussetzungen werden nicht ungefragt installiert. Die EXE ist nicht digital signiert; Windows kann eine Sicherheits-/Reputationswarnung anzeigen. Eine Zertifizierung auf einer sauberen Windows-VM liegt nicht vor. [Kompatibilitätsdetails, Englisch](WINDOWS_COMPATIBILITY.md).

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

1. **[Android-APK direkt herunterladen](https://github.com/oriskoat/anno117companion/releases/download/v0.28.0/Anno-Companion-0.28.0.apk)** und die heruntergeladene Datei auf dem Telefon öffnen.
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

Der Katalog verwendet extrahierte Daten von Spielupdate 3.0 für Latium, Albion und Aegyptus. Der Schwierigkeitsgrad verändert manuelle Wohnhaus-Bedarfsszenarien, nicht bereits gemessenen Verbrauch oder nominelle Rezeptverhältnisse. Ein passender Spielstand kann aufgezeichnete Wohnhäuser, Lagerbestände, Fruchtbarkeit, Gebäude, Forschung und Gegenstandszuweisungen liefern. Abdeckung, fehlende Werte und hypothetische Bauplätze bleiben bedingt. Manuelle Bedürfnisbeobachtungen bleiben auf dem Gerät, gemeinsame Routenpläne auf der PC-Bridge. Die Demo ist erfunden.

## Updates und gespeicherte Daten

Die App sucht über GitHub Releases nach Updates und prüft Downloads. Windows startet zum Ersetzen der EXE neu; Android verwendet den Systeminstaller. Entwürfe und Vorabversionen werden vom stabilen Updater nicht ausgewählt. Beim Austausch der Windows-EXE den danebenliegenden Ordner `bridge-settings` beibehalten: Er enthält private Kopplungsdaten, gemeinsame Routen und den Cache. Diesen Ordner und persönliche PDFs nicht an Fehlerberichte anhängen.

## Save Insights verwenden

Im Windows Companion **Live** auswählen, **Use save data** aktivieren und über **Choose different save** Kampagne und Datei prüfen. Frische, passende Pipe-Beobachtungen haben bei Produktionsraten Vorrang. Gespeicherte Bestände, Gebäude, Bevölkerung und Fortschritt bleiben getrennte Informationen. Ohne neue Pipe-Daten bleibt der aufgezeichnete Stand nutzbar. Ein neueres Speicherdatum beweist allein nicht, dass auch die gespeicherte Statistik neuer ist.

Der Companion liest Spielstände lokal und verändert sie nicht. Bei unerwarteten Inselnamen oder Erfüllungsständen die gewählte Kampagne kontrollieren. Mehrdeutige automatische Zuordnungen benötigen eine ausdrückliche Auswahl.

[Planung und Berechnungsgrenzen, Englisch](RELEASE_028.md) · [Selbst bauen, Englisch](BUILD.md) · [Datenschutz, Englisch](../PRIVACY.md)
