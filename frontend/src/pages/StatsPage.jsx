import { useState } from "react";
import Icon from "@mdi/react";
import {
  mdiChartBar,
  mdiTrendingUp,
  mdiAlertCircle,
  mdiChevronLeft,
  mdiChevronRight,
  mdiCheckCircle,
  mdiChartPie,
  mdiClockOutline,
  mdiCalendarWeek,
  mdiAccountClock,
  mdiPackageVariantClosed,
  mdiShoppingOutline,
  mdiCashCheck,
  mdiSwapHorizontal,
  mdiCurrencyUsd,
  mdiPercent,
} from "@mdi/js";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
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

// Tooltip estilizado con soporte nativo de tema claro / oscuro
function ModernTooltip({
  active,
  payload,
  label,
  isCurrency = true,
  customLabel,
}) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-xl border border-[#E5E2DA] bg-[#FFFFFF] p-3 shadow-xl dark:border-[#282C32] dark:bg-[#181B1E] text-xs min-w-[150px]">
      <p className="font-bold text-[#1C1917] dark:text-[#F3F2EE] mb-2 border-b border-[#E5E2DA] pb-1 dark:border-[#282C32]">
        {customLabel || label}
      </p>
      <div className="space-y-1">
        {payload.map((item, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between gap-3 text-[11px]"
          >
            <span className="flex items-center gap-1.5 text-[#78716C] dark:text-[#9CA3AF]">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: item.color || item.fill }}
              />
              {item.name}:
            </span>
            <span className="font-black font-tabular text-[#1C1917] dark:text-[#F3F2EE]">
              {isCurrency
                ? `$${Number(item.value || 0).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : `${item.value}`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const PAYMENT_COLOR_MAP = {
  cash: "#059669", // Esmeralda
  credit: "#DC2626", // Carmesí
  transfer: "#2563EB", // Azul
  card: "#7C3AED", // Violeta
  points: "#D97706", // Ámbar
};

const AGING_BAR_COLORS = [
  "#059669", // 1-7 días (verde)
  "#D97706", // 8-15 días (ámbar)
  "#EA580C", // 16-30 días (naranja)
  "#DC2626", // +30 días (rojo mora)
];

export default function StatsPage({
  stats = null,
  salesChart = [],
  salesRange = null,
  shiftSalesRange,
}) {
  const [activeTab, setActiveTab] = useState("general");
  const [cashFlowFilter, setCashFlowFilter] = useState("quincena"); // "semana" | "quincena" | "mes" | "historico"

  // Métricas del backend
  const kpis = stats?.kpis || {
    averageTicket: 0,
    totalTickets: 0,
    totalRevenue: 0,
    recoveryRate: 100,
    creditGranted: 0,
    paymentsReceived: 0,
    stagnantCapital: 0,
  };
  const cashFlowDaily = stats?.cashFlowDaily || [];
  const hourlySales = stats?.hourlySales || [];
  const dayOfWeekSales = stats?.dayOfWeekSales || [];
  const paymentMethods = stats?.paymentMethods || [];
  const productProfitability = stats?.productProfitability || [];
  const productAffinity = stats?.productAffinity || [];
  const debtAging = stats?.debtAging || [];
  const stagnantStock = stats?.stagnantStock || [];
  const topSellers = stats?.topSellers || [];
  const lowStock = stats?.lowStock || [];

  // Filtrado de flujo de caja según periodo seleccionado
  const filteredCashFlow = (() => {
    if (!cashFlowDaily || !cashFlowDaily.length) return [];
    if (cashFlowFilter === "historico") return cashFlowDaily;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentDate = now.getDate();
    const currentDay = now.getDay(); // 0=Dom, 1=Lun, ..., 6=Sáb

    let startStr = "";
    let endStr = "";

    if (cashFlowFilter === "semana") {
      const diff = currentDay === 0 ? 6 : currentDay - 1;
      const monday = new Date(currentYear, currentMonth, currentDate - diff);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      startStr = monday.toISOString().slice(0, 10);
      endStr = sunday.toISOString().slice(0, 10);
    } else if (cashFlowFilter === "quincena") {
      const mStr = String(currentMonth + 1).padStart(2, "0");
      if (currentDate <= 15) {
        startStr = `${currentYear}-${mStr}-01`;
        endStr = `${currentYear}-${mStr}-15`;
      } else {
        startStr = `${currentYear}-${mStr}-16`;
        const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate();
        endStr = `${currentYear}-${mStr}-${lastDay}`;
      }
    } else if (cashFlowFilter === "mes") {
      const mStr = String(currentMonth + 1).padStart(2, "0");
      startStr = `${currentYear}-${mStr}-01`;
      const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate();
      endStr = `${currentYear}-${mStr}-${lastDay}`;
    }

    return cashFlowDaily.filter((item) => {
      const d = String(item.day).slice(0, 10);
      return d >= startStr && d <= endStr;
    });
  })();

  const totalSalesWeek = salesChart.reduce(
    (sum, d) => sum + (Number(d.total) || 0),
    0,
  );

  return (
    <div className="space-y-6">
      {/* 1. Encabezado de Sección y Selector de Vista */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[#E5E2DA] pb-4 dark:border-[#282C32]">
        <div>
          <h1 className="text-xl font-black text-[#1C1917] dark:text-[#F3F2EE] tracking-tight">
            Centro de Inteligencia & Estadísticas
          </h1>
          <p className="text-xs text-[#78716C] dark:text-[#9CA3AF]">
            Métricas estratégicas, hábitos de mostrador y rendimiento financiero
            en tiempo real
          </p>
        </div>

        {/* Selector de pestañas */}
        <div className="flex items-center gap-1 rounded-xl border border-[#E5E2DA] bg-[#F7F6F2] p-1 dark:border-[#282C32] dark:bg-[#111315] self-start sm:self-auto overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab("general")}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition whitespace-nowrap ${
              activeTab === "general"
                ? "bg-[#FFFFFF] text-amber-700 shadow-xs dark:bg-[#181B1E] dark:text-amber-400"
                : "text-[#78716C] hover:text-[#1C1917] dark:text-[#9CA3AF] dark:hover:text-[#F3F2EE]"
            }`}
          >
            Resumen General
          </button>
          <button
            onClick={() => setActiveTab("comportamiento")}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition whitespace-nowrap ${
              activeTab === "comportamiento"
                ? "bg-[#FFFFFF] text-amber-700 shadow-xs dark:bg-[#181B1E] dark:text-amber-400"
                : "text-[#78716C] hover:text-[#1C1917] dark:text-[#9CA3AF] dark:hover:text-[#F3F2EE]"
            }`}
          >
            Horarios & Pagos
          </button>
          <button
            onClick={() => setActiveTab("rentabilidad")}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition whitespace-nowrap ${
              activeTab === "rentabilidad"
                ? "bg-[#FFFFFF] text-amber-700 shadow-xs dark:bg-[#181B1E] dark:text-amber-400"
                : "text-[#78716C] hover:text-[#1C1917] dark:text-[#9CA3AF] dark:hover:text-[#F3F2EE]"
            }`}
          >
            Rentabilidad & Productos
          </button>
          <button
            onClick={() => setActiveTab("cartera")}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition whitespace-nowrap ${
              activeTab === "cartera"
                ? "bg-[#FFFFFF] text-amber-700 shadow-xs dark:bg-[#181B1E] dark:text-amber-400"
                : "text-[#78716C] hover:text-[#1C1917] dark:text-[#9CA3AF] dark:hover:text-[#F3F2EE]"
            }`}
          >
            Cartera & Almacén
          </button>
        </div>
      </div>

      {/* 2. Ribbon Superior de KPIs Clave */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {/* KPI: Ticket Promedio */}
        <div className="rounded-2xl border border-[#E5E2DA] bg-[#FFFFFF] p-4 shadow-xs dark:border-[#282C32] dark:bg-[#181B1E]">
          <div className="flex items-center justify-between text-[#78716C] dark:text-[#9CA3AF] mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Ticket Promedio
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300">
              <Icon path={mdiCurrencyUsd} size={0.65} />
            </div>
          </div>
          <p className="text-2xl font-black font-tabular text-[#1C1917] dark:text-[#F3F2EE]">
            ${Number(kpis.averageTicket || 0).toFixed(2)}
          </p>
          <p className="mt-1 text-[11px] text-[#78716C] dark:text-[#9CA3AF]">
            En{" "}
            <span className="font-bold text-[#1C1917] dark:text-[#F3F2EE] font-tabular">
              {kpis.totalTickets}
            </span>{" "}
            ventas totales
          </p>
        </div>

        {/* KPI: Tasa de Cobranza */}
        <div className="rounded-2xl border border-[#E5E2DA] bg-[#FFFFFF] p-4 shadow-xs dark:border-[#282C32] dark:bg-[#181B1E]">
          <div className="flex items-center justify-between text-[#78716C] dark:text-[#9CA3AF] mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Tasa de Cobranza (30d)
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">
              <Icon path={mdiCashCheck} size={0.65} />
            </div>
          </div>
          <p className="text-2xl font-black font-tabular text-emerald-800 dark:text-emerald-300">
            {kpis.recoveryRate}%
          </p>
          <p className="mt-1 text-[11px] text-[#78716C] dark:text-[#9CA3AF]">
            Abonos:{" "}
            <span className="font-bold text-[#1C1917] dark:text-[#F3F2EE] font-tabular">
              ${Number(kpis.paymentsReceived || 0).toFixed(2)}
            </span>
          </p>
        </div>

        {/* KPI: Capital Estancado */}
        <div className="rounded-2xl border border-[#E5E2DA] bg-[#FFFFFF] p-4 shadow-xs dark:border-[#282C32] dark:bg-[#181B1E]">
          <div className="flex items-center justify-between text-[#78716C] dark:text-[#9CA3AF] mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Capital Estancado
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-500/10 text-orange-700 dark:bg-orange-400/10 dark:text-orange-300">
              <Icon path={mdiPackageVariantClosed} size={0.65} />
            </div>
          </div>
          <p className="text-2xl font-black font-tabular text-[#1C1917] dark:text-[#F3F2EE]">
            ${Number(kpis.stagnantCapital || 0).toFixed(2)}
          </p>
          <p className="mt-1 text-[11px] text-[#78716C] dark:text-[#9CA3AF]">
            En dulces con rotación baja
          </p>
        </div>

        {/* KPI: Total de Ingresos */}
        <div className="rounded-2xl border border-[#E5E2DA] bg-[#FFFFFF] p-4 shadow-xs dark:border-[#282C32] dark:bg-[#181B1E]">
          <div className="flex items-center justify-between text-[#78716C] dark:text-[#9CA3AF] mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Ingresos Acumulados
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-700 dark:bg-blue-400/10 dark:text-blue-300">
              <Icon path={mdiTrendingUp} size={0.65} />
            </div>
          </div>
          <p className="text-2xl font-black font-tabular text-amber-700 dark:text-amber-400">
            $
            {Number(kpis.totalRevenue || 0).toLocaleString("es-MX", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
          <p className="mt-1 text-[11px] text-[#78716C] dark:text-[#9CA3AF]">
            Ventas de mostrador + fiado
          </p>
        </div>
      </div>

      {/* 3. Vistas Condicionales */}

      {/* === VISTA: RESUMEN GENERAL === */}
      {activeTab === "general" && (
        <div className="space-y-6">
          {/* Gráfica de Rendimiento de Ventas (Semanal) */}
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
                    content={<ModernTooltip customLabel="Venta del día" />}
                  />
                  <Line
                    type="monotone"
                    name="Ventas"
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

          {/* Gráfica de Flujo de Caja: Contado vs Fiado vs Abonos */}
          <div className="rounded-2xl border border-[#E5E2DA] bg-[#FFFFFF] p-4 sm:p-6 shadow-xs dark:border-[#282C32] dark:bg-[#181B1E]">
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#E5E2DA] pb-3 dark:border-[#282C32]">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300">
                  <Icon path={mdiSwapHorizontal} size={0.75} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#1C1917] dark:text-[#F3F2EE] leading-tight">
                    Flujo de Caja Real
                  </h2>
                  <p className="text-[11px] text-[#78716C] dark:text-[#9CA3AF]">
                    Comparativa diaria entre ventas de Contado, Créditos
                    otorgados y Abonos recuperados
                  </p>
                </div>
              </div>

              {/* Filtros de periodo: Semana, Quincena, Mes, Histórico */}
              <div className="flex items-center gap-1 rounded-xl border border-[#E5E2DA] bg-[#F7F6F2] p-1 dark:border-[#282C32] dark:bg-[#111315] self-start sm:self-auto overflow-x-auto max-w-full">
                {[
                  { id: "semana", label: "Semana actual" },
                  { id: "quincena", label: "Quincena actual" },
                  { id: "mes", label: "Mes actual" },
                  { id: "historico", label: "Histórico" },
                ].map((btn) => (
                  <button
                    key={btn.id}
                    type="button"
                    onClick={() => setCashFlowFilter(btn.id)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-bold transition whitespace-nowrap ${
                      cashFlowFilter === btn.id
                        ? "bg-[#FFFFFF] text-emerald-800 shadow-xs dark:bg-[#181B1E] dark:text-emerald-300"
                        : "text-[#78716C] hover:text-[#1C1917] dark:text-[#9CA3AF] dark:hover:text-[#F3F2EE]"
                    }`}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Leyenda de colores */}
            <div className="mb-3 flex items-center justify-end gap-4 text-[11px] font-bold">
              <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />{" "}
                Contado
              </span>
              <span className="flex items-center gap-1.5 text-blue-700 dark:text-blue-400">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-500" /> Abonos
              </span>
              <span className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500" /> Fiado
              </span>
            </div>

            <div className="h-64 w-full">
              {filteredCashFlow.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={filteredCashFlow}>
                    <defs>
                      <linearGradient
                        id="colorContado"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#10B981"
                          stopOpacity={0.4}
                        />
                        <stop
                          offset="95%"
                          stopColor="#10B981"
                          stopOpacity={0}
                        />
                      </linearGradient>
                      <linearGradient
                        id="colorAbonos"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#3B82F6"
                          stopOpacity={0.4}
                        />
                        <stop
                          offset="95%"
                          stopColor="#3B82F6"
                          stopOpacity={0}
                        />
                      </linearGradient>
                      <linearGradient
                        id="colorFiado"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#EF4444"
                          stopOpacity={0.4}
                        />
                        <stop
                          offset="95%"
                          stopColor="#EF4444"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
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
                      interval={
                        cashFlowFilter === "historico"
                          ? Math.max(1, Math.floor(filteredCashFlow.length / 6))
                          : 0
                      }
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#78716C" }}
                      stroke="#E5E2DA"
                    />
                    <Tooltip content={<ModernTooltip />} />
                    <Area
                      type="monotone"
                      name="Contado"
                      dataKey="contado"
                      stroke="#10B981"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorContado)"
                    />
                    <Area
                      type="monotone"
                      name="Abonos"
                      dataKey="abonos"
                      stroke="#3B82F6"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorAbonos)"
                    />
                    <Area
                      type="monotone"
                      name="Fiado"
                      dataKey="fiado"
                      stroke="#EF4444"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorFiado)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-[#78716C] dark:text-[#9CA3AF]">
                  No hay movimientos registrados en el periodo seleccionado
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* === VISTA: HORARIOS & MÉTODOS DE PAGO === */}
      {activeTab === "comportamiento" && (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Horas Pico de Venta */}
            <div className="rounded-2xl border border-[#E5E2DA] bg-[#FFFFFF] p-4 sm:p-6 shadow-xs dark:border-[#282C32] dark:bg-[#181B1E]">
              <div className="mb-4 flex items-center justify-between border-b border-[#E5E2DA] pb-3 dark:border-[#282C32]">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-blue-500/20 bg-blue-500/10 text-blue-700 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-300">
                    <Icon path={mdiClockOutline} size={0.75} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#1C1917] dark:text-[#F3F2EE]">
                      Horas Pico en Mostrador
                    </h3>
                    <p className="text-[11px] text-[#78716C] dark:text-[#9CA3AF]">
                      Ventas por franja horaria en mostrador (08:00 a 17:00)
                    </p>
                  </div>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hourlySales}>
                    <CartesianGrid
                      strokeDasharray="2 2"
                      stroke="#E5E2DA"
                      opacity={0.5}
                    />
                    <XAxis
                      dataKey="hour"
                      tick={{ fontSize: 10, fill: "#78716C" }}
                      stroke="#E5E2DA"
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#78716C" }}
                      stroke="#E5E2DA"
                    />
                    <Tooltip
                      content={<ModernTooltip customLabel="Horario" />}
                    />
                    <Bar
                      name="Ventas"
                      dataKey="total"
                      fill="#3B82F6"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="mt-2 text-center text-[11px] text-[#78716C] dark:text-[#9CA3AF]">
                Ayuda a planificar turnos y horarios de mayor tráfico en la
                tiendita
              </p>
            </div>

            {/* Días Fuertes de la Semana */}
            <div className="rounded-2xl border border-[#E5E2DA] bg-[#FFFFFF] p-4 sm:p-6 shadow-xs dark:border-[#282C32] dark:bg-[#181B1E]">
              <div className="mb-4 flex items-center justify-between border-b border-[#E5E2DA] pb-3 dark:border-[#282C32]">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-500/20 bg-amber-500/10 text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-300">
                    <Icon path={mdiCalendarWeek} size={0.75} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#1C1917] dark:text-[#F3F2EE]">
                      Días con Mayor Actividad
                    </h3>
                    <p className="text-[11px] text-[#78716C] dark:text-[#9CA3AF]">
                      Ingresos de Lunes a Viernes (cerrado fines de semana)
                    </p>
                  </div>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dayOfWeekSales}>
                    <CartesianGrid
                      strokeDasharray="2 2"
                      stroke="#E5E2DA"
                      opacity={0.5}
                    />
                    <XAxis
                      dataKey="dayName"
                      tick={{ fontSize: 11, fill: "#78716C" }}
                      stroke="#E5E2DA"
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#78716C" }}
                      stroke="#E5E2DA"
                    />
                    <Tooltip
                      content={<ModernTooltip customLabel="Día de la semana" />}
                    />
                    <Bar
                      name="Total"
                      dataKey="total"
                      fill="#D97706"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="mt-2 text-center text-[11px] text-[#78716C] dark:text-[#9CA3AF]">
                Identifica qué días de la semana generan mayor volumen de ventas
              </p>
            </div>
          </div>

          {/* Distribución por Métodos de Pago */}
          <div className="rounded-2xl border border-[#E5E2DA] bg-[#FFFFFF] p-4 sm:p-6 shadow-xs dark:border-[#282C32] dark:bg-[#181B1E]">
            <div className="mb-4 flex items-center justify-between border-b border-[#E5E2DA] pb-3 dark:border-[#282C32]">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-purple-500/20 bg-purple-500/10 text-purple-700 dark:border-purple-400/20 dark:bg-purple-400/10 dark:text-purple-300">
                  <Icon path={mdiChartPie} size={0.75} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1C1917] dark:text-[#F3F2EE]">
                    Métodos de Pago Más Utilizados
                  </h3>
                  <p className="text-[11px] text-[#78716C] dark:text-[#9CA3AF]">
                    Distribución de ventas por modalidad (Efectivo, Fiado, SPEI,
                    Tarjeta)
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 items-center">
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentMethods}
                      dataKey="total"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                    >
                      {paymentMethods.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={PAYMENT_COLOR_MAP[entry.key] || "#78716C"}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<ModernTooltip customLabel="Método" />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Lista Desglosada con Montos y Porcentajes */}
              <div className="space-y-2">
                {paymentMethods.map((pm) => {
                  const totalSum = paymentMethods.reduce(
                    (s, p) => s + p.total,
                    0,
                  );
                  const pct =
                    totalSum > 0 ? ((pm.total / totalSum) * 100).toFixed(1) : 0;
                  const color = PAYMENT_COLOR_MAP[pm.key] || "#78716C";
                  return (
                    <div
                      key={pm.key}
                      className="flex items-center justify-between rounded-xl border border-[#E5E2DA] bg-[#F7F6F2]/50 p-2.5 dark:border-[#282C32] dark:bg-[#111315]/50"
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className="h-3 w-3 rounded-full shrink-0"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-xs font-bold text-[#1C1917] dark:text-[#F3F2EE]">
                          {pm.name}
                        </span>
                        <span className="text-[10px] text-[#78716C] dark:text-[#9CA3AF]">
                          ({pm.count} ops)
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-black font-tabular text-[#1C1917] dark:text-[#F3F2EE] block">
                          ${pm.total.toFixed(2)}
                        </span>
                        <span className="text-[10px] font-bold text-[#78716C] dark:text-[#9CA3AF]">
                          {pct}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* === VISTA: RENTABILIDAD & PRODUCTOS === */}
      {activeTab === "rentabilidad" && (
        <div className="space-y-6">
          {/* Margen Real y Ganancia Neta */}
          <div className="rounded-2xl border border-[#E5E2DA] bg-[#FFFFFF] p-4 sm:p-6 shadow-xs dark:border-[#282C32] dark:bg-[#181B1E]">
            <div className="mb-4 flex items-center justify-between border-b border-[#E5E2DA] pb-3 dark:border-[#282C32]">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300">
                  <Icon path={mdiPercent} size={0.75} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1C1917] dark:text-[#F3F2EE]">
                    Margen Real & Ganancia Neta por Producto
                  </h3>
                  <p className="text-[11px] text-[#78716C] dark:text-[#9CA3AF]">
                    Productos ordenados por utilidad neta acumulada en dinero
                    real (Ganancia = Venta - Costo)
                  </p>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E5E2DA] text-[11px] text-[#78716C] dark:border-[#282C32] dark:text-[#9CA3AF]">
                    <th className="pb-2.5 font-bold">Producto</th>
                    <th className="pb-2.5 font-bold text-center">
                      Pzas Vendidas
                    </th>
                    <th className="pb-2.5 font-bold text-right">
                      Precio Venta
                    </th>
                    <th className="pb-2.5 font-bold text-right">
                      Margen Unitario
                    </th>
                    <th className="pb-2.5 font-bold text-right">% Margen</th>
                    <th className="pb-2.5 font-bold text-right text-emerald-800 dark:text-emerald-400">
                      Ganancia Neta
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E2DA]/60 dark:divide-[#282C32]/60">
                  {productProfitability.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-[#F7F6F2]/50 dark:hover:bg-[#111315]/50 transition"
                    >
                      <td className="py-2.5 font-bold text-[#1C1917] dark:text-[#F3F2EE]">
                        {item.name}
                      </td>
                      <td className="py-2.5 font-mono text-center font-bold text-[#57534E] dark:text-[#A8A29E]">
                        {item.sold_count}
                      </td>
                      <td className="py-2.5 text-right font-tabular text-[#57534E] dark:text-[#A8A29E]">
                        ${item.sale_price.toFixed(2)}
                      </td>
                      <td className="py-2.5 text-right font-tabular text-[#1C1917] dark:text-[#F3F2EE]">
                        +${item.unit_margin.toFixed(2)}
                      </td>
                      <td className="py-2.5 text-right font-bold text-amber-700 dark:text-amber-400 font-tabular">
                        {item.margin_percent}%
                      </td>
                      <td className="py-2.5 text-right font-black font-tabular text-emerald-800 dark:text-emerald-300">
                        +${item.total_profit.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  {productProfitability.length === 0 && (
                    <tr>
                      <td
                        colSpan="6"
                        className="py-6 text-center text-xs text-[#78716C] dark:text-[#9CA3AF]"
                      >
                        Aún no hay ventas con costo registradas para calcular
                        márgenes
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Top Productos Más Vendidos */}
            <div className="rounded-2xl border border-[#E5E2DA] bg-[#FFFFFF] p-4 sm:p-5 shadow-xs dark:border-[#282C32] dark:bg-[#181B1E]">
              <div className="mb-3 flex items-center gap-2 border-b border-[#E5E2DA] pb-2.5 dark:border-[#282C32]">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-amber-500/20 bg-amber-50 text-amber-800 dark:border-amber-400/20 dark:bg-amber-950/40 dark:text-amber-300">
                  <Icon path={mdiTrendingUp} size={0.65} />
                </div>
                <h3 className="text-sm font-bold text-[#1C1917] dark:text-[#F3F2EE]">
                  Top Productos por Volumen
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
                    Aún no hay ventas registradas
                  </p>
                )}
              </div>
            </div>

            {/* Pares de Productos Más Vendidos Juntos (Cross-Selling) */}
            <div className="rounded-2xl border border-[#E5E2DA] bg-[#FFFFFF] p-4 sm:p-5 shadow-xs dark:border-[#282C32] dark:bg-[#181B1E]">
              <div className="mb-3 flex items-center gap-2 border-b border-[#E5E2DA] pb-2.5 dark:border-[#282C32]">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-purple-500/20 bg-purple-50 text-purple-800 dark:border-purple-400/20 dark:bg-purple-950/40 dark:text-purple-300">
                  <Icon path={mdiShoppingOutline} size={0.65} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1C1917] dark:text-[#F3F2EE]">
                    Afinidad en Cesta (Cross-Selling)
                  </h3>
                  <p className="text-[10px] text-[#78716C] dark:text-[#9CA3AF]">
                    Dulces que los clientes suelen comprar juntos
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {productAffinity.map((pair, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-xl border border-purple-200/70 bg-purple-50/30 p-2.5 dark:border-purple-900/40 dark:bg-purple-950/20"
                  >
                    <div className="flex items-center gap-2 text-xs font-bold text-[#1C1917] dark:text-[#F3F2EE]">
                      <span>{pair.product_a}</span>
                      <span className="text-purple-600 dark:text-purple-400 font-mono">
                        +
                      </span>
                      <span>{pair.product_b}</span>
                    </div>
                    <span className="rounded-md bg-purple-100 px-2 py-0.5 text-[11px] font-bold font-tabular text-purple-800 dark:bg-purple-900/60 dark:text-purple-200">
                      {pair.pair_count} veces
                    </span>
                  </div>
                ))}
                {productAffinity.length === 0 && (
                  <p className="py-6 text-center text-xs text-[#78716C] dark:text-[#9CA3AF]">
                    Se requieren más transacciones con 2 o más dulces para
                    detectar patrones
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* === VISTA: CARTERA & ALMACÉN === */}
      {activeTab === "cartera" && (
        <div className="space-y-6">
          {/* Distribución de Deuda por Antigüedad */}
          <div className="rounded-2xl border border-[#E5E2DA] bg-[#FFFFFF] p-4 sm:p-6 shadow-xs dark:border-[#282C32] dark:bg-[#181B1E]">
            <div className="mb-4 flex items-center justify-between border-b border-[#E5E2DA] pb-3 dark:border-[#282C32]">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-500/20 bg-red-500/10 text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300">
                  <Icon path={mdiAccountClock} size={0.75} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1C1917] dark:text-[#F3F2EE]">
                    Distribución de Deuda por Antigüedad (FIFO)
                  </h3>
                  <p className="text-[11px] text-[#78716C] dark:text-[#9CA3AF]">
                    Deuda total desglosada por tiempo transcurrido desde el
                    movimiento más antiguo no saldado
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 items-center">
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={debtAging}>
                    <CartesianGrid
                      strokeDasharray="2 2"
                      stroke="#E5E2DA"
                      opacity={0.5}
                    />
                    <XAxis
                      dataKey="range"
                      tick={{ fontSize: 10, fill: "#78716C" }}
                      stroke="#E5E2DA"
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#78716C" }}
                      stroke="#E5E2DA"
                    />
                    <Tooltip
                      content={<ModernTooltip customLabel="Antigüedad" />}
                    />
                    <Bar
                      dataKey="amount"
                      name="Deuda ($)"
                      radius={[4, 4, 0, 0]}
                    >
                      {debtAging.map((entry, index) => (
                        <Cell
                          key={`cell-aging-${index}`}
                          fill={AGING_BAR_COLORS[index] || "#78716C"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2">
                {debtAging.map((bucket, index) => {
                  const color = AGING_BAR_COLORS[index] || "#78716C";
                  return (
                    <div
                      key={bucket.range}
                      className="flex items-center justify-between rounded-xl border border-[#E5E2DA] bg-[#F7F6F2]/50 p-2.5 dark:border-[#282C32] dark:bg-[#111315]/50"
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className="h-3 w-3 rounded-full shrink-0"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-xs font-bold text-[#1C1917] dark:text-[#F3F2EE]">
                          {bucket.range}
                        </span>
                        <span className="text-[10px] text-[#78716C] dark:text-[#9CA3AF]">
                          ({bucket.count}{" "}
                          {bucket.count === 1 ? "cliente" : "clientes"})
                        </span>
                      </div>
                      <span className="text-xs font-black font-tabular text-[#1C1917] dark:text-[#F3F2EE]">
                        ${Number(bucket.amount || 0).toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Stock Estancado (Baja Rotación) */}
            <div className="rounded-2xl border border-[#E5E2DA] bg-[#FFFFFF] p-4 sm:p-5 shadow-xs dark:border-[#282C32] dark:bg-[#181B1E]">
              <div className="mb-3 flex items-center justify-between border-b border-[#E5E2DA] pb-2.5 dark:border-[#282C32]">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-orange-500/20 bg-orange-50 text-orange-700 dark:border-orange-400/20 dark:bg-orange-950/40 dark:text-orange-300">
                    <Icon path={mdiPackageVariantClosed} size={0.65} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#1C1917] dark:text-[#F3F2EE]">
                      Stock Estancado (Baja Rotación)
                    </h3>
                    <p className="text-[10px] text-[#78716C] dark:text-[#9CA3AF]">
                      Productos con existencias y ≤2 ventas (margen de gracia:
                      &gt;15 días de antigüedad)
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 max-h-72 overflow-y-auto">
                {stagnantStock.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-xl border border-orange-200/80 bg-orange-50/40 p-2.5 dark:border-orange-900/40 dark:bg-orange-950/20"
                  >
                    <div>
                      <p className="font-bold text-xs text-[#1C1917] dark:text-[#F3F2EE]">
                        {item.name}
                      </p>
                      <p className="text-[10px] text-[#78716C] dark:text-[#9CA3AF]">
                        {item.stock} pzas en almacén · {item.sold_count}{" "}
                        vendidas
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="rounded-md bg-orange-100 px-2 py-0.5 text-[11px] font-bold font-tabular text-orange-800 dark:bg-orange-950 dark:text-orange-300">
                        ${Number(item.frozen_capital || 0).toFixed(2)}{" "}
                        congelados
                      </span>
                    </div>
                  </div>
                ))}
                {stagnantStock.length === 0 && (
                  <div className="flex items-center justify-center gap-1.5 py-6 text-xs font-semibold text-emerald-800 dark:text-emerald-400">
                    <Icon path={mdiCheckCircle} size={0.6} />
                    <span>No hay productos estancados en almacén</span>
                  </div>
                )}
              </div>
            </div>

            {/* Alertas de Stock Bajo y Crítico */}
            <div className="rounded-2xl border border-[#E5E2DA] bg-[#FFFFFF] p-4 sm:p-5 shadow-xs dark:border-[#282C32] dark:bg-[#181B1E]">
              <div className="mb-3 flex items-center justify-between border-b border-[#E5E2DA] pb-2.5 dark:border-[#282C32]">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-red-500/20 bg-red-50 text-red-700 dark:border-red-400/20 dark:bg-red-950/40 dark:text-red-300">
                    <Icon path={mdiAlertCircle} size={0.65} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#1C1917] dark:text-[#F3F2EE]">
                      Alertas de Stock Bajo (≤10)
                    </h3>
                    <p className="text-[10px] text-[#78716C] dark:text-[#9CA3AF]">
                      Productos que requieren reabastecimiento próximo
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 max-h-72 overflow-y-auto">
                {lowStock.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-xl border border-red-200/80 bg-red-50/40 p-2.5 dark:border-red-900/40 dark:bg-red-950/20"
                  >
                    <span className="font-bold text-xs text-[#1C1917] dark:text-[#F3F2EE]">
                      {item.name}
                    </span>
                    <span
                      className={`rounded-md px-2 py-0.5 text-[11px] font-bold font-tabular ${
                        item.stock < 0
                          ? "bg-red-200 text-red-900 dark:bg-red-900 dark:text-red-100"
                          : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                      }`}
                    >
                      {item.stock} pzas restantes
                    </span>
                  </div>
                ))}
                {lowStock.length === 0 && (
                  <div className="flex items-center justify-center gap-1.5 py-6 text-xs font-semibold text-emerald-800 dark:text-emerald-400">
                    <Icon path={mdiCheckCircle} size={0.6} />
                    <span>
                      Todo el inventario tiene existencias suficientes
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
