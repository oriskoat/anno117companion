# Governor dashboard and coupled supply planner — 0.25.0 beta 5

Free local Windows beta. No GitHub publication is authorized. Per the owner's instruction, no Android APK is built during local beta iterations; APK compilation waits for an authorized GitHub release. The shared dashboard is checked at desktop and phone viewport sizes.

## Dashboard and source controls

The Windows bar contains the official-style Companion wordmark, server actions, Demo/Live and an aligned Use save data switch. A single source panel shows campaign, island count, snapshot time and source mode; connection/save details expand beneath it. Repeated save notices are removed.

Home is a regional dashboard, not another island directory. Latium shows the saved PoA phase/countdown; Aegyptus shows the saved Nile season/countdown; Albion summarizes water links, stocks and supply. Regional problems link to the relevant island/good. Local deficits may already be supplied by ships. Sensitive overflow is a stock-pressure indicator, not proof of an active rat event.

Durations display hours/minutes/seconds. Countdown values belong to the saved game state: they do not run down against wall-clock time while the game is paused.

Snapshot, background save and background route polling preserve the currently displayed DOM, scroll, focus and opened sections. Home updates its existing counters and issue rows without sorting/removing cards while the user reads. Changed listings can be refreshed explicitly. The planner holds a reviewed proposal fixed until recalculated. Source/campaign changes invalidate the old context.

## Coupled recipe accounting

When current simple recipe inputs reconcile with received consumption, the planner separates the attributable industrial share from the remaining external/residential baseline. Changes to retained processors then propagate upstream, including reductions. Other consumers remain in the baseline. Unsupported or inconsistent balances retain their original consumption and are explicitly reported as unreconciled; no input saving is silently invented.

The one-game-minute inventory simulation follows exact phase and shipping boundaries within that step size. It consumes recipe inputs from shared island stocks, constrains downstream output when inputs are unavailable, handles phase-dependent production, and retains cargo that cannot unload. Unknown inventories remain unknown. The simulation distinguishes optional module feed from mandatory ingredients: losing feed can remove a module bonus while allowing base production to continue.

Existing unverified industrial histories cannot be fully decomposed. Those groups are identified, and baseline demand remains conservative. The simulation is a planning model, not a reproduction of the game's tick-level logistics, road transport or every specialist recipe substitution. Future PoA durations and actual sailing times remain conditional.

## Readable decisions and complete scope

Plans are available for one island, a province or the whole empire. The first screen identifies concrete products, islands, input shortages, initial reserve/delivery needs and reserve-space conflicts. Methodology and additional issues expand separately.

Reduction recommendations are grouped under prominent island headings. Closed product cards show the red producer reduction (for example −2) before the expand arrow. Existing zero-output/unknown-demand capacity is not advertised as a new saving. Upstream input rows identify whether a saving was recomputed or retained as an uncredited estimate, and show related producer changes across the scope.

Additional-capacity cards show why capacity was allocated there, dry/flood or other regional phase targets, reserve needs and links through the input chain. Locations respect the catalogue's region/fertility definitions; building unlocks and placement remain conditional. Existing spare capacity is allocated once, and incremental whole-building capacity can be shared between destinations.

## Compare improvements before building

Each new-capacity card can compare applicable water connections, all four configured additional module variants (including silos and Dovecotes), granary coverage assumptions, supported specialist base effects, alternative patrons and a next relevant belief milestone.

Module effects and support recipes are compiled from installed game definitions. A stored/assigned/not-owned specialist is labelled through the existing ownership evidence. An already assigned same-island specialist or an existing granary benefit is not simply added again to the observed baseline. Granary centre-radius matches remain estimates, not verified footprint coverage.

Local comparisons show nominal capacity changes; choosing one **previews** that scenario by recalculating the complete selected scope, its upstream inputs and coupled inventory checks. Proposed changes are listed separately from recorded configuration and can be reset. Patron comparisons list production gains and losses across all reconstructed producers on that island. Belief increases require reaching the displayed threshold; patron availability and non-production effects must still be checked.

These comparisons do not claim an exhaustive global optimum. Conditional specialist boosts/recipe substitutions and uncertain radius coverage are not certified. The model exposes those conditions rather than silently granting the bonus. Saved manual route proposals include compact selected scenario assumptions and retain revision/data-change guards. No buildings, game routes, saves or deity choices are changed in the game.

## Local deployment

Run the current build at `../Anno117Companion-Beta/Anno117Companion.exe`, port 11790. The Desktop shortcut remains fixed at this path. `tools/install_local_beta.ps1 -Version 0.25.0-beta5` replaces that binary while preserving settings and the shortcut. Versioned EXEs remain under releases for rollback. The explicit local-beta build channel is independent of the filename.

Checks include Python tests, nine JS/UI/model suites, real-save browser checks at 1440 and 390 pixels, native dependency audit, bundled runtime self-test and source-manifest matching. No physical-phone test or APK build is claimed for this iteration.
