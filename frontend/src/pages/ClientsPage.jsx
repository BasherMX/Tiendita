import { useState } from "react";
import Icon from "@mdi/react";
import {
  mdiAccountGroup,
  mdiPlus,
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
  mdiMagnify,
  mdiPhone,
  mdiCheckCircleOutline,
} from "@mdi/js";

export default function ClientsPage({
  clients = [],
  selectedClient,
  movements = [],
  debtBreakdown = null,
  loadingMovements = false,
  settings,
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
  const defaultLimit = Number(settings?.default_credit_limit) || 50;
  const selectedLimit =
    Number(selectedClient?.credit_limit) > 0
      ? Number(selectedClient?.credit_limit)
      : defaultLimit;
  const isOverCreditLimit = selectedDebt > selectedLimit;
  const availableCredit = Math.max(0, selectedLimit - selectedDebt);
  const daysWithDebt = Number(selectedClient?.days_with_debt || 0);

  return (
    <div className="grid gap-5 lg:h-[calc(100vh-6.5rem)] lg:grid-cols-[minmax(320px,420px)_1fr]">
      {/* Columna Izquierda: Directorio de Clientes */}
      <div
        className={`flex flex-col gap-3 lg:min-h-0 ${
          mobileView === "detail" && selectedClient ? "hidden lg:flex" : "flex"
        }`}
      >
        {/* Acciones superiores del directorio */}
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onNewClient}
            className="flex items-center gap-1.5 rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-amber-700 active:scale-[0.98] transition"
          >
            <Icon path={mdiPlus} size={0.7} />
            Nuevo Cliente
          </button>

          {/* Filtros rápidos por estado de cuenta */}
          <div className="flex rounded-xl border border-[#E5E2DA] bg-[#FFFFFF] p-1 text-[11px] font-semibold dark:border-[#282C32] dark:bg-[#181B1E]">
            <button
              onClick={() => setFilterDebt("all")}
              className={`rounded-lg px-2.5 py-1 transition ${
                filterDebt === "all"
                  ? "bg-amber-500/15 text-amber-950 dark:bg-amber-400/20 dark:text-amber-200 font-bold"
                  : "text-[#78716C] hover:text-[#1C1917] dark:text-[#9CA3AF] dark:hover:text-[#F3F2EE]"
              }`}
            >
              Todos ({clients.length})
            </button>
            <button
              onClick={() => setFilterDebt("debt")}
              className={`rounded-lg px-2.5 py-1 transition ${
                filterDebt === "debt"
                  ? "bg-red-500/15 text-red-700 dark:bg-red-950/60 dark:text-red-300 font-bold"
                  : "text-[#78716C] hover:text-[#1C1917] dark:text-[#9CA3AF] dark:hover:text-[#F3F2EE]"
              }`}
            >
              Con Deuda
            </button>
            <button
              onClick={() => setFilterDebt("clean")}
              className={`rounded-lg px-2.5 py-1 transition ${
                filterDebt === "clean"
                  ? "bg-emerald-500/15 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold"
                  : "text-[#78716C] hover:text-[#1C1917] dark:text-[#9CA3AF] dark:hover:text-[#F3F2EE]"
              }`}
            >
              Al Día
            </button>
          </div>
        </div>

        {/* Directorio Card */}
        <div className="flex flex-1 flex-col rounded-2xl border border-[#E5E2DA] bg-[#FFFFFF] p-3 sm:p-4 shadow-xs dark:border-[#282C32] dark:bg-[#181B1E] lg:min-h-0">
          <div className="mb-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-[#1C1917] dark:text-[#F3F2EE]">
              <Icon
                path={mdiAccountGroup}
                size={0.75}
                className="text-amber-600"
              />
              <span>Directorio</span>
            </div>
            <span className="text-[11px] font-medium text-[#78716C] dark:text-[#9CA3AF]">
              {filteredClients.length} de {clients.length}
            </span>
          </div>

          {/* Campo de búsqueda */}
          <div className="relative mb-2.5">
            <Icon
              path={mdiMagnify}
              size={0.7}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#78716C] dark:text-[#9CA3AF]"
            />
            <input
              className="w-full rounded-xl border border-[#E5E2DA] bg-[#F7F6F2] py-2 pl-9 pr-3 text-xs outline-none transition focus:bg-[#FFFFFF] dark:border-[#282C32] dark:bg-[#111315] dark:focus:bg-[#181B1E] text-[#1C1917] dark:text-[#F3F2EE]"
              placeholder="Buscar por nombre o teléfono..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Lista de clientes */}
          <div className="flex-1 space-y-1.5 overflow-y-auto pr-0.5 max-h-[60vh] lg:max-h-none lg:min-h-0">
            {filteredClients.map((client) => {
              const isSelected = selectedClient?.id === client.id;
              const debt = Number(client.total_debt || 0);
              const limit = Number(client.credit_limit || 0);

              return (
                <div
                  key={client.id}
                  className={`group flex items-center justify-between rounded-xl border p-2.5 text-xs transition cursor-pointer ${
                    isSelected
                      ? "border-amber-500/50 bg-amber-50/60 dark:border-amber-400/40 dark:bg-amber-950/20 shadow-xs"
                      : "border-[#E5E2DA] bg-[#FFFFFF] hover:border-amber-500/30 hover:bg-[#F7F6F2] dark:border-[#282C32] dark:bg-[#181B1E] dark:hover:border-amber-400/20 dark:hover:bg-[#202428]"
                  }`}
                  onClick={() => handleClientClick(client)}
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center gap-1.5 font-bold text-[#1C1917] dark:text-[#F3F2EE] truncate">
                      <span className="truncate">{client.name}</span>
                      {Number(client.points || 0) > 0 && (
                        <span className="shrink-0 inline-flex items-center gap-0.5 rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold text-amber-900 dark:bg-amber-400/15 dark:text-amber-300">
                          <Icon path={mdiStar} size={0.35} />
                          {Number(client.points || 0).toFixed(0)}
                        </span>
                      )}
                    </div>

                    <div className="mt-1 flex items-center gap-2 font-tabular">
                      <span
                        className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold ${
                          debt > 0
                            ? "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300"
                            : debt < 0
                              ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
                              : "bg-stone-100 text-stone-600 dark:bg-[#282C32] dark:text-stone-300"
                        }`}
                      >
                        {debt > 0
                          ? `Debe $${debt.toFixed(2)}`
                          : debt < 0
                            ? `A favor $${Math.abs(debt).toFixed(2)}`
                            : "Al día ($0.00)"}
                      </span>

                      {limit > 0 && (
                        <span className="text-[10px] text-[#78716C] dark:text-[#9CA3AF]">
                          Límite: ${limit.toFixed(0)}
                        </span>
                      )}

                      {client.is_over_credit_limit && (
                        <span className="rounded bg-red-100 px-1.5 py-0.5 text-[9px] font-bold text-red-800 dark:bg-red-950/60 dark:text-red-300">
                          Excede Límite
                        </span>
                      )}

                      {client.days_with_debt > 15 && (
                        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-900 dark:bg-amber-950/60 dark:text-amber-300">
                          {client.days_with_debt}d adeudo
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Acciones rápidas en la fila */}
                  <div
                    className="flex items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => onEditClient(client)}
                      title="Editar cliente"
                      className="rounded-lg p-1 text-[#78716C] hover:bg-amber-100 hover:text-amber-900 dark:text-[#9CA3AF] dark:hover:bg-[#282C32] dark:hover:text-amber-300 transition"
                    >
                      <Icon path={mdiPencil} size={0.65} />
                    </button>
                    <button
                      onClick={() => onDeleteClient(client)}
                      title="Eliminar cliente"
                      className="rounded-lg p-1 text-[#78716C] hover:bg-red-50 hover:text-red-600 dark:text-[#9CA3AF] dark:hover:bg-red-950/40 dark:hover:text-red-400 transition"
                    >
                      <Icon path={mdiDelete} size={0.65} />
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredClients.length === 0 && (
              <div className="py-10 text-center text-xs text-[#78716C] dark:text-[#9CA3AF]">
                No hay clientes que coincidan con la búsqueda
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Columna Derecha: Detalle del Cliente Seleccionado */}
      <div
        className={`flex flex-col gap-3 lg:min-h-0 ${
          mobileView === "list" && selectedClient ? "hidden lg:flex" : "flex"
        }`}
      >
        {selectedClient ? (
          <div className="flex flex-1 flex-col rounded-2xl border border-[#E5E2DA] bg-[#FFFFFF] p-4 sm:p-5 shadow-xs dark:border-[#282C32] dark:bg-[#181B1E] lg:min-h-0">
            {/* Header del Cliente */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E2DA] pb-3.5 dark:border-[#282C32]">
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setMobileView("list")}
                  className="rounded-lg border border-[#E5E2DA] p-1 text-[#57534E] hover:bg-[#F7F6F2] lg:hidden dark:border-[#282C32] dark:text-[#9CA3AF]"
                  title="Volver a la lista"
                >
                  <Icon path={mdiChevronLeft} size={0.8} />
                </button>
                <div>
                  <h2 className="text-lg font-black text-[#1C1917] dark:text-[#F3F2EE] leading-tight">
                    {selectedClient.name}
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-[#78716C] dark:text-[#9CA3AF] mt-0.5">
                    {selectedClient.phone ? (
                      <span className="flex items-center gap-1">
                        <Icon path={mdiPhone} size={0.5} />
                        {selectedClient.phone}
                      </span>
                    ) : (
                      <span>Sin teléfono registrado</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Botones de Compartir y WhatsApp */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onShareLink(selectedClient)}
                  className="flex items-center gap-1.5 rounded-lg border border-[#E5E2DA] bg-[#FFFFFF] px-3 py-1.5 text-xs font-semibold text-[#1C1917] hover:bg-[#F7F6F2] dark:border-[#282C32] dark:bg-[#181B1E] dark:text-[#F3F2EE] dark:hover:bg-[#282C32] transition"
                  title="Copiar enlace de estado de cuenta público"
                >
                  <Icon path={mdiShareVariant} size={0.65} />
                  <span>Enlace Público</span>
                </button>
                <button
                  onClick={() => onSendWhatsappStatement(selectedClient)}
                  className="flex items-center gap-1.5 rounded-lg bg-[#25D366] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#1EBE5D] shadow-xs transition"
                  title="Enviar estado de cuenta por WhatsApp"
                >
                  <Icon path={mdiWhatsapp} size={0.65} />
                  <span>WhatsApp</span>
                </button>
              </div>
            </div>

            {/* Dossier Financiero Unificado (Reemplazo deliberado de las 3 tarjetas SaaS idénticas) */}
            <div className="mb-4 rounded-xl border border-[#E5E2DA] bg-[#F7F6F2] p-3.5 dark:border-[#282C32] dark:bg-[#111315]">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 divide-y sm:divide-y-0 sm:divide-x divide-[#E5E2DA] dark:divide-[#282C32]">
                {/* 1. Saldo actual */}
                <div className="sm:pr-3">
                  <span className="block text-[11px] font-bold text-[#78716C] dark:text-[#9CA3AF]">
                    Saldo de Cuenta
                  </span>
                  <div
                    className={`mt-0.5 text-2xl font-black font-tabular tracking-tight ${
                      selectedDebt > 0
                        ? "text-red-600 dark:text-red-400"
                        : selectedDebt < 0
                          ? "text-emerald-700 dark:text-emerald-400"
                          : "text-[#1C1917] dark:text-[#F3F2EE]"
                    }`}
                  >
                    ${Math.abs(selectedDebt).toFixed(2)}
                  </div>
                  <span className="text-[10px] font-medium text-[#78716C] dark:text-[#9CA3AF]">
                    {selectedDebt > 0
                      ? "Saldo deudor pendiente"
                      : selectedDebt < 0
                        ? "Saldo a favor del cliente"
                        : "Cuenta completamente al corriente"}
                  </span>
                </div>

                {/* 2. Puntos acumulados */}
                <div className="pt-2 sm:pt-0 sm:px-3">
                  <span className="block text-[11px] font-bold text-[#78716C] dark:text-[#9CA3AF]">
                    Puntos de Lealtad
                  </span>
                  <div className="mt-0.5 text-2xl font-black font-tabular text-amber-700 dark:text-amber-400 tracking-tight flex items-baseline gap-1">
                    {selectedPoints.toFixed(1)}
                    <span className="text-xs font-semibold text-amber-900/60 dark:text-amber-400/70">
                      pts
                    </span>
                  </div>
                  <span className="text-[10px] font-medium text-[#78716C] dark:text-[#9CA3AF]">
                    Equivalente a ${selectedPoints.toFixed(2)} en canjes
                  </span>
                </div>

                {/* 3. Límite de crédito */}
                <div className="pt-2 sm:pt-0 sm:pl-3">
                  <span className="block text-[11px] font-bold text-[#78716C] dark:text-[#9CA3AF]">
                    Límite de Crédito
                  </span>
                  <div className="mt-0.5 text-2xl font-black font-tabular text-[#1C1917] dark:text-[#F3F2EE] tracking-tight">
                    {selectedLimit > 0
                      ? `$${selectedLimit.toFixed(2)}`
                      : "Sin límite"}
                  </div>
                  <span className="text-[10px] font-medium text-[#78716C] dark:text-[#9CA3AF]">
                    {availableCredit !== null
                      ? `Disponible para fiar: $${availableCredit.toFixed(2)}`
                      : "Crédito abierto"}
                  </span>
                </div>
              </div>
            </div>

            {/* Avisos de Límite de Crédito y Días de Adeudo */}
            {(isOverCreditLimit || daysWithDebt > 15) && selectedDebt > 0 && (
              <div className="mb-4 space-y-2">
                {isOverCreditLimit && (
                  <div className="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50/90 p-3 text-xs text-red-900 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200 shadow-xs">
                    <span className="text-xl shrink-0">⚠️</span>
                    <span className="flex-1 leading-snug">
                      <strong>Límite de crédito sobrepasado:</strong> La deuda
                      del cliente (
                      <strong className="font-tabular font-bold">
                        ${selectedDebt.toFixed(2)}
                      </strong>
                      ) supera el límite de{" "}
                      <strong className="font-tabular font-bold">
                        ${selectedLimit.toFixed(2)}
                      </strong>
                      . Aún puede fiar dulces, pero saldrá alerta tras cada
                      movimiento.
                    </span>
                  </div>
                )}
                {daysWithDebt > 15 && (
                  <div className="flex items-center gap-2.5 rounded-xl border border-amber-300 bg-amber-50/90 p-3 text-xs text-amber-950 dark:border-amber-700/50 dark:bg-amber-950/40 dark:text-amber-200 shadow-xs">
                    <span className="text-xl shrink-0">⏰</span>
                    <span className="flex-1 leading-snug">
                      <strong>Antigüedad de adeudo:</strong> Lleva{" "}
                      <strong className="font-tabular font-bold">
                        {daysWithDebt} días
                      </strong>{" "}
                      continuos con saldo pendiente (más de 15 días).
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Barra de Acciones Principales: Fiar / Abonar / Desglose */}
            <div className="mb-4 flex flex-wrap gap-2">
              <button
                onClick={onOpenPurchaseModal}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-amber-700 active:scale-[0.98] transition"
              >
                <Icon path={mdiCashMinus} size={0.7} />
                <span>+ Fiar Producto</span>
              </button>
              <button
                onClick={onOpenPayModal}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 active:scale-[0.98] transition"
              >
                <Icon path={mdiCashPlus} size={0.7} />
                <span>+ Registrar Abono</span>
              </button>
              <button
                onClick={onViewDebtBreakdown}
                className="flex items-center gap-1.5 rounded-xl border border-[#E5E2DA] bg-[#FFFFFF] px-3.5 py-2.5 text-xs font-semibold text-[#1C1917] hover:bg-[#F7F6F2] dark:border-[#282C32] dark:bg-[#181B1E] dark:text-[#F3F2EE] dark:hover:bg-[#282C32] transition"
                title="Ver desglose detallado de lo que debe"
              >
                <Icon path={mdiInformationOutline} size={0.7} />
                <span>Desglose</span>
              </button>
            </div>

            {/* Libro Contable de Movimientos */}
            <div className="flex-1 flex flex-col lg:min-h-0">
              <div className="mb-2 flex items-center justify-between text-xs font-bold text-[#1C1917] dark:text-[#F3F2EE]">
                <span>Libro de Movimientos</span>
                <span className="font-normal text-[#78716C] dark:text-[#9CA3AF]">
                  {movements.length} registro{movements.length !== 1 ? "s" : ""}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto rounded-xl border border-[#E5E2DA] dark:border-[#282C32]">
                {loadingMovements ? (
                  <div className="py-12 text-center text-xs text-[#78716C] dark:text-[#9CA3AF]">
                    Cargando movimientos...
                  </div>
                ) : (
                  <table className="min-w-full text-left text-xs">
                    <thead className="sticky top-0 bg-[#F7F6F2] text-[#57534E] border-b border-[#E5E2DA] dark:bg-[#111315] dark:text-[#9CA3AF] dark:border-[#282C32] z-10">
                      <tr>
                        <th className="px-3 py-2 font-semibold">Fecha</th>
                        <th className="px-3 py-2 font-semibold">Concepto</th>
                        <th className="px-3 py-2 font-semibold">Método</th>
                        <th className="px-3 py-2 text-right font-semibold">
                          Monto
                        </th>
                        <th className="px-2 py-2 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E2DA] dark:divide-[#282C32] font-tabular">
                      {movements.map((m) => {
                        const isPositive = Number(m.amount) > 0;
                        return (
                          <tr
                            key={m.id}
                            className="hover:bg-[#F7F6F2]/60 dark:hover:bg-[#202428]/50 transition-colors"
                          >
                            <td className="px-3 py-2 text-[#78716C] dark:text-[#9CA3AF] whitespace-nowrap">
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
                            <td className="px-3 py-2 font-medium text-[#1C1917] dark:text-[#F3F2EE]">
                              {m.concept}
                            </td>
                            <td className="px-3 py-2 text-[#78716C] dark:text-[#9CA3AF] capitalize">
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
                              className={`px-3 py-2 text-right font-black ${
                                isPositive
                                  ? "text-red-600 dark:text-red-400"
                                  : "text-emerald-700 dark:text-emerald-400"
                              }`}
                            >
                              {isPositive
                                ? `+$${Number(m.amount).toFixed(2)}`
                                : `-$${Math.abs(Number(m.amount)).toFixed(2)}`}
                            </td>
                            <td className="px-2 py-2 text-center">
                              <button
                                onClick={() => onDeleteMovement(m)}
                                title="Eliminar movimiento"
                                className="rounded-md p-1 text-[#78716C] hover:bg-red-50 hover:text-red-600 dark:text-[#9CA3AF] dark:hover:bg-red-950/40 dark:hover:text-red-400 transition"
                              >
                                <Icon path={mdiDelete} size={0.6} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}

                      {movements.length === 0 && (
                        <tr>
                          <td
                            colSpan={5}
                            className="py-10 text-center text-[#78716C] dark:text-[#9CA3AF]"
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
          <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-[#E5E2DA] bg-[#FFFFFF]/50 p-8 text-center text-[#78716C] dark:border-[#282C32] dark:bg-[#181B1E]/30 dark:text-[#9CA3AF]">
            <div>
              <Icon
                path={mdiAccountGroup}
                size={2}
                className="mx-auto mb-2 opacity-40"
              />
              <p className="text-xs font-semibold">
                Selecciona un cliente del directorio para ver su estado de
                cuenta
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
