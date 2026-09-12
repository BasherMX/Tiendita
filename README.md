# Tiendita

Aplicacion de gestion de dulces y punto de venta con frontend React + Vite, backend Node + Express y PostgreSQL en contenedores Podman o Serverless en Vercel.

## Stack

- Frontend: React 18, Vite, Tailwind CSS, Framer Motion, Recharts
- Backend: Node.js, Express, JWT, pg (PostgreSQL)
- Base de datos: PostgreSQL 16 / Vercel Postgres
- Orquestacion local: Podman + podman-compose

## Requisitos

- Podman Desktop instalado (o Node.js 20+ para ejecución directa)
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
- Postgres: localhost:5432

## Scripts utiles

- `start.ps1`: inicia stack en contenedores
- `start-local.ps1`: modo local (sin contenedores)

## Seguridad

- No subir `.env` ni archivos con secretos.
- Este repositorio incluye `.gitignore` para excluirlos.

## Estructura

```text
backend/
frontend/
podman-compose.yaml
start.ps1
README.md
```
