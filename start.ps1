#!/usr/bin/env pwsh
# Script para iniciar Tiendita con Podman.

Set-StrictMode -Off
$ErrorActionPreference = "Continue"

Write-Host "=== Tiendita ===" -ForegroundColor Cyan

# === Helpers ==================================================================
function Write-Step  { param($m) Write-Host "> $m" -ForegroundColor Yellow }
function Write-OK    { param($m) Write-Host "  OK: $m" -ForegroundColor Green }
function Write-Fail  { param($m) Write-Host "  ERROR: $m" -ForegroundColor Red ; exit 1 }

# Obtener configuracion SSH de la maquina de Podman para evitar cuelgues del cliente remoto en Windows
Write-Step "Detectando configuracion de Podman machine..."
$inspectJson = podman machine inspect podman-machine-default 2>$null | Out-String
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($inspectJson)) {
    $sshPort = 59303
    $identityPath = "$env:USERPROFILE\.local\share\containers\podman\machine\machine"
} else {
    try {
        $inspect = $inspectJson | ConvertFrom-Json
        $sshPort = $inspect[0].SSHConfig.Port
        $identityPath = $inspect[0].SSHConfig.IdentityPath
    } catch {
        $sshPort = 59303
        $identityPath = "$env:USERPROFILE\.local\share\containers\podman\machine\machine"
    }
}

# Convertir ruta de Windows a ruta de WSL
function Get-WSLPath {
    param([string]$WinPath)
    if ($WinPath -match '^([A-Za-z]):\\(.*)') {
        $drive = $Matches[1].ToLower()
        $rest = $Matches[2].Replace('\', '/')
        return "/mnt/$drive/$rest"
    }
    return $WinPath
}

# Ejecutar comando dentro de la VM usando SSH (evita cuelgues)
function Invoke-SSH {
    param(
        [string]$Command,
        [int]$ConnectTimeout = 3
    )
    & ssh -i $identityPath -p $sshPort -o StrictHostKeyChecking=no -o ConnectTimeout=$ConnectTimeout -o LogLevel=ERROR root@127.0.0.1 $Command
}

function Invoke-Compose {
    param([string[]]$ComposeArgs)
    $argsStr = $ComposeArgs -join " "
    $wslCwd = Get-WSLPath $PWD.Path
    Invoke-SSH "cd '$wslCwd' && podman-compose $argsStr"
}

# === 1. Verificar Podman machine ==============================================
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
        Invoke-SSH "podman info" -ConnectTimeout 2 *> $null
        Write-Host "  ... $waited s" -ForegroundColor DarkGray
    } while ($LASTEXITCODE -ne 0 -and $waited -lt 60)

    if ($LASTEXITCODE -ne 0) { Write-Fail "Podman machine inicio pero el socket no responde." }
} else {
    Write-OK "Podman machine ya esta corriendo."
}

# === 2. Conexion SSH ==========================================================
Write-Step "Verificando conexion SSH con la maquina..."
Invoke-SSH "podman info" -ConnectTimeout 5 *> $null
if ($LASTEXITCODE -ne 0) { Write-Fail "No se pudo establecer conexion SSH con la maquina de Podman." }
Write-OK "Conexion SSH establecida."

# === 3. Pre-pull SQL Server (solo si no existe) ===============================
$sqlImage = "mcr.microsoft.com/mssql/server:2022-latest"
Write-Step "Verificando imagen SQL Server..."
Invoke-SSH "podman image exists $sqlImage"
if ($LASTEXITCODE -ne 0) {
    Write-Step "Descargando SQL Server (~1.4 GB, puede tardar 5-20 min - NO esta congelado)..."
    Write-Host "  Puedes ver los blobs copiandose uno a uno, eso es normal." -ForegroundColor DarkGray
    Invoke-SSH "podman pull $sqlImage"
    if ($LASTEXITCODE -ne 0) { Write-Fail "No se pudo descargar imagen SQL Server. Revisa internet/firewall." }
    Write-OK "SQL Server descargado."
} else {
    Write-OK "Imagen SQL Server ya existe."
}

# === 4. Build de imagenes de la app ===========================================
Write-Step "Construyendo imagenes de la aplicacion..."
Invoke-Compose -ComposeArgs @("build")
if ($LASTEXITCODE -ne 0) { Write-Fail "Fallo el build de imagenes." }
Write-OK "Imagenes construidas."

# === 5. Levantar servicios ====================================================
Write-Step "Levantando servicios..."
Invoke-Compose -ComposeArgs @("up", "-d", "--no-build")
if ($LASTEXITCODE -ne 0) { Write-Fail "No se pudieron levantar los servicios." }

# === 6. Espera activa (hasta 3 minutos) =======================================
Write-Step "Esperando que los contenedores esten listos..."
$timeout = 180
$elapsed = 0
$ready   = $false

while ($elapsed -lt $timeout) {
    $runningRaw = Invoke-SSH "podman ps --format '{{.Names}}'" 2>$null
    if ($runningRaw) {
        $runningRawClean = $runningRaw -replace "`r", ""
        $running = $runningRawClean -split "`n" | Where-Object { [string]::IsNullOrWhiteSpace($_) -eq $false } | Where-Object { $_ -match "tiendita-" }
    } else {
        $running = @()
    }
    
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

# === Resultado ================================================================
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
    Write-Host "Para detener: podman-compose down (o via SSH)" -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "Timeout: no todos los contenedores iniciaron en $timeout s." -ForegroundColor Red
    Write-Host "Estado actual:" -ForegroundColor Yellow
    Invoke-SSH "podman ps -a --format 'table {{.Names}}\t{{.Status}}'"
    Write-Host ""
    Write-Host "Revisa logs con:" -ForegroundColor Yellow
    Write-Host "  podman logs tiendita-db"
    Write-Host "  podman logs tiendita-backend"
    Write-Host "  podman logs tiendita-frontend"
    exit 1
}
