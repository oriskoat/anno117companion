param([string]$Version = '0.28.0', [string]$BuildDependencies = '', [string]$PythonExecutable = 'python')
$ErrorActionPreference = 'Stop'
$projectRoot = $PSScriptRoot
if (-not $BuildDependencies) { $BuildDependencies = Join-Path $projectRoot 'tools\build-deps' }
$env:PYTHONPATH = $BuildDependencies
$actualVersion = & $PythonExecutable -c "from version import APP_VERSION;print(APP_VERSION)"
if ($actualVersion -ne $Version) { throw 'Requested version differs from version.py' }
$env:PYINSTALLER_CONFIG_DIR = Join-Path $projectRoot 'build\pyinstaller-cache'
$dashboardPath = Join-Path $projectRoot 'android-probe\app\src\main\assets\dashboard'
& $PythonExecutable "$projectRoot\tools\build_source_manifest.py"
if ($LASTEXITCODE -ne 0) { throw 'Source manifest failed' }
& $PythonExecutable -m PyInstaller --noconfirm --onefile --windowed --name "Anno117Companion-$Version" --icon "$dashboardPath\app-icon.ico" --distpath "$projectRoot\releases" --workpath "$projectRoot\build\desktop-$Version" --specpath "$projectRoot\build" --collect-data reportlab --collect-all webview --collect-all pythonnet --collect-all clr_loader --hidden-import qrcode.image.pil --hidden-import tkinter --add-data "$projectRoot\build\source-manifest.json;." --add-data "$projectRoot\guid_map.json;." --add-data "$projectRoot\save_catalogue.json;." --add-data "$projectRoot\save_reader\vendor\LICENSE.txt;save_reader/vendor" --add-data "$dashboardPath;android-probe/app/src/main/assets/dashboard" "$projectRoot\startup_guard.py"
if ($LASTEXITCODE -ne 0) { throw 'Windows build failed' }
& $PythonExecutable "$projectRoot\audit_windows_bundle.py" "$projectRoot\releases\Anno117Companion-$Version.exe" "$projectRoot\build\windows-dependencies-$Version.json"
if ($LASTEXITCODE -ne 0) { throw 'Windows dependency audit failed' }

Copy-Item -LiteralPath "$projectRoot\releases\Anno117Companion-$Version.exe" -Destination "$projectRoot\releases\Anno117Companion.exe" -Force
