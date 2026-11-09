# Province & Empire Planner — 0.23.0 local beta 3

Free local beta. Not published to GitHub. This extends the island planner described in [BETA_022.md](BETA_022.md).

## Start and choose a scope

Run the beta EXE in a writable folder. Its default port is **11790**. Keep one active game-pipe reader. The Android beta package remains `hu.anno117.companion.productionbeta`, separate from the public app. An existing beta installation can update with this APK. Pair a phone/browser with the PC using its address/QR and six-digit code; remembered pairing is reused.

**Planner** now opens with three region cards and a large **Suggest a province supply plan** button. **Optimize my empire** is a second, distinct action. **Inspect individual islands and goods** retains the detailed island planner and manual network scenario.

Fresh matching pipe data takes priority. A readable matching save supplies stock, buildings, owner-linked water/modules, religion and event context. Pausing the game does not erase received data. Source timestamps remain visible. Demo is explicitly invented and isolated from real saves.

## Read the proposal

The first screen shows full-window demand, new buildings and shipping manifests. Expand the relevant decision group rather than reading every raw field:

1. **Unresolved supply:** no verified eligible production location/spare supply was available. This includes required imports from outside a province.
2. **Restore idle capacity / Build remaining capacity:** existing working producers are considered first. Restoring idle producers requires fixing their constraints.
3. **Operating targets:** phase targets reduce persistent surplus while preserving the configured average demand. These are manual operating targets; the Companion does not automate buildings.
4. **Potential retirements:** conditional spare-capacity candidates, never deletion instructions. Cross-boundary commitments are protected. Verify exports and input effects before removing anything.
5. **Shipping manifests:** multiple goods can share the assumed ship slots. Large quantities split into additional manifests without losing cargo. Existing route configuration is evidence of a connection, not proof of delivered tonnes per minute.

Search individual goods below the proposal. Each expands to production locations, actual water/Dovecote evidence, phase targets, reserves, transfer amounts and projected inventories. Goods are initially limited to twelve cards, with Show more available.

## Calculation and assumptions

- Existing production is allocated once, across all destinations. A donor outside the province retains its own received consumption before contributing spare supply.
- Current industrial consumption is already in the baseline. Only new/restored production adds recipe inputs and support-building demand. Added inputs propagate upstream until stable; a non-convergent proposal cannot be saved.
- Producer choices respect region and verified natural fertility. Specialist-enabled future locations are not silently assumed. Conditional/radius effects are excluded as verified bonuses; existing saved productivity and received output calibrate unresolved factors, with visible caveats.
- Recorded owner links distinguish water-connected producers from merely eligible ones. Dovecotes are linked through their owner's module IDs. New water, new Dovecotes and granary coverage require explicit assumptions. Granary geometry is not spatially certified.
- Aegyptus uses the configured dry/flood cycle; applicable Latium saves use all five nominal PoA phases. The saved current phase and remaining time align the projection. Future volcano durations remain conditional. **Dormant** means the resting volcano phase, not disabled DLC.
- Stock and rate history can have different timestamps. Consumption is held constant. Added input requirements use phase-weighted average rates; synchronous upstream recipe scheduling and input-starvation feedback are not simulated.
- Sailing interval, travel delay, cargo slots and buffer are editable assumptions. First departures are modelled after one round trip. Early missed deliveries can require staging stocks or earlier departures; existing in-transit cargo is unknown.
- Reserve conflicts and storage spill remain visible. Unknown stock stays unknown. Sensitive-stock pressure is not a rat-event probability or a rat-free guarantee.

The default objective keeps the current layout first; an alternative prefers efficient existing producers. Both are deterministic allocation heuristics, not a proof of the globally cheapest or best empire. Current local deity effects are retained; the detailed island comparison remains available for considering other patrons. This beta does not automatically choose/reassign a deity or specialist for the whole empire.

## Shared manual plans

**Save missing route plans** saves proposed manifests and compact assumptions to the PC bridge in Live mode, or local Demo storage. It preserves existing manual cargo entries and never changes game routes/buildings. An already-planned good/from/to leg is not duplicated; review its existing quantity yourself.

Shared revisions are checked. Material data changes refresh the proposal before saving. Changing campaign/data mode requires recalculation. Save files are read locally, never modified or uploaded by this feature.

## Packaging and checks

Windows dependency audit and bundled runtime self-test, Python checks, seven UI/model suites, and headless responsive checks against the local real-save preview are the release checks. APK assets and the EXE's runtime source manifest must match this source. Packages exclude operator caches, pairing credentials, personal captures and save files. No physical phone was connected for this beta's device check.

The beta channel stays separate from public stable updates. GitHub publication requires the owner's explicit approval.
