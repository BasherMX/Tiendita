import { motion } from "framer-motion";
import Icon from "@mdi/react";
import { mdiAccountGroup, mdiClose, mdiShieldAccountOutline } from "@mdi/js";

export default function ClientModal({
  isOpen,
  onClose,
  editingClient,
  clientForm,
  setClientForm,
  onSubmit,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md rounded-3xl border border-amber-100/70 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-slate-100">
            <Icon path={mdiAccountGroup} size={1} className="text-amber-500" />
            {editingClient ? "Editar Cliente" : "Nuevo Cliente"}
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Icon path={mdiClose} size={0.8} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
              Nombre del cliente
            </label>
            <input
              required
              className="w-full rounded-2xl border border-amber-100/70 bg-transparent px-4 py-2 text-sm outline-none dark:border-slate-700 dark:text-slate-100"
              placeholder="Ej. Juan Pérez"
              value={clientForm.name}
              onChange={(e) =>
                setClientForm({ ...clientForm, name: e.target.value })
              }
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
              Teléfono (WhatsApp, 10 dígitos)
            </label>
            <input
              type="tel"
              className="w-full rounded-2xl border border-amber-100/70 bg-transparent px-4 py-2 text-sm outline-none dark:border-slate-700 dark:text-slate-100"
              placeholder="Ej. 3312345678"
              value={clientForm.phone}
              onChange={(e) =>
                setClientForm({ ...clientForm, phone: e.target.value })
              }
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase text-slate-500">
                <Icon
                  path={mdiShieldAccountOutline}
                  size={0.7}
                  className="text-amber-500"
                />
                Límite de crédito ($)
              </label>
              <span className="text-[11px] text-slate-400">0 = Sin límite</span>
            </div>
            <input
              type="number"
              step="10"
              min="0"
              className="w-full rounded-2xl border border-amber-100/70 bg-transparent px-4 py-2 text-sm outline-none dark:border-slate-700 dark:text-slate-100"
              placeholder="0.00 (Sin límite)"
              value={clientForm.creditLimit}
              onChange={(e) =>
                setClientForm({ ...clientForm, creditLimit: e.target.value })
              }
            />
            <p className="mt-1 text-[11px] text-slate-400">
              Si se establece un límite, el sistema advertirá si el cliente
              intenta fiar más de esta cantidad.
            </p>
          </div>

          {editingClient && (
            <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-3 dark:border-slate-800">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                  Saldo Deuda ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full rounded-2xl border border-amber-100/70 bg-transparent px-4 py-2 text-sm outline-none dark:border-slate-700 dark:text-slate-100"
                  value={clientForm.totalDebt}
                  onChange={(e) =>
                    setClientForm({ ...clientForm, totalDebt: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                  Puntos
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  className="w-full rounded-2xl border border-amber-100/70 bg-transparent px-4 py-2 text-sm outline-none dark:border-slate-700 dark:text-slate-100"
                  value={clientForm.points}
                  onChange={(e) =>
                    setClientForm({ ...clientForm, points: e.target.value })
                  }
                />
              </div>
            </div>
          )}

          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-2xl bg-amber-500 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-600"
            >
              {editingClient ? "Actualizar" : "Crear Cliente"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
