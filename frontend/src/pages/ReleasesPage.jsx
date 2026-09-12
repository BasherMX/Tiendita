import { useNavigate } from "react-router-dom";
import Icon from "@mdi/react";
import {
  mdiArrowLeft,
  mdiHistory,
  mdiTagOutline,
  mdiCheckCircleOutline,
  mdiCalendarOutline,
  mdiStar,
} from "@mdi/js";
import { releases } from "../data/releases.js";

export default function ReleasesPage() {
  const navigate = useNavigate();

  function handleBack() {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate("/clientes");
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      {/* Header con botón de regresar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-amber-100/70 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="flex items-center justify-center rounded-2xl border border-amber-200 bg-amber-50/70 p-2.5 text-amber-900 transition hover:bg-amber-100 dark:border-slate-700 dark:bg-slate-800 dark:text-amber-200 dark:hover:bg-slate-700"
            title="Regresar a la página anterior"
          >
            <Icon path={mdiArrowLeft} size={0.9} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                Historial de Versiones
              </h1>
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-mono font-bold text-amber-800 dark:bg-slate-800 dark:text-amber-300">
                Releases
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Registro cronológico de actualizaciones, nuevas funcionalidades y
              mejoras del sistema.
            </p>
          </div>
        </div>

        <button
          onClick={handleBack}
          className="flex items-center gap-1.5 rounded-2xl bg-amber-500 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-amber-600 transition"
        >
          <Icon path={mdiArrowLeft} size={0.7} />
          Regresar
        </button>
      </div>

      {/* Lista de Versiones */}
      <div className="space-y-6">
        {releases.map((rel, idx) => (
          <div
            key={rel.version}
            className="rounded-3xl border border-amber-100/70 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 space-y-5 relative overflow-hidden"
          >
            {/* Insignia de última versión */}
            {idx === 0 && (
              <div className="absolute top-0 right-0 rounded-bl-2xl bg-amber-500 px-4 py-1 text-[11px] font-bold text-white uppercase tracking-wider flex items-center gap-1 shadow-sm">
                <Icon path={mdiStar} size={0.5} />
                Versión Actual
              </div>
            )}

            {/* Cabecera de la versión */}
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="flex items-center gap-1 rounded-2xl bg-amber-100 px-3 py-1 font-mono text-sm font-black text-amber-900 dark:bg-slate-800 dark:text-amber-300 border border-amber-200 dark:border-slate-700">
                    <Icon path={mdiTagOutline} size={0.7} />v{rel.version}
                  </span>
                  <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                    {rel.tagline}
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                <Icon path={mdiCalendarOutline} size={0.7} />
                <span>{rel.date}</span>
              </div>
            </div>

            {/* Resumen Destacado */}
            {rel.highlights && rel.highlights.length > 0 && (
              <div className="rounded-2xl bg-amber-50/50 p-4 dark:bg-slate-800/40 border border-amber-100/60 dark:border-slate-700/60">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300 mb-2.5">
                  Puntos Clave del Lanzamiento:
                </h3>
                <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                  {rel.highlights.map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Icon
                        path={mdiCheckCircleOutline}
                        size={0.65}
                        className="text-amber-500 shrink-0 mt-0.5"
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Secciones detalladas */}
            {rel.sections && rel.sections.length > 0 && (
              <div className="grid gap-4 md:grid-cols-3 pt-2">
                {rel.sections.map((section, sIdx) => (
                  <div
                    key={sIdx}
                    className="rounded-2xl border border-slate-100 bg-white/60 p-4 dark:border-slate-800 dark:bg-slate-900/40 space-y-2"
                  >
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {section.title}
                    </h4>
                    <ul className="space-y-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                      {section.items.map((item, itIdx) => (
                        <li key={itIdx} className="flex items-start gap-1.5">
                          <span className="text-amber-500 font-bold">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
