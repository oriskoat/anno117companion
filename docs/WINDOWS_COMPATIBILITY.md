# Windows compatibility audit — 0.19.1

Audit date: 2026-11-01. Scope: standalone Windows EXE dependency packaging and startup resilience. This is not a certification that the app runs on every Windows installation.

## Target and runtime contract

| Component | User installation needed? | Handling |
| --- | --- | --- |
| Windows 10 22H2 / Windows 11, x64 | Supported target environment | Current EXE is a Windows AMD64 build. Other architectures/older Windows are not validated. |
| Python 3.11 and imported Python packages | No | Bundled in the PyInstaller single-file EXE. |
| Visual C++ runtime used by this build | No separate package identified | VCRUNTIME140.dll and UCRT files are bundled; no unexpected VC DLL import was found. |
| Pillow, QR, PNG/WebP, ReportLab and report fonts | No | Bundled payload and actual decode/render smoke checks passed. |
| Tcl/Tk | No | Bundled; browser-controller window was rendered from the isolated EXE. |
| .NET Framework 4.8+ | For the embedded host if absent | Detect before loading WinForms; use browser controller when unavailable. No .NET SDK or separate modern .NET Desktop Runtime is required by the intended netfx path. |
| Edge WebView2 Evergreen Runtime 109+ | For the embedded host if absent/outdated | Detect its own runtime registration, not Edge browser presence; offer browser mode and official download page. |
| Modern installed browser | For browser mode | Open browser serves the same local dashboard. A browser is not used as a substitute WebView2 runtime. |
| Writable application folder + Windows TEMP | Yes | Settings/reports/cache/updates use the app folder; one-file extraction uses TEMP. Startup explains an unwritable app folder. |

The minimum WebView2 version is a compatibility floor, not a recommendation to keep an obsolete runtime. Use the current Evergreen Runtime. The app does not silently install prerequisites, change Windows policies or bypass security prompts.

Microsoft documents WebView2 as a runtime that must be available to a distributed WebView2 app; the ordinary Edge browser is not the production runtime: [distribution requirements](https://learn.microsoft.com/en-us/microsoft-edge/webview2/concepts/distribution). [pywebview Windows dependencies](https://pywebview.flowrl.com/guide/installation.html) identify Python.NET/.NET and WebView2 for the Chromium renderer. Microsoft lists the .NET versions included in different Windows releases in its [Framework/OS matrix](https://learn.microsoft.com/en-us/dotnet/framework/install/versions-and-dependencies).

## Work completed

- Inspected current PyInstaller warning output and native PE imports. Optional Linux/macOS/Qt/Android imports and dynamically loaded .NET namespaces are not automatically classified as missing Windows packages.
- Inspected all **87 bundled DLL/PYD binaries**, including their regular/delay imports. All expected payloads were present; external imports were declared Windows system libraries/API sets, with no unexpected external library.
- Verified Python runtime, Tcl/Tk DLLs and scripts, Python.NET/CLR loader, WebView2 managed assemblies/native loader, PDF fonts and dashboard payloads in the archive.
- Added startup checks for .NET Framework 4.8 and WebView2 109+, preventing silent fallback to the outdated MSHTML engine.
- Added `--browser`: a bundled native Tcl/Tk controller with the same local bridge, pairing code and Open browser action. Missing embedded-host prerequisites select this mode automatically.
- Added an offline `--self-test OUTPUT.json` diagnostic path. It does not read pairing files, open the game pipe, publish data or install software.
- Added local startup-error logging at `%LOCALAPPDATA%/Anno117Companion/startup-error.log` and a visible error dialog for otherwise silent failures. Existing write/server errors are made actionable.
- Added tests for missing/outdated runtime detection, browser fallback without importing WebView, service cleanup and failed hostname lookup.
- Added a build gate: `audit_windows_bundle.py` must pass before the stable EXE copy is replaced.

## Isolation test actually performed

Only the EXE was copied into a new directory whose name contains spaces and non-ASCII characters. PATH was restricted to Windows System32; Python, Tcl/Tk, virtual-environment and .NET development selection variables were removed from the child environment. No companion data folder or source tree was copied.

The frozen process exited with code 0 and passed all six checks:

1. QR generation/PNG encoding.
2. Bundled PNG and WebP decoding.
3. PDF generation with bundled fonts.
4. Tcl/Tk runtime initialization.
5. .NET Framework WinForms loading.
6. WebView2 native loader locating the installed runtime.

A second isolated invocation used `--browser --host 127.0.0.1 --port 11782`. The actual controller window rendered, and its server returned HTTP 200 for dashboard HTML and a product icon. The test window was closed afterward. It did not replace the user's saved settings/routes.

The host still had .NET Framework release 533509 and WebView2 156.0.4314.58 installed. These were not removed or hidden by this test. Missing prerequisites were covered through dependency-injected tests, rather than by altering the user's Windows installation.

Machine-readable results: [windows-compatibility-results.json](windows-compatibility-results.json). Native DLL inspection establishes import coverage, not every dynamically selected runtime path.

## Not established / remaining release validation

- No clean Windows 10 or Windows 11 virtual machine was available in this environment. A developer-machine isolated-path smoke test does not prove clean-OS behavior.
- No ARM64/emulation, 32-bit Windows, Windows 7/8, Wine, Windows S mode, corporate application-control policy or antivirus-product matrix was tested.
- A signed/unsigned download's SmartScreen or endpoint-policy behavior is separate from dependency packaging; no signing or download-reputation validation was added by this task.
- Actual removal/corruption of OS runtimes was not tested. Registry checks cannot prove that every installed WebView2/.NET file is healthy. A caught embedded-host startup exception offers browser mode; asynchronous GPU/renderer failures remain a clean-machine test case.
- Bootloader errors before Python starts (unsupported OS, blocked EXE, unwritable/blocked TEMP, damaged download) cannot be handled by the Python startup guard.

Before describing a release as clean-machine verified, run it on fresh standard-user Windows 10/11 x64 VMs without Python/development tools, both with and without WebView2, then exercise Demo, a PDF, local browser access, pairing, Live/cache, route saving, restart and updates. Keep the result and OS/runtime versions with the release.

## Repeating the checks

From the build environment:

```powershell
$env:PYTHONPATH = 'tools/build-deps'
python -m unittest test_startup
python audit_windows_bundle.py releases/Anno117Companion-0.19.1.exe build/windows-dependencies-0.19.1.json
```

From a folder containing only the built executable (no Python installation required):

```powershell
.\Anno117Companion.exe --self-test .\compatibility-result.json
.\Anno117Companion.exe --browser
```

The self-test checks prerequisites as well as bundled libraries, so missing .NET/WebView2 can yield a failed full self-test even though browser mode is usable. The JSON identifies the failed check. Full release packaging remains intentionally deferred; only a new Windows development EXE was built. Android remains 0.19.0.
