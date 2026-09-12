import Icon from "@mdi/react";
import { mdiClipboardList, mdiMagnify, mdiClose, mdiTagOutline } from "@mdi/js";

export default function PricesPage({
  prices = [],
  pricesQuery = "",
  setPricesQuery,
}) {
  const filteredPrices = pricesQuery.trim()
    ? prices.filter((p) =>
        p.name.toLowerCase().includes(pricesQuery.trim().toLowerCase()),
      )
    : prices;

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      {/* Encabezado y Barra de Búsqueda */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-[#E5E2DA] bg-[#FFFFFF] p-4 sm:p-5 shadow-xs dark:border-[#282C32] dark:bg-[#181B1E]">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-300">
            <Icon path={mdiClipboardList} size={0.85} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-extrabold text-[#1C1917] dark:text-[#F3F2EE] leading-tight">
                Lista de Precios
              </h1>
              <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/20 bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-900 dark:border-amber-400/20 dark:bg-amber-950/40 dark:text-amber-300">
                <Icon path={mdiTagOutline} size={0.45} />
                {filteredPrices.length}{" "}
                {filteredPrices.length === 1 ? "producto" : "productos"}
              </span>
            </div>
            <p className="text-xs text-[#78716C] dark:text-[#9CA3AF] mt-0.5">
              Precios de venta al público mostrador
            </p>
          </div>
        </div>

        {/* Buscador */}
        <div className="relative w-full sm:w-72">
          <Icon
            path={mdiMagnify}
            size={0.75}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#78716C] dark:text-[#9CA3AF] pointer-events-none"
          />
          <input
            type="text"
            className="w-full rounded-xl border border-[#E5E2DA] bg-[#F7F6F2] py-2 pl-9 pr-8 text-xs outline-none transition focus:bg-[#FFFFFF] dark:border-[#282C32] dark:bg-[#111315] dark:focus:bg-[#181B1E] text-[#1C1917] dark:text-[#F3F2EE]"
            placeholder="Buscar por nombre de producto..."
            value={pricesQuery}
            onChange={(e) => setPricesQuery(e.target.value)}
          />
          {pricesQuery && (
            <button
              type="button"
              onClick={() => setPricesQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-[#78716C] hover:bg-[#E5E2DA]/60 hover:text-[#1C1917] dark:text-[#9CA3AF] dark:hover:bg-[#282C32] dark:hover:text-[#F3F2EE] transition"
              title="Limpiar búsqueda"
            >
              <Icon path={mdiClose} size={0.6} />
            </button>
          )}
        </div>
      </div>

      {/* Tabla de Precios */}
      <div className="overflow-hidden rounded-2xl border border-[#E5E2DA] bg-[#FFFFFF] shadow-xs dark:border-[#282C32] dark:bg-[#181B1E]">
        <div className="max-h-[70vh] overflow-y-auto">
          <table className="min-w-full text-left text-xs sm:text-sm">
            <thead className="sticky top-0 z-10 border-b border-[#E5E2DA] bg-[#F7F6F2] text-[#57534E] dark:border-[#282C32] dark:bg-[#111315] dark:text-[#9CA3AF]">
              <tr>
                <th className="px-4 sm:px-6 py-3 font-bold">Producto</th>
                <th className="px-4 sm:px-6 py-3 text-right font-bold">
                  Precio Unitario
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E2DA] dark:divide-[#282C32] font-tabular">
              {filteredPrices.map((p, index) => (
                <tr
                  key={index}
                  className="hover:bg-[#F7F6F2]/70 dark:hover:bg-[#202428]/50 transition-colors"
                >
                  <td className="px-4 sm:px-6 py-3 font-medium text-[#1C1917] dark:text-[#F3F2EE]">
                    {p.name}
                  </td>
                  <td className="px-4 sm:px-6 py-3 text-right text-base sm:text-lg font-black text-amber-700 dark:text-amber-400">
                    ${Number(p.price || p.sale_price).toFixed(2)}
                  </td>
                </tr>
              ))}
              {filteredPrices.length === 0 && (
                <tr>
                  <td
                    colSpan={2}
                    className="px-4 py-12 text-center text-xs text-[#78716C] dark:text-[#9CA3AF]"
                  >
                    No se encontraron productos coincidentes con &quot;
                    {pricesQuery}&quot;
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
