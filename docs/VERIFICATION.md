# v0.20.1 patch verification

- Shared production/import island picker uses existing region-gallery photos; every candidate has an existing image and different islands receive different images where available.
- Regression test clicks a source card and confirms the original import destination, deficit and return navigation remain intact.
- All three JavaScript suites and the Python regression suite pass.
- Desktop (1440px) and mobile (390px) browser checks: images load with nonzero natural dimensions, no horizontal overflow.
- Windows dependency audit and EXE self-test are run on the release build. Android release build and lint use the existing public signing identity, versionCode 22.
- Release packaging checks every embedded dashboard file against this source in both EXE and APK, and verifies the synthetic demo, APK identity and certificate.
- Updater metadata and anonymous public downloads are checked after publication. A manual end-to-end update on the user's devices remains a separate test.

The historical verification record below describes 0.20.0.

---

# Release candidate verification — 0.20.0

Initial build verification on 2026-11-01, before publication. Version 0.20.0 was subsequently published that day. The post-publication checks below describe its current public state.

- Source Python suite: 28 tests passed (bridge/protocol, pairing, route persistence/validation, updater, public import boundary, startup fallback and PDF).
- Source dashboard: all three Node/jsdom suites passed. Eight pages, image references, twelve locales, repeated product selections, Needs isolation and regional production/import/return flow checked.
- Real Edge browser against the staged bridge: Home, Supply, Needs, regional product detail and mobile layout rendered; no JavaScript page errors. Albion Olives -> Latium producer -> manual shipment -> Back retained the destination and chain context.
- Windows EXE: 87 bundled native binaries audited; no missing declared payload or unexpected external DLL. Offline standalone self-test passed from a Unicode/spaced folder with PATH restricted to System32 and development runtime variables removed: QR PNG, PNG/WebP, PDF/fonts, Tcl/Tk, .NET WinForms and WebView2 loader.
- Android: assembleRelease and lintRelease passed. APK signature verified against the dedicated release certificate; package hu.anno117.companion, version 0.20.0/code 21, not debuggable. Installed and launched on the connected Samsung; synthetic Demo rendered. The previous developer app was retained separately.
- Packaging gate compares every dashboard file in both binaries with the staged source, checks synthetic demo embedding and generates SHA-256 asset hashes.

The current gallery contains 11 actual Windows, browser, Samsung and PDF captures. App/browser examples use synthetic Example islands; the author-arranged clean widget screenshot shows cached Live values from their own game. No personal shortcut, pairing code, QR code or PC address is visible.

Limits: no clean Windows VM/ARM test; no new live-game balance or iPhone hardware test during this final candidate pass. Widget behaviour was verified in earlier development work; this pass does not claim a new launcher/widget lifecycle test of the public package. An installed-app end-to-end public updater test was not performed in that build-verification pass; public release downloads have since been checked separately. Windows EXE remains unsigned. See WINDOWS_COMPATIBILITY.md for the runtime/fallback contract.

Final Live regression: the user reopened Production Statistics and the running bridge received seven messages, refreshing six islands while one retained older data. Added mixed-state regression coverage: cached-only, mixed, fully live, disconnected and ageing transitions; each transfer retains its own freshness. Removed the leftover screenshot-test bridge and introduced a static screenshot server which never opens the game pipe.

Screenshot refresh: replaced the first six-image set with 11 visually inspected captures. Four are actual native Windows EXE windows, two show the local browser, three are actual Samsung release-APK/launcher captures, and two are rendered pages of the actual exported PDF. The public widget was placed through the normal Samsung launcher dialog and verified with Example Empire data outside resize mode. Rejected/wrong-state captures were kept outside public trees. The screenshot manifest records the accepted file hashes. App binary contents are unchanged by this documentation/gallery refresh.

Post-publication audit: the repository is public; v0.20.0 is the latest stable release with eight assets. All eight are anonymously downloadable and their GitHub SHA-256 digests match the reviewed local files. The latest source checks passed. Both ZIP archives contain the corrected clean widget screenshot, all 11 gallery hashes match their manifest, and README/concept/gallery local links resolve. The packaged release-manifest published:false field records its pre-publication build state, not the current GitHub Release state. Repository documentation has advanced after the release snapshot.
