import { useState } from "react";
import Icon from "@mdi/react";
import {
  mdiPackageVariantClosed,
  mdiStore,
  mdiPlus,
  mdiDelete,
  mdiMapMarkerPlus,
} from "@mdi/js";

export default function PurchasesPage({
  purchasePlaces = [],
  packagePurchases = [],
  sweets = [],
  onAddPlace,
  onAddPurchaseTicket,
}) {
  const [newPlaceName, setNewPlaceName] = useState("");
  const [ticketPlaceId, setTicketPlaceId] = useState("");
  const [ticketItems, setTicketItems] = useState([
    { id: 1, sweetId: "", productName: "", quantity: 1, packageCost: "" },
  ]);

  function addItem() {
    setTicketItems((prev) => [
      ...prev,
      {
        id: Date.now(),
        sweetId: "",
        productName: "",
        quantity: 1,
        packageCost: "",
      },
    ]);
  }

  function removeItem(id) {
    if (ticketItems.length <= 1) return;
    setTicketItems((prev) => prev.filter((it) => it.id !== id));
  }

  function updateItem(id, field, value) {
    setTicketItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, [field]: value } : it)),
    );
  }

  function handlePlaceSubmit(e) {
    e.preventDefault();
    if (!newPlaceName.trim()) return;
    onAddPlace(newPlaceName.trim());
    setNewPlaceName("");
  }

  function handleTicketSubmit(e) {
    e.preventDefault();
    if (!ticketPlaceId) return;
    onAddPurchaseTicket({
      placeId: ticketPlaceId,
      items: ticketItems,
    });
    setTicketItems([
      { id: 1, sweetId: "", productName: "", quantity: 1, packageCost: "" },
    ]);
  }

  const totalTicketCost = ticketItems.reduce(
    (sum, it) => sum + (Number(it.packageCost) || 0),
    0,
  );

  return (
    <div className="space-y-5">
      {/* Formulario de Entrada de Mercancía / Reestock */}
      <div className="rounded-2xl border border-[#E5E2DA] bg-[#FFFFFF] p-4 sm:p-6 shadow-xs dark:border-[#282C32] dark:bg-[#181B1E]">
        <div className="mb-4 border-b border-[#E5E2DA] pb-3 dark:border-[#282C32]">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-500/20 bg-amber-500/10 text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-300">
              <Icon path={mdiPackageVariantClosed} size={0.75} />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1C1917] dark:text-[#F3F2EE] leading-tight">
                Registrar Entrada de Mercancía
              </h2>
              <p className="text-[11px] text-[#78716C] dark:text-[#9CA3AF]">
                Las piezas ingresadas se sumarán automáticamente a las
                existencias del inventario
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleTicketSubmit} className="space-y-4">
          <div className="max-w-xs">
            <label className="mb-1.5 block text-[11px] font-bold text-[#78716C] dark:text-[#9CA3AF]">
              Proveedor o Lugar de Compra
            </label>
            <select
              required
              className="w-full rounded-xl border border-[#E5E2DA] bg-[#F7F6F2] px-3 py-2 text-xs outline-none dark:border-[#282C32] dark:bg-[#111315] text-[#1C1917] dark:text-[#F3F2EE]"
              value={ticketPlaceId}
              onChange={(e) => setTicketPlaceId(e.target.value)}
            >
              <option value="" className="dark:bg-[#181B1E]">
                Seleccionar proveedor...
              </option>
              {purchasePlaces.map((pl) => (
                <option key={pl.id} value={pl.id} className="dark:bg-[#181B1E]">
                  {pl.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2.5">
            <div className="text-[11px] font-bold text-[#78716C] dark:text-[#9CA3AF]">
              Renglones de Compra
            </div>

            {ticketItems.map((item, idx) => (
              <div
                key={item.id}
                className="grid gap-3 rounded-xl border border-[#E5E2DA] bg-[#F7F6F2]/40 p-3 dark:border-[#282C32] dark:bg-[#111315]/40 sm:grid-cols-[minmax(0,1.5fr)_minmax(100px,0.4fr)_minmax(120px,0.5fr)_auto]"
              >
                <div>
                  <label className="mb-1 block text-[10px] font-bold text-[#78716C] dark:text-[#9CA3AF]">
                    Producto #{idx + 1}
                  </label>
                  <select
                    className="w-full rounded-lg border border-[#E5E2DA] bg-[#FFFFFF] px-2.5 py-1.5 text-xs outline-none dark:border-[#282C32] dark:bg-[#181B1E] text-[#1C1917] dark:text-[#F3F2EE]"
                    value={item.sweetId}
                    onChange={(e) => {
                      updateItem(item.id, "sweetId", e.target.value);
                      if (e.target.value)
                        updateItem(item.id, "productName", "");
                    }}
                  >
                    <option value="" className="dark:bg-[#181B1E]">
                      Producto nuevo / escribir nombre
                    </option>
                    {sweets.map((s) => (
                      <option
                        key={s.id}
                        value={s.id}
                        className="dark:bg-[#181B1E]"
                      >
                        {s.name}
                      </option>
                    ))}
                  </select>

                  {!item.sweetId && (
                    <input
                      required
                      className="mt-1.5 w-full rounded-lg border border-[#E5E2DA] bg-[#FFFFFF] px-2.5 py-1.5 text-xs outline-none dark:border-[#282C32] dark:bg-[#181B1E] text-[#1C1917] dark:text-[#F3F2EE]"
                      placeholder="Nombre del nuevo producto..."
                      value={item.productName}
                      onChange={(e) =>
                        updateItem(item.id, "productName", e.target.value)
                      }
                    />
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-[10px] font-bold text-[#78716C] dark:text-[#9CA3AF]">
                    Piezas Nuevas
                  </label>
                  <input
                    required
                    type="number"
                    min="1"
                    className="w-full rounded-lg border border-[#E5E2DA] bg-[#FFFFFF] px-2.5 py-1.5 text-xs font-tabular outline-none dark:border-[#282C32] dark:bg-[#181B1E] text-[#1C1917] dark:text-[#F3F2EE]"
                    value={item.quantity}
                    onChange={(e) =>
                      updateItem(item.id, "quantity", e.target.value)
                    }
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[10px] font-bold text-[#78716C] dark:text-[#9CA3AF]">
                    Costo Total ($)
                  </label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-full rounded-lg border border-[#E5E2DA] bg-[#FFFFFF] px-2.5 py-1.5 text-xs font-tabular outline-none dark:border-[#282C32] dark:bg-[#181B1E] text-[#1C1917] dark:text-[#F3F2EE]"
                    placeholder="0.00"
                    value={item.packageCost}
                    onChange={(e) =>
                      updateItem(item.id, "packageCost", e.target.value)
                    }
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="w-full sm:w-auto rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-950/40 transition"
                  >
                    Quitar
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E5E2DA] pt-4 dark:border-[#282C32]">
            <button
              type="button"
              onClick={addItem}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#E5E2DA] bg-[#FFFFFF] px-3.5 py-2 text-xs font-bold text-[#1C1917] hover:bg-[#F7F6F2] dark:border-[#282C32] dark:bg-[#181B1E] dark:text-[#F3F2EE] dark:hover:bg-[#282C32] transition"
            >
              <Icon path={mdiPlus} size={0.65} />
              <span>Agregar renglón</span>
            </button>

            <div className="flex items-center gap-4">
              <span className="text-xs font-bold font-tabular text-[#1C1917] dark:text-[#F3F2EE]">
                Total de Remisión:{" "}
                <strong className="text-base text-amber-700 dark:text-amber-400 font-black ml-1">
                  ${totalTicketCost.toFixed(2)}
                </strong>
              </span>
              <button
                type="submit"
                className="rounded-xl bg-amber-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-amber-700 active:scale-[0.98] transition"
              >
                Guardar Remisión
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Proveedores de Surtido */}
      <div className="rounded-2xl border border-[#E5E2DA] bg-[#FFFFFF] p-4 sm:p-6 shadow-xs dark:border-[#282C32] dark:bg-[#181B1E]">
        <div className="mb-3 flex items-center gap-2 border-b border-[#E5E2DA] pb-3 dark:border-[#282C32]">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E5E2DA] bg-[#F7F6F2] text-[#57534E] dark:border-[#282C32] dark:bg-[#111315] dark:text-[#9CA3AF]">
            <Icon path={mdiStore} size={0.7} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#1C1917] dark:text-[#F3F2EE] leading-tight">
              Proveedores y Dulcerías
            </h2>
            <p className="text-[11px] text-[#78716C] dark:text-[#9CA3AF]">
              Lugares habituales donde se compran los dulces
            </p>
          </div>
        </div>

        <form
          onSubmit={handlePlaceSubmit}
          className="mb-3.5 flex max-w-md gap-2"
        >
          <input
            required
            className="flex-1 rounded-xl border border-[#E5E2DA] bg-[#F7F6F2] px-3 py-1.5 text-xs outline-none dark:border-[#282C32] dark:bg-[#111315] text-[#1C1917] dark:text-[#F3F2EE]"
            placeholder="Ej. Dulcería El Trébol"
            value={newPlaceName}
            onChange={(e) => setNewPlaceName(e.target.value)}
          />
          <button
            type="submit"
            className="flex items-center gap-1 rounded-xl bg-amber-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-amber-700 active:scale-[0.98] transition"
          >
            <Icon path={mdiMapMarkerPlus} size={0.65} />
            <span>Agregar</span>
          </button>
        </form>

        <div className="flex flex-wrap gap-1.5">
          {purchasePlaces.map((p) => (
            <span
              key={p.id}
              className="rounded-lg border border-amber-500/20 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-900 dark:border-amber-400/20 dark:bg-amber-950/40 dark:text-amber-300"
            >
              {p.name}
            </span>
          ))}
          {purchasePlaces.length === 0 && (
            <span className="text-xs text-[#78716C] dark:text-[#9CA3AF]">
              No hay proveedores registrados aún
            </span>
          )}
        </div>
      </div>

      {/* Historial de Compras */}
      <div className="rounded-2xl border border-[#E5E2DA] bg-[#FFFFFF] p-4 sm:p-6 shadow-xs dark:border-[#282C32] dark:bg-[#181B1E]">
        <div className="mb-3 text-sm font-bold text-[#1C1917] dark:text-[#F3F2EE]">
          Historial de Reestock Registrado
        </div>

        <div className="max-h-[50vh] overflow-y-auto rounded-xl border border-[#E5E2DA] dark:border-[#282C32]">
          <table className="min-w-full text-left text-xs">
            <thead className="sticky top-0 bg-[#F7F6F2] text-[#57534E] border-b border-[#E5E2DA] dark:bg-[#111315] dark:text-[#9CA3AF] dark:border-[#282C32] z-10">
              <tr>
                <th className="px-3.5 py-2 font-semibold">Fecha</th>
                <th className="px-3.5 py-2 font-semibold">Producto</th>
                <th className="px-3.5 py-2 font-semibold">Proveedor</th>
                <th className="px-3.5 py-2 text-right font-semibold">
                  Costo Paquete
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E2DA] dark:divide-[#282C32] font-tabular">
              {packagePurchases.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-[#F7F6F2]/60 dark:hover:bg-[#202428]/50 transition-colors"
                >
                  <td className="px-3.5 py-2 text-[#78716C] dark:text-[#9CA3AF] whitespace-nowrap">
                    {new Date(item.created_at).toLocaleString("es-MX", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-3.5 py-2 font-bold text-[#1C1917] dark:text-[#F3F2EE]">
                    {item.product_name}
                  </td>
                  <td className="px-3.5 py-2 text-[#78716C] dark:text-[#9CA3AF]">
                    {item.place_name || "—"}
                  </td>
                  <td className="px-3.5 py-2 text-right font-black text-[#1C1917] dark:text-[#F3F2EE]">
                    ${Number(item.package_cost).toFixed(2)}
                  </td>
                </tr>
              ))}

              {packagePurchases.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-xs text-[#78716C] dark:text-[#9CA3AF]"
                  >
                    Sin compras registradas aún
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
