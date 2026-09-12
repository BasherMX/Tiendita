import { useState } from "react";
import Icon from "@mdi/react";
import {
  mdiWhatsapp,
  mdiCog,
  mdiCheckCircle,
  mdiCloseCircle,
  mdiLockOutline,
} from "@mdi/js";
import Swal from "sweetalert2";

export default function WhatsappPage({
  settings = {},
  whatsappStatus = null,
  onSaveSettings,
  onChangePassword,
}) {
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
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Estado del Servicio */}
      <div className="rounded-3xl border border-amber-100/70 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <Icon path={mdiWhatsapp} size={1.2} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                Integración de WhatsApp
              </h2>
              <p className="text-xs text-slate-500">
                Envío automático de tickets y estados de cuenta a tus clientes.
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

      {/* Formulario de Configuración */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Parámetros del Negocio y Datos Bancarios */}
        <div className="rounded-3xl border border-amber-100/70 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 space-y-4">
          <div className="flex items-center gap-2 text-base font-bold text-slate-800 dark:text-slate-100">
            <Icon path={mdiCog} size={0.9} className="text-amber-500" />
            Datos del Negocio y Transferencias
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                Cuenta CLABE (para que tus clientes transfieran)
              </label>
              <input
                className="w-full rounded-2xl border border-amber-100/70 bg-transparent px-4 py-2 text-sm outline-none dark:border-slate-700 dark:text-slate-100 font-mono font-bold"
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
                className="w-full rounded-2xl border border-amber-100/70 bg-transparent px-4 py-2 text-sm outline-none dark:border-slate-700 dark:text-slate-100"
                placeholder="523346502871"
                value={form.business_phone}
                onChange={(e) =>
                  setForm({ ...form, business_phone: e.target.value })
                }
              />
            </div>
          </div>
        </div>

        {/* Parámetros de Recompensas */}
        <div className="rounded-3xl border border-amber-100/70 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 space-y-4">
          <div className="text-base font-bold text-slate-800 dark:text-slate-100">
            Configuración del Programa de Puntos
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
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
                className="w-full rounded-2xl border border-amber-100/70 bg-transparent px-4 py-2 text-sm outline-none dark:border-slate-700 dark:text-slate-100"
                value={form.reward_factor}
                onChange={(e) =>
                  setForm({ ...form, reward_factor: e.target.value })
                }
              />
            </div>

            <div className="flex items-center">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.rewards_enabled}
                  onChange={(e) =>
                    setForm({ ...form, rewards_enabled: e.target.checked })
                  }
                  className="rounded text-amber-500 focus:ring-amber-400"
                />
                Activar acumulación de puntos en compras y abonos
              </label>
            </div>
          </div>
        </div>

        {/* Parámetros de API de WhatsApp */}
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
                className="w-full rounded-2xl border border-amber-100/70 bg-transparent px-4 py-2 text-sm outline-none dark:border-slate-700 dark:text-slate-100"
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
                className="w-full rounded-2xl border border-amber-100/70 bg-transparent px-4 py-2 text-sm outline-none dark:border-slate-700 dark:text-slate-100 font-mono"
                placeholder="EAA..."
                value={form.meta_whatsapp_token}
                onChange={(e) =>
                  setForm({ ...form, meta_whatsapp_token: e.target.value })
                }
              />
            </div>
          </div>
        </div>

        {/* Sección de Seguridad y Cambio de Contraseña */}
        <div className="rounded-3xl border border-amber-100/70 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 space-y-4">
          <div className="flex items-center gap-2 text-base font-bold text-slate-800 dark:text-slate-100">
            <Icon
              path={mdiLockOutline || mdiCog}
              size={0.9}
              className="text-amber-500"
            />
            Seguridad: Cambiar Contraseña de Administrador
          </div>
          <p className="text-xs text-slate-500">
            Esta contraseña es la que utilizas para ingresar al sistema y
            autorizar la eliminación de movimientos.
          </p>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                Contraseña Actual
              </label>
              <input
                type="password"
                className="w-full rounded-2xl border border-amber-100/70 bg-transparent px-4 py-2 text-sm outline-none dark:border-slate-700 dark:text-slate-100"
                placeholder="••••••••"
                value={passForm.currentPassword}
                onChange={(e) =>
                  setPassForm({ ...passForm, currentPassword: e.target.value })
                }
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                Nueva Contraseña
              </label>
              <input
                type="password"
                className="w-full rounded-2xl border border-amber-100/70 bg-transparent px-4 py-2 text-sm outline-none dark:border-slate-700 dark:text-slate-100"
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
                className="w-full rounded-2xl border border-amber-100/70 bg-transparent px-4 py-2 text-sm outline-none dark:border-slate-700 dark:text-slate-100"
                placeholder="Repite la contraseña"
                value={passForm.confirmPassword}
                onChange={(e) =>
                  setPassForm({ ...passForm, confirmPassword: e.target.value })
                }
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handlePasswordSubmit}
              className="rounded-2xl border border-amber-300 bg-amber-50 px-5 py-2 text-xs font-bold text-amber-900 hover:bg-amber-100 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200 transition"
            >
              Actualizar Contraseña
            </button>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="rounded-2xl bg-amber-500 px-8 py-3 text-sm font-bold text-white shadow-sm hover:bg-amber-600 transition"
          >
            Guardar Todos los Ajustes
          </button>
        </div>
      </form>
    </div>
  );
}
