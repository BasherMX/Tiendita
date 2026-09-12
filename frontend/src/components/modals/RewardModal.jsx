import { motion } from "framer-motion";
import Icon from "@mdi/react";
import { mdiGift, mdiClose } from "@mdi/js";
import SweetCombobox from "../SweetCombobox.jsx";

export default function RewardModal({
  isOpen,
  onClose,
  editingReward,
  rewardForm,
  setRewardForm,
  sweets,
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
            <Icon path={mdiGift} size={1} className="text-amber-500" />
            {editingReward ? "Editar Premio" : "Nuevo Premio / Recompensa"}
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
              Vincular con Dulce (opcional)
            </label>
            <SweetCombobox
              sweets={sweets}
              value={rewardForm.sweetId}
              onChange={(val) => {
                const sweet = sweets.find((s) => String(s.id) === String(val));
                setRewardForm({
                  ...rewardForm,
                  sweetId: val,
                  name: sweet ? sweet.name : rewardForm.name,
                  pointsCost: sweet
                    ? String(Math.round(Number(sweet.sale_price) * 10))
                    : rewardForm.pointsCost,
                });
              }}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
              Nombre de la Recompensa
            </label>
            <input
              required
              className="w-full rounded-2xl border border-amber-100/70 bg-transparent px-4 py-2 text-sm outline-none dark:border-slate-700 dark:text-slate-100"
              placeholder="Ej. Paleta Payaso Grande"
              value={rewardForm.name}
              onChange={(e) =>
                setRewardForm({ ...rewardForm, name: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                Costo en Puntos
              </label>
              <input
                required
                type="number"
                step="0.5"
                min="0.5"
                className="w-full rounded-2xl border border-amber-100/70 bg-transparent px-4 py-2 text-sm outline-none dark:border-slate-700 dark:text-slate-100"
                placeholder="Ej. 100"
                value={rewardForm.pointsCost}
                onChange={(e) =>
                  setRewardForm({ ...rewardForm, pointsCost: e.target.value })
                }
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                Stock Disponible
              </label>
              <input
                required
                type="number"
                step="1"
                min="0"
                className="w-full rounded-2xl border border-amber-100/70 bg-transparent px-4 py-2 text-sm outline-none dark:border-slate-700 dark:text-slate-100"
                placeholder="0"
                value={rewardForm.stock}
                onChange={(e) =>
                  setRewardForm({ ...rewardForm, stock: e.target.value })
                }
              />
            </div>
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
              {editingReward ? "Actualizar" : "Crear Premio"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
