# Eski yöntem: DLL silme. EPERM için tercih edin: npm run prisma:generate:win
# (Bu projeyi kullanan node süreçlerini durdurur, .prisma temizler, generate çalıştırır.)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$dll = Join-Path $root "node_modules\.prisma\client\query_engine-windows.dll.node"
if (Test-Path $dll) {
  Remove-Item -Force $dll -ErrorAction SilentlyContinue
}

Write-Host "Önerilen: npm run prisma:generate:win" -ForegroundColor Green
Write-Host "Alternatif: tüm dev süreçlerini kapatıp: npx prisma generate" -ForegroundColor DarkGray
