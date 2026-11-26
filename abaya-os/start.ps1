# ABAYA OS - one-command start for Windows (PowerShell 5.1+).
#   Double-click start.cmd, or run:  powershell -ExecutionPolicy Bypass -File start.ps1 [-Demo] [-Stop]
param([switch]$Demo, [switch]$Stop)
$ErrorActionPreference = 'Continue'
Set-Location -Path $PSScriptRoot

function Fail([string]$msg) {
  Write-Host $msg -ForegroundColor Red
  Read-Host 'Press Enter to close'
  exit 1
}

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  Fail 'Docker is not installed. Install Docker Desktop first: https://docs.docker.com/desktop/setup/install/windows-install/'
}
docker info *> $null
if ($LASTEXITCODE -ne 0) { Fail 'Docker Desktop is not running. Open Docker Desktop, wait until it says "running", then try again.' }

if ($Stop) {
  docker compose stop
  Write-Host 'ABAYA OS stopped (your data is kept).' -ForegroundColor Green
  exit 0
}

function RandHex([int]$bytes) {
  $buf = New-Object byte[] $bytes
  [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($buf)
  return (($buf | ForEach-Object { $_.ToString('x2') }) -join '')
}

if (-not (Test-Path '.env')) {
  Write-Host 'Creating .env with generated secrets...' -ForegroundColor Yellow
  $values = @{
    'POSTGRES_PASSWORD'       = (RandHex 16)
    'JWT_ACCESS_SECRET'       = (RandHex 32)
    'ENCRYPTION_KEY'          = (RandHex 32)
    'S3_SECRET_ACCESS_KEY'    = (RandHex 16)
    'PLATFORM_ADMIN_EMAIL'    = 'admin@abaya-os.local'
    'PLATFORM_ADMIN_PASSWORD' = ('Abaya-' + (RandHex 6))
  }
  $lines = Get-Content '.env.example' | ForEach-Object {
    $line = $_.TrimEnd("`r")
    foreach ($k in $values.Keys) { if ($line -match "^$k=") { $line = "$k=$($values[$k])" } }
    $line
  }
  # LF line endings, no BOM, so Docker reads the values exactly.
  [System.IO.File]::WriteAllText((Join-Path $PSScriptRoot '.env'), (($lines -join "`n") + "`n"), (New-Object System.Text.UTF8Encoding($false)))
}

Write-Host 'Building and starting ABAYA OS (the first time takes several minutes)...' -ForegroundColor Yellow
docker compose up -d --build
if ($LASTEXITCODE -ne 0) { Fail 'Starting failed. Run "docker compose logs" to see why.' }

Write-Host 'Waiting for the server to be ready...' -ForegroundColor Yellow
$ready = $false
for ($i = 0; $i -lt 90; $i++) {
  docker compose exec -T api wget -qO- http://localhost:4000/api/health *> $null
  if ($LASTEXITCODE -eq 0) { $ready = $true; break }
  Start-Sleep -Seconds 2
}
if (-not $ready) { Fail 'The server did not start. Run "docker compose logs api" to see why.' }

$seedDemo = 'false'
if ($Demo) { $seedDemo = 'true' }
Write-Host 'Preparing plans and the admin account...' -ForegroundColor Yellow
docker compose exec -T -e SEED_DEMO=$seedDemo api npx ts-node --transpile-only prisma/seed.ts

$envText = Get-Content '.env'
$adminEmail = (($envText | Where-Object { $_ -like 'PLATFORM_ADMIN_EMAIL=*' }) -replace '^PLATFORM_ADMIN_EMAIL=', '')
$adminPass = (($envText | Where-Object { $_ -like 'PLATFORM_ADMIN_PASSWORD=*' }) -replace '^PLATFORM_ADMIN_PASSWORD=', '')

Write-Host ''
Write-Host 'ABAYA OS is ready.' -ForegroundColor Green
Write-Host '  Open:            http://localhost:3000'
Write-Host '  New store:       http://localhost:3000/register'
Write-Host "  Platform admin:  $adminEmail  /  $adminPass"
if ($Demo) { Write-Host '  Demo store:      demo@abaya-os.local  /  Demo-Store-2026' }
Write-Host '  To stop:         double-click stop.cmd'
Start-Process 'http://localhost:3000'
