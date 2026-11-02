# Save Insights — working preview

**Development update — 2 November 2026**

The Companion now has a working local save-game reader alongside the live production pipe. This is already running in a private development build; it is not included in the current public release yet.

## How it works

- Switch **Use save data ON/OFF** inside the Companion.
- With save data enabled, the dashboard can use recorded production and consumption even when the pipe is unavailable. Fresh pipe data takes priority when it belongs to the same campaign and island.
- Choose a campaign, follow its newest save automatically, or select a specific save.
- Read additional information from the save: recorded stock history, existing in-game trade routes and their goods/stops, residence need states and production buildings.
- Save parsing happens locally on the Windows PC. Save files are read without modification and are not uploaded. Paired devices use the PC Companion to view the data.

Save statistics are snapshots and may predate the save itself; they are not a substitute for current live telemetry. The interface identifies saved data separately from fresh pipe data.

## Planned release

I'm planning to release this on **Thursday, 5 November 2026, after the 3.0 patch**, once I have checked the reader against the updated game and its saves. The reader already works with the current game; compatibility with 3.0 still needs that final check.

**The entire Companion, including Save Insights and the existing pipe features, is free.**

[Back to ideas](README.md) · [Companion downloads and setup](../README.md)
