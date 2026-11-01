# Windows EXE changelog

Reconstructed through **0.20.2** from the development conversation, retained EXEs, staged source snapshots and release notes. Latest entries appear first. Dates below are local development dates in Europe/Budapest, not public publication dates.

This log covers the Windows bridge, native Companion window and the dashboard served to LAN browsers, including iPhone. Shared dashboard features are included because they ship in the EXE. Android-only installation, Keystore and widget work is documented separately in [CHANGELOG_ANDROID.md](CHANGELOG_ANDROID.md).

Versions 0.20.0, 0.20.1 and 0.20.2 are public GitHub releases. Older entries document local development checkpoints and do not establish public publication.

## 0.20.2 — Observed production in import planning

- Rank production-region islands by local surplus, then observed production, then other compatible islands. Show production, consumption, local balance and data freshness on each photo card.
- Plan a transfer directly from observed surplus to the original destination. Cap the proposed rate by both surplus and deficit, distinguish partial coverage, and retain manual cargo quantities.
- Offer production expansion on existing producer islands and new construction on other region-compatible islands. Do not imply that all chain inputs, fertility, deposits or unlocks are confirmed.
- Translate the new interface text in all twelve supported languages.


## 0.20.1 — Island artwork in production and import planning

- Show distinct regional island artwork in the “Build there and plan import” island picker instead of the pale Needs icon.
- Keep source-island selection and the original import destination intact. Verify image loading and layout on desktop and mobile.


## 0.20.0 — Region-aware production and import planning

- Distinguish mixed Live + cached island data from a fully cached snapshot. Show live/cached counts and keep freshness per island, transfer, PDF and Android widget.

- Add production alternatives directly to product Overview, scoped to the destination region. Suggest local building only for producers available in that region.
- For imported goods, choose a producer island in a supported region, plan additional capacity from the destination's observed deficit and carry both endpoints into manual shipment planning.
- Keep original destination/source context through chain alternatives and provide Back to previous view from Trade Routes planning.
- Label new-production transfers as proposals rather than observed surplus. Cargo per visit remains manual, and actual fertility/deposits/unlocks are checked in game.
- Align Windows and Android release versions. Prepare a complete source/resource snapshot with synthetic public demo data, matching installable artifacts and checksums. Publication is a separate step.

## 0.19.1 — Dependency audit and resilient startup (Windows only)

- Bundle a startup guard that checks .NET Framework 4.8+ and WebView2 Runtime 109+ before importing the embedded Windows host. Avoid a fallback to the obsolete MSHTML renderer.
- Provide a bundled Tcl/Tk browser-mode controller when those runtimes are missing, or when explicitly started with `--browser`. It hosts the same bridge/dashboard and device pairing, without requiring .NET or WebView2. Download links open official Microsoft pages only on request.
- Catch startup failures in the windowed EXE, write a local diagnostic log and show its location. Explain unwritable installation folders and local-server startup errors. A failed hostname lookup no longer prevents opening the local app.
- Add `--self-test <output.json>` for offline QR, PNG/WebP, PDF/fonts, Tcl/Tk, WinForms and WebView2-loader checks.
- Gate future Windows builds on required bundled payloads and a native DLL-import audit. The inspected EXE contained 87 native binaries, no missing declared payloads and no unexpected external native DLL imports.
- Validate the standalone EXE from an otherwise empty non-ASCII/spaced path with developer Python/runtime environment variables removed and PATH restricted to System32. Also render and HTTP-check the browser controller.
- Target x64 Windows 10 22H2 / Windows 11; a clean Windows VM and ARM64 were not tested. No matching 0.19.1 APK was built; Android remains 0.19.0.

## 0.19.0 — Compact More and contextual fuel supply

- Start the Windows Companion maximized, with the pairing/server bar and full tool in the same window.
- Replace the Home title with **Welcome, Governor!** and remove the now-empty Empire briefing card. Keep the newspaper PDF action beside Settings.
- Make Updates a compact, expandable panel. Make About me & Support expandable while keeping Buy me a coffee accessible outside the disclosure.
- Update both the browser link and Windows external-browser donation action to `https://revolut.me/vafvyop?currency=EUR&amount=500`.
- Include dedicated fuel consumption and upstream recipes in Supply progression. Coal appears under every consuming catalogue tier in the destination region instead of Other goods.
- Repeated tier cards remain views of one transfer: suggestion counts, surplus allocation and saved-route identity are not multiplied.
- Show source-region Coal production alternatives, distinguishing base-game Charcoal Burners from Prophecies of Ash Coal Mines. Label DLC alternatives in chain producer selectors.

## 0.18.0 — Unfiltered Needs and discreet PDF export

