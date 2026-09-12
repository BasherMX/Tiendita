import { useState, useEffect } from "react";
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
  mdiEyeOutline,
  mdiReceiptTextOutline,
  mdiClose,
} from "@mdi/js";

export default function ClientsPage({
  clients = [],
  selectedClient,
  movements = [],
  loadingClients = false,
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
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDebt, setFilterDebt] = useState("all"); // "all" | "debt" | "clean"
  const [mobileView, setMobileView] = useState("list"); // "list" | "detail"
  const [selectedMovementDetail, setSelectedMovementDetail] = useState(null);

  useEffect(() => {
    if (!selectedClient && clients && clients.length > 0) {
      onSelectClient(clients[0]);
    }
  }, [clients, selectedClient, onSelectClient]);

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
    <div className="grid gap-5 lg:h-[calc(100vh-6.5rem)] lg:grid-cols-[minmax(320px,420px)_1fr] min-w-0 max-w-full">
      {/* Columna Izquierda: Directorio de Clientes */}
      <div
        className={`flex flex-col gap-3 lg:min-h-0 ${
          mobileView === "detail" && selectedClient ? "hidden lg:flex" : "flex"
        }`}
      >
        {/* Acciones superiores del directorio */}
        <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={onNewClient}
            className="flex items-center gap-1.5 rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-amber-700 active:scale-[0.98] transition"
          >
            <Icon path={mdiPlus} size={0.7} />
            Nuevo Cliente
          </button>

          {/* Filtros rápidos por estado de cuenta */}
          <div className="flex overflow-x-auto rounded-xl border border-[#E5E2DA] bg-[#FFFFFF] p-1 text-[11px] font-semibold dark:border-[#282C32] dark:bg-[#181B1E]">
            <button
              onClick={() => setFilterDebt("all")}
              className={`rounded-lg px-2.5 py-1 transition whitespace-nowrap ${
                filterDebt === "all"
                  ? "bg-amber-500/15 text-amber-950 dark:bg-amber-400/20 dark:text-amber-200 font-bold"
                  : "text-[#78716C] hover:text-[#1C1917] dark:text-[#9CA3AF] dark:hover:text-[#F3F2EE]"
              }`}
            >
              Todos ({clients.length})
            </button>
            <button
              onClick={() => setFilterDebt("debt")}
              className={`rounded-lg px-2.5 py-1 transition whitespace-nowrap ${
                filterDebt === "debt"
                  ? "bg-red-500/15 text-red-700 dark:bg-red-950/60 dark:text-red-300 font-bold"
                  : "text-[#78716C] hover:text-[#1C1917] dark:text-[#9CA3AF] dark:hover:text-[#F3F2EE]"
              }`}
            >
              Con Deuda
            </button>
            <button
              onClick={() => setFilterDebt("clean")}
              className={`rounded-lg px-2.5 py-1 transition whitespace-nowrap ${
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
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#78716C] dark:text-[#9CA3AF] pointer-events-none"
            />
            <input
              className="w-full rounded-xl border border-[#E5E2DA] bg-[#F7F6F2] py-2 pl-9 pr-8 text-xs outline-none transition focus:bg-[#FFFFFF] dark:border-[#282C32] dark:bg-[#111315] dark:focus:bg-[#181B1E] text-[#1C1917] dark:text-[#F3F2EE]"
              placeholder="Buscar por nombre o teléfono..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-[#78716C] hover:bg-[#E5E2DA]/60 hover:text-[#1C1917] dark:text-[#9CA3AF] dark:hover:bg-[#282C32] dark:hover:text-[#F3F2EE] transition"
                title="Borrar búsqueda"
              >
                <Icon path={mdiClose} size={0.55} />
              </button>
            )}
          </div>

          {/* Lista de clientes */}
          <div className="flex-1 space-y-1.5 overflow-y-auto pr-0.5 max-h-[60vh] lg:max-h-none lg:min-h-0">
            {loadingClients ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="animate-pulse rounded-xl border border-[#E5E2DA] bg-[#FFFFFF] p-3 dark:border-[#282C32] dark:bg-[#181B1E]"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="h-4 w-32 rounded-md bg-[#E5E2DA] dark:bg-[#282C32]"></div>
                      <div className="h-4 w-12 rounded-md bg-[#E5E2DA] dark:bg-[#282C32]"></div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-20 rounded bg-[#E5E2DA]/70 dark:bg-[#282C32]/70"></div>
                      <div className="h-3 w-14 rounded bg-[#E5E2DA]/70 dark:bg-[#282C32]/70"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>
      </div>

      {/* Columna Derecha: Detalle del Cliente Seleccionado */}
      <div
        className={`flex flex-col gap-3 lg:min-h-0 min-w-0 max-w-full ${
          mobileView === "list" && selectedClient ? "hidden lg:flex" : "flex"
        }`}
      >
        {selectedClient ? (
          <div className="flex flex-1 flex-col rounded-2xl border border-[#E5E2DA] bg-[#FFFFFF] p-3.5 sm:p-5 shadow-xs dark:border-[#282C32] dark:bg-[#181B1E] lg:min-h-0 min-w-0 max-w-full">
            {/* Header del Cliente */}
            <div className="mb-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-[#E5E2DA] pb-3 dark:border-[#282C32] min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <button
                  onClick={() => setMobileView("list")}
                  className="rounded-lg border border-[#E5E2DA] p-1 text-[#57534E] hover:bg-[#F7F6F2] lg:hidden dark:border-[#282C32] dark:text-[#9CA3AF] shrink-0"
                  title="Volver a la lista"
                >
                  <Icon path={mdiChevronLeft} size={0.8} />
                </button>
                <div className="min-w-0 flex-1">
                  <h2 className="text-base sm:text-lg font-black text-[#1C1917] dark:text-[#F3F2EE] leading-tight truncate">
                    {selectedClient.name}
                  </h2>
                  <div className="flex items-center gap-2 text-[11px] sm:text-xs text-[#78716C] dark:text-[#9CA3AF] mt-0.5 truncate">
                    {selectedClient.phone ? (
                      <span className="flex items-center gap-1 truncate">
                        <Icon path={mdiPhone} size={0.5} className="shrink-0" />
                        <span className="truncate">{selectedClient.phone}</span>
                      </span>
                    ) : (
                      <span>Sin teléfono registrado</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Botones de Compartir y WhatsApp */}
              <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                <button
                  onClick={() => onShareLink(selectedClient)}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-lg border border-[#E5E2DA] bg-[#FFFFFF] px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-[#1C1917] hover:bg-[#F7F6F2] dark:border-[#282C32] dark:bg-[#181B1E] dark:text-[#F3F2EE] dark:hover:bg-[#282C32] transition"
                  title="Copiar enlace de estado de cuenta público"
                >
                  <Icon path={mdiShareVariant} size={0.65} />
                  <span>Enlace Público</span>
                </button>
                <button
                  onClick={() => onSendWhatsappStatement(selectedClient)}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-lg bg-[#25D366] px-2.5 sm:px-3 py-1.5 text-xs font-bold text-white hover:bg-[#1EBE5D] shadow-xs transition"
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

            {/* Barra de Acciones Principales: Fiar / Abonar (Mobile-first 2-column grid) */}
            <div className="mb-4 grid grid-cols-2 gap-2">
              <button
                onClick={onOpenPurchaseModal}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-amber-600 px-3 sm:px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-amber-700 active:scale-[0.98] transition"
              >
                <Icon path={mdiCashMinus} size={0.7} />
                <span>+ Fiar Producto</span>
              </button>
              <button
                onClick={onOpenPayModal}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-700 px-3 sm:px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 active:scale-[0.98] transition"
              >
                <Icon path={mdiCashPlus} size={0.7} />
                <span>+ Registrar Abono</span>
              </button>
            </div>

            {/* Libro Contable de Movimientos (Mobile-first responsive table) */}
            <div className="flex-1 flex flex-col lg:min-h-0 min-w-0 max-w-full">
              <div className="mb-2 flex items-center justify-between text-xs font-bold text-[#1C1917] dark:text-[#F3F2EE]">
                <span>Libro de Movimientos</span>
                <span className="font-normal text-[#78716C] dark:text-[#9CA3AF]">
                  {movements.length} registro{movements.length !== 1 ? "s" : ""}
                </span>
              </div>

              <div className="flex-1 overflow-x-auto overflow-y-auto rounded-xl border border-[#E5E2DA] dark:border-[#282C32] w-full max-w-full">
                {loadingMovements ? (
                  <div className="p-4 space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="animate-pulse flex items-center justify-between py-2 border-b border-[#E5E2DA]/60 dark:border-[#282C32]/60 last:border-0"
                      >
                        <div className="space-y-1.5 flex-1 min-w-0 pr-4">
                          <div className="h-3.5 w-32 rounded bg-[#E5E2DA] dark:bg-[#282C32]"></div>
                          <div className="h-2.5 w-20 rounded bg-[#E5E2DA]/70 dark:bg-[#282C32]/70"></div>
                        </div>
                        <div className="h-4 w-16 rounded bg-[#E5E2DA] dark:bg-[#282C32]"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <table className="w-full min-w-[360px] sm:min-w-[460px] text-left text-xs">
                    <thead className="sticky top-0 bg-[#F7F6F2] text-[#57534E] border-b border-[#E5E2DA] dark:bg-[#111315] dark:text-[#9CA3AF] dark:border-[#282C32] z-10">
                      <tr>
                        <th className="px-2.5 sm:px-3 py-2 font-semibold">
                          Fecha
                        </th>
                        <th className="px-2.5 sm:px-3 py-2 font-semibold">
                          Concepto
                        </th>
                        <th className="px-2 sm:px-3 py-2 font-semibold">
                          Método
                        </th>
                        <th className="px-2.5 sm:px-3 py-2 text-right font-semibold">
                          Monto
                        </th>
                        <th className="px-1.5 sm:px-2 py-2 text-center font-semibold">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E2DA] dark:divide-[#282C32] font-tabular">
                      {movements.map((m) => {
                        const isInstantPurchase =
                          Number(m.amount) === 0 ||
                          (m.concept &&
                            m.concept.toLowerCase().includes("contado"));
                        const isPositive = Number(m.amount) > 0;
                        const itemsTotal =
                          Array.isArray(m.items) && m.items.length > 0
                            ? m.items.reduce(
                                (acc, it) =>
                                  acc +
                                  Number(it.quantity) * Number(it.unit_price),
                                0,
                              )
                            : 0;

                        return (
                          <tr
                            key={m.id}
                            className="hover:bg-[#F7F6F2]/60 dark:hover:bg-[#202428]/50 transition-colors"
                          >
                            <td className="px-2.5 sm:px-3 py-2 text-[#78716C] dark:text-[#9CA3AF] whitespace-nowrap">
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
                            <td className="px-2.5 sm:px-3 py-2 font-medium text-[#1C1917] dark:text-[#F3F2EE]">
                              <div className="flex items-center gap-1.5">
                                <span className="truncate max-w-[120px] sm:max-w-none">
                                  {m.concept}
                                </span>
                                {Array.isArray(m.items) &&
                                  m.items.length > 0 && (
                                    <span className="text-[10px] text-[#78716C] dark:text-[#9CA3AF] bg-[#E5E2DA]/50 dark:bg-[#282C32] px-1 rounded shrink-0">
                                      ({m.items.length} art)
                                    </span>
                                  )}
                              </div>
                            </td>
                            <td className="px-2 sm:px-3 py-2 text-[#78716C] dark:text-[#9CA3AF] capitalize whitespace-nowrap">
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
                            <td className="px-2.5 sm:px-3 py-2 text-right font-black whitespace-nowrap">
                              {isInstantPurchase ? (
                                <div className="flex flex-col items-end">
                                  <span className="text-[#1C1917] dark:text-[#F3F2EE]">
                                    $
                                    {itemsTotal > 0
                                      ? itemsTotal.toFixed(2)
                                      : Number(m.paid_amount || 0) > 0
                                        ? Number(m.paid_amount).toFixed(2)
                                        : "0.00"}
                                  </span>
                                  <span className="inline-block text-[9px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-1 rounded">
                                    Contado
                                  </span>
                                </div>
                              ) : isPositive ? (
                                <span className="text-red-600 dark:text-red-400">
                                  +${Number(m.amount).toFixed(2)}
                                </span>
                              ) : (
                                <span className="text-emerald-700 dark:text-emerald-400">
                                  -${Math.abs(Number(m.amount)).toFixed(2)}
                                </span>
                              )}
                            </td>
                            <td className="px-1.5 sm:px-2 py-2 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => setSelectedMovementDetail(m)}
                                  title="Ver detalle del movimiento"
                                  className="rounded-md p-1.5 text-amber-700 hover:bg-amber-100 dark:text-amber-400 dark:hover:bg-amber-950/50 transition"
                                >
                                  <Icon path={mdiEyeOutline} size={0.65} />
                                </button>
                                <button
                                  onClick={() => onDeleteMovement(m)}
                                  title="Eliminar movimiento"
                                  className="rounded-md p-1.5 text-[#78716C] hover:bg-red-50 hover:text-red-600 dark:text-[#9CA3AF] dark:hover:bg-red-950/40 dark:hover:text-red-400 transition"
                                >
                                  <Icon path={mdiDelete} size={0.65} />
                                </button>
                              </div>
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

      {/* Modal Detalle de Movimiento */}
      {selectedMovementDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1C1917]/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-[#E5E2DA] bg-white p-4 sm:p-5 shadow-2xl dark:border-[#282C32] dark:bg-[#181B1E] flex flex-col max-h-[85vh]">
            <div className="mb-3 flex items-center justify-between border-b border-[#E5E2DA] pb-3 dark:border-[#282C32]">
              <div className="flex items-center gap-2">
                <div className="rounded-xl bg-amber-500/15 p-2 text-amber-950 dark:bg-amber-400/20 dark:text-amber-200">
                  <Icon path={mdiReceiptTextOutline} size={0.8} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1C1917] dark:text-[#F3F2EE]">
                    Detalle del Movimiento
                  </h3>
                  <p className="text-[11px] text-[#78716C] dark:text-[#9CA3AF]">
                    {new Date(selectedMovementDetail.created_at).toLocaleString(
                      "es-MX",
                      {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      },
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedMovementDetail(null)}
                className="rounded-lg p-1.5 text-[#78716C] hover:bg-[#F7F6F2] dark:text-[#9CA3AF] dark:hover:bg-[#202428] transition"
              >
                <Icon path={mdiClose} size={0.7} />
              </button>
            </div>

            {/* Fichas de información rápida */}
            <div className="mb-3 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl bg-[#F7F6F2] p-2.5 dark:bg-[#111315]">
                <span className="block text-[10px] font-bold text-[#78716C] dark:text-[#9CA3AF]">
                  CONCEPTO
                </span>
                <span className="font-semibold text-[#1C1917] dark:text-[#F3F2EE]">
                  {selectedMovementDetail.concept}
                </span>
              </div>
              <div className="rounded-xl bg-[#F7F6F2] p-2.5 dark:bg-[#111315]">
                <span className="block text-[10px] font-bold text-[#78716C] dark:text-[#9CA3AF]">
                  MÉTODO DE PAGO
                </span>
                <span className="font-semibold capitalize text-[#1C1917] dark:text-[#F3F2EE]">
                  {selectedMovementDetail.payment_method === "cash"
                    ? "Efectivo"
                    : selectedMovementDetail.payment_method === "transfer"
                      ? "Transferencia"
                      : selectedMovementDetail.payment_method === "card"
                        ? "Tarjeta"
                        : selectedMovementDetail.payment_method === "credit"
                          ? "Crédito (Fiado)"
                          : selectedMovementDetail.payment_method || "—"}
                </span>
              </div>
            </div>

            {/* Desglose de Productos */}
            <div className="flex-1 overflow-y-auto pr-1">
              <div className="text-[11px] font-bold text-[#78716C] dark:text-[#9CA3AF] mb-1.5">
                PRODUCTOS COMPRADOS
              </div>
              {Array.isArray(selectedMovementDetail.items) &&
              selectedMovementDetail.items.length > 0 ? (
                <div className="divide-y divide-[#E5E2DA] rounded-xl border border-[#E5E2DA] bg-[#F7F6F2]/50 dark:divide-[#282C32] dark:border-[#282C32] dark:bg-[#111315]/50">
                  {selectedMovementDetail.items.map((it, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 text-xs"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="font-bold text-[#1C1917] dark:text-[#F3F2EE] truncate">
                          {it.name || "Producto"}
                        </div>
                        <div className="text-[11px] text-[#78716C] dark:text-[#9CA3AF] font-tabular">
                          {it.quantity} x ${Number(it.unit_price).toFixed(2)}{" "}
                          c/u
                        </div>
                      </div>
                      <div className="font-black font-tabular text-[#1C1917] dark:text-[#F3F2EE] shrink-0">
                        $
                        {(Number(it.quantity) * Number(it.unit_price)).toFixed(
                          2,
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-[#E5E2DA] p-4 text-center text-xs text-[#78716C] dark:border-[#282C32] dark:text-[#9CA3AF]">
                  Movimiento contable sin desglose de productos individuales.
                </div>
              )}
            </div>

            {/* Resumen Total */}
            <div className="mt-3 border-t border-[#E5E2DA] pt-3 dark:border-[#282C32] space-y-1 text-xs">
              {Number(selectedMovementDetail.points || 0) !== 0 && (
                <div className="flex justify-between text-amber-700 dark:text-amber-400">
                  <span>Puntos del movimiento:</span>
                  <span className="font-bold font-tabular">
                    {Number(selectedMovementDetail.points) > 0
                      ? `+${Number(selectedMovementDetail.points).toFixed(1)}`
                      : `${Number(selectedMovementDetail.points).toFixed(1)}`}{" "}
                    pts
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black text-[#1C1917] dark:text-[#F3F2EE]">
                <span>Monto Total:</span>
                <span className="font-tabular">
                  $
                  {(() => {
                    const itTotal =
                      Array.isArray(selectedMovementDetail.items) &&
                      selectedMovementDetail.items.length > 0
                        ? selectedMovementDetail.items.reduce(
                            (acc, it) =>
                              acc + Number(it.quantity) * Number(it.unit_price),
                            0,
                          )
                        : 0;
                    if (itTotal > 0) return itTotal.toFixed(2);
                    return Math.abs(
                      Number(selectedMovementDetail.amount || 0),
                    ).toFixed(2);
                  })()}
                </span>
              </div>
            </div>

            <button
              onClick={() => setSelectedMovementDetail(null)}
              className="mt-4 w-full rounded-xl bg-[#F7F6F2] py-2 text-xs font-bold text-[#1C1917] hover:bg-[#E5E2DA] dark:bg-[#202428] dark:text-[#F3F2EE] dark:hover:bg-[#282C32] transition"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
