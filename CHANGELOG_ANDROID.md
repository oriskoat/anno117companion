# Android APK changelog

Reconstructed through **0.21.3** from the development conversation, APK manifests, retained source and release notes. Latest entries appear first. Dates are development dates in Europe/Budapest, not public publication dates.

This log covers the Android app, native WebView integration, pairing, printing, updater and home-screen widget, plus shared dashboard features shipped in the APK. PC pipe reading, server persistence and Windows window management belong to [CHANGELOG_WINDOWS.md](CHANGELOG_WINDOWS.md). Live Android data requires the Windows bridge; the bundled recorded demo works offline.

Versions 0.20.0, 0.20.1 and 0.20.2 are public GitHub APK releases. Older entries document local development checkpoints. There is no Play Store release.

## 0.21.3 — Alternative chain producers

- Choose alternative producers at the top of the chain calculation. Both Gold Washer and Gold Mine routes are visible in the Aegyptus poster.

## 0.21.2 — Aegyptus specialists

- Refresh specialist and captain data for game 3.0, including Aegyptus production targets and fertility effects.
- List matching specialists regardless of ownership. When a matching save is available, show stored or assigned status and the saved island when known.

## 0.21.1 — Individual Needs cards

- Expand or collapse each Needs card independently across all tiers and categories. Collapsed cards show the name and fulfilment status; expanded cards keep their details and actions.

## 0.21.0 — Aegyptus and Save Insights

- Refresh production recipes and population needs for game 3.0, including Aegyptus and Very High consumption.
- Show relevant specialists from the selected save, with stored versus assigned status and matching fertility effects. Import plans can show applicable captain options.
- Use Save Insights from the paired Windows Companion; save parsing runs on the PC.

## 0.20.2 — Observed production in import planning

- Rank production-region islands by local surplus, then observed production, then other compatible islands. Show production, consumption, local balance and data freshness on each photo card.
- Plan a transfer directly from observed surplus to the original destination. Cap the proposed rate by both surplus and deficit, distinguish partial coverage, and retain manual cargo quantities.
- Offer production expansion on existing producer islands and new construction on other region-compatible islands. Do not imply that all chain inputs, fertility, deposits or unlocks are confirmed.
- Translate the new interface text in all twelve supported languages.
- APK versionCode 23, same public package and release certificate as 0.20.0/0.20.1.


## 0.20.1 — Island artwork in production and import planning

- Show distinct regional island artwork in the “Build there and plan import” island picker instead of the pale Needs icon.
- Keep source-island selection and the original import destination intact. Verify image loading and layout on desktop and mobile.
- Android versionCode 22; same public package and release signing certificate as 0.20.0.


## 0.20.0 — Region-aware planning and public signing identity

APK versionCode **21**. Public application ID: `hu.anno117.companion`, using a dedicated release signing key. Earlier `hu.anno117.pipeprobe` developer installs remain separate; they are not uninstalled or silently migrated. Future public updates keep this new identity and certificate.

- Distinguish mixed Live + cached island data from a fully cached snapshot. Show live/cached counts and keep freshness per island, transfer, PDF and Android widget.

- Add local-production or remote-production-plus-import options directly to Overview. Preserve the destination island when building in another region, including Albion demand supplied from Latium.
- Connect planned production to a multi-good shipping proposal with manual cargo quantities, and add Back to previous view in Trade Routes.
- Preserve regional/DLC producer restrictions and distinguish new capacity proposals from observed supply surplus.
- Align the shared dashboard with the Windows 0.20.0 candidate, retaining the widget and 12 languages. Bundle a synthetic demo instead of the developer's recorded save.

Windows 0.19.1 was a desktop-only compatibility patch; no APK for that intermediate version was built.

## 0.19.0 — Compact More and contextual Coal

APK versionCode **20**. Installed on the connected Samsung over the existing app; retained pairing and widget.

- Compact, expandable Updates and expandable About me & Support. Keep Buy me a coffee outside the disclosure, accessible while collapsed.
- Change browser/native external donation routing to `https://revolut.me/vafvyop?currency=EUR&amount=500`.
- Greet **Welcome, Governor!** on Home and remove the empty Empire briefing card. Retain the newspaper PDF action beside Settings.
- Show Coal under every consuming catalogue tier in the destination region, without multiplying one transfer's quantity or route-plan identity.
- Show base-game Charcoal Burner and DLC Coal Mine alternatives, with explicit DLC labels in producer choices.
- Windows maximized startup is a Windows-only change, not an APK feature.

## 0.18.0 — Android home-screen widget

APK versionCode **19**. Installed and exercised on the connected Samsung launcher.

