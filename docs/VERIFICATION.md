# Release candidate verification — 0.20.0

Local verification on 2026-11-01. No GitHub publication was performed.

- Source Python suite: 28 tests passed (bridge/protocol, pairing, route persistence/validation, updater, public import boundary, startup fallback and PDF).
- Source dashboard: all three Node/jsdom suites passed. Eight pages, image references, twelve locales, repeated product selections, Needs isolation and regional production/import/return flow checked.
- Real Edge browser against the staged bridge: Home, Supply, Needs, regional product detail and mobile layout rendered; no JavaScript page errors. Albion Olives -> Latium producer -> manual shipment -> Back retained the destination and chain context.
- Windows EXE: 87 bundled native binaries audited; no missing declared payload or unexpected external DLL. Offline standalone self-test passed from a Unicode/spaced folder with PATH restricted to System32 and development runtime variables removed: QR PNG, PNG/WebP, PDF/fonts, Tcl/Tk, .NET WinForms and WebView2 loader.
- Android: assembleRelease and lintRelease passed. APK signature verified against the dedicated release certificate; package hu.anno117.companion, version 0.20.0/code 21, not debuggable. Installed and launched on the connected Samsung; synthetic Demo rendered. The previous developer app was retained separately.
- Packaging gate compares every dashboard file in both binaries with the staged source, checks synthetic demo embedding and generates SHA-256 asset hashes.

Screenshots are actual rendered UI with invented Example islands, including one actual Samsung screen. They contain no live save, pairing code or PC address.

Limits: no clean Windows VM/ARM test; no new live-game balance or iPhone hardware test during this final candidate pass. Widget behaviour was verified in earlier development work; this pass does not claim a new launcher/widget lifecycle test of the public package. Public update download/install cannot be tested against v0.20.0 before it is published. Windows EXE remains unsigned. See WINDOWS_COMPATIBILITY.md for the runtime/fallback contract.

Final Live regression: the user reopened Production Statistics and the running bridge received seven messages, refreshing six islands while one retained older data. Added mixed-state regression coverage: cached-only, mixed, fully live, disconnected and ageing transitions; each transfer retains its own freshness. Removed the leftover screenshot-test bridge and introduced a static screenshot server which never opens the game pipe.

Screenshot refresh: replaced the first six-image set with 11 visually inspected captures. Four are actual native Windows EXE windows, two show the local browser, three are actual Samsung release-APK/launcher captures, and two are rendered pages of the actual exported PDF. The public widget was placed through the normal Samsung launcher dialog and verified with Example Empire data outside resize mode. Rejected/wrong-state captures were kept outside public trees. The screenshot manifest records the accepted file hashes. App binary contents are unchanged by this documentation/gallery refresh.
