# 0.28.0 — Supply Planning

Released with owner approval. Windows and Android use the same dashboard and public update channel. All features remain free.

## Quick review

1. Start the unchanged Desktop shortcut. It opens the current EXE from the fixed Companion folder, retaining settings. Choose Demo for a fictional empire or Live for your selected matching save and pipe.
2. Open Home. Population and belief open people/patrons; Knowledge opens Build readiness; Treasury/Balance open financial context and a lower-upkeep scenario action.
3. In More → Build readiness, inspect explicit permit counts, research queue/completions and conditional factory availability. Missing evidence is not a confirmed unlock.
4. Open Chains. Single-source goods stay compact. Change water/module/granary/specialist assumptions, reload and verify the device draft. The detail view uses the same scenario.
5. In Needs, choose a tier/island, open a different page and use Back. The original filters/disclosures should return. Mobile primary navigation has Home, Supply, Chains, Routes and More; other pages are under More.
6. Generate a province plan first, then an empire plan. Choose an objective; review upstream inputs/fuel, seasonal reserves, local/import allocation, additions/reductions, nominal operating costs, one-time materials and specialist copy locations.
7. Open fleet feasibility. Travel and loading are explicit assumptions. Repeated saves can accumulate bounded route-target cycle observations. Apply an observed bound explicitly; a required fleet count does not certify the capacity of assigned vessels.
8. Export the newspaper PDF. Saved population, finances, patrons, permits/research and the current proposal share one report read model with browser/Android print output.
9. If an older plan appears missing after campaign isolation, use More → Previous plans & observations. Preview and import explicitly; nothing is silently attached by a reused campaign name.
10. Install the release APK over the public app. It uses `hu.anno117.companion` and the existing public release certificate. Development `.productionbeta` apps are separate installations. Test native Back, pairing and the widget manually.

## Data and calculation contract

Matching fresh pipe rates take priority. Cached matching pipe values are retained when a newer saved rate cannot be demonstrated; file time alone does not establish saved statistics-history time. Saved stocks, buildings, residence records and progression stay separate evidence. No positive received capacity is discarded because an older save lists a paused/unknown producer; its building split is marked unresolved.

Population attributes and explicit residence sums can differ. Missing residents stay unknown. Demand is read from production/consumption evidence, not invented from a population multiplier. Factory recipes include separate fuel and module support demand. Additional output does not multiply base recipe input consumption.

Planning remains a conservative heuristic. Coverage geometry, slots, workforce/input availability, hypothetical water/granary/module placement and unknown prerequisites remain conditional. A stored specialist copy can be reserved once per proposed island allocation; an assigned copy is reused only on its recorded island. This does not certify every producer is inside its radius. Paused-building upkeep and actual tax/buff changes are not modeled as a guaranteed treasury prediction.

## Build and release

- Windows: `build_release.ps1 -Version 0.28.0 -PythonExecutable <build-python> -BuildDependencies <deps>`.
- Android: `tools/build_android_release.ps1 -SigningConfig <private-config> -JavaHome <jdk17> -AndroidSdk <sdk>`; secrets remain outside the source package.
- Package: `python tools/package_release.py --sdk <sdk>` after both builds. Use `--published` only when preparing an approved public release. Old prepare commands delegate here.
- Packaging fails on source/EXE drift, APK asset mismatch, wrong app ID/version/debuggable state, or a different certificate. It writes ZIP/APK/EXE/source/checksums/manifest locally, with no upload command.
- Windows is unsigned, as was the previous public EXE. No new Authenticode certificate is invented. The Android certificate SHA-256 is pinned in `release_manifest.py`.

Run `python -m unittest discover -p 'test_*.py'` and `npm test`. CI additionally runs the synthetic headless browser checks without opening game saves or the pipe. Physical Android/iPhone and a clean Windows VM remain separate manual compatibility checks.
