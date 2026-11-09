# Island Production Planner — 0.22.0 local beta 2

This is a local, free development build. It has not been published to GitHub.

## Start

Windows: extract the Windows ZIP into a writable folder and run the beta EXE. It uses port **11790**, separately from the public Companion's default 11780. Keep only one active reader of the game's pipe. The top bar separates server availability from game-data availability.

Android: the beta APK installs as **hu.anno117.companion.productionbeta**, separately from the public app, with a development signature. It does not replace the public app or inherit its pairing. Open connection settings to discover PCs on the local network, choose one, and approve the device with that PC's six-digit code. Subsequent connections to the remembered address reuse the saved pairing. A computer/browser can also use the PC address or QR code. A browser cannot scan a LAN directly; an already paired browser can ask its PC server to discover other servers.

The beta channel does not install public stable updates over the beta. Public release signing and promotion remain a separate approval step.

## Island decisions

Planner opens with an island, its source timestamps, relevant regional events and a short list of supply issues. Received local deficits are **not** proof that existing shipping fails. Expand a good to compare island, region and empire demand, consider an import or create a production blueprint. Search works while typing. Deity and individual good sections retain their expanded state during updates.

The Nile timeline uses the game's own dry/flood icons. Only the game's configured target building variants receive those effects. The Reed Gatherer is affected by the Nile and is eligible for the granary farm bonus; it has no direct aqueduct productivity bonus in the inspected game definitions. Granary coverage still requires confirmation.

Latium uses the five official Pillars of Ash phase icons. The save reader reads CurrentPhase, SchedulerIsActive, PhaseTime and PhaseEndTime from VolcanoEruptionManager. PhaseEndTime is a phase duration in this encoding; the countdown is duration minus elapsed time. Future phase lengths can change with balancing, overtime, first runs and aborted preludes. Nominal-cycle plans do not forecast building damage or certify all future event timings.

## Reliable supply blueprint

Choose the demand scope, producer, base productivity, fertility, relevant water/module/granary assumptions, specialist and local deity/belief. The blueprint calculates:

- smallest whole producer count covering the configured full cycle;
- production targets per phase, including reduced operating targets to avoid permanent surplus;
- reserve-space requirement, interruption buffer and starting stock required in the saved current phase;
- a conflict when that reserve exceeds the selected storage allowance;
- nominal peak recipe inputs, including separate Dovecote Wheat, and regional import requirements.

Open the network plan to enter shipping quantities per visit, round-trip intervals and travel delays. Cargo draws from a common source inventory; it cannot be allocated twice. Live scenarios share the revisioned PC plan store. The source inventory, not a route's mere existence, constrains loading. The app does not control production or create routes in the game.

## Deity comparison and storage pressure

The island comparison evaluates all recorded producers at the same belief, retaining known owner-linked water/modules and unconditional empire upgrades. It displays production trade-offs and the next relevant belief threshold. Local-demand coverage is a comparison measure, not an overall ranking of every religious benefit. Check patron unlock/region eligibility before changing the game.

Storage pressure includes **all 17 configured rat-sensitive goods**, including goods with stock but no received production row. It measures quantities above normal storage. It is not an exact rat-event probability or a guarantee that a blueprint prevents every incident. Other sensitive goods and supporting inputs can still cause pressure.

## Connection and save diagnostics

Connection settings offer local PC discovery and a read-only `/pipe` check. Steam launch options are checked in detected game/profile configuration. Running Anno arguments are checked independently of the launcher. Unsupported or inaccessible launcher configuration is explicitly **unknown**; Ubisoft Connect's persisted launch-option format is not claimed to be verified. Nothing edits launcher settings or posts data externally.

Diagnostics separately show the pipe state, protocol, message count, last pipe error, save switch, selected campaign/file, read status, available island count and campaign matching. **Use save data ON does not mean that a readable or matching save has been loaded.** When pipe data has not arrived, the app cannot establish a pipe/save campaign match.

## Limits and verification

Radius membership, specialist conditional boosts/recipe substitutions, workforce/input interruptions and a complete coupled upstream network are not certified. Plans expose assumptions rather than treating missing evidence as a bonus. Shipping throughput remains an explicit assumption. Rates are long-run cycle averages; an exact next-extra-output timer is not inferred.

The synthetic demo includes Latium, Albion and Aegyptus and is isolated from real save data. Public packages exclude saves, local settings, pairing tokens, private screenshots and recordings.

Run Python checks with `python -m unittest discover -p "test_*.py"`; run UI/model checks with `npm ci` then `npm test`. Build Windows with `build_release.ps1` and the build dependencies in requirements-build.txt. Android uses Java 17, the Android SDK and the Gradle wrapper. The EXE supports `--self-test result.json` for bundled runtime checks.

Physical Android-device testing is separate from the build and responsive-browser checks; no phone was connected during this beta's build checks.