- Default Needs to **All islands / All tiers**, with expandable tier groups, optional search/status filters and correctly scoped island actions and confirmations.
- Give the white Infrastructure game glyph a blue background so it is visible.
- Classify Latium Leather as Infrastructure in Supply progression.
- Move Home PDF export from its large button to a small newspaper icon beside Settings.
- The Android widget was introduced in this version; the Windows EXE supplies its Live data through the existing bridge API and does not install a Windows widget.

## 0.17.0 — Tier needs and building area effects

- Add Needs by island, tier and category: all nine tiers including Waders, public services, goods and conditional needs.
- Show nominal full-fulfilment rewards per residence and category supply thresholds from extracted game data.
- Keep observed island production balances separate from actual need fulfilment. Allow optional manual 0%, estimated 50% and 100% observations, stored on the current client per session/island/tier/need and separately for Demo and Live.
- Add contextual Build chain and Supply actions.
- Show building attributes and radius/street distance in producer and chain details. Values are nominal per building, not measured island totals.
- Use official region emblems and tier portraits in Supply progression. Keep all tier filters available even with no current proposals; classify standalone Wader goods such as Cockles and Eels.

## 0.16.0 — Visible route plans and grouped Supply

- Open Routes at Current routes. After Add and continue, show the saved route name, cargo and a View route action before continuing.
- Discover shared plans independently on Home/Supply and mark matching transfers with their route names. Reflect route edits and removal.
- Add island-at-either-end, region and tier filters. Group source/destination sorts into expandable island sections; group Progression by Latium/Albion and tier.
- Preserve expanded groups and active search/filter focus during snapshot polling.

## 0.15.0 — Shared Trade Routes and illustrated PDF tables

- Persist authenticated, revisioned multi-good/multi-stop route plans on the PC bridge for the EXE, phones and LAN browsers to edit together.
- Add sequential planning from Supply with preview, route selection, manual quantities, skip/review and cyclic cargo-slot checks, including multiple goods on one ship.
- Preserve drafts during polling and connection failures; detect conflicting edits instead of silently overwriting another device's work. Keep Demo plans local.
- Embed official production-good icons in the native/server PDF tables.
- Route plans are manual plans, not game commands or detected in-game routes.

## 0.14.0 — Balanced production sets

- Default general chain planning to the smallest balanced whole-building set at the selected productivity, including Albion Amphorae 3:2:2.
- Include and separately round fuel capacity. Keep custom output, selected-island deficit and manual residence scenarios as distinct planning bases.
- Preserve region context when opening chains; support explicit production-region choices for shared producers.

## 0.13.0 — GitHub updater and production progression

- Add update checks against `oriskoat/anno117companion`, release asset validation and SHA-256 verification.
- Add the Windows replacement/restart helper with backup and rollback behavior. Preserve saved pairing and bridge settings across updates.
- Default Chains to region/tier progression, Infrastructure first; sort names or capacity within tier groups.
- Identify the consumer of each chain step, including the regional wood → Tannery → leather → Armourer relationship in Albion.
- Add larger illustrated island cards on Home and in the PDF, with print-sized images.

## 0.12.0 — Pause support, Home briefing and Empire Summary PDF

- Journal incoming game data over a rolling 60-second window and persist the latest island values on the PC.
- Retain Supply and planning while data stops arriving, using Cached status and age. Resume Live when new messages arrive; clear prior data on new sessions.
- Build Home around priority local gaps, Supply suggestions and island summaries.
- Generate a localized blue-and-gold Empire Summary PDF; save/open reports from the Windows app and serve downloads to LAN browsers.
- Prepare a complete application/source staging snapshot with bundled catalogue resources. A standalone retained 0.12.0 EXE exists; a finalized matching release archive is not established by the retained artifact inventory.

## 0.11.0 — Search, sorting and complete-source checkpoint

- Add localized-name/GUID search and ascending/descending alphabetical or numeric sorting to Products, Supply, Islands and Chains.
- Search source/destination island names, ignoring case and accents. Preserve sort preferences and active inputs during refresh.
- Prepare a matching complete-source release candidate with synthetic example islands instead of private game captures.
- Evidence is a staged source checkpoint. No separate retained 0.11.0 EXE was found; do not describe it as an independently distributed Windows release.

## 0.10.1 — Matching desktop build for the Android startup fix

- Retain the 0.10.0 product, navigation, connection and image improvements in a matching Windows build.
- Serve the corrected dashboard boot reconciliation for snapshots delivered before feature scripts finish loading; the observed trigger and primary fix were Android-specific.
- Keep normal LAN hosting on port 11780 and paired-browser access.
- Do not attribute all 0.10.0 product improvements to this patch: archived 0.10.0 source already contains them.

## 0.10.0 — Clearer product details and connection recovery

- Reorganize product details into Overview / Supply / Improve / All data, with one metric summary, island scope and a clear local-balance verdict.
- Preserve product tab, scope, scroll and expanded data when snapshots update.
- Recover initial Live access failures with pairing/connection guidance on remote clients; keep working views through later transient outages.
- Retry failed images, show explicit failure/retry feedback, cache browser artwork with ETags and increase the HTTP queue for simultaneous image requests.
- Validate successive native Supply selections with the nonblocking detail drawer.