- Add a resizable Empire briefing widget with session, island/product/local-gap counts and the source timestamp.
- Add scrollable **Supply suggestions / Local gaps** tabs with official product icons. Store the full received lists; rows open the relevant Supply selection or island/product detail in the app.
- Add Demo/Live switching, tap-to-open and manual refresh. Keep Demo and Live summaries separate, reuse saved encrypted pairing and label cached PC data explicitly.
- Perform short background refresh work through JobScheduler. Request launcher updates every 30 minutes, subject to Android scheduling; publish foreground Live summaries at most every 30 seconds.
- Follow the app's selected language across 12 locales. Clear the Live summary when pairing is forgotten and guard against an old request restoring it.
- Add **More → Add home screen widget**, using the launcher's normal placement dialog.
- The first local iteration displayed only the largest Supply suggestion. User feedback replaced it within this same development version with the scrollable multi-product lists; it is not the final 0.18.0 behavior.
- Also ship unfiltered Needs (All islands / All tiers), expandable tier groups, a visible Infrastructure glyph, Latium Leather under Infrastructure and the small Home newspaper PDF action.

Device checks: widget placement, multiple product icons/scrolling, saved-pairing Demo/Live transition, Cached timestamp, tab switching and opening Olives on Juliana from a row.

## 0.17.0 — Needs and building effects

APK versionCode **18**. Built and lint-checked; a Samsung installation of this exact intermediate version was not established while the device was disconnected.

- Add island/tier/category Needs browsing for nine tiers, including Waders, plus goods, public services and conditional needs.
- Show nominal per-residence rewards and category supply thresholds; distinguish these from received island production totals.
- Add device-local manual fulfilment observations (0%, estimated 50%, 100%), isolated by session/island/tier/need and Demo/Live mode.
- Link needs to Build chain or Supply and show nominal building-area effects/radii in chain/producer details.
- Replace generic Supply progression graphics with official region/tier art; keep every tier available and classify Wader goods correctly.

## 0.16.0 — Current routes and grouped Supply

APK versionCode **17**. Built and lint-checked; no installation on a disconnected Samsung is claimed.

- Make Routes open Current routes; show route/cargo confirmation and View route after Add and continue.
- Discover PC-shared plans on Home/Supply and mark matching transfers with route names, reflecting edits/removal.
- Add island-at-either-end, region and tier filtering; expandable source/destination island groups and region/tier progression groups.
- Keep focused controls and expanded groups stable through incoming snapshots.

## 0.15.0 — Shared Trade Routes and PDF production icons

APK versionCode **16**.

- Edit multi-good, multi-stop route plans shared on the authenticated PC bridge.
- Work through Supply proposals one by one with preview, route selection, manual quantities, skip/review and cyclic cargo capacity checks.
- Preserve local drafts during polling/offline failures and detect revision conflicts. Keep Demo plans on the device.
- Add official good icons to the Android system-print PDF tables; the report remains usable from bundled recorded data without a running PC.
- Route plans still require manual application in the game.

## 0.14.0 — Balanced chain planner

APK versionCode **15**.

- Start general chains at the smallest balanced whole-building recipe set for the chosen productivity.
- Include and round fuel separately; preserve custom output, island-deficit and manual residence scenarios.
- Keep the chain's region and regional producer alternatives when opening details.

## 0.13.0 — Native Android updater and progression

APK versionCode **14**.

- Check GitHub releases for `oriskoat/anno117companion`; validate release downloads and SHA-256, package identity, newer version and signing compatibility.
- Hand installation to Android's system installer for user approval. Preserve app data and saved pairing on compatible in-place updates.
- Add region/tier default ordering in Chains and identify which downstream building consumes each ingredient.
- Add larger region artwork cards and compressed report images. These are region artwork, not screenshots of the user's islands.

## 0.12.0 — Pause-aware client and offline PDF printing

Staged Android source declares versionCode **13**, versionName **0.12.0**. A separately retained 0.12.0 APK was not found; treat this as a documented implementation checkpoint, not proven APK distribution.

- Continue displaying the bridge's last island values when the game stops publishing, with Cached state and age. PC-side journal/persistence provides these Live values; the APK does not read the game pipe.
- Rework Home around priority gaps, Supply suggestions, island summaries and PDF export.
- Add native Android PrintManager integration for offline HTML-to-PDF via the system Save as PDF flow, with localized text and artwork.

## 0.11.0 — Search and sorting checkpoint

Staged Android source declares versionCode **12**, versionName **0.11.0**. No separately retained 0.11.0 APK was found.

- Add case/accent-insensitive searches using localized product and island names, plus numeric/alphabetical ascending/descending sorting across Products, Supply, Islands and Chains.
- Remember sort preferences and preserve active searches during polling.
- Prepare matching complete-source staging and a synthetic public-demo dataset, without claiming a published app-store release.

## 0.10.1 — Early-snapshot startup fix

APK versionCode **11**.

- Reconcile Android snapshots that arrive before all dashboard feature scripts have loaded; render once registration completes.
- Retain the 0.10.0 detail, recovery and image improvements. Archived 0.10.0 source confirms those were already present before this patch.
- This is the first local-test release-candidate checkpoint explicitly recorded in PROJECT_NOTES.md, not proof of public release.

