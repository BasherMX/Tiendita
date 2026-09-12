import { motion } from "framer-motion";
import Icon from "@mdi/react";
import { mdiCandycane, mdiClose } from "@mdi/js";

export default function SweetModal({
  isOpen,
  onClose,
  editingSweet,
  sweetForm,
  setSweetForm,
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
              <Icon path={mdiCandycane} size={0.8} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1C1917] dark:text-[#F3F4F6]">
                {editingSweet ? "Editar Dulce" : "Nuevo Dulce / Artículo"}
              </h3>
              <p className="text-xs text-[#78716C] dark:text-[#9CA3AF]">
                {editingSweet
                  ? "Actualiza precios y stock"
                  : "Registra un artículo en catálogo"}
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
              NOMBRE DEL PRODUCTO
            </label>
            <input
              required
              className="w-full rounded-xl border border-[#E5E2DA] bg-white px-3.5 py-2 text-sm text-[#1C1917] placeholder:text-[#A8A29E] outline-none focus:border-[#D97706] focus:ring-1 focus:ring-[#D97706] dark:border-[#282C32] dark:bg-[#181B1E] dark:text-[#F3F4F6] transition"
              placeholder="Ej. Mazapán De la Rosa 28g"
              value={sweetForm.name}
              onChange={(e) =>
                setSweetForm({ ...sweetForm, name: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-[11px] font-bold text-[#78716C] dark:text-[#9CA3AF]">
                PRECIO COMPRA ($)
              </label>
              <input
                required
                type="number"
                step="0.01"
                min="0"
                className="w-full rounded-xl border border-[#E5E2DA] bg-white px-3.5 py-2 text-sm font-tabular text-[#1C1917] placeholder:text-[#A8A29E] outline-none focus:border-[#D97706] focus:ring-1 focus:ring-[#D97706] dark:border-[#282C32] dark:bg-[#181B1E] dark:text-[#F3F4F6] transition"
                placeholder="0.00"
                value={sweetForm.purchasePrice}
                onChange={(e) =>
                  setSweetForm({ ...sweetForm, purchasePrice: e.target.value })
                }
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-bold text-[#78716C] dark:text-[#9CA3AF]">
                PRECIO VENTA ($)
              </label>
              <input
                required
                type="number"
                step="0.01"
                min="0"
                className="w-full rounded-xl border border-[#E5E2DA] bg-white px-3.5 py-2 text-sm font-bold font-tabular text-[#1C1917] placeholder:text-[#A8A29E] outline-none focus:border-[#D97706] focus:ring-1 focus:ring-[#D97706] dark:border-[#282C32] dark:bg-[#181B1E] dark:text-[#F3F4F6] transition"
                placeholder="0.00"
                value={sweetForm.salePrice}
                onChange={(e) =>
                  setSweetForm({ ...sweetForm, salePrice: e.target.value })
                }
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-bold text-[#78716C] dark:text-[#9CA3AF]">
              STOCK ACTUAL
            </label>
            <input
              required
              type="number"
              step="1"
              min="0"
              className="w-full rounded-xl border border-[#E5E2DA] bg-white px-3.5 py-2 text-sm font-tabular text-[#1C1917] placeholder:text-[#A8A29E] outline-none focus:border-[#D97706] focus:ring-1 focus:ring-[#D97706] dark:border-[#282C32] dark:bg-[#181B1E] dark:text-[#F3F4F6] transition"
              placeholder="0"
              value={sweetForm.stock}
              onChange={(e) =>
                setSweetForm({ ...sweetForm, stock: e.target.value })
              }
            />
          </div>

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
              {editingSweet ? "Guardar Cambios" : "Crear Dulce"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