## 0.9.0 — Languages, Demo/Live and release preparation

- Add actual UI catalogues for all 12 official game languages, alongside official names/dialogue and translated accessibility labels. Keep option values stable after translation.
- Show original game quotes across the six main destinations and detail views.
- Add explicit Demo/Live controls for the Windows app and served browser UI.
- Use a nonblocking desktop detail drawer so more Supply cards remain selectable; close details on page changes and restore form/scroll state on Back.
- Add the DLC filter and bring About me and support together directly on More.
- Prepare a stable Windows launcher, local-testing archives, checksums, manifests and a sanitized source preview. These were preparation artifacts, not proof of public publication.

## 0.8.0 — Anno blue, personal support and detail navigation

- Change the earlier green visual direction to Anno-inspired navy blue and gold.
- Add the supplied About me and donation stories, with external-browser support links.
- Keep Close accessible in long details; add Back, Escape and Alt+Left navigation with restored form values, planner choices and scroll.
- Exercise the reported Murex → producer → chain → ingredient flow. The navigation changes do not establish a separately diagnosed engine hang.

## 0.7.0 — Structured chains and current-game context

- Browse 71 chains by region, tier and good, backed by 144 producer recipes and regional alternatives.
- Show observed island balances and eligible Supply suggestions from chain/product details.
- Plan manual output, a selected island's deficit or additional manually entered residences. Apply Low/Medium/High consumption factors only to residence scenarios, not observed rates or factory input ratios.
- Include recursive ingredients/fuel, per-step productivity, rounded counts and relevant specialists with base/conditional effects separated.
- Fill recipe-good/building icon coverage, allow opening unobserved catalogue goods, add 82 matched game dialogue lines across 12 languages and correct text encoding.
- Most authored controls were still English here; complete UI localization belongs to 0.9.0.

## 0.6.0 — One full Windows window

- Put the pairing/server controls above the complete embedded dashboard in a single native window.
- Keep Open browser as an alternative view of the same local server; control the server lifecycle in the same process.
- Display QR, six-digit code and the LAN address in a collapsible top bar.
- Artifact attribution is confirmed by the retained 0.6.0 EXE, whose entrypoint is `desktop_app`. Its embedded dashboard still labels itself 0.4.0; that label is not a separate 0.6.0 APK release.

## 0.5.0 — Use Companion transition

- Add the Use Companion path alongside Open browser in the Windows controller.
- In this intermediate build, Use Companion still launched a separate process/window. The requested unified window was completed in 0.6.0.
- Confirmed from the retained 0.5.0 EXE (`bridge_gui`, separate `--companion` launch). Its bundled dashboard version label remained 0.4.0.

## 0.4.0 — Windowed server and visual/pairing checkpoint

- Conversation-era work added a visible Windows controller, local browser access, phone-friendly layouts, island/region artwork, a more authentic Anno emblem and QR/six-digit pairing.
- A dashboard reporting 0.4.0 is retained inside the 0.5.0/0.6.0 EXEs. No separately named 0.4.0 EXE is retained; the exact subdivision of this early work cannot be recovered confidently.
- Later catalogue material is present in those early EXEs, but its precise introduction is not recoverable. The first well-documented structured-chain milestone is 0.7.0.

## 0.3.0 — First polished shared dashboard checkpoint

- Introduce the original green/off-white dashboard with Home, Islands, Products, Supply and More.
- Browse a saved game capture and inspect every received field, including actual/potential rates, productivity, producing buildings, workforce/economy fields and IDs.
- Reuse extracted game icons and clearly label recorded data; calculate Supply from local surpluses and deficits without allocating the same surplus twice.
- Documented by DESIGN_NOTES.md and the conversation; no independently versioned 0.3.0 EXE is retained.

## 0.2.0 — First standalone Windows bridge prototype

- Package the Python read-only game-pipe bridge as `Anno117Bridge.exe`, without requiring a separate Python installation.
- Serve authenticated LAN snapshots on port 11780 for Android, with Overview, Supply and raw-data functionality in the companion client.
- Preserve local captures and resolve GUIDs to product/building/workforce names. Read from the game pipe without sending game commands.
- Initial Supply excluded disconnected/older-than-three-minute areas; retained cached-data support replaced that rule in 0.12.0.
- This was a basic bridge executable, not the later full native Companion UI.

## Before 0.2.0 — Capture and feasibility work

- Enable the game pipe, capture production messages, resolve GUIDs and examine which fields could support a companion.
- Test direct phone-to-pipe SMB access; diagnostics identified rejection of remote pipe clients, leading to the local Windows bridge architecture.
- No Windows 0.1.0 release artifact is established. The 0.1.0 artifact is an Android diagnostic APK.
