$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

try {
  Add-Type -AssemblyName System.Windows.Forms
  $buildAnswer = [System.Windows.Forms.MessageBox]::Show(
    'Also rebuild the npm project?',
    'Publish family tree',
    [System.Windows.Forms.MessageBoxButtons]::YesNo,
    [System.Windows.Forms.MessageBoxIcon]::Question,
    [System.Windows.Forms.MessageBoxDefaultButton]::Button2
  )
  $runBuild = $buildAnswer -eq [System.Windows.Forms.DialogResult]::Yes

  $repo = Split-Path -Parent $MyInvocation.MyCommand.Path
  Set-Location $repo

  $sevenZip = 'C:\Program Files\7-Zip\7z.exe'
  $zipPath = Join-Path $repo 'brunner.zip'
  $encPath = Join-Path $repo 'brunner.zip.enc'
  $commitMessage = 'Update family tree'

  if (-not (Test-Path .\brunner.ged)) { throw 'Missing brunner.ged' }
  if (-not (Test-Path .\media)) { throw 'Missing media folder' }
  if (-not (Test-Path $sevenZip)) { throw '7-Zip not found at C:\Program Files\7-Zip\7z.exe' }

  Remove-Item $zipPath, $encPath -ErrorAction SilentlyContinue

  & $sevenZip a -tzip $zipPath .\brunner.ged .\media\*

  npm.cmd run encrypt-tree -- $zipPath $encPath

  if ($runBuild) {
    npm.cmd run build
  }

  git add -A
  git commit --allow-empty -m $commitMessage
  git push origin main

  Write-Host 'Done.' -ForegroundColor Green
}
catch {
  Write-Host $_ -ForegroundColor Red
  if ($_.ScriptStackTrace) {
    Write-Host $_.ScriptStackTrace -ForegroundColor DarkGray
  }
}
finally {
  Read-Host 'Press Enter to close'
}