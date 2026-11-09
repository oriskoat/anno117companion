# Project audit — 9 November 2026

Target: local Anno 117 Companion 0.27.0 beta 8. This is an audit, not a repair or release. No application logic, executable, APK or GitHub release was changed. The installed application was not started/replaced. Browser checks used an isolated source preview with the game pipe disabled.

## Executive decision

The project has useful working features and meaningful tests, but this beta should not be promoted to a public release before the P1 findings below are addressed. The largest risks are incorrect planning inputs, inconsistent campaign identity, and obsolete release preparation. More cosmetic features should follow those repairs.

The most important architectural problem is inconsistent authority: production calculations, campaign keys and navigation state have several implementations. Fix those contracts incrementally; do not rewrite the whole application or delete legacy modules solely because they look unused.

## Scope and evidence

- Mapped 83 first-party runtime/test code files, approximately 776 KB and 791 Python/class/JavaScript function symbols. Generated catalogue dictionaries, vendor code and build output were excluded from that code-size metric. Builders, packaging, CI and native Android entry points were separately inspected.
- Read the bridge/cache/authentication paths; save selection, matching, parsing and economy extraction; production/season/recipe/planning adapters and models; UI navigation and shared state; Windows updater/startup/build paths; Android WebView, updater, pairing and widget paths; documentation and release manifests.
- Re-ran **64 Python tests** and **10 JavaScript suites**: passed.
- Ran existing Home/empire and chain browser checks at **1440 and 390 px** against the isolated source preview: passed, zero page errors and no horizontal page overflow in those flows.
- Built independent synthetic reproductions for findings not covered by the passing suites. No test changes game files or writes a real route plan.
- Catalogue audit: **233 factories**, **222 chains**, **469 specialists**, **72 captains**, **142 distinct output goods**, **12 interface languages**. All 233 factories have advisor rule records; all 142 output goods have icon mappings; all mapped icon files exist. This checks internal coverage, not whether every specialist's game semantics are modeled.
- No physical Android/iPhone run, APK build, clean Windows VM certification, live-game tick comparison or online GitHub audit was performed in this review. Android behaviour below is identified from the native source. The normal installed EXE server was unavailable during the audit; source preview checks are not described as new frozen-EXE checks.

Private machine-readable evidence remains under `build/`: `audit-structure.json`, `audit-reproductions.json`, `audit-cache-priority.json`, `audit-packaging.json`, `audit-catalogue.json`, test/browser logs, and `audit-summary.json`.

## P1 — repair before publication

### P1-01: The complete Planner omits factory fuel

**Confirmed by reproduction.** `provinceUnitProfile` uses `AdvisorModel.scenario`, whose inputs contain `factory.inputs` only. Fuel is stored separately in `needs_fuel`, `fuel_product_guid` and `fuel_amount_per_minute_100pct`. The new catalogue chain model adds fuel explicitly; the province/empire profile does not.

Example: Furnace 3070 has 1/min Iron Ore and 0.5/min Coal at the nominal rate. Chains returns both inputs; the Planner profile returns Iron Ore only. All 41 fuel-marked factory definitions store fuel outside their recipe inputs. New/restored capacity can therefore have no added fuel requirement, and its fuel supplier may be missing from the upstream plan. Existing received consumption may still contain existing fuel use; it does not cover new demand automatically.

**Source:** `advisor-model.js:19`, `catalogue-chain-model.js:12`, `province-data.js:27–43`, `chain-model.js:9–14`.

**Repair:** one canonical unit recipe including separately classified fuel and optional module feed. Preserve the existing-consumption credit rules so existing fuel is not added twice. Add parity tests for all 41 factories and a whole-plan test where absent fuel constrains output. Verify productivity/extra-output fuel scaling from official definitions before generalizing it.

### P1-02: Routes and manual Needs observations collide between same-name campaigns

**Confirmed by reproduction.** `advisorContext()` uses a save campaign fingerprint when available, but `tradeContext()` is just Demo/Live plus session name. Manual Needs observation keys also use `tradeContext()`.

Two snapshots named `Same Name`, with distinct `campaign-A` and `campaign-B` fingerprints, receive different advisor contexts but the identical `live:Same Name` trade context. A route inserted in A is present in B's state. The same problem applies to persisted server route documents and same-island/tier Needs keys. Revision checks prevent concurrent overwrites inside a key; they cannot distinguish two campaigns assigned the same key.

**Source:** `trades.js:5–8`, `needs.js:17`, `advisor.js:15`.

