import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Icon from "@mdi/react";
import {
  mdiHistory,
  mdiRefresh,
  mdiDownload,
  mdiMagnify,
  mdiClose,
  mdiCheckCircle,
  mdiAlertCircle,
  mdiAlert,
  mdiInformation,
  mdiClockOutline,
  mdiFilterVariant,
  mdiEyeOutline,
  mdiContentCopy,
  mdiTrashCanOutline,
  mdiChevronLeft,
  mdiChevronRight,
  mdiAccountOutline,
  mdiServer,
  mdiTagOutline,
} from "@mdi/js";
import Swal from "sweetalert2";
import { apiBase, authFetch } from "../services/api.js";

const CATEGORIES = [
  { id: "ALL", label: "Todas" },
  { id: "SALES", label: "Ventas", color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20" },
  { id: "CLIENTS", label: "Clientes", color: "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20" },
  { id: "INVENTORY", label: "Inventario", color: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20" },
  { id: "PURCHASES", label: "Compras", color: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20" },
  { id: "REWARDS", label: "Recompensas", color: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20" },
  { id: "CONFIG", label: "Configuración", color: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20" },
  { id: "WHATSAPP", label: "WhatsApp", color: "bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-500/20" },
  { id: "AUTH", label: "Autenticación", color: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20" },
  { id: "SYSTEM", label: "Sistema", color: "bg-zinc-500/10 text-zinc-700 dark:text-zinc-400 border-zinc-500/20" },
];

const SEVERITIES = [
  { id: "ALL", label: "Todas" },
  { id: "INFO", label: "Info", color: "text-blue-600 dark:text-blue-400" },
  { id: "WARN", label: "Alerta", color: "text-amber-600 dark:text-amber-400" },
  { id: "ERROR", label: "Error", color: "text-rose-600 dark:text-rose-400" },
];

export default function LogsPage({ handleAuthFail }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalLogs, setTotalLogs] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [totalPages, setTotalPages] = useState(1);

  // Filtros
  const [category, setCategory] = useState("ALL");
  const [severity, setSeverity] = useState("ALL");
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("today"); // "today" | "7d" | "30d" | "all"

  // Métricas
  const [stats, setStats] = useState({
    totalToday: 0,
    errorsToday: 0,
    byCategory: [],
    bySeverity: [],
  });

  // Modal Inspector
  const [selectedLog, setSelectedLog] = useState(null);
  const [copied, setCopied] = useState(false);

  // Calcular fechas según dateFilter
  const dateRange = useMemo(() => {
    const now = new Date();
    if (dateFilter === "today") {
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return { startDate: todayStart.toISOString() };
    }
    if (dateFilter === "7d") {
      const past7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return { startDate: past7.toISOString() };
    }
    if (dateFilter === "30d") {
      const past30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      return { startDate: past30.toISOString() };
    }
    return {};
  }, [dateFilter]);

  // Cargar estadísticas
  const fetchStats = useCallback(async () => {
    try {
      const res = await authFetch(`${apiBase}/api/logs/stats`, {}, handleAuthFail);
      if (res && res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Error fetching log stats:", err);
    }
  }, [handleAuthFail]);

  // Cargar logs
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });

      if (category !== "ALL") queryParams.append("category", category);
      if (severity !== "ALL") queryParams.append("severity", severity);
      if (search.trim()) queryParams.append("search", search.trim());
      if (dateRange.startDate) queryParams.append("startDate", dateRange.startDate);

      const res = await authFetch(
        `${apiBase}/api/logs?${queryParams.toString()}`,
        {},
        handleAuthFail
      );

      if (res && res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        setTotalLogs(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error("Error fetching logs:", err);
    } finally {
      setLoading(false);
    }
  }, [page, limit, category, severity, search, dateRange, handleAuthFail]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Manejar exportación
  async function handleExport(format = "csv") {
    try {
      const queryParams = new URLSearchParams({ format });
      if (category !== "ALL") queryParams.append("category", category);
      if (severity !== "ALL") queryParams.append("severity", severity);
      if (dateRange.startDate) queryParams.append("startDate", dateRange.startDate);

      const res = await authFetch(
        `${apiBase}/api/logs/export?${queryParams.toString()}`,
        {},
        handleAuthFail
      );

      if (!res || !res.ok) {
        throw new Error("No se pudo exportar el archivo");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tiendita_logs_${new Date().toISOString().slice(0, 10)}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: `Archivo ${format.toUpperCase()} descargado exitosamente`,
        showConfirmButton: false,
        timer: 3000,
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error de exportación",
        text: err.message,
      });
    }
  }

  // Manejar limpieza/purga
  async function handleCleanup() {
    const { value: days } = await Swal.fire({
      title: "¿Depurar registros antiguos?",
      text: "Selecciona el límite de antigüedad para eliminar logs históricos y liberar espacio.",
      icon: "warning",
      input: "select",
      inputOptions: {
        30: "Más de 30 días",
        60: "Más de 60 días",
        90: "Más de 90 días (Recomendado)",
        180: "Más de 180 días",
      },
      inputValue: "90",
      showCancelButton: true,
      confirmButtonColor: "#d97706",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Depurar ahora",
      cancelButtonText: "Cancelar",
    });

    if (days) {
      try {
        const res = await authFetch(
          `${apiBase}/api/logs/cleanup`,
          {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ olderThanDays: parseInt(days, 10) }),
          },
          handleAuthFail
        );

        if (res && res.ok) {
          const data = await res.json();
          Swal.fire({
            icon: "success",
            title: "Depuración completada",
            text: data.message,
          });
          fetchStats();
          fetchLogs();
        } else {
          throw new Error("Error al ejecutar depuración");
        }
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: err.message,
        });
      }
    }
  }

  function copyJsonDetails(details) {
    if (!details) return;
    navigator.clipboard.writeText(JSON.stringify(details, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function formatTime(isoString) {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  function formatDate(isoString) {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400">
              <Icon path={mdiHistory} size={0.9} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-counter-ink dark:text-counter-dark-ink">
              Registro de Auditoría
            </h1>
          </div>
          <p className="mt-1 text-xs text-counter-muted dark:text-counter-dark-muted">
            Trazabilidad inmutable de todas las interacciones, mutaciones y eventos del sistema.
          </p>
        </div>

        {/* Acciones principales */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              fetchStats();
              fetchLogs();
            }}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-counter-border bg-counter-surface px-3 py-2 text-xs font-semibold text-counter-ink shadow-xs transition hover:bg-black/5 active:scale-95 dark:border-counter-dark-border dark:bg-counter-dark-surface dark:text-counter-dark-ink dark:hover:bg-white/5"
            title="Refrescar logs"
          >
            <Icon path={mdiRefresh} size={0.7} className={loading ? "animate-spin" : ""} />
            <span>Actualizar</span>
          </button>

          <button
            onClick={() => handleExport("csv")}
            className="inline-flex items-center gap-1.5 rounded-xl border border-counter-border bg-counter-surface px-3 py-2 text-xs font-semibold text-counter-ink shadow-xs transition hover:bg-black/5 active:scale-95 dark:border-counter-dark-border dark:bg-counter-dark-surface dark:text-counter-dark-ink dark:hover:bg-white/5"
            title="Exportar a CSV"
          >
            <Icon path={mdiDownload} size={0.7} />
            <span>CSV</span>
          </button>

          <button
            onClick={handleCleanup}
            className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-500/20 active:scale-95 dark:border-rose-400/20 dark:text-rose-400"
            title="Depurar logs antiguos"
          >
            <Icon path={mdiTrashCanOutline} size={0.7} />
            <span className="hidden sm:inline">Depurar</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-counter-border bg-counter-surface p-4 shadow-xs dark:border-counter-dark-border dark:bg-counter-dark-surface">
          <span className="text-[11px] font-semibold text-counter-muted dark:text-counter-dark-muted uppercase tracking-wider">
            Interacciones Hoy
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-black text-counter-ink dark:text-counter-dark-ink">
              {stats.totalToday}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-counter-border bg-counter-surface p-4 shadow-xs dark:border-counter-dark-border dark:bg-counter-dark-surface">
          <span className="text-[11px] font-semibold text-counter-muted dark:text-counter-dark-muted uppercase tracking-wider">
            Errores / Fallos Hoy
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={`font-mono text-2xl font-black ${
                stats.errorsToday > 0
                  ? "text-rose-600 dark:text-rose-400"
                  : "text-emerald-600 dark:text-emerald-400"
              }`}
            >
              {stats.errorsToday}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-counter-border bg-counter-surface p-4 shadow-xs dark:border-counter-dark-border dark:bg-counter-dark-surface">
          <span className="text-[11px] font-semibold text-counter-muted dark:text-counter-dark-muted uppercase tracking-wider">
            Categoría más activa
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="truncate text-base font-bold text-amber-600 dark:text-amber-400">
              {stats.byCategory[0]?.category || "—"}
            </span>
            {stats.byCategory[0] && (
              <span className="font-mono text-xs text-counter-muted dark:text-counter-dark-muted">
                ({stats.byCategory[0]?.count})
              </span>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-counter-border bg-counter-surface p-4 shadow-xs dark:border-counter-dark-border dark:bg-counter-dark-surface">
          <span className="text-[11px] font-semibold text-counter-muted dark:text-counter-dark-muted uppercase tracking-wider">
            Total en Consulta
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-black text-counter-ink dark:text-counter-dark-ink">
              {totalLogs}
            </span>
          </div>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="mb-6 space-y-3 rounded-2xl border border-counter-border bg-counter-surface p-4 shadow-xs dark:border-counter-dark-border dark:bg-counter-dark-surface">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Input Buscador */}
          <div className="relative flex-1">
            <Icon
              path={mdiMagnify}
              size={0.8}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-counter-muted dark:text-counter-dark-muted"
            />
            <input
              type="text"
              placeholder="Buscar por descripción, usuario, ID o entidad..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-counter-border bg-counter-canvas py-2 pl-9 pr-8 text-xs text-counter-ink placeholder:text-counter-muted dark:border-counter-dark-border dark:bg-counter-dark-canvas dark:text-counter-dark-ink"
            />
            {search && (
              <button
                onClick={() => {
                  setSearch("");
                  setPage(1);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-counter-muted hover:text-counter-ink dark:text-counter-dark-muted dark:hover:text-counter-dark-ink"
              >
                <Icon path={mdiClose} size={0.6} />
              </button>
            )}
          </div>

          {/* Selector de Rango de Fechas */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: "today", label: "Hoy" },
              { id: "7d", label: "7 días" },
              { id: "30d", label: "30 días" },
              { id: "all", label: "Todo" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => {
                  setDateFilter(f.id);
                  setPage(1);
                }}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                  dateFilter === f.id
                    ? "bg-amber-500/20 text-amber-900 dark:bg-amber-400/20 dark:text-amber-300 font-bold"
                    : "text-counter-muted hover:bg-black/5 dark:text-counter-dark-muted dark:hover:bg-white/5"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Chips de Categorías */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-counter-border/60 dark:border-counter-dark-border/60">
          <span className="text-[11px] font-bold text-counter-muted dark:text-counter-dark-muted mr-1 flex items-center gap-1">
            <Icon path={mdiFilterVariant} size={0.6} /> Categoría:
          </span>
          {CATEGORIES.map((cat) => {
            const active = category === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setCategory(cat.id);
                  setPage(1);
                }}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition border ${
                  active
                    ? "border-amber-500/40 bg-amber-500/20 text-amber-950 dark:border-amber-400/40 dark:bg-amber-400/20 dark:text-amber-300 shadow-xs font-bold"
                    : "border-counter-border/50 text-counter-muted hover:border-counter-border hover:text-counter-ink dark:border-counter-dark-border/50 dark:text-counter-dark-muted dark:hover:text-counter-dark-ink"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Chips de Severidad */}
        <div className="flex items-center gap-2 pt-2 border-t border-counter-border/60 dark:border-counter-dark-border/60">
          <span className="text-[11px] font-bold text-counter-muted dark:text-counter-dark-muted mr-1">
            Severidad:
          </span>
          {SEVERITIES.map((sev) => {
            const active = severity === sev.id;
            return (
              <button
                key={sev.id}
                onClick={() => {
                  setSeverity(sev.id);
                  setPage(1);
                }}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                  active
                    ? "bg-neutral-800 text-white dark:bg-neutral-200 dark:text-black font-bold"
                    : "text-counter-muted hover:bg-black/5 dark:text-counter-dark-muted dark:hover:bg-white/5"
                }`}
              >
                {sev.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tabla de Logs */}
      <div className="overflow-hidden rounded-2xl border border-counter-border bg-counter-surface shadow-xs dark:border-counter-dark-border dark:bg-counter-dark-surface">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 text-counter-muted dark:text-counter-dark-muted">
            <Icon path={mdiRefresh} size={1.5} className="animate-spin text-amber-600 mb-3" />
            <span className="text-xs font-medium">Cargando registros de auditoría...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-counter-muted dark:text-counter-dark-muted">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-counter-border bg-counter-canvas mb-3 dark:border-counter-dark-border dark:bg-counter-dark-canvas">
              <Icon path={mdiHistory} size={1.2} />
            </div>
            <p className="text-sm font-bold text-counter-ink dark:text-counter-dark-ink">
              No se encontraron interacciones
            </p>
            <p className="text-xs max-w-sm mt-1">
              Prueba cambiando los filtros de categoría, rango de fechas o el texto de búsqueda.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-counter-border bg-counter-canvas/50 text-[11px] font-bold text-counter-muted uppercase tracking-wider dark:border-counter-dark-border dark:bg-counter-dark-canvas/50 dark:text-counter-dark-muted">
                  <th className="px-4 py-3">Fecha y Hora</th>
                  <th className="px-4 py-3">Categoría</th>
                  <th className="px-4 py-3">Acción</th>
                  <th className="px-4 py-3">Actor</th>
                  <th className="px-4 py-3">Descripción</th>
                  <th className="px-4 py-3 text-center">Estado</th>
                  <th className="px-4 py-3 text-right">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-counter-border/60 dark:divide-counter-dark-border/60">
                {logs.map((log) => {
                  const catMeta = CATEGORIES.find((c) => c.id === log.category) || {};
                  const isError = log.status === "FAILED" || log.severity === "ERROR" || log.severity === "CRITICAL";

                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition"
                    >
                      {/* Fecha y Hora */}
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex items-center gap-1.5 font-mono text-[11px] text-counter-ink dark:text-counter-dark-ink font-semibold">
                          <Icon path={mdiClockOutline} size={0.55} className="text-counter-muted" />
                          <span>{formatTime(log.timestamp)}</span>
                        </div>
                        <span className="block text-[10px] text-counter-muted dark:text-counter-dark-muted">
                          {formatDate(log.timestamp)}
                        </span>
                      </td>

                      {/* Categoría */}
                      <td className="whitespace-nowrap px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold ${
                            catMeta.color || "bg-zinc-500/10 text-zinc-600 border-zinc-500/20"
                          }`}
                        >
                          {catMeta.label || log.category}
                        </span>
                      </td>

                      {/* Acción */}
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-[11px] text-counter-ink dark:text-counter-dark-ink font-medium">
                        {log.action_type}
                      </td>

                      {/* Actor */}
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Icon
                            path={log.actor_type === "SYSTEM" ? mdiServer : mdiAccountOutline}
                            size={0.6}
                            className="text-counter-muted"
                          />
                          <span className="font-semibold text-[11px] text-counter-ink dark:text-counter-dark-ink">
                            {log.actor_id || log.actor_type}
                          </span>
                        </div>
                        {log.ip_address && (
                          <span className="block font-mono text-[10px] text-counter-muted">
                            {log.ip_address}
                          </span>
                        )}
                      </td>

                      {/* Descripción */}
                      <td className="px-4 py-3 max-w-md">
                        <p className="text-counter-ink dark:text-counter-dark-ink line-clamp-2 leading-relaxed">
                          {log.description}
                        </p>
                      </td>

                      {/* Estado */}
                      <td className="whitespace-nowrap px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            isError
                              ? "bg-rose-500/10 text-rose-700 dark:text-rose-400"
                              : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                          }`}
                        >
                          <Icon path={isError ? mdiAlertCircle : mdiCheckCircle} size={0.5} />
                          {log.status}
                        </span>
                      </td>

                      {/* Botón Ver Detalle */}
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="inline-flex items-center gap-1 rounded-lg border border-counter-border bg-counter-canvas px-2.5 py-1 text-[11px] font-semibold text-counter-ink hover:bg-black/5 active:scale-95 dark:border-counter-dark-border dark:bg-counter-dark-canvas dark:text-counter-dark-ink dark:hover:bg-white/5"
                        >
                          <Icon path={mdiEyeOutline} size={0.55} />
                          <span>Ver</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-counter-border px-4 py-3 dark:border-counter-dark-border">
            <span className="text-xs text-counter-muted dark:text-counter-dark-muted font-mono">
              Página {page} de {totalPages} ({totalLogs} eventos)
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-counter-border text-counter-ink disabled:opacity-40 hover:bg-black/5 dark:border-counter-dark-border dark:text-counter-dark-ink dark:hover:bg-white/5"
              >
                <Icon path={mdiChevronLeft} size={0.8} />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || loading}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-counter-border text-counter-ink disabled:opacity-40 hover:bg-black/5 dark:border-counter-dark-border dark:text-counter-dark-ink dark:hover:bg-white/5"
              >
                <Icon path={mdiChevronRight} size={0.8} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Inspector de Detalles */}
      <AnimatePresence>
        {selectedLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-2xl overflow-hidden rounded-3xl border border-counter-border bg-counter-surface shadow-2xl dark:border-counter-dark-border dark:bg-counter-dark-surface"
            >
              {/* Header Modal */}
              <div className="flex items-center justify-between border-b border-counter-border px-6 py-4 dark:border-counter-dark-border">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400">
                    <Icon path={mdiEyeOutline} size={0.8} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-counter-ink dark:text-counter-dark-ink">
                      Inspección de Registro #{selectedLog.id}
                    </h3>
                    <span className="font-mono text-[11px] text-counter-muted dark:text-counter-dark-muted">
                      {new Date(selectedLog.timestamp).toLocaleString("es-MX")}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="rounded-lg p-1.5 text-counter-muted hover:bg-black/5 hover:text-counter-ink dark:text-counter-dark-muted dark:hover:bg-white/5 dark:hover:text-counter-dark-ink"
                >
                  <Icon path={mdiClose} size={0.8} />
                </button>
              </div>

              {/* Contenido Modal */}
              <div className="max-h-[75vh] overflow-y-auto p-6 space-y-4">
                {/* Resumen */}
                <div className="rounded-2xl border border-counter-border/80 bg-counter-canvas/50 p-4 dark:border-counter-dark-border/80 dark:bg-counter-dark-canvas/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-counter-muted dark:text-counter-dark-muted">
                      Descripción:
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        selectedLog.status === "FAILED"
                          ? "bg-rose-500/10 text-rose-700 dark:text-rose-400"
                          : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                      }`}
                    >
                      {selectedLog.status}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-counter-ink dark:text-counter-dark-ink leading-relaxed">
                    {selectedLog.description}
                  </p>
                </div>

                {/* Grid de Metadatos */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 text-xs">
                  <div className="rounded-xl border border-counter-border p-3 dark:border-counter-dark-border">
                    <span className="text-[10px] font-semibold text-counter-muted dark:text-counter-dark-muted uppercase">
                      Categoría
                    </span>
                    <span className="block font-bold text-counter-ink dark:text-counter-dark-ink mt-0.5">
                      {selectedLog.category}
                    </span>
                  </div>

                  <div className="rounded-xl border border-counter-border p-3 dark:border-counter-dark-border">
                    <span className="text-[10px] font-semibold text-counter-muted dark:text-counter-dark-muted uppercase">
                      Acción
                    </span>
                    <span className="block font-mono font-bold text-counter-ink dark:text-counter-dark-ink mt-0.5">
                      {selectedLog.action_type}
                    </span>
                  </div>

                  <div className="rounded-xl border border-counter-border p-3 dark:border-counter-dark-border">
                    <span className="text-[10px] font-semibold text-counter-muted dark:text-counter-dark-muted uppercase">
                      Severidad
                    </span>
                    <span className="block font-bold text-counter-ink dark:text-counter-dark-ink mt-0.5">
                      {selectedLog.severity}
                    </span>
                  </div>

                  <div className="rounded-xl border border-counter-border p-3 dark:border-counter-dark-border">
                    <span className="text-[10px] font-semibold text-counter-muted dark:text-counter-dark-muted uppercase">
                      Actor
                    </span>
                    <span className="block font-bold text-counter-ink dark:text-counter-dark-ink mt-0.5">
                      {selectedLog.actor_id || "—"} ({selectedLog.actor_type})
                    </span>
                  </div>

                  <div className="rounded-xl border border-counter-border p-3 dark:border-counter-dark-border">
                    <span className="text-[10px] font-semibold text-counter-muted dark:text-counter-dark-muted uppercase">
                      Dirección IP
                    </span>
                    <span className="block font-mono text-counter-ink dark:text-counter-dark-ink mt-0.5">
                      {selectedLog.ip_address || "—"}
                    </span>
                  </div>

                  <div className="rounded-xl border border-counter-border p-3 dark:border-counter-dark-border">
                    <span className="text-[10px] font-semibold text-counter-muted dark:text-counter-dark-muted uppercase">
                      Latencia
                    </span>
                    <span className="block font-mono text-counter-ink dark:text-counter-dark-ink mt-0.5">
                      {selectedLog.latency_ms != null ? `${selectedLog.latency_ms} ms` : "—"}
                    </span>
                  </div>
                </div>

                {/* User Agent */}
                {selectedLog.user_agent && (
                  <div className="rounded-xl border border-counter-border p-3 text-xs dark:border-counter-dark-border">
                    <span className="text-[10px] font-semibold text-counter-muted dark:text-counter-dark-muted uppercase">
                      Dispositivo / Navegador (User-Agent)
                    </span>
                    <span className="block font-mono text-[11px] text-counter-ink dark:text-counter-dark-ink mt-1 break-all">
                      {selectedLog.user_agent}
                    </span>
                  </div>
                )}

                {/* Detalles JSON */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-bold text-counter-ink dark:text-counter-dark-ink">
                      Detalles Técnicos (JSON)
                    </span>
                    {selectedLog.details && (
                      <button
                        onClick={() => copyJsonDetails(selectedLog.details)}
                        className="inline-flex items-center gap-1 rounded-lg border border-counter-border bg-counter-canvas px-2 py-1 text-[10px] font-semibold text-counter-ink hover:bg-black/5 dark:border-counter-dark-border dark:bg-counter-dark-canvas dark:text-counter-dark-ink"
                      >
                        <Icon path={mdiContentCopy} size={0.5} />
                        <span>{copied ? "¡Copiado!" : "Copiar JSON"}</span>
                      </button>
                    )}
                  </div>
                  <pre className="max-h-60 overflow-x-auto rounded-xl border border-counter-border bg-counter-canvas p-3 font-mono text-[11px] text-counter-ink dark:border-counter-dark-border dark:bg-black/40 dark:text-counter-dark-ink">
                    {selectedLog.details
                      ? JSON.stringify(selectedLog.details, null, 2)
                      : "Sin detalles adicionales registrados"}
                  </pre>
                </div>
              </div>

              {/* Footer Modal */}
              <div className="flex justify-end border-t border-counter-border px-6 py-3 dark:border-counter-dark-border">
                <button
                  onClick={() => setSelectedLog(null)}
                  className="rounded-xl bg-neutral-800 px-4 py-2 text-xs font-bold text-white hover:bg-neutral-900 dark:bg-neutral-200 dark:text-black dark:hover:bg-white"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
