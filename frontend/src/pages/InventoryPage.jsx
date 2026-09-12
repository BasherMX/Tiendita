import { useState } from "react";
import Icon from "@mdi/react";
import {
  mdiCandycane,
  mdiPlusCircle,
  mdiPencil,
  mdiDelete,
  mdiAlertCircle,
  mdiCurrencyUsd,
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
    if (filterStock === "out") return matchesQuery && stock === 0;
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
    <div className="space-y-6">
      {/* Resumen de Métricas de Inventario */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <div className="rounded-3xl border border-amber-100/70 bg-white/90 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
          <span className="text-[10px] font-semibold uppercase text-slate-500">
            Total de Productos
          </span>
          <div className="mt-1 text-2xl font-black text-slate-800 dark:text-slate-100">
            {sweets.length}{" "}
            <span className="text-xs font-normal text-slate-500">
              artículos
            </span>
          </div>
        </div>

        <div className="rounded-3xl border border-amber-100/70 bg-white/90 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
          <span className="text-[10px] font-semibold uppercase text-slate-500">
            Piezas en Stock
          </span>
          <div className="mt-1 text-2xl font-black text-amber-600 dark:text-amber-400">
            {totalStock}{" "}
            <span className="text-xs font-normal text-slate-500">piezas</span>
          </div>
        </div>

        <div className="rounded-3xl border border-amber-100/70 bg-white/90 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
          <span className="text-[10px] font-semibold uppercase text-slate-500">
            Inversión en Stock
          </span>
          <div className="mt-1 text-2xl font-black text-slate-700 dark:text-slate-300">
            ${totalInvestment.toFixed(2)}
          </div>
        </div>

        <div className="rounded-3xl border border-amber-100/70 bg-white/90 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
          <span className="text-[10px] font-semibold uppercase text-slate-500">
            Ganancia Estimada
          </span>
          <div className="mt-1 text-2xl font-black text-emerald-600 dark:text-emerald-400">
            ${totalPotentialProfit.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Tabla y Control de Inventario */}
      <div className="rounded-3xl border border-amber-100/70 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-slate-100">
            <Icon path={mdiCandycane} size={1} className="text-amber-500" />
            Catálogo de Dulces y Productos
          </div>

          <button
            onClick={onNewSweet}
            className="flex items-center gap-2 rounded-2xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-600 transition"
          >
            <Icon path={mdiPlusCircle} size={0.8} />
            Nuevo Dulce
          </button>
        </div>

        {/* Buscador y Filtros */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <input
            type="search"
            className="w-full sm:w-72 rounded-2xl border border-amber-100/70 bg-transparent px-4 py-2 text-sm outline-none dark:border-slate-700 dark:text-slate-100"
            placeholder="Buscar por nombre..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <div className="flex rounded-2xl bg-slate-100 p-1 dark:bg-slate-800 text-xs font-semibold">
            <button
              onClick={() => setFilterStock("all")}
              className={`rounded-xl px-3 py-1.5 transition ${
                filterStock === "all"
                  ? "bg-white shadow-sm text-slate-900 dark:bg-slate-700 dark:text-slate-100"
                  : "text-slate-500"
              }`}
            >
              Todos ({sweets.length})
            </button>
            <button
              onClick={() => setFilterStock("low")}
              className={`rounded-xl px-3 py-1.5 transition ${
                filterStock === "low"
                  ? "bg-white shadow-sm text-amber-700 dark:bg-slate-700 dark:text-amber-300"
                  : "text-slate-500"
              }`}
            >
              Stock Bajo (≤5)
            </button>
            <button
              onClick={() => setFilterStock("out")}
              className={`rounded-xl px-3 py-1.5 transition ${
                filterStock === "out"
                  ? "bg-white shadow-sm text-rose-600 dark:bg-slate-700 dark:text-rose-400"
                  : "text-slate-500"
              }`}
            >
              Agotados
            </button>
          </div>
        </div>

        {/* Tabla */}
        <div className="max-h-[60vh] overflow-y-auto rounded-2xl border border-amber-100/70 dark:border-slate-800">
          <table className="min-w-full text-left text-sm">
            <thead className="sticky top-0 bg-amber-50 text-amber-950 dark:bg-slate-800 dark:text-amber-200">
              <tr>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3 text-right">P. Compra</th>
                <th className="px-4 py-3 text-right">P. Venta</th>
                <th className="px-4 py-3 text-right">Margen</th>
                <th className="px-4 py-3 text-center">Stock</th>
                <th className="px-4 py-3 text-center">Vendidos</th>
                <th className="px-4 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-100/70 dark:divide-slate-800">
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
                    className="hover:bg-amber-50/50 dark:hover:bg-slate-800/40"
                  >
                    <td className="px-4 py-2.5 font-semibold text-slate-800 dark:text-slate-100">
                      {s.name}
                    </td>
                    <td className="px-4 py-2.5 text-right text-slate-600 dark:text-slate-300">
                      ${pComp.toFixed(2)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-bold text-amber-700 dark:text-amber-400">
                      ${pVent.toFixed(2)}
                    </td>
                    <td className="px-4 py-2.5 text-right text-xs">
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        +${margin.toFixed(2)}
                      </span>{" "}
                      <span className="text-slate-400">({marginPct}%)</span>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          stock === 0
                            ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                            : stock <= 5
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                              : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                        }`}
                      >
                        {stock} pzas
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-center text-xs text-slate-500">
                      {s.sold_count || 0}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <div className="flex justify-center gap-1">
                        <button
                          onClick={() => onEditSweet(s)}
                          className="rounded-xl p-1.5 text-slate-500 hover:bg-amber-100 hover:text-amber-800 dark:hover:bg-slate-700"
                          title="Editar"
                        >
                          <Icon path={mdiPencil} size={0.75} />
                        </button>
                        <button
                          onClick={() => onDeleteSweet(s)}
                          className="rounded-xl p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950"
                          title="Eliminar"
                        >
                          <Icon path={mdiDelete} size={0.75} />
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
                    className="px-4 py-8 text-center text-slate-500"
                  >
                    No se encontraron productos
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
