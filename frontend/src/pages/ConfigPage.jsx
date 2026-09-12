import { useState } from "react";
import Icon from "@mdi/react";
import {
  mdiWhatsapp,
  mdiCog,
  mdiCheckCircle,
  mdiCloseCircle,
  mdiLockOutline,
  mdiBank,
  mdiStarOutline,
  mdiShieldCheckOutline,
  mdiLock,
} from "@mdi/js";
import Swal from "sweetalert2";

export default function ConfigPage({
  settings = {},
  whatsappStatus = null,
  onSaveSettings,
  onChangePassword,
  onLockConfig,
}) {
  const [activeTab, setActiveTab] = useState("general"); // "general" | "whatsapp" | "rewards" | "security"

  const [passForm, setPassForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [form, setForm] = useState({
    whatsapp_enabled:
      settings.whatsapp_enabled !== false &&
      settings.whatsapp_enabled !== "false",
    whatsapp_provider: settings.whatsapp_provider || "meta",
    meta_whatsapp_token: settings.meta_whatsapp_token || "",
    meta_phone_number_id: settings.meta_phone_number_id || "",
    whatsapp_gateway_url: settings.whatsapp_gateway_url || "http://openwa:2785",
    whatsapp_api_key: settings.whatsapp_api_key || "",
    whatsapp_default_country: settings.whatsapp_default_country || "52",
    reward_factor:
      settings.reward_factor !== undefined
        ? String(settings.reward_factor)
        : "0.10",
    rewards_enabled:
      settings.rewards_enabled !== false &&
      settings.rewards_enabled !== "false",
    bank_clabe: settings.bank_clabe || "646990403801118437",
    business_phone: settings.business_phone || "523346502871",
    default_credit_limit:
      settings.default_credit_limit !== undefined
        ? String(settings.default_credit_limit)
        : "50",
  });

  function handleSubmit(e) {
    e.preventDefault();
    onSaveSettings(form);
  }

  async function handlePasswordSubmit() {
    if (!passForm.currentPassword || !passForm.newPassword) {
      Swal.fire(
        "Atención",
        "Ingresa la contraseña actual y la nueva contraseña.",
        "warning",
      );
      return;
    }
    if (passForm.newPassword !== passForm.confirmPassword) {
      Swal.fire(
        "Atención",
        "La nueva contraseña y su confirmación no coinciden.",
        "warning",
      );
      return;
    }
    if (passForm.newPassword.length < 4) {
      Swal.fire(
        "Atención",
        "La contraseña debe tener al menos 4 caracteres.",
        "warning",
      );
      return;
    }

    const ok = await onChangePassword({
      currentPassword: passForm.currentPassword,
      newPassword: passForm.newPassword,
    });
    if (ok) {
      setPassForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    }
  }

  const isConnected = whatsappStatus?.status === "CONNECTED";

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* Header con botón de bloqueo */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#E5E2DA] bg-[#FFFFFF] p-4 sm:p-6 shadow-xs dark:border-[#282C32] dark:bg-[#181B1E]">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-300">
            <Icon path={mdiCog} size={1} />
          </div>
          <div>
            <h1 className="text-lg font-black text-[#1C1917] dark:text-[#F3F2EE] leading-tight">
              Parámetros del Sistema
            </h1>
            <p className="text-[11px] text-[#78716C] dark:text-[#9CA3AF]">
              Ajustes de tienda, cobros, WhatsApp, puntos y claves de acceso
            </p>
          </div>
        </div>

        {onLockConfig && (
          <button
            onClick={onLockConfig}
            className="flex items-center gap-1.5 rounded-xl border border-[#E5E2DA] bg-[#FFFFFF] px-3.5 py-2 text-xs font-bold text-[#78716C] hover:bg-[#F7F6F2] hover:text-[#1C1917] dark:border-[#282C32] dark:bg-[#181B1E] dark:text-[#9CA3AF] dark:hover:bg-[#282C32] dark:hover:text-[#F3F2EE] transition"
            title="Bloquear panel de configuración"
          >
            <Icon path={mdiLock} size={0.65} />
            <span>Bloquear Panel</span>
          </button>
        )}
      </div>

      {/* Selector de Sub-secciones */}
      <div className="flex flex-wrap gap-1.5 rounded-xl border border-[#E5E2DA] bg-[#FFFFFF] p-1.5 text-xs font-bold dark:border-[#282C32] dark:bg-[#181B1E]">
        <button
          type="button"
          onClick={() => setActiveTab("general")}
          className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 transition ${
            activeTab === "general"
              ? "bg-amber-500/15 text-amber-950 dark:bg-amber-400/20 dark:text-amber-200"
              : "text-[#78716C] hover:text-[#1C1917] dark:text-[#9CA3AF] dark:hover:text-[#F3F2EE]"
          }`}
        >
          <Icon path={mdiBank} size={0.65} />
          <span>Negocio y Banco</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("whatsapp")}
          className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 transition ${
            activeTab === "whatsapp"
              ? "bg-amber-500/15 text-amber-950 dark:bg-amber-400/20 dark:text-amber-200"
              : "text-[#78716C] hover:text-[#1C1917] dark:text-[#9CA3AF] dark:hover:text-[#F3F2EE]"
          }`}
        >
          <Icon path={mdiWhatsapp} size={0.65} />
          <span>WhatsApp API</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("rewards")}
          className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 transition ${
            activeTab === "rewards"
              ? "bg-amber-500/15 text-amber-950 dark:bg-amber-400/20 dark:text-amber-200"
              : "text-[#78716C] hover:text-[#1C1917] dark:text-[#9CA3AF] dark:hover:text-[#F3F2EE]"
          }`}
        >
          <Icon path={mdiStarOutline} size={0.65} />
          <span>Programa de Puntos</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("security")}
          className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 transition ${
            activeTab === "security"
              ? "bg-amber-500/15 text-amber-950 dark:bg-amber-400/20 dark:text-amber-200"
              : "text-[#78716C] hover:text-[#1C1917] dark:text-[#9CA3AF] dark:hover:text-[#F3F2EE]"
          }`}
        >
          <Icon path={mdiShieldCheckOutline} size={0.65} />
          <span>Seguridad</span>
        </button>
      </div>

      {/* Contenido según sub-sección */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 1. NEGOCIO Y BANCO */}
        {activeTab === "general" && (
          <div className="rounded-2xl border border-[#E5E2DA] bg-[#FFFFFF] p-4 sm:p-6 shadow-xs dark:border-[#282C32] dark:bg-[#181B1E] space-y-4">
            <div className="border-b border-[#E5E2DA] pb-3 dark:border-[#282C32]">
              <div className="flex items-center gap-2 text-sm font-bold text-[#1C1917] dark:text-[#F3F2EE]">
                <Icon path={mdiBank} size={0.75} className="text-amber-600" />
                <span>Datos del Negocio y Transferencias</span>
              </div>
              <p className="text-[11px] text-[#78716C] dark:text-[#9CA3AF] mt-0.5">
                Información mostrada a los clientes para recibir transferencias
                bancarias directas
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 pt-1">
              <div>
                <label className="mb-1 block text-[11px] font-bold text-[#78716C] dark:text-[#9CA3AF]">
                  Cuenta CLABE (para transferencias SPEI)
                </label>
                <input
                  className="w-full rounded-xl border border-[#E5E2DA] bg-[#F7F6F2] px-3 py-2 text-xs outline-none dark:border-[#282C32] dark:bg-[#111315] text-[#1C1917] dark:text-[#F3F2EE] font-mono font-bold"
                  placeholder="646990403801118437"
                  value={form.bank_clabe}
                  onChange={(e) =>
                    setForm({ ...form, bank_clabe: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-bold text-[#78716C] dark:text-[#9CA3AF]">
                  Teléfono de Atención WhatsApp (con lada, ej. 5233...)
                </label>
                <input
                  className="w-full rounded-xl border border-[#E5E2DA] bg-[#F7F6F2] px-3 py-2 text-xs outline-none dark:border-[#282C32] dark:bg-[#111315] text-[#1C1917] dark:text-[#F3F2EE] font-mono"
                  placeholder="523346502871"
                  value={form.business_phone}
                  onChange={(e) =>
                    setForm({ ...form, business_phone: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-bold text-[#78716C] dark:text-[#9CA3AF]">
                  Límite Máximo de Crédito General ($)
                </label>
                <input
                  type="number"
                  step="5"
                  min="0"
                  className="w-full rounded-xl border border-[#E5E2DA] bg-[#F7F6F2] px-3 py-2 text-xs outline-none dark:border-[#282C32] dark:bg-[#111315] text-[#1C1917] dark:text-[#F3F2EE] font-mono font-bold"
                  placeholder="50"
                  value={form.default_credit_limit}
                  onChange={(e) =>
                    setForm({ ...form, default_credit_limit: e.target.value })
                  }
                />
                <p className="mt-1 text-[11px] text-[#78716C] dark:text-[#9CA3AF]">
                  Límite por defecto para todos los clientes (por defecto
                  $50.00). Si un cliente sobrepasa este monto aún puede fiar
                  dulces, pero se mostrará una alerta tras cada movimiento. Se
                  puede personalizar por cliente en la libreta.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-[#E5E2DA] dark:border-[#282C32]">
              <button
                type="submit"
                className="rounded-xl bg-amber-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-amber-700 active:scale-[0.98] transition"
              >
                Guardar Datos de Negocio
              </button>
            </div>
          </div>
        )}

        {/* 2. WHATSAPP */}
        {activeTab === "whatsapp" && (
          <div className="space-y-5">
            <div className="rounded-2xl border border-[#E5E2DA] bg-[#FFFFFF] p-4 sm:p-5 shadow-xs dark:border-[#282C32] dark:bg-[#181B1E]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-600/20">
                    <Icon path={mdiWhatsapp} size={0.8} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-[#1C1917] dark:text-[#F3F2EE]">
                      Estado de Conexión WhatsApp
                    </h2>
                    <p className="text-[11px] text-[#78716C] dark:text-[#9CA3AF]">
                      Envío directo de estados de cuenta vía WhatsApp Cloud API
                    </p>
                  </div>
                </div>

                <div
                  className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold ${
                    isConnected
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-600/20 dark:bg-emerald-950/60 dark:text-emerald-300"
                      : "bg-amber-50 text-amber-900 border border-amber-500/20 dark:bg-amber-950/60 dark:text-amber-300"
                  }`}
                >
                  <Icon
                    path={isConnected ? mdiCheckCircle : mdiCloseCircle}
                    size={0.6}
                  />
                  <span>{isConnected ? "Conectado" : "Configurado"}</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#E5E2DA] bg-[#FFFFFF] p-4 sm:p-6 shadow-xs dark:border-[#282C32] dark:bg-[#181B1E] space-y-4">
              <div className="border-b border-[#E5E2DA] pb-3 dark:border-[#282C32]">
                <h3 className="text-sm font-bold text-[#1C1917] dark:text-[#F3F2EE]">
                  Credenciales de WhatsApp (Meta Cloud API Oficial)
                </h3>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-[11px] font-bold text-[#78716C] dark:text-[#9CA3AF]">
                    Meta Phone Number ID
                  </label>
                  <input
                    className="w-full rounded-xl border border-[#E5E2DA] bg-[#F7F6F2] px-3 py-2 text-xs outline-none dark:border-[#282C32] dark:bg-[#111315] text-[#1C1917] dark:text-[#F3F2EE] font-mono"
                    placeholder="ID numérico en Meta Developer"
                    value={form.meta_phone_number_id}
                    onChange={(e) =>
                      setForm({ ...form, meta_phone_number_id: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-bold text-[#78716C] dark:text-[#9CA3AF]">
                    Meta WhatsApp Token (Permanente)
                  </label>
                  <input
                    type="password"
                    className="w-full rounded-xl border border-[#E5E2DA] bg-[#F7F6F2] px-3 py-2 text-xs outline-none dark:border-[#282C32] dark:bg-[#111315] text-[#1C1917] dark:text-[#F3F2EE] font-mono"
                    placeholder="EAA..."
                    value={form.meta_whatsapp_token}
                    onChange={(e) =>
                      setForm({ ...form, meta_whatsapp_token: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-[#E5E2DA] dark:border-[#282C32]">
                <button
                  type="submit"
                  className="rounded-xl bg-amber-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-amber-700 active:scale-[0.98] transition"
                >
                  Guardar Credenciales WhatsApp
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 3. RECOMPENSAS */}
        {activeTab === "rewards" && (
          <div className="rounded-2xl border border-[#E5E2DA] bg-[#FFFFFF] p-4 sm:p-6 shadow-xs dark:border-[#282C32] dark:bg-[#181B1E] space-y-4">
            <div className="border-b border-[#E5E2DA] pb-3 dark:border-[#282C32]">
              <div className="flex items-center gap-2 text-sm font-bold text-[#1C1917] dark:text-[#F3F2EE]">
                <Icon
                  path={mdiStarOutline}
                  size={0.75}
                  className="text-amber-600"
                />
                <span>Configuración de Puntos de Lealtad</span>
              </div>
              <p className="text-[11px] text-[#78716C] dark:text-[#9CA3AF] mt-0.5">
                Porcentaje de compras y abonos convertido en puntos para
                clientes
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 pt-1">
              <div>
                <label className="mb-1 block text-[11px] font-bold text-[#78716C] dark:text-[#9CA3AF]">
                  Factor de Puntos (ej. 0.10 = 10% del importe en puntos)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  className="w-full rounded-xl border border-[#E5E2DA] bg-[#F7F6F2] px-3 py-2 text-xs font-tabular outline-none dark:border-[#282C32] dark:bg-[#111315] text-[#1C1917] dark:text-[#F3F2EE]"
                  value={form.reward_factor}
                  onChange={(e) =>
                    setForm({ ...form, reward_factor: e.target.value })
                  }
                />
              </div>

              <div className="flex items-center pt-4">
                <label className="flex items-center gap-2.5 text-xs font-semibold text-[#1C1917] dark:text-[#F3F2EE] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.rewards_enabled}
                    onChange={(e) =>
                      setForm({ ...form, rewards_enabled: e.target.checked })
                    }
                    className="h-4 w-4 rounded text-amber-600 focus:ring-amber-400"
                  />
                  <span>
                    Habilitar acumulación de puntos en compras y pagos
                  </span>
                </label>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-[#E5E2DA] dark:border-[#282C32]">
              <button
                type="submit"
                className="rounded-xl bg-amber-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-amber-700 active:scale-[0.98] transition"
              >
                Guardar Configuración de Puntos
              </button>
            </div>
          </div>
        )}

        {/* 4. SEGURIDAD */}
        {activeTab === "security" && (
          <div className="rounded-2xl border border-[#E5E2DA] bg-[#FFFFFF] p-4 sm:p-6 shadow-xs dark:border-[#282C32] dark:bg-[#181B1E] space-y-4">
            <div className="border-b border-[#E5E2DA] pb-3 dark:border-[#282C32]">
              <div className="flex items-center gap-2 text-sm font-bold text-[#1C1917] dark:text-[#F3F2EE]">
                <Icon
                  path={mdiShieldCheckOutline}
                  size={0.75}
                  className="text-amber-600"
                />
                <span>Cambiar Contraseña de Administrador</span>
              </div>
              <p className="text-[11px] text-[#78716C] dark:text-[#9CA3AF] mt-0.5">
                Utilizada para ingresar al sistema y desbloquear configuraciones
                protegidas
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 pt-1">
              <div>
                <label className="mb-1 block text-[11px] font-bold text-[#78716C] dark:text-[#9CA3AF]">
                  Contraseña Actual
                </label>
                <input
                  type="password"
                  className="w-full rounded-xl border border-[#E5E2DA] bg-[#F7F6F2] px-3 py-2 text-xs outline-none dark:border-[#282C32] dark:bg-[#111315] text-[#1C1917] dark:text-[#F3F2EE]"
                  placeholder="••••••••"
                  value={passForm.currentPassword}
                  onChange={(e) =>
                    setPassForm({
                      ...passForm,
                      currentPassword: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-bold text-[#78716C] dark:text-[#9CA3AF]">
                  Nueva Contraseña
                </label>
                <input
                  type="password"
                  className="w-full rounded-xl border border-[#E5E2DA] bg-[#F7F6F2] px-3 py-2 text-xs outline-none dark:border-[#282C32] dark:bg-[#111315] text-[#1C1917] dark:text-[#F3F2EE]"
                  placeholder="Mínimo 4 caracteres"
                  value={passForm.newPassword}
                  onChange={(e) =>
                    setPassForm({ ...passForm, newPassword: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-bold text-[#78716C] dark:text-[#9CA3AF]">
                  Confirmar Contraseña
                </label>
                <input
                  type="password"
                  className="w-full rounded-xl border border-[#E5E2DA] bg-[#F7F6F2] px-3 py-2 text-xs outline-none dark:border-[#282C32] dark:bg-[#111315] text-[#1C1917] dark:text-[#F3F2EE]"
                  placeholder="Repite la contraseña"
                  value={passForm.confirmPassword}
                  onChange={(e) =>
                    setPassForm({
                      ...passForm,
                      confirmPassword: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-[#E5E2DA] dark:border-[#282C32]">
              <button
                type="button"
                onClick={handlePasswordSubmit}
                className="rounded-xl bg-amber-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-amber-700 active:scale-[0.98] transition"
              >
                Actualizar Contraseña
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
