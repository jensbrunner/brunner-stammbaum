$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$env:VITE_ENCRYPTED_ARCHIVE_URL = 'https://raw.githubusercontent.com/jensbrunner/brunner-stammbaum/main/brunner.zip.enc'
$env:VITE_GOOGLE_ANALYTICS = 'false'

Add-Type -AssemblyName System.Windows.Forms
$buildAnswer = [System.Windows.Forms.MessageBox]::Show(
  'Also rebuild the npm project?',
  'Publish family tree',
  [System.Windows.Forms.MessageBoxButtons]::YesNo,
  [System.Windows.Forms.MessageBoxIcon]::Question,
  [System.Windows.Forms.MessageBoxDefaultButton]::Button2
)
$runBuild = $buildAnswer -eq [System.Windows.Forms.DialogResult]::Yes

$rootDir = $PSScriptRoot
$repoDir = Join-Path $rootDir 'topola-viewer'
Set-Location $repoDir

$sevenZip = 'C:\Program Files\7-Zip\7z.exe'
$gedPath = Join-Path $rootDir 'brunner.ged'
$mediaPath = Join-Path $rootDir 'media'
$zipPath = Join-Path $rootDir 'brunner.zip'
$encPath = Join-Path $rootDir 'brunner.zip.enc'
$commitMessage = 'Update family tree'

if (-not (Test-Path $gedPath)) { throw "Missing brunner.ged at $gedPath" }
if (-not (Test-Path $mediaPath)) { throw "Missing media folder at $mediaPath" }
if (-not (Test-Path $sevenZip)) { throw '7-Zip not found at C:\Program Files\7-Zip\7z.exe' }

Remove-Item $zipPath, $encPath -ErrorAction SilentlyContinue

& $sevenZip a -tzip $zipPath $gedPath $mediaPath

npm.cmd run encrypt-tree -- $zipPath $encPath

if ($runBuild) {
  npm.cmd run build
}

Set-Location $rootDir
git add -A
git commit --allow-empty -m $commitMessage
git push origin main

Write-Host 'Done.' -ForegroundColor Green
Read-Host 'Press Enter to close'
