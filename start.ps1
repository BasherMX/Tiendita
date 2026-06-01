#!/usr/bin/env pwsh
# Script para iniciar Tiendita con Podman.

Set-StrictMode -Off
$ErrorActionPreference = "Continue"

Write-Host "=== Tiendita ===" -ForegroundColor Cyan

# ── PATH ──────────────────────────────────────────────────────────────────────
$env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" +
            [System.Environment]::GetEnvironmentVariable("Path", "User") + ";" +
            "C:\Users\$env:USERNAME\AppData\Roaming\Python\Python314\Scripts"

# ── Helpers ───────────────────────────────────────────────────────────────────
function Write-Step  { param($m) Write-Host "> $m" -ForegroundColor Yellow }
function Write-OK    { param($m) Write-Host "  OK: $m" -ForegroundColor Green }
function Write-Fail  { param($m) Write-Host "  ERROR: $m" -ForegroundColor Red ; exit 1 }

function Invoke-Compose {
    param([string[]]$ComposeArgs)
    if (Get-Command podman-compose -ErrorAction SilentlyContinue) {
        & podman-compose @ComposeArgs
    } else {
        & python -m podman_compose @ComposeArgs
    }
}

# ── 1. Verificar Podman machine ───────────────────────────────────────────────
Write-Step "Verificando Podman machine..."

# Comprobar si existe alguna maquina
$machineList = podman machine list --format "{{.Name}}" 2>&1
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace("$machineList")) {
    Write-Step "No existe Podman machine. Inicializando..."
    podman machine init
    if ($LASTEXITCODE -ne 0) { Write-Fail "No se pudo inicializar Podman machine." }
}

# Detectar si la maquina esta corriendo (columna Running = true en formato tabla)
$machineStatus = podman machine list 2>&1 | Out-String
$isRunning = $machineStatus -match "Running"

if (-not $isRunning) {
    Write-Step "Iniciando Podman machine..."
    podman machine start
    if ($LASTEXITCODE -ne 0) { Write-Fail "No se pudo iniciar Podman machine." }

    # Esperar hasta que el socket responda (hasta 60s)
    Write-Step "Esperando que Podman socket este listo..."
    $waited = 0
    do {
        Start-Sleep -Seconds 3
        $waited += 3
        podman info *> $null
        Write-Host "  ... $waited s" -ForegroundColor DarkGray
    } while ($LASTEXITCODE -ne 0 -and $waited -lt 60)

    if ($LASTEXITCODE -ne 0) { Write-Fail "Podman machine inicio pero el socket no responde." }
} else {
    Write-OK "Podman machine ya esta corriendo."
}

# ── 2. Conexion rootful ───────────────────────────────────────────────────────
Write-Step "Activando conexion rootful..."
podman system connection default podman-machine-default-root 2>$null
podman info *> $null
if ($LASTEXITCODE -ne 0) { Write-Fail "Podman no responde tras seleccionar conexion." }
Write-OK "Podman listo."

# ── 3. Pre-pull SQL Server (solo si no existe) ────────────────────────────────
$sqlImage = "mcr.microsoft.com/mssql/server:2022-latest"
Write-Step "Verificando imagen SQL Server..."
podman image exists $sqlImage 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Step "Descargando SQL Server (~1.4 GB, puede tardar 5-20 min segun tu conexion — NO esta congelado)..."
    Write-Host "  Puedes ver los blobs copiandose uno a uno, eso es normal." -ForegroundColor DarkGray
    podman pull $sqlImage
    if ($LASTEXITCODE -ne 0) { Write-Fail "No se pudo descargar imagen SQL Server. Revisa internet/firewall." }
    Write-OK "SQL Server descargado."
} else {
    Write-OK "Imagen SQL Server ya existe."
}

# ── 4. Build de imagenes de la app ───────────────────────────────────────────
Write-Step "Construyendo imagenes de la aplicacion..."
Invoke-Compose -ComposeArgs @("build")
if ($LASTEXITCODE -ne 0) { Write-Fail "Fallo el build de imagenes." }
Write-OK "Imagenes construidas."

# ── 5. Levantar servicios ─────────────────────────────────────────────────────
Write-Step "Levantando servicios..."
Invoke-Compose -ComposeArgs @("up", "-d", "--no-build")
if ($LASTEXITCODE -ne 0) { Write-Fail "No se pudieron levantar los servicios." }

# ── 6. Espera activa (hasta 3 minutos) ───────────────────────────────────────
Write-Step "Esperando que los contenedores esten listos..."
$timeout = 180
$elapsed = 0
$ready   = $false

while ($elapsed -lt $timeout) {
    $running = podman ps --format "{{.Names}}" 2>$null | Where-Object { $_ -match "tiendita-" }
    $backendReady = $false
    $frontendReady = $false

    if ($running.Count -ge 3) {
        try {
            $backendResponse = Invoke-WebRequest -Uri "http://localhost:4000/health" -UseBasicParsing -TimeoutSec 3
            $backendReady = ($backendResponse.StatusCode -ge 200 -and $backendResponse.StatusCode -lt 300)
        } catch {
            $backendReady = $false
        }

        try {
            $frontendResponse = Invoke-WebRequest -Uri "http://localhost:1416" -UseBasicParsing -TimeoutSec 3
            $frontendReady = ($frontendResponse.StatusCode -ge 200 -and $frontendResponse.StatusCode -lt 400)
        } catch {
            $frontendReady = $false
        }

        if ($backendReady -and $frontendReady) {
            $ready = $true
            break
        }
    }

    Start-Sleep -Seconds 5
    $elapsed += 5
    Write-Host "  ... $elapsed s / $timeout s  (contenedores: $($running.Count)/3, backend: $backendReady, frontend: $frontendReady)" -ForegroundColor DarkGray
}

# ── Resultado ─────────────────────────────────────────────────────────────────
if ($ready) {
    Write-Host ""
    Write-Host "Tiendita esta corriendo." -ForegroundColor Green
    Write-Host ""
    Write-Host "  Frontend   -> http://localhost:1416" -ForegroundColor Cyan
    Write-Host "  Backend    -> http://localhost:4000" -ForegroundColor Cyan
    Write-Host "  SQL Server -> localhost:14330" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  Usuario: admin   Contrasena: admin123" -ForegroundColor White
    Write-Host ""
    Write-Host "Para detener: podman-compose down" -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "Timeout: no todos los contenedores iniciaron en $timeout s." -ForegroundColor Red
    Write-Host "Estado actual:" -ForegroundColor Yellow
    podman ps -a --format "table {{.Names}}`t{{.Status}}"
    Write-Host ""
    Write-Host "Revisa logs con:" -ForegroundColor Yellow
    Write-Host "  podman logs tiendita-db"
    Write-Host "  podman logs tiendita-backend"
    Write-Host "  podman logs tiendita-frontend"
    exit 1
}
