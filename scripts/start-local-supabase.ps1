# =====================================================================
# Arranque del entorno de desarrollo local de Autopilot.
# Inicia Docker Desktop (si no corre), espera el daemon, y levanta el
# stack local de Supabase. Pensado para correr al iniciar Windows.
#
# Uso manual:  powershell -ExecutionPolicy Bypass -File scripts\start-local-supabase.ps1
# =====================================================================

$ErrorActionPreference = 'Continue'

# Repo root = carpeta padre de este script
$repoRoot = Split-Path -Parent $PSScriptRoot

# Asegurar docker en el PATH de esta sesion
$dockerBin = Join-Path $env:ProgramFiles 'Docker\Docker\resources\bin'
if (Test-Path $dockerBin) { $env:Path = "$env:Path;$dockerBin" }

function Write-Log($msg) { Write-Host "[$(Get-Date -Format 'HH:mm:ss')] $msg" }

# 1) Arrancar Docker Desktop si no esta corriendo
$dockerDesktop = Join-Path $env:ProgramFiles 'Docker\Docker\Docker Desktop.exe'
if (-not (Get-Process 'Docker Desktop' -ErrorAction SilentlyContinue)) {
    if (Test-Path $dockerDesktop) {
        Write-Log 'Iniciando Docker Desktop...'
        Start-Process $dockerDesktop
    } else {
        Write-Log 'ERROR: Docker Desktop no encontrado.'
        exit 1
    }
} else {
    Write-Log 'Docker Desktop ya esta corriendo.'
}

# 2) Esperar a que el daemon responda (hasta ~5 min)
Write-Log 'Esperando al daemon de Docker...'
$ready = $false
for ($i = 0; $i -lt 60; $i++) {
    docker ps *> $null
    if ($LASTEXITCODE -eq 0) { $ready = $true; break }
    Start-Sleep -Seconds 5
}
if (-not $ready) {
    Write-Log 'ERROR: el daemon de Docker no respondio a tiempo.'
    exit 1
}
Write-Log 'Docker listo.'

# 3) Levantar Supabase local (idempotente: si ya esta arriba, solo reporta)
Write-Log 'Levantando Supabase local...'
Set-Location $repoRoot
npx supabase start
Write-Log 'Listo. Ahora puedes correr: npm run dev'
