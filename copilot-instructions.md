# Reglas del proyecto Tiendita

- Después de cada cambio funcional, visual o de configuración, incrementar la versión del sistema.
- Mantener sincronizadas la versión visible en `frontend/src/App.jsx` y la versión de `frontend/package.json` y `frontend/package-lock.json`.
- Documentar brevemente los cambios de la nueva versión en la pestaña de releases (`frontend/src/data/releases.js`) al incrementar la versión.
- Usar incremento semántico de parche para correcciones (`1.3.1` -> `1.3.2`), salvo que el cambio requiera incrementar versión menor o mayor.
- Ejecutar `npm run build` dentro de `frontend` después de los cambios.
