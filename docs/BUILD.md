# Build & test

[← Overview](../README.md) · [Architecture contracts](ARCHITECTURE_CONTRACTS.md)

Generated catalogue/dashboard resources are checked in; no local game extraction is required to build this version.

## Windows

Use Python **3.11 x64** with Tk. From the repository root:

```powershell
pip install -r requirements-build.txt
.\build_release.ps1 -Version 0.28.0 -BuildDependencies <dependency-folder> -PythonExecutable <python.exe>
```

The script builds the self-contained EXE and audits its native DLL payload. Python and development tools are not needed by end users. See [Windows compatibility](WINDOWS_COMPATIBILITY.md) for runtime requirements and browser fallback.

## Android

Use JDK 17, Android SDK platform 35 and the Gradle wrapper. Set your own untracked `android-probe/local.properties`, or supply the SDK through the supported environment configuration. In `android-probe`:

```powershell
.\gradlew.bat assembleDebug lintDebug
```

Debug builds use `hu.anno117.companion.productionbeta`, separate from the public app. A release build requires `ANNO_KEYSTORE`, `ANNO_STORE_PASSWORD`, `ANNO_KEY_ALIAS` and `ANNO_KEY_PASSWORD` in the process environment, then `assembleRelease lintRelease`. The helper `tools/build_android_release.ps1` can read an external private signing configuration. Never commit keys, passwords or local settings.

A self-built APK can use your own key, but it cannot update a public release-signed installation unless the signing identity matches. Builds need not be byte-identical across environments.

## Checks

```powershell
python -m unittest discover -p 'test_*.py'
npm ci
npm test
```

CI also uses `tools/serve_test_dashboard.py` and `tools/check_release_browser.cjs` for isolated synthetic browser checks. These do not open real saves or the game pipe.

## Packaging

After building both platforms, run `python tools/package_release.py --sdk <sdk-folder>`. It checks EXE/source fingerprints, dashboard asset parity, APK identity/version/signing and private-data exclusions. The public Android certificate is pinned in `release_manifest.py`; private keys are not distributed. This command stages local files and never uploads them.
