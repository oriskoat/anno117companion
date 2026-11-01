# Anno 117 Companion

**Your empire. A clearer view.** A free, unofficial companion for Anno 117: Pax Romana by Ádám.

[Download Windows](https://github.com/oriskoat/anno117companion/releases/latest) · [Download Android](https://github.com/oriskoat/anno117companion/releases/latest) · [Windows changelog](CHANGELOG_WINDOWS.md) · [Android changelog](CHANGELOG_ANDROID.md)

Windows first, then any device on your local network. The Windows app reads the game’s production pipe and provides the same dashboard in its own window, on Android, or in a browser on iPhone/another computer.

## Screenshots

**Windows Companion — actual EXE window:**

![Windows Companion with synthetic Example Empire statistics](docs/screenshots/01-windows-home.jpg)

**Actual Android APK and home-screen widget on Samsung:**

| Supply in the app | Home-screen widget |
| --- | --- |
| <img src="docs/screenshots/07-android-supply.png" alt="Actual Samsung APK showing complete Supply suggestions" width="300"> | <img src="docs/screenshots/09-android-widget.png" alt="Clean Samsung launcher widget showing cached Live game data" width="300"> |

[View all 11 screenshots](docs/SCREENSHOTS.md): Windows Supply, chain calculator and Needs; browser route plans and regional import; Android product details; illustrated PDF.

[Open the actual example Empire Summary PDF](docs/Example-Empire-Summary.pdf).

## What it does

- Home, Islands and Products: received production, consumption, local balances, productivity, buildings, workforce, economy fields and technical data.
- Supply suggestions and shared multi-good/multi-stop Trade Route plans. Review transfers one by one; record cargo quantities and check cyclic cargo capacity.
- Production chains by region, tier, good and DLC, with balanced building sets, productivity choices and relevant specialists.
- Region-aware production suggestions: build locally where possible, or choose a suitable island in the producing region and plan import to the original destination.
- Needs by island/tier/category, nominal per-residence rewards, manual fulfilment observations and building area effects.
- Illustrated Empire Summary PDF. On Home, find the small newspaper icon beside Settings.
- Resizable Android widget with scrollable Supply / Local gaps, product icons, Demo/Live, refresh and links into the app.
- Twelve interface languages, official game terminology/dialogue and region artwork.
- Cached data stays visible when the game stops sending statistics. Every source keeps its age/status.

## Start on Windows

1. Download and extract the **Windows-x64.zip** to a writable folder, such as Documents.
2. Run **Anno117Companion.exe**. Python and development tools are not required.
3. Explore **Demo**, or select **Live**, launch Anno with `/pipe`, load a save and open Production Statistics.
4. Keep the Companion running for Live data and other devices. Use **Open browser** if you prefer your normal browser.

Target: Windows 10 22H2 / Windows 11 x64. The embedded window uses .NET Framework 4.8+ and WebView2 109+; a bundled browser-mode controller is offered if those prerequisites are missing. No prerequisite is silently installed. This EXE is unsigned, so Windows reputation/security controls may display a warning. No clean Windows VM certification is claimed. [Compatibility details](docs/WINDOWS_COMPATIBILITY.md).

## Android, iPhone and another computer

- **Android:** install the release APK, pair once using the PC’s LAN address and six-digit code, and choose Demo or Live. Use **More → Add home screen widget**, or your launcher’s Widgets menu.
- **iPhone/browser:** scan the PC’s QR code, or open the displayed address and enter the six-digit code. Safari’s Add to Home Screen provides an icon. The PC must remain available for the browser interface; no native iOS app is included.
- Keep devices on the same trusted LAN. A code alone does not discover the PC address.

The public Android app ID is `hu.anno117.companion`. Older Pipe Probe/development builds use a different ID and can remain installed separately. Public releases use a dedicated signing identity, preserved for future updates. The private key is not in this repository.

## What the numbers mean

The game pipe reports production statistics, not warehouse stock, imports, ships or actual residence/service coverage. A local negative balance may already be covered by trade. Suggestions and routes are plans: apply them manually in Anno. The app never sends game commands.

Nominal catalogue data originates from extracted patch 2.0 resources. Difficulty affects manual residence-demand scenarios, not the already-observed consumption rates or factory recipe ratios. Residence counts, fertility, deposits, unlocks and active DLC ownership are checked in game. Manual need confirmations are stored on the current client; shared route plans are stored on the PC bridge. Rate-to-minute conversion/catalogue coverage and authored translations retain verification limits. The demo is synthetic, using invented Example islands.

## Updates and saved data

Update checks use GitHub Releases. Downloads are verified; Windows restarts to replace the EXE, and Android uses the system installer. Drafts/prereleases are not selected by the current stable updater. Keep `bridge-settings` beside the Windows EXE when replacing it; it contains private pairing, shared route plans and cache. Do not upload that folder or exported PDFs in a bug report.

## Build and test

Windows: Python **3.11 x64** with Tk, then `pip install -r requirements-build.txt` and `.\build_release.ps1 -Version 0.20.0`. The build includes a native-DLL payload audit. Generated dashboard/catalogue resources are checked in; no local game extraction is required to build this snapshot.

Android: JDK 17, Android SDK platform 35 and the Gradle wrapper. Set your own untracked `android-probe/local.properties`, then run `gradlew.bat assembleDebug lintDebug` there. A public release build requires private signing environment variables `ANNO_KEYSTORE`, `ANNO_STORE_PASSWORD`, `ANNO_KEY_ALIAS`, `ANNO_KEY_PASSWORD`; run `assembleRelease lintRelease`. Debug builds use the `.dev` package suffix. Never commit keys or passwords.

Checks: `python -m unittest test_bridge test_trade_routes test_updater test_public test_startup test_report`; with Node 22, `npm ci` then `npm test`.

A source build can be made with your own Android key. It cannot replace official release-signed installs unless the signing identity matches; build output need not be byte-identical across environments.

## About, support and ownership

Made by Ádám, a gamer from Hungary. Free to use; no account, advertisements or mandatory payment.

[Buy me a coffee](https://revolut.me/vafvyop?currency=EUR&amount=500) — optional. No tribute required. The Empire is yours to enjoy.

This is an unofficial community project, not affiliated with or endorsed by Ubisoft. Original application code is MIT-licensed. Anno 117 artwork, official game text/dialogue and game-derived resources remain Ubisoft materials and are **not** relicensed under MIT. Third-party software retains its own licenses. See LICENSE, ASSET_RIGHTS.md, THIRD_PARTY_NOTICES.md and third-party/.

[Privacy](PRIVACY.md). No analytics, advertising SDK or game-data upload. GitHub handles update traffic; Revolut handles optional support. The local HTTP transport is unencrypted and intended for a trusted LAN.
