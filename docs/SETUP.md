# Setup & troubleshooting

[← Companion overview](../README.md) · [Deutsch](SETUP.de.md)

## Start on Windows

### 1. Download and open the Companion

1. **[Download the Windows ZIP directly](https://github.com/oriskoat/anno117companion/releases/download/v0.28.0/Anno117Companion-0.28.0-Windows-x64.zip)**, or choose the Windows ZIP on the [latest release page](https://github.com/oriskoat/anno117companion/releases/latest). GitHub's **Code → Download ZIP** is the source code, not the ready-to-run app.
2. Right-click the downloaded ZIP and select **Extract All**. Choose a folder you can write to, for example `Documents\Anno117Companion`. Run the extracted app, rather than opening the EXE inside the ZIP.
3. Open **Anno117Companion.exe**. Python, Android Studio and development tools are not needed.
4. Choose **Demo** to explore the invented Example Empire without starting the game. The top bar contains the local-server controls, Demo/Live switch and pairing details for other devices. Expand the bar if it is collapsed.
5. For your own game, follow the `/pipe` instructions below, then select **Live**. Keep one Companion instance running on the gaming PC.

Target: Windows 10 22H2 / Windows 11 **x64**. The embedded window uses .NET Framework 4.8+ and WebView2 109+. If these are missing, the bundled browser-mode controller offers **Open browser** so you can use the dashboard in your installed browser. No prerequisite is silently installed. The EXE is unsigned; Windows reputation/security controls may display a warning. No clean Windows VM certification is claimed. [Compatibility details](WINDOWS_COMPATIBILITY.md).

### 2. Enable the game's statistics pipe

**The launch argument is `/pipe` — including the forward slash.** Enter it in the game's launcher settings, not in the Companion, an in-game chat or a console. The game must be restarted after adding it. Ubisoft documents pipe activation in its [Anno 117 pipe example](https://github.com/UbisoftMainzAnno/anno117_pipe_example#activation).

**Ubisoft Connect**

1. Close Anno 117 if it is running.
2. Open your Ubisoft Connect library and find **Anno 117: Pax Romana**.
3. Open the game's menu/settings and choose **Properties**. Depending on your launcher version, this is available from the game's menu, a right-click, or **Manage**.
4. Find **Game launch arguments / Add launch arguments**, add `/pipe` and save. If you already use other arguments, retain them and append a space followed by `/pipe`.
5. Launch Anno again from that launcher.

**Steam**

1. Close Anno 117. In your Steam Library, right-click the game and open **Properties → General**.
2. Add `/pipe` to **Launch Options**, retaining any existing arguments, then close Properties and launch the game again. See [Steam's launch-option instructions](https://help.steampowered.com/en/faqs/view/7D01-D2DD-D75E-2955).
3. If your Steam installation starts through Ubisoft Connect and no statistics arrive, check the Anno launch arguments in Ubisoft Connect as well.

### 3. Receive your first Live statistics

**The game only supplies new statistics while the simulation is running — not while paused.** Let the game run and receive statistics at least once. If you pause afterwards, the Companion continues to display the **last received data**, including its supply calculations, and marks older values as **Cached** with their age. It does not invent or extrapolate changes during the pause. When you resume and the game publishes statistics again, the values update automatically. If no data has been received yet, pausing cannot provide an initial snapshot.

1. Keep the Companion's **local server running** and select **Live**.
2. In Anno, load a save and **resume the simulation**.
3. Open **Production Statistics** using the game's statistics interface. Allow a little time for island statistics to arrive; islands can update separately.
4. Check the Companion's status. **Live + cached** means some islands have fresh data while others still use their previous values. Individual islands retain their own update age.
5. When you pause, leave the statistics view, or close the game, the pipe may stop publishing. The last data remains available as **Cached**, with its age. Live mode means “use my game connection”; it does not guarantee that a new message is arriving at that moment.

You can use the complete tool in the EXE, or click **Open browser**. The Windows app must stay running to serve other devices. Minimizing it is fine; closing it stops its server.

## Android, iPhone and another computer

### Before pairing

- Start the Windows Companion and leave its local server running. Expand the pairing bar to see the **PC address**, **six-digit code** and **QR code**.
- Connect your phone/tablet/laptop and the PC to the same trusted local network. The PC may use Ethernet while the phone uses Wi-Fi.
- Use the address displayed by the Companion, including its port, for example `http://192.168.1.50:11780`. This is only an example: use **your PC's displayed address**, not this one or `localhost` on the phone. The six-digit code alone cannot find the PC.
- If Windows Firewall prompts, allow the Companion on your trusted **Private** network. Guest Wi-Fi/client isolation or a VPN may prevent devices from reaching one another.

### Android app

1. **[Download the Android APK directly](https://github.com/oriskoat/anno117companion/releases/download/v0.28.0/Anno-Companion-0.28.0.apk)** on your phone and open the downloaded file.
2. If Android requests permission to install from that browser/file manager, review and allow that installation source to proceed. This is a direct APK installation, not a Play Store download.
3. Open **Anno Companion**. Demo works without pairing or the game.
4. Select **Live**. If the app is not paired, it opens the connection screen. Enter the PC address displayed by the Windows app and its current six-digit code, then connect.
5. Pairing is remembered. If a code has expired, use the current code from the PC window. You do not need your Windows username, Windows password or SMB access.
6. For the widget, use **More → Add home screen widget**, then confirm placement in your launcher; alternatively use the launcher's Widgets menu. The widget has its own Demo/Live control. Background refresh timing depends on Android; use its refresh button when needed.

Requires Android **8.0+**. The public app ID is `hu.anno117.companion`. Older Pipe Probe/development builds use a different ID and remain separate; pair the public app once. Public APK updates retain the package and dedicated signing identity. The private key is not in this repository.

### iPhone / iPad

1. Scan the Windows Companion's QR code with your camera and open the link in Safari. Alternatively, type the displayed PC address into Safari and enter the six-digit pairing code when asked.
2. Select **Live** for your own statistics, or **Demo** for the example empire.
3. To keep an icon, use Safari's **Share → Add to Home Screen**. Menu wording may differ by iOS version.
4. Keep the PC Companion running and remain on the same LAN. There is no native iOS app; this is the Companion's local web interface.

### Another computer

Open the displayed PC address in a browser on that computer, enter the six-digit code, and select Demo or Live. No second bridge or game installation is needed on the viewing computer.

## If something does not connect

| What you see | What to check |
| --- | --- |
| Live selected, but Cached data | Resume the game; confirm `/pipe` was added before the last game launch; close and reopen Production Statistics. Check each island's age. |
| Live + cached | Fresh messages are arriving for some islands. Others keep their last values until the game publishes them again. |
| Waiting for Anno / no islands | Load a save and open Production Statistics. Start only one pipe-reading tool at a time: another Companion or pipe reader can occupy the game's pipe. |
| Phone cannot reach the PC | Keep the Windows server running. Check the displayed IP/port, shared LAN, Private-network firewall permission, guest-network isolation and VPN. |
| Pairing code rejected | Use the current six-digit code from the PC. It expires/rotates; it is not your Windows PIN or password. After repeated failures, wait a minute before retrying. |
| Embedded Windows window unavailable | Use the offered **Open browser** controller. For an explicit browser-mode launch, run `Anno117Companion.exe --browser` in the extracted app folder. |
| Cannot start a second Companion | Close the previous instance. The local server port may already be in use. |

For a bug report, describe the platform, Companion version, visible connection state and reproduction steps. Do not upload `bridge-settings`, pairing codes, QR codes, tokens or personal exports.

## What the numbers mean

The game pipe reports production statistics, not warehouse stock, imports, ships or actual residence/service coverage. A local negative balance may already be covered by trade. Suggestions and routes are plans: apply them manually in Anno. The app never sends game commands.

The catalogue uses extracted game update 3.0 data for Latium, Albion and Aegyptus. Difficulty changes manual residence-demand scenarios; it does not alter already-observed consumption or nominal recipe ratios. A matching save can provide recorded residence counts, stocks, fertility, buildings, research and item assignments. Coverage, missing fields and hypothetical placements remain conditional. Manual Needs observations stay on the device; shared route plans stay on the PC bridge. The Demo is fictional.

## Updates and saved data

Update checks use GitHub Releases. Downloads are verified; Windows restarts to replace the EXE, and Android uses the system installer. Drafts/prereleases are not selected by the current stable updater. Keep `bridge-settings` beside the Windows EXE when replacing it; it contains private pairing, shared route plans and cache. Do not upload that folder or exported PDFs in a bug report.

## Using Save Insights

On the Windows Companion, select **Live**, enable **Use save data**, then use **Choose different save** to review the campaign and file. A matching fresh pipe observation takes priority for rates; saved stocks, buildings, population and progression are separate evidence. Without new pipe data, the recorded snapshot remains usable. A newer save file does not by itself prove its statistics history is newer than the last pipe observation.

The Companion reads saves locally and never writes to them. Recheck the selected campaign if island names or fulfilment states appear unexpected. Ambiguous automatic matches require an explicit choice.

[Planner guide and calculation limits](RELEASE_028.md) · [Build from source](BUILD.md) · [Privacy](../PRIVACY.md)
