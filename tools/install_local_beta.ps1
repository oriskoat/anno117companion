param([Parameter(Mandatory=$true)][ValidatePattern('^\d+\.\d+\.\d+(?:-beta\d+)?$')][string]$Version)
$ErrorActionPreference='Stop'
$sourceRoot=Split-Path -Parent $PSScriptRoot
$workspace=Split-Path -Parent $sourceRoot
$betaDir=Join-Path $workspace 'Anno117Companion-Beta'
$sourceExe=Join-Path $sourceRoot "releases\Anno117Companion-$Version.exe"
if(-not (Test-Path -LiteralPath $sourceExe)){throw 'Build the requested beta first.'}
New-Item -ItemType Directory -Path $betaDir -Force | Out-Null
$resolvedBeta=[IO.Path]::GetFullPath($betaDir)
$target=Join-Path $resolvedBeta 'Anno117Companion.exe'
$staged=Join-Path $resolvedBeta 'Anno117Companion.next.exe'
# Only our isolated beta processes are replaced; public Companion is untouched.
$owned=Get-CimInstance Win32_Process | Where-Object {
    $_.ExecutablePath -and (Split-Path -Parent $_.ExecutablePath) -eq $resolvedBeta -and
    [IO.Path]::GetFileName($_.ExecutablePath) -match '^Anno117Companion(?:-\d+\.\d+\.\d+-beta\d+)?\.exe$'
}
foreach($item in $owned){
    $process=Get-Process -Id $item.ProcessId -ErrorAction SilentlyContinue
    if($process){$process.Kill();$process.WaitForExit(10000) | Out-Null}
}
Copy-Item -LiteralPath $sourceExe -Destination $staged -Force
if((Get-FileHash -LiteralPath $sourceExe).Hash -ne (Get-FileHash -LiteralPath $staged).Hash){throw 'Deployment hash mismatch.'}
if(Test-Path -LiteralPath $target){Copy-Item -LiteralPath $target -Destination (Join-Path $resolvedBeta 'Anno117Companion.previous.exe') -Force}
Move-Item -LiteralPath $staged -Destination $target -Force
$desktopDir=[Environment]::GetFolderPath('DesktopDirectory')
$linkPath=Join-Path $desktopDir 'Anno 117 Companion.lnk'
$shell=New-Object -ComObject WScript.Shell
$link=$shell.CreateShortcut($linkPath)
if($link.TargetPath -ne $target -or $link.WorkingDirectory -ne $resolvedBeta){
    $link.TargetPath=$target
    $link.WorkingDirectory=$resolvedBeta
    $link.IconLocation=$target+',0'
    $link.Description='Anno 117 Companion'
    $link.Save()
}
if($shell.CreateShortcut($linkPath).TargetPath -ne $target){throw 'Desktop shortcut verification failed.'}
$settingsDir=Join-Path $resolvedBeta 'bridge-settings'
New-Item -ItemType Directory -Path $settingsDir -Force | Out-Null
# The fixed local review installation keeps its established origin/port. Public archives default to 11780.
$portHint=Join-Path $settingsDir 'listen-port.json'
if(-not (Test-Path -LiteralPath $portHint)){[IO.File]::WriteAllText($portHint,'{"port":11790}')}
$process=Start-Process -FilePath $target -WorkingDirectory $resolvedBeta -WindowStyle Hidden -PassThru
[pscustomobject]@{version=$Version;fixedTarget=$target;process=$process.Id;shortcut=$linkPath;settingsPreserved=(Test-Path -LiteralPath (Join-Path $resolvedBeta 'bridge-settings'))} | ConvertTo-Json