**Repair:** a shared campaign-identity contract for routes, Needs observations, scenarios and history. Use verified save identity where available, and an explicitly provisional pipe-only context otherwise. Provide a conservative migration for name-only documents; do not silently attach old plans to a guessed campaign.

### P1-03: Zero/stale saved productivity can override positive received production

**Confirmed by reproduction.** Providers are first grouped from saved instances. Their current rate is calibrated from received production only if reconstructed saved output is positive. When reconstruction is zero, the anchor is 1. The existence of that zero-output group then prevents the received-only fallback provider from being added.

Synthetic Oat Farm example: saved productivity 0, received production 2/min, consumption 1/min. The resulting existing provider has capacity 0 and the farm is counted as restorable. This is a realistic conflict when a producer was paused in the save and resumed before a newer pipe observation. Missing productivity also becomes 0 through `?? 0`, which erases the distinction between unknown and confirmed stopped.

**Source:** `province-data.js:50–58`.

**Repair:** explicit conflict handling. Preserve the received positive capacity as authoritative for current output, while marking the saved per-building split/phase forecast unresolved. Unknown productivity must not count as confirmed idle capacity. Test paused-save/resumed-pipe, missing-productivity, new buildings after a save, and genuine zero output separately.

### P1-04: Paused/cached pipe values can roll back to older save values

**Confirmed current policy and reproduction; changing it requires an explicit source-priority decision.** In `dashboard`, only noncached/nonstale matching pipe areas survive. Once an observation becomes cached after 60 seconds, it is replaced by saved statistics, even if the save is older.

Synthetic example: matching pipe observation received at 09:00 produces 9/min; save written at 08:00 records 1/min. With the pipe marked cached, the returned value becomes 1/min. The existing guide describes this fresh-pipe-first policy, so this is not an undocumented branch. It nevertheless conflicts with the intended last-known-data experience and can change a plan merely because the game was paused. Save production history may itself predate the file timestamp.

**Source:** `save_reader/service.py:376–432`, especially the freshness condition at 387.

**Repair:** per-field provenance and chronology, including game/statistics ticks. Retain a newer matching pipe observation when no demonstrably newer rate observation exists. Merge saved stocks/buildings/population independently of rate precedence. Expose unresolved chronology rather than substituting an older rate silently.

### P1-05: Public release preparation is not ready for this source tree

**Confirmed by static manifest checks; no release archive was produced.**

- `prepare_full_release.py` references five absent files: two historical documentation files, `test_more_fuel.cjs`, `test_widget_ui.cjs`, and `prepare_needs.py`.
- Both full/public preparation scripts omit `save_reader`, `save_catalogue.json` and the newer connection backend from their copied runtime lists. The current Windows build explicitly embeds the catalogue and uses these modules.
- The public preparation script references a nonexistent local `tools/ui-check/package-lock.json` and generates a three-suite package test command, reducing current coverage.
- `tools/package_local_beta.py` is still pinned to beta 5, while current code is beta 8.
- No public staging step changes the copied `BUILD_CHANNEL='local-beta'`. A package built from that staged version would retain local-beta defaults and suppress the normal Windows public update check.

**Source:** `prepare_full_release.py:15–16,49–60`; `prepare_public_release.py:48–52,95–96`; `tools/package_local_beta.py:4`; `desktop_app.py:59,90`; `version.py`.

**Repair:** one release manifest and one entry point; version/channel passed explicitly; fail-fast validation for all required files, native version parity, complete tests, private-data exclusion, and EXE/APK/source asset parity. Keep APK compilation behind the owner's release instruction. Do not solve the problem by invoking an old packager against the current files.

## P2 — correctness and usability repairs

### P2-01: Newly added interface text is not fully localized

**Confirmed in German.** Switching language leaves `Choose different save`, `People & patrons`, `Your chain`, `General catalogue scenario`, `Same final output`, `Base workforce` and `Save mismatch` unchanged. `Knowledge` does translate to `Wissen`, proving that the locale switch itself worked.

**Source:** hardcoded text in `journeys.js`, `chain-cards.js`, `empire-overview.js`; dictionary fallback in `i18n.js:4–18`.

Use stable translation keys and a completeness check for every new visible string across all 12 languages. Existing locale tests cover older labels and do not prove completeness of new pages.

### P2-02: Back navigation does not restore Needs filters

**Confirmed by reproduction.** `journeyCapture` stores browse, Supply, Chains and planner state but omits `needsIsland`, `needsTier`, `needsQuery`, `needsOnly` and Needs disclosure state. Capturing Liberti/Porridge, changing to Equites/Cheese and restoring the frame leaves Equites/Cheese active.

