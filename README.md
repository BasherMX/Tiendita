# Tiendita

Aplicacion de gestion de dulces con frontend React + Vite, backend Node + Express y SQL Server en contenedores Podman.

## Stack

- Frontend: React, Vite, Tailwind
- Backend: Node.js, Express, JWT, mssql
- Base de datos: SQL Server 2022
- Orquestacion local: Podman + podman-compose

## Requisitos

- Podman Desktop instalado
- Python 3 con podman-compose (`pip install podman-compose`)
- PowerShell (Windows)

## Configuracion

1. Copia `.env.example` a `.env` en la raiz del proyecto.
2. Ajusta tus secretos en `.env`.
3. (Opcional) Si usas backend local sin contenedor, copia `backend/.env.example` a `backend/.env`.

## Levantar en contenedores

```powershell
powershell -ExecutionPolicy Bypass -File .\start.ps1
```

Servicios esperados:

- Frontend: http://localhost:1416
- Backend: http://localhost:4000
- SQL Server: localhost:14330

## Restaurar un backup

Para restaurar un respaldo especifico:

```powershell
powershell -ExecutionPolicy Bypass -File .\restaurar-ultimo-respaldo.ps1 -BackupFile "D:\TIENDITA\backups\tiendita_YYYYMMDD_HHMMSS.bak"
```

## Scripts utiles

- `start.ps1`: inicia stack en contenedores
- `start-local.ps1`: modo local (sin contenedores)
- `restaurar-ultimo-respaldo.ps1`: restaura base desde `.bak`
- `backup-diario.ps1`: genera respaldo de base

## Seguridad

- No subir `.env` ni archivos con secretos.
- No subir respaldos `.bak`.
- Este repositorio incluye `.gitignore` para excluirlos.

## Estructura

```text
backend/
frontend/
podman-compose.yaml
start.ps1
restaurar-ultimo-respaldo.ps1
README.md
```
