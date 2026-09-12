import { useState } from "react";
import { motion } from "framer-motion";
import Icon from "@mdi/react";
import {
  mdiCashPlus,
  mdiCashMinus,
  mdiClose,
  mdiPlus,
  mdiDelete,
  mdiAlertCircleOutline,
} from "@mdi/js";
import SweetCombobox from "../SweetCombobox.jsx";
import PaymentMethodSelector from "../PaymentMethodSelector.jsx";

export default function MovementModal({
  isOpen,
  onClose,
  selectedClient,
  movementKind, // "purchase" | "pay"
  sweets,
  onSubmit,
}) {
  if (!isOpen || !selectedClient) return null;

  const [mode, setMode] = useState("items"); // "items" | "manual"
  const [manualAmount, setManualAmount] = useState("");
  const [items, setItems] = useState([{ id: 1, sweetId: "", quantity: 1 }]);
  const [payImmediately, setPayImmediately] = useState(false);
  const [usePoints, setUsePoints] = useState(false);
  const [pointsToUse, setPointsToUse] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");

  const sweetById = new Map(sweets.map((s) => [String(s.id), s]));

  const computedTotal =
    mode === "items" && movementKind === "purchase"
      ? items.reduce((sum, item) => {
          const sweet = sweetById.get(String(item.sweetId));
          return (
            sum +
            (sweet
              ? Number(sweet.sale_price) * (Number(item.quantity) || 0)
              : 0)
          );
        }, 0)
      : Number(manualAmount) || 0;

  const clientDebt = Number(selectedClient.total_debt || 0);
  const clientPoints = Number(selectedClient.points || 0);
  const creditLimit = Number(selectedClient.credit_limit || 0);

  // Credit limit calculation for purchases
  const ptsDeduction = usePoints
    ? Math.min(Number(pointsToUse) || 0, computedTotal)
    : 0;
  const netAmount = Math.max(0, computedTotal - ptsDeduction);
  const resultingDebt =
    !payImmediately && movementKind === "purchase"
      ? clientDebt + netAmount
      : clientDebt;
  const isOverCreditLimit =
    creditLimit > 0 &&
    resultingDebt > creditLimit &&
    !payImmediately &&
    movementKind === "purchase";

  function addItem() {
    setItems((prev) => [...prev, { id: Date.now(), sweetId: "", quantity: 1 }]);
  }

  function removeItem(id) {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((it) => it.id !== id));
  }

  function updateItem(id, field, value) {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, [field]: value } : it)),
    );
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit({
      movementKind,
      mode,
      amount: computedTotal,
      items: items.filter((it) => it.sweetId && it.quantity > 0),
      payImmediately,
      usePoints,
      pointsToUse: ptsDeduction,
      paymentMethod,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg rounded-3xl border border-amber-100/70 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="mb-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-slate-100">
            <Icon
              path={movementKind === "purchase" ? mdiCashMinus : mdiCashPlus}
              size={1}
              className={
                movementKind === "purchase"
                  ? "text-amber-500"
                  : "text-emerald-500"
              }
            />
            {movementKind === "purchase"
              ? `Nueva Compra: ${selectedClient.name}`
              : `Registrar Abono: ${selectedClient.name}`}
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Icon path={mdiClose} size={0.8} />
          </button>
        </div>

        {/* Client summary badge */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-amber-50/70 px-4 py-2.5 text-xs text-amber-950 dark:bg-slate-800/80 dark:text-amber-200 shrink-0">
          <span>
            Deuda actual: <strong>${clientDebt.toFixed(2)}</strong>
          </span>
          <span>
            Puntos: <strong>{clientPoints.toFixed(1)} pts</strong>
          </span>
          {creditLimit > 0 && (
            <span>
              Límite de crédito: <strong>${creditLimit.toFixed(2)}</strong>
            </span>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto space-y-4 pr-1"
        >
          {/* Purchase: Mode Selector (Items vs Manual) */}
          {movementKind === "purchase" && (
            <div className="flex rounded-2xl bg-slate-100 p-1 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => setMode("items")}
                className={`flex-1 rounded-xl py-1.5 text-xs font-semibold transition ${
                  mode === "items"
                    ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100"
                    : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
                }`}
              >
                Por Dulces / Productos
              </button>
              <button
                type="button"
                onClick={() => setMode("manual")}
                className={`flex-1 rounded-xl py-1.5 text-xs font-semibold transition ${
                  mode === "manual"
                    ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100"
                    : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
                }`}
              >
                Monto Manual ($)
              </button>
            </div>
          )}

          {/* Items Section */}
          {movementKind === "purchase" && mode === "items" && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs font-semibold uppercase text-slate-500">
                <span>Productos</span>
                <span>Subtotal</span>
              </div>
              {items.map((item, idx) => {
                const sweet = sweetById.get(String(item.sweetId));
                const sub = sweet
                  ? Number(sweet.sale_price) * (Number(item.quantity) || 0)
                  : 0;
                return (
                  <div key={item.id} className="flex items-center gap-2">
                    <div className="flex-1">
                      <SweetCombobox
                        sweets={sweets}
                        value={item.sweetId}
                        onChange={(val) => updateItem(item.id, "sweetId", val)}
                      />
                    </div>
                    <input
                      type="number"
                      min="1"
                      className="w-16 rounded-2xl border border-amber-100/70 bg-transparent px-2 py-2 text-center text-sm outline-none dark:border-slate-700 dark:text-slate-100"
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(item.id, "quantity", e.target.value)
                      }
                    />
                    <div className="w-16 text-right text-xs font-semibold text-slate-700 dark:text-slate-300">
                      ${sub.toFixed(2)}
                    </div>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="rounded-full p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950"
                      >
                        <Icon path={mdiDelete} size={0.75} />
                      </button>
                    )}
                  </div>
                );
              })}
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-1 text-xs font-semibold text-amber-600 hover:text-amber-700 dark:text-amber-400"
              >
                <Icon path={mdiPlus} size={0.7} />
                Agregar otro producto
              </button>
            </div>
          )}

          {/* Manual Amount input */}
          {(movementKind === "pay" || mode === "manual") && (
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                {movementKind === "pay"
                  ? "Monto a Abonar / Pagar ($)"
                  : "Monto de la Compra ($)"}
              </label>
              <input
                required
                type="number"
                step="0.01"
                min="0.01"
                className="w-full rounded-2xl border border-amber-100/70 bg-transparent px-4 py-2.5 text-base font-bold outline-none dark:border-slate-700 dark:text-slate-100"
                placeholder="0.00"
                value={manualAmount}
                onChange={(e) => setManualAmount(e.target.value)}
              />
            </div>
          )}

          {/* Points usage option for purchase */}
          {movementKind === "purchase" &&
            clientPoints > 0 &&
            computedTotal > 0 && (
              <div className="rounded-2xl border border-amber-100/70 p-3 dark:border-slate-800 space-y-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={usePoints}
                    onChange={(e) => {
                      setUsePoints(e.target.checked);
                      if (e.target.checked) {
                        setPointsToUse(
                          String(Math.min(clientPoints, computedTotal)),
                        );
                      }
                    }}
                    className="rounded text-amber-500 focus:ring-amber-400"
                  />
                  Pagar parte o total con Puntos ({clientPoints.toFixed(1)} pts
                  disponibles)
                </label>
                {usePoints && (
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max={Math.min(clientPoints, computedTotal)}
                      className="w-32 rounded-xl border border-amber-200 px-3 py-1.5 text-xs outline-none dark:border-slate-700 dark:bg-slate-800"
                      placeholder="Puntos a usar"
                      value={pointsToUse}
                      onChange={(e) => setPointsToUse(e.target.value)}
                    />
                    <span className="text-xs text-slate-500">
                      Equivalente a: -${Number(pointsToUse || 0).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            )}

          {/* Payment Method Selector (for payments and instant purchases) */}
          {(movementKind === "pay" || payImmediately) && (
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase text-slate-500">
                Método de Pago
              </label>
              <PaymentMethodSelector
                value={paymentMethod}
                onChange={setPaymentMethod}
              />
            </div>
          )}

          {/* Instant Payment toggle for purchases */}
          {movementKind === "purchase" && (
            <div className="rounded-2xl border border-slate-200 p-3 dark:border-slate-800">
              <label className="flex items-center justify-between gap-2 cursor-pointer">
                <div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    ¿Se paga al instante en mostrador?
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Si se activa, no queda como deuda pendiente.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={payImmediately}
                  onChange={(e) => setPayImmediately(e.target.checked)}
                  className="h-4 w-4 rounded text-amber-500 focus:ring-amber-400"
                />
              </label>
            </div>
          )}

          {/* Credit Limit Alert Warning */}
          {isOverCreditLimit && (
            <div className="flex items-center gap-2 rounded-2xl bg-rose-50 p-3 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
              <Icon
                path={mdiAlertCircleOutline}
                size={1}
                className="shrink-0 text-rose-500"
              />
              <span>
                <strong>Atención:</strong> Esta compra a crédito dejará la deuda
                en <strong>${resultingDebt.toFixed(2)}</strong>, superando el
                límite de <strong>${creditLimit.toFixed(2)}</strong>.
              </span>
            </div>
          )}

          {/* Total & Submit Button */}
          <div className="shrink-0 border-t border-slate-100 pt-4 dark:border-slate-800">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs uppercase text-slate-500 font-semibold">
                {movementKind === "purchase" ? "Total a cobrar" : "Total abono"}
              </span>
              <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                ${computedTotal.toFixed(2)}
              </span>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={computedTotal <= 0}
                className={`rounded-2xl px-6 py-2 text-sm font-semibold text-white shadow-sm transition ${
                  computedTotal > 0
                    ? movementKind === "purchase"
                      ? "bg-amber-500 hover:bg-amber-600"
                      : "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-slate-300 dark:bg-slate-700 cursor-not-allowed"
                }`}
              >
                {movementKind === "purchase"
                  ? "Registrar Compra"
                  : "Registrar Abono"}
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