**Source:** `journeys.js:18,27`; Needs globals in `needs.js:4–6`.

Define a state serializer per page; reuse it for browser history, in-app Back and native Back. Avoid maintaining a manually growing list in the navigation wrapper.

### P2-03: Android Back bypasses the browser journey

**Confirmed statically, not on a phone in this audit.** Native `onBackPressed` uses detail Back for an overlay, but otherwise navigates every non-Home page directly to Home. This differs from the newer same-document browser history and can skip the user's origin.

**Source:** `DashboardActivity.java:230`.

Route native Back through the same journey API; fall through to Android only when no internal journey remains. Include widget-opened targets and Back after a language/source change in device testing.

### P2-04: Catalogue and island scenarios do not share all evidence inputs

**Confirmed implementation difference.** The province adapter passes the saved flood-gate state into `floodScale`; the catalogue model has no equivalent input. Its full-cycle weighting is separately hardcoded to 0.6/0.4, while regional phase definitions and `AdvisorModel.seasonAt` also implement season timing. Current 180/120 nominal lengths agree, so the hardcoded weighting alone is not a current numerical bug.

**Source:** `catalogue-chain-model.js:9`; `province-data.js:16,37`; `improvements.js:15`; `advisor-model.js:10,21`.

A general catalogue preview may intentionally omit island effects, but an island-scoped preview must either use the same verified context or explicitly identify each omitted effect. A single production-context input should supply season durations, flood gate, patron/belief and applicable modifiers to both consumers.

### P2-05: Temporary chain choices are easy to lose

**Confirmed implementation behaviour; usability gap rather than a corrupt-save bug.** `ccStates` is an in-memory Map. Browser reload/closing the EXE loses card assumptions. Forwarding them to the Planner is a separate explicit action. There is no clear saved/temporary/dirty status on a chain card.

**Source:** `chain-cards.js:2,18–26`.

Choose and communicate an explicit contract: temporary exploration, client-persisted draft, or shared saved scenario. Save/restore with campaign identity and catalogue version, not just good/region. Do not turn all checkbox changes into shared writes automatically.

### P2-06: Demo does not demonstrate the new empire overview

**Confirmed from demo construction.** Synthetic Save Insights has no new empire finance/attribute object or explicit resident counts. Enabling saved example data therefore produces unavailable metrics and incomplete resident sums on the new Home section. Several older release demo builders also lack Aegyptus entirely.

**Source:** `save-insights.js:12–23`, `empire-overview.js:5–7`, demo constructors in the release preparation scripts.

Create one coherent, explicitly fictional example empire covering three regions, real chains, population, finance, routes, specialists and seasonal constraints. Reuse it for app Demo, tests, screenshots and documentation instead of maintaining several incompatible fixture builders.

### P2-07: CI does not run all current Python tests or browser journeys

**Confirmed configuration gap.** CI names a subset of test modules rather than discovery. New empire overview, selection, production-context, transport and connection-tool tests are absent from that list. `npm test` does not execute the browser checks in `tools/`. The passing current suites also did not detect the fuel, context collision and Needs-history reproductions.

**Source:** `.github/workflows/checks.yml:12`, `package.json:6`, `tools/check_*_browser.cjs`.

Use test discovery for the Python suite and an explicit, isolated browser test job. Add semantic parity tests across complete catalogue profiles; retain focused source-authority and campaign-collision tests. Visual/no-overflow checks alone do not validate plan correctness.

## Architecture and duplicated implementations

### A-01: Runtime function replacement is the main maintenance bottleneck

The structural scan found 99 function-assignment sites in runtime JS, including 57 declarations capturing previous/base functions. These counts are heuristics, not 99 proven bugs. Nevertheless `render`, `nav`, `sheet`, `homePage`, `openChain`, source refresh and detail behaviour are assembled through script-order-sensitive wrappers. The old and new implementations remain in the same runtime.

There are also several navigation state systems (`detailHistory`, journey frames and native Back), several recipe/projection implementations (`chain-tools`, `AdvisorModel`, `CatalogueChainModel`, `IslandModel`, `ProvinceModel`, `ChainModel`), and multiple release manifests. Different algorithms can have legitimate purposes; the problem is duplicated domain rules and unclear ownership, not the number of files.

Refactor by contract: first centralize campaign identity and unit recipes; then introduce one page/controller registry with explicit lifecycle hooks and per-page state serialization. Replace one wrapper at a time under behavioural tests. Do not delete advanced/saved/native paths merely because a static unused-symbol scan cannot see dynamic registration.

### A-02: Normalize the data truth before optimizing it

