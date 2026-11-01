# Anno 117 Companion v0.20.0

A free, unofficial Windows + Android companion, with the same dashboard available in a local browser on iPhone, tablet or another computer.

## Downloads

- **Windows:** `Anno117Companion-0.20.0-Windows-x64.zip` — extract into a writable folder and launch the EXE. Python is bundled.
- **Android 8.0+:** `Anno-Companion-0.20.0.apk` — release-signed installation. Live data needs the Windows Companion on the same LAN.
- **Source + resources:** `Anno117Companion-0.20.0-source.zip` — the staged source used for both builds, including the dashboard, catalogue, artwork and synthetic demo.
- `Anno117Companion.exe` is also supplied directly for the Windows updater. `SHA256SUMS.txt` and `release-manifest.json` identify the files.

## In this release

Browse production and consumption by island or good; group Supply by progression or source/destination; plan shared multi-good Trade Routes; explore regional production chains, specialists, DLC alternatives and tier needs. Export an illustrated empire PDF from the newspaper icon on Home. Android includes a scrollable home-screen widget. The shared UI supports twelve game languages.

Product Overview now offers a clear production alternative under Supply. Build locally when the producer belongs to the destination region. For example, Albion demand for Olives instead offers building in Latium and importing to the original Albion island. Choose a producing island, review the chain, and continue into shipment planning. A Back action returns to the previous view. Planned new production is labelled explicitly; cargo per visit is entered manually.

Live data with some older island snapshots is now labelled **Live + cached**, with separate counts, rather than presenting the whole empire as cached. Per-island and transfer ages remain visible; the PDF and Android widget use the same distinction.

Both platforms are version 0.20.0. Their individual development histories are in CHANGELOG_WINDOWS.md and CHANGELOG_ANDROID.md. Earlier development checkpoints were not all public releases.

## Setup guides

[Detailed English setup](https://github.com/oriskoat/anno117companion#start-on-windows) · [Deutsche Anleitung](https://github.com/oriskoat/anno117companion/blob/main/README.de.md#start-unter-windows)

## Connect

Start the Windows app, enable `/pipe` in Anno's launch options, load a save and open Production Statistics. Pair other devices with the LAN address plus six-digit code, or scan the QR code. The PC must remain running. Demo is available without the game; it uses invented Example islands. Pause can stop game messages, so the last cached statistics remain visible with their age.

## Please read

Statistics describe local production/consumption, not warehouse stock or actual trade. Suggestions are manual plans, not automatic game actions. Residence counts, fertility, deposits, unlocks and active DLC ownership must be checked in game. Catalogue values are derived from patch 2.0 resources and may need revision after game updates.

Windows targets Windows 10 22H2 / Windows 11 x64. The embedded window requires .NET Framework 4.8+ and WebView2 109+; the bundled browser controller provides a fallback. The EXE is unsigned. Dependency audits and isolated startup checks passed on the development PC; a clean Windows VM was not tested.

The public Android package is **hu.anno117.companion**, versionCode 21, signed with a dedicated release certificate. Old Pipe Probe/development installations are separate apps: this APK does not migrate their pairing/settings. Pair the public app once. Future public releases retain its package and certificate. See SIGNING_CERTIFICATE.txt.

Update checks use stable GitHub Releases. Version 0.20.0 is published as the latest stable release. The former development Android package cannot be upgraded in place: install the public APK separately and pair it once. Keep the Windows bridge-settings folder when upgrading; never upload it.

Unofficial community project, not affiliated with or endorsed by Ubisoft. Original code is MIT; Ubisoft resources retain their ownership and are not relicensed under MIT. See the included notices. No account, analytics, advertisements or mandatory payment.

[Optional coffee support](https://revolut.me/vafvyop?currency=EUR&amount=500). No tribute required. The Empire is yours to enjoy.
