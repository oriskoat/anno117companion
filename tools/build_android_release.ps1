param([Parameter(Mandatory=$true)][string]$SigningConfig, [Parameter(Mandatory=$true)][string]$JavaHome, [Parameter(Mandatory=$true)][string]$AndroidSdk)
$ErrorActionPreference='Stop'
# Read secrets in memory only. No passwords, private keys or config enter artifacts/logs.
$config=Get-Content -LiteralPath $SigningConfig -Raw | ConvertFrom-Json
$env:JAVA_HOME=$JavaHome
$env:PATH=(Join-Path $JavaHome 'bin')+';'+$env:PATH
$env:ANDROID_HOME=$AndroidSdk
$env:ANNO_KEYSTORE=$config.keystore
$env:ANNO_STORE_PASSWORD=$config.store_password
$env:ANNO_KEY_ALIAS=$config.alias
$env:ANNO_KEY_PASSWORD=$config.key_password
Push-Location (Join-Path (Split-Path -Parent $PSScriptRoot) 'android-probe')
try {
    & .\gradlew.bat --no-daemon --offline assembleRelease lintRelease
    if($LASTEXITCODE -ne 0){throw 'Android release build/lint failed.'}
} finally {
    Pop-Location
    foreach($key in @('ANNO_KEYSTORE','ANNO_STORE_PASSWORD','ANNO_KEY_ALIAS','ANNO_KEY_PASSWORD')){[Environment]::SetEnvironmentVariable($key,$null,'Process')}
}
