import { useState } from "react";
import Icon from "@mdi/react";
import {
  mdiCashRegister,
  mdiClipboardList,
  mdiPlus,
  mdiDelete,
  mdiCashCheck,
} from "@mdi/js";
import SweetCombobox from "../components/SweetCombobox.jsx";
import PaymentMethodSelector from "../components/PaymentMethodSelector.jsx";

export default function PosPage({
  sweets = [],
  prices = [],
  pricesQuery = "",
  setPricesQuery,
  onRegisterSale,
}) {
  const [saleItems, setSaleItems] = useState([
    { id: 1, sweetId: "", quantity: 1 },
  ]);
  const [paymentMethod, setPaymentMethod] = useState("cash");

  const sweetById = new Map(sweets.map((s) => [String(s.id), s]));

  const computedTotal = saleItems.reduce((sum, item) => {
    const sweet = sweetById.get(String(item.sweetId));
    return (
      sum +
      (sweet ? Number(sweet.sale_price) * (Number(item.quantity) || 0) : 0)
    );
  }, 0);

  const filteredPrices = pricesQuery.trim()
    ? prices.filter((p) =>
        p.name.toLowerCase().includes(pricesQuery.trim().toLowerCase()),
      )
    : prices;

  function addItem() {
    setSaleItems((prev) => [
      ...prev,
      { id: Date.now(), sweetId: "", quantity: 1 },
    ]);
  }

  function removeItem(id) {
    if (saleItems.length <= 1) {
      setSaleItems([{ id: 1, sweetId: "", quantity: 1 }]);
      return;
    }
    setSaleItems((prev) => prev.filter((it) => it.id !== id));
  }

  function updateItem(id, field, value) {
    setSaleItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, [field]: value } : it)),
    );
  }

  async function handleSaleSubmit(e) {
    e.preventDefault();
    const validItems = saleItems.filter((it) => it.sweetId && it.quantity > 0);
    if (validItems.length === 0) return;

    await onRegisterSale({
      items: validItems,
      paymentMethod,
    });

    setSaleItems([{ id: 1, sweetId: "", quantity: 1 }]);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
      {/* POS - Ventas Rápidas de Mostrador */}
      <div className="rounded-3xl border border-amber-100/70 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-slate-100">
            <Icon path={mdiCashRegister} size={1} className="text-amber-500" />
            Venta Rápida de Mostrador
          </div>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            Contado
          </span>
        </div>

        <form onSubmit={handleSaleSubmit} className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold uppercase text-slate-500">
              <span>Producto</span>
              <span>Subtotal</span>
            </div>

            {saleItems.map((item) => {
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
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="rounded-full p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950"
                  >
                    <Icon path={mdiDelete} size={0.75} />
                  </button>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={addItem}
            className="flex items-center gap-1 text-xs font-semibold text-amber-600 hover:text-amber-700 dark:text-amber-400"
          >
            <Icon path={mdiPlus} size={0.7} />+ Agregar otro producto
          </button>

          {/* Payment Method Selector */}
          <div className="border-t border-slate-100 pt-3 dark:border-slate-800">
            <label className="mb-1.5 block text-xs font-semibold uppercase text-slate-500">
              Método de Pago
            </label>
            <PaymentMethodSelector
              value={paymentMethod}
              onChange={setPaymentMethod}
            />
          </div>

          {/* Total & Submit */}
          <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs uppercase text-slate-500 font-semibold">
                Total a Cobrar
              </span>
              <span className="text-3xl font-black text-amber-600 dark:text-amber-400">
                ${computedTotal.toFixed(2)}
              </span>
            </div>

            <button
              type="submit"
              disabled={computedTotal <= 0}
              className={`flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold text-white shadow-sm transition ${
                computedTotal > 0
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-slate-300 dark:bg-slate-700 cursor-not-allowed"
              }`}
            >
              <Icon path={mdiCashCheck} size={0.9} />
              Cobrar Venta (${computedTotal.toFixed(2)})
            </button>
          </div>
        </form>
      </div>

      {/* Lista Rápida de Precios */}
      <div className="rounded-3xl border border-amber-100/70 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-base font-bold text-slate-800 dark:text-slate-100">
            <Icon
              path={mdiClipboardList}
              size={0.9}
              className="text-amber-500"
            />
            Consulta de Precios
          </div>
          <input
            type="search"
            className="w-full sm:w-48 rounded-2xl border border-amber-100/70 bg-transparent px-3 py-1.5 text-xs outline-none dark:border-slate-700 dark:text-slate-100"
            placeholder="Buscar dulce..."
            value={pricesQuery}
            onChange={(e) => setPricesQuery(e.target.value)}
          />
        </div>

        <div className="max-h-[50vh] overflow-y-auto rounded-2xl border border-amber-100/70 dark:border-slate-800">
          <table className="min-w-full text-left text-xs">
            <thead className="sticky top-0 bg-amber-50 text-amber-950 dark:bg-slate-800 dark:text-amber-200">
              <tr>
                <th className="px-3 py-2">Producto</th>
                <th className="px-3 py-2 text-right">Precio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-100/70 dark:divide-slate-800">
              {filteredPrices.map((p, index) => (
                <tr
                  key={index}
                  className="hover:bg-amber-50/50 dark:hover:bg-slate-800/40"
                >
                  <td className="px-3 py-1.5 font-medium text-slate-800 dark:text-slate-200">
                    {p.name}
                  </td>
                  <td className="px-3 py-1.5 text-right font-bold text-amber-700 dark:text-amber-400">
                    ${Number(p.price || p.sale_price).toFixed(2)}
                  </td>
                </tr>
              ))}
              {filteredPrices.length === 0 && (
                <tr>
                  <td
                    colSpan={2}
                    className="px-4 py-4 text-center text-xs text-slate-500"
                  >
                    Sin resultados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
