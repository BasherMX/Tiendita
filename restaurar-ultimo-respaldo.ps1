#!/usr/bin/env pwsh
param(
    [string]$BackupDir = "D:\TIENDITA\backups",
    [string]$BackupFile = "",
    [string]$DbContainer = "tiendita-db",
    [string]$BackendContainer = "tiendita-backend",
    [string]$Database = "tiendita",
    [string]$SaPassword = "StrongPassw0rd!123"
)

$ErrorActionPreference = "Stop"

if (-not (Get-Command podman -ErrorAction SilentlyContinue)) {
    throw "Podman no esta disponible en PATH."
}

if (-not (Test-Path $BackupDir)) {
    throw "No existe la carpeta de respaldos: $BackupDir"
}

if ([string]::IsNullOrWhiteSpace($BackupFile)) {
    $latest = Get-ChildItem -Path $BackupDir -Filter "${Database}_*.bak" -File |
        Sort-Object LastWriteTime -Descending |
        Select-Object -First 1

    if (-not $latest) {
        throw "No se encontro ningun respaldo para $Database en $BackupDir"
    }

    $BackupFile = $latest.FullName
}

if (-not (Test-Path $BackupFile)) {
    throw "No existe el archivo de respaldo: $BackupFile"
}

$fileName = Split-Path -Path $BackupFile -Leaf
$containerBackupDir = "/var/opt/mssql/backup"
$containerBackupPath = "$containerBackupDir/$fileName"

Write-Host "Copiando respaldo al contenedor DB..." -ForegroundColor Cyan
& podman exec $DbContainer sh -lc "mkdir -p $containerBackupDir"
& podman cp $BackupFile "${DbContainer}:$containerBackupPath"
if ($LASTEXITCODE -ne 0) {
    throw "No se pudo copiar el respaldo al contenedor."
}

Write-Host "Restaurando base de datos $Database..." -ForegroundColor Cyan
$restoreQuery = @"
ALTER DATABASE [$Database] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
RESTORE DATABASE [$Database]
FROM DISK = N'$containerBackupPath'
WITH REPLACE,
MOVE 'tiendita' TO '/var/opt/mssql/data/tiendita.mdf',
MOVE 'tiendita_log' TO '/var/opt/mssql/data/tiendita_log.ldf';
ALTER DATABASE [$Database] SET MULTI_USER;
"@

& podman exec $DbContainer /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P $SaPassword -Q $restoreQuery -C
if ($LASTEXITCODE -ne 0) {
    throw "Fallo la restauracion de la base de datos."
}

& podman exec $DbContainer sh -lc "rm -f $containerBackupPath" | Out-Null

Write-Host "Reiniciando backend..." -ForegroundColor Cyan
& podman restart $BackendContainer | Out-Null

Write-Host "Restauracion completada desde: $BackupFile" -ForegroundColor Green
