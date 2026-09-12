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
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#E5E2DA] bg-white p-5 shadow-sm dark:border-[#282C32] dark:bg-[#181B1E]">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="flex items-center justify-center rounded-xl border border-[#E5E2DA] bg-[#FAF7F0] p-2 text-[#57534E] transition hover:border-[#D97706]/50 hover:text-[#1C1917] dark:border-[#282C32] dark:bg-[#202428] dark:text-[#9CA3AF] dark:hover:text-[#F3F4F6]"
            title="Regresar a la página anterior"
          >
            <Icon path={mdiArrowLeft} size={0.8} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-[#1C1917] dark:text-[#F3F4F6]">
                Historial de Versiones
              </h1>
              <span className="rounded-md bg-[#FAF7F0] px-2 py-0.5 text-[10px] font-mono font-bold text-[#78716C] dark:bg-[#202428] dark:text-[#9CA3AF] border border-[#E5E2DA] dark:border-[#282C32]">
                Releases
              </span>
            </div>
            <p className="text-xs text-[#78716C] dark:text-[#9CA3AF] mt-0.5">
              Registro cronológico de actualizaciones, nuevas funcionalidades y
              mejoras en el sistema.
            </p>
          </div>
        </div>

        <button
          onClick={handleBack}
          className="flex items-center gap-1.5 rounded-xl bg-[#D97706] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#B45309] transition"
        >
          <Icon path={mdiArrowLeft} size={0.65} />
          Regresar
        </button>
      </div>

      {/* Lista de Versiones */}
      <div className="space-y-6">
        {releases.map((rel, idx) => (
          <div
            key={rel.version}
            className="rounded-2xl border border-[#E5E2DA] bg-white p-6 shadow-sm dark:border-[#282C32] dark:bg-[#181B1E] space-y-4 relative overflow-hidden"
          >
            {/* Insignia de versión actual */}
            {idx === 0 && (
              <div className="absolute top-0 right-0 rounded-bl-xl bg-[#D97706] px-3.5 py-1 text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-1 shadow-sm">
                <Icon path={mdiStar} size={0.45} />
                Versión Actual
              </div>
            )}

            {/* Cabecera de la versión */}
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#E5E2DA] pb-4 dark:border-[#282C32]">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="flex items-center gap-1 rounded-lg bg-[#FEF3C7] px-2.5 py-1 font-mono text-xs font-bold text-[#92400E] dark:bg-[#78350F]/30 dark:text-[#FDE68A] border border-[#FDE68A] dark:border-[#78350F]/50">
                    <Icon path={mdiTagOutline} size={0.65} />v{rel.version}
                  </span>
                  <h2 className="text-base font-bold text-[#1C1917] dark:text-[#F3F4F6]">
                    {rel.tagline}
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-[#78716C] dark:text-[#9CA3AF] font-medium font-tabular">
                <Icon path={mdiCalendarOutline} size={0.65} />
                <span>{rel.date}</span>
              </div>
            </div>

            {/* Resumen Destacado */}
            {rel.highlights && rel.highlights.length > 0 && (
              <div className="rounded-xl bg-[#FAF7F0] p-4 dark:bg-[#121417] border border-[#E5E2DA] dark:border-[#282C32]">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#92400E] dark:text-[#F59E0B] mb-2.5">
                  PUNTOS CLAVE DEL LANZAMIENTO:
                </h3>
                <ul className="space-y-1.5 text-xs text-[#44403C] dark:text-[#D1D5DB]">
                  {rel.highlights.map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Icon
                        path={mdiCheckCircleOutline}
                        size={0.65}
                        className="text-[#059669] shrink-0 mt-0.5"
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Secciones detalladas */}
            {rel.sections && rel.sections.length > 0 && (
              <div className="grid gap-3 md:grid-cols-3 pt-1">
                {rel.sections.map((section, sIdx) => (
                  <div
                    key={sIdx}
                    className="rounded-xl border border-[#E5E2DA] bg-[#FAF7F0]/40 p-3.5 dark:border-[#282C32] dark:bg-[#121417]/40 space-y-2"
                  >
                    <h4 className="text-xs font-bold text-[#1C1917] dark:text-[#F3F4F6]">
                      {section.title}
                    </h4>
                    <ul className="space-y-1 text-[11px] text-[#57534E] dark:text-[#9CA3AF]">
                      {section.items.map((item, itIdx) => (
                        <li key={itIdx} className="flex items-start gap-1.5">
                          <span className="text-[#D97706] font-bold">•</span>
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
