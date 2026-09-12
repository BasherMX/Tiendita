import { useState } from "react";
import Icon from "@mdi/react";
import {
  mdiChartBar,
  mdiTrendingUp,
  mdiAlertCircle,
  mdiChevronLeft,
  mdiChevronRight,
  mdiCheckCircle,
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
    <div className="space-y-5">
      {/* Gráfica de Ventas y Rendimiento */}
      <div className="rounded-2xl border border-[#E5E2DA] bg-[#FFFFFF] p-4 sm:p-6 shadow-xs dark:border-[#282C32] dark:bg-[#181B1E]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E2DA] pb-3 dark:border-[#282C32]">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-500/20 bg-amber-500/10 text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-300">
              <Icon path={mdiChartBar} size={0.75} />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1C1917] dark:text-[#F3F2EE] leading-tight">
                Rendimiento de Ventas
              </h2>
              <p className="text-[11px] text-[#78716C] dark:text-[#9CA3AF]">
                Ingresos registrados por periodo
              </p>
            </div>
          </div>

          {/* Selector de Rango */}
          <div className="flex items-center gap-1.5 rounded-xl border border-[#E5E2DA] bg-[#F7F6F2] p-1 dark:border-[#282C32] dark:bg-[#111315]">
            <button
              onClick={() => shiftSalesRange(1)}
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FFFFFF] text-[#57534E] hover:text-[#1C1917] dark:bg-[#181B1E] dark:text-[#9CA3AF] dark:hover:text-[#F3F2EE] transition"
              title="Periodo anterior"
            >
              <Icon path={mdiChevronLeft} size={0.75} />
            </button>
            <span className="px-2 text-xs font-bold text-[#1C1917] dark:text-[#F3F2EE]">
              {salesRange
                ? formatRangeLabel(salesRange.from, salesRange.to)
                : "Esta semana"}
            </span>
            <button
              onClick={() => shiftSalesRange(-1)}
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FFFFFF] text-[#57534E] hover:text-[#1C1917] dark:bg-[#181B1E] dark:text-[#9CA3AF] dark:hover:text-[#F3F2EE] transition"
              title="Periodo siguiente"
            >
              <Icon path={mdiChevronRight} size={0.75} />
            </button>
          </div>
        </div>

        {/* Gráfica Recharts */}
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={salesChart}>
              <CartesianGrid
                strokeDasharray="2 2"
                stroke="#E5E2DA"
                opacity={0.5}
              />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11, fill: "#78716C" }}
                tickFormatter={formatDayLabel}
                stroke="#E5E2DA"
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#78716C" }}
                stroke="#E5E2DA"
              />
              <Tooltip
                labelFormatter={formatDayLabel}
                formatter={(val) => [`$${Number(val).toFixed(2)}`, "Ventas"]}
                contentStyle={{
                  backgroundColor: "#181B1E",
                  borderRadius: "0.75rem",
                  border: "1px solid #282C32",
                  color: "#F3F2EE",
                  fontSize: "12px",
                  fontWeight: "bold",
                }}
              />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#D97706"
                strokeWidth={2.5}
                dot={{ fill: "#B45309", r: 4 }}
                activeDot={{ r: 6, fill: "#F59E0B" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-3 flex items-baseline justify-between border-t border-[#E5E2DA] pt-3 text-xs dark:border-[#282C32]">
          <span className="font-bold text-[#78716C] dark:text-[#9CA3AF]">
            Total vendido en este periodo:
          </span>
          <span className="text-xl font-black font-tabular text-amber-700 dark:text-amber-400">
            ${totalSalesWeek.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Tableros Inferiores: Más Vendidos y Stock Bajo */}
      <div className="grid gap-5 md:grid-cols-2">
        {/* Más Vendidos */}
        <div className="rounded-2xl border border-[#E5E2DA] bg-[#FFFFFF] p-4 sm:p-5 shadow-xs dark:border-[#282C32] dark:bg-[#181B1E]">
          <div className="mb-3 flex items-center gap-2 border-b border-[#E5E2DA] pb-2.5 dark:border-[#282C32]">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-emerald-600/20 bg-emerald-50 text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-950/40 dark:text-emerald-300">
              <Icon path={mdiTrendingUp} size={0.65} />
            </div>
            <h3 className="text-sm font-bold text-[#1C1917] dark:text-[#F3F2EE]">
              Top Productos Más Vendidos
            </h3>
          </div>

          <div className="space-y-1.5">
            {topSellers.map((item, idx) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-xl border border-[#E5E2DA] bg-[#F7F6F2]/40 p-2.5 dark:border-[#282C32] dark:bg-[#111315]/40"
              >
                <div className="flex items-center gap-2.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-amber-500/15 font-mono text-[11px] font-bold text-amber-900 dark:bg-amber-400/20 dark:text-amber-200">
                    {idx + 1}
                  </span>
                  <span className="font-bold text-xs text-[#1C1917] dark:text-[#F3F2EE]">
                    {item.name}
                  </span>
                </div>
                <span className="text-xs font-black font-tabular text-amber-700 dark:text-amber-400">
                  {item.sold_count} pzas
                </span>
              </div>
            ))}

            {topSellers.length === 0 && (
              <p className="py-6 text-center text-xs text-[#78716C] dark:text-[#9CA3AF]">
                Aún no hay ventas registradas en el periodo
              </p>
            )}
          </div>
        </div>

        {/* Alertas de Stock Bajo */}
        <div className="rounded-2xl border border-[#E5E2DA] bg-[#FFFFFF] p-4 sm:p-5 shadow-xs dark:border-[#282C32] dark:bg-[#181B1E]">
          <div className="mb-3 flex items-center gap-2 border-b border-[#E5E2DA] pb-2.5 dark:border-[#282C32]">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-red-500/20 bg-red-50 text-red-700 dark:border-red-400/20 dark:bg-red-950/40 dark:text-red-300">
              <Icon path={mdiAlertCircle} size={0.65} />
            </div>
            <h3 className="text-sm font-bold text-[#1C1917] dark:text-[#F3F2EE]">
              Alertas de Stock Bajo (≤10)
            </h3>
          </div>

          <div className="space-y-1.5 max-h-60 overflow-y-auto">
            {lowStock.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-xl border border-red-200/80 bg-red-50/40 p-2.5 dark:border-red-900/40 dark:bg-red-950/20"
              >
                <span className="font-bold text-xs text-[#1C1917] dark:text-[#F3F2EE]">
                  {item.name}
                </span>
                <span className="rounded-md bg-red-100 px-2 py-0.5 text-[11px] font-bold font-tabular text-red-700 dark:bg-red-950 dark:text-red-300">
                  {item.stock} pzas restantes
                </span>
              </div>
            ))}

            {lowStock.length === 0 && (
              <div className="flex items-center justify-center gap-1.5 py-6 text-xs font-semibold text-emerald-800 dark:text-emerald-400">
                <Icon path={mdiCheckCircle} size={0.6} />
                <span>Todo el inventario tiene existencias suficientes</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
