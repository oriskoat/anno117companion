# Privacy

The application has no advertising SDK, analytics, telemetry service or cloud
account. The Windows bridge reads the local game pipe and serves data on port
11780 on the local network. The game is never written to through the pipe.

The six-digit code is short-lived enrollment, not the permanent API credential.
Pairing exchanges it for a random device token. Windows stores permitted tokens
under `bridge-settings`; Android stores successful pairing encrypted with its
Keystore; browser pairing is stored in that browser's local storage. Pairing is
device-specific and can be forgotten from connection settings. The local HTTP
transport itself is not encrypted: use a trusted local network.

The release demo contains synthetic example islands and rates, not the author's
saved game or captures. Local development may use private recordings, but these
are excluded from both the complete release and matching source archive.

The optional support link opens https://revolut.me/vafvyop externally. The app
does not append pairing tokens or game data, process payments, collect payment
information, or receive payment confirmations. Revolut and your browser handle
that interaction under their own policies.

No user information is uploaded by the project preparation or release scripts.
Submitting an issue on GitHub is a separate action you choose; redact addresses,
tokens, device files and private capture data before attaching diagnostics.

The PC bridge stores the most recent 60 seconds of received statistics and latest
island values locally in bridge-settings/recent-game-cache.json. This keeps a
paused game usable and survives a bridge restart. A new game session resets it.
PDF exports contain island names and production statistics from the selected
snapshot; they stay local unless you choose to share them. Neither the private
cache nor exported reports is included in release/source archives.

Update checks contact api.github.com and release downloads contact GitHub and its
asset CDN. Those services receive the normal connection IP address and the app
version User-Agent. Game data and pairing credentials are not included. No GitHub
account or access token is required for public releases.
