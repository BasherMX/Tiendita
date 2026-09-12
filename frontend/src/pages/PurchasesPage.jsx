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
    <div className="space-y-6">
      {/* Formulario de Ticket de Reestock */}
      <div className="rounded-3xl border border-amber-100/70 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
        <div className="mb-2 flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-slate-100">
          <Icon
            path={mdiPackageVariantClosed}
            size={1}
            className="text-amber-500"
          />
          Registrar Ticket de Reestock (Compras)
        </div>
        <p className="mb-4 text-xs text-slate-500">
          Agrega varios productos al mismo ticket. La cantidad de piezas se
          sumará automáticamente al inventario.
        </p>

        <form onSubmit={handleTicketSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
              Lugar / Proveedor de Compra
            </label>
            <select
              required
              className="w-full sm:w-80 rounded-2xl border border-amber-100/70 bg-transparent px-4 py-2.5 text-sm outline-none dark:border-slate-700 dark:text-slate-100"
              value={ticketPlaceId}
              onChange={(e) => setTicketPlaceId(e.target.value)}
            >
              <option value="" className="dark:bg-slate-900">
                Seleccionar lugar...
              </option>
              {purchasePlaces.map((pl) => (
                <option key={pl.id} value={pl.id} className="dark:bg-slate-900">
                  {pl.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold uppercase text-slate-500">
              <span>Líneas de Compra</span>
              <span>Costo Paquete ($)</span>
            </div>

            {ticketItems.map((item, idx) => (
              <div
                key={item.id}
                className="grid gap-3 rounded-2xl border border-amber-100/70 p-3.5 dark:border-slate-800 sm:grid-cols-[minmax(0,1.5fr)_minmax(100px,0.4fr)_minmax(120px,0.5fr)_auto]"
              >
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase text-slate-400">
                    Producto #{idx + 1}
                  </label>
                  <select
                    className="w-full rounded-xl border border-amber-100/70 bg-transparent px-3 py-2 text-sm outline-none dark:border-slate-700 dark:text-slate-100"
                    value={item.sweetId}
                    onChange={(e) => {
                      updateItem(item.id, "sweetId", e.target.value);
                      if (e.target.value)
                        updateItem(item.id, "productName", "");
                    }}
                  >
                    <option value="" className="dark:bg-slate-900">
                      Producto nuevo / manual
                    </option>
                    {sweets.map((s) => (
                      <option
                        key={s.id}
                        value={s.id}
                        className="dark:bg-slate-900"
                      >
                        {s.name}
                      </option>
                    ))}
                  </select>

                  {!item.sweetId && (
                    <input
                      required
                      className="mt-2 w-full rounded-xl border border-amber-100/70 bg-transparent px-3 py-2 text-xs outline-none dark:border-slate-700 dark:text-slate-100"
                      placeholder="Nombre del producto nuevo..."
                      value={item.productName}
                      onChange={(e) =>
                        updateItem(item.id, "productName", e.target.value)
                      }
                    />
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase text-slate-400">
                    Piezas a Sumar
                  </label>
                  <input
                    required
                    type="number"
                    min="1"
                    className="w-full rounded-xl border border-amber-100/70 bg-transparent px-3 py-2 text-sm outline-none dark:border-slate-700 dark:text-slate-100"
                    value={item.quantity}
                    onChange={(e) =>
                      updateItem(item.id, "quantity", e.target.value)
                    }
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase text-slate-400">
                    Costo Total ($)
                  </label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-full rounded-xl border border-amber-100/70 bg-transparent px-3 py-2 text-sm outline-none dark:border-slate-700 dark:text-slate-100"
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
                    className="w-full rounded-xl border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:border-rose-900/50 dark:hover:bg-rose-950/40"
                  >
                    Quitar
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-1 rounded-xl border border-amber-200 px-4 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-50 dark:border-slate-700 dark:text-amber-300"
            >
              <Icon path={mdiPlus} size={0.7} />+ Agregar otro producto
            </button>

            <div className="flex items-center gap-4">
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Total Ticket: ${totalTicketCost.toFixed(2)}
              </span>
              <button
                type="submit"
                className="rounded-2xl bg-amber-500 px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-amber-600 transition"
              >
                Guardar Ticket
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Lugares de Compra / Proveedores */}
      <div className="rounded-3xl border border-amber-100/70 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
        <div className="mb-4 flex items-center gap-2 text-base font-bold text-slate-800 dark:text-slate-100">
          <Icon path={mdiStore} size={0.9} className="text-amber-500" />
          Proveedores y Lugares de Surtido
        </div>

        <form onSubmit={handlePlaceSubmit} className="mb-4 flex max-w-md gap-2">
          <input
            required
            className="flex-1 rounded-2xl border border-amber-100/70 bg-transparent px-4 py-2 text-sm outline-none dark:border-slate-700 dark:text-slate-100"
            placeholder="Ej. Dulcería El Trébol"
            value={newPlaceName}
            onChange={(e) => setNewPlaceName(e.target.value)}
          />
          <button
            type="submit"
            className="flex items-center gap-1 rounded-2xl bg-amber-500 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-amber-600"
          >
            <Icon path={mdiMapMarkerPlus} size={0.7} />
            Agregar
          </button>
        </form>

        <div className="flex flex-wrap gap-2">
          {purchasePlaces.map((p) => (
            <span
              key={p.id}
              className="rounded-full bg-amber-100 px-3.5 py-1 text-xs font-semibold text-amber-900 dark:bg-slate-800 dark:text-amber-200"
            >
              {p.name}
            </span>
          ))}
          {purchasePlaces.length === 0 && (
            <span className="text-xs text-slate-400">
              Sin lugares registrados
            </span>
          )}
        </div>
      </div>

      {/* Historial de Compras */}
      <div className="rounded-3xl border border-amber-100/70 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
        <div className="mb-4 text-base font-bold text-slate-800 dark:text-slate-100">
          Historial de Reestock
        </div>

        <div className="max-h-[50vh] overflow-y-auto rounded-2xl border border-amber-100/70 dark:border-slate-800">
          <table className="min-w-full text-left text-xs">
            <thead className="sticky top-0 bg-amber-50 text-amber-950 dark:bg-slate-800 dark:text-amber-200">
              <tr>
                <th className="px-4 py-2.5">Fecha</th>
                <th className="px-4 py-2.5">Producto</th>
                <th className="px-4 py-2.5">Lugar</th>
                <th className="px-4 py-2.5 text-right">Costo Paquete</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-100/70 dark:divide-slate-800">
              {packagePurchases.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-amber-50/40 dark:hover:bg-slate-800/40"
                >
                  <td className="px-4 py-2 text-slate-500">
                    {new Date(item.created_at).toLocaleString("es-MX", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-2 font-medium text-slate-800 dark:text-slate-200">
                    {item.product_name}
                  </td>
                  <td className="px-4 py-2 text-slate-600 dark:text-slate-400">
                    {item.place_name || "—"}
                  </td>
                  <td className="px-4 py-2 text-right font-bold text-slate-800 dark:text-slate-100">
                    ${Number(item.package_cost).toFixed(2)}
                  </td>
                </tr>
              ))}

              {packagePurchases.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-6 text-center text-slate-500"
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
