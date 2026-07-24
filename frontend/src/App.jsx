import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import Swal from "sweetalert2";
import Icon from "@mdi/react";
import {
  mdiMenu,
  mdiWeatherNight,
  mdiWhiteBalanceSunny,
  mdiCandycane,
  mdiClipboardList,
  mdiAccountGroup,
  mdiPlusCircle,
  mdiCashMinus,
  mdiCashPlus,
  mdiCashRegister,
  mdiLogout,
  mdiPencil,
  mdiDelete,
  mdiEye,
  mdiLogin,
  mdiChartBar,
  mdiEyeOff,
  mdiChevronLeft,
  mdiChevronRight,
  mdiStore,
  mdiPackageVariantClosed,
  mdiClose,
  mdiGift,
  mdiStar,
  mdiWhatsapp,
} from "@mdi/js";
import brandLogo from "../assets/logo.jpg";

const apiBase =
  import.meta.env.VITE_API_URL !== undefined
    ? import.meta.env.VITE_API_URL
    : (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
      ? `http://${window.location.hostname}:4000`
      : "");


function SweetCombobox({ value, onChange, sweets }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const selected = sweets.find((s) => String(s.id) === String(value));
  const filtered = query.trim()
    ? sweets.filter((s) =>
        s.name.toLowerCase().includes(query.trim().toLowerCase()),
      )
    : sweets;

  function commitSelection(sweet) {
    if (!sweet) return;
    onChange(String(sweet.id));
    setOpen(false);
    setQuery("");
    setActiveIndex(0);
  }

  return (
    <div className="relative">
      <input
        className="w-full rounded-2xl border border-amber-100/70 px-3 py-2 text-sm outline-none dark:border-slate-700"
        placeholder="Buscar dulce..."
        value={
          open
            ? query
            : selected
              ? `${selected.name} ($${Number(selected.sale_price).toFixed(2)})`
              : ""
        }
        onFocus={() => {
          setOpen(true);
          setQuery("");
          setActiveIndex(0);
        }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onChange={(e) => {
          setQuery(e.target.value);
          setActiveIndex(0);
        }}
        onKeyDown={(e) => {
          if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
            setOpen(true);
            return;
          }
          if (!filtered.length) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIndex((prev) => Math.min(prev + 1, filtered.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIndex((prev) => Math.max(prev - 1, 0));
          } else if (e.key === "Enter") {
            if (open) {
              e.preventDefault();
              commitSelection(filtered[activeIndex]);
            }
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        autoComplete="off"
      />
      {open && (
        <div className="absolute z-50 mt-1 max-h-52 w-full overflow-y-auto rounded-2xl border border-amber-100/70 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
          {filtered.map((sweet, idx) => (
            <button
              key={sweet.id}
              type="button"
              className={`flex w-full items-center justify-between px-4 py-2 text-left text-sm hover:bg-amber-50 dark:hover:bg-slate-800 ${
                idx === activeIndex ? "bg-amber-100/70 dark:bg-slate-800" : ""
              }`}
              onMouseEnter={() => setActiveIndex(idx)}
              onMouseDown={() => commitSelection(sweet)}
            >
              <span>{sweet.name}</span>
              <span className="ml-2 shrink-0 text-xs text-slate-500">
                ${Number(sweet.sale_price).toFixed(2)}
              </span>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="px-4 py-2 text-sm text-slate-500">
              Sin resultados
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function toIsoDay(value) {
  const d = new Date(value);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getWeeklyRange(shift = 0) {
  const now = new Date();
  const mondayOffset = (now.getDay() + 6) % 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - mondayOffset - shift * 7);
  monday.setHours(0, 0, 0, 0);
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);
  return { from: toIsoDay(monday), to: toIsoDay(friday) };
}

function getMonthlyRange(shift = 0) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - shift, 1);
  const end = new Date(now.getFullYear(), now.getMonth() - shift + 1, 0);
  return { from: toIsoDay(start), to: toIsoDay(end) };
}

function formatRangeLabel(from, to) {
  const fromDate = new Date(from);
  const toDate = new Date(to);
  const sameMonth =
    fromDate.getMonth() === toDate.getMonth() &&
    fromDate.getFullYear() === toDate.getFullYear();
  const monthName = fromDate.toLocaleDateString("es-MX", { month: "long" });
  if (sameMonth) {
    return `${fromDate.getDate()}-${toDate.getDate()} ${monthName}`;
  }
  return `${fromDate.toLocaleDateString("es-MX", { day: "2-digit", month: "short" })} - ${toDate.toLocaleDateString("es-MX", { day: "2-digit", month: "short" })}`;
}

export default function App() {
  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "light",
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const [token, setToken] = useState(() => localStorage.getItem("token") || "");
  const [login, setLogin] = useState({ username: "", password: "" });
  const [prices, setPrices] = useState([]);
  const [pricesQuery, setPricesQuery] = useState("");
  const [sweets, setSweets] = useState([]);
  const [sweetsQuery, setSweetsQuery] = useState("");
  const [stockStats, setStockStats] = useState(null);
  const [clients, setClients] = useState([]);
  const [clientsQuery, setClientsQuery] = useState("");
  const [payImmediately, setPayImmediately] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [redeemQuery, setRedeemQuery] = useState("");
  const [settings, setSettings] = useState({
    reward_factor: 0.10,
    rewards_enabled: true,
    whatsapp_enabled: false,
    whatsapp_provider: "meta",
    whatsapp_gateway_url: "http://openwa:2785",
    whatsapp_api_key: "",
    whatsapp_session_id: "tiendita",
    whatsapp_default_country: "52",
    meta_whatsapp_token: "",
    meta_phone_number_id: "",
  });
  const [redemptionStats, setRedemptionStats] = useState({ redemptions: [], totals: { total_count: 0, total_points: 0 }, bySweet: [] });
  const [redemptionStatsLoading, setRedemptionStatsLoading] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [movements, setMovements] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [editingSweet, setEditingSweet] = useState(null);
  const [editingClient, setEditingClient] = useState(null);
  const [newSweet, setNewSweet] = useState({
    name: "",
    purchasePrice: "",
    salePrice: "",
    stock: "",
  });
  const [newClient, setNewClient] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [usePoints, setUsePoints] = useState(false);
  const [pointsToUse, setPointsToUse] = useState("");
  const [whatsappStatus, setWhatsappStatus] = useState("DISCONNECTED");
  const [whatsappQrCode, setWhatsappQrCode] = useState("");
  const [checkingWhatsapp, setCheckingWhatsapp] = useState(false);
  const [startingWhatsapp, setStartingWhatsapp] = useState(false);
  const [loggingOutWhatsapp, setLoggingOutWhatsapp] = useState(false);
  const [movementAmount, setMovementAmount] = useState("");
  const [movementItems, setMovementItems] = useState([
    { id: Date.now(), sweetId: "", quantity: 1 },
  ]);
  const [movementKind, setMovementKind] = useState("purchase");
  const [movementModalOpen, setMovementModalOpen] = useState(false);
  const [cashSaleModalOpen, setCashSaleModalOpen] = useState(false);
  const [cashSaleItems, setCashSaleItems] = useState([
    { sweetId: "", quantity: 1 },
  ]);
  const [movementDetailModalOpen, setMovementDetailModalOpen] = useState(false);
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [sweetModalOpen, setSweetModalOpen] = useState(false);
  const [mobileClientView, setMobileClientView] = useState("list");
  const [movementDetailItems, setMovementDetailItems] = useState([]);
  const [movementDetailTarget, setMovementDetailTarget] = useState(null);
  const [stats, setStats] = useState({
    dailyTotals: [],
    topSeller: null,
    lowSeller: null,
    lowStock: [],
    thresholds: { low: 10, critical: 3 },
  });
  const [statsLoading, setStatsLoading] = useState(false);
  const [showCosts, setShowCosts] = useState(false);
  const [showProfit, setShowProfit] = useState(false);
  const [periodMode, setPeriodMode] = useState("weekly");
  const [periodShift, setPeriodShift] = useState(0);
  const [weekStats, setWeekStats] = useState({ total: 0, profit: 0, days: [] });
  const [selectedDay, setSelectedDay] = useState("");
  const [selectedDayMoves, setSelectedDayMoves] = useState([]);
  const [selectedDayLoading, setSelectedDayLoading] = useState(false);

  const [purchasePlaces, setPurchasePlaces] = useState([]);
  const [packagePurchases, setPackagePurchases] = useState([]);
  const [newPlace, setNewPlace] = useState("");
  const [purchaseForm, setPurchaseForm] = useState({
    sweetId: "",
    productName: "",
    placeId: "",
    packageCost: "",
  });

  const [rewards, setRewards] = useState([]);
  const [newReward, setNewReward] = useState({ name: "", pointsCost: "", stock: "", sweetId: "" });
  const [editingReward, setEditingReward] = useState(null);
  const [redemptions, setRedemptions] = useState([]);
  const [redemptionsLoading, setRedemptionsLoading] = useState(false);
  const [clientSubTab, setClientSubTab] = useState("movements");

  const location = useLocation();
  const navigate = useNavigate();
  const movementsRequestRef = useRef(0);
  const authFailHandledRef = useRef(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);

    const themeColorMeta = document.querySelector("meta[name='theme-color']");
    if (themeColorMeta) {
      themeColorMeta.setAttribute(
        "content",
        theme === "dark" ? "#020617" : "#f8fafc",
      );
    }
  }, [theme]);

  useEffect(() => {
    if (token && location.pathname === "/login") {
      navigate("/", { replace: true });
    }
  }, [token, location.pathname, navigate]);

  useEffect(() => {
    authFailHandledRef.current = false;
  }, [token]);

  const authHeaders = useMemo(() => {
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
  }, [token]);

  const sweetById = useMemo(() => {
    return new Map(sweets.map((sweet) => [String(sweet.id), sweet]));
  }, [sweets]);

  const filteredPrices = useMemo(() => {
    const query = pricesQuery.trim().toLowerCase();
    if (!query) return prices;
    return prices.filter((item) =>
      String(item.name || "")
        .toLowerCase()
        .includes(query),
    );
  }, [prices, pricesQuery]);

  const sortedSweets = useMemo(() => {
    return [...sweets].sort((a, b) =>
      String(a.name || "").localeCompare(String(b.name || ""), "es", {
        sensitivity: "base",
      }),
    );
  }, [sweets]);

  const filteredSweets = useMemo(() => {
    const query = sweetsQuery.trim().toLowerCase();
    if (!query) return sortedSweets;
    return sortedSweets.filter((sweet) =>
      String(sweet.name || "")
        .toLowerCase()
        .includes(query),
    );
  }, [sortedSweets, sweetsQuery]);

  const filteredClients = useMemo(() => {
    const query = clientsQuery.trim().toLowerCase();
    if (!query) return clients;
    return clients.filter((client) =>
      String(client.name || "")
        .toLowerCase()
        .includes(query),
    );
  }, [clients, clientsQuery]);

  const computedTotal = useMemo(() => {
    return movementItems.reduce((sum, item) => {
      const sweet = sweetById.get(String(item.sweetId));
      const qty = Number(item.quantity) || 0;
      if (!sweet || qty <= 0) return sum;
      return sum + Number(sweet.sale_price) * qty;
    }, 0);
  }, [movementItems, sweetById]);

  const cashSaleTotal = useMemo(() => {
    return cashSaleItems.reduce((sum, item) => {
      const sweet = sweetById.get(String(item.sweetId));
      const qty = Number(item.quantity) || 0;
      if (!sweet || qty <= 0) return sum;
      return sum + Number(sweet.sale_price) * qty;
    }, 0);
  }, [cashSaleItems, sweetById]);

  const usesItems = movementItems.some((item) => item.sweetId);
  const cashSaleUsesItems = cashSaleItems.some((item) => item.sweetId);

  const movementPreviewAmount = useMemo(() => {
    if (movementKind === "purchase") {
      if (usesItems) return computedTotal;
      return Number(movementAmount) || 0;
    }
    return -(Math.abs(Number(movementAmount)) || 0);
  }, [movementKind, usesItems, computedTotal, movementAmount]);

  const projectedClientBalance = useMemo(() => {
    const current = Number(selectedClient?.total_debt || 0);
    const pointsUsedNum = usePoints ? (Number(pointsToUse) || 0) : 0;
    if (movementKind === "purchase") {
      if (payImmediately) {
        return current;
      }
      return current + movementPreviewAmount - pointsUsedNum;
    }
    return current + movementPreviewAmount;
  }, [selectedClient, movementPreviewAmount, movementKind, payImmediately, usePoints, pointsToUse]);

  const projectedPoints = useMemo(() => {
    const current = Number(selectedClient?.points || 0);
    if (!settings.rewards_enabled) return current;
    const pointsUsedNum = usePoints ? (Number(pointsToUse) || 0) : 0;
    if (movementKind === "purchase") {
      if (payImmediately) {
        const cashPortion = Math.max(0, movementPreviewAmount - pointsUsedNum);
        const pointsEarned = Number((cashPortion * settings.reward_factor).toFixed(2));
        return Math.max(0, current - pointsUsedNum + pointsEarned);
      }
      return Math.max(0, current - pointsUsedNum);
    } else if (movementKind === "pay") {
      const paymentAmount = Math.abs(movementPreviewAmount);
      const pointsEarned = Number((paymentAmount * settings.reward_factor).toFixed(2));
      return current + pointsEarned;
    }
    return current;
  }, [selectedClient, movementPreviewAmount, movementKind, payImmediately, settings, usePoints, pointsToUse]);

  const filteredSweetsForRedeem = useMemo(() => {
    const query = redeemQuery.trim().toLowerCase();
    if (!query) return sortedSweets;
    return sortedSweets.filter((sweet) =>
      String(sweet.name || "")
        .toLowerCase()
        .includes(query)
    );
  }, [sortedSweets, redeemQuery]);

  const hasActiveRewards = useMemo(() => {
    if (!settings.rewards_enabled) return false;
    return sortedSweets.some(
      (sweet) =>
        projectedPoints >= Number(sweet.sale_price) &&
        Number(sweet.stock || 0) > 0
    );
  }, [sortedSweets, projectedPoints, settings]);

  const debtStats = useMemo(() => {
    const pending = clients
      .filter((c) => Number(c.total_debt) > 0)
      .reduce((s, c) => s + Number(c.total_debt), 0);
    const favor = clients
      .filter((c) => Number(c.total_debt) < 0)
      .reduce((s, c) => s + Number(c.total_debt), 0);
    return { pending, favor: Math.abs(favor) };
  }, [clients]);

  const activeRange = useMemo(() => {
    return periodMode === "monthly"
      ? getMonthlyRange(periodShift)
      : getWeeklyRange(periodShift);
  }, [periodMode, periodShift]);

  const activeRangeLabel = useMemo(
    () => formatRangeLabel(activeRange.from, activeRange.to),
    [activeRange],
  );

  const chartData = useMemo(() => {
    const rows = [...(stats.dailyTotals || [])]
      .slice(0, 14)
      .reverse()
      .map((row) => ({
        dayLabel: new Date(row.day).toLocaleDateString("es-MX", {
          day: "2-digit",
          month: "2-digit",
        }),
        total: Number(row.total || 0),
      }));
    const max = Math.max(1, ...rows.map((r) => r.total));
    return { rows, max };
  }, [stats.dailyTotals]);

  async function handleAuthFailure() {
    if (authFailHandledRef.current) return;
    authFailHandledRef.current = true;

    localStorage.removeItem("token");
    setToken("");
    setSelectedClient(null);
    setMovements([]);
    navigate("/login", { replace: true });

    await Swal.fire({
      icon: "warning",
      title: "Sesion expirada",
      text: "Tu sesion ya no es valida. Vuelve a iniciar sesion.",
    });
  }

  async function authFetch(url, options = {}) {
    if (!token) return null;

    const response = await fetch(url, {
      ...options,
      headers: {
        ...authHeaders,
        ...options.headers,
      },
    });

    if (response.status === 401) {
      await handleAuthFailure();
      return null;
    }

    return response;
  }

  async function loadPublicPrices() {
    try {
      const response = await fetch(`${apiBase}/api/prices`);
      const data = await response.json();
      setPrices(data);
    } catch (error) {
      console.error("Error loading prices:", error);
    }
  }

  async function loadSweetStats() {
    if (!token) return;
    try {
      const response = await authFetch(`${apiBase}/api/sweets/stats`);
      if (!response) return;
      if (response.ok) {
        setStockStats(await response.json());
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  }

  async function loadSweets() {
    if (!token) return;
    try {
      const response = await authFetch(`${apiBase}/api/sweets`);
      if (!response) return;
      if (response.ok) {
        setSweets(await response.json());
      }
    } catch (error) {
      console.error("Error loading sweets:", error);
    }
  }

  async function loadClients() {
    if (!token) return;
    try {
      const response = await authFetch(`${apiBase}/api/clients`);
      if (!response) return [];
      if (response.ok) {
        const data = await response.json();
        setClients(data);
        return data;
      }
    } catch (error) {
      console.error("Error loading clients:", error);
    }
    return [];
  }

  async function loadStats() {
    if (!token) return;
    setStatsLoading(true);
    try {
      const response = await authFetch(`${apiBase}/api/stats`);
      if (!response) return;
      if (response.ok) {
        setStats(await response.json());
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setStatsLoading(false);
    }
  }

  async function loadWeekStats() {
    if (!token) return;
    try {
      const response = await authFetch(
        `${apiBase}/api/stats/weekly?from=${activeRange.from}&to=${activeRange.to}`,
      );
      if (!response) return;
      if (response.ok) {
        setWeekStats(await response.json());
      }
    } catch (error) {
      console.error("Error loading week stats:", error);
    }
  }

  async function loadSettings() {
    if (!token) return;
    try {
      const response = await authFetch(`${apiBase}/api/settings`);
      if (response && response.ok) {
        const data = await response.json();
        setSettings({
          reward_factor: parseFloat(data.reward_factor) || 0.10,
          rewards_enabled: data.rewards_enabled === "true" || data.rewards_enabled === true,
          whatsapp_enabled: data.whatsapp_enabled === "true" || data.whatsapp_enabled === true,
          whatsapp_provider: data.whatsapp_provider || "meta",
          whatsapp_gateway_url: data.whatsapp_gateway_url || "http://openwa:2785",
          whatsapp_api_key: data.whatsapp_api_key || "",
          whatsapp_session_id: data.whatsapp_session_id || "tiendita",
          whatsapp_default_country: data.whatsapp_default_country || "52",
          meta_whatsapp_token: data.meta_whatsapp_token || "",
          meta_phone_number_id: data.meta_phone_number_id || "",
        });
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    }
  }

  async function loadRedemptionStats() {
    if (!token) return;
    setRedemptionStatsLoading(true);
    try {
      const response = await authFetch(`${apiBase}/api/redemptions/stats`);
      if (response && response.ok) {
        const data = await response.json();
        setRedemptionStats(data);
      }
    } catch (error) {
      console.error("Error loading redemption stats:", error);
    } finally {
      setRedemptionStatsLoading(false);
    }
  }

  async function handleSaveSettings(event) {
    if (event) event.preventDefault();
    setSavingSettings(true);
    try {
      const payload = { ...settings };
      payload.rewards_enabled = settings.rewards_enabled ? "true" : "false";
      payload.whatsapp_enabled = settings.whatsapp_enabled ? "true" : "false";

      const response = await authFetch(`${apiBase}/api/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (response && response.ok) {
        await Swal.fire({
          icon: "success",
          title: "Configuración guardada",
          timer: 1500,
          showConfirmButton: false,
        });
        loadSettings();
      } else {
        const data = await response.json().catch(() => ({}));
        await Swal.fire({
          icon: "error",
          title: "Error al guardar",
          text: data.message || "Ocurrió un error",
        });
      }
    } catch (error) {
      console.error("Error saving settings:", error);
    } finally {
      setSavingSettings(false);
    }
  }

  async function loadWhatsappStatus() {
    if (!token) return;
    setCheckingWhatsapp(true);
    try {
      const response = await authFetch(`${apiBase}/api/whatsapp/status`);
      if (response && response.ok) {
        const data = await response.json();
        setWhatsappStatus(data.status);
        if (data.status === "QRCODE" || data.status === "qr_ready") {
          loadWhatsappQr();
        } else {
          setWhatsappQrCode("");
        }
      }
    } catch (error) {
      console.error("Error loading WhatsApp status:", error);
    } finally {
      setCheckingWhatsapp(false);
    }
  }

  async function loadWhatsappQr() {
    try {
      const response = await authFetch(`${apiBase}/api/whatsapp/session/qr`);
      if (response && response.ok) {
        const data = await response.json();
        setWhatsappQrCode(data.qrCode);
      }
    } catch (error) {
      console.error("Error loading WhatsApp QR:", error);
    }
  }

  async function handleStartWhatsapp() {
    setStartingWhatsapp(true);
    try {
      const response = await authFetch(`${apiBase}/api/whatsapp/session/start`, {
        method: "POST"
      });
      if (response && response.ok) {
        await Swal.fire({
          icon: "info",
          title: "Inicializando",
          text: "La sesión se está inicializando. Por favor espera a que se genere el código QR si no estás conectado.",
          timer: 2000,
          showConfirmButton: false
        });
        loadWhatsappStatus();
      } else {
        const data = await response.json().catch(() => ({}));
        await Swal.fire({
          icon: "error",
          title: "Error",
          text: data.message || "No se pudo iniciar la sesión"
        });
      }
    } catch (error) {
      console.error("Error starting WhatsApp session:", error);
    } finally {
      setStartingWhatsapp(false);
    }
  }

  async function handleLogoutWhatsapp() {
    const confirm = await Swal.fire({
      title: "¿Estás seguro?",
      text: "Se cerrará la sesión actual de WhatsApp en el Gateway.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, cerrar sesión",
      cancelButtonText: "Cancelar"
    });
    if (!confirm.isConfirmed) return;

    setLoggingOutWhatsapp(true);
    try {
      const response = await authFetch(`${apiBase}/api/whatsapp/session/logout`, {
        method: "POST"
      });
      if (response && response.ok) {
        await Swal.fire({
          icon: "success",
          title: "Sesión cerrada",
          timer: 1500,
          showConfirmButton: false
        });
        setWhatsappStatus("DISCONNECTED");
        setWhatsappQrCode("");
      } else {
        const data = await response.json().catch(() => ({}));
        await Swal.fire({
          icon: "error",
          title: "Error",
          text: data.message || "No se pudo cerrar la sesión"
        });
      }
    } catch (error) {
      console.error("Error logging out WhatsApp session:", error);
    } finally {
      setLoggingOutWhatsapp(false);
    }
  }

  async function loadDayMovements(day) {
    if (!token || !day) return;
    setSelectedDayLoading(true);
    try {
      const response = await authFetch(`${apiBase}/api/stats/day/${day}`);
      if (!response) return;
      if (response.ok) {
        setSelectedDayMoves(await response.json());
      }
    } catch (error) {
      console.error("Error loading day movements:", error);
    } finally {
      setSelectedDayLoading(false);
    }
  }

  async function loadPurchasePlaces() {
    if (!token) return;
    try {
      const response = await authFetch(`${apiBase}/api/purchase-places`);
      if (!response) return;
      if (response.ok) {
        setPurchasePlaces(await response.json());
      }
    } catch (error) {
      console.error("Error loading purchase places:", error);
    }
  }

  async function loadPackagePurchases() {
    if (!token) return;
    try {
      const response = await authFetch(`${apiBase}/api/package-purchases`);
      if (!response) return;
      if (response.ok) {
        setPackagePurchases(await response.json());
      }
    } catch (error) {
      console.error("Error loading package purchases:", error);
    }
  }

  async function loadRewards() {
    if (!token) return;
    try {
      const response = await authFetch(`${apiBase}/api/rewards`);
      if (!response) return;
      if (response.ok) {
        setRewards(await response.json());
      }
    } catch (error) {
      console.error("Error loading rewards:", error);
    }
  }

  async function loadClientRedemptions(clientId) {
    if (!token || !clientId) return;
    setRedemptionsLoading(true);
    try {
      const response = await authFetch(`${apiBase}/api/clients/${clientId}/redemptions`);
      if (!response) return;
      if (response.ok) {
        setRedemptions(await response.json());
      }
    } catch (error) {
      console.error("Error loading redemptions:", error);
    } finally {
      setRedemptionsLoading(false);
    }
  }

  async function handleAddReward(event) {
    event.preventDefault();
    if (!newReward.name || !newReward.pointsCost) return;
    const response = await authFetch(`${apiBase}/api/rewards`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newReward),
    });
    if (!response) return;
    if (response.ok) {
      setNewReward({ name: "", pointsCost: "", stock: "", sweetId: "" });
      await Swal.fire({
        icon: "success",
        title: "Recompensa creada",
        timer: 1500,
        showConfirmButton: false,
      });
      loadRewards();
    }
  }

  async function handleUpdateReward(event) {
    event.preventDefault();
    if (!editingReward.name || !editingReward.points_cost) return;
    const response = await authFetch(`${apiBase}/api/rewards/${editingReward.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editingReward.name,
        pointsCost: editingReward.points_cost,
        stock: editingReward.stock,
        sweetId: editingReward.sweet_id,
      }),
    });
    if (!response) return;
    if (response.ok) {
      setEditingReward(null);
      await Swal.fire({
        icon: "success",
        title: "Recompensa actualizada",
        timer: 1500,
        showConfirmButton: false,
      });
      loadRewards();
    }
  }

  async function handleDeleteReward(id) {
    const result = await Swal.fire({
      icon: "warning",
      title: "¿Eliminar recompensa?",
      text: "Esta acción no se puede deshacer",
      showCancelButton: true,
      confirmButtonText: "Eliminar",
      cancelButtonText: "Cancelar",
    });

    if (!result.isConfirmed) return;

    const response = await authFetch(`${apiBase}/api/rewards/${id}`, {
      method: "DELETE",
    });
    if (!response) return;
    if (response.ok) {
      await Swal.fire({
        icon: "success",
        title: "Recompensa eliminada",
        timer: 1500,
        showConfirmButton: false,
      });
      loadRewards();
    }
  }

  async function handleRedeemReward(sweetId) {
    if (!selectedClient) return;
    const client = selectedClient;

    const response = await authFetch(`${apiBase}/api/clients/${client.id}/redeem`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sweetId }),
    });
    if (!response) return;

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      await Swal.fire({
        icon: "error",
        title: "Error al canjear",
        text: data.message || "No se pudo realizar el canje",
      });
      return;
    }

    await Swal.fire({
      icon: "success",
      title: "Recompensa canjeada",
      timer: 1500,
      showConfirmButton: false,
    });

    const refreshedClients = await loadClients();
    const refreshedSelected = refreshedClients.find((c) => c.id === client.id);
    if (refreshedSelected) {
      setSelectedClient(refreshedSelected);
      loadClientRedemptions(client.id);
    }
    loadRewards();
    loadSweets();
    loadRedemptionStats();
  }

  async function handleAddPlace(event) {
    event.preventDefault();
    if (!newPlace.trim()) return;
    const response = await authFetch(`${apiBase}/api/purchase-places`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newPlace.trim() }),
    });
    if (!response) return;
    if (response.ok) {
      setNewPlace("");
      loadPurchasePlaces();
    }
  }

  async function handleAddPackagePurchase(event) {
    event.preventDefault();
    const selectedSweet = sweetById.get(String(purchaseForm.sweetId));
    const payload = {
      sweetId: purchaseForm.sweetId ? Number(purchaseForm.sweetId) : null,
      productName:
        selectedSweet?.name || String(purchaseForm.productName || "").trim(),
      placeId: Number(purchaseForm.placeId),
      packageCost: Number(purchaseForm.packageCost),
    };

    const response = await authFetch(`${apiBase}/api/package-purchases`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response) return;

    if (!response.ok) {
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo guardar la compra",
      });
      return;
    }

    setPurchaseForm({
      sweetId: "",
      productName: "",
      placeId: "",
      packageCost: "",
    });
    loadPackagePurchases();
  }

  function removeMovementItem(index) {
    setMovementItems((prev) => {
      if (prev.length === 1) return prev;
      return prev.filter((_, idx) => idx !== index);
    });
  }

  function removeCashSaleItem(index) {
    setCashSaleItems((prev) => {
      if (prev.length === 1) return prev;
      return prev.filter((_, idx) => idx !== index);
    });
  }

  useEffect(() => {
    loadPublicPrices();
  }, []);

  useEffect(() => {
    if (token) {
      loadSweets();
      loadClients();
      loadSweetStats();
      loadStats();
      loadPurchasePlaces();
      loadPackagePurchases();
      loadRewards();
      loadSettings();
      loadRedemptionStats();
      loadWhatsappStatus();
    }
  }, [token]);

  useEffect(() => {
    if (!token || location.pathname !== "/whatsapp") return;
    loadWhatsappStatus();
    const interval = setInterval(() => {
      loadWhatsappStatus();
    }, 5000);
    return () => clearInterval(interval);
  }, [token, location.pathname, whatsappStatus]);

  useEffect(() => {
    if (token) {
      loadSweetStats();
    }
  }, [sweets.length, token]);

  useEffect(() => {
    if (token) {
      loadWeekStats();
    }
  }, [token, periodMode, periodShift]);

  useEffect(() => {
    const day = stats.dailyTotals?.[0]?.day;
    if (day) {
      const normalized = toIsoDay(day);
      setSelectedDay(normalized);
      loadDayMovements(normalized);
    }
  }, [stats.dailyTotals]);

  async function handleLogin(event) {
    event.preventDefault();
    const response = await fetch(`${apiBase}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(login),
    });

    if (!response.ok) {
      await Swal.fire({
        icon: "error",
        title: "Login fallido",
        text: "Credenciales invalidas",
      });
      return;
    }

    const data = await response.json();
    localStorage.setItem("token", data.token);
    setToken(data.token);
    setLogin({ username: "", password: "" });
    navigate("/");
  }

  async function handleAddSweet(event) {
    event.preventDefault();
    const response = await authFetch(`${apiBase}/api/sweets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newSweet),
    });
    if (!response) return;

    if (!response.ok) {
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo guardar",
      });
      return;
    }

    setNewSweet({ name: "", purchasePrice: "", salePrice: "", stock: "" });
    setSweetModalOpen(false);
    await Swal.fire({
      icon: "success",
      title: "Guardado",
      timer: 1500,
      showConfirmButton: false,
    });
    loadSweets();
    loadPublicPrices();
    loadStats();
  }

  async function handleUpdateSweet(event) {
    event.preventDefault();
    const response = await authFetch(`${apiBase}/api/sweets/${editingSweet.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editingSweet.name,
        purchasePrice: editingSweet.purchase_price,
        salePrice: editingSweet.sale_price,
        stock: editingSweet.stock,
      }),
    });
    if (!response) return;

    if (!response.ok) {
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo actualizar",
      });
      return;
    }

    setEditingSweet(null);
    setSweetModalOpen(false);
    await Swal.fire({
      icon: "success",
      title: "Actualizado",
      timer: 1500,
      showConfirmButton: false,
    });
    loadSweets();
    loadPublicPrices();
    loadStats();
  }

  async function handleDeleteSweet(id) {
    const result = await Swal.fire({
      icon: "warning",
      title: "¿Eliminar dulce?",
      text: "Esta acción no se puede deshacer",
      showCancelButton: true,
      confirmButtonText: "Eliminar",
      cancelButtonText: "Cancelar",
    });

    if (!result.isConfirmed) return;

    const response = await authFetch(`${apiBase}/api/sweets/${id}`, {
      method: "DELETE",
    });
    if (!response) return;

    if (!response.ok) {
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo eliminar",
      });
      return;
    }

    await Swal.fire({
      icon: "success",
      title: "Eliminado",
      timer: 1500,
      showConfirmButton: false,
    });
    loadSweets();
    loadPublicPrices();
    loadStats();
  }

  async function handleAddClient(event) {
    event.preventDefault();
    const response = await authFetch(`${apiBase}/api/clients`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newClient, phone: newClientPhone }),
    });
    if (!response) return;

    if (!response.ok) {
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo crear",
      });
      return;
    }

    setNewClient("");
    setNewClientPhone("");
    setClientModalOpen(false);
    await Swal.fire({
      icon: "success",
      title: "Cliente creado",
      timer: 1500,
      showConfirmButton: false,
    });
    loadClients();
  }

  async function handleUpdateClient(event) {
    event.preventDefault();
    const editedClientId = editingClient.id;
    const response = await authFetch(`${apiBase}/api/clients/${editingClient.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editingClient.name,
        totalDebt: editingClient.total_debt,
        points: editingClient.points,
        phone: editingClient.phone,
      }),
    });
    if (!response) return;

    if (!response.ok) {
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo actualizar",
      });
      return;
    }

    setEditingClient(null);
    setClientModalOpen(false);
    await Swal.fire({
      icon: "success",
      title: "Actualizado",
      timer: 1500,
      showConfirmButton: false,
    });

    const refreshedClients = await loadClients();
    const refreshedEdited = refreshedClients.find(
      (c) => c.id === editedClientId,
    );
    if (refreshedEdited && selectedClient?.id === editedClientId) {
      setSelectedClient(refreshedEdited);
      await loadMovements(refreshedEdited);
    }

    loadStats();
  }

  async function handleDeleteClient(id) {
    const result = await Swal.fire({
      icon: "warning",
      title: "¿Eliminar cliente?",
      text: "Se eliminarán todos sus movimientos",
      showCancelButton: true,
      confirmButtonText: "Eliminar",
      cancelButtonText: "Cancelar",
    });

    if (!result.isConfirmed) return;

    const response = await authFetch(`${apiBase}/api/clients/${id}`, {
      method: "DELETE",
    });
    if (!response) return;

    if (!response.ok) {
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo eliminar",
      });
      return;
    }

    if (selectedClient?.id === id) {
      setSelectedClient(null);
      setMovements([]);
    }

    await Swal.fire({
      icon: "success",
      title: "Eliminado",
      timer: 1500,
      showConfirmButton: false,
    });
    loadClients();
  }

  async function loadMovements(client) {
    const clientId = Number(client?.id);
    if (!clientId) return;

    const requestId = movementsRequestRef.current + 1;
    movementsRequestRef.current = requestId;

    setSelectedClient(client);
    setMobileClientView("detail");
    setMovements([]);
    setClientSubTab("movements");
    loadClientRedemptions(clientId);
    try {
      const response = await authFetch(
        `${apiBase}/api/clients/${clientId}/movements`,
      );
      if (!response) return;
      if (response.ok) {
        const data = await response.json();
        if (movementsRequestRef.current === requestId) {
          setMovements(data);
        }
      }
    } catch (error) {
      console.error("Error loading movements:", error);
    }
  }

  async function handleSendWhatsApp(client) {
    if (!client.phone) {
      await Swal.fire({
        icon: "info",
        title: "Sin teléfono",
        text: "Registra un número de teléfono en la edición del cliente para poder enviar su cuenta por WhatsApp.",
      });
      return;
    }

    Swal.showLoading();
    try {
      const response = await authFetch(`${apiBase}/api/clients/${client.id}/whatsapp-statement`, {
        method: "POST"
      });
      if (response && response.ok) {
        Swal.close();
        await Swal.fire({
          icon: "success",
          title: "Enviado",
          text: "El estado de cuenta se envió automáticamente por WhatsApp.",
          timer: 2000,
          showConfirmButton: false
        });
        return;
      }
      throw new Error("API call failed");
    } catch (apiError) {
      console.warn("API send failed, falling back to manual redirect...", apiError);
      
      try {
        const response = await authFetch(`${apiBase}/api/clients/${client.id}/debt-breakdown`);
        if (!response || !response.ok) {
          throw new Error("No se pudo obtener el desglose");
        }
        
        const { client: clientData, movements } = await response.json();
        
        let message = `*Resumen de cuenta - Tiendita*\n`;
        const now = new Date();
        const dateStr = now.toLocaleString("es-MX", {
          timeZone: "America/Mexico_City",
          day: "2-digit",
          month: "2-digit",
          year: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true
        });
        message += `📅 _Fecha: ${dateStr}_\n\n`;
        message += `Hola *${clientData.name}*, te comparto el estado actual de tu cuenta:\n\n`;
        
        const purchases = movements.filter(m => m.amount > 0);
        if (purchases.length > 0) {
          message += `*Detalle de compras pendientes:*\n`;
          
          const purchasesByDate = {};
          purchases.forEach(m => {
            const mDate = new Date(m.created_at).toLocaleDateString("es-MX", {
              day: "2-digit",
              month: "2-digit",
              year: "2-digit"
            });
            if (!purchasesByDate[mDate]) {
              purchasesByDate[mDate] = [];
            }
            purchasesByDate[mDate].push(m);
          });

          const dateKeys = Object.keys(purchasesByDate);
          dateKeys.forEach((mDate, idx) => {
            if (idx > 0) {
              message += `\n`; // Add an empty line between dates
            }

            const list = purchasesByDate[mDate];
            let totalAmount = 0;
            let totalOwedAmount = 0;
            const mergedItemsMap = {};

            list.forEach(m => {
              totalAmount += Number(m.amount);
              totalOwedAmount += Number(m.owed_amount !== undefined ? m.owed_amount : m.amount);
              
              if (m.items && m.items.length > 0) {
                m.items.forEach(item => {
                  if (!mergedItemsMap[item.name]) {
                    mergedItemsMap[item.name] = {
                      quantity: 0,
                      unit_price: Number(item.unit_price),
                      name: item.name
                    };
                  }
                  mergedItemsMap[item.name].quantity += item.quantity;
                });
              }
            });

            const mergedItems = Object.values(mergedItemsMap);
            const partialStr = (totalOwedAmount < totalAmount)
              ? ` (pendiente: $${totalOwedAmount.toFixed(2)})`
              : "";
            
            const concept = list.length === 1 ? list[0].concept : "Compra";

            message += `• *${mDate}*:\n`;
            message += `  - ${concept} - $${totalAmount.toFixed(2)}${partialStr}:\n`;
            
            if (mergedItems.length > 0) {
              mergedItems.forEach(item => {
                const lineTotal = item.quantity * item.unit_price;
                message += `    • ${item.quantity}x ${item.name} ($${item.unit_price.toFixed(2)} c/u) - $${lineTotal.toFixed(2)}\n`;
              });
            }
          });
        } else {
          message += `No tienes compras pendientes. ¡Tu saldo está al día!\n`;
        }
        
        message += `\n───────────────────\n`;
        
        let debtLabel = "*Saldo Total:*";
        let debtValue = Number(clientData.total_debt);
        if (debtValue < 0) {
          debtLabel = "*Saldo a favor:*";
          debtValue = Math.abs(debtValue);
        }
        message += `💰 ${debtLabel} *$${debtValue.toFixed(2)}*\n`;
        message += `⭐ *Puntos Disponibles:* ${Number(clientData.points || 0).toFixed(1)} pts\n\n`;
        message += `¡Gracias por tu preferencia! 🙌`;

        let cleanPhone = client.phone.replace(/\D/g, "");
        if (cleanPhone.length === 10) {
          cleanPhone = `52${cleanPhone}`;
        }
        const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
        Swal.close();
        window.open(whatsappUrl, "_blank");
      } catch (fallbackError) {
        console.error("Error in WhatsApp manual fallback:", fallbackError);
        Swal.close();
        await Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudo generar el mensaje de WhatsApp. Inténtalo de nuevo.",
        });
      }
    }
  }

  async function handleSendAllWhatsAppStatements() {
    const confirm = await Swal.fire({
      title: "¿Enviar todas las cuentas?",
      text: "Se iniciará el proceso para enviar el estado de cuenta por WhatsApp a TODOS los clientes que tengan saldo deudor (> 0) y un número telefónico registrado.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, enviar a todos",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#059669",
      cancelButtonColor: "#6b7280"
    });
    if (!confirm.isConfirmed) return;

    Swal.showLoading();
    try {
      const response = await authFetch(`${apiBase}/api/whatsapp/send-all-statements`, {
        method: "POST"
      });
      if (response && response.ok) {
        const data = await response.json();
        Swal.close();
        await Swal.fire({
          icon: "success",
          title: "Proceso Iniciado",
          text: data.message || "Se inició el envío masivo en segundo plano.",
          confirmButtonColor: "#059669"
        });
      } else {
        const data = await response.json().catch(() => ({}));
        Swal.close();
        await Swal.fire({
          icon: "info",
          title: "Sin envíos",
          text: data.message || "No se encontraron clientes con adeudos o con teléfonos registrados.",
          confirmButtonColor: "#3b82f6"
        });
      }
    } catch (error) {
      console.error("Error in bulk WhatsApp sending:", error);
      Swal.close();
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: "Ocurrió un error al intentar iniciar el envío múltiple.",
        confirmButtonColor: "#ef4444"
      });
    }
  }

  function resetMovementModal() {
    setMovementAmount("");
    setMovementItems([{ id: Date.now(), sweetId: "", quantity: 1 }]);
    setPayImmediately(false);
    setDropdownOpen(false);
    setMovementModalOpen(false);
    setUsePoints(false);
    setPointsToUse("");
  }

  function openMovementModal(kind) {
    if (!selectedClient) return;
    setMovementKind(kind);
    setPayImmediately(false);
    setDropdownOpen(false);
    setMovementModalOpen(true);
  }

  function updateMovementItem(index, field, value) {
    setMovementItems((prev) =>
      prev.map((item, idx) =>
        idx === index ? { ...item, [field]: value } : item,
      ),
    );
  }

  function addMovementItem() {
    setMovementItems((prev) => [
      ...prev,
      { id: Date.now(), sweetId: "", quantity: 1 },
    ]);
  }

  async function handleMovementSubmit(event) {
    event.preventDefault();
    if (!selectedClient) return;

    const targetClient = selectedClient;

    const endpoint = movementKind === "pay" ? "pay" : "purchase";
    const payload = {
      amount: Number(movementAmount),
      concept: movementKind === "pay" ? "Pago" : "Compra",
    };

    if (movementKind === "purchase") {
      payload.payImmediately = payImmediately;
      if (usePoints) {
        payload.pointsUsed = Number(pointsToUse) || 0;
      }
      if (usesItems) {
        payload.items = movementItems
          .filter((item) => item.sweetId && item.quantity)
          .map((item) => ({
            sweetId: Number(item.sweetId),
            quantity: Number(item.quantity),
          }));
        payload.amount = computedTotal;
      }
    }

    const response = await authFetch(
      `${apiBase}/api/clients/${targetClient.id}/${endpoint}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    if (!response) return;

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: data.message || "Movimiento no registrado",
      });
      return;
    }

    await Swal.fire({
      icon: "success",
      title: "Movimiento registrado",
      timer: 1500,
      showConfirmButton: false,
    });
    const hasRewardsBefore = hasActiveRewards;
    resetMovementModal();
    const refreshedClients = await loadClients();
    const refreshedSelected = refreshedClients.find(
      (c) => c.id === targetClient.id,
    );
    if (refreshedSelected && selectedClient?.id === targetClient.id) {
      setSelectedClient(refreshedSelected);
      await loadMovements(refreshedSelected);
      if (hasRewardsBefore && movementKind === "purchase") {
        setClientSubTab("redeem");
      }
    } else if (selectedClient?.id === targetClient.id) {
      await loadMovements(targetClient);
    }
    loadSweets();
    loadStats();
  }

  async function handleDeleteMovement(move) {
    if (!selectedClient) return;

    const confirmResult = await Swal.fire({
      icon: "warning",
      title: "¿Eliminar movimiento?",
      text: "Se recalculara el saldo del cliente",
      showCancelButton: true,
      confirmButtonText: "Continuar",
      cancelButtonText: "Cancelar",
    });

    if (!confirmResult.isConfirmed) return;

    const passwordResult = await Swal.fire({
      icon: "question",
      title: "Confirma con contraseña",
      input: "password",
      inputPlaceholder: "Contraseña de administrador",
      showCancelButton: true,
      confirmButtonText: "Eliminar",
      cancelButtonText: "Cancelar",
      inputAttributes: {
        autocapitalize: "off",
        autocorrect: "off",
      },
      preConfirm: (value) => {
        if (!value) {
          Swal.showValidationMessage("Ingresa la contraseña");
        }
        return value;
      },
    });

    if (!passwordResult.isConfirmed) return;

    const response = await authFetch(
      `${apiBase}/api/clients/${selectedClient.id}/movements/${move.id}`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: passwordResult.value }),
      },
    );
    if (!response) return;

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: data.message || "No se pudo eliminar el movimiento",
      });
      return;
    }

    await Swal.fire({
      icon: "success",
      title: "Movimiento eliminado",
      timer: 1300,
      showConfirmButton: false,
    });

    const refreshedClients = await loadClients();
    const refreshedSelected = refreshedClients.find(
      (c) => c.id === selectedClient.id,
    );
    if (refreshedSelected) {
      setSelectedClient(refreshedSelected);
      await loadMovements(refreshedSelected);
    }
    loadSweets();
    loadStats();
  }

  function resetCashSaleModal() {
    setCashSaleItems([{ sweetId: "", quantity: 1 }]);
    setCashSaleModalOpen(false);
  }

  function openCashSaleModal() {
    setCashSaleItems([{ sweetId: "", quantity: 1 }]);
    setCashSaleModalOpen(true);
  }

  function updateCashSaleItem(index, field, value) {
    setCashSaleItems((prev) =>
      prev.map((item, idx) =>
        idx === index ? { ...item, [field]: value } : item,
      ),
    );
  }

  function addCashSaleItem() {
    setCashSaleItems((prev) => [...prev, { sweetId: "", quantity: 1 }]);
  }

  async function handleCashSaleSubmit(event) {
    event.preventDefault();

    const payloadItems = cashSaleItems
      .filter((item) => item.sweetId && item.quantity)
      .map((item) => ({
        sweetId: Number(item.sweetId),
        quantity: Number(item.quantity),
      }));

    if (payloadItems.length === 0) {
      await Swal.fire({
        icon: "warning",
        title: "Selecciona productos",
        text: "Agrega al menos un dulce para la venta",
      });
      return;
    }

    const response = await authFetch(`${apiBase}/api/sales`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: payloadItems }),
    });
    if (!response) return;

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: data.message || "No se pudo registrar",
      });
      return;
    }

    await Swal.fire({
      icon: "success",
      title: "Venta registrada",
      timer: 1500,
      showConfirmButton: false,
    });

    resetCashSaleModal();
    loadSweets();
    loadPublicPrices();
    loadStats();
  }

  async function openMovementDetail(move) {
    setMovementDetailTarget(move);
    setMovementDetailItems([]);
    setMovementDetailModalOpen(true);

    try {
      const response = await authFetch(
        `${apiBase}/api/movements/${move.id}/items`,
      );
      if (!response) return;
      if (response.ok) {
        setMovementDetailItems(await response.json());
      }
    } catch (error) {
      console.error("Error loading movement detail:", error);
    }
  }

  function closeMovementDetail() {
    setMovementDetailModalOpen(false);
    setMovementDetailItems([]);
    setMovementDetailTarget(null);
  }

  function handleLogout() {
    localStorage.removeItem("token");
    setToken("");
    navigate("/login");
  }

  function navigateTo(path) {
    if (!token && path !== "/login") {
      Swal.fire({
        icon: "warning",
        title: "Acceso denegado",
        text: "Debes iniciar sesión primero",
      });
      return;
    }
    navigate(path);
    setMenuOpen(false);
  }

  const pricesPanel = (
    <div className="rounded-3xl border border-amber-100/70 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
      <div className="mb-4 flex items-center gap-2 text-lg font-semibold">
        <Icon path={mdiClipboardList} size={1} />
        Precios Publicos
      </div>
      <div className="mb-4">
        <input
          className="w-full rounded-2xl border border-amber-100/70 bg-transparent px-4 py-2 text-sm outline-none dark:border-slate-700"
          placeholder="Buscar dulce"
          value={pricesQuery}
          onChange={(event) => setPricesQuery(event.target.value)}
        />
      </div>
      <div className="overflow-hidden rounded-2xl border border-amber-100/70 dark:border-slate-800">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-amber-50 text-amber-900 dark:bg-slate-800 dark:text-amber-200">
            <tr>
              <th className="px-4 py-2">Nombre</th>
              <th className="px-4 py-2">Precio</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-amber-100/70 dark:divide-slate-800">
            {filteredPrices.map((item, idx) => (
              <tr
                key={`${item.name}-${idx}`}
                className="hover:bg-amber-50/60 dark:hover:bg-slate-800/70"
              >
                <td className="px-4 py-2">{item.name}</td>
                <td className="px-4 py-2">${Number(item.price).toFixed(2)}</td>
              </tr>
            ))}
            {filteredPrices.length === 0 && (
              <tr>
                <td
                  className="px-4 py-4 text-center text-slate-500"
                  colSpan={2}
                >
                  Sin resultados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const whatsappPanel = (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Settings Card */}
        <div className="lg:col-span-2 rounded-3xl border border-amber-100/70 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 flex flex-col justify-between">
          <div>
            <div className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <Icon path={mdiWhatsapp} size={1} className="text-emerald-500" />
              Configuración de WhatsApp API Gateway
            </div>
            
            <form onSubmit={handleSaveSettings} className="grid gap-4 sm:grid-cols-2">
              <label className="sm:col-span-2 flex items-center gap-3 rounded-2xl border border-amber-100/70 bg-white/50 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-800/50 cursor-pointer">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-emerald-300 text-emerald-500 focus:ring-emerald-400 dark:border-slate-600 dark:bg-slate-700"
                  checked={settings.whatsapp_enabled}
                  onChange={(e) => setSettings({ ...settings, whatsapp_enabled: e.target.checked })}
                />
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Habilitar envíos automáticos de tickets</span>
              </label>

              <label className="sm:col-span-2 grid gap-1 text-xs uppercase text-slate-500 font-semibold">
                Proveedor de WhatsApp
                <select
                  className="w-full rounded-2xl border border-amber-100/70 bg-transparent px-4 py-2.5 text-sm normal-case outline-none dark:border-slate-700 dark:bg-slate-800"
                  value={settings.whatsapp_provider || "meta"}
                  onChange={(e) => setSettings({ ...settings, whatsapp_provider: e.target.value })}
                >
                  <option value="meta">Meta WhatsApp Cloud API (Oficial Serverless - Vercel)</option>
                  <option value="openwa">OpenWA Gateway (URL Externa con Contenedor)</option>
                </select>
              </label>

              {(settings.whatsapp_provider || "meta") === "meta" ? (
                <>
                  <label className="sm:col-span-2 grid gap-1 text-xs uppercase text-slate-500 font-semibold">
                    Meta Access Token (Bearer Token)
                    <input
                      className="w-full rounded-2xl border border-amber-100/70 bg-transparent px-4 py-2 text-sm normal-case text-inherit outline-none dark:border-slate-700"
                      placeholder="ej. EAAG..."
                      type="password"
                      value={settings.meta_whatsapp_token || ""}
                      onChange={(e) => setSettings({ ...settings, meta_whatsapp_token: e.target.value })}
                    />
                  </label>

                  <label className="grid gap-1 text-xs uppercase text-slate-500 font-semibold">
                    Phone Number ID
                    <input
                      className="w-full rounded-2xl border border-amber-100/70 bg-transparent px-4 py-2 text-sm normal-case text-inherit outline-none dark:border-slate-700"
                      placeholder="ej. 105938472910..."
                      value={settings.meta_phone_number_id || ""}
                      onChange={(e) => setSettings({ ...settings, meta_phone_number_id: e.target.value })}
                    />
                  </label>

                  <label className="grid gap-1 text-xs uppercase text-slate-500 font-semibold">
                    Prefijo Telefónico (País)
                    <input
                      className="w-full rounded-2xl border border-amber-100/70 bg-transparent px-4 py-2 text-sm normal-case text-inherit outline-none dark:border-slate-700"
                      placeholder="ej. 52"
                      value={settings.whatsapp_default_country || "52"}
                      onChange={(e) => setSettings({ ...settings, whatsapp_default_country: e.target.value })}
                      required
                    />
                  </label>
                </>
              ) : (
                <>
                  <label className="grid gap-1 text-xs uppercase text-slate-500 font-semibold">
                    Dirección del Gateway (OpenWA URL)
                    <input
                      className="w-full rounded-2xl border border-amber-100/70 bg-transparent px-4 py-2 text-sm normal-case text-inherit outline-none dark:border-slate-700"
                      placeholder="ej. https://tu-openwa.onrender.com"
                      value={settings.whatsapp_gateway_url || ""}
                      onChange={(e) => setSettings({ ...settings, whatsapp_gateway_url: e.target.value })}
                      required
                    />
                  </label>

                  <label className="grid gap-1 text-xs uppercase text-slate-500 font-semibold">
                    API Key (OpenWA)
                    <input
                      className="w-full rounded-2xl border border-amber-100/70 bg-transparent px-4 py-2 text-sm normal-case text-inherit outline-none dark:border-slate-700"
                      placeholder="API Key"
                      type="password"
                      value={settings.whatsapp_api_key || ""}
                      onChange={(e) => setSettings({ ...settings, whatsapp_api_key: e.target.value })}
                    />
                  </label>

                  <label className="grid gap-1 text-xs uppercase text-slate-500 font-semibold">
                    ID de Sesión
                    <input
                      className="w-full rounded-2xl border border-amber-100/70 bg-transparent px-4 py-2 text-sm normal-case text-inherit outline-none dark:border-slate-700"
                      placeholder="ej. tiendita"
                      value={settings.whatsapp_session_id || "tiendita"}
                      onChange={(e) => setSettings({ ...settings, whatsapp_session_id: e.target.value })}
                      required
                    />
                  </label>

                  <label className="grid gap-1 text-xs uppercase text-slate-500 font-semibold">
                    Prefijo Telefónico (País)
                    <input
                      className="w-full rounded-2xl border border-amber-100/70 bg-transparent px-4 py-2 text-sm normal-case text-inherit outline-none dark:border-slate-700"
                      placeholder="ej. 52"
                      value={settings.whatsapp_default_country || "52"}
                      onChange={(e) => setSettings({ ...settings, whatsapp_default_country: e.target.value })}
                      required
                    />
                  </label>
                </>
              )}

              <div className="sm:col-span-2 flex justify-end mt-2">
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="w-full sm:w-auto rounded-2xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition disabled:opacity-50"
                >
                  {savingSettings ? "Guardando..." : "Guardar Configuración"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Connection Status Card */}
        <div className="rounded-3xl border border-amber-100/70 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 flex flex-col justify-between items-center text-center">
          <div className="w-full">
            <div className="mb-4 text-lg font-semibold text-slate-800 dark:text-slate-100">
              Estado de Conexión
            </div>

            {/* Badge Indicator */}
            <div className="flex justify-center mb-6">
              {(whatsappStatus === "CONNECTED" || whatsappStatus === "ready") ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-4 py-2 text-sm font-bold text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  CONECTADO
                </span>
              ) : (whatsappStatus === "QRCODE" || whatsappStatus === "qr_ready") ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-4 py-2 text-sm font-bold text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
                  <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
                  ESPERANDO QR
                </span>
              ) : (whatsappStatus === "INITIALIZING" || whatsappStatus === "initializing") ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-4 py-2 text-sm font-bold text-blue-800 dark:bg-blue-950/50 dark:text-blue-300">
                  <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
                  INICIALIZANDO...
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-4 py-2 text-sm font-bold text-rose-800 dark:bg-rose-950/50 dark:text-rose-300">
                  <span className="h-2 w-2 rounded-full bg-rose-500"></span>
                  DESCONECTADO
                </span>
              )}
            </div>

            {/* QR display or status text */}
            <div className="flex flex-col items-center justify-center min-h-[220px]">
              {(whatsappStatus === "CONNECTED" || whatsappStatus === "ready") ? (
                <div className="space-y-2">
                  <Icon path={mdiWhatsapp} size={4} className="text-emerald-500 mx-auto" />
                  <p className="text-sm text-slate-500">La vinculación está activa. Los tickets automáticos se enviarán a los clientes registrados.</p>
                </div>
              ) : (whatsappStatus === "QRCODE" || whatsappStatus === "qr_ready") ? (
                <div className="space-y-4">
                  {whatsappQrCode ? (
                    <div className="bg-white p-3 rounded-2xl shadow-inner border border-slate-200">
                      <img src={whatsappQrCode} alt="WhatsApp QR Code" className="w-[180px] h-[180px]" />
                    </div>
                  ) : (
                    <div className="w-[180px] h-[180px] flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-2xl">
                      <span className="text-xs text-slate-400">Generando QR...</span>
                    </div>
                  )}
                  <p className="text-xs text-slate-500 max-w-[200px]">Escanea este código QR en tu WhatsApp ("Dispositivos Vinculados") para activar el Gateway.</p>
                </div>
              ) : (whatsappStatus === "INITIALIZING" || whatsappStatus === "initializing") ? (
                <div className="space-y-2">
                  <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-sm text-slate-500">El servicio se está preparando. Espera unos segundos...</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Icon path={mdiWhatsapp} size={3} className="text-slate-300 dark:text-slate-700 mx-auto" />
                  <p className="text-sm text-slate-500">Haz clic abajo para iniciar la sesión y obtener el código QR de vinculación.</p>
                </div>
              )}
            </div>
          </div>

          <div className="w-full pt-4 border-t border-slate-100 dark:border-slate-800 flex gap-2 justify-center">
            {!(whatsappStatus === "CONNECTED" || whatsappStatus === "ready") && !(whatsappStatus === "INITIALIZING" || whatsappStatus === "initializing") && (
              <button
                type="button"
                onClick={handleStartWhatsapp}
                disabled={startingWhatsapp}
                className="rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-5 py-2.5 transition disabled:opacity-50 flex-1"
              >
                {startingWhatsapp ? "Iniciando..." : "Inicializar Sesión"}
              </button>
            )}
            {((whatsappStatus === "CONNECTED" || whatsappStatus === "ready") || (whatsappStatus === "QRCODE" || whatsappStatus === "qr_ready")) && (
              <button
                type="button"
                onClick={handleLogoutWhatsapp}
                disabled={loggingOutWhatsapp}
                className="rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm px-5 py-2.5 transition disabled:opacity-50 flex-1"
              >
                {loggingOutWhatsapp ? "Cerrando..." : "Desvincular"}
              </button>
            )}
            <button
              type="button"
              onClick={loadWhatsappStatus}
              disabled={checkingWhatsapp}
              className="rounded-2xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold text-sm px-4 py-2.5 transition disabled:opacity-50"
            >
              🔄
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const rewardsPanel = (
    <div className="space-y-6">
      {/* Configuración de Recompensas */}
      <div className="rounded-3xl border border-amber-100/70 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
        <div className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <Icon path={mdiGift} size={1} />
          Configuración del Sistema de Recompensas
        </div>
        <form onSubmit={handleSaveSettings} className="grid gap-4 md:grid-cols-3 items-end">
          <label className="flex items-center gap-3 rounded-2xl border border-amber-100/70 bg-white/50 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-800/50 cursor-pointer">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-amber-300 text-amber-500 focus:ring-amber-400 dark:border-slate-600 dark:bg-slate-700"
              checked={settings.rewards_enabled}
              onChange={(e) => setSettings({ ...settings, rewards_enabled: e.target.checked })}
            />
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Activar acumulación y canje</span>
          </label>
          <label className="grid gap-1 text-xs uppercase text-slate-500 font-semibold">
            Factor de Recompensa (% de la compra en puntos)
            <input
              className="w-full rounded-2xl border border-amber-100/70 bg-transparent px-4 py-2 text-sm normal-case text-inherit outline-none dark:border-slate-700"
              placeholder="ej. 10"
              type="number"
              min="0"
              max="100"
              step="0.5"
              value={Number((settings.reward_factor * 100).toFixed(1))}
              onChange={(e) =>
                setSettings({ ...settings, reward_factor: (parseFloat(e.target.value) || 0) / 100 })
              }
              required
            />
          </label>
          <button
            type="submit"
            disabled={savingSettings}
            className="w-full rounded-2xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 transition disabled:opacity-50"
          >
            {savingSettings ? "Guardando..." : "Guardar Configuración"}
          </button>
        </form>
      </div>

      {/* Estadísticas */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl border border-amber-100/70 bg-white/90 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 flex items-center justify-between">
          <div>
            <div className="text-xs uppercase text-slate-500 font-semibold">Total de Dulces Canjeados</div>
            <div className="text-3xl font-bold mt-1 text-amber-700 dark:text-amber-400">
              {redemptionStats.totals?.total_count || 0} uds
            </div>
          </div>
          <Icon path={mdiGift} size={1.8} className="opacity-20 text-amber-500" />
        </div>
        <div className="rounded-3xl border border-amber-100/70 bg-white/90 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 flex items-center justify-between">
          <div>
            <div className="text-xs uppercase text-slate-500 font-semibold">Total de Puntos Canjeados</div>
            <div className="text-3xl font-bold mt-1 text-amber-700 dark:text-amber-400">
              {Number(redemptionStats.totals?.total_points || 0).toFixed(1)} pts
            </div>
          </div>
          <Icon path={mdiStar} size={1.8} className="opacity-20 text-amber-500" />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Historial Detallado de Canjes */}
        <div className="rounded-3xl border border-amber-100/70 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
          <div className="mb-4 text-lg font-semibold">Historial de Canjes</div>
          {redemptionStatsLoading ? (
            <p className="text-sm text-slate-500">Cargando historial...</p>
          ) : (
            <div className="max-h-[50vh] overflow-y-auto rounded-2xl border border-amber-100/70 dark:border-slate-800">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-amber-50 text-amber-900 dark:bg-slate-800 dark:text-amber-200 sticky top-0">
                  <tr>
                    <th className="px-4 py-2">Fecha</th>
                    <th className="px-4 py-2">Cliente</th>
                    <th className="px-4 py-2">Producto</th>
                    <th className="px-4 py-2 text-right">Puntos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-100/70 dark:divide-slate-800">
                  {redemptionStats.redemptions?.map((red) => (
                    <tr key={red.id} className="hover:bg-amber-50/60 dark:hover:bg-slate-800/70">
                      <td className="px-4 py-2 font-mono text-xs">
                        {new Date(red.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-2 font-medium">{red.client_name}</td>
                      <td className="px-4 py-2">{red.sweet_name}</td>
                      <td className="px-4 py-2 text-right text-amber-700 dark:text-amber-400 font-semibold">
                        -{Number(red.points_spent).toFixed(1)} pts
                      </td>
                    </tr>
                  ))}
                  {(redemptionStats.redemptions == null || redemptionStats.redemptions.length === 0) && (
                    <tr>
                      <td className="px-4 py-4 text-center text-slate-500" colSpan={4}>
                        No hay canjes registrados en el sistema.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Productos más Canjeados */}
        <div className="rounded-3xl border border-amber-100/70 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
          <div className="mb-4 text-lg font-semibold">Dulces más Canjeados</div>
          {redemptionStatsLoading ? (
            <p className="text-sm text-slate-500">Cargando estadísticas...</p>
          ) : (
            <div className="max-h-[50vh] overflow-y-auto rounded-2xl border border-amber-100/70 dark:border-slate-800">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-amber-50 text-amber-900 dark:bg-slate-800 dark:text-amber-200 sticky top-0">
                  <tr>
                    <th className="px-4 py-2">Dulce</th>
                    <th className="px-4 py-2 text-center">Unidades</th>
                    <th className="px-4 py-2 text-right">Puntos Totales</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-100/70 dark:divide-slate-800">
                  {redemptionStats.bySweet?.map((row, idx) => (
                    <tr key={`${row.sweet_name}-${idx}`} className="hover:bg-amber-50/60 dark:hover:bg-slate-800/70">
                      <td className="px-4 py-2 font-medium">{row.sweet_name}</td>
                      <td className="px-4 py-2 text-center">{row.count} uds</td>
                      <td className="px-4 py-2 text-right text-amber-700 dark:text-amber-400 font-semibold">
                        {Number(row.total_points).toFixed(1)} pts
                      </td>
                    </tr>
                  ))}
                  {(redemptionStats.bySweet == null || redemptionStats.bySweet.length === 0) && (
                    <tr>
                      <td className="px-4 py-4 text-center text-slate-500" colSpan={3}>
                        Sin datos disponibles.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-rose-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <nav className="sticky top-0 z-20 border-b border-amber-100/60 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          {/* Logo */}
          <div className="flex shrink-0 items-center gap-2 text-lg font-semibold">
            <img
              src={brandLogo}
              alt="Logo Tiendita"
              className="h-8 w-8 rounded-lg border border-amber-200 object-cover shadow-sm dark:border-slate-700"
            />
            Tiendita
          </div>

          {/* Desktop nav - always visible */}
          {token && (
            <div className="hidden flex-1 items-center gap-1 text-sm md:flex">
              {[
                { path: "/", icon: mdiClipboardList, label: "Precios" },
                {
                  path: "/inventario",
                  icon: mdiCandycane,
                  label: "Inventario",
                },
                { path: "/clientes", icon: mdiAccountGroup, label: "Clientes" },
                { path: "/recompensas", icon: mdiGift, label: "Recompensas" },
                { path: "/whatsapp", icon: mdiWhatsapp, label: "WhatsApp" },
                { path: "/compras", icon: mdiStore, label: "Compras" },
                {
                  path: "/estadisticas",
                  icon: mdiChartBar,
                  label: "Estadisticas",
                },
              ].map(({ path, icon, label }) => (
                <button
                  key={path}
                  onClick={() => navigateTo(path)}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 transition ${
                    location.pathname === path
                      ? "bg-amber-100 font-semibold text-amber-800 dark:bg-slate-700 dark:text-amber-300"
                      : "hover:bg-amber-50 dark:hover:bg-slate-800"
                  }`}
                >
                  <Icon path={icon} size={0.75} />
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* Spacer on mobile */}
          <div className="flex-1 md:hidden" />

          {/* Right controls */}
          <div className="flex items-center gap-2">
            <button
              className="rounded-full border border-amber-200/70 p-2 text-amber-900 transition hover:rotate-6 dark:border-slate-700 dark:text-amber-200"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              <Icon
                path={theme === "dark" ? mdiWhiteBalanceSunny : mdiWeatherNight}
                size={1}
              />
            </button>
            {token && (
              <button
                className="flex items-center gap-2 rounded-full border border-rose-200 px-3 py-2 text-sm text-rose-600 transition hover:bg-rose-50 dark:border-rose-700 dark:text-rose-200 dark:hover:bg-rose-900/40"
                onClick={handleLogout}
              >
                <Icon path={mdiLogout} size={0.8} />
                Salir
              </button>
            )}
            {!token && (
              <button
                onClick={() => navigateTo("/login")}
                className="flex items-center gap-2 rounded-full border border-amber-200 px-3 py-1.5 text-sm hover:bg-amber-50 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                <Icon path={mdiLogin} size={0.8} />
                Login
              </button>
            )}
            {/* Mobile hamburger */}
            {token && (
              <button
                className="rounded-full bg-amber-100 p-2 text-amber-900 transition hover:scale-105 dark:bg-slate-800 dark:text-amber-200 md:hidden"
                onClick={() => setMenuOpen((prev) => !prev)}
              >
                <Icon path={mdiMenu} size={1} />
              </button>
            )}
          </div>
        </div>

        {/* Mobile dropdown */}
        <AnimatePresence>
          {menuOpen && token && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-amber-100/60 bg-white/90 px-4 py-3 text-sm dark:border-slate-800 dark:bg-slate-900/90 md:hidden"
            >
              <div className="flex flex-wrap gap-4">
                {[
                  { path: "/", icon: mdiClipboardList, label: "Precios" },
                  {
                    path: "/inventario",
                    icon: mdiCandycane,
                    label: "Inventario",
                  },
                  {
                    path: "/clientes",
                    icon: mdiAccountGroup,
                    label: "Clientes",
                  },
                  { path: "/recompensas", icon: mdiGift, label: "Recompensas" },
                  { path: "/whatsapp", icon: mdiWhatsapp, label: "WhatsApp" },
                  { path: "/compras", icon: mdiStore, label: "Compras" },
                  {
                    path: "/estadisticas",
                    icon: mdiChartBar,
                    label: "Estadisticas",
                  },
                ].map(({ path, icon, label }) => (
                  <button
                    key={path}
                    onClick={() => navigateTo(path)}
                    className="flex items-center gap-2 hover:text-amber-600"
                  >
                    <Icon path={icon} size={0.8} />
                    {label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <Routes location={location}>
          <Route
            path="/login"
            element={
              <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
                <div className="mx-auto w-full max-w-md">
                  <form
                    onSubmit={handleLogin}
                    className="rounded-3xl border border-amber-100/70 bg-white/90 p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900/80"
                  >
                    <div className="mb-4 flex justify-center">
                      <img
                        src={brandLogo}
                        alt="Logo Tiendita"
                        className="h-16 w-16 rounded-2xl border border-amber-200 object-cover shadow-sm dark:border-slate-700"
                      />
                    </div>
                    <div className="mb-6 text-center text-2xl font-semibold">
                      Iniciar Sesion
                    </div>
                    <div className="grid gap-4">
                      <input
                        className="w-full rounded-2xl border border-amber-100/70 bg-transparent px-4 py-3 text-sm outline-none dark:border-slate-700"
                        placeholder="Usuario"
                        value={login.username}
                        onChange={(event) =>
                          setLogin({
                            ...login,
                            username: event.target.value,
                          })
                        }
                      />
                      <input
                        className="w-full rounded-2xl border border-amber-100/70 bg-transparent px-4 py-3 text-sm outline-none dark:border-slate-700"
                        placeholder="Contrasena"
                        type="password"
                        value={login.password}
                        onChange={(event) =>
                          setLogin({
                            ...login,
                            password: event.target.value,
                          })
                        }
                      />
                      <button className="rounded-2xl bg-amber-500 px-4 py-3 text-sm font-semibold text-white hover:bg-amber-600">
                        Entrar
                      </button>
                    </div>
                  </form>
                </div>
                <div>{pricesPanel}</div>
              </div>
            }
          />

          <Route path="/" element={<div>{pricesPanel}</div>} />

          <Route
            path="/inventario"
            element={
              token ? (
                <div className="space-y-6">
                  <div className="rounded-3xl border border-amber-100/70 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-lg font-semibold">
                        <Icon path={mdiCandycane} size={1} className="text-amber-500" />
                        <span>Inventario de Dulces ({filteredSweets.length})</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingSweet(null);
                          setSweetModalOpen(true);
                        }}
                        className="flex items-center gap-2 rounded-2xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 transition shadow-sm"
                      >
                        <Icon path={mdiPlusCircle} size={0.8} />
                        Agregar Dulce
                      </button>
                    </div>

                    <div className="mb-4">
                      <input
                        className="w-full rounded-2xl border border-amber-100/70 bg-transparent px-4 py-2 text-sm outline-none dark:border-slate-700"
                        placeholder="Buscar dulce..."
                        value={sweetsQuery}
                        onChange={(event) => setSweetsQuery(event.target.value)}
                      />
                    </div>
                    <div className="overflow-hidden rounded-2xl border border-amber-100/70 dark:border-slate-800 max-h-[60vh] overflow-y-auto">
                      <table className="min-w-full text-left text-sm">
                        <thead className="bg-amber-50 text-amber-900 dark:bg-slate-800 dark:text-amber-200 sticky top-0">
                          <tr>
                            <th className="px-4 py-2">Nombre</th>
                            <th className="px-4 py-2">
                              <div className="flex items-center gap-1">
                                Costo
                                <button
                                  type="button"
                                  onClick={() => setShowCosts((v) => !v)}
                                  className="rounded p-0.5 hover:bg-amber-100 dark:hover:bg-slate-700"
                                  title={
                                    showCosts
                                      ? "Ocultar costos"
                                      : "Mostrar costos"
                                  }
                                >
                                  <Icon
                                    path={showCosts ? mdiEye : mdiEyeOff}
                                    size={0.6}
                                  />
                                </button>
                              </div>
                            </th>
                            <th className="px-4 py-2">Venta</th>
                            <th className="px-4 py-2">Disponibles</th>
                            <th className="px-4 py-2">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-amber-100/70 dark:divide-slate-800">
                          {filteredSweets.map((sweet) => (
                            <tr
                              key={sweet.id}
                              className="hover:bg-amber-50/60 dark:hover:bg-slate-800/70"
                            >
                              <td className="px-4 py-2">{sweet.name}</td>
                              <td className="px-4 py-2">
                                {showCosts ? (
                                  `$${Number(sweet.purchase_price).toFixed(2)}`
                                ) : (
                                  <span className="tracking-widest text-slate-400">
                                    ••••••
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-2">
                                ${Number(sweet.sale_price).toFixed(2)}
                              </td>
                              <td className="px-4 py-2">{sweet.stock}</td>
                              <td className="px-4 py-2">
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => {
                                      setEditingSweet(sweet);
                                      setSweetModalOpen(true);
                                    }}
                                    className="rounded-lg bg-blue-500 p-1.5 text-white hover:bg-blue-600"
                                    title="Editar"
                                  >
                                    <Icon path={mdiPencil} size={0.7} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteSweet(sweet.id)}
                                    className="rounded-lg bg-red-500 p-1.5 text-white hover:bg-red-600"
                                    title="Eliminar"
                                  >
                                    <Icon path={mdiDelete} size={0.7} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                          {filteredSweets.length === 0 && (
                            <tr>
                              <td
                                className="px-4 py-4 text-center text-slate-500"
                                colSpan={5}
                              >
                                Sin dulces registrados
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {stockStats && (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                      <div className="rounded-3xl border border-amber-100/70 bg-white/90 p-5 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
                        <div className="text-slate-500">Productos</div>
                        <div className="text-2xl font-semibold">
                          {stockStats.totals?.total_products || 0}
                        </div>
                      </div>
                      <div className="rounded-3xl border border-amber-100/70 bg-white/90 p-5 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
                        <div className="text-slate-500">Stock total</div>
                        <div className="text-2xl font-semibold">
                          {stockStats.totals?.total_stock || 0}
                        </div>
                      </div>
                      <div className="rounded-3xl border border-amber-100/70 bg-white/90 p-5 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
                        <div className="text-slate-500">Mas vendido</div>
                        <div className="text-base font-semibold">
                          {stockStats.topSeller?.name || "Sin datos"}
                        </div>
                        <div className="text-xs text-slate-500">
                          {stockStats.topSeller?.sold_count || 0} vendidos
                        </div>
                      </div>
                      <div className="rounded-3xl border border-amber-100/70 bg-white/90 p-5 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
                        <div className="text-slate-500">Menos vendido</div>
                        <div className="text-base font-semibold">
                          {stockStats.lowSeller?.name || "Sin datos"}
                        </div>
                        <div className="text-xs text-slate-500">
                          {stockStats.lowSeller?.sold_count || 0} vendidos
                        </div>
                      </div>
                      <div className="rounded-3xl border border-amber-100/70 bg-white/90 p-5 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
                        <div className="text-slate-500">Stock mas bajo</div>
                        <div className="text-base font-semibold">
                          {stockStats.lowStock?.name || "Sin datos"}
                        </div>
                        <div className="text-xs text-slate-500">
                          {stockStats.lowStock?.stock || 0} disponibles
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          <Route
            path="/clientes"
            element={
              token ? (
                <div className="grid gap-6 lg:h-[calc(100vh-8rem)] lg:grid-cols-2">
                  {/* Left Column: Actions & Client List */}
                  <div className={`flex flex-col gap-4 lg:min-h-0 ${mobileClientView === "detail" && selectedClient ? "hidden lg:flex" : "flex"}`}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingClient(null);
                          setClientModalOpen(true);
                        }}
                        className="flex items-center gap-2 rounded-2xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 transition shadow-sm"
                      >
                        <Icon path={mdiPlusCircle} size={0.8} />
                        Nuevo Cliente
                      </button>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={openCashSaleModal}
                          className="flex items-center gap-1.5 rounded-2xl border border-amber-200 bg-white/80 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-50 dark:border-slate-700 dark:bg-slate-900 dark:text-amber-300"
                        >
                          <Icon path={mdiCashRegister} size={0.7} />
                          Venta sin cliente
                        </button>
                        <button
                          type="button"
                          onClick={handleSendAllWhatsAppStatements}
                          className="flex items-center gap-1.5 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300"
                        >
                          <Icon path={mdiWhatsapp} size={0.7} />
                          Enviar cuentas
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col rounded-3xl border border-amber-100/70 bg-white/90 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 sm:p-6 lg:min-h-0">
                      <div className="mb-3 flex items-center justify-between">
                        <div className="text-lg font-semibold flex items-center gap-2">
                          <Icon path={mdiAccountGroup} size={0.9} />
                          <span>Clientes ({filteredClients.length})</span>
                        </div>
                      </div>
                      <div className="mb-3">
                        <input
                          className="w-full rounded-2xl border border-amber-100/70 bg-transparent px-4 py-2 text-sm outline-none dark:border-slate-700"
                          placeholder="Buscar cliente por nombre o teléfono..."
                          value={clientsQuery}
                          onChange={(event) => setClientsQuery(event.target.value)}
                        />
                      </div>
                      <div className="flex-1 space-y-2 overflow-y-auto pr-1 max-h-[60vh] lg:max-h-none lg:min-h-0">
                        {filteredClients.map((client) => (
                          <div
                            key={client.id}
                            className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-sm transition ${
                              selectedClient?.id === client.id
                                ? "border-amber-300 bg-amber-50 dark:border-amber-400/50 dark:bg-slate-800"
                                : "border-amber-100/70 bg-white/60 hover:bg-amber-50 dark:border-slate-700 dark:bg-slate-900/40"
                            }`}
                          >
                            <button
                              onClick={() => loadMovements(client)}
                              className="flex-1 text-left"
                            >
                              <div className="font-medium flex items-center gap-1.5">
                                {client.name}
                                <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-slate-800 dark:text-amber-300">
                                  <Icon path={mdiStar} size={0.4} />
                                  {Number(client.points || 0).toFixed(1)} pts
                                </span>
                              </div>
                              <div
                                className={`text-xs ${
                                  Number(client.total_debt) > 0
                                    ? "text-rose-500"
                                    : Number(client.total_debt) < 0
                                      ? "text-emerald-500"
                                      : "text-slate-900 dark:text-slate-100"
                                }`}
                              >
                                Saldo: ${Number(client.total_debt).toFixed(2)}
                              </div>
                            </button>
                            <div className="flex gap-1">
                              <button
                                onClick={() => {
                                  setEditingClient(client);
                                  setClientModalOpen(true);
                                }}
                                className="rounded-lg bg-blue-500 p-1.5 text-white hover:bg-blue-600"
                                title="Editar"
                              >
                                <Icon path={mdiPencil} size={0.6} />
                              </button>
                              <button
                                onClick={() => handleDeleteClient(client.id)}
                                className="rounded-lg bg-red-500 p-1.5 text-white hover:bg-red-600"
                                title="Eliminar"
                              >
                                <Icon path={mdiDelete} size={0.6} />
                              </button>
                            </div>
                          </div>
                        ))}
                        {filteredClients.length === 0 && (
                          <p className="text-sm text-slate-500">Sin clientes registrados.</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Selected Client Detail */}
                  <div className={`flex flex-col lg:min-h-0 ${mobileClientView === "list" && selectedClient ? "hidden lg:flex" : "flex"}`}>
                    {selectedClient ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setMobileClientView("list")}
                          className="mb-3 flex items-center gap-1 text-sm font-semibold text-amber-700 dark:text-amber-300 lg:hidden"
                        >
                          <Icon path={mdiChevronLeft} size={0.8} />
                          Volver a lista de clientes
                        </button>
                        <div className="flex flex-1 flex-col rounded-3xl border border-amber-100/70 bg-white/90 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 sm:p-6 lg:min-h-0">
                          <div className="mb-4 text-lg font-semibold flex items-center justify-between">
                            <div>Detalle de {selectedClient.name}</div>
                            <div className="flex items-center gap-1 rounded-2xl bg-amber-50 px-3 py-1 text-sm font-bold text-amber-800 dark:bg-slate-800 dark:text-amber-300">
                              <Icon path={mdiStar} size={0.6} />
                              {Number(selectedClient.points || 0).toFixed(1)} pts
                            </div>
                          </div>

                          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between bg-amber-50/40 dark:bg-slate-800/40 rounded-2xl p-3 border border-amber-100/50 dark:border-slate-800">
                            <div className="text-sm text-slate-500">
                              {selectedClient.phone ? (
                                <span>Teléfono: <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedClient.phone}</span></span>
                              ) : (
                                <span className="italic text-slate-400">Sin teléfono registrado</span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleSendWhatsApp(selectedClient)}
                              className={`flex items-center justify-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-white transition ${
                                selectedClient.phone
                                  ? "bg-emerald-600 hover:bg-emerald-700"
                                  : "bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed opacity-60"
                              }`}
                            >
                              <Icon path={mdiWhatsapp} size={0.6} />
                              {selectedClient.phone ? "Enviar Cuenta" : "Sin WhatsApp"}
                            </button>
                          </div>

                          {/* Sub-tabs */}
                          <div className="mb-4 flex border-b border-amber-100 dark:border-slate-800">
                            <button
                              type="button"
                              onClick={() => setClientSubTab("movements")}
                              className={`flex-1 pb-2 text-center text-sm font-semibold transition ${
                                clientSubTab === "movements"
                                  ? "border-b-2 border-amber-500 text-amber-800 dark:text-amber-300"
                                  : "text-slate-500 hover:text-slate-700"
                              }`}
                            >
                              Movimientos
                            </button>
                            <button
                              type="button"
                              onClick={() => setClientSubTab("redeem")}
                              className={`flex-1 pb-2 text-center text-sm font-semibold transition ${
                                clientSubTab === "redeem"
                                  ? "border-b-2 border-amber-500 text-amber-800 dark:text-amber-300"
                                  : "text-slate-500 hover:text-slate-700"
                              }`}
                            >
                              Canjear
                            </button>
                            <button
                              type="button"
                              onClick={() => setClientSubTab("redemptions")}
                              className={`flex-1 pb-2 text-center text-sm font-semibold transition ${
                                clientSubTab === "redemptions"
                                  ? "border-b-2 border-amber-500 text-amber-800 dark:text-amber-300"
                                  : "text-slate-500 hover:text-slate-700"
                              }`}
                            >
                              Historial Canjes
                            </button>
                          </div>

                          {clientSubTab === "movements" && (
                            <>
                              <div className="mb-4 grid grid-cols-2 gap-2">
                                <button
                                  type="button"
                                  onClick={() => openMovementModal("purchase")}
                                  className="flex items-center justify-center gap-2 rounded-2xl bg-rose-500 px-2 py-2 text-sm font-semibold text-white hover:bg-rose-600"
                                >
                                  <Icon path={mdiCashPlus} size={0.8} />
                                  Registrar compra
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openMovementModal("pay")}
                                  className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-2 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
                                >
                                  <Icon path={mdiCashMinus} size={0.8} />
                                  Registrar pago
                                </button>
                              </div>
                              <div className="flex-1 space-y-2 overflow-y-auto pr-1 lg:min-h-0">
                                {movements.map((move) => {
                                  const isPurchase =
                                    String(move.concept || "")
                                      .toLowerCase()
                                      .includes("compra") && Number(move.amount) > 0;

                                  return (
                                    <div
                                      key={move.id}
                                      className="flex flex-col gap-2 rounded-2xl border border-amber-100/70 px-3 py-2 text-sm dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between sm:px-4"
                                    >
                                      <div>
                                        <div className="font-semibold flex flex-wrap items-center gap-1.5">
                                          <span>{move.concept}</span>
                                          {Number(move.points) !== 0 && (
                                            <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                              Number(move.points) > 0
                                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                                                : "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300"
                                            }`}>
                                              <Icon path={mdiStar} size={0.4} />
                                              {Number(move.points) > 0 ? `+${Number(move.points).toFixed(1)}` : `${Number(move.points).toFixed(1)}`} pts
                                            </span>
                                          )}
                                        </div>
                                        <div className="text-xs text-slate-500">
                                          {new Date(move.created_at).toLocaleString()}
                                        </div>
                                      </div>
                                      <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
                                        <div
                                          className={`font-semibold ${Number(move.amount) >= 0 ? "text-rose-500" : "text-emerald-500"}`}
                                        >
                                          ${Number(move.amount).toFixed(2)}
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteMovement(move)}
                                          className="rounded-lg border border-rose-200 p-1 text-rose-600 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-300 dark:hover:bg-rose-900/20"
                                          title="Eliminar movimiento"
                                        >
                                          <Icon path={mdiDelete} size={0.7} />
                                        </button>
                                        {isPurchase && (
                                          <button
                                            type="button"
                                            onClick={() => openMovementDetail(move)}
                                            className="rounded-lg border border-amber-200 p-1 text-amber-700 hover:bg-amber-50"
                                            title="Ver detalle"
                                          >
                                            <Icon path={mdiEye} size={0.7} />
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                                {movements.length === 0 && (
                                  <p className="text-sm text-slate-500">
                                    Aun no hay movimientos.
                                  </p>
                                )}
                              </div>
                            </>
                          )}

                          {clientSubTab === "redeem" && (
                            <div className="flex-1 space-y-3 overflow-y-auto pr-1 lg:min-h-0">
                              {!settings.rewards_enabled ? (
                                <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-4 text-center text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300">
                                  El sistema de recompensas ha sido desactivado temporalmente por la administración.
                                </div>
                              ) : (
                                <>
                                  <div className="mb-2">
                                    <input
                                      className="w-full rounded-2xl border border-amber-100/70 bg-transparent px-4 py-2 text-sm outline-none dark:border-slate-700"
                                      placeholder="Buscar dulce para canje..."
                                      value={redeemQuery}
                                      onChange={(event) => setRedeemQuery(event.target.value)}
                                    />
                                  </div>
                                  {filteredSweetsForRedeem.map((sweet) => {
                                    const cost = Number(sweet.sale_price);
                                    const canRedeem = Number(selectedClient.points || 0) >= cost && Number(sweet.stock || 0) > 0;
                                    return (
                                      <div
                                        key={sweet.id}
                                        className="flex items-center justify-between rounded-2xl border border-amber-100/70 p-3 text-sm dark:border-slate-800 bg-white/60 dark:bg-slate-900/40"
                                      >
                                        <div>
                                          <div className="font-semibold">{sweet.name}</div>
                                          <div className="text-xs text-slate-500">
                                            Costo: {cost.toFixed(1)} pts | Stock: {sweet.stock} uds
                                          </div>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => handleRedeemReward(sweet.id)}
                                          disabled={!canRedeem}
                                          className={`rounded-xl px-4 py-1.5 text-xs font-semibold text-white transition ${
                                            canRedeem
                                              ? "bg-amber-500 hover:bg-amber-600"
                                              : "bg-slate-300 dark:bg-slate-800 cursor-not-allowed opacity-50"
                                          }`}
                                        >
                                          Canjear
                                        </button>
                                      </div>
                                    );
                                  })}
                                  {filteredSweetsForRedeem.length === 0 && (
                                    <p className="text-sm text-slate-500">No hay dulces disponibles para canje.</p>
                                  )}
                                </>
                              )}
                            </div>
                          )}

                          {clientSubTab === "redemptions" && (
                            <div className="flex-1 space-y-3 overflow-y-auto pr-1 lg:min-h-0">
                              {redemptionsLoading ? (
                                <p className="text-sm text-slate-500">Cargando historial...</p>
                              ) : redemptions.map((red) => (
                                <div
                                  key={red.id}
                                  className="flex items-center justify-between rounded-2xl border border-amber-100/70 p-3 text-sm dark:border-slate-800 bg-white/60 dark:bg-slate-900/40"
                                >
                                  <div>
                                    <div className="font-semibold">{red.reward_name}</div>
                                    <div className="text-xs text-slate-500 font-mono">
                                      {new Date(red.created_at).toLocaleString()}
                                    </div>
                                  </div>
                                  <div className="font-semibold text-amber-700 dark:text-amber-400">
                                    -{Number(red.points_spent).toFixed(1)} pts
                                  </div>
                                </div>
                              ))}
                              {redemptions.length === 0 && !redemptionsLoading && (
                                <p className="text-sm text-slate-500">El cliente no ha canjeado recompensas aún.</p>
                              )}
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="hidden lg:flex flex-1 flex-col items-center justify-center rounded-3xl border border-dashed border-amber-200 bg-white/40 p-8 text-center dark:border-slate-800 dark:bg-slate-900/20">
                        <Icon path={mdiAccountGroup} size={2.5} className="text-slate-300 dark:text-slate-700 mb-2" />
                        <p className="text-sm text-slate-500">Selecciona un cliente de la lista para ver sus movimientos y registrar compras o pagos.</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          <Route
            path="/estadisticas"
            element={
              token ? (
                <div className="space-y-6">
                  <div className="rounded-3xl border border-amber-100/70 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
                    <div className="mb-2 flex items-center gap-2 text-lg font-semibold">
                      <Icon path={mdiChartBar} size={1} />
                      Estadisticas
                    </div>
                    <p className="text-sm text-slate-500">
                      Resumen de compras, ventas y stock.
                    </p>
                  </div>

                  {/* Deuda de clientes */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-3xl border border-rose-200/70 bg-rose-50/80 p-5 shadow-sm dark:border-rose-900/40 dark:bg-rose-950/30">
                      <div className="text-xs font-semibold uppercase tracking-wider text-rose-500 dark:text-rose-400">
                        Pendiente por cobrar
                      </div>
                      <div className="mt-1 text-3xl font-bold text-rose-600 dark:text-rose-400">
                        ${debtStats.pending.toFixed(2)}
                      </div>
                      <div className="mt-1 text-xs text-rose-400 dark:text-rose-500">
                        {clients.filter((c) => Number(c.total_debt) > 0).length}{" "}
                        clientes con saldo a favor tuyo
                      </div>
                    </div>
                    <div className="rounded-3xl border border-emerald-200/70 bg-emerald-50/80 p-5 shadow-sm dark:border-emerald-900/40 dark:bg-emerald-950/30">
                      <div className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                        A favor de clientes
                      </div>
                      <div className="mt-1 text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                        ${debtStats.favor.toFixed(2)}
                      </div>
                      <div className="mt-1 text-xs text-emerald-500 dark:text-emerald-500">
                        {clients.filter((c) => Number(c.total_debt) < 0).length}{" "}
                        clientes con saldo a su favor
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-6 lg:grid-cols-3">
                    <div className="space-y-6 lg:col-span-2">
                      <div className="rounded-3xl border border-amber-100/70 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
                        <div className="mb-3 flex items-center justify-between gap-2">
                          <div className="text-lg font-semibold">
                            Monto de venta por dia
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowProfit((v) => !v)}
                            className="flex items-center gap-1 rounded-full border border-amber-200 px-3 py-1 text-xs text-amber-700 hover:bg-amber-50 dark:border-slate-700 dark:text-amber-300 dark:hover:bg-slate-800"
                          >
                            <Icon
                              path={showProfit ? mdiEye : mdiEyeOff}
                              size={0.6}
                            />
                            {showProfit ? "Ocultar" : "Mostrar"} ganancias
                          </button>
                        </div>
                        {statsLoading ? (
                          <p className="text-sm text-slate-500">Cargando...</p>
                        ) : stats.dailyTotals?.length ? (
                          <div className="grid gap-4 lg:grid-cols-2">
                            <div className="max-h-[50vh] overflow-y-auto rounded-2xl border border-amber-100/70 dark:border-slate-800">
                              <table className="min-w-full text-left text-sm">
                                <thead className="sticky top-0 bg-amber-50 text-amber-900 dark:bg-slate-800 dark:text-amber-200">
                                  <tr>
                                    <th className="px-4 py-2">Dia</th>
                                    <th className="px-4 py-2">Venta</th>
                                    <th className="px-4 py-2">Ganancia</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-amber-100/70 dark:divide-slate-800">
                                  {stats.dailyTotals.map((row, idx) => {
                                    const normalizedDay = toIsoDay(row.day);
                                    const isActive =
                                      normalizedDay === selectedDay;
                                    return (
                                      <tr
                                        key={`${row.day}-${idx}`}
                                        onClick={() => {
                                          setSelectedDay(normalizedDay);
                                          loadDayMovements(normalizedDay);
                                        }}
                                        className={`cursor-pointer hover:bg-amber-50 dark:hover:bg-slate-800 ${isActive ? "bg-amber-100/70 dark:bg-slate-800" : ""}`}
                                      >
                                        <td className="px-4 py-2">
                                          {new Date(
                                            row.day,
                                          ).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-2">
                                          ${Number(row.total || 0).toFixed(2)}
                                        </td>
                                        <td className="px-4 py-2">
                                          {showProfit ? (
                                            <span className="text-emerald-600 dark:text-emerald-400">
                                              $
                                              {Number(row.profit || 0).toFixed(
                                                2,
                                              )}
                                            </span>
                                          ) : (
                                            <span className="tracking-widest text-slate-400">
                                              ••••••
                                            </span>
                                          )}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                            <div className="max-h-[50vh] overflow-y-auto rounded-2xl border border-amber-100/70 p-4 dark:border-slate-800">
                              <div className="mb-3 text-sm font-semibold">
                                Movimientos del dia {selectedDay || "-"}
                              </div>
                              {selectedDayLoading ? (
                                <p className="text-sm text-slate-500">
                                  Cargando detalle...
                                </p>
                              ) : selectedDayMoves.length ? (
                                <div className="space-y-3">
                                  {selectedDayMoves.map((move) => (
                                    <div
                                      key={`${move.buyer}-${move.id}`}
                                      className="rounded-2xl border border-amber-100/70 p-3 text-sm dark:border-slate-700"
                                    >
                                      <div className="font-semibold">
                                        {move.buyer}
                                      </div>
                                      <div className="text-xs text-slate-500">
                                        {new Date(
                                          move.created_at,
                                        ).toLocaleString()}
                                      </div>
                                      <div className="mt-1 text-sm">
                                        {move.items}
                                      </div>
                                      <div className="mt-1 font-semibold text-rose-500">
                                        ${Number(move.total || 0).toFixed(2)}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-slate-500">
                                  Sin movimientos para ese dia.
                                </p>
                              )}
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-slate-500">
                            Sin compras registradas.
                          </p>
                        )}
                      </div>

                      <div className="rounded-3xl border border-amber-100/70 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
                        <div className="mb-4 text-lg font-semibold">
                          Grafica de ventas (ultimos 14 dias)
                        </div>
                        {chartData.rows.length ? (
                          <div className="space-y-2">
                            {chartData.rows.map((item) => (
                              <div
                                key={item.dayLabel}
                                className="grid grid-cols-[70px_1fr_90px] items-center gap-2 text-xs"
                              >
                                <span className="text-slate-500">
                                  {item.dayLabel}
                                </span>
                                <div className="h-3 rounded-full bg-amber-100 dark:bg-slate-800">
                                  <div
                                    className="h-3 rounded-full bg-amber-500 dark:bg-amber-400"
                                    style={{
                                      width: `${Math.max(4, (item.total / chartData.max) * 100)}%`,
                                    }}
                                  />
                                </div>
                                <span className="text-right font-semibold">
                                  ${item.total.toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-slate-500">
                            Sin datos para graficar.
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="rounded-3xl border border-amber-100/70 bg-white/90 p-5 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
                        <div className="text-slate-500">Mas vendido</div>
                        <div className="text-base font-semibold">
                          {stats.topSeller?.name || "Sin datos"}
                        </div>
                        <div className="text-xs text-slate-500">
                          {stats.topSeller?.sold_count || 0} vendidos
                        </div>
                      </div>
                      <div className="rounded-3xl border border-amber-100/70 bg-white/90 p-5 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
                        <div className="text-slate-500">Menos vendido</div>
                        <div className="text-base font-semibold">
                          {stats.lowSeller?.name || "Sin datos"}
                        </div>
                        <div className="text-xs text-slate-500">
                          {stats.lowSeller?.sold_count || 0} vendidos
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-amber-100/70 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <div className="text-lg font-semibold">
                        Totales por periodo
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <select
                          className="rounded-xl border border-amber-100/70 px-3 py-1.5 text-sm outline-none dark:border-slate-700"
                          value={periodMode}
                          onChange={(e) => {
                            setPeriodMode(e.target.value);
                            setPeriodShift(0);
                          }}
                        >
                          <option value="weekly">Semanal</option>
                          <option value="monthly">Mensual</option>
                        </select>
                        <button
                          type="button"
                          className="rounded-full border border-amber-200 p-1 hover:bg-amber-50 dark:border-slate-700 dark:hover:bg-slate-800"
                          onClick={() => setPeriodShift((s) => s + 1)}
                          title="Periodo anterior"
                        >
                          <Icon path={mdiChevronLeft} size={0.7} />
                        </button>
                        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs dark:bg-slate-800">
                          {activeRangeLabel}
                        </span>
                        <button
                          type="button"
                          className="rounded-full border border-amber-200 p-1 hover:bg-amber-50 disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800"
                          disabled={periodShift === 0}
                          onClick={() =>
                            setPeriodShift((s) => Math.max(0, s - 1))
                          }
                          title="Periodo siguiente"
                        >
                          <Icon path={mdiChevronRight} size={0.7} />
                        </button>
                      </div>
                    </div>
                    <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-4">
                      <div className="rounded-2xl bg-amber-50 p-4 dark:bg-slate-800/60">
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          Total del periodo
                        </div>
                        <div className="mt-1 text-xl font-bold text-amber-700 dark:text-amber-300">
                          ${Number(weekStats.total || 0).toFixed(2)}
                        </div>
                      </div>
                      <div className="rounded-2xl bg-amber-50 p-4 dark:bg-slate-800/60">
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          Dias con ventas
                        </div>
                        <div className="mt-1 text-xl font-bold text-amber-700 dark:text-amber-300">
                          {weekStats.days?.length || 0}
                        </div>
                      </div>
                      <div className="rounded-2xl bg-amber-50 p-4 dark:bg-slate-800/60">
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          Ganancia del periodo
                        </div>
                        <div className="mt-1 text-xl font-bold text-amber-700 dark:text-amber-300">
                          {showProfit ? (
                            <>${Number(weekStats.profit || 0).toFixed(2)}</>
                          ) : (
                            <span className="tracking-widest text-slate-400">
                              ••••••
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="rounded-2xl bg-amber-50 p-4 dark:bg-slate-800/60">
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          Promedio diario
                        </div>
                        <div className="mt-1 text-xl font-bold text-amber-700 dark:text-amber-300">
                          $
                          {weekStats.days?.length
                            ? (
                                Number(weekStats.total || 0) /
                                weekStats.days.length
                              ).toFixed(2)
                            : "0.00"}
                        </div>
                      </div>
                    </div>
                    {weekStats.days?.length ? (
                      <div className="max-h-[28vh] overflow-y-auto rounded-2xl border border-amber-100/70 dark:border-slate-800">
                        <table className="min-w-full text-left text-sm">
                          <thead className="sticky top-0 bg-amber-50 text-amber-900 dark:bg-slate-800 dark:text-amber-200">
                            <tr>
                              <th className="px-4 py-2">Dia</th>
                              <th className="px-4 py-2">Total</th>
                              <th className="px-4 py-2">Ganancia</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-amber-100/70 dark:divide-slate-800">
                            {weekStats.days.map((row, idx) => (
                              <tr
                                key={`week-${row.day}-${idx}`}
                                className="hover:bg-amber-50/60 dark:hover:bg-slate-800/50"
                              >
                                <td className="px-4 py-2">
                                  {new Date(row.day).toLocaleDateString()}
                                </td>
                                <td className="px-4 py-2">
                                  ${Number(row.total || 0).toFixed(2)}
                                </td>
                                <td className="px-4 py-2">
                                  {showProfit ? (
                                    <span className="text-emerald-600 dark:text-emerald-400">
                                      ${Number(row.profit || 0).toFixed(2)}
                                    </span>
                                  ) : (
                                    <span className="tracking-widest text-slate-400">
                                      ••••••
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">
                        Sin datos para el periodo seleccionado.
                      </p>
                    )}
                  </div>

                  <div className="rounded-3xl border border-amber-100/70 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
                    <div className="mb-4 text-lg font-semibold">Reestock</div>
                    {stats.lowStock?.length ? (
                      <div className="grid gap-3 md:grid-cols-2">
                        {stats.lowStock.map((item) => {
                          const lowLimit = stats.thresholds?.low ?? 10;
                          const criticalLimit = stats.thresholds?.critical ?? 3;
                          const isCritical =
                            Number(item.stock) <= criticalLimit;
                          const styleClass = isCritical
                            ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300"
                            : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-300";

                          return (
                            <div
                              key={item.id}
                              className={`rounded-2xl border px-4 py-3 text-sm ${styleClass}`}
                            >
                              <div className="font-semibold">{item.name}</div>
                              <div>
                                Stock: {item.stock} (limite {lowLimit})
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">
                        No hay items por reestock.
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          <Route
            path="/compras"
            element={
              token ? (
                <div className="space-y-6">
                  <div className="rounded-3xl border border-amber-100/70 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
                    <div className="mb-4 flex items-center gap-2 text-lg font-semibold">
                      <Icon path={mdiPackageVariantClosed} size={1} />
                      Registro de compras por paquete
                    </div>
                    <form
                      onSubmit={handleAddPackagePurchase}
                      className="grid gap-3 md:grid-cols-2"
                    >
                      <label className="grid gap-1 text-xs uppercase text-slate-500">
                        Producto existente
                        <select
                          className="rounded-2xl border border-amber-100/70 px-4 py-2 text-sm normal-case outline-none dark:border-slate-700"
                          value={purchaseForm.sweetId}
                          onChange={(event) =>
                            setPurchaseForm((prev) => ({
                              ...prev,
                              sweetId: event.target.value,
                            }))
                          }
                        >
                          <option value="">Seleccionar...</option>
                          {sortedSweets.map((sweet) => (
                            <option key={sweet.id} value={sweet.id}>
                              {sweet.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="grid gap-1 text-xs uppercase text-slate-500">
                        O agregar producto nuevo
                        <input
                          className="rounded-2xl border border-amber-100/70 px-4 py-2 text-sm normal-case outline-none dark:border-slate-700"
                          placeholder="Nombre producto"
                          value={purchaseForm.productName}
                          onChange={(event) =>
                            setPurchaseForm((prev) => ({
                              ...prev,
                              productName: event.target.value,
                            }))
                          }
                        />
                      </label>
                      <label className="grid gap-1 text-xs uppercase text-slate-500">
                        Lugar de compra
                        <select
                          className="rounded-2xl border border-amber-100/70 px-4 py-2 text-sm normal-case outline-none dark:border-slate-700"
                          value={purchaseForm.placeId}
                          onChange={(event) =>
                            setPurchaseForm((prev) => ({
                              ...prev,
                              placeId: event.target.value,
                            }))
                          }
                        >
                          <option value="">Seleccionar...</option>
                          {purchasePlaces.map((place) => (
                            <option key={place.id} value={place.id}>
                              {place.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="grid gap-1 text-xs uppercase text-slate-500">
                        Costo por paquete
                        <input
                          className="rounded-2xl border border-amber-100/70 px-4 py-2 text-sm normal-case outline-none dark:border-slate-700"
                          type="number"
                          step="0.01"
                          value={purchaseForm.packageCost}
                          onChange={(event) =>
                            setPurchaseForm((prev) => ({
                              ...prev,
                              packageCost: event.target.value,
                            }))
                          }
                        />
                      </label>
                      <button className="rounded-2xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 md:col-span-2">
                        Guardar compra
                      </button>
                    </form>
                  </div>

                  <div className="rounded-3xl border border-amber-100/70 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
                    <div className="mb-4 text-lg font-semibold">
                      Lugares de compra
                    </div>
                    <form onSubmit={handleAddPlace} className="mb-4 flex gap-2">
                      <input
                        className="flex-1 rounded-2xl border border-amber-100/70 px-4 py-2 text-sm outline-none dark:border-slate-700"
                        placeholder="Nuevo lugar"
                        value={newPlace}
                        onChange={(event) => setNewPlace(event.target.value)}
                      />
                      <button className="rounded-2xl border border-amber-200 px-4 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-50">
                        Agregar
                      </button>
                    </form>
                    <div className="flex flex-wrap gap-2">
                      {purchasePlaces.map((place) => (
                        <span
                          key={place.id}
                          className="rounded-full bg-amber-100 px-3 py-1 text-xs text-amber-800 dark:bg-slate-800 dark:text-amber-200"
                        >
                          {place.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-amber-100/70 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
                    <div className="mb-4 text-lg font-semibold">
                      Historial de compras por paquete
                    </div>
                    <div className="max-h-[50vh] overflow-y-auto rounded-2xl border border-amber-100/70 dark:border-slate-800">
                      <table className="min-w-full text-left text-sm">
                        <thead className="sticky top-0 bg-amber-50 text-amber-900 dark:bg-slate-800 dark:text-amber-200">
                          <tr>
                            <th className="px-4 py-2">Fecha</th>
                            <th className="px-4 py-2">Producto</th>
                            <th className="px-4 py-2">Lugar</th>
                            <th className="px-4 py-2">Costo paquete</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-amber-100/70 dark:divide-slate-800">
                          {packagePurchases.map((item) => (
                            <tr key={item.id}>
                              <td className="px-4 py-2">
                                {new Date(item.created_at).toLocaleString()}
                              </td>
                              <td className="px-4 py-2">{item.product_name}</td>
                              <td className="px-4 py-2">{item.place_name}</td>
                              <td className="px-4 py-2">
                                ${Number(item.package_cost).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                          {packagePurchases.length === 0 && (
                            <tr>
                              <td
                                className="px-4 py-4 text-center text-slate-500"
                                colSpan={4}
                              >
                                Sin compras registradas
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          <Route
            path="/recompensas"
            element={
              token ? (
                rewardsPanel
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          <Route
            path="/whatsapp"
            element={
              token ? (
                whatsappPanel
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          <Route
            path="*"
            element={<Navigate to={token ? "/" : "/login"} replace />}
          />
        </Routes>
      </main>

      <AnimatePresence>
        {movementModalOpen && selectedClient && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl rounded-3xl border border-amber-100/70 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="mb-4 text-lg font-semibold">
                {movementKind === "purchase"
                  ? "Registrar compra"
                  : "Registrar pago"}{" "}
                - {selectedClient.name}
              </div>
              <form
                onSubmit={handleMovementSubmit}
                className="max-h-[78vh] space-y-4 overflow-y-auto pr-1"
              >
                {movementKind === "purchase" && (
                  <div className="space-y-3">
                    {movementItems.map((item, index) => {
                      const selectedSweet = sweetById.get(String(item.sweetId));
                      const showLowStock =
                        selectedSweet && Number(selectedSweet.stock) <= 0;

                      return (
                        <div
                          key={index}
                          className="grid items-start gap-2 sm:grid-cols-[96px_minmax(0,1fr)_auto]"
                        >
                          <label className="grid gap-1 text-xs uppercase text-slate-500">
                            Cantidad
                            <input
                              className="w-full rounded-2xl border border-amber-100/70 bg-transparent px-3 py-2 text-sm normal-case outline-none dark:border-slate-700"
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(event) =>
                                updateMovementItem(
                                  index,
                                  "quantity",
                                  event.target.value,
                                )
                              }
                            />
                          </label>
                          <div className="min-w-0">
                            <label className="mb-1 block text-xs uppercase text-slate-500">
                              Dulce
                            </label>
                            <SweetCombobox
                              value={item.sweetId}
                              onChange={(val) =>
                                updateMovementItem(index, "sweetId", val)
                              }
                              sweets={sortedSweets}
                            />
                            {showLowStock && (
                              <div className="mt-1 text-xs text-amber-600">
                                Stock 0 - se registrara igual
                              </div>
                            )}
                          </div>
                          <div className="flex items-end">
                            <button
                              type="button"
                              onClick={() => removeMovementItem(index)}
                              className="rounded-xl border border-rose-200 p-2 text-rose-600 hover:bg-rose-50 disabled:opacity-40 dark:border-rose-800 dark:text-rose-300 dark:hover:bg-rose-900/20"
                              disabled={movementItems.length === 1}
                              title="Eliminar item"
                            >
                              <Icon path={mdiClose} size={0.7} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    <button
                      type="button"
                      onClick={addMovementItem}
                      className="rounded-2xl border border-amber-200 px-4 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-50"
                    >
                      Agregar otro dulce
                    </button>
                  </div>
                )}

                <div className="grid gap-2">
                  <label className="text-xs uppercase text-slate-500">
                    Monto
                  </label>
                  <input
                    className="rounded-2xl border border-amber-100/70 bg-transparent px-3 py-2 text-sm outline-none dark:border-slate-700"
                    type="number"
                    step="0.01"
                    placeholder="Monto"
                    value={
                      movementKind === "purchase" && usesItems
                        ? computedTotal.toFixed(2)
                        : movementAmount
                    }
                    onChange={(event) => setMovementAmount(event.target.value)}
                    disabled={movementKind === "purchase" && usesItems}
                  />
                  {movementKind === "purchase" && usesItems && (
                    <div className="text-xs text-slate-500">
                      Total calculado por items
                    </div>
                  )}
                </div>

                {movementKind === "purchase" && settings.rewards_enabled && (
                  <div className="rounded-2xl border border-amber-100/70 bg-amber-50/20 p-4 dark:border-slate-800 dark:bg-slate-900/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon path={mdiStar} size={0.8} className="text-amber-500" />
                        <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">Usar puntos disponibles</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={usePoints}
                          onChange={(e) => {
                            const active = e.target.checked;
                            setUsePoints(active);
                            if (active) {
                              const total = usesItems ? computedTotal : (Number(movementAmount) || 0);
                              const available = Number(selectedClient?.points || 0);
                              const defaultPoints = Math.min(available, total);
                              setPointsToUse(defaultPoints.toFixed(2));
                            } else {
                              setPointsToUse("");
                            }
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-amber-500"></div>
                      </label>
                    </div>
                    
                    {usePoints && (
                      <div className="grid gap-2 sm:grid-cols-2 items-center">
                        <div className="text-xs text-slate-500">
                          Disponibles: <span className="font-semibold text-slate-700 dark:text-slate-300">{Number(selectedClient?.points || 0).toFixed(1)} pts</span>
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max={Number(selectedClient?.points || 0)}
                            className="flex-1 w-full rounded-2xl border border-amber-100/70 bg-transparent px-3 py-1.5 text-sm outline-none dark:border-slate-700 text-slate-800 dark:text-slate-200"
                            placeholder="Cantidad de puntos"
                            value={pointsToUse}
                            onChange={(e) => {
                              const val = e.target.value;
                              setPointsToUse(val);
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const total = usesItems ? computedTotal : (Number(movementAmount) || 0);
                              const available = Number(selectedClient?.points || 0);
                              setPointsToUse(Math.min(available, total).toFixed(2));
                            }}
                            className="rounded-xl bg-amber-500 px-3 py-1 text-xs text-white hover:bg-amber-600 font-semibold"
                          >
                            Máx
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-amber-100/70 bg-amber-50/70 p-3 text-sm dark:border-slate-700 dark:bg-slate-800/70">
                    <div className="text-xs uppercase text-slate-500 font-semibold">
                      Saldo actual
                    </div>
                    <div className="font-semibold text-base mb-1">
                      ${Number(selectedClient?.total_debt || 0).toFixed(2)}
                    </div>
                    <div className="text-xs uppercase text-slate-500 font-semibold">
                      Saldo estimado tras guardar (preview)
                    </div>
                    <div
                      className={`font-semibold text-base ${
                        projectedClientBalance > 0
                          ? "text-rose-500"
                          : projectedClientBalance < 0
                            ? "text-emerald-500"
                            : "text-slate-900 dark:text-slate-100"
                      }`}
                    >
                      ${projectedClientBalance.toFixed(2)}
                    </div>
                  </div>

                  {movementKind === "purchase" ? (
                    <div className="rounded-2xl border border-amber-100/70 bg-amber-50/70 p-3 text-sm dark:border-slate-700 dark:bg-slate-800/70">
                      <div className="text-xs uppercase text-slate-500 font-semibold">Puntos actuales</div>
                      <div className="font-semibold flex items-center gap-1.5 text-base mb-1">
                        <Icon path={mdiStar} size={0.6} className="text-amber-500" />
                        {Number(selectedClient?.points || 0).toFixed(1)} pts
                      </div>
                      <div className="text-xs uppercase text-slate-500 font-semibold">Puntos tras esta compra (preview)</div>
                      <div className="font-semibold flex items-center gap-1.5 text-base">
                        <Icon path={mdiStar} size={0.6} className="text-amber-500" />
                        {projectedPoints.toFixed(1)} pts
                        {hasActiveRewards && (
                          <span className="text-amber-600 dark:text-amber-400 font-bold text-xs animate-pulse">
                            (tienes recompensas activas)
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-amber-100/70 bg-amber-50/70 p-3 text-sm dark:border-slate-700 dark:bg-slate-800/70">
                      <div className="text-xs uppercase text-slate-500 font-semibold">Puntos actuales</div>
                      <div className="font-semibold flex items-center gap-1.5 text-base mb-1">
                        <Icon path={mdiStar} size={0.6} className="text-amber-500" />
                        {Number(selectedClient?.points || 0).toFixed(1)} pts
                      </div>
                      <div className="text-xs uppercase text-slate-500 font-semibold">Puntos tras este pago (preview)</div>
                      <div className="font-semibold flex items-center gap-1.5 text-base">
                        <Icon path={mdiStar} size={0.6} className="text-amber-500" />
                        {projectedPoints.toFixed(1)} pts
                        {hasActiveRewards && (
                          <span className="text-amber-600 dark:text-amber-400 font-bold text-xs animate-pulse">
                            (tienes recompensas activas)
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 overflow-visible">
                  <button
                    type="button"
                    onClick={resetMovementModal}
                    className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold dark:border-slate-700"
                  >
                    Cancelar
                  </button>

                  {movementKind === "purchase" ? (
                    <div className="relative flex rounded-2xl overflow-visible">
                      <button
                        type="submit"
                        className="rounded-l-2xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 transition"
                      >
                        {payImmediately ? "Guardar y pagar" : "Guardar (Fiar)"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="rounded-r-2xl border-l border-amber-600 bg-amber-500 px-3 py-2 text-white hover:bg-amber-600 transition flex items-center justify-center"
                        title="Seleccionar modo de guardado"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {dropdownOpen && (
                        <div className="absolute right-0 bottom-full mb-2 z-50 min-w-[160px] rounded-xl border border-amber-100 bg-white p-1 shadow-lg dark:border-slate-800 dark:bg-slate-900">
                          <button
                            type="button"
                            onClick={() => {
                              setPayImmediately(false);
                              setDropdownOpen(false);
                            }}
                            className={`w-full rounded-lg px-3 py-2 text-left text-xs font-medium hover:bg-amber-50 dark:hover:bg-slate-800 ${!payImmediately ? "bg-amber-50 text-amber-800 dark:bg-slate-800 dark:text-amber-300" : "text-slate-700 dark:text-slate-300"}`}
                          >
                            Guardar (Fiar)
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setPayImmediately(true);
                              setDropdownOpen(false);
                            }}
                            className={`w-full rounded-lg px-3 py-2 text-left text-xs font-medium hover:bg-amber-50 dark:hover:bg-slate-800 ${payImmediately ? "bg-amber-50 text-amber-800 dark:bg-slate-800 dark:text-amber-300" : "text-slate-700 dark:text-slate-300"}`}
                          >
                            Guardar y pagar
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      className="rounded-2xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600"
                      type="submit"
                    >
                      Guardar
                    </button>
                  )}
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
        {cashSaleModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl rounded-3xl border border-amber-100/70 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="mb-4 text-lg font-semibold">
                Venta sin cliente
              </div>
              <form
                onSubmit={handleCashSaleSubmit}
                className="max-h-[78vh] space-y-4 overflow-y-auto pr-1"
              >
                <div className="space-y-3">
                  {cashSaleItems.map((item, index) => {
                    const selectedSweet = sweetById.get(String(item.sweetId));
                    const showLowStock =
                      selectedSweet && Number(selectedSweet.stock) <= 0;

                    return (
                      <div
                        key={index}
                        className="grid items-start gap-2 sm:grid-cols-[96px_minmax(0,1fr)_auto]"
                      >
                        <label className="grid gap-1 text-xs uppercase text-slate-500">
                          Cantidad
                          <input
                            className="w-full rounded-2xl border border-amber-100/70 bg-transparent px-3 py-2 text-sm normal-case outline-none dark:border-slate-700"
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(event) =>
                              updateCashSaleItem(
                                index,
                                "quantity",
                                event.target.value,
                              )
                            }
                          />
                        </label>
                        <div className="min-w-0">
                          <label className="mb-1 block text-xs uppercase text-slate-500">
                            Dulce
                          </label>
                          <SweetCombobox
                            value={item.sweetId}
                            onChange={(val) =>
                              updateCashSaleItem(index, "sweetId", val)
                            }
                            sweets={sortedSweets}
                          />
                          {showLowStock && (
                            <div className="mt-1 text-xs text-amber-600">
                              Stock 0 - se registrara igual
                            </div>
                          )}
                        </div>
                        <div className="flex items-end">
                          <button
                            type="button"
                            onClick={() => removeCashSaleItem(index)}
                            className="rounded-xl border border-rose-200 p-2 text-rose-600 hover:bg-rose-50 disabled:opacity-40 dark:border-rose-800 dark:text-rose-300 dark:hover:bg-rose-900/20"
                            disabled={cashSaleItems.length === 1}
                            title="Eliminar item"
                          >
                            <Icon path={mdiClose} size={0.7} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  <button
                    type="button"
                    onClick={addCashSaleItem}
                    className="rounded-2xl border border-amber-200 px-4 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-50"
                  >
                    Agregar otro dulce
                  </button>
                </div>

                <div className="grid gap-2">
                  <label className="text-xs uppercase text-slate-500">
                    Total
                  </label>
                  <input
                    className="rounded-2xl border border-amber-100/70 bg-transparent px-3 py-2 text-sm outline-none dark:border-slate-700"
                    type="text"
                    value={`$${cashSaleTotal.toFixed(2)}`}
                    disabled
                  />
                  {!cashSaleUsesItems && (
                    <div className="text-xs text-slate-500">
                      Selecciona al menos un producto
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={resetCashSaleModal}
                    className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold dark:border-slate-700"
                  >
                    Cancelar
                  </button>
                  <button
                    className="rounded-2xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600"
                    type="submit"
                  >
                    Registrar venta
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
        {movementDetailModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl rounded-3xl border border-amber-100/70 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="mb-2 text-lg font-semibold">
                Detalle de compra
              </div>
              <div className="mb-4 text-sm text-slate-500">
                {movementDetailTarget?.concept || "Compra"} -{" "}
                {movementDetailTarget
                  ? new Date(movementDetailTarget.created_at).toLocaleString()
                  : ""}
              </div>
              {movementDetailItems.length ? (
                <div className="overflow-hidden rounded-2xl border border-amber-100/70 dark:border-slate-800">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-amber-50 text-amber-900 dark:bg-slate-800 dark:text-amber-200">
                      <tr>
                        <th className="px-4 py-2">Dulce</th>
                        <th className="px-4 py-2">Cantidad</th>
                        <th className="px-4 py-2">Precio</th>
                        <th className="px-4 py-2">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-100/70 dark:divide-slate-800">
                      {movementDetailItems.map((item, idx) => (
                        <tr key={`${item.id}-${idx}`}>
                          <td className="px-4 py-2">{item.name}</td>
                          <td className="px-4 py-2">{item.quantity}</td>
                          <td className="px-4 py-2">
                            ${Number(item.unit_price).toFixed(2)}
                          </td>
                          <td className="px-4 py-2">
                            $
                            {(
                              Number(item.unit_price) *
                              Number(item.quantity || 0)
                            ).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-slate-500">Sin detalle.</p>
              )}
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={closeMovementDetail}
                  className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold dark:border-slate-700"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
        {clientModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-3xl border border-amber-100/70 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="mb-4 text-lg font-semibold flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon path={mdiAccountGroup} size={0.9} className="text-amber-500" />
                  <span>{editingClient ? "Editar Cliente" : "Nuevo Cliente"}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setClientModalOpen(false);
                    setEditingClient(null);
                  }}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Icon path={mdiClose} size={0.8} />
                </button>
              </div>

              {editingClient ? (
                <form onSubmit={handleUpdateClient} className="grid gap-3">
                  <label className="grid gap-1 text-xs uppercase text-slate-500 font-semibold">
                    Nombre
                    <input
                      className="w-full rounded-2xl border border-amber-100/70 bg-transparent px-4 py-2 text-sm normal-case text-inherit outline-none dark:border-slate-700"
                      placeholder="Nombre del cliente"
                      value={editingClient.name}
                      onChange={(e) => setEditingClient({ ...editingClient, name: e.target.value })}
                      required
                    />
                  </label>
                  <label className="grid gap-1 text-xs uppercase text-slate-500 font-semibold">
                    Teléfono (WhatsApp)
                    <input
                      className="w-full rounded-2xl border border-amber-100/70 bg-transparent px-4 py-2 text-sm normal-case text-inherit outline-none dark:border-slate-700"
                      placeholder="Ej. 4492777186"
                      value={editingClient.phone || ""}
                      onChange={(e) => setEditingClient({ ...editingClient, phone: e.target.value })}
                    />
                  </label>
                  <label className="grid gap-1 text-xs uppercase text-slate-500 font-semibold">
                    Saldo (+ o -)
                    <input
                      className="w-full rounded-2xl border border-amber-100/70 bg-transparent px-4 py-2 text-sm normal-case text-inherit outline-none dark:border-slate-700"
                      type="number"
                      step="0.01"
                      value={editingClient.total_debt}
                      onChange={(e) => setEditingClient({ ...editingClient, total_debt: e.target.value })}
                    />
                  </label>
                  <label className="grid gap-1 text-xs uppercase text-slate-500 font-semibold">
                    Puntos
                    <input
                      className="w-full rounded-2xl border border-amber-100/70 bg-transparent px-4 py-2 text-sm normal-case text-inherit outline-none dark:border-slate-700"
                      type="number"
                      step="0.1"
                      min="0"
                      value={editingClient.points}
                      onChange={(e) => setEditingClient({ ...editingClient, points: e.target.value })}
                    />
                  </label>
                  <div className="flex gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setClientModalOpen(false);
                        setEditingClient(null);
                      }}
                      className="flex-1 rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold dark:border-slate-700"
                    >
                      Cancelar
                    </button>
                    <button type="submit" className="flex-1 rounded-2xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600">
                      Actualizar
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleAddClient} className="grid gap-3">
                  <label className="grid gap-1 text-xs uppercase text-slate-500 font-semibold">
                    Nombre
                    <input
                      className="w-full rounded-2xl border border-amber-100/70 bg-transparent px-4 py-2 text-sm normal-case text-inherit outline-none dark:border-slate-700"
                      placeholder="Nombre del cliente"
                      value={newClient}
                      onChange={(e) => setNewClient(e.target.value)}
                      required
                    />
                  </label>
                  <label className="grid gap-1 text-xs uppercase text-slate-500 font-semibold">
                    Teléfono (WhatsApp)
                    <input
                      className="w-full rounded-2xl border border-amber-100/70 bg-transparent px-4 py-2 text-sm normal-case text-inherit outline-none dark:border-slate-700"
                      placeholder="Ej. 4492777186"
                      value={newClientPhone}
                      onChange={(e) => setNewClientPhone(e.target.value)}
                    />
                  </label>
                  <div className="flex gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setClientModalOpen(false)}
                      className="flex-1 rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold dark:border-slate-700"
                    >
                      Cancelar
                    </button>
                    <button type="submit" className="flex-1 rounded-2xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600">
                      Crear Cliente
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}

        {sweetModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-3xl border border-amber-100/70 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="mb-4 text-lg font-semibold flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon path={mdiCandycane} size={0.9} className="text-amber-500" />
                  <span>{editingSweet ? "Editar Dulce" : "Nuevo Dulce"}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSweetModalOpen(false);
                    setEditingSweet(null);
                  }}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Icon path={mdiClose} size={0.8} />
                </button>
              </div>

              <form onSubmit={editingSweet ? handleUpdateSweet : handleAddSweet} className="grid gap-3">
                <label className="grid gap-1 text-xs uppercase text-slate-500 font-semibold">
                  Nombre
                  <input
                    className="w-full rounded-2xl border border-amber-100/70 bg-transparent px-4 py-2 text-sm normal-case text-inherit outline-none dark:border-slate-700"
                    placeholder="Nombre del dulce"
                    value={editingSweet ? editingSweet.name : newSweet.name}
                    onChange={(e) =>
                      editingSweet
                        ? setEditingSweet({ ...editingSweet, name: e.target.value })
                        : setNewSweet({ ...newSweet, name: e.target.value })
                    }
                    required
                  />
                </label>
                <div className="grid gap-3 grid-cols-3">
                  <label className="grid gap-1 text-xs uppercase text-slate-500 font-semibold">
                    Costo
                    <input
                      className="w-full rounded-2xl border border-amber-100/70 bg-transparent px-4 py-2 text-sm normal-case text-inherit outline-none dark:border-slate-700"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={editingSweet ? editingSweet.purchase_price : newSweet.purchasePrice}
                      onChange={(e) =>
                        editingSweet
                          ? setEditingSweet({ ...editingSweet, purchase_price: e.target.value })
                          : setNewSweet({ ...newSweet, purchasePrice: e.target.value })
                      }
                      required
                    />
                  </label>
                  <label className="grid gap-1 text-xs uppercase text-slate-500 font-semibold">
                    Venta
                    <input
                      className="w-full rounded-2xl border border-amber-100/70 bg-transparent px-4 py-2 text-sm normal-case text-inherit outline-none dark:border-slate-700"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={editingSweet ? editingSweet.sale_price : newSweet.salePrice}
                      onChange={(e) =>
                        editingSweet
                          ? setEditingSweet({ ...editingSweet, sale_price: e.target.value })
                          : setNewSweet({ ...newSweet, salePrice: e.target.value })
                      }
                      required
                    />
                  </label>
                  <label className="grid gap-1 text-xs uppercase text-slate-500 font-semibold">
                    Stock
                    <input
                      className="w-full rounded-2xl border border-amber-100/70 bg-transparent px-4 py-2 text-sm normal-case text-inherit outline-none dark:border-slate-700"
                      type="number"
                      min="0"
                      placeholder="0"
                      value={editingSweet ? editingSweet.stock : newSweet.stock}
                      onChange={(e) =>
                        editingSweet
                          ? setEditingSweet({ ...editingSweet, stock: e.target.value })
                          : setNewSweet({ ...newSweet, stock: e.target.value })
                      }
                      required
                    />
                  </label>
                </div>
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSweetModalOpen(false);
                      setEditingSweet(null);
                    }}
                    className="flex-1 rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold dark:border-slate-700"
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="flex-1 rounded-2xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600">
                    {editingSweet ? "Actualizar" : "Agregar Dulce"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
