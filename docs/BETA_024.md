# Production Planner — 0.24.0 local beta 4

Local, free, unpublished beta. Retains the province/empire workflow in [BETA_023.md](BETA_023.md).

## Review without interruptions

Incoming snapshots update source status without replacing the proposal's DOM. The reviewed plan stays fixed until recalculated; a notice identifies changed input data. Changing campaign/data mode invalidates the old proposal. Expanded sections, nested recommendations, focus and scroll survive ordinary snapshot polling; explicit redraws retain panel state as well.

## Concrete production changes

Expand **What to reduce · producers and operating targets**, then a specific good/producer group. Each recommendation shows:

- existing, retained and temporarily paused producer counts;
- water/Dovecote evidence for that producer group;
- current full output and target output in each phase;
- operating percentage of the retained group's full output;
- less output over the explicit forecast window and required cycle reserve;
- potential recipe/support-input savings, separately labelled and not yet deducted from upstream baseline consumption.

Percentages are output targets, not literal values for the game's productivity slider. Achievability depends on available controls and temporary pauses. Current industrial demand is retained conservatively; re-read statistics after applying changes. These are not demolition instructions. Unresolved external export commitments protect producer groups from reduction recommendations.

## One forecast window

**Forecast & proposed changes** exposes the duration: automatic, 300, 600 or 720 **game minutes**, not wall-clock minutes. Automatic province windows are Aegyptus 300, Latium with active PoA 593 nominal minutes, otherwise 300; empire is 600. All displayed forecast-volume totals use this selected window and saved current-phase alignment. Phase operating policies/reserves still cover the underlying full regional cycle.

## Existing granaries versus new assumptions

Eligible goods show saved active granary effect sources, levels and radii. The app compares each recorded producer centre with eligible emitter positions in the horizontal X/Z plane. The result is explicitly an **estimated centre-radius match**, not certified game coverage: building footprints, distance conventions and edge rules have not been reconstructed. Missing producer positions remain unclassified; outside a centre-radius estimate is not proof of no coverage.

Existing measured output/productivity already includes active benefits. No additional granary bonus is added to that existing baseline. The optional new water/Dovecote/granary controls apply to proposed new/restored capacity, not to toggling known existing benefits off.

## Shipping observations: evidence, not automatic timing yet

Save schema 6 joins player-owned route ship references to `MetaPersistent/MetaID`. It records ship position/session, route ID, target station, harbour/building references and installed module GUIDs. Station IDs are retained to resolve the saved target. Large object identifiers remain strings to preserve precision.

**Existing shipping · saved fleet observations** shows these facts within the plan. The current inspected save provided 25 owned-route ship observations, all with positions and matched target stations. A target can remain assigned while docked; it does not prove the ship is moving or delivering cargo.

Complete sea paths, actual speed, harbour queues, loading throughput and measured round trips remain unimplemented. Transport timing is still an explicitly manual assumption. One save cannot establish a full voyage time; sparse successive saves can miss entire trips. Future measurement needs unambiguous state transitions and sampling-gap handling, while new-route estimates require verified navigable paths and ship movement rules.

## Desktop shortcut and installation

`tools/install_local_beta.ps1 -Version 0.24.0-beta4` deploys the built EXE to the isolated local beta directory, preserves settings, replaces only that directory's beta processes, and copies the latest build to the fixed path `../Anno117Companion-Beta/Anno117Companion.exe` and launches it. The Desktop shortcut always points at that fixed path. After the one-time migration it is left unchanged; subsequent deployments replace the binary, not the shortcut. Versioned release binaries remain separate for rollback. Beta behavior uses the explicit embedded build channel rather than the executable filename.

The APK remains a separate development beta package (`hu.anno117.companion.productionbeta`, versionCode 32). No public update or GitHub publication is performed by this workflow. No physical Android device test is claimed.

Movement research also confirmed configured BaseSpeed/acceleration/deceleration on inspected NavalUnit definitions (37223 and 37224). These are not yet calibrated into game-minute sea travel; no straight-line estimate is presented as a navigable voyage.