## 0.10.0 — Clearer products and Live recovery

APK versionCode **10**.

- Introduce Overview / Supply / Improve / All data product tabs, clear local-balance verdicts, island scope and one metric summary.
- Preserve the current tab, scope, scroll and expanded data through Live updates.
- Open pairing or connection recovery after initial Live access failures; keep saved credentials and the last usable view through later transient outages.
- Retry failed artwork and show visible failure/retry feedback. Benefit from improved PC HTTP image caching/queue behavior when using Live.

## 0.9.0 — Full UI language catalogues and explicit data mode

APK versionCode **9**.

- Add authored UI translations for all 12 official game languages, alongside official terminology, dialogue, accessibility labels and stable option values.
- Show game quotes on all six main destinations and details; make Demo/Live switching explicit.
- Add DLC filtering and combine About me with coffee support directly on More.
- Preserve detail Back/Close behavior and repeated product/Supply selection flows in the mobile interface.
- Exclude retired SMB probe activities/dependencies from the active Companion build.
- Prepare a debug-signed local-testing APK and checksums, with source preparation kept distinct from publication.

## 0.8.0 — Navy/gold design and detail navigation

APK versionCode **8**.

- Adopt Anno-inspired navy blue/gold, including Android system bars and app identity.
- Add the supplied About me and donation copy; open support in an external browser.
- Keep detail Close visible, add Back history and connect Android Back to the detail stack, restoring planner fields and scroll.
- Check the Murex → producer → chain → ingredient navigation path.

## 0.7.0 — Chains, needs scenarios and catalogue navigation

APK versionCode **7**.

- Browse 71 chains by region, tier and good using 144 producer recipes, regional inputs and relevant specialist data.
- Show current/recorded island balances and Supply context while planning output, island deficits or manually entered additional residences.
- Apply difficulty only to residence consumption scenarios; do not infer house counts or multiply received consumption.
- Include recursive ingredients/fuel, per-step productivity, nominal ratios and rounded building counts.
- Fill recipe product/producer icons, open catalogue-only goods and fix encoding problems in controls.
- Add 82 game dialogue lines across the 12 official text languages. Most authored UI controls were still English; 0.9.0 completes the UI catalogue milestone.

## 0.4.0–0.6.0 — Shared dashboard / Windows transition checkpoints

- Conversation work covered varied island artwork, a more authentic Anno identity, QR/six-digit pairing, chain/specialist expansion and the Windows Use Companion transition.
- Retained 0.5.0/0.6.0 EXEs contain a dashboard marked 0.4.0. No standalone Android APKs for 0.4.0, 0.5.0 or 0.6.0 were found.
- Do not invent Android releases from the Windows executable filenames. The next retained APK after 0.2.0 is 0.7.0; its changelog records the first fully evidenced feature set.

## 0.3.0 — First polished dashboard checkpoint

- Documented in DESIGN_NOTES.md: original green/off-white mobile dashboard with Home, Islands, Products, Supply and More.
- Bundle recorded game data for offline browsing, clearly labeled with its archived timestamp, plus extracted transparent product artwork.
- Inspect actual/potential production, consumption, productivity, buildings, workforce/economy and technical IDs.
- Calculate Supply from local balances without reusing the same source surplus. Reuse the same visual interface for incoming bridge data and remember successful pairing.
- No separately retained APK marked 0.3.0 was found; this is a documented UI milestone.

## 0.2.0 — First bridge-based Android companion

APK versionCode **2**; companion to `Anno117Bridge.exe`.

- Replace the unsuccessful direct SMB path with authenticated HTTP snapshots from a local Windows bridge.
- Poll every five seconds while the app is open; show Overview, Supply Suggestions and complete received JSON with resolved names and IDs.
- Remember a successfully verified PC connection using Android Keystore-backed encryption, with Forget support. No repeated Windows username/password entry is needed.
- Keep connection diagnostics and game-data ages visible. The initial bridge excluded old/disconnected areas from Supply; that was replaced by Cached planning in 0.12.0.
- Basic prototype UI, without the later artwork-rich dashboard.

## 0.1.0 — Anno Pipe Probe (diagnostic prototype)

APK versionCode **1**; retained filename `Anno-Pipe-Probe-0.1.0.apk`.

- Test direct SMB 2/3 access to the Windows named pipe, separately reporting network reachability, SMB negotiation, authentication, IPC$ access and protocol receipt.
- Provide stop/timeouts and a copyable diagnostic report without credentials.
- Do not store the Windows password; block sensitive-screen captures. This was a diagnostic app, not the finished Companion.
- Subsequent investigation identified rejection of remote pipe clients and led to the 0.2.0 PC-bridge design. A successful SMB connection alone never proved game-data access.
