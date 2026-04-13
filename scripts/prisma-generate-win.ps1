# Prisma Windows EPERM (query_engine rename): bu projeyi kullanan node süreçlerini durdurur, .prisma temizler, generate çalıştırır.
# Kullanım: npm run prisma:generate:win
# İsteğe bağlı: .\scripts\prisma-generate-win.ps1 -SkipKill  (sadece temizlik + generate; süreç öldürmez)

param(
  [switch]$SkipKill
)

# npm/CMD altında Türkçe çıktının bozulmaması için (Windows PowerShell 5.x)
try {
  if ($PSVersionTable.PSVersion.Major -lt 7) { chcp 65001 | Out-Null }
  [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
  $OutputEncoding = [Console]::OutputEncoding
} catch {}

$ErrorActionPreference = "Stop"
$root = (Resolve-Path (Split-Path -Parent $PSScriptRoot)).Path
Set-Location $root

function Stop-ProjectNodeProcesses {
  $escapedRoot = [regex]::Escape($root)
  $allNodes = @(Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" -ErrorAction SilentlyContinue)
  $procs = @(
    $allNodes | Where-Object {
      $_.CommandLine -and [regex]::IsMatch(
        $_.CommandLine,
        $escapedRoot,
        [System.Text.RegularExpressions.RegexOptions]::IgnoreCase
      )
    }
  )
  # WMI komut satırı bazen Unicode yolu farklı kodlar; tam yol eşleşmezse klasör adının ASCII kısmı
  if ($procs.Count -eq 0 -and $root -match 'Campus German Crm') {
    $marker = 'Campus German Crm'
    $procs = @($allNodes | Where-Object { $_.CommandLine -and $_.CommandLine.Contains($marker) })
  }
  if ($procs.Count -eq 0) {
    Write-Host "Bu klasör için çalışan node.exe bulunamadı." -ForegroundColor DarkGray
    return
  }
  foreach ($p in @($procs)) {
    Write-Host "Durduruluyor PID $($p.ProcessId): $($p.CommandLine.Substring(0, [Math]::Min(120, $p.CommandLine.Length)))..." -ForegroundColor Yellow
    Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue
  }
  Start-Sleep -Milliseconds 800
}

if (-not $SkipKill) {
  Stop-ProjectNodeProcesses
}

$prismaDir = Join-Path $root "node_modules\.prisma"
if (Test-Path $prismaDir) {
  try {
    Remove-Item -LiteralPath $prismaDir -Recurse -Force -ErrorAction Stop
    Write-Host "node_modules\.prisma silindi." -ForegroundColor DarkGreen
  }
  catch {
    Write-Host "UYARI: .prisma silinemedi (dosya kilitli olabilir). Hata: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Görev Yöneticisi'nden kalan node.exe süreçlerini kapatın veya bilgisayarı yeniden başlatın." -ForegroundColor Yellow
    exit 1
  }
}

Write-Host "prisma generate çalıştırılıyor..." -ForegroundColor Cyan
& npx prisma generate
exit $LASTEXITCODE
