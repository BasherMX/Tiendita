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
  settings,
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
  const [secondaryPaymentMethod, setSecondaryPaymentMethod] = useState("cash");

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
  const defaultCreditLimit = Number(settings?.default_credit_limit) || 50;
  const creditLimit =
    Number(selectedClient.credit_limit) > 0
      ? Number(selectedClient.credit_limit)
      : defaultCreditLimit;

  // Credit limit & points calculation
  const isPointsMethod =
    (movementKind === "pay" || payImmediately) && paymentMethod === "points";
  const maxUsablePoints = Math.max(0, Math.min(clientPoints, computedTotal));
  const rawPts = isPointsMethod || usePoints ? Number(pointsToUse) || 0 : 0;
  const ptsDeduction = Number(
    Math.max(0, Math.min(rawPts, maxUsablePoints)).toFixed(2),
  );
  const remainingAfterPoints = Number(
    Math.max(0, computedTotal - ptsDeduction).toFixed(2),
  );
  const netAmount = Math.max(0, computedTotal - ptsDeduction);
  const resultingDebt =
    !payImmediately && movementKind === "purchase"
      ? Number((clientDebt + netAmount).toFixed(2))
      : clientDebt;
  const isOverCreditLimit =
    resultingDebt > creditLimit &&
    !payImmediately &&
    movementKind === "purchase";

  function handlePrimaryMethodChange(method) {
    setPaymentMethod(method);
    if (method === "points") {
      setUsePoints(true);
      const suggested = Math.min(clientPoints, computedTotal);
      setPointsToUse(suggested > 0 ? String(Number(suggested.toFixed(2))) : "");
    } else {
      setUsePoints(false);
      setPointsToUse("");
    }
  }

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
      usePoints: isPointsMethod || usePoints,
      pointsToUse: ptsDeduction,
      paymentMethod,
      secondaryPaymentMethod:
        isPointsMethod && remainingAfterPoints > 0
          ? secondaryPaymentMethod
          : undefined,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1C1917]/60 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="w-full max-w-lg rounded-2xl border border-[#E5E2DA] bg-white p-4 sm:p-6 shadow-2xl dark:border-[#282C32] dark:bg-[#181B1E] max-h-[92vh] flex flex-col min-w-0"
      >
        {/* Header */}
        <div className="mb-3 sm:mb-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-base font-bold text-[#1C1917] dark:text-[#F3F4F6]">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                movementKind === "purchase"
                  ? "bg-[#FEF3C7] text-[#D97706] dark:bg-[#78350F]/30 dark:text-[#F59E0B]"
                  : "bg-[#D1FAE5] text-[#059669] dark:bg-[#064E3B]/30 dark:text-[#10B981]"
              }`}
            >
              <Icon
                path={movementKind === "purchase" ? mdiCashMinus : mdiCashPlus}
                size={0.8}
              />
            </div>
            <div>
              <h3>
                {movementKind === "purchase"
                  ? "Nueva Compra"
                  : "Registrar Abono"}
              </h3>
              <p className="text-xs font-normal text-[#78716C] dark:text-[#9CA3AF]">
                {selectedClient.name}
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

        {/* Client summary badge */}
        <div className="mb-3 sm:mb-4 flex flex-wrap items-center justify-between gap-1.5 sm:gap-2 rounded-xl border border-[#E5E2DA] bg-[#FAF7F0] px-3 py-2 text-[11px] sm:text-xs text-[#57534E] dark:border-[#282C32] dark:bg-[#121417] dark:text-[#9CA3AF] shrink-0">
          <span className="flex flex-wrap items-center gap-1.5">
            <span>{clientDebt < 0 ? "A favor:" : "Deuda:"}</span>
            {movementKind === "purchase" && computedTotal > 0 ? (
              <>
                <strong className="font-tabular line-through opacity-60 text-[#78716C] dark:text-[#9CA3AF]">
                  ${Math.abs(clientDebt).toFixed(2)}
                </strong>
                <strong
                  className={`font-tabular ${
                    resultingDebt <= 0
                      ? "text-[#059669] dark:text-[#10B981]"
                      : "text-[#DC2626] dark:text-[#F87171]"
                  }`}
                >
                  {resultingDebt < 0
                    ? `A favor $${Math.abs(resultingDebt).toFixed(2)}`
                    : resultingDebt === 0
                      ? "$0.00"
                      : `Deuda $${resultingDebt.toFixed(2)}`}
                </strong>
              </>
            ) : (
              <strong
                className={`font-tabular ${
                  clientDebt < 0
                    ? "text-[#059669] dark:text-[#10B981]"
                    : "text-[#1C1917] dark:text-[#F3F4F6]"
                }`}
              >
                ${Math.abs(clientDebt).toFixed(2)}
              </strong>
            )}
          </span>
          <span>
            Puntos:{" "}
            <strong className="font-tabular text-[#D97706] dark:text-[#F59E0B]">
              {clientPoints.toFixed(1)} pts
            </strong>
          </span>
          {creditLimit > 0 && (
            <span>
              Límite:{" "}
              <strong className="font-tabular text-[#1C1917] dark:text-[#F3F4F6]">
                ${creditLimit.toFixed(2)}
              </strong>
            </span>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto space-y-3 sm:space-y-4 pr-1"
        >
          {/* Purchase: Mode Selector (Items vs Manual) */}
          {movementKind === "purchase" && (
            <div className="flex rounded-xl border border-[#E5E2DA] bg-[#F5F2EB] p-1 dark:border-[#282C32] dark:bg-[#121417]">
              <button
                type="button"
                onClick={() => setMode("items")}
                className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition ${
                  mode === "items"
                    ? "bg-white text-[#1C1917] shadow-sm dark:bg-[#202428] dark:text-[#F3F4F6]"
                    : "text-[#78716C] hover:text-[#1C1917] dark:text-[#9CA3AF] dark:hover:text-[#F3F4F6]"
                }`}
              >
                Por Dulces / Productos
              </button>
              <button
                type="button"
                onClick={() => setMode("manual")}
                className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition ${
                  mode === "manual"
                    ? "bg-white text-[#1C1917] shadow-sm dark:bg-[#202428] dark:text-[#F3F4F6]"
                    : "text-[#78716C] hover:text-[#1C1917] dark:text-[#9CA3AF] dark:hover:text-[#F3F4F6]"
                }`}
              >
                Monto Manual ($)
              </button>
            </div>
          )}

          {/* Items Section */}
          {movementKind === "purchase" && mode === "items" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-[#78716C] dark:text-[#9CA3AF]">
                <span>PRODUCTOS</span>
                <span>SUBTOTAL</span>
              </div>
              {items.map((item) => {
                const sweet = sweetById.get(String(item.sweetId));
                const sub = sweet
                  ? Number(sweet.sale_price) * (Number(item.quantity) || 0)
                  : 0;
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-1.5 sm:gap-2 min-w-0"
                  >
                    <div className="flex-1 min-w-0">
                      <SweetCombobox
                        sweets={sweets}
                        value={item.sweetId}
                        onChange={(val) => updateItem(item.id, "sweetId", val)}
                      />
                    </div>
                    <input
                      type="number"
                      min="1"
                      className="w-12 sm:w-16 rounded-xl border border-[#E5E2DA] bg-white px-1.5 py-2 text-center text-xs sm:text-sm font-tabular outline-none focus:border-[#D97706] focus:ring-1 focus:ring-[#D97706] dark:border-[#282C32] dark:bg-[#181B1E] dark:text-[#F3F4F6] shrink-0"
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(item.id, "quantity", e.target.value)
                      }
                    />
                    <div className="w-14 sm:w-16 text-right text-[11px] sm:text-xs font-bold font-tabular text-[#1C1917] dark:text-[#F3F4F6] shrink-0">
                      ${sub.toFixed(2)}
                    </div>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="rounded-lg p-1 sm:p-1.5 text-[#DC2626] hover:bg-[#FEF2F2] dark:hover:bg-[#450A0A]/40 transition shrink-0"
                      >
                        <Icon path={mdiDelete} size={0.7} />
                      </button>
                    )}
                  </div>
                );
              })}
              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-[#D97706] hover:bg-[#FEF3C7]/40 dark:text-[#F59E0B] dark:hover:bg-[#78350F]/20 transition"
              >
                <Icon path={mdiPlus} size={0.7} />
                Agregar otro producto
              </button>
            </div>
          )}

          {/* Manual Amount input */}
          {(movementKind === "pay" || mode === "manual") && (
            <div>
              <label className="mb-1 block text-[11px] font-bold text-[#78716C] dark:text-[#9CA3AF]">
                {movementKind === "pay"
                  ? "MONTO A ABONAR / PAGAR ($)"
                  : "MONTO DE LA COMPRA ($)"}
              </label>
              <input
                required
                type="number"
                step="0.01"
                min="0.01"
                className="w-full rounded-xl border border-[#E5E2DA] bg-white px-4 py-2.5 text-xl font-extrabold font-tabular text-[#1C1917] outline-none focus:border-[#D97706] focus:ring-1 focus:ring-[#D97706] dark:border-[#282C32] dark:bg-[#181B1E] dark:text-[#F3F4F6]"
                placeholder="0.00"
                value={manualAmount}
                onChange={(e) => setManualAmount(e.target.value)}
              />
            </div>
          )}

          {/* Payment Method Selector (for payments and instant purchases) */}
          {(movementKind === "pay" || payImmediately) && (
            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-[11px] font-bold text-[#78716C] dark:text-[#9CA3AF]">
                  MÉTODO DE PAGO
                </label>
                <PaymentMethodSelector
                  value={paymentMethod}
                  onChange={handlePrimaryMethodChange}
                  includePoints={clientPoints > 0}
                />
              </div>

              {paymentMethod === "points" && clientPoints > 0 && (
                <div className="rounded-xl border border-[#E5E2DA] bg-[#FAF7F0] p-3.5 dark:border-[#282C32] dark:bg-[#121417] space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-[#1C1917] dark:text-[#F3F4F6]">
                      Puntos a aplicar ({clientPoints.toFixed(2)} pts disp.)
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          setPointsToUse(
                            String(Number(maxUsablePoints.toFixed(2))),
                          )
                        }
                        className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[11px] font-bold text-amber-700 hover:bg-amber-500/20 dark:text-amber-300 transition"
                      >
                        Todo (${maxUsablePoints.toFixed(2)})
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setPointsToUse(
                            String(
                              Number((maxUsablePoints / 2).toFixed(2)),
                            ),
                          )
                        }
                        className="rounded-lg border border-[#E5E2DA] bg-white px-2 py-0.5 text-[11px] font-semibold text-[#57534E] hover:bg-[#FAF7F0] dark:border-[#282C32] dark:bg-[#181B1E] dark:text-[#9CA3AF] transition"
                      >
                        Parcial (50%)
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max={maxUsablePoints}
                      className="w-32 rounded-lg border border-[#E5E2DA] bg-white px-2.5 py-1.5 text-xs font-tabular outline-none focus:border-[#D97706] dark:border-[#282C32] dark:bg-[#181B1E] dark:text-[#F3F4F6]"
                      placeholder="Puntos a usar"
                      value={pointsToUse}
                      onChange={(e) => setPointsToUse(e.target.value)}
                    />
                    <span className="text-xs font-medium text-[#78716C] dark:text-[#9CA3AF]">
                      Cubierto con puntos:{" "}
                      <strong className="text-[#D97706] dark:text-[#F59E0B] font-tabular">
                        ${ptsDeduction.toFixed(2)}
                      </strong>
                    </span>
                  </div>

                  {computedTotal > 0 && remainingAfterPoints > 0 && (
                    <div className="pt-2 border-t border-[#E5E2DA] dark:border-[#282C32] space-y-2">
                      <label className="block text-[11px] font-bold text-[#78716C] dark:text-[#9CA3AF]">
                        MÉTODO PARA EL RESTO ($
                        {remainingAfterPoints.toFixed(2)})
                      </label>
                      <PaymentMethodSelector
                        value={secondaryPaymentMethod}
                        onChange={setSecondaryPaymentMethod}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Instant Payment toggle for purchases */}
          {movementKind === "purchase" && (
            <div className="rounded-xl border border-[#E5E2DA] bg-[#FAF7F0]/60 p-3 dark:border-[#282C32] dark:bg-[#121417]/60">
              <label className="flex items-center justify-between gap-2 cursor-pointer">
                <div>
                  <div className="text-xs font-semibold text-[#1C1917] dark:text-[#F3F4F6]">
                    ¿Se paga al instante en mostrador?
                  </div>
                  <div className="text-[11px] text-[#78716C] dark:text-[#9CA3AF]">
                    Si se activa, no queda como deuda pendiente en su libreta.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={payImmediately}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setPayImmediately(checked);
                    if (!checked && paymentMethod === "points") {
                      setPaymentMethod("cash");
                    }
                  }}
                  className="h-4 w-4 rounded border-[#E5E2DA] text-[#D97706] focus:ring-[#D97706]"
                />
              </label>
            </div>
          )}

          {/* Points usage option for credit purchases (fiado) */}
          {movementKind === "purchase" &&
            !payImmediately &&
            clientPoints > 0 &&
            computedTotal > 0 && (
              <div className="rounded-xl border border-[#E5E2DA] bg-[#FAF7F0] p-3.5 dark:border-[#282C32] dark:bg-[#121417] space-y-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-[#1C1917] dark:text-[#F3F4F6] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={usePoints}
                    onChange={(e) => {
                      setUsePoints(e.target.checked);
                      if (e.target.checked) {
                        setPointsToUse(
                          String(
                            Number(
                              Math.min(clientPoints, computedTotal).toFixed(2),
                            ),
                          ),
                        );
                      } else {
                        setPointsToUse("");
                      }
                    }}
                    className="h-4 w-4 rounded border-[#E5E2DA] text-[#D97706] focus:ring-[#D97706]"
                  />
                  Descontar parte o total con Puntos ({clientPoints.toFixed(1)}{" "}
                  pts disponibles)
                </label>
                {usePoints && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max={Math.min(clientPoints, computedTotal)}
                      className="w-28 sm:w-32 rounded-lg border border-[#E5E2DA] bg-white px-2.5 py-1.5 text-xs font-tabular outline-none focus:border-[#D97706] dark:border-[#282C32] dark:bg-[#181B1E] dark:text-[#F3F4F6]"
                      placeholder="Puntos a usar"
                      value={pointsToUse}
                      onChange={(e) => setPointsToUse(e.target.value)}
                    />
                    <span className="text-xs font-medium text-[#78716C] dark:text-[#9CA3AF]">
                      Descuento: -${ptsDeduction.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            )}

          {/* Credit Limit Alert Warning */}
          {isOverCreditLimit && (
            <div className="flex items-center gap-2.5 rounded-xl border border-[#FCA5A5]/60 bg-[#FEF2F2] p-3 text-xs text-[#991B1B] dark:border-[#7F1D1D] dark:bg-[#450A0A]/30 dark:text-[#FCA5A5]">
              <Icon
                path={mdiAlertCircleOutline}
                size={0.9}
                className="shrink-0 text-[#DC2626]"
              />
              <span>
                <strong>Atención:</strong> Esta compra dejará la deuda en{" "}
                <strong className="font-tabular">
                  ${resultingDebt.toFixed(2)}
                </strong>
                , superando el límite de{" "}
                <strong className="font-tabular">
                  ${creditLimit.toFixed(2)}
                </strong>
                . (Aún se permite fiar; se emitirá alerta tras registrar).
              </span>
            </div>
          )}

          {/* Total & Submit Button */}
          <div className="shrink-0 border-t border-[#E5E2DA] pt-4 dark:border-[#282C32]">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs font-bold text-[#78716C] dark:text-[#9CA3AF]">
                {movementKind === "purchase" ? "TOTAL A COBRAR" : "TOTAL ABONO"}
              </span>
              <span className="text-2xl font-extrabold font-tabular text-[#1C1917] dark:text-[#F3F4F6]">
                ${computedTotal.toFixed(2)}
              </span>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-[#E5E2DA] px-4 py-2 text-xs font-semibold text-[#57534E] hover:bg-[#FAF7F0] dark:border-[#282C32] dark:text-[#9CA3AF] dark:hover:bg-[#202428] transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={computedTotal <= 0}
                className={`rounded-xl px-5 py-2 text-xs font-bold text-white shadow-sm transition ${
                  computedTotal > 0
                    ? movementKind === "purchase"
                      ? "bg-[#D97706] hover:bg-[#B45309]"
                      : "bg-[#059669] hover:bg-[#047857]"
                    : "bg-[#D6D3CD] text-[#78716C] dark:bg-[#282C32] dark:text-[#6B7280] cursor-not-allowed"
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
