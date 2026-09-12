import { useState } from "react";
import Icon from "@mdi/react";
import {
  mdiChartBar,
  mdiTrendingUp,
  mdiAlertCircle,
  mdiChevronLeft,
  mdiChevronRight,
  mdiCalendarRange,
} from "@mdi/js";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatRangeLabel } from "../utils/dateUtils.js";

function formatDayLabel(dayStr) {
  if (!dayStr) return "";
  const match = String(dayStr).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const [, y, m, dNum] = match;
    return `${parseInt(dNum, 10)}/${m}/${y}`;
  }
  const d = new Date(dayStr);
  if (!isNaN(d.getTime())) {
    return d.toLocaleDateString("es-MX", {
      day: "numeric",
      month: "2-digit",
      year: "numeric",
    });
  }
  return String(dayStr);
}

export default function StatsPage({
  stats = null,
  salesChart = [],
  salesRange = null,
  shiftSalesRange,
  selectedRangeMode = "week",
  setSelectedRangeMode,
  selectedDay = null,
  dayMovements = [],
  loadingDay = false,
  onSelectDay,
}) {
  const topSellers = stats?.topSellers || [];
  const lowStock = stats?.lowStock || [];
  const dailyTotals = stats?.dailyTotals || [];

  const totalSalesWeek = salesChart.reduce(
    (sum, d) => sum + (Number(d.total) || 0),
    0,
  );

  return (
    <div className="space-y-6">
      {/* Header y Control de Rango de Ventas */}
      <div className="rounded-3xl border border-amber-100/70 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-slate-100">
            <Icon path={mdiChartBar} size={1} className="text-amber-500" />
            Métricas y Gráficas de Ventas
          </div>

          {/* Selector de Rango */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => shiftSalesRange(1)}
              className="rounded-full border p-1.5 text-slate-500 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
              title="Periodo anterior"
            >
              <Icon path={mdiChevronLeft} size={0.8} />
            </button>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {salesRange
                ? formatRangeLabel(salesRange.from, salesRange.to)
                : "Esta semana"}
            </span>
            <button
              onClick={() => shiftSalesRange(-1)}
              className="rounded-full border p-1.5 text-slate-500 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
              title="Periodo siguiente"
            >
              <Icon path={mdiChevronRight} size={0.8} />
            </button>
          </div>
        </div>

        {/* Gráfica de Ventas */}
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={salesChart}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11 }}
                tickFormatter={formatDayLabel}
              />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                labelFormatter={formatDayLabel}
                formatter={(val) => [`$${Number(val).toFixed(2)}`, "Ventas"]}
                contentStyle={{
                  backgroundColor: "rgba(15, 23, 42, 0.9)",
                  borderRadius: "1rem",
                  border: "none",
                  color: "#fff",
                }}
              />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#f59e0b"
                strokeWidth={3}
                dot={{ fill: "#d97706", r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
          <span className="font-semibold text-slate-500 uppercase">
            Total en este periodo:
          </span>
          <span className="text-lg font-black text-amber-600 dark:text-amber-400">
            ${totalSalesWeek.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Grid de Productos Más Vendidos y Alertas de Stock */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Más Vendidos */}
        <div className="rounded-3xl border border-amber-100/70 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
          <div className="mb-4 flex items-center gap-2 text-base font-bold text-slate-800 dark:text-slate-100">
            <Icon
              path={mdiTrendingUp}
              size={0.9}
              className="text-emerald-500"
            />
            Top Productos Más Vendidos
          </div>

          <div className="space-y-2.5">
            {topSellers.map((item, idx) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-2xl border border-slate-100 p-3 dark:border-slate-800"
              >
                <div className="flex items-center gap-2.5">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-800 dark:bg-slate-800 dark:text-amber-300">
                    #{idx + 1}
                  </span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {item.name}
                  </span>
                </div>
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                  {item.sold_count} vendidos
                </span>
              </div>
            ))}

            {topSellers.length === 0 && (
              <p className="text-center text-xs text-slate-400 py-4">
                Aún no hay ventas registradas
              </p>
            )}
          </div>
        </div>

        {/* Alertas de Stock Bajo */}
        <div className="rounded-3xl border border-amber-100/70 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
          <div className="mb-4 flex items-center gap-2 text-base font-bold text-slate-800 dark:text-slate-100">
            <Icon path={mdiAlertCircle} size={0.9} className="text-rose-500" />
            Alertas de Stock Bajo (≤10)
          </div>

          <div className="space-y-2.5 max-h-60 overflow-y-auto">
            {lowStock.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-2xl border border-rose-100 bg-rose-50/40 p-3 dark:border-rose-950 dark:bg-rose-950/20"
              >
                <span className="font-medium text-slate-800 dark:text-slate-200 text-xs">
                  {item.name}
                </span>
                <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                  {item.stock} pzas restantes
                </span>
              </div>
            ))}

            {lowStock.length === 0 && (
              <p className="text-center text-xs text-emerald-600 dark:text-emerald-400 py-4">
                ✓ Todo el inventario está bien surtido
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
