# Anno 117 Companion 0.28.0 — Supply Planning

Plan a province first, then your whole empire. This update brings the production-planner betas into the free public Companion on Windows, Android and LAN browsers.

- **Full-chain supply plans:** allocate local production and imports, include upstream ingredients, separate fuel and module inputs, and compare seasonal reserves and proposed additions/reductions.
- **Choose your objective:** keep the current layout, consolidate production, or compare fewer buildings, lower base workforce, lower nominal upkeep and smaller seasonal reserves.
- **Use saved progression:** inspect recorded permits, completed/queued research and conditional building availability under More → Build readiness.
- **Specialist feasibility:** show recorded copy locations and assignments; avoid reserving the same copy for two islands in a proposal. Unknown coverage and slots remain conditional.
- **Shipping feasibility:** explicit travel/loading assumptions, required fleet counts and optional bounded cycle observations accumulated across saves.
- **A useful Home and PDF:** saved population by tier, finances, knowledge, belief and patrons link to relevant actions. Reports include the saved empire and current plan.
- **More dependable navigation:** retained scenario drafts, restored Needs filters through Back, five primary mobile destinations and expanded translations/Demo.
- **Correctness fixes:** fuel consumption, paused pipe/save rate precedence, positive-rate versus paused-save conflicts and campaign isolation for routes/manual Needs.

## Install or update

Already using the Companion? Open **More → Updates** on Windows or Android. Otherwise download and extract the **Windows-x64.zip** into a writable folder and run **Anno117Companion.exe**. Install the APK on Android; iPhone and other computers use the Windows Companion's local browser interface.

The APK uses the existing public app ID and signing certificate, so it can update the public app. Development `.productionbeta` installations remain separate. Windows remains unsigned, as in the earlier public releases. The raw EXE is also attached for the built-in updater; ordinary first-time Windows installation should use the ZIP.

Enable `/pipe`, restart Anno, load your save, let time run and open Production Statistics for new pipe observations. No new pipe data arrive while paused; last-known matching data remain usable. Save Insights is read-only and local. Older name-based plans can be explicitly reviewed/imported under **More → Previous plans & observations**.

## Validation and limits

70 Python checks, 11 JavaScript suites, desktop/mobile-width headless browser checks, Android release lint and the six frozen-EXE self-checks passed. APK signing and runtime/source/dashboard parity were verified. SHA256SUMS and the release manifest are attached.

Plans are conditional scenarios, not game commands or a guaranteed global optimum. Actual imports may already cover local deficits. Spatial coverage, hypothetical placements, unknown prerequisites and vessel capacity still need in-game review. Sampled voyage bounds are not exact sea-path measurements. Nominal operating costs are not a forecast of total treasury changes.

**Everything remains free.** Optional coffee support is available in the app and README.