Introduce an explicit evidence record per field/group: source, campaign identity, observed game tick, received/file time, completeness and confidence. Keep recorded current state, inferred decomposition and proposed changes separate. The solver should consume this contract, not reconstruct truth from UI globals. This addresses the stale-zero and paused rollback findings together.

## Useful areas not yet fully used

1. **Permits and research/unlocks:** verified meta storage contains building/militia permits, and save structures contain research/unlock state. The current empire extractor keeps treasury and discards other storage resources. Use these to distinguish buildable-now, needs-unlock and conditional plans before recommending construction. Resolve GUIDs through official data; do not guess from numeric IDs.
2. **A common scenario comparison:** base versus proposed at identical demand, with full upstream recipes, phase reserves, fuel, workforce and route consequences. Make the objective explicit: fewer buildings, less workforce, lower upkeep or smaller seasonal stock. Current allocation is a conservative heuristic, not a global optimum.
3. **Specialist inventory feasibility:** ownership display is useful, but global scenarios should eventually account for concrete copies, existing assignments, scope/slots and the inability to place one copy on two islands simultaneously. Keep unknown radius coverage conditional.
4. **Shipping feasibility:** saved ship assignments/positions can support measured voyage observations over multiple saves. Current manual travel/round-trip assumptions are labelled; keep that honesty. Add required fleet count and verify round-trip feasibility before presenting a manifest as a usable shipping plan.
5. **Population/finance integration:** the new Home facts are mostly informative. They can drive targeted Needs reviews, verified unlock eligibility and operating-cost comparisons. Do not turn the unresolved population-attribute/resident-sum difference into a guessed per-person consumption formula.
6. **PDF/report parity:** the PDF still focuses on the older island/local-balance/supply summary. The new population/finance/patron/scenario insights are absent, and native Python and HTML reports have separate render paths. Use one report payload/read model and platform renderers with parity tests.

## Visual and interaction priorities

- The single-producer compact rows and collapsed per-building controls are improvements worth retaining.
- Nine mobile bottom-navigation entries with very small labels make page roles difficult to scan. Define fewer primary destinations and explicit secondary navigation while keeping Chains recognizable.
- Some Home metric icons are generic or misleading: Treasury uses a product cube, Knowledge a data table, and `svg('needs')` falls back to the product cube because no such path is defined. Replace them with the game's appropriate resource artwork or clear consistent resource symbols.
- Explain population units beside the relevant figures. The top empire attribute and partial tier resident totals should not look like two supposedly equal totals whose difference is hidden in a long methodology disclosure.
- Prefer immediate action summaries: problem, affected island/product, recommended change, expected effect, and one expandable explanation. Keep formulae, GUIDs and low-level evidence in detail views.
- Show whether a proposal is current, stale, temporary or saved. Data-age labels alone do not explain whether the user must recalculate or whether a draft survived reload.

## What was not found broken / false positives ruled out

- Basic API authentication and same-origin checks exist; long-lived per-device tokens are distinct from short-lived six-digit enrollment codes. The audit did not demonstrate an authentication bypass. Local HTTP is explicitly a trusted-LAN design, not an Internet service.
- Save file selection is constrained to discovered local profiles/files, with size/change/cancellation guards and atomic cache writes. No game/save modification path was added by these features.
- Route saving has revision protection, duplicate-cargo protection and a 100-route preflight guard. The solver's higher manifest generation limit alone is not an unhandled server rejection bug.
- Windows/Android update downloads have pinned repository/asset checks and SHA-256 verification; Android also verifies package identity/signing. No new end-to-end installation test was run here.
- All referenced output-good icons passed the mapping/file-existence audit. This does not guarantee immediate image decoding on every device or validate the semantics of generic UI icons.
- Current memory maps, minified source lines and old helper functions are not by themselves grounds for automatic deletion.

## Recommended implementation order

1. Add failing regression tests for the five P1 findings. Centralize campaign identity and source precedence first; migrate old state conservatively.
2. Centralize unit recipes including fuel; repair zero-reconstruction handling. Compare Chains and Planner across all factories, phase/modifier combinations and missing-input cases.
3. Consolidate release preparation and CI. Require an explicit stable channel, complete source, source/binary parity, and no private data. Build APK only when publication preparation is authorized.
4. Finish language coverage and one navigation/history contract, including Android Back and Needs filters.
5. Add scenario draft status/persistence, coherent Demo, clearer Home units and mobile navigation. Then extend permits/unlocks, specialist feasibility, shipping timing and reports.

Do not add another broad feature layer before steps 1–4. These steps improve trust in existing suggestions more than another dashboard or calculator would.
