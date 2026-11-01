# Anno 117 Companion v0.20.2

Observed production and direct import planning for Windows, Android and the dashboard served to local browsers.

## Improved production and import planning

**Build there and plan import** now uses the observed game data on each island card:

- Show production, consumption, local balance and snapshot freshness beside the island artwork.
- List islands with a local surplus first, followed by observed producers and other islands in the compatible production region.
- **Plan this transfer** sends an observed surplus straight into route planning for the original destination. The suggested rate is capped by available local surplus and the destination deficit; partial coverage is labelled.
- **Expand production and plan import** is offered on islands already producing this good. Other compatible islands offer **Build there and plan import**.
- New labels and explanations are translated in all twelve interface languages.

Observed production is useful evidence for choosing an island, but does not confirm the full chain can be built locally: inputs may already be imported. Local balances exclude imports and warehouse stocks. Shipment quantities per visit remain manual. Existing routes and stock levels are not reported by the game.

Island images remain regional illustrations, not screenshots of your actual islands.

## Downloads and updates

- **Windows:** download `Anno117Companion-0.20.2-Windows-x64.zip`, or use **More → Updates** in the Companion. The updater uses the separately supplied `Anno117Companion.exe`. Settings and route plans stay in the existing writable folder.
- **Android 8.0+:** download `Anno-Companion-0.20.2.apk`, or check for updates in the public Android app. Android asks you to approve installation. Package `hu.anno117.companion`, versionCode **23**, signed with the same release certificate as 0.20.0.
- Older developer installs named `hu.anno117.pipeprobe` (including 0.19.0) are a separate application. Install the public APK; they cannot be upgraded in place to the public package.
- **iPhone and other LAN browsers:** update the Windows Companion and reload the local page. There is no native iOS installer.
- **Source + resources:** `Anno117Companion-0.20.2-source.zip` matches both binaries and includes the synthetic demo.
- `SHA256SUMS.txt`, `release-manifest.json` and `SIGNING_CERTIFICATE.txt` identify the release files.

The Windows EXE remains unsigned. No game data or pairing codes are sent to GitHub during update checks.

## Setup

[English setup](https://github.com/oriskoat/anno117companion#start-on-windows) · [Deutsche Anleitung](https://github.com/oriskoat/anno117companion/blob/main/README.de.md#start-unter-windows)

Enable `/pipe`, restart Anno, load your save, let simulation time run and open Production Statistics. While paused, the game sends no new statistics; the Companion retains the last received values and shows their age. Keep the Windows Companion running for connected devices.
