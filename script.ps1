$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$env:VITE_ENCRYPTED_ARCHIVE_URL = 'https://raw.githubusercontent.com/jensbrunner/brunner-stammbaum/main/brunner.zip.enc'
$env:VITE_GOOGLE_ANALYTICS = 'false'

function Normalize-GedcomMediaPaths {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Content,
    [Parameter(Mandatory = $true)]
    [string]$AbsoluteMediaRoot
  )

  $normalizedRoot = ($AbsoluteMediaRoot.TrimEnd('\', '/') -replace '\\', '/')
  $pattern = '(?im)^(?<prefix>\s*\d+\s+FILE\s+)(?<path>.+)$'

  return [regex]::Replace($Content, $pattern, {
    param($match)

    $prefix = $match.Groups['prefix'].Value
    $path = $match.Groups['path'].Value.Trim()
    $path = $path -replace '\\', '/'
    $path = [regex]::Replace(
      $path,
      "^(?i)" + [regex]::Escape($normalizedRoot) + "(?:/)?",
      'media/'
    )

    return $prefix + $path
  })
}

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
$npmDir = Join-Path $rootDir 'topola-viewer'
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

$stagingDir = Join-Path ([System.IO.Path]::GetTempPath()) ('brunner-stammbaum-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $stagingDir | Out-Null
try {
  $stagedGedPath = Join-Path $stagingDir 'brunner.ged'
  $gedContent = [System.IO.File]::ReadAllText($gedPath)
  $normalizedGedContent = Normalize-GedcomMediaPaths -Content $gedContent -AbsoluteMediaRoot $mediaPath
  [System.IO.File]::WriteAllText(
    $stagedGedPath,
    $normalizedGedContent,
    [System.Text.UTF8Encoding]::new($false)
  )

  & $sevenZip a -tzip $zipPath $stagedGedPath $mediaPath

  Set-Location $npmDir
  npm.cmd run encrypt-tree -- $zipPath $encPath
}
finally {
  Remove-Item $stagingDir -Recurse -Force -ErrorAction SilentlyContinue
}

if ($runBuild) {
  Set-Location $npmDir
  npm.cmd run build
}

Set-Location $rootDir
git add -A
git commit --allow-empty -m $commitMessage
git push origin main

Write-Host 'Done.' -ForegroundColor Green
Read-Host 'Press Enter to close'
