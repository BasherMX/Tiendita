import { useState } from "react";
import Icon from "@mdi/react";
import {
  mdiAccountGroup,
  mdiPlusCircle,
  mdiPencil,
  mdiDelete,
  mdiShareVariant,
  mdiWhatsapp,
  mdiCashPlus,
  mdiCashMinus,
  mdiStar,
  mdiShieldAccountOutline,
  mdiChevronLeft,
  mdiInformationOutline,
  mdiClockOutline,
} from "@mdi/js";

export default function ClientsPage({
  clients = [],
  selectedClient,
  movements = [],
  debtBreakdown = null,
  loadingMovements = false,
  onSelectClient,
  onNewClient,
  onEditClient,
  onDeleteClient,
  onOpenPurchaseModal,
  onOpenPayModal,
  onShareLink,
  onSendWhatsappStatement,
  onDeleteMovement,
  onViewDebtBreakdown,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDebt, setFilterDebt] = useState("all"); // "all" | "debt" | "clean"
  const [mobileView, setMobileView] = useState("list"); // "list" | "detail"

  const filteredClients = clients.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.phone && c.phone.includes(searchQuery));

    const debt = Number(c.total_debt || 0);
    if (filterDebt === "debt") return matchesSearch && debt > 0;
    if (filterDebt === "clean") return matchesSearch && debt <= 0;
    return matchesSearch;
  });

  function handleClientClick(client) {
    onSelectClient(client);
    setMobileView("detail");
  }

  const selectedDebt = Number(selectedClient?.total_debt || 0);
  const selectedPoints = Number(selectedClient?.points || 0);
  const selectedLimit = Number(selectedClient?.credit_limit || 0);

  return (
    <div className="grid gap-6 lg:h-[calc(100vh-8rem)] lg:grid-cols-2">
      {/* Columna Izquierda: Lista de Clientes */}
      <div
        className={`flex flex-col gap-4 lg:min-h-0 ${
          mobileView === "detail" && selectedClient ? "hidden lg:flex" : "flex"
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={onNewClient}
            className="flex items-center gap-2 rounded-2xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-600 transition"
          >
            <Icon path={mdiPlusCircle} size={0.8} />
            Nuevo Cliente
          </button>

          {/* Filtros rápidos de saldo */}
          <div className="flex rounded-2xl bg-slate-100 p-1 dark:bg-slate-800 text-xs font-semibold">
            <button
              onClick={() => setFilterDebt("all")}
              className={`rounded-xl px-2.5 py-1 transition ${
                filterDebt === "all"
                  ? "bg-white shadow-sm text-slate-900 dark:bg-slate-700 dark:text-slate-100"
                  : "text-slate-500"
              }`}
            >
              Todos ({clients.length})
            </button>
            <button
              onClick={() => setFilterDebt("debt")}
              className={`rounded-xl px-2.5 py-1 transition ${
                filterDebt === "debt"
                  ? "bg-white shadow-sm text-rose-600 dark:bg-slate-700 dark:text-rose-400"
                  : "text-slate-500"
              }`}
            >
              Con Deuda
            </button>
            <button
              onClick={() => setFilterDebt("clean")}
              className={`rounded-xl px-2.5 py-1 transition ${
                filterDebt === "clean"
                  ? "bg-white shadow-sm text-emerald-600 dark:bg-slate-700 dark:text-emerald-400"
                  : "text-slate-500"
              }`}
            >
              Al Día
            </button>
          </div>
        </div>

        <div className="flex flex-1 flex-col rounded-3xl border border-amber-100/70 bg-white/90 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 sm:p-6 lg:min-h-0">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-base font-bold text-slate-800 dark:text-slate-100">
              <Icon
                path={mdiAccountGroup}
                size={0.9}
                className="text-amber-500"
              />
              <span>Directorio de Clientes</span>
            </div>
            <span className="text-xs text-slate-500">
              {filteredClients.length} mostrados
            </span>
          </div>

          <div className="mb-3">
            <input
              className="w-full rounded-2xl border border-amber-100/70 bg-transparent px-4 py-2 text-sm outline-none dark:border-slate-700 dark:text-slate-100"
              placeholder="Buscar cliente por nombre o teléfono..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto pr-1 max-h-[60vh] lg:max-h-none lg:min-h-0">
            {filteredClients.map((client) => {
              const isSelected = selectedClient?.id === client.id;
              const debt = Number(client.total_debt || 0);
              const limit = Number(client.credit_limit || 0);
              return (
                <div
                  key={client.id}
                  className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-sm transition ${
                    isSelected
                      ? "border-amber-400 bg-amber-50/80 shadow-sm dark:border-amber-500/50 dark:bg-slate-800"
                      : "border-amber-100/70 bg-white/60 hover:bg-amber-50/50 dark:border-slate-800 dark:bg-slate-900/40"
                  }`}
                >
                  <button
                    onClick={() => handleClientClick(client)}
                    className="flex-1 text-left"
                  >
                    <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-100">
                      <span>{client.name}</span>
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-slate-800 dark:text-amber-300">
                        <Icon path={mdiStar} size={0.4} />
                        {Number(client.points || 0).toFixed(1)} pts
                      </span>
                    </div>

                    <div className="mt-0.5 flex items-center gap-3 text-xs">
                      <span
                        className={`font-semibold ${
                          debt > 0
                            ? "text-rose-600 dark:text-rose-400"
                            : debt < 0
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-slate-600 dark:text-slate-400"
                        }`}
                      >
                        Saldo: ${debt.toFixed(2)}
                      </span>

                      {limit > 0 && (
                        <span className="text-[11px] text-slate-400 flex items-center gap-0.5">
                          <Icon path={mdiShieldAccountOutline} size={0.5} />
                          Límite: ${limit.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onShareLink(client)}
                      title="Copiar enlace de estado de cuenta"
                      className="rounded-xl p-1.5 text-slate-500 hover:bg-amber-100 hover:text-amber-800 dark:hover:bg-slate-700"
                    >
                      <Icon path={mdiShareVariant} size={0.75} />
                    </button>
                    <button
                      onClick={() => onEditClient(client)}
                      title="Editar cliente"
                      className="rounded-xl p-1.5 text-slate-500 hover:bg-amber-100 hover:text-amber-800 dark:hover:bg-slate-700"
                    >
                      <Icon path={mdiPencil} size={0.75} />
                    </button>
                    <button
                      onClick={() => onDeleteClient(client)}
                      title="Eliminar cliente"
                      className="rounded-xl p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950"
                    >
                      <Icon path={mdiDelete} size={0.75} />
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredClients.length === 0 && (
              <div className="py-8 text-center text-sm text-slate-500">
                No se encontraron clientes
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Columna Derecha: Detalle del Cliente Seleccionado y Movimientos */}
      <div
        className={`flex flex-col gap-4 lg:min-h-0 ${
          mobileView === "list" && selectedClient ? "hidden lg:flex" : "flex"
        }`}
      >
        {selectedClient ? (
          <div className="flex flex-1 flex-col rounded-3xl border border-amber-100/70 bg-white/90 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 sm:p-6 lg:min-h-0">
            {/* Header del detalle */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMobileView("list")}
                  className="rounded-xl border p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden dark:border-slate-700"
                >
                  <Icon path={mdiChevronLeft} size={0.8} />
                </button>
                <div>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                    {selectedClient.name}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {selectedClient.phone || "Sin teléfono registrado"}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => onShareLink(selectedClient)}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <Icon path={mdiShareVariant} size={0.7} />
                  Enlace Público
                </button>
                <button
                  onClick={() => onSendWhatsappStatement(selectedClient)}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 shadow-sm transition"
                >
                  <Icon path={mdiWhatsapp} size={0.7} />
                  Enviar WhatsApp
                </button>
              </div>
            </div>

            {/* Tarjetas de Saldo, Puntos y Límite */}
            <div className="mb-4 grid grid-cols-3 gap-2.5">
              <div
                className={`rounded-2xl border p-3 ${
                  selectedDebt > 0
                    ? "border-rose-200 bg-rose-50/60 dark:border-rose-900/40 dark:bg-rose-950/30"
                    : selectedDebt < 0
                      ? "border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/40 dark:bg-emerald-950/30"
                      : "border-slate-200 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-800/40"
                }`}
              >
                <span className="text-[10px] font-semibold uppercase text-slate-500">
                  Saldo Deuda
                </span>
                <div
                  className={`text-lg font-black mt-0.5 ${
                    selectedDebt > 0
                      ? "text-rose-600 dark:text-rose-400"
                      : selectedDebt < 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-slate-700 dark:text-slate-300"
                  }`}
                >
                  ${Math.abs(selectedDebt).toFixed(2)}
                </div>
              </div>

              <div className="rounded-2xl border border-amber-100/70 bg-amber-50/40 p-3 dark:border-slate-800 dark:bg-slate-800/30">
                <span className="text-[10px] font-semibold uppercase text-slate-500">
                  Puntos
                </span>
                <div className="text-lg font-black text-amber-600 dark:text-amber-400 mt-0.5">
                  {selectedPoints.toFixed(1)} pts
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/40 p-3 dark:border-slate-800 dark:bg-slate-800/30">
                <span className="text-[10px] font-semibold uppercase text-slate-500">
                  Límite Crédito
                </span>
                <div className="text-lg font-black text-slate-700 dark:text-slate-300 mt-0.5">
                  {selectedLimit > 0
                    ? `$${selectedLimit.toFixed(2)}`
                    : "Sin límite"}
                </div>
              </div>
            </div>

            {/* Botones de Acción Rápida: Compra / Abono / Desglose */}
            <div className="mb-4 flex flex-wrap gap-2">
              <button
                onClick={onOpenPurchaseModal}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-amber-600 transition"
              >
                <Icon path={mdiCashMinus} size={0.8} />+ Fiar / Nueva Compra
              </button>
              <button
                onClick={onOpenPayModal}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition"
              >
                <Icon path={mdiCashPlus} size={0.8} />+ Abonar / Pagar
              </button>
              <button
                onClick={onViewDebtBreakdown}
                className="flex items-center gap-1.5 rounded-2xl border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <Icon path={mdiInformationOutline} size={0.8} />
                Desglose
              </button>
            </div>

            {/* Tabla de Movimientos */}
            <div className="flex-1 flex flex-col lg:min-h-0">
              <div className="mb-2 flex items-center justify-between text-xs font-bold uppercase text-slate-500">
                <span>Historial de Movimientos</span>
                <span>{movements.length} registros</span>
              </div>

              <div className="flex-1 overflow-y-auto rounded-2xl border border-amber-100/70 dark:border-slate-800">
                {loadingMovements ? (
                  <div className="py-12 text-center text-sm text-slate-500">
                    Cargando movimientos...
                  </div>
                ) : (
                  <table className="min-w-full text-left text-xs">
                    <thead className="sticky top-0 bg-amber-50 text-amber-950 dark:bg-slate-800 dark:text-amber-200">
                      <tr>
                        <th className="px-3 py-2">Fecha</th>
                        <th className="px-3 py-2">Concepto</th>
                        <th className="px-3 py-2">Método</th>
                        <th className="px-3 py-2 text-right">Monto</th>
                        <th className="px-2 py-2 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-100/70 dark:divide-slate-800">
                      {movements.map((m) => {
                        const isPositive = Number(m.amount) > 0;
                        return (
                          <tr
                            key={m.id}
                            className="hover:bg-amber-50/40 dark:hover:bg-slate-800/40"
                          >
                            <td className="px-3 py-2 text-slate-500 whitespace-nowrap">
                              {new Date(m.created_at).toLocaleDateString(
                                "es-MX",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )}
                            </td>
                            <td className="px-3 py-2 font-medium text-slate-800 dark:text-slate-200">
                              {m.concept}
                            </td>
                            <td className="px-3 py-2 text-slate-500 capitalize">
                              {m.payment_method === "cash"
                                ? "Efectivo"
                                : m.payment_method === "transfer"
                                  ? "Transferencia"
                                  : m.payment_method === "card"
                                    ? "Tarjeta"
                                    : m.payment_method === "credit"
                                      ? "Crédito"
                                      : m.payment_method || "—"}
                            </td>
                            <td
                              className={`px-3 py-2 text-right font-bold ${
                                isPositive
                                  ? "text-rose-600 dark:text-rose-400"
                                  : "text-emerald-600 dark:text-emerald-400"
                              }`}
                            >
                              {isPositive
                                ? `+$${Number(m.amount).toFixed(2)}`
                                : `-$${Math.abs(Number(m.amount)).toFixed(2)}`}
                            </td>
                            <td className="px-2 py-2 text-center">
                              <button
                                onClick={() => onDeleteMovement(m)}
                                title="Eliminar / deshacer movimiento"
                                className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950"
                              >
                                <Icon path={mdiDelete} size={0.65} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}

                      {movements.length === 0 && (
                        <tr>
                          <td
                            colSpan={5}
                            className="py-8 text-center text-slate-500"
                          >
                            Sin movimientos registrados para este cliente
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center rounded-3xl border border-dashed border-amber-200 bg-white/40 p-8 text-center text-slate-400 dark:border-slate-800 dark:bg-slate-900/40">
            <div>
              <Icon
                path={mdiAccountGroup}
                size={2}
                className="mx-auto mb-2 opacity-50"
              />
              <p className="text-sm font-semibold">
                Selecciona un cliente para ver su estado de cuenta
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
