# Runtime authority contracts — 0.28.0

| Domain | Owner | Consumers / limits |
|---|---|---|
| Unit recipe, separate fuel | `production-model.js` | Advisor scenarios, catalogue chain adapter and province profiles. Extra output leaves base recipe inputs unchanged. Module support inputs remain explicit. |
| Evidence chronology | `save_reader/evidence.py` | Service rate merge only. Fresh matching pipe wins; unknown clock domains cannot prove a saved sample newer. Saved inventory/building facts are independently timestamped. |
| Producer decomposition | `province-data.js` | Creates solver input. Positive received rates survive a zero/unknown saved decomposition; count and phase allocation remain unknown. Solver receives profiles, not save binaries. |
| Campaign identity | `campaign-model.js` | Routes, manual Needs, scenario drafts and navigation context. Fingerprint first, provisional pipe-session key otherwise. No silent name-only migration. |
| Navigation | `Navigation`, `companionPages`, `PageState` | Final primary/secondary menus, page registration and state serialization. Browser/in-app/native Back use the same journey. Legacy menu insertion is disabled when the shared navigation owner exists. |
| Scenario drafts | `ScenarioStore` | Device-local choices keyed by campaign, catalogue hash and good/region. It never overwrites recorded evidence or shared PC route documents. |
| Progression/economy | `save_reader/progression.py`, `overview.py`, `capability-data.js` | Participant-scoped records and official nominal catalogue definitions. Availability can be observed, unlocked, locked, researched or conditional. No guessed per-person demand. |
| Item copies | `specialist-model.js` | One concrete copy per proposed island allocation, recorded assigned location respected. Radius/slots/transfer feasibility stay conditional. |
| Shipping observations | `save_reader/voyages.py`, `shipping-model.js` | Bounded transitions between save observations; manual leg delay/loading until explicitly changed. Required ships do not certify assigned vessel capacity. |
| Reports | `report-model.js` | One read model in the authenticated report payload, consumed by HTML and native Python renderers. Platform layout differs; shared facts do not. |
| Release | `release_manifest.py`, `tools/package_release.py` | One source allowlist, public Android certificate/package pin, stable version and binary/assets checks. Compatibility prepare commands only delegate. No upload operation exists. |

The remaining script wrappers are retained compatibility glue, not new data authorities. They should be migrated incrementally with behaviour tests; a static unused-symbol result is not permission to delete native/saved/advanced paths. Province allocation and coupled simulation are conservative heuristics, not a certified global optimiser.
