# Reglas del proyecto Tiendita

- Después de cada cambio funcional, visual o de configuración, incrementar la versión del sistema.
- Mantener sincronizadas la versión visible en `frontend/src/App.jsx` y la versión de `frontend/package.json` y `frontend/package-lock.json`.
- Usar incremento semántico de parche para correcciones (`1.3.1` -> `1.3.2`), salvo que el cambio requiera incrementar versión menor o mayor.
- Ejecutar `npm run build` dentro de `frontend` después de los cambios.
