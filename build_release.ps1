param([string]$Version = '0.21.1', [string]$BuildDependencies = '')
$ErrorActionPreference = 'Stop'
$projectRoot = $PSScriptRoot
if (-not $BuildDependencies) { $BuildDependencies = Join-Path $projectRoot 'tools\build-deps' }
$env:PYTHONPATH = $BuildDependencies
$env:PYINSTALLER_CONFIG_DIR = Join-Path $projectRoot 'build\pyinstaller-cache'
$dashboardPath = Join-Path $projectRoot 'android-probe\app\src\main\assets\dashboard'
python -m PyInstaller --noconfirm --onefile --windowed --name "Anno117Companion-$Version" --icon "$dashboardPath\app-icon.ico" --distpath "$projectRoot\releases" --workpath "$projectRoot\build\desktop-$Version" --specpath "$projectRoot\build" --collect-data reportlab --collect-all webview --collect-all pythonnet --collect-all clr_loader --hidden-import qrcode.image.pil --hidden-import tkinter --add-data "$projectRoot\guid_map.json;." --add-data "$projectRoot\save_catalogue.json;." --add-data "$projectRoot\save_reader\vendor\LICENSE.txt;save_reader/vendor" --add-data "$dashboardPath;android-probe/app/src/main/assets/dashboard" "$projectRoot\startup_guard.py"
if ($LASTEXITCODE -ne 0) { throw 'Windows build failed' }
python "$projectRoot\audit_windows_bundle.py" "$projectRoot\releases\Anno117Companion-$Version.exe" "$projectRoot\build\windows-dependencies-$Version.json"
if ($LASTEXITCODE -ne 0) { throw 'Windows dependency audit failed' }

Copy-Item -LiteralPath "$projectRoot\releases\Anno117Companion-$Version.exe" -Destination "$projectRoot\releases\Anno117Companion.exe" -Force
