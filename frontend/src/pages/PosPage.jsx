import { useState } from "react";
import Icon from "@mdi/react";
import {
  mdiCashRegister,
  mdiClipboardList,
  mdiPlus,
  mdiDelete,
  mdiCashCheck,
  mdiMagnify,
  mdiMinus,
  mdiClose,
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

  function changeQty(id, delta) {
    setSaleItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const nextQty = Math.max(1, (Number(it.quantity) || 1) + delta);
        return { ...it, quantity: nextQty };
      }),
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
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
      {/* Terminal de Punto de Venta */}
      <div className="flex flex-col rounded-2xl border border-[#E5E2DA] bg-[#FFFFFF] p-4 sm:p-6 shadow-xs dark:border-[#282C32] dark:bg-[#181B1E]">
        <div className="mb-4 flex items-center justify-between border-b border-[#E5E2DA] pb-3 dark:border-[#282C32]">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-500/20 bg-amber-500/10 text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-300">
              <Icon path={mdiCashRegister} size={0.75} />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1C1917] dark:text-[#F3F2EE] leading-tight">
                Venta Rápida de Mostrador
              </h2>
              <p className="text-[11px] text-[#78716C] dark:text-[#9CA3AF]">
                Cobro directo al contado
              </p>
            </div>
          </div>
          <span className="inline-flex items-center rounded-md border border-emerald-600/20 bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-950/40 dark:text-emerald-300">
            Caja Activa
          </span>
        </div>

        <form
          onSubmit={handleSaleSubmit}
          className="flex flex-col flex-1 space-y-4"
        >
          <div className="space-y-2.5 flex-1">
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
                  className="flex items-center gap-2 rounded-xl border border-[#E5E2DA] bg-[#F7F6F2]/50 p-2 dark:border-[#282C32] dark:bg-[#111315]/40"
                >
                  <div className="flex-1 min-w-0">
                    <SweetCombobox
                      sweets={sweets}
                      value={item.sweetId}
                      onChange={(val) => updateItem(item.id, "sweetId", val)}
                    />
                  </div>

                  {/* Selector rápido de cantidad */}
                  <div className="flex items-center rounded-lg border border-[#E5E2DA] bg-[#FFFFFF] dark:border-[#282C32] dark:bg-[#181B1E]">
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
                      className="w-10 bg-transparent text-center text-xs font-bold font-tabular outline-none text-[#1C1917] dark:text-[#F3F2EE]"
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

                  <div className="w-16 text-right text-xs font-bold font-tabular text-[#1C1917] dark:text-[#F3F2EE]">
                    ${sub.toFixed(2)}
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="rounded-lg p-1 text-[#78716C] hover:bg-red-50 hover:text-red-600 dark:text-[#9CA3AF] dark:hover:bg-red-950/40 dark:hover:text-red-400 transition"
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
              className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300 transition mt-1"
            >
              <Icon path={mdiPlus} size={0.6} />
              <span>Agregar otro artículo</span>
            </button>
          </div>

          {/* Método de pago */}
          <div className="border-t border-[#E5E2DA] pt-3.5 dark:border-[#282C32]">
            <label className="mb-2 block text-[11px] font-bold text-[#78716C] dark:text-[#9CA3AF]">
              Forma de Pago
            </label>
            <PaymentMethodSelector
              value={paymentMethod}
              onChange={setPaymentMethod}
            />
          </div>

          {/* Totalizador de Mostrador */}
          <div className="rounded-xl border border-[#E5E2DA] bg-[#F7F6F2] p-4 dark:border-[#282C32] dark:bg-[#111315]">
            <div className="flex items-baseline justify-between mb-3">
              <span className="text-xs font-bold text-[#78716C] dark:text-[#9CA3AF]">
                Total de la Venta
              </span>
              <span className="text-3xl font-black font-tabular text-amber-700 dark:text-amber-400">
                ${computedTotal.toFixed(2)}
              </span>
            </div>

            <button
              type="submit"
              disabled={computedTotal <= 0}
              className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold text-white shadow-xs transition ${
                computedTotal > 0
                  ? "bg-emerald-700 hover:bg-emerald-800 active:scale-[0.99]"
                  : "bg-[#D6D1C4] dark:bg-[#282C32] cursor-not-allowed text-stone-500"
              }`}
            >
              <Icon path={mdiCashCheck} size={0.75} />
              <span>Completar Cobro (${computedTotal.toFixed(2)})</span>
            </button>
          </div>
        </form>
      </div>

      {/* Consulta de Precios */}
      <div className="flex flex-col rounded-2xl border border-[#E5E2DA] bg-[#FFFFFF] p-4 sm:p-6 shadow-xs dark:border-[#282C32] dark:bg-[#181B1E]">
        <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2 border-b border-[#E5E2DA] pb-3 dark:border-[#282C32]">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E5E2DA] bg-[#F7F6F2] text-[#57534E] dark:border-[#282C32] dark:bg-[#111315] dark:text-[#9CA3AF]">
              <Icon path={mdiClipboardList} size={0.7} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#1C1917] dark:text-[#F3F2EE] leading-tight">
                Lista de Precios
              </h2>
              <p className="text-[11px] text-[#78716C] dark:text-[#9CA3AF]">
                {filteredPrices.length} productos disponibles
              </p>
            </div>
          </div>

          <div className="relative w-full sm:w-44">
            <Icon
              path={mdiMagnify}
              size={0.65}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#78716C] dark:text-[#9CA3AF] pointer-events-none"
            />
            <input
              type="text"
              className="w-full rounded-lg border border-[#E5E2DA] bg-[#F7F6F2] py-1.5 pl-8 pr-7 text-xs outline-none dark:border-[#282C32] dark:bg-[#111315] text-[#1C1917] dark:text-[#F3F2EE]"
              placeholder="Buscar precio..."
              value={pricesQuery}
              onChange={(e) => setPricesQuery(e.target.value)}
            />
            {pricesQuery && (
              <button
                type="button"
                onClick={() => setPricesQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-[#78716C] hover:bg-[#E5E2DA]/60 hover:text-[#1C1917] dark:text-[#9CA3AF] dark:hover:bg-[#282C32] dark:hover:text-[#F3F2EE] transition"
                title="Limpiar búsqueda"
              >
                <Icon path={mdiClose} size={0.55} />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 max-h-[55vh] overflow-y-auto rounded-xl border border-[#E5E2DA] dark:border-[#282C32]">
          <table className="min-w-full text-left text-xs">
            <thead className="sticky top-0 bg-[#F7F6F2] text-[#57534E] border-b border-[#E5E2DA] dark:bg-[#111315] dark:text-[#9CA3AF] dark:border-[#282C32] z-10">
              <tr>
                <th className="px-3 py-2 font-semibold">Producto</th>
                <th className="px-3 py-2 text-right font-semibold">Precio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E2DA] dark:divide-[#282C32] font-tabular">
              {filteredPrices.map((p, index) => (
                <tr
                  key={index}
                  className="hover:bg-[#F7F6F2]/60 dark:hover:bg-[#202428]/50 transition-colors"
                >
                  <td className="px-3 py-2 font-medium text-[#1C1917] dark:text-[#F3F2EE]">
                    {p.name}
                  </td>
                  <td className="px-3 py-2 text-right font-bold text-amber-700 dark:text-amber-400">
                    ${Number(p.price || p.sale_price).toFixed(2)}
                  </td>
                </tr>
              ))}
              {filteredPrices.length === 0 && (
                <tr>
                  <td
                    colSpan={2}
                    className="px-4 py-8 text-center text-xs text-[#78716C] dark:text-[#9CA3AF]"
                  >
                    No se encontraron productos
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
