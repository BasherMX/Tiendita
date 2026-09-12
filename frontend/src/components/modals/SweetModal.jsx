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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md rounded-3xl border border-amber-100/70 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-slate-100">
            <Icon path={mdiCandycane} size={1} className="text-amber-500" />
            {editingSweet ? "Editar Dulce" : "Nuevo Dulce"}
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
              Nombre del dulce
            </label>
            <input
              required
              className="w-full rounded-2xl border border-amber-100/70 bg-transparent px-4 py-2 text-sm outline-none dark:border-slate-700 dark:text-slate-100"
              placeholder="Ej. Mazapán 50g"
              value={sweetForm.name}
              onChange={(e) =>
                setSweetForm({ ...sweetForm, name: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                Precio Compra ($)
              </label>
              <input
                required
                type="number"
                step="0.01"
                min="0"
                className="w-full rounded-2xl border border-amber-100/70 bg-transparent px-4 py-2 text-sm outline-none dark:border-slate-700 dark:text-slate-100"
                placeholder="0.00"
                value={sweetForm.purchasePrice}
                onChange={(e) =>
                  setSweetForm({ ...sweetForm, purchasePrice: e.target.value })
                }
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                Precio Venta ($)
              </label>
              <input
                required
                type="number"
                step="0.01"
                min="0"
                className="w-full rounded-2xl border border-amber-100/70 bg-transparent px-4 py-2 text-sm outline-none dark:border-slate-700 dark:text-slate-100"
                placeholder="0.00"
                value={sweetForm.salePrice}
                onChange={(e) =>
                  setSweetForm({ ...sweetForm, salePrice: e.target.value })
                }
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
              Stock inicial / actual
            </label>
            <input
              required
              type="number"
              step="1"
              min="0"
              className="w-full rounded-2xl border border-amber-100/70 bg-transparent px-4 py-2 text-sm outline-none dark:border-slate-700 dark:text-slate-100"
              placeholder="0"
              value={sweetForm.stock}
              onChange={(e) =>
                setSweetForm({ ...sweetForm, stock: e.target.value })
              }
            />
          </div>

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
              {editingSweet ? "Actualizar" : "Guardar Dulce"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
