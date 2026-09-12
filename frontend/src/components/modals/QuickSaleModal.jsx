import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Icon from "@mdi/react";
import {
  mdiCashRegister,
  mdiClose,
  mdiPlus,
  mdiDelete,
  mdiMinus,
  mdiCashCheck,
} from "@mdi/js";
import SweetCombobox from "../SweetCombobox.jsx";
import PaymentMethodSelector from "../PaymentMethodSelector.jsx";

export default function QuickSaleModal({
  isOpen,
  onClose,
  sweets = [],
  onRegisterSale,
}) {
  const [saleItems, setSaleItems] = useState([
    { id: 1, sweetId: "", quantity: 1 },
  ]);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [submitting, setSubmitting] = useState(false);

  // Reset form state when opened
  useEffect(() => {
    if (isOpen) {
      setSaleItems([{ id: Date.now(), sweetId: "", quantity: 1 }]);
      setPaymentMethod("cash");
      setSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const sweetById = new Map(sweets.map((s) => [String(s.id), s]));

  const computedTotal = saleItems.reduce((sum, item) => {
    const sweet = sweetById.get(String(item.sweetId));
    return (
      sum +
      (sweet ? Number(sweet.sale_price) * (Number(item.quantity) || 0) : 0)
    );
  }, 0);

  function addItem() {
    setSaleItems((prev) => [
      ...prev,
      { id: Date.now(), sweetId: "", quantity: 1 },
    ]);
  }

  function removeItem(id) {
    if (saleItems.length <= 1) {
      setSaleItems([{ id: Date.now(), sweetId: "", quantity: 1 }]);
      return;
    }
    setSaleItems((prev) => prev.filter((it) => it.id !== id));
  }

  function updateItem(id, field, value) {
    setSaleItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, [field]: value } : it)),
    );
  }

  function changeQty(id, delta) {
    setSaleItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const nextQty = Math.max(1, (Number(it.quantity) || 1) + delta);
        return { ...it, quantity: nextQty };
      }),
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const validItems = saleItems.filter((it) => it.sweetId && it.quantity > 0);
    if (validItems.length === 0) return;

    try {
      setSubmitting(true);
      await onRegisterSale({
        items: validItems,
        paymentMethod,
      });
      onClose();
    } catch (err) {
      console.error("Error in quick sale:", err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1C1917]/60 p-3 sm:p-4 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        className="w-full max-w-lg rounded-2xl border border-[#E5E2DA] bg-white p-5 sm:p-6 shadow-2xl dark:border-[#282C32] dark:bg-[#181B1E] max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="mb-4 flex items-center justify-between border-b border-[#E5E2DA] pb-3 dark:border-[#282C32]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-950/40 dark:text-emerald-300">
              <Icon path={mdiCashRegister} size={0.8} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#1C1917] dark:text-[#F3F4F6] leading-tight">
                  Venta Rápida de Mostrador
                </h3>
                <span className="hidden sm:inline-flex items-center rounded-md border border-emerald-600/20 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-950/40 dark:text-emerald-300">
                  Público General
                </span>
              </div>
              <p className="text-xs text-[#78716C] dark:text-[#9CA3AF]">
                Cobro directo al contado sin registrar cliente
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#A8A29E] hover:bg-[#FAF7F0] hover:text-[#1C1917] dark:hover:bg-[#202428] dark:hover:text-[#F3F4F6] transition"
          >
            <Icon path={mdiClose} size={0.75} />
          </button>
        </div>

        {/* Formulario */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 min-h-0 space-y-4"
        >
          <div className="space-y-2.5 flex-1 overflow-y-auto pr-1">
            <div className="flex items-center justify-between text-[11px] font-bold text-[#78716C] dark:text-[#9CA3AF]">
              <span>Artículo(s)</span>
              <span>Subtotal</span>
            </div>

            {saleItems.map((item) => {
              const sweet = sweetById.get(String(item.sweetId));
              const sub = sweet
                ? Number(sweet.sale_price) * (Number(item.quantity) || 0)
                : 0;

              return (
                <div
                  key={item.id}
                  className="flex items-center gap-2 rounded-xl border border-[#E5E2DA] bg-[#F7F6F2]/60 p-2 dark:border-[#282C32] dark:bg-[#111315]/50"
                >
                  <div className="flex-1 min-w-0">
                    <SweetCombobox
                      sweets={sweets}
                      value={item.sweetId}
                      onChange={(val) => updateItem(item.id, "sweetId", val)}
                    />
                  </div>

                  {/* Selector rápido de cantidad */}
                  <div className="flex items-center rounded-lg border border-[#E5E2DA] bg-white dark:border-[#282C32] dark:bg-[#181B1E] shrink-0">
                    <button
                      type="button"
                      onClick={() => changeQty(item.id, -1)}
                      className="px-1.5 py-1 text-[#78716C] hover:bg-[#F7F6F2] dark:text-[#9CA3AF] dark:hover:bg-[#282C32] rounded-l-lg transition"
                      title="Disminuir"
                    >
                      <Icon path={mdiMinus} size={0.5} />
                    </button>
                    <input
                      type="number"
                      min="1"
                      className="w-9 bg-transparent text-center text-xs font-bold font-tabular outline-none text-[#1C1917] dark:text-[#F3F2EE]"
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(item.id, "quantity", e.target.value)
                      }
                    />
                    <button
                      type="button"
                      onClick={() => changeQty(item.id, 1)}
                      className="px-1.5 py-1 text-[#78716C] hover:bg-[#F7F6F2] dark:text-[#9CA3AF] dark:hover:bg-[#282C32] rounded-r-lg transition"
                      title="Aumentar"
                    >
                      <Icon path={mdiPlus} size={0.5} />
                    </button>
                  </div>

                  <div className="w-14 text-right text-xs font-bold font-tabular text-[#1C1917] dark:text-[#F3F2EE] shrink-0">
                    ${sub.toFixed(2)}
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="rounded-lg p-1 text-[#78716C] hover:bg-red-50 hover:text-red-600 dark:text-[#9CA3AF] dark:hover:bg-red-950/40 dark:hover:text-red-400 transition shrink-0"
                    title="Quitar artículo"
                  >
                    <Icon path={mdiDelete} size={0.65} />
                  </button>
                </div>
              );
            })}

            <button
              type="button"
              onClick={addItem}
              className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300 transition pt-1"
            >
              <Icon path={mdiPlus} size={0.6} />
              <span>Agregar otro artículo</span>
            </button>
          </div>

          {/* Método de pago */}
          <div className="border-t border-[#E5E2DA] pt-3.5 dark:border-[#282C32]">
            <label className="mb-1.5 block text-[11px] font-bold text-[#78716C] dark:text-[#9CA3AF]">
              FORMA DE PAGO
            </label>
            <PaymentMethodSelector
              value={paymentMethod}
              onChange={setPaymentMethod}
            />
          </div>

          {/* Totalizador y Acciones */}
          <div className="rounded-xl border border-[#E5E2DA] bg-[#F7F6F2] p-4 dark:border-[#282C32] dark:bg-[#111315]">
            <div className="flex items-baseline justify-between mb-3">
              <span className="text-xs font-bold text-[#78716C] dark:text-[#9CA3AF]">
                Total a Cobrar
              </span>
              <span className="text-2xl sm:text-3xl font-black font-tabular text-emerald-700 dark:text-emerald-400">
                ${computedTotal.toFixed(2)}
              </span>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-[#E5E2DA] px-4 py-2.5 text-xs font-semibold text-[#57534E] hover:bg-[#FAF7F0] dark:border-[#282C32] dark:text-[#9CA3AF] dark:hover:bg-[#202428] transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={computedTotal <= 0 || submitting}
                className={`flex-[2] flex items-center justify-center gap-2 rounded-xl py-2.5 px-4 text-xs font-bold text-white shadow-xs transition ${
                  computedTotal > 0 && !submitting
                    ? "bg-emerald-700 hover:bg-emerald-800 active:scale-[0.99]"
                    : "bg-[#D6D1C4] dark:bg-[#282C32] cursor-not-allowed text-stone-500"
                }`}
              >
                <Icon path={mdiCashCheck} size={0.75} />
                <span>
                  {submitting
                    ? "Registrando..."
                    : `Completar Cobro ($${computedTotal.toFixed(2)})`}
                </span>
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
