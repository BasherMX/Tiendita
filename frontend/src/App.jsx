import { useEffect, useState, useMemo } from "react";
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import Swal from "sweetalert2";

// Servicios y Utilidades
import {
  apiBase,
  getAuthToken,
  setAuthToken,
  authFetch,
} from "./services/api.js";
import { getWeeklyRange } from "./utils/dateUtils.js";

// Componentes
import Navbar from "./components/Navbar.jsx";
import PwaInstallToast from "./PwaInstallToast.jsx";

// Modales
import SweetModal from "./components/modals/SweetModal.jsx";
import ClientModal from "./components/modals/ClientModal.jsx";
import MovementModal from "./components/modals/MovementModal.jsx";
import RewardModal from "./components/modals/RewardModal.jsx";

// Páginas
import LoginPage from "./pages/LoginPage.jsx";
import PosPage from "./pages/PosPage.jsx";
import ClientsPage from "./pages/ClientsPage.jsx";
import InventoryPage from "./pages/InventoryPage.jsx";
import PurchasesPage from "./pages/PurchasesPage.jsx";
import RewardsPage from "./pages/RewardsPage.jsx";
import StatsPage from "./pages/StatsPage.jsx";
import WhatsappPage from "./pages/WhatsappPage.jsx";
import PublicClientView from "./pages/PublicClientView.jsx";

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  // Estado de Autenticación y Tema
  const [token, setToken] = useState(getAuthToken());
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

  // Estado Principal
  const [sweets, setSweets] = useState([]);
  const [clients, setClients] = useState([]);
  const [prices, setPrices] = useState([]);
  const [pricesQuery, setPricesQuery] = useState("");
  const [purchasePlaces, setPurchasePlaces] = useState([]);
  const [packagePurchases, setPackagePurchases] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [settings, setSettings] = useState({});
  const [whatsappStatus, setWhatsappStatus] = useState(null);

  // Estadísticas
  const [stats, setStats] = useState(null);
  const [salesRange, setSalesRange] = useState(getWeeklyRange(0));
  const [salesRangeShift, setSalesRangeShift] = useState(0);
  const [salesChart, setSalesChart] = useState([]);

  // Cliente Seleccionado y Movimientos
  const [selectedClient, setSelectedClient] = useState(null);
  const [movements, setMovements] = useState([]);
  const [loadingMovements, setLoadingMovements] = useState(false);

  // Modales
  const [sweetModalOpen, setSweetModalOpen] = useState(false);
  const [editingSweet, setEditingSweet] = useState(null);
  const [sweetForm, setSweetForm] = useState({
    name: "",
    purchasePrice: "",
    salePrice: "",
    stock: "0",
  });

  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [clientForm, setClientForm] = useState({
    name: "",
    phone: "",
    creditLimit: "",
    totalDebt: "0",
    points: "0",
  });

  const [movementModalOpen, setMovementModalOpen] = useState(false);
  const [movementKind, setMovementKind] = useState("purchase"); // "purchase" | "pay"

  const [rewardModalOpen, setRewardModalOpen] = useState(false);
  const [editingReward, setEditingReward] = useState(null);
  const [rewardForm, setRewardForm] = useState({
    name: "",
    pointsCost: "",
    stock: "0",
    sweetId: "",
  });

  // Manejo de tema Dark/Light
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Redirigir a inicio si ya hay token y está en login
  useEffect(() => {
    if (token && location.pathname === "/login") {
      navigate("/", { replace: true });
    }
  }, [token, location.pathname, navigate]);

  function handleAuthFail() {
    setToken("");
    setAuthToken("");
    navigate("/login");
  }

  // Carga de Datos
  useEffect(() => {
    loadPublicPrices();
    if (token) {
      loadSweets();
      loadClients();
      loadPurchasePlaces();
      loadPackagePurchases();
      loadRewards();
      loadSettings();
      loadStats();
      loadWhatsappStatus();
    }
  }, [token]);

  useEffect(() => {
    if (token && salesRange) {
      loadSalesChart();
    }
  }, [token, salesRange]);

  async function loadPublicPrices() {
    try {
      const res = await fetch(`${apiBase}/api/prices`);
      if (res.ok) setPrices(await res.json());
    } catch (e) {
      console.error(e);
    }
  }

  async function loadSweets() {
    try {
      const res = await authFetch(`${apiBase}/api/sweets`, {}, handleAuthFail);
      if (res && res.ok) setSweets(await res.json());
    } catch (e) {
      console.error(e);
    }
  }

  async function loadClients() {
    try {
      const res = await authFetch(`${apiBase}/api/clients`, {}, handleAuthFail);
      if (res && res.ok) {
        const data = await res.json();
        setClients(data);
        if (selectedClient) {
          const updated = data.find((c) => c.id === selectedClient.id);
          if (updated) setSelectedClient(updated);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function loadPurchasePlaces() {
    try {
      const res = await authFetch(
        `${apiBase}/api/purchase-places`,
        {},
        handleAuthFail,
      );
      if (res && res.ok) setPurchasePlaces(await res.json());
    } catch (e) {
      console.error(e);
    }
  }

  async function loadPackagePurchases() {
    try {
      const res = await authFetch(
        `${apiBase}/api/package-purchases`,
        {},
        handleAuthFail,
      );
      if (res && res.ok) setPackagePurchases(await res.json());
    } catch (e) {
      console.error(e);
    }
  }

  async function loadRewards() {
    try {
      const res = await authFetch(`${apiBase}/api/rewards`, {}, handleAuthFail);
      if (res && res.ok) setRewards(await res.json());
    } catch (e) {
      console.error(e);
    }
  }

  async function loadSettings() {
    try {
      const res = await authFetch(
        `${apiBase}/api/settings`,
        {},
        handleAuthFail,
      );
      if (res && res.ok) setSettings(await res.json());
    } catch (e) {
      console.error(e);
    }
  }

  async function loadWhatsappStatus() {
    try {
      const res = await authFetch(
        `${apiBase}/api/whatsapp/status`,
        {},
        handleAuthFail,
      );
      if (res && res.ok) setWhatsappStatus(await res.json());
    } catch (e) {
      console.error(e);
    }
  }

  async function loadStats() {
    try {
      const res = await authFetch(`${apiBase}/api/stats`, {}, handleAuthFail);
      if (res && res.ok) setStats(await res.json());
    } catch (e) {
      console.error(e);
    }
  }

  async function loadSalesChart() {
    try {
      const url = `${apiBase}/api/stats/sales?from=${salesRange.from}&to=${salesRange.to}`;
      const res = await authFetch(url, {}, handleAuthFail);
      if (res && res.ok) {
        const data = await res.json();
        setSalesChart(data.dailyTotals || []);
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function loadMovements(client) {
    setSelectedClient(client);
    setLoadingMovements(true);
    try {
      const res = await authFetch(
        `${apiBase}/api/clients/${client.id}/movements`,
        {},
        handleAuthFail,
      );
      if (res && res.ok) {
        setMovements(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMovements(false);
    }
  }

  function shiftSalesRange(step) {
    const nextShift = salesRangeShift + step;
    setSalesRangeShift(nextShift);
    setSalesRange(getWeeklyRange(nextShift));
  }

  // Operaciones de Autenticación
  async function handleLogin({ username, password }) {
    try {
      const res = await fetch(`${apiBase}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Credenciales incorrectas");

      setToken(data.token);
      setAuthToken(data.token);
      navigate("/precios");
    } catch (err) {
      Swal.fire("Error de acceso", err.message, "error");
    }
  }

  function handleLogout() {
    setToken("");
    setAuthToken("");
    setSelectedClient(null);
    navigate("/login");
  }

  // Operaciones de Ventas en Mostrador
  async function handleRegisterSale({ items, paymentMethod }) {
    try {
      const res = await authFetch(
        `${apiBase}/api/sales`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items, paymentMethod }),
        },
        handleAuthFail,
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al registrar venta");

      Swal.fire({
        icon: "success",
        title: "¡Venta Registrada!",
        text: `Total cobrado: $${Number(data.amount).toFixed(2)}`,
        timer: 1800,
        showConfirmButton: false,
      });

      loadSweets();
      loadStats();
      loadSalesChart();
      loadPublicPrices();
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  }

  // Operaciones de Clientes y Fiados
  function handleOpenNewClient() {
    setEditingClient(null);
    setClientForm({
      name: "",
      phone: "",
      creditLimit: "0",
      totalDebt: "0",
      points: "0",
    });
    setClientModalOpen(true);
  }

  function handleOpenEditClient(client) {
    setEditingClient(client);
    setClientForm({
      name: client.name,
      phone: client.phone || "",
      creditLimit: String(client.credit_limit || 0),
      totalDebt: String(client.total_debt || 0),
      points: String(client.points || 0),
    });
    setClientModalOpen(true);
  }

  async function handleSaveClient(e) {
    e.preventDefault();
    try {
      const url = editingClient
        ? `${apiBase}/api/clients/${editingClient.id}`
        : `${apiBase}/api/clients`;
      const method = editingClient ? "PUT" : "POST";

      const res = await authFetch(
        url,
        {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: clientForm.name,
            phone: clientForm.phone,
            credit_limit: Number(clientForm.creditLimit) || 0,
            totalDebt: Number(clientForm.totalDebt) || 0,
            points: Number(clientForm.points) || 0,
          }),
        },
        handleAuthFail,
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Error al guardar cliente");
      }

      setClientModalOpen(false);
      loadClients();
      Swal.fire("Guardado", "Cliente actualizado correctamente", "success");
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  }

  async function handleDeleteClient(client) {
    const confirm = await Swal.fire({
      title: `¿Eliminar a ${client.name}?`,
      text: "Se borrarán todos sus movimientos y su saldo.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (confirm.isConfirmed) {
      try {
        const res = await authFetch(
          `${apiBase}/api/clients/${client.id}`,
          { method: "DELETE" },
          handleAuthFail,
        );
        if (res.ok) {
          if (selectedClient?.id === client.id) setSelectedClient(null);
          loadClients();
          Swal.fire("Eliminado", "El cliente ha sido eliminado", "success");
        }
      } catch (e) {
        Swal.fire("Error", "No se pudo eliminar al cliente", "error");
      }
    }
  }

  function handleShareClientLink(client) {
    if (!client?.public_code) return;
    const url = `${window.location.origin}/c/${client.public_code}`;
    navigator.clipboard.writeText(url);
    Swal.fire({
      icon: "success",
      title: "¡Enlace Copiado!",
      text: `Enlace de estado de cuenta para ${client.name}`,
      timer: 1800,
      showConfirmButton: false,
    });
  }

  async function handleSendWhatsappStatement(client) {
    try {
      const res = await authFetch(
        `${apiBase}/api/clients/${client.id}/whatsapp-statement`,
        { method: "POST" },
        handleAuthFail,
      );
      const data = await res.json();
      if (data.waUrl) {
        Swal.fire({
          icon: data.warning ? "warning" : "success",
          title: data.warning ? "Atención" : "Enviado",
          text: data.message || "Estado de cuenta preparado.",
          showCancelButton: true,
          confirmButtonText: "Abrir WhatsApp",
          cancelButtonText: "Listo",
        }).then((result) => {
          if (result.isConfirmed) {
            window.open(data.waUrl, "_blank");
          }
        });
      }
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  }

  // Operaciones de Movimientos (Compras fiadas y Abonos)
  async function handleMovementSubmit(payload) {
    try {
      const endpoint = payload.movementKind === "pay" ? "pay" : "purchase";
      const res = await authFetch(
        `${apiBase}/api/clients/${selectedClient.id}/${endpoint}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: payload.amount,
            items: payload.items,
            payImmediately: payload.payImmediately,
            pointsUsed: payload.pointsToUse,
            paymentMethod: payload.paymentMethod,
          }),
        },
        handleAuthFail,
      );
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || "Error al registrar movimiento");

      setMovementModalOpen(false);
      loadMovements(selectedClient);
      loadClients();
      loadSweets();
      loadStats();

      Swal.fire({
        icon: "success",
        title: "¡Registrado!",
        text:
          payload.movementKind === "pay"
            ? "Abono guardado con éxito"
            : "Compra registrada",
        timer: 1800,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  }

  async function handleDeleteMovement(movement) {
    const { value: password } = await Swal.fire({
      title: "Confirmar eliminación",
      text: "Ingresa tu contraseña de administrador para cancelar este movimiento:",
      input: "password",
      inputPlaceholder: "Contraseña de admin",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Eliminar",
      cancelButtonText: "Cancelar",
    });

    if (password) {
      try {
        const res = await authFetch(
          `${apiBase}/api/clients/${selectedClient.id}/movements/${movement.id}`,
          {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ password }),
          },
          handleAuthFail,
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "No se pudo eliminar");

        loadMovements(selectedClient);
        loadClients();
        loadSweets();
        loadStats();
        Swal.fire("Eliminado", "El movimiento ha sido revertido", "success");
      } catch (err) {
        Swal.fire("Error", err.message, "error");
      }
    }
  }

  async function handleViewDebtBreakdown() {
    if (!selectedClient) return;
    try {
      const res = await authFetch(
        `${apiBase}/api/clients/${selectedClient.id}/debt-breakdown`,
        {},
        handleAuthFail,
      );
      if (!res.ok) throw new Error("No se pudo obtener el desglose");
      const data = await res.json();

      let breakdownHtml = `<div class="text-left text-xs space-y-2 max-h-64 overflow-y-auto">`;
      if (data.movements && data.movements.length > 0) {
        data.movements.forEach((mov) => {
          breakdownHtml += `
            <div class="border-b pb-1.5 dark:border-slate-700">
              <div class="flex justify-between font-bold">
                <span>${mov.concept}</span>
                <span class="text-rose-500">$${Number(mov.owed_amount || mov.amount).toFixed(2)}</span>
              </div>
              <div class="text-[11px] text-slate-400">
                ${new Date(mov.created_at).toLocaleString("es-MX")}
              </div>
            </div>`;
        });
      } else {
        breakdownHtml += `<p class="text-slate-500 text-center py-4">Este cliente no tiene saldo pendiente.</p>`;
      }
      breakdownHtml += `</div>`;

      Swal.fire({
        title: `Desglose de Deuda: ${selectedClient.name}`,
        html: breakdownHtml,
        confirmButtonText: "Cerrar",
      });
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  }

  // Operaciones de Dulces / Inventario
  function handleOpenNewSweet() {
    setEditingSweet(null);
    setSweetForm({ name: "", purchasePrice: "", salePrice: "", stock: "0" });
    setSweetModalOpen(true);
  }

  function handleOpenEditSweet(sweet) {
    setEditingSweet(sweet);
    setSweetForm({
      name: sweet.name,
      purchasePrice: String(sweet.purchase_price),
      salePrice: String(sweet.sale_price),
      stock: String(sweet.stock),
    });
    setSweetModalOpen(true);
  }

  async function handleSaveSweet(e) {
    e.preventDefault();
    try {
      const url = editingSweet
        ? `${apiBase}/api/sweets/${editingSweet.id}`
        : `${apiBase}/api/sweets`;
      const method = editingSweet ? "PUT" : "POST";

      const res = await authFetch(
        url,
        {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: sweetForm.name,
            purchasePrice: Number(sweetForm.purchasePrice),
            salePrice: Number(sweetForm.salePrice),
            stock: Number(sweetForm.stock),
          }),
        },
        handleAuthFail,
      );
      if (!res.ok) throw new Error("Error al guardar dulce");

      setSweetModalOpen(false);
      loadSweets();
      loadPublicPrices();
      Swal.fire("Guardado", "Dulce actualizado", "success");
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  }

  async function handleDeleteSweet(sweet) {
    const confirm = await Swal.fire({
      title: `¿Eliminar ${sweet.name}?`,
      text: "Esta acción no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Eliminar",
      cancelButtonText: "Cancelar",
    });

    if (confirm.isConfirmed) {
      try {
        const res = await authFetch(
          `${apiBase}/api/sweets/${sweet.id}`,
          { method: "DELETE" },
          handleAuthFail,
        );
        if (res.ok) {
          loadSweets();
          loadPublicPrices();
          Swal.fire("Eliminado", "Dulce eliminado del catálogo", "success");
        }
      } catch (err) {
        Swal.fire("Error", "No se pudo eliminar", "error");
      }
    }
  }

  // Operaciones de Compras / Proveedores
  async function handleAddPurchasePlace(name) {
    try {
      const res = await authFetch(
        `${apiBase}/api/purchase-places`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        },
        handleAuthFail,
      );
      if (res.ok) {
        loadPurchasePlaces();
        Swal.fire("Agregado", "Lugar guardado", "success");
      }
    } catch (e) {
      Swal.fire("Error", "No se pudo agregar lugar", "error");
    }
  }

  async function handleAddPurchaseTicket({ placeId, items }) {
    try {
      const res = await authFetch(
        `${apiBase}/api/package-purchases/ticket`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ placeId, items }),
        },
        handleAuthFail,
      );
      if (res.ok) {
        loadPackagePurchases();
        loadSweets();
        Swal.fire(
          "Guardado",
          "Ticket de reestock procesado y stock actualizado",
          "success",
        );
      }
    } catch (e) {
      Swal.fire("Error", "No se pudo guardar ticket", "error");
    }
  }

  // Operaciones de Recompensas
  function handleOpenNewReward() {
    setEditingReward(null);
    setRewardForm({ name: "", pointsCost: "", stock: "0", sweetId: "" });
    setRewardModalOpen(true);
  }

  function handleOpenEditReward(reward) {
    setEditingReward(reward);
    setRewardForm({
      name: reward.name,
      pointsCost: String(reward.points_cost),
      stock: String(reward.stock),
      sweetId: String(reward.sweet_id || ""),
    });
    setRewardModalOpen(true);
  }

  async function handleSaveReward(e) {
    e.preventDefault();
    try {
      const url = editingReward
        ? `${apiBase}/api/rewards/${editingReward.id}`
        : `${apiBase}/api/rewards`;
      const method = editingReward ? "PUT" : "POST";

      const res = await authFetch(
        url,
        {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: rewardForm.name,
            pointsCost: Number(rewardForm.pointsCost),
            stock: Number(rewardForm.stock),
            sweetId: rewardForm.sweetId || null,
          }),
        },
        handleAuthFail,
      );
      if (res.ok) {
        setRewardModalOpen(false);
        loadRewards();
        Swal.fire("Guardado", "Premio actualizado", "success");
      }
    } catch (e) {
      Swal.fire("Error", "No se pudo guardar premio", "error");
    }
  }

  async function handleDeleteReward(id) {
    try {
      const res = await authFetch(
        `${apiBase}/api/rewards/${id}`,
        { method: "DELETE" },
        handleAuthFail,
      );
      if (res.ok) {
        loadRewards();
        Swal.fire("Eliminado", "Premio eliminado", "success");
      }
    } catch (e) {
      Swal.fire("Error", "No se pudo eliminar premio", "error");
    }
  }

  async function handleRedeemReward({ clientId, sweetId, pointsCost }) {
    try {
      const res = await authFetch(
        `${apiBase}/api/clients/${clientId}/redeem`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sweetId, pointsCost }),
        },
        handleAuthFail,
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "No se pudo canjear");

      loadClients();
      loadRewards();
      loadSweets();
      Swal.fire(
        "¡Canje Exitoso!",
        "Se descontaron los puntos y se entregó el premio",
        "success",
      );
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  }

  // Operaciones de Ajustes
  async function handleSaveSettings(payload) {
    try {
      const res = await authFetch(
        `${apiBase}/api/settings`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
        handleAuthFail,
      );
      if (res.ok) {
        setSettings(await res.json());
        loadWhatsappStatus();
        Swal.fire(
          "Ajustes Guardados",
          "Los parámetros han sido actualizados",
          "success",
        );
      }
    } catch (e) {
      Swal.fire("Error", "No se pudieron guardar ajustes", "error");
    }
  }

  // Operaciones de Cambio de Contraseña
  async function handleChangePassword({ currentPassword, newPassword }) {
    try {
      const res = await authFetch(
        `${apiBase}/api/auth/change-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ currentPassword, newPassword }),
        },
        handleAuthFail,
      );
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || "Error al cambiar contraseña");

      Swal.fire("¡Éxito!", data.message, "success");
      return true;
    } catch (err) {
      Swal.fire("Error", err.message, "error");
      return false;
    }
  }

  // Si la ruta es pública para clientes (/c/:code), renderizar directamente
  if (location.pathname.startsWith("/c/")) {
    return (
      <Routes>
        <Route path="/c/:code" element={<PublicClientView />} />
      </Routes>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-amber-100 text-slate-800 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-slate-100">
      <Navbar
        token={token}
        theme={theme}
        setTheme={setTheme}
        onLogout={handleLogout}
        systemVersion="1.4.0"
      />

      <main className="mx-auto max-w-6xl px-4 py-8">
        <Routes>
          <Route
            path="/login"
            element={
              <LoginPage
                onLogin={handleLogin}
                prices={prices}
                pricesQuery={pricesQuery}
                setPricesQuery={setPricesQuery}
              />
            }
          />

          <Route
            path="/"
            element={
              token ? (
                <PosPage
                  sweets={sweets}
                  prices={prices}
                  pricesQuery={pricesQuery}
                  setPricesQuery={setPricesQuery}
                  onRegisterSale={handleRegisterSale}
                />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          <Route
            path="/precios"
            element={
              token ? (
                <PosPage
                  sweets={sweets}
                  prices={prices}
                  pricesQuery={pricesQuery}
                  setPricesQuery={setPricesQuery}
                  onRegisterSale={handleRegisterSale}
                />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          <Route
            path="/clientes"
            element={
              token ? (
                <ClientsPage
                  clients={clients}
                  selectedClient={selectedClient}
                  movements={movements}
                  loadingMovements={loadingMovements}
                  onSelectClient={loadMovements}
                  onNewClient={handleOpenNewClient}
                  onEditClient={handleOpenEditClient}
                  onDeleteClient={handleDeleteClient}
                  onOpenPurchaseModal={() => {
                    setMovementKind("purchase");
                    setMovementModalOpen(true);
                  }}
                  onOpenPayModal={() => {
                    setMovementKind("pay");
                    setMovementModalOpen(true);
                  }}
                  onShareLink={handleShareClientLink}
                  onSendWhatsappStatement={handleSendWhatsappStatement}
                  onDeleteMovement={handleDeleteMovement}
                  onViewDebtBreakdown={handleViewDebtBreakdown}
                />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          <Route
            path="/inventario"
            element={
              token ? (
                <InventoryPage
                  sweets={sweets}
                  sweetStats={stats}
                  onNewSweet={handleOpenNewSweet}
                  onEditSweet={handleOpenEditSweet}
                  onDeleteSweet={handleDeleteSweet}
                />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          <Route
            path="/compras"
            element={
              token ? (
                <PurchasesPage
                  purchasePlaces={purchasePlaces}
                  packagePurchases={packagePurchases}
                  sweets={sweets}
                  onAddPlace={handleAddPurchasePlace}
                  onAddPurchaseTicket={handleAddPurchaseTicket}
                />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          <Route
            path="/recompensas"
            element={
              token ? (
                <RewardsPage
                  rewards={rewards}
                  clients={clients}
                  onNewReward={handleOpenNewReward}
                  onEditReward={handleOpenEditReward}
                  onDeleteReward={handleDeleteReward}
                  onRedeemReward={handleRedeemReward}
                />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          <Route
            path="/estadisticas"
            element={
              token ? (
                <StatsPage
                  stats={stats}
                  salesChart={salesChart}
                  salesRange={salesRange}
                  shiftSalesRange={shiftSalesRange}
                />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          <Route
            path="/whatsapp"
            element={
              token ? (
                <WhatsappPage
                  settings={settings}
                  whatsappStatus={whatsappStatus}
                  onSaveSettings={handleSaveSettings}
                  onChangePassword={handleChangePassword}
                />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          <Route
            path="*"
            element={<Navigate to={token ? "/precios" : "/login"} replace />}
          />
        </Routes>
      </main>

      {/* Modales Globales */}
      <SweetModal
        isOpen={sweetModalOpen}
        onClose={() => setSweetModalOpen(false)}
        editingSweet={editingSweet}
        sweetForm={sweetForm}
        setSweetForm={setSweetForm}
        onSubmit={handleSaveSweet}
      />

      <ClientModal
        isOpen={clientModalOpen}
        onClose={() => setClientModalOpen(false)}
        editingClient={editingClient}
        clientForm={clientForm}
        setClientForm={setClientForm}
        onSubmit={handleSaveClient}
      />

      <MovementModal
        isOpen={movementModalOpen}
        onClose={() => setMovementModalOpen(false)}
        selectedClient={selectedClient}
        movementKind={movementKind}
        sweets={sweets}
        onSubmit={handleMovementSubmit}
      />

      <RewardModal
        isOpen={rewardModalOpen}
        onClose={() => setRewardModalOpen(false)}
        editingReward={editingReward}
        rewardForm={rewardForm}
        setRewardForm={setRewardForm}
        sweets={sweets}
        onSubmit={handleSaveReward}
      />

      <PwaInstallToast />
    </div>
  );
}
