import { useState } from "react";
import Icon from "@mdi/react";
import {
  mdiCandycane,
  mdiPlus,
  mdiPencil,
  mdiDelete,
  mdiMagnify,
  mdiClose,
} from "@mdi/js";

export default function InventoryPage({
  sweets = [],
  sweetStats = null,
  onNewSweet,
  onEditSweet,
  onDeleteSweet,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStock, setFilterStock] = useState("all"); // "all" | "low" | "out"

  const filteredSweets = sweets.filter((s) => {
    const matchesQuery = s.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const stock = Number(s.stock || 0);
    if (filterStock === "low") return matchesQuery && stock > 0 && stock <= 5;
    if (filterStock === "out") return matchesQuery && stock <= 0;
    return matchesQuery;
  });

  const totalStock = sweets.reduce((sum, s) => sum + (Number(s.stock) || 0), 0);
  const totalInvestment = sweets.reduce(
    (sum, s) => sum + (Number(s.purchase_price) || 0) * (Number(s.stock) || 0),
    0,
  );
  const totalPotentialSale = sweets.reduce(
    (sum, s) => sum + (Number(s.sale_price) || 0) * (Number(s.stock) || 0),
    0,
  );
  const totalPotentialProfit = totalPotentialSale - totalInvestment;

  return (
    <div className="space-y-5">
      {/* Cinta de Métricas de Almacén */}
      <div className="rounded-2xl border border-[#E5E2DA] bg-[#FFFFFF] p-4 sm:p-5 shadow-xs dark:border-[#282C32] dark:bg-[#181B1E]">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:divide-x sm:divide-[#E5E2DA] sm:dark:divide-[#282C32]">
          <div className="sm:pr-4">
            <span className="block text-[11px] font-bold text-[#78716C] dark:text-[#9CA3AF]">
              Total de Productos
            </span>
            <div className="mt-1 text-2xl font-black font-tabular text-[#1C1917] dark:text-[#F3F2EE]">
              {sweets.length}{" "}
              <span className="text-xs font-medium text-[#78716C] dark:text-[#9CA3AF]">
                artículos
              </span>
            </div>
          </div>

          <div className="sm:px-4">
            <span className="block text-[11px] font-bold text-[#78716C] dark:text-[#9CA3AF]">
              Piezas en Almacén
            </span>
            <div className="mt-1 text-2xl font-black font-tabular text-amber-700 dark:text-amber-400">
              {totalStock}{" "}
              <span className="text-xs font-medium text-amber-800/60 dark:text-amber-400/70">
                pzas
              </span>
            </div>
          </div>

          <div className="sm:px-4">
            <span className="block text-[11px] font-bold text-[#78716C] dark:text-[#9CA3AF]">
              Inversión en Mercancía
            </span>
            <div className="mt-1 text-2xl font-black font-tabular text-[#1C1917] dark:text-[#F3F2EE]">
              ${totalInvestment.toFixed(2)}
            </div>
          </div>

          <div className="sm:pl-4">
            <span className="block text-[11px] font-bold text-[#78716C] dark:text-[#9CA3AF]">
              Ganancia Proyectada
            </span>
            <div className="mt-1 text-2xl font-black font-tabular text-emerald-700 dark:text-emerald-400">
              ${totalPotentialProfit.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Catálogo de Productos y Almacén */}
      <div className="rounded-2xl border border-[#E5E2DA] bg-[#FFFFFF] p-4 sm:p-6 shadow-xs dark:border-[#282C32] dark:bg-[#181B1E]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E2DA] pb-3 dark:border-[#282C32]">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-500/20 bg-amber-500/10 text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-300">
              <Icon path={mdiCandycane} size={0.75} />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1C1917] dark:text-[#F3F2EE] leading-tight">
                Catálogo de Productos
              </h2>
              <p className="text-[11px] text-[#78716C] dark:text-[#9CA3AF]">
                Control de existencias y precios de venta
              </p>
            </div>
          </div>

          <button
            onClick={onNewSweet}
            className="flex items-center gap-1.5 rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-amber-700 active:scale-[0.98] transition"
          >
            <Icon path={mdiPlus} size={0.65} />
            <span>Nuevo Producto</span>
          </button>
        </div>

        {/* Buscador y Filtros Rápidos */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Icon
              path={mdiMagnify}
              size={0.7}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#78716C] dark:text-[#9CA3AF] pointer-events-none"
            />
            <input
              type="text"
              className="w-full rounded-xl border border-[#E5E2DA] bg-[#F7F6F2] py-2 pl-9 pr-8 text-xs outline-none transition focus:bg-[#FFFFFF] dark:border-[#282C32] dark:bg-[#111315] text-[#1C1917] dark:text-[#F3F2EE]"
              placeholder="Buscar producto por nombre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-[#78716C] hover:bg-[#E5E2DA]/60 hover:text-[#1C1917] dark:text-[#9CA3AF] dark:hover:bg-[#282C32] dark:hover:text-[#F3F2EE] transition"
                title="Limpiar búsqueda"
              >
                <Icon path={mdiClose} size={0.6} />
              </button>
            )}
          </div>

          <div className="flex rounded-xl border border-[#E5E2DA] bg-[#FFFFFF] p-1 text-[11px] font-semibold dark:border-[#282C32] dark:bg-[#181B1E]">
            <button
              onClick={() => setFilterStock("all")}
              className={`rounded-lg px-2.5 py-1 transition ${
                filterStock === "all"
                  ? "bg-amber-500/15 text-amber-950 dark:bg-amber-400/20 dark:text-amber-200 font-bold"
                  : "text-[#78716C] hover:text-[#1C1917] dark:text-[#9CA3AF]"
              }`}
            >
              Todos ({sweets.length})
            </button>
            <button
              onClick={() => setFilterStock("low")}
              className={`rounded-lg px-2.5 py-1 transition ${
                filterStock === "low"
                  ? "bg-amber-500/20 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-bold"
                  : "text-[#78716C] hover:text-[#1C1917] dark:text-[#9CA3AF]"
              }`}
            >
              Stock Bajo (≤5)
            </button>
            <button
              onClick={() => setFilterStock("out")}
              className={`rounded-lg px-2.5 py-1 transition ${
                filterStock === "out"
                  ? "bg-red-500/15 text-red-700 dark:bg-red-950/60 dark:text-red-300 font-bold"
                  : "text-[#78716C] hover:text-[#1C1917] dark:text-[#9CA3AF]"
              }`}
            >
              Agotados
            </button>
          </div>
        </div>

        {/* Tabla de Catálogo */}
        <div className="max-h-[60vh] overflow-y-auto rounded-xl border border-[#E5E2DA] dark:border-[#282C32]">
          <table className="min-w-full text-left text-xs">
            <thead className="sticky top-0 bg-[#F7F6F2] text-[#57534E] border-b border-[#E5E2DA] dark:bg-[#111315] dark:text-[#9CA3AF] dark:border-[#282C32] z-10">
              <tr>
                <th className="px-3.5 py-2.5 font-semibold">Producto</th>
                <th className="px-3.5 py-2.5 text-right font-semibold">
                  P. Compra
                </th>
                <th className="px-3.5 py-2.5 text-right font-semibold">
                  P. Venta
                </th>
                <th className="px-3.5 py-2.5 text-right font-semibold">
                  Ganancia
                </th>
                <th className="px-3.5 py-2.5 text-center font-semibold">
                  Existencias
                </th>
                <th className="px-3.5 py-2.5 text-center font-semibold">
                  Vendidos
                </th>
                <th className="px-3 py-2.5 text-center font-semibold"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E2DA] dark:divide-[#282C32] font-tabular">
              {filteredSweets.map((s) => {
                const pComp = Number(s.purchase_price || 0);
                const pVent = Number(s.sale_price || 0);
                const margin = pVent - pComp;
                const marginPct =
                  pVent > 0 ? ((margin / pVent) * 100).toFixed(0) : 0;
                const stock = Number(s.stock || 0);

                return (
                  <tr
                    key={s.id}
                    className="hover:bg-[#F7F6F2]/60 dark:hover:bg-[#202428]/50 transition-colors"
                  >
                    <td className="px-3.5 py-2.5 font-bold text-[#1C1917] dark:text-[#F3F2EE]">
                      {s.name}
                    </td>
                    <td className="px-3.5 py-2.5 text-right text-[#78716C] dark:text-[#9CA3AF]">
                      ${pComp.toFixed(2)}
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-bold text-amber-700 dark:text-amber-400">
                      ${pVent.toFixed(2)}
                    </td>
                    <td className="px-3.5 py-2.5 text-right">
                      <span className="font-bold text-emerald-700 dark:text-emerald-400">
                        +${margin.toFixed(2)}
                      </span>{" "}
                      <span className="text-[10px] text-[#78716C] dark:text-[#9CA3AF]">
                        ({marginPct}%)
                      </span>
                    </td>
                    <td className="px-3.5 py-2.5 text-center">
                      <span
                        className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-bold ${
                          stock < 0
                            ? "bg-red-100/90 text-red-700 border border-red-300 dark:border-red-800/60 dark:bg-red-950/70 dark:text-red-300 font-extrabold"
                            : stock === 0
                              ? "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300"
                              : stock <= 5
                                ? "bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300"
                                : "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
                        }`}
                      >
                        {stock === 0 ? "Agotado" : `${stock} pzas`}
                      </span>
                    </td>
                    <td className="px-3.5 py-2.5 text-center text-[#78716C] dark:text-[#9CA3AF]">
                      {s.sold_count || 0}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <div className="flex justify-center gap-1">
                        <button
                          onClick={() => onEditSweet(s)}
                          className="rounded-lg p-1 text-[#78716C] hover:bg-amber-100 hover:text-amber-900 dark:text-[#9CA3AF] dark:hover:bg-[#282C32] dark:hover:text-amber-300 transition"
                          title="Editar producto"
                        >
                          <Icon path={mdiPencil} size={0.65} />
                        </button>
                        <button
                          onClick={() => onDeleteSweet(s)}
                          className="rounded-lg p-1 text-[#78716C] hover:bg-red-50 hover:text-red-600 dark:text-[#9CA3AF] dark:hover:bg-red-950/40 dark:hover:text-red-400 transition"
                          title="Dar de baja producto"
                        >
                          <Icon path={mdiDelete} size={0.65} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredSweets.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-xs text-[#78716C] dark:text-[#9CA3AF]"
                  >
                    No se encontraron productos en el catálogo
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
