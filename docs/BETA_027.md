# Empire overview and compact single producers - 0.27.0 beta 8

Local free Windows beta. No APK built and no GitHub publication.

## Home facts

Six compact facts show the selected participant's saved population attribute, treasury, net balance per minute, knowledge, belief and prestige. Finance details show income and expenses. Treasury uses the money product (1010017) in the selected participant's MetaEconomy storage, not the Money income attribute. Finance comes from that participant's MetaMoneyManager record. No AI participant data is merged.

People & patrons expands into province/tier portraits with explicit saved resident and residence counts. Select a tier, then an island, to open its Needs page with the relevant filters. Island lists also show recorded patron, belief and the next production-related milestone when configured. Empire belief is not substituted for island belief.

ResidentCount is read as a floating-point value on each residence. A missing/invalid value stays unknown; incomplete totals show a lower-bound marker. Displayed whole numbers are rounded. The empire population attribute and explicit residence sums use different source fields and are not claimed to reconcile. In the inspected save, 2,129 of 2,180 residences had explicit counts. Existing planning keeps measured consumption; no extra per-person demand is guessed or added twice.

Read-only schema 7 invalidates older derived caches and reparses the save. Matching, participant selection and file-change checks stay in force. Facts carry save time and remain saved observations while paused. Background refresh preserves the main Home DOM and disclosures.

## Single producers

A product with one producer and no inputs uses a compact building/output-per-minute row. A large one-node balanced graph is omitted. Region choice and expandable synchronized modifiers remain available. Real input dependencies, including module feed introduced by a switch, still produce the chain graph. Detailed calculations remain available.

## Validation and deployment

Fixed executable location and Desktop shortcut retained. Tests cover participant isolation, finance signs, unknown and nonfinite values, explicit residence counts, real-save totals, compact Oats, module-feed dependencies, population-to-Needs navigation and responsive layouts. No game or save file is modified.
