# Changelog

## 0.28.0 — 9 November 2026

- Share a fuel-aware unit recipe across Chains and Planner, including multi-building fuel consumption.
- Preserve newer matching pipe rates while paused; keep saved inventories/buildings independent. Unknown clock domains and producer decompositions stay explicit.
- Isolate shared routes, manual Needs observations and device drafts by campaign fingerprint; preview/import older name-based plans explicitly.
- Restore Needs/page state through browser and Android Back. Keep scenario choices across reloads. Use five primary mobile destinations, with secondary pages in More.
- Add Build readiness with recorded permits, completed/queued research and conditional unlock checks.
- Compare fewer buildings, workforce, nominal upkeep or seasonal reserve at the same demand; show construction materials and concrete specialist-copy allocation.
- Add bounded ship target-transition cycle observations, explicit travel/loading assumptions and required fleet counts. No sea-path inference or exact arrival claim.
- Make saved population/finance/knowledge facts actionable and include them, patrons and current proposal details in the shared HTML/native-PDF report payload.
- Expand the fictional Demo and translated UI. Replace generic Home resource symbols with official resource artwork.
- Build from one release manifest, verify runtime/source/APK assets and public Android certificate, and keep operator settings/captures/keys out of archives.

This is a conservative scenario planner, not a guaranteed global optimum. Spatial coverage, actual shipping capacity, unknown unlocks, prerequisites and hypothetical placements remain conditional. Nominal building maintenance is not a forecast of total treasury changes. All features remain free.


## 0.21.5 — FAQ and a cleaner More page

- Find setup, pairing, troubleshooting and planning help under More → FAQ / How To. The guide is available in English, German and Hungarian.
- Find connection, language, updates, Save Insights and data tools in grouped settings. Support remains accessible when About is collapsed.
- Needs → Build chain opens Balanced chain by default, with the island deficit available as a planning option.

## 0.21.4 — Needs chain planning

- Build chain opens the balanced production chain when the island has no local deficit.
- Import planning offers all eligible producer regions and retains the destination island.

## 0.20.2 — Observed production in import planning

- Rank production-region islands by local surplus, then observed production, then other compatible islands. Show production, consumption, local balance and data freshness on each photo card.
- Plan a transfer directly from observed surplus to the original destination. Cap the proposed rate by both surplus and deficit, distinguish partial coverage, and retain manual cargo quantities.
- Offer production expansion on existing producer islands and new construction on other region-compatible islands. Do not imply that all chain inputs, fertility, deposits or unlocks are confirmed.
- Translate the new interface text in all twelve supported languages.


## 0.20.1 — Island artwork in production and import planning

- Show distinct regional island artwork in the “Build there and plan import” island picker instead of the pale Needs icon.
- Keep source-island selection and the original import destination intact. Verify image loading and layout on desktop and mobile.


[Windows EXE history](CHANGELOG_WINDOWS.md) · [Android APK history](CHANGELOG_ANDROID.md)

Latest stable release: [0.20.2](https://github.com/oriskoat/anno117companion/releases/tag/v0.20.2). See README for setup and build instructions.
