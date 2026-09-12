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
              <Icon path={mdiGift} size={0.8} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1C1917] dark:text-[#F3F4F6]">
                {editingReward ? "Editar Premio" : "Nuevo Premio"}
              </h3>
              <p className="text-xs text-[#78716C] dark:text-[#9CA3AF]">
                {editingReward
                  ? "Modifica costo en puntos o stock"
                  : "Premio del programa de lealtad"}
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
              VINCULAR CON DULCE (OPCIONAL)
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
            <label className="mb-1.5 block text-[11px] font-bold text-[#78716C] dark:text-[#9CA3AF]">
              NOMBRE DE LA RECOMPENSA
            </label>
            <input
              required
              className="w-full rounded-xl border border-[#E5E2DA] bg-white px-3.5 py-2 text-sm text-[#1C1917] placeholder:text-[#A8A29E] outline-none focus:border-[#D97706] focus:ring-1 focus:ring-[#D97706] dark:border-[#282C32] dark:bg-[#181B1E] dark:text-[#F3F4F6] transition"
              placeholder="Ej. Paleta Payaso Grande"
              value={rewardForm.name}
              onChange={(e) =>
                setRewardForm({ ...rewardForm, name: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-[11px] font-bold text-[#78716C] dark:text-[#9CA3AF]">
                COSTO EN PUNTOS
              </label>
              <input
                required
                type="number"
                step="0.5"
                min="0.5"
                className="w-full rounded-xl border border-[#E5E2DA] bg-white px-3.5 py-2 text-sm font-bold font-tabular text-[#D97706] placeholder:text-[#A8A29E] outline-none focus:border-[#D97706] focus:ring-1 focus:ring-[#D97706] dark:border-[#282C32] dark:bg-[#181B1E] dark:text-[#F59E0B] transition"
                placeholder="Ej. 100"
                value={rewardForm.pointsCost}
                onChange={(e) =>
                  setRewardForm({ ...rewardForm, pointsCost: e.target.value })
                }
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-bold text-[#78716C] dark:text-[#9CA3AF]">
                STOCK DISPONIBLE
              </label>
              <input
                required
                type="number"
                step="1"
                min="0"
                className="w-full rounded-xl border border-[#E5E2DA] bg-white px-3.5 py-2 text-sm font-tabular text-[#1C1917] placeholder:text-[#A8A29E] outline-none focus:border-[#D97706] focus:ring-1 focus:ring-[#D97706] dark:border-[#282C32] dark:bg-[#181B1E] dark:text-[#F3F4F6] transition"
                placeholder="0"
                value={rewardForm.stock}
                onChange={(e) =>
                  setRewardForm({ ...rewardForm, stock: e.target.value })
                }
              />
            </div>
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
              {editingReward ? "Guardar Cambios" : "Crear Premio"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
