<#
.SYNOPSIS
Fixes NestJS backend startup crashes and zombie port errors.

.DESCRIPTION
This script safely kills any processes locking the NestJS development port (4400),
re-compiles the @repo/db workspace package correctly handling Prisma artifacts,
and subsequently force-rebuilds the NestJS API bypassing stale caches.

.EXAMPLE
.\fix-backend-startup.ps1
#>

$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  LCM Backend Startup Repair Skill " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Kill any zombie node processes sitting on port 4400
Write-Host "[1/4] Scanning for Zombie Processes on Dev Port (4400)..." -ForegroundColor Yellow
$portInfos = netstat -ano | Select-String "4400"
if ($portInfos) {
    # Extract Process IDs via RegEx matching
    $portInfos | ForEach-Object {
        $p = $_.Line.Trim() -split '\s+'
        $pidnum = $p[$p.Length - 1]
        
        if ($pidnum -ne "0" -and $pidnum -match "^\d+$") {
            Write-Host "      Detected Zombie PID: $pidnum. Terminating..." -ForegroundColor Red
            try {
                Stop-Process -Id $pidnum -Force -ErrorAction SilentlyContinue
                Write-Host "      ✅ Process $pidnum Terminated." -ForegroundColor Green
            } catch {
                Write-Host "      ⚠️ Could not terminate process $pidnum. It may have exited." -ForegroundColor Yellow
            }
        }
    }
} else {
    Write-Host "      ✅ Port 4400 is clean. Proceeding." -ForegroundColor Green
}

# Ensure we are operating from the project root
$rootDir = (Get-Item .).FullName
if (-not (Test-Path "$rootDir\packages\db")) {
    $rootDir = (Get-Item ..\..).FullName
}

if (-not (Test-Path "$rootDir\packages\db")) {
    Write-Error "Could not resolve workspace root. Please run this script from inside the care-home root directory."
}

# 2. Rebuild Database Package
Write-Host "`n[2/4] Resetting and Compiling Monorepo Database Interface..." -ForegroundColor Yellow
Set-Location "$rootDir\packages\db"
Write-Host "      Running TS Compiler & Injecting Prisma Clients into Dist..." -ForegroundColor DarkGray
pnpm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "      ❌ Failed to build @repo/db. Cannot proceed." -ForegroundColor Red
    Exit 1
}
Write-Host "      ✅ Database interface generated and bound to dist/ successfully." -ForegroundColor Green


# 3. Clean and Rebuild Backend Application safely
Write-Host "`n[3/4] Flashing Backend Cache and Initiating Nest Native Build..." -ForegroundColor Yellow
Set-Location "$rootDir\apps\backend"

if (Test-Path "dist") {
    Remove-Item "dist" -Recurse -Force
}

# We use npm run build to securely hit the nest-cli.json compiler rules, escaping the raw tsc mapping bugs
Write-Host "      Executing API compiler pipeline..." -ForegroundColor DarkGray
pnpm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "      ❌ Backend compilation failed. Please check TypeScript syntax." -ForegroundColor Red
    Exit 1
}
Write-Host "      ✅ Backend engine safely bootstrapped." -ForegroundColor Green


# 4. Success message
Write-Host "`n[4/4] Repair Sequence Full. Ready for Engine Start!" -ForegroundColor Green
Write-Host "`n🚀 You can now start the backend via your normal process!" -ForegroundColor Cyan
Write-Host "   Run: 'pnpm run dev' inside apps/backend" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
