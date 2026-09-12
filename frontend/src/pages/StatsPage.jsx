import { useState, useEffect, useMemo } from "react";
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
  mdiMedal,
  mdiTrophy,
  mdiMagnify,
  mdiClose,
  mdiAccountGroup,
  mdiAccountTie,
  mdiStore,
  mdiCartOutline,
  mdiCashMultiple,
  mdiCalendarSyncOutline,
  mdiInformationOutline,
  mdiEyeOutline,
  mdiStar,
  mdiCandycane,
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
import {
  apiBase as defaultApiBase,
  authFetch as defaultAuthFetch,
} from "../services/api.js";

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
  apiBase = defaultApiBase,
  authFetch = defaultAuthFetch,
  handleAuthFail,
}) {
  const [activeTab, setActiveTab] = useState("general");
  const [cashFlowFilter, setCashFlowFilter] = useState("quincena"); // "semana" | "quincena" | "mes" | "historico"

  // Estado para la pestaña de Clientes & Compradores
  const [clientPeriod, setClientPeriod] = useState("historico"); // "historico" | "mes" | "quincena" | "semana"
  const [clientSortCriteria, setClientSortCriteria] = useState("spent"); // "spent" | "tickets" | "units"
  const [clientsStats, setClientsStats] = useState(null);
  const [loadingClientsStats, setLoadingClientsStats] = useState(false);
  const [clientSearchQuery, setClientSearchQuery] = useState("");
  const [selectedClientDetail, setSelectedClientDetail] = useState(null);

  const sortedClientsList = useMemo(() => {
    if (!clientsStats?.clients) return [];
    const list = [...clientsStats.clients];
    list.sort((a, b) => {
      if (clientSortCriteria === "spent") {
        return (
          b.total_spent - a.total_spent || b.total_tickets - a.total_tickets
        );
      } else if (clientSortCriteria === "tickets") {
        return (
          b.total_tickets - a.total_tickets || b.total_spent - a.total_spent
        );
      } else if (clientSortCriteria === "units") {
        return (
          (b.total_units || 0) - (a.total_units || 0) ||
          b.total_spent - a.total_spent
        );
      }
      return 0;
    });
    return list.map((item, index) => {
      let medal = null;
      let medal_badge = `#${index + 1}`;
      if (item.total_tickets > 0) {
        if (index === 0) {
          medal = "gold";
          medal_badge = "🥇 1°";
        } else if (index === 1) {
          medal = "silver";
          medal_badge = "🥈 2°";
        } else if (index === 2) {
          medal = "bronze";
          medal_badge = "🥉 3°";
        }
      }
      return { ...item, rank: index + 1, medal, medal_badge };
    });
  }, [clientsStats, clientSortCriteria]);

  const podiumList = useMemo(() => {
    return sortedClientsList.slice(0, 3).filter((c) => c.total_tickets > 0);
  }, [sortedClientsList]);

  useEffect(() => {
    if (activeTab === "clientes") {
      loadClientsStatsData(clientPeriod);
    }
  }, [activeTab, clientPeriod]);

  async function loadClientsStatsData(period) {
    setLoadingClientsStats(true);
    try {
      const baseUrl = apiBase || defaultApiBase || "";
      const fetchFn = authFetch || defaultAuthFetch;
      const res = await fetchFn(
        `${baseUrl}/api/stats/clients?period=${period}`,
        {},
        handleAuthFail,
      );
      if (res && res.ok) {
        const data = await res.json();
        setClientsStats(data);
      } else {
        console.error("Error fetching client stats, status:", res?.status);
      }
    } catch (err) {
      console.error("Error loading client stats:", err);
    } finally {
      setLoadingClientsStats(false);
    }
  }

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
          <button
            onClick={() => setActiveTab("clientes")}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition whitespace-nowrap ${
              activeTab === "clientes"
                ? "bg-[#FFFFFF] text-amber-700 shadow-xs dark:bg-[#181B1E] dark:text-amber-400"
                : "text-[#78716C] hover:text-[#1C1917] dark:text-[#9CA3AF] dark:hover:text-[#F3F2EE]"
            }`}
          >
            Clientes
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

      {/* 6. PESTAÑA: Clientes & Ranking de Compradores */}
      {activeTab === "clientes" && (
        <div className="space-y-6">
          {/* Header de la Pestaña de Clientes y Filtro de Periodo */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-[#E5E2DA] bg-[#FFFFFF] p-4 shadow-xs dark:border-[#282C32] dark:bg-[#181B1E]">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black text-[#1C1917] dark:text-[#F3F2EE]">
                  Ranking de Compradores & Hábitos de Consumo
                </span>
                <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-bold text-amber-900 dark:bg-amber-400/15 dark:text-amber-300">
                  {clientsStats?.total_active_buyers || 0} activos
                </span>
              </div>
              <p className="text-xs text-[#78716C] dark:text-[#9CA3AF] mt-0.5">
                Top de clientes con más compras, ticket promedio, recurrencia y
                dulces favoritos.
              </p>
            </div>

            {/* Selector de Periodo */}
            <div className="flex items-center gap-1 rounded-xl border border-[#E5E2DA] bg-[#F7F6F2] p-1 text-xs font-semibold dark:border-[#282C32] dark:bg-[#111315] self-start sm:self-auto overflow-x-auto max-w-full">
              <button
                onClick={() => setClientPeriod("historico")}
                className={`rounded-lg px-3 py-1.5 transition whitespace-nowrap ${
                  clientPeriod === "historico"
                    ? "bg-amber-500/15 text-amber-950 dark:bg-amber-400/20 dark:text-amber-200 font-bold"
                    : "text-[#78716C] hover:text-[#1C1917] dark:text-[#9CA3AF] dark:hover:text-[#F3F2EE]"
                }`}
              >
                Histórico
              </button>
              <button
                onClick={() => setClientPeriod("mes")}
                className={`rounded-lg px-3 py-1.5 transition whitespace-nowrap ${
                  clientPeriod === "mes"
                    ? "bg-amber-500/15 text-amber-950 dark:bg-amber-400/20 dark:text-amber-200 font-bold"
                    : "text-[#78716C] hover:text-[#1C1917] dark:text-[#9CA3AF] dark:hover:text-[#F3F2EE]"
                }`}
              >
                Mes Actual
              </button>
              <button
                onClick={() => setClientPeriod("quincena")}
                className={`rounded-lg px-3 py-1.5 transition whitespace-nowrap ${
                  clientPeriod === "quincena"
                    ? "bg-amber-500/15 text-amber-950 dark:bg-amber-400/20 dark:text-amber-200 font-bold"
                    : "text-[#78716C] hover:text-[#1C1917] dark:text-[#9CA3AF] dark:hover:text-[#F3F2EE]"
                }`}
              >
                Quincena Actual
              </button>
              <button
                onClick={() => setClientPeriod("semana")}
                className={`rounded-lg px-3 py-1.5 transition whitespace-nowrap ${
                  clientPeriod === "semana"
                    ? "bg-amber-500/15 text-amber-950 dark:bg-amber-400/20 dark:text-amber-200 font-bold"
                    : "text-[#78716C] hover:text-[#1C1917] dark:text-[#9CA3AF] dark:hover:text-[#F3F2EE]"
                }`}
              >
                Semana Actual
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
              {/* Selector de Criterio de Ordenamiento */}
              <div className="flex items-center gap-1 rounded-xl border border-[#E5E2DA] bg-[#F7F6F2] p-1 text-xs font-semibold dark:border-[#282C32] dark:bg-[#111315]">
                <button
                  type="button"
                  onClick={() => setClientSortCriteria("spent")}
                  title="Ordenar por mayor dinero comprado ($)"
                  className={`rounded-lg px-2.5 py-1.5 transition whitespace-nowrap flex items-center gap-1 ${
                    clientSortCriteria === "spent"
                      ? "bg-amber-500/15 text-amber-950 dark:bg-amber-400/20 dark:text-amber-200 font-bold"
                      : "text-[#78716C] hover:text-[#1C1917] dark:text-[#9CA3AF] dark:hover:text-[#F3F2EE]"
                  }`}
                >
                  <Icon
                    path={mdiCurrencyUsd}
                    size={0.55}
                    className="text-emerald-600"
                  />
                  <span>Total Gastado</span>
                </button>
                <button
                  type="button"
                  onClick={() => setClientSortCriteria("tickets")}
                  title="Ordenar por mayor número de compras / visitas"
                  className={`rounded-lg px-2.5 py-1.5 transition whitespace-nowrap flex items-center gap-1 ${
                    clientSortCriteria === "tickets"
                      ? "bg-amber-500/15 text-amber-950 dark:bg-amber-400/20 dark:text-amber-200 font-bold"
                      : "text-[#78716C] hover:text-[#1C1917] dark:text-[#9CA3AF] dark:hover:text-[#F3F2EE]"
                  }`}
                >
                  <Icon
                    path={mdiShoppingOutline}
                    size={0.55}
                    className="text-amber-600"
                  />
                  <span>Más Visitas</span>
                </button>
                <button
                  type="button"
                  onClick={() => setClientSortCriteria("units")}
                  title="Ordenar por mayor cantidad de piezas compradas"
                  className={`rounded-lg px-2.5 py-1.5 transition whitespace-nowrap flex items-center gap-1 ${
                    clientSortCriteria === "units"
                      ? "bg-amber-500/15 text-amber-950 dark:bg-amber-400/20 dark:text-amber-200 font-bold"
                      : "text-[#78716C] hover:text-[#1C1917] dark:text-[#9CA3AF] dark:hover:text-[#F3F2EE]"
                  }`}
                >
                  <Icon
                    path={mdiCandycane}
                    size={0.55}
                    className="text-pink-600"
                  />
                  <span>Piezas</span>
                </button>
              </div>

              {/* Selector de Periodo */}
              <div className="flex items-center gap-1 rounded-xl border border-[#E5E2DA] bg-[#F7F6F2] p-1 text-xs font-semibold dark:border-[#282C32] dark:bg-[#111315] overflow-x-auto max-w-full">
                <button
                  type="button"
                  onClick={() => setClientPeriod("historico")}
                  className={`rounded-lg px-3 py-1.5 transition whitespace-nowrap ${
                    clientPeriod === "historico"
                      ? "bg-amber-500/15 text-amber-950 dark:bg-amber-400/20 dark:text-amber-200 font-bold"
                      : "text-[#78716C] hover:text-[#1C1917] dark:text-[#9CA3AF] dark:hover:text-[#F3F2EE]"
                  }`}
                >
                  Histórico
                </button>
                <button
                  type="button"
                  onClick={() => setClientPeriod("mes")}
                  className={`rounded-lg px-3 py-1.5 transition whitespace-nowrap ${
                    clientPeriod === "mes"
                      ? "bg-amber-500/15 text-amber-950 dark:bg-amber-400/20 dark:text-amber-200 font-bold"
                      : "text-[#78716C] hover:text-[#1C1917] dark:text-[#9CA3AF] dark:hover:text-[#F3F2EE]"
                  }`}
                >
                  Mes Actual
                </button>
                <button
                  type="button"
                  onClick={() => setClientPeriod("quincena")}
                  className={`rounded-lg px-3 py-1.5 transition whitespace-nowrap ${
                    clientPeriod === "quincena"
                      ? "bg-amber-500/15 text-amber-950 dark:bg-amber-400/20 dark:text-amber-200 font-bold"
                      : "text-[#78716C] hover:text-[#1C1917] dark:text-[#9CA3AF] dark:hover:text-[#F3F2EE]"
                  }`}
                >
                  Quincena Actual
                </button>
                <button
                  type="button"
                  onClick={() => setClientPeriod("semana")}
                  className={`rounded-lg px-3 py-1.5 transition whitespace-nowrap ${
                    clientPeriod === "semana"
                      ? "bg-amber-500/15 text-amber-950 dark:bg-amber-400/20 dark:text-amber-200 font-bold"
                      : "text-[#78716C] hover:text-[#1C1917] dark:text-[#9CA3AF] dark:hover:text-[#F3F2EE]"
                  }`}
                >
                  Semana Actual
                </button>
              </div>
            </div>
          </div>

          {loadingClientsStats ? (
            <div className="rounded-2xl border border-[#E5E2DA] bg-[#FFFFFF] p-12 text-center text-xs text-[#78716C] dark:border-[#282C32] dark:bg-[#181B1E] dark:text-[#9CA3AF]">
              Cargando ranking y estadísticas de clientes...
            </div>
          ) : (
            <>
              {/* Podio Destacado Top 3 */}
              {podiumList && podiumList.length > 0 && (
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <Icon
                      path={mdiTrophy}
                      size={0.75}
                      className="text-amber-500"
                    />
                    <span className="text-xs font-bold uppercase tracking-wider text-[#1C1917] dark:text-[#F3F2EE]">
                      Podio de Compradores Destacados
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {podiumList.map((c, idx) => {
                      const isGold = idx === 0;
                      const isSilver = idx === 1;
                      const isBronze = idx === 2;

                      return (
                        <div
                          key={c.id || `podium-${idx}`}
                          onClick={() => setSelectedClientDetail(c)}
                          className={`group relative flex flex-col justify-between rounded-2xl border p-4 sm:p-5 transition cursor-pointer hover:shadow-md ${
                            isGold
                              ? "border-amber-400/70 bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-transparent dark:border-amber-500/50 shadow-xs"
                              : isSilver
                                ? "border-slate-300 bg-gradient-to-b from-slate-100/60 via-slate-100/20 to-transparent dark:border-slate-700 dark:from-slate-800/40 shadow-xs"
                                : "border-amber-700/40 bg-gradient-to-b from-amber-800/10 via-amber-800/5 to-transparent dark:border-amber-700/30 shadow-xs"
                          }`}
                        >
                          <div>
                            {/* Medalla & Posición */}
                            <div className="flex items-center justify-between gap-2 mb-3">
                              <span
                                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black shadow-xs ${
                                  isGold
                                    ? "bg-amber-400/30 text-amber-950 dark:bg-amber-400/20 dark:text-amber-200 border border-amber-400/50"
                                    : isSilver
                                      ? "bg-slate-200 text-slate-800 dark:bg-slate-700/50 dark:text-slate-200 border border-slate-300 dark:border-slate-600"
                                      : "bg-amber-800/20 text-amber-900 dark:bg-amber-700/30 dark:text-amber-200 border border-amber-700/40"
                                }`}
                              >
                                <span>{c.medal_badge}</span>
                                <span className="font-semibold text-[11px]">
                                  {isGold
                                    ? "1° Comprador"
                                    : isSilver
                                      ? "2° Comprador"
                                      : "3° Comprador"}
                                </span>
                              </span>

                              {c.is_public ? (
                                <span className="rounded-md bg-stone-200 px-2 py-0.5 text-[10px] font-bold text-stone-700 dark:bg-stone-800 dark:text-stone-300">
                                  Mostrador
                                </span>
                              ) : (
                                <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-900 dark:bg-amber-400/15 dark:text-amber-300">
                                  Registrado
                                </span>
                              )}
                            </div>

                            {/* Nombre del cliente */}
                            <h4 className="text-base font-black text-[#1C1917] dark:text-[#F3F2EE] truncate">
                              {c.name}
                            </h4>
                            <p className="text-[11px] text-[#78716C] dark:text-[#9CA3AF] mb-3">
                              {c.phone
                                ? `Tel: ${c.phone}`
                                : c.is_public
                                  ? "Ventas sin cliente vinculado"
                                  : "Sin teléfono registrado"}
                            </p>

                            {/* Cifras clave */}
                            <div className="grid grid-cols-2 gap-2 rounded-xl bg-[#FFFFFF]/70 p-2.5 dark:bg-[#111315]/70 border border-[#E5E2DA]/80 dark:border-[#282C32] text-xs mb-3 font-tabular">
                              <div>
                                <span className="block text-[10px] text-[#78716C] dark:text-[#9CA3AF]">
                                  COMPRAS
                                </span>
                                <span className="text-base font-extrabold text-[#1C1917] dark:text-[#F3F2EE]">
                                  {c.total_tickets}
                                </span>
                              </div>
                              <div>
                                <span className="block text-[10px] text-[#78716C] dark:text-[#9CA3AF]">
                                  TOTAL GASTADO
                                </span>
                                <span className="text-base font-black text-amber-700 dark:text-amber-400">
                                  ${c.total_spent.toFixed(2)}
                                </span>
                              </div>
                            </div>

                            {/* Métricas secundarias */}
                            <div className="space-y-1.5 text-xs text-[#57534E] dark:text-[#9CA3AF]">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="flex items-center gap-1">
                                  <Icon
                                    path={mdiCandycane}
                                    size={0.55}
                                    className="text-amber-600"
                                  />
                                  Favorito:
                                </span>
                                <span className="font-bold text-[#1C1917] dark:text-[#F3F2EE] truncate max-w-[140px] text-right">
                                  {c.favorite_product
                                    ? `${c.favorite_product.name} (${c.favorite_product.quantity} pz)`
                                    : "—"}
                                </span>
                              </div>

                              <div className="flex items-center justify-between text-[11px]">
                                <span className="flex items-center gap-1">
                                  <Icon
                                    path={mdiCurrencyUsd}
                                    size={0.55}
                                    className="text-emerald-600"
                                  />
                                  Ticket Promedio:
                                </span>
                                <span className="font-bold font-tabular text-[#1C1917] dark:text-[#F3F2EE]">
                                  ${c.average_ticket.toFixed(2)}
                                </span>
                              </div>

                              <div className="flex items-center justify-between gap-2 text-[11px]">
                                <span className="flex items-center gap-1 shrink-0">
                                  <Icon
                                    path={mdiCartOutline}
                                    size={0.55}
                                    className="text-blue-600 shrink-0"
                                  />
                                  Cross-Selling:
                                </span>
                                <span className="font-bold font-tabular text-[#1C1917] dark:text-[#F3F2EE]">
                                  {c.cross_selling_percent}%
                                </span>
                                <span
                                  className="font-bold text-[#1C1917] dark:text-[#F3F2EE] truncate max-w-[150px] text-right"
                                  title={
                                    c.top_cross_selling_pair
                                      ? `${c.top_cross_selling_pair} (${c.cross_selling_pairs?.[0]?.count || c.cross_selling_count} veces juntos)`
                                      : "Sin compras combinadas"
                                  }
                                >
                                  {c.top_cross_selling_pair || "Sin combos"}
                                </span>
                              </div>

                              <div className="flex items-center justify-between text-[11px]">
                                <span className="flex items-center gap-1">
                                  <Icon
                                    path={mdiCalendarSyncOutline}
                                    size={0.55}
                                    className="text-purple-600"
                                  />
                                  Frecuencia:
                                </span>
                                <span className="font-bold font-tabular text-[#1C1917] dark:text-[#F3F2EE]">
                                  {c.avg_days_between_purchases !== null
                                    ? `Cada ${c.avg_days_between_purchases} días`
                                    : c.total_tickets === 1
                                      ? "1 sola compra"
                                      : "—"}
                                </span>
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedClientDetail(c);
                            }}
                            className="mt-4 flex items-center justify-center gap-1.5 w-full rounded-xl border border-[#E5E2DA] bg-[#FFFFFF] py-2 text-xs font-bold text-[#1C1917] hover:bg-[#F7F6F2] dark:border-[#282C32] dark:bg-[#181B1E] dark:text-[#F3F2EE] dark:hover:bg-[#202428] transition shadow-xs"
                          >
                            <Icon path={mdiEyeOutline} size={0.65} />
                            <span>Ver Detalle & Hábitos</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Buscador de Clientes & Público General */}
              <div className="rounded-2xl border border-[#E5E2DA] bg-[#FFFFFF] p-4 sm:p-5 shadow-xs dark:border-[#282C32] dark:bg-[#181B1E]">
                <div className="mb-3.5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <Icon
                      path={mdiAccountGroup}
                      size={0.75}
                      className="text-amber-600"
                    />
                    <span className="text-xs font-bold text-[#1C1917] dark:text-[#F3F2EE]">
                      Directorio de Compradores & Público General
                    </span>
                  </div>
                  <span className="text-[11px] text-[#78716C] dark:text-[#9CA3AF]">
                    Mostrando{" "}
                    {
                      (sortedClientsList || []).filter((c) => {
                        if (!clientSearchQuery.trim()) return true;
                        const q = clientSearchQuery.toLowerCase().trim();
                        return (
                          (c.name || "").toLowerCase().includes(q) ||
                          (c.phone && c.phone.includes(q)) ||
                          (c.is_public &&
                            "público general mostrador".includes(q)) ||
                          c.favorite_product?.name?.toLowerCase().includes(q)
                        );
                      }).length
                    }{" "}
                    de {sortedClientsList?.length || 0} compradores
                  </span>
                </div>

                {/* Input de búsqueda con botón "x" de limpieza */}
                <div className="relative mb-4">
                  <Icon
                    path={mdiMagnify}
                    size={0.7}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#78716C] dark:text-[#9CA3AF] pointer-events-none"
                  />
                  <input
                    className="w-full rounded-xl border border-[#E5E2DA] bg-[#F7F6F2] py-2.5 pl-10 pr-9 text-xs outline-none transition focus:bg-[#FFFFFF] dark:border-[#282C32] dark:bg-[#111315] dark:focus:bg-[#181B1E] text-[#1C1917] dark:text-[#F3F2EE]"
                    placeholder="Buscar por nombre de cliente, teléfono, producto favorito o 'Público General'..."
                    value={clientSearchQuery}
                    onChange={(e) => setClientSearchQuery(e.target.value)}
                  />
                  {clientSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setClientSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-[#78716C] hover:bg-[#E5E2DA]/60 hover:text-[#1C1917] dark:text-[#9CA3AF] dark:hover:bg-[#282C32] dark:hover:text-[#F3F2EE] transition"
                      title="Borrar búsqueda"
                    >
                      <Icon path={mdiClose} size={0.6} />
                    </button>
                  )}
                </div>

                {/* Tabla de Ranking y Comportamiento */}
                <div className="overflow-x-auto rounded-xl border border-[#E5E2DA] dark:border-[#282C32]">
                  <table className="w-full min-w-[780px] text-left text-xs">
                    <thead className="bg-[#F7F6F2] text-[#57534E] border-b border-[#E5E2DA] dark:bg-[#111315] dark:text-[#9CA3AF] dark:border-[#282C32]">
                      <tr>
                        <th className="px-3 py-2.5 text-center font-semibold w-16">
                          #
                        </th>
                        <th className="px-3 py-2.5 font-semibold">Comprador</th>
                        <th className="px-3 py-2.5 text-center font-semibold">
                          Compras
                        </th>
                        <th
                          onClick={() => setClientSortCriteria("tickets")}
                          className={`px-3 py-2.5 text-center font-semibold cursor-pointer select-none transition ${
                            clientSortCriteria === "tickets"
                              ? "text-amber-600 dark:text-amber-400 font-black"
                              : "hover:text-amber-600"
                          }`}
                          title="Clic para ordenar por número de compras / visitas"
                        >
                          Compras {clientSortCriteria === "tickets" && "▼"}
                        </th>
                        <th className="px-3 py-2.5 text-right font-semibold">
                          Total Gastado
                        </th>
                        <th
                          onClick={() => setClientSortCriteria("spent")}
                          className={`px-3 py-2.5 text-right font-semibold cursor-pointer select-none transition ${
                            clientSortCriteria === "spent"
                              ? "text-amber-600 dark:text-amber-400 font-black"
                              : "hover:text-amber-600"
                          }`}
                          title="Clic para ordenar por monto total gastado ($)"
                        >
                          Total Gastado {clientSortCriteria === "spent" && "▼"}
                        </th>
                        <th className="px-3 py-2.5 text-right font-semibold">
                          Ticket Prom.
                        </th>
                        <th className="px-3 py-2.5 font-semibold">
                          Producto Favorito
                        </th>
                        <th className="px-3 py-2.5 text-center font-semibold">
                          Cross-Selling
                        </th>
                        <th className="px-3 py-2.5 font-semibold">
                          Qué Compra Junto
                        </th>
                        <th className="px-3 py-2.5 font-semibold">
                          Día Fuerte
                        </th>
                        <th className="px-3 py-2.5 text-center font-semibold">
                          Frecuencia
                        </th>
                        <th className="px-3 py-2.5 text-right font-semibold">
                          Última Compra
                        </th>
                        <th className="px-2 py-2.5 text-center font-semibold"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E2DA] dark:divide-[#282C32] font-tabular">
                      {(sortedClientsList || [])
                        .filter((c) => {
                          if (!clientSearchQuery.trim()) return true;
                          const q = clientSearchQuery.toLowerCase().trim();
                          return (
                            (c.name || "").toLowerCase().includes(q) ||
                            (c.phone && c.phone.includes(q)) ||
                            (c.is_public &&
                              "público general mostrador".includes(q)) ||
                            c.favorite_product?.name?.toLowerCase().includes(q)
                          );
                        })
                        .map((c) => (
                          <tr
                            key={c.id || c.name}
                            onClick={() => setSelectedClientDetail(c)}
                            className="hover:bg-[#F7F6F2]/70 dark:hover:bg-[#202428]/60 transition-colors cursor-pointer"
                          >
                            {/* Posición / Medalla */}
                            <td className="px-3 py-2.5 text-center whitespace-nowrap">
                              <span
                                className={`inline-flex items-center justify-center rounded-lg px-2 py-0.5 text-xs font-black ${
                                  c.medal === "gold"
                                    ? "bg-amber-400/30 text-amber-950 dark:bg-amber-400/20 dark:text-amber-200"
                                    : c.medal === "silver"
                                      ? "bg-slate-200 text-slate-800 dark:bg-slate-700/50 dark:text-slate-200"
                                      : c.medal === "bronze"
                                        ? "bg-amber-800/20 text-amber-900 dark:bg-amber-700/30 dark:text-amber-200"
                                        : "bg-stone-100 text-stone-600 dark:bg-[#282C32] dark:text-stone-400"
                                }`}
                              >
                                {c.medal_badge}
                              </span>
                            </td>

                            {/* Comprador */}
                            <td className="px-3 py-2.5 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <div
                                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                                    c.is_public
                                      ? "bg-stone-200 text-stone-800 dark:bg-stone-800 dark:text-stone-200"
                                      : "bg-amber-500/15 text-amber-950 dark:bg-amber-400/20 dark:text-amber-200"
                                  }`}
                                >
                                  <Icon
                                    path={
                                      c.is_public ? mdiStore : mdiAccountTie
                                    }
                                    size={0.65}
                                  />
                                </div>
                                <div className="min-w-0">
                                  <div className="font-bold text-[#1C1917] dark:text-[#F3F2EE] truncate">
                                    {c.name}
                                  </div>
                                  <div className="text-[10px] text-[#78716C] dark:text-[#9CA3AF]">
                                    {c.phone
                                      ? `Tel: ${c.phone}`
                                      : c.is_public
                                        ? "Ventas Mostrador"
                                        : "Sin teléfono"}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Compras */}
                            <td className="px-3 py-2.5 text-center font-extrabold text-[#1C1917] dark:text-[#F3F2EE] whitespace-nowrap">
                              {c.total_tickets > 0 ? (
                                <span className="rounded-md bg-stone-100 px-2 py-0.5 dark:bg-[#282C32]">
                                  {c.total_tickets}
                                </span>
                              ) : (
                                <span className="text-[#78716C] dark:text-[#9CA3AF]">
                                  0
                                </span>
                              )}
                            </td>

                            {/* Total Gastado */}
                            <td className="px-3 py-2.5 text-right font-black text-amber-700 dark:text-amber-400 whitespace-nowrap">
                              ${c.total_spent.toFixed(2)}
                            </td>

                            {/* Ticket Promedio */}
                            <td className="px-3 py-2.5 text-right font-bold text-[#1C1917] dark:text-[#F3F2EE] whitespace-nowrap">
                              ${c.average_ticket.toFixed(2)}
                            </td>

                            {/* Producto Favorito */}
                            <td className="px-3 py-2.5 text-[#1C1917] dark:text-[#F3F2EE] whitespace-nowrap">
                              {c.favorite_product ? (
                                <div className="flex items-center gap-1.5">
                                  <span className="font-medium truncate max-w-[130px]">
                                    {c.favorite_product.name}
                                  </span>
                                  <span className="rounded bg-amber-500/10 px-1 py-0.2 text-[10px] font-bold text-amber-900 dark:bg-amber-400/15 dark:text-amber-300">
                                    {c.favorite_product.quantity} pz
                                  </span>
                                </div>
                              ) : (
                                <span className="text-[#78716C] dark:text-[#9CA3AF]">
                                  —
                                </span>
                              )}
                            </td>

                            {/* Porcentaje de Cross-Selling */}
                            <td className="px-3 py-2.5 text-center whitespace-nowrap font-bold">
                              {c.total_tickets > 0 ? (
                                <span
                                  className={`rounded px-1.5 py-0.5 text-[11px] ${
                                    c.cross_selling_percent >= 50
                                      ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
                                      : "bg-stone-100 text-stone-700 dark:bg-[#282C32] dark:text-stone-300"
                                  }`}
                                >
                                  {c.cross_selling_percent}%
                                </span>
                              ) : (
                                <span className="text-[#78716C] dark:text-[#9CA3AF]">
                                  —
                                </span>
                              )}
                            </td>


                            {/* Qué compra junto / Cross-Selling */}
                            <td className="px-3 py-2.5 whitespace-nowrap">
                              {c.top_cross_selling_pair ? (
                                <div className="flex flex-col">
                                  <span
                                    className="font-bold text-xs text-[#1C1917] dark:text-[#F3F2EE] truncate max-w-[210px]"
                                    title={`${c.top_cross_selling_pair} (${c.cross_selling_pairs?.[0]?.count || c.cross_selling_count} veces juntos)`}
                                  >
                                    {c.top_cross_selling_pair}
                                  </span>
                                  <span className="text-[10px] text-[#78716C] dark:text-[#9CA3AF]">
                                    {c.cross_selling_pairs?.[0]?.count
                                      ? `${c.cross_selling_pairs[0].count}x juntos`
                                      : `${c.cross_selling_percent}% mixto`}
                                  </span>
                                </div>
                              ) : c.total_tickets > 0 ? (
                                <span className="text-[11px] text-[#78716C] dark:text-[#9CA3AF]">
                                  Sin combos
                                </span>
                              ) : (
                                <span className="text-[#78716C] dark:text-[#9CA3AF]">
                                  —
                                </span>
                              )}
                            </td>

                            {/* Día Fuerte */}
                            <td className="px-3 py-2.5 text-[#57534E] dark:text-[#9CA3AF] whitespace-nowrap font-medium">
                              {c.top_day_name}
                            </td>

                            {/* Frecuencia */}
                            <td className="px-3 py-2.5 text-center text-[#57534E] dark:text-[#9CA3AF] whitespace-nowrap">
                              {c.avg_days_between_purchases !== null
                                ? `Cada ${c.avg_days_between_purchases}d`
                                : c.total_tickets === 1
                                  ? "1 compra"
                                  : "—"}
                            </td>

                            {/* Última Compra */}
                            <td className="px-3 py-2.5 text-right text-[#78716C] dark:text-[#9CA3AF] whitespace-nowrap text-[11px]">
                              {c.last_purchase
                                ? new Date(c.last_purchase).toLocaleDateString(
                                    "es-MX",
                                    {
                                      day: "2-digit",
                                      month: "short",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    },
                                  )
                                : "Sin compras"}
                            </td>

                            {/* Botón Detalle */}
                            <td className="px-2 py-2.5 text-center whitespace-nowrap">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedClientDetail(c);
                                }}
                                title="Ver desglose estadístico del cliente"
                                className="rounded-md p-1.5 text-amber-700 hover:bg-amber-100 dark:text-amber-400 dark:hover:bg-amber-950/50 transition"
                              >
                                <Icon path={mdiEyeOutline} size={0.65} />
                              </button>
                            </td>
                          </tr>
                        ))}

                      {(!sortedClientsList ||
                        sortedClientsList.length === 0) && (
                        <tr>
                          <td
                            colSpan={11}
                            className="py-12 text-center text-[#78716C] dark:text-[#9CA3AF]"
                          >
                            Sin compradores registrados en este periodo
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* Modal / Sub-pestaña de Detalle Estadístico por Cliente */}
          {selectedClientDetail && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1C1917]/60 p-4 backdrop-blur-xs">
              <div className="w-full max-w-2xl rounded-2xl border border-[#E5E2DA] bg-white p-5 sm:p-6 shadow-2xl dark:border-[#282C32] dark:bg-[#181B1E] flex flex-col max-h-[90vh]">
                {/* Header del Modal */}
                <div className="mb-4 flex items-center justify-between border-b border-[#E5E2DA] pb-3.5 dark:border-[#282C32]">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {selectedClientDetail.medal === "gold"
                        ? "🥇"
                        : selectedClientDetail.medal === "silver"
                          ? "🥈"
                          : selectedClientDetail.medal === "bronze"
                            ? "🥉"
                            : "📊"}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-black text-[#1C1917] dark:text-[#F3F2EE]">
                          {selectedClientDetail.name}
                        </h3>
                        <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-900 dark:bg-amber-400/15 dark:text-amber-300">
                          {selectedClientDetail.medal_badge}
                        </span>
                      </div>
                      <p className="text-xs text-[#78716C] dark:text-[#9CA3AF]">
                        {selectedClientDetail.phone
                          ? `Teléfono: ${selectedClientDetail.phone}`
                          : selectedClientDetail.is_public
                            ? "Ventas generales de mostrador"
                            : "Cliente registrado en sistema"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedClientDetail(null)}
                    className="rounded-lg p-1.5 text-[#78716C] hover:bg-[#F7F6F2] dark:text-[#9CA3AF] dark:hover:bg-[#202428] transition"
                  >
                    <Icon path={mdiClose} size={0.75} />
                  </button>
                </div>

                {/* 4 Tarjetas de Métricas Clave del Cliente */}
                <div className="mb-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4 font-tabular">
                  <div className="rounded-xl border border-[#E5E2DA] bg-[#F7F6F2] p-3 dark:border-[#282C32] dark:bg-[#111315]">
                    <span className="block text-[10px] font-bold text-[#78716C] dark:text-[#9CA3AF]">
                      TOTAL COMPRAS
                    </span>
                    <span className="text-lg font-black text-[#1C1917] dark:text-[#F3F2EE]">
                      {selectedClientDetail.total_tickets}
                    </span>
                    <span className="block text-[10px] text-amber-700 dark:text-amber-400 font-bold">
                      ${selectedClientDetail.total_spent.toFixed(2)} gastado
                    </span>
                  </div>

                  <div className="rounded-xl border border-[#E5E2DA] bg-[#F7F6F2] p-3 dark:border-[#282C32] dark:bg-[#111315]">
                    <span className="block text-[10px] font-bold text-[#78716C] dark:text-[#9CA3AF]">
                      TICKET PROMEDIO
                    </span>
                    <span className="text-lg font-black text-[#1C1917] dark:text-[#F3F2EE]">
                      ${selectedClientDetail.average_ticket.toFixed(2)}
                    </span>
                    <span className="block text-[10px] text-[#78716C] dark:text-[#9CA3AF]">
                      Por compra
                    </span>
                  </div>

                  <div className="rounded-xl border border-[#E5E2DA] bg-[#F7F6F2] p-3 dark:border-[#282C32] dark:bg-[#111315]">
                    <span className="block text-[10px] font-bold text-[#78716C] dark:text-[#9CA3AF]">
                      CROSS-SELLING
                    </span>
                    <span className="text-lg font-black text-[#1C1917] dark:text-[#F3F2EE]">
                      {selectedClientDetail.cross_selling_percent}%
                    </span>
                    <span
                      className="text-xs font-black text-[#1C1917] dark:text-[#F3F2EE] line-clamp-2 leading-tight mt-0.5"
                      title={
                        selectedClientDetail.top_cross_selling_pair ||
                        "Sin compras combinadas"
                      }
                    >
                      {selectedClientDetail.top_cross_selling_pair ||
                        "Sin combos"}
                    </span>
                    <span className="block text-[10px] text-[#78716C] dark:text-[#9CA3AF]">
                      {selectedClientDetail.cross_selling_count} carritos mixtos
                    </span>
                    <span className="block text-[10px] text-[#78716C] dark:text-[#9CA3AF] mt-1">
                      {selectedClientDetail.cross_selling_pairs?.length > 0
                        ? `${selectedClientDetail.cross_selling_pairs[0].count} veces juntos`
                        : "Solo compra individual"}
                    </span>
                  </div>

                  <div className="rounded-xl border border-[#E5E2DA] bg-[#F7F6F2] p-3 dark:border-[#282C32] dark:bg-[#111315]">
                    <span className="block text-[10px] font-bold text-[#78716C] dark:text-[#9CA3AF]">
                      FRECUENCIA
                    </span>
                    <span className="text-sm font-black text-[#1C1917] dark:text-[#F3F2EE]">
                      {selectedClientDetail.avg_days_between_purchases !== null
                        ? `Cada ${selectedClientDetail.avg_days_between_purchases}d`
                        : "1 sola compra"}
                    </span>
                    <span className="block text-[10px] text-[#78716C] dark:text-[#9CA3AF]">
                      Pico: {selectedClientDetail.top_day_name}
                    </span>
                  </div>
                </div>

                {/* Contenido Desglosado: Top Dulces y Métodos de Pago */}
                <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                  {/* Sección Dedicada: Qué Suele Comprar Junto (Cross-Selling) */}
                  <div className="rounded-xl border border-[#E5E2DA] bg-[#FFFFFF] p-4 dark:border-[#282C32] dark:bg-[#111315]">
                    <div className="mb-2.5 flex items-center justify-between text-xs font-bold text-[#1C1917] dark:text-[#F3F2EE]">
                      <span className="flex items-center gap-1.5">
                        <Icon
                          path={mdiCartOutline}
                          size={0.65}
                          className="text-blue-600"
                        />
                        Qué Suele Comprar Junto (Combos Cross-Selling)
                      </span>
                      <span className="text-[11px] font-normal text-[#78716C] dark:text-[#9CA3AF]">
                        {selectedClientDetail.cross_selling_pairs?.length || 0}{" "}
                        combos
                      </span>
                    </div>

                    {selectedClientDetail.cross_selling_pairs &&
                    selectedClientDetail.cross_selling_pairs.length > 0 ? (
                      <div className="space-y-2">
                        {selectedClientDetail.cross_selling_pairs.map(
                          (combo, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between gap-2 rounded-xl border border-[#E5E2DA]/80 bg-[#F7F6F2]/70 p-2.5 text-xs dark:border-[#282C32] dark:bg-[#181B1E]"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-black text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                                  {idx + 1}
                                </span>
                                <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                                  <span className="font-bold text-[#1C1917] dark:text-[#F3F2EE] truncate">
                                    {combo.item_a}
                                  </span>
                                  <span className="text-[11px] font-black text-amber-600 dark:text-amber-400 shrink-0">
                                    +
                                  </span>
                                  <span className="font-bold text-[#1C1917] dark:text-[#F3F2EE] truncate">
                                    {combo.item_b}
                                  </span>
                                </div>
                              </div>
                              <div className="shrink-0 font-tabular text-right">
                                <span className="rounded-lg bg-blue-50 px-2 py-1 text-[11px] font-black text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                                  {combo.count}{" "}
                                  {combo.count === 1 ? "vez" : "veces"} juntos
                                </span>
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    ) : (
                      <p className="py-4 text-center text-xs text-[#78716C] dark:text-[#9CA3AF]">
                        Este cliente suele comprar artículos individuales (no
                        suele combinar productos en el mismo ticket).
                      </p>
                    )}
                  </div>
                  {/* Top Dulces Comprados */}
                  <div className="rounded-xl border border-[#E5E2DA] bg-[#FFFFFF] p-4 dark:border-[#282C32] dark:bg-[#111315]">
                    <div className="mb-2.5 flex items-center justify-between text-xs font-bold text-[#1C1917] dark:text-[#F3F2EE]">
                      <span className="flex items-center gap-1.5">
                        <Icon
                          path={mdiCandycane}
                          size={0.65}
                          className="text-amber-600"
                        />
                        Top Productos Comprados por este Cliente
                      </span>
                      <span className="text-[11px] font-normal text-[#78716C] dark:text-[#9CA3AF]">
                        {selectedClientDetail.top_products?.length || 0}{" "}
                        variedad
                        {selectedClientDetail.top_products?.length !== 1
                          ? "es"
                          : ""}
                      </span>
                    </div>

                    {selectedClientDetail.top_products &&
                    selectedClientDetail.top_products.length > 0 ? (
                      <div className="space-y-2.5">
                        {selectedClientDetail.top_products.map((prod, idx) => {
                          const maxQty =
                            selectedClientDetail.top_products[0]?.quantity || 1;
                          const barWidth = Math.max(
                            8,
                            Math.round((prod.quantity / maxQty) * 100),
                          );

                          return (
                            <div key={idx} className="space-y-1 text-xs">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-[#1C1917] dark:text-[#F3F2EE]">
                                  {idx + 1}. {prod.name}
                                </span>
                                <div className="flex items-center gap-2 font-tabular">
                                  <span className="font-bold text-[#1C1917] dark:text-[#F3F2EE]">
                                    {prod.quantity} pzas
                                  </span>
                                  <span className="text-[#78716C] dark:text-[#9CA3AF]">
                                    (${prod.total_spent.toFixed(2)})
                                  </span>
                                </div>
                              </div>
                              <div className="h-1.5 w-full rounded-full bg-[#E5E2DA] dark:bg-[#282C32] overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-amber-600 transition-all duration-300"
                                  style={{ width: `${barWidth}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="py-4 text-center text-xs text-[#78716C] dark:text-[#9CA3AF]">
                        Sin registro de productos individuales para este cliente
                        en el periodo.
                      </p>
                    )}
                  </div>

                  {/* Métodos de Pago Preferidos */}
                  <div className="rounded-xl border border-[#E5E2DA] bg-[#FFFFFF] p-4 dark:border-[#282C32] dark:bg-[#111315]">
                    <span className="block text-xs font-bold text-[#1C1917] dark:text-[#F3F2EE] mb-2">
                      Métodos de Pago Utilizados
                    </span>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {Object.entries(
                        selectedClientDetail.payment_methods || {},
                      ).map(([pm, count]) => (
                        <div
                          key={pm}
                          className="flex items-center gap-1.5 rounded-lg border border-[#E5E2DA] bg-[#F7F6F2] px-3 py-1.5 dark:border-[#282C32] dark:bg-[#181B1E]"
                        >
                          <span className="font-semibold capitalize text-[#1C1917] dark:text-[#F3F2EE]">
                            {pm === "cash"
                              ? "Efectivo"
                              : pm === "transfer"
                                ? "Transferencia"
                                : pm === "card"
                                  ? "Tarjeta"
                                  : pm === "credit"
                                    ? "Crédito (Fiado)"
                                    : pm}
                          </span>
                          <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold text-amber-900 dark:bg-amber-400/15 dark:text-amber-300">
                            {count} transacci{count !== 1 ? "ones" : "ón"}
                          </span>
                        </div>
                      ))}
                      {Object.keys(selectedClientDetail.payment_methods || {})
                        .length === 0 && (
                        <p className="text-xs text-[#78716C] dark:text-[#9CA3AF]">
                          Sin métodos de pago registrados.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Compras Recientes */}
                  {selectedClientDetail.recent_purchases &&
                    selectedClientDetail.recent_purchases.length > 0 && (
                      <div className="rounded-xl border border-[#E5E2DA] bg-[#FFFFFF] p-4 dark:border-[#282C32] dark:bg-[#111315]">
                        <span className="block text-xs font-bold text-[#1C1917] dark:text-[#F3F2EE] mb-2">
                          Últimas Compras en este Periodo
                        </span>
                        <div className="space-y-1.5 divide-y divide-[#E5E2DA] dark:divide-[#282C32]">
                          {selectedClientDetail.recent_purchases.map(
                            (rec, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between pt-1.5 text-xs font-tabular"
                              >
                                <div>
                                  <div className="font-semibold text-[#1C1917] dark:text-[#F3F2EE]">
                                    {new Date(rec.date).toLocaleDateString(
                                      "es-MX",
                                      {
                                        day: "2-digit",
                                        month: "short",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      },
                                    )}
                                  </div>
                                  <div className="text-[11px] text-[#78716C] dark:text-[#9CA3AF]">
                                    {rec.items_preview ||
                                      `${rec.items_count} artículos`}
                                  </div>
                                </div>
                                <span className="font-black text-amber-700 dark:text-amber-400">
                                  ${Number(rec.amount).toFixed(2)}
                                </span>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    )}
                </div>

                {/* Footer del Modal */}
                <div className="mt-4 border-t border-[#E5E2DA] pt-3 dark:border-[#282C32]">
                  <button
                    type="button"
                    onClick={() => setSelectedClientDetail(null)}
                    className="w-full rounded-xl bg-[#F7F6F2] py-2 text-xs font-bold text-[#1C1917] hover:bg-[#E5E2DA] dark:bg-[#202428] dark:text-[#F3F2EE] dark:hover:bg-[#282C32] transition"
                  >
                    Cerrar Detalle de Cliente
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
