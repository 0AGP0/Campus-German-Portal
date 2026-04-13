# Kullanım: .\scripts\backup-sqlite.ps1
$ErrorActionPreference = "Stop"
$src = Join-Path $PSScriptRoot "..\prisma\crm.sqlite"
if (-not (Test-Path $src)) { Write-Error "crm.sqlite bulunamadı: $src"; exit 1 }
$dest = Join-Path $PSScriptRoot "..\prisma\crm.backup-$(Get-Date -Format 'yyyyMMdd-HHmmss').sqlite"
Copy-Item $src $dest
Write-Host "Yedek: $dest"
