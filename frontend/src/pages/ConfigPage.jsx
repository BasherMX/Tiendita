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
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header con botón de bloqueo */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-amber-100/70 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-amber-100 p-3 text-amber-600 dark:bg-slate-800 dark:text-amber-400">
            <Icon path={mdiCog} size={1.2} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">
              Panel de Configuración
            </h1>
            <p className="text-xs text-slate-500">
              Administra datos del negocio, WhatsApp, programa de puntos y
              seguridad.
            </p>
          </div>
        </div>

        {onLockConfig && (
          <button
            onClick={onLockConfig}
            className="flex items-center gap-1.5 rounded-2xl border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition"
            title="Bloquear panel de configuración"
          >
            <Icon path={mdiLock} size={0.7} />
            Bloquear Panel
          </button>
        )}
      </div>

      {/* Selector de Sub-secciones */}
      <div className="flex flex-wrap gap-2 rounded-2xl bg-amber-50/70 p-1.5 dark:bg-slate-800/60 text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveTab("general")}
          className={`flex items-center gap-1.5 rounded-xl px-4 py-2 transition ${
            activeTab === "general"
              ? "bg-white text-amber-900 shadow-sm dark:bg-slate-700 dark:text-amber-300"
              : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          <Icon path={mdiBank} size={0.75} />
          Negocio y Banco
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("whatsapp")}
          className={`flex items-center gap-1.5 rounded-xl px-4 py-2 transition ${
            activeTab === "whatsapp"
              ? "bg-white text-amber-900 shadow-sm dark:bg-slate-700 dark:text-amber-300"
              : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          <Icon path={mdiWhatsapp} size={0.75} />
          WhatsApp API
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("rewards")}
          className={`flex items-center gap-1.5 rounded-xl px-4 py-2 transition ${
            activeTab === "rewards"
              ? "bg-white text-amber-900 shadow-sm dark:bg-slate-700 dark:text-amber-300"
              : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          <Icon path={mdiStarOutline} size={0.75} />
          Programa de Puntos
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("security")}
          className={`flex items-center gap-1.5 rounded-xl px-4 py-2 transition ${
            activeTab === "security"
              ? "bg-white text-amber-900 shadow-sm dark:bg-slate-700 dark:text-amber-300"
              : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          <Icon path={mdiLockOutline} size={0.75} />
          Seguridad y Contraseña
        </button>
      </div>

      {/* Contenido según sub-sección */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. NEGOCIO Y BANCO */}
        {activeTab === "general" && (
          <div className="rounded-3xl border border-amber-100/70 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 space-y-4">
            <div className="flex items-center gap-2 text-base font-bold text-slate-800 dark:text-slate-100">
              <Icon path={mdiBank} size={0.9} className="text-amber-500" />
              Datos del Negocio y Transferencias
            </div>
            <p className="text-xs text-slate-500">
              Información que se muestra a los clientes al compartirles su
              estado de cuenta y para recepción de pagos.
            </p>

            <div className="grid gap-4 sm:grid-cols-2 pt-2">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                  Cuenta CLABE (para que tus clientes transfieran)
                </label>
                <input
                  className="w-full rounded-2xl border border-amber-100/70 bg-transparent px-4 py-2.5 text-sm outline-none dark:border-slate-700 dark:text-slate-100 font-mono font-bold"
                  placeholder="646990403801118437"
                  value={form.bank_clabe}
                  onChange={(e) =>
                    setForm({ ...form, bank_clabe: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                  Teléfono de Atención WhatsApp (Negocio)
                </label>
                <input
                  className="w-full rounded-2xl border border-amber-100/70 bg-transparent px-4 py-2.5 text-sm outline-none dark:border-slate-700 dark:text-slate-100 font-mono"
                  placeholder="523346502871"
                  value={form.business_phone}
                  onChange={(e) =>
                    setForm({ ...form, business_phone: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="submit"
                className="rounded-2xl bg-amber-500 px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-amber-600 transition"
              >
                Guardar Datos de Negocio
              </button>
            </div>
          </div>
        )}

        {/* 2. WHATSAPP */}
        {activeTab === "whatsapp" && (
          <div className="space-y-6">
            <div className="rounded-3xl border border-amber-100/70 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                    <Icon path={mdiWhatsapp} size={1.2} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
                      Estado del Servicio WhatsApp
                    </h2>
                    <p className="text-xs text-slate-500">
                      Envío automático de tickets y estados de cuenta a tus
                      clientes.
                    </p>
                  </div>
                </div>

                <div
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                    isConnected
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                      : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                  }`}
                >
                  <Icon
                    path={isConnected ? mdiCheckCircle : mdiCloseCircle}
                    size={0.6}
                  />
                  {isConnected ? "Conectado" : "Configurado"}
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-amber-100/70 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 space-y-4">
              <div className="text-base font-bold text-slate-800 dark:text-slate-100">
                Credenciales de WhatsApp (Meta Cloud API Oficial)
              </div>

              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                    Meta Phone Number ID
                  </label>
                  <input
                    className="w-full rounded-2xl border border-amber-100/70 bg-transparent px-4 py-2.5 text-sm outline-none dark:border-slate-700 dark:text-slate-100 font-mono"
                    placeholder="ID numérico del número de teléfono en Meta Developer"
                    value={form.meta_phone_number_id}
                    onChange={(e) =>
                      setForm({ ...form, meta_phone_number_id: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                    Meta WhatsApp Token (Permanente)
                  </label>
                  <input
                    type="password"
                    className="w-full rounded-2xl border border-amber-100/70 bg-transparent px-4 py-2.5 text-sm outline-none dark:border-slate-700 dark:text-slate-100 font-mono"
                    placeholder="EAA..."
                    value={form.meta_whatsapp_token}
                    onChange={(e) =>
                      setForm({ ...form, meta_whatsapp_token: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <button
                  type="submit"
                  className="rounded-2xl bg-amber-500 px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-amber-600 transition"
                >
                  Guardar Credenciales WhatsApp
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 3. RECOMPENSAS */}
        {activeTab === "rewards" && (
          <div className="rounded-3xl border border-amber-100/70 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 space-y-4">
            <div className="flex items-center gap-2 text-base font-bold text-slate-800 dark:text-slate-100">
              <Icon
                path={mdiStarOutline}
                size={0.9}
                className="text-amber-500"
              />
              Configuración del Programa de Puntos
            </div>
            <p className="text-xs text-slate-500">
              Define el porcentaje de compras y pagos que se convierte en puntos
              para tus clientes.
            </p>

            <div className="grid gap-4 sm:grid-cols-2 pt-2">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                  Factor de Puntos (ej. 0.10 = 10% de lo comprado se vuelve
                  puntos)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  className="w-full rounded-2xl border border-amber-100/70 bg-transparent px-4 py-2.5 text-sm outline-none dark:border-slate-700 dark:text-slate-100 font-mono"
                  value={form.reward_factor}
                  onChange={(e) =>
                    setForm({ ...form, reward_factor: e.target.value })
                  }
                />
              </div>

              <div className="flex items-center pt-5">
                <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.rewards_enabled}
                    onChange={(e) =>
                      setForm({ ...form, rewards_enabled: e.target.checked })
                    }
                    className="h-4 w-4 rounded text-amber-500 focus:ring-amber-400"
                  />
                  Activar acumulación de puntos en compras y abonos
                </label>
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="submit"
                className="rounded-2xl bg-amber-500 px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-amber-600 transition"
              >
                Guardar Configuración de Puntos
              </button>
            </div>
          </div>
        )}

        {/* 4. SEGURIDAD Y CONTRASEÑA */}
        {activeTab === "security" && (
          <div className="rounded-3xl border border-amber-100/70 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 space-y-4">
            <div className="flex items-center gap-2 text-base font-bold text-slate-800 dark:text-slate-100">
              <Icon
                path={mdiShieldCheckOutline}
                size={0.9}
                className="text-amber-500"
              />
              Seguridad: Cambiar Contraseña de Administrador
            </div>
            <p className="text-xs text-slate-500">
              Esta contraseña es la que utilizas para ingresar al sistema,
              entrar a este panel de configuración y autorizar la cancelación de
              movimientos.
            </p>

            <div className="grid gap-3 sm:grid-cols-3 pt-2">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                  Contraseña Actual
                </label>
                <input
                  type="password"
                  className="w-full rounded-2xl border border-amber-100/70 bg-transparent px-4 py-2.5 text-sm outline-none dark:border-slate-700 dark:text-slate-100"
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
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                  Nueva Contraseña
                </label>
                <input
                  type="password"
                  className="w-full rounded-2xl border border-amber-100/70 bg-transparent px-4 py-2.5 text-sm outline-none dark:border-slate-700 dark:text-slate-100"
                  placeholder="Mínimo 4 caracteres"
                  value={passForm.newPassword}
                  onChange={(e) =>
                    setPassForm({ ...passForm, newPassword: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                  Confirmar Contraseña
                </label>
                <input
                  type="password"
                  className="w-full rounded-2xl border border-amber-100/70 bg-transparent px-4 py-2.5 text-sm outline-none dark:border-slate-700 dark:text-slate-100"
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

            <div className="flex justify-end pt-3">
              <button
                type="button"
                onClick={handlePasswordSubmit}
                className="rounded-2xl border border-amber-300 bg-amber-50 px-6 py-2.5 text-xs font-bold text-amber-900 hover:bg-amber-100 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200 transition"
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
