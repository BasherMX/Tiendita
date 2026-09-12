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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1C1917]/60 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="w-full max-w-md rounded-2xl border border-[#E5E2DA] bg-white p-6 shadow-2xl dark:border-[#282C32] dark:bg-[#181B1E]"
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FEF3C7] text-[#D97706] dark:bg-[#78350F]/30 dark:text-[#F59E0B]">
              <Icon path={mdiAccountGroup} size={0.8} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1C1917] dark:text-[#F3F4F6]">
                {editingClient ? "Editar Cliente" : "Nuevo Cliente"}
              </h3>
              <p className="text-xs text-[#78716C] dark:text-[#9CA3AF]">
                {editingClient
                  ? "Modifica los datos del cliente"
                  : "Registra un nuevo cliente en libreta"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#A8A29E] hover:bg-[#FAF7F0] hover:text-[#1C1917] dark:hover:bg-[#202428] dark:hover:text-[#F3F4F6] transition"
          >
            <Icon path={mdiClose} size={0.75} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[11px] font-bold text-[#78716C] dark:text-[#9CA3AF]">
              NOMBRE COMPLETO
            </label>
            <input
              required
              className="w-full rounded-xl border border-[#E5E2DA] bg-white px-3.5 py-2 text-sm text-[#1C1917] placeholder:text-[#A8A29E] outline-none focus:border-[#D97706] focus:ring-1 focus:ring-[#D97706] dark:border-[#282C32] dark:bg-[#181B1E] dark:text-[#F3F4F6] transition"
              placeholder="Ej. Doña Martha López"
              value={clientForm.name}
              onChange={(e) =>
                setClientForm({ ...clientForm, name: e.target.value })
              }
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-bold text-[#78716C] dark:text-[#9CA3AF]">
              TELÉFONO (WHATSAPP, 10 DÍGITOS)
            </label>
            <input
              type="tel"
              className="w-full rounded-xl border border-[#E5E2DA] bg-white px-3.5 py-2 text-sm font-tabular text-[#1C1917] placeholder:text-[#A8A29E] outline-none focus:border-[#D97706] focus:ring-1 focus:ring-[#D97706] dark:border-[#282C32] dark:bg-[#181B1E] dark:text-[#F3F4F6] transition"
              placeholder="Ej. 3312345678"
              value={clientForm.phone}
              onChange={(e) =>
                setClientForm({ ...clientForm, phone: e.target.value })
              }
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="flex items-center gap-1 text-[11px] font-bold text-[#78716C] dark:text-[#9CA3AF]">
                <Icon
                  path={mdiShieldAccountOutline}
                  size={0.65}
                  className="text-[#D97706]"
                />
                LÍMITE DE CRÉDITO ($)
              </label>
              <span className="text-[11px] text-[#A8A29E]">0 = Sin límite</span>
            </div>
            <input
              type="number"
              step="10"
              min="0"
              className="w-full rounded-xl border border-[#E5E2DA] bg-white px-3.5 py-2 text-sm font-tabular text-[#1C1917] placeholder:text-[#A8A29E] outline-none focus:border-[#D97706] focus:ring-1 focus:ring-[#D97706] dark:border-[#282C32] dark:bg-[#181B1E] dark:text-[#F3F4F6] transition"
              placeholder="0.00"
              value={clientForm.creditLimit}
              onChange={(e) =>
                setClientForm({ ...clientForm, creditLimit: e.target.value })
              }
            />
            <p className="mt-1 text-[11px] text-[#78716C] dark:text-[#9CA3AF]">
              Si se asigna un límite, el sistema advertirá si una compra a
              crédito lo rebasa.
            </p>
          </div>

          {editingClient && (
            <div className="grid grid-cols-2 gap-3 border-t border-[#E5E2DA] pt-3.5 dark:border-[#282C32]">
              <div>
                <label className="mb-1.5 block text-[11px] font-bold text-[#78716C] dark:text-[#9CA3AF]">
                  SALDO DEUDA ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full rounded-xl border border-[#E5E2DA] bg-white px-3.5 py-2 text-sm font-bold font-tabular text-[#1C1917] outline-none focus:border-[#D97706] dark:border-[#282C32] dark:bg-[#181B1E] dark:text-[#F3F4F6] transition"
                  value={clientForm.totalDebt}
                  onChange={(e) =>
                    setClientForm({ ...clientForm, totalDebt: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-bold text-[#78716C] dark:text-[#9CA3AF]">
                  PUNTOS RECOMPENSA
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  className="w-full rounded-xl border border-[#E5E2DA] bg-white px-3.5 py-2 text-sm font-bold font-tabular text-[#D97706] outline-none focus:border-[#D97706] dark:border-[#282C32] dark:bg-[#181B1E] dark:text-[#F59E0B] transition"
                  value={clientForm.points}
                  onChange={(e) =>
                    setClientForm({ ...clientForm, points: e.target.value })
                  }
                />
              </div>
            </div>
          )}

          <div className="mt-6 flex justify-end gap-2 pt-2 border-t border-[#E5E2DA] dark:border-[#282C32]">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#E5E2DA] px-4 py-2 text-xs font-semibold text-[#57534E] hover:bg-[#FAF7F0] dark:border-[#282C32] dark:text-[#9CA3AF] dark:hover:bg-[#202428] transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-xl bg-[#D97706] px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#B45309] transition"
            >
              {editingClient ? "Guardar Cambios" : "Crear Cliente"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
