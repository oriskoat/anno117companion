# Anno 117 Companion v0.20.1

A small visual fix for Windows, Android and the dashboard served to local browsers.

## Fixed

The **Build there and plan import** island picker now displays distinct artwork from the existing regional island gallery. Previously it used a pale Needs icon, leaving the island cards looking empty. Source selection still preserves the original import destination.

These are regional illustrations, not screenshots of your actual islands.

## Downloads and updates

- **Windows:** download `Anno117Companion-0.20.1-Windows-x64.zip`, or use **More → Updates** in the Companion. The updater uses the separately supplied `Anno117Companion.exe`. Settings and route plans stay in the existing writable folder.
- **Android 8.0+:** download `Anno-Companion-0.20.1.apk`, or check for updates in the public Android app. Android asks you to approve installation. Package `hu.anno117.companion`, versionCode **22**, signed with the same release certificate as 0.20.0.
- Older developer installs named `hu.anno117.pipeprobe` (including 0.19.0) are a separate application. Install the public APK; they cannot be upgraded in place to the public package.
- **iPhone and other LAN browsers:** update the Windows Companion and reload the local page. There is no native iOS installer.
- **Source + resources:** `Anno117Companion-0.20.1-source.zip` matches both binaries and includes the synthetic demo.
- `SHA256SUMS.txt`, `release-manifest.json` and `SIGNING_CERTIFICATE.txt` identify the release files.

The Windows EXE remains unsigned. No game data or pairing codes are sent to GitHub during update checks.

## Setup

[English setup](https://github.com/oriskoat/anno117companion#start-on-windows) · [Deutsche Anleitung](https://github.com/oriskoat/anno117companion/blob/main/README.de.md#start-unter-windows)

Enable `/pipe`, restart Anno, load your save, let simulation time run and open Production Statistics. While paused, the game sends no new statistics; the Companion retains the last received values and shows their age. Keep the Windows Companion running for connected devices.
