import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Icon from "@mdi/react";
import {
  mdiWhatsapp,
  mdiStar,
  mdiContentCopy,
  mdiCheck,
  mdiStore,
  mdiClose,
} from "@mdi/js";
import brandLogo from "../assets/logo.png";
import { apiBase } from "../services/api.js";

export default function PublicClientView() {
  const { code } = useParams();
  const [client, setClient] = useState(null);
  const [movements, setMovements] = useState([]);
  const [settings, setSettings] = useState({
    bank_clabe: "646990403801118437",
    business_phone: "523346502871",
    business_name: "Tiendita",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copiedClabe, setCopiedClabe] = useState(false);
  const [selectedMovement, setSelectedMovement] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [resClient, resMov, resSettings] = await Promise.all([
          fetch(`${apiBase}/api/public/clients/${code}`),
          fetch(`${apiBase}/api/public/clients/${code}/movements`),
          fetch(`${apiBase}/api/public/settings`).catch(() => null),
        ]);

        if (!resClient.ok) {
          throw new Error("Cliente no encontrado o enlace inválido.");
        }
        const dataClient = await resClient.json();
        setClient(dataClient);

        if (resMov && resMov.ok) {
          const dataMov = await resMov.json();
          setMovements(dataMov);
        }

        if (resSettings && resSettings.ok) {
          const dataSet = await resSettings.json();
          setSettings(dataSet);
        }
      } catch (err) {
        setError(err.message || "Error al cargar la información.");
      } finally {
        setLoading(false);
      }
    }
    if (code) fetchData();
  }, [code]);

  function handleCopyClabe() {
    navigator.clipboard.writeText(settings.bank_clabe || "646990403801118437");
    setCopiedClabe(true);
    setTimeout(() => setCopiedClabe(false), 2000);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F6F2] dark:bg-[#111315] text-[#1C1917] dark:text-[#F3F2EE]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="font-bold text-xs text-[#78716C] dark:text-[#9CA3AF]">
            Cargando estado de cuenta...
          </p>
        </div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#F7F6F2] dark:bg-[#111315] text-[#1C1917] dark:text-[#F3F2EE]">
        <div className="max-w-sm w-full rounded-2xl bg-[#FFFFFF] dark:bg-[#181B1E] p-6 text-center space-y-3 border border-[#E5E2DA] dark:border-[#282C32] shadow-xs">
          <div className="text-red-500 text-3xl font-bold">⚠️</div>
          <h2 className="text-base font-bold">Enlace no disponible</h2>
          <p className="text-xs text-[#78716C] dark:text-[#9CA3AF]">
            {error || "El cliente no existe o el enlace es incorrecto."}
          </p>
        </div>
      </div>
    );
  }

  const debtVal = Number(client.total_debt || 0);
  const waPhone = (settings.business_phone || "523346502871").replace(
    /\D/g,
    "",
  );

  return (
    <div className="min-h-screen bg-[#F7F6F2] text-[#1C1917] dark:bg-[#111315] dark:text-[#F3F2EE] py-6 px-4 sm:px-6 transition-colors">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Header del Comercio y Cliente */}
        <div className="rounded-2xl border border-[#E5E2DA] bg-[#FFFFFF] p-4 sm:p-5 shadow-xs dark:border-[#282C32] dark:bg-[#181B1E] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-amber-500/20 bg-amber-50 shadow-xs dark:border-amber-400/20 dark:bg-amber-950/40">
              <img
                src={brandLogo}
                alt="Logo Tiendita"
                className="h-9 w-9 object-cover"
              />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-extrabold truncate text-[#1C1917] dark:text-[#F3F2EE] leading-tight">
                {client.name}
              </h1>
              <p className="text-[11px] text-[#78716C] dark:text-[#9CA3AF] truncate mt-0.5">
                Estado de Cuenta — {settings.business_name || "Tiendita"}
              </p>
            </div>
          </div>

          <a
            href={`https://wa.me/${waPhone}?text=Hola,%20quisiera%20consultar%20dudas%20sobre%20mi%20estado%20de%20cuenta`}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 flex items-center gap-1.5 rounded-xl bg-[#25D366] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#1EBE5D] shadow-xs transition active:scale-[0.98]"
          >
            <Icon path={mdiWhatsapp} size={0.7} />
            <span className="hidden sm:inline">WhatsApp</span>
          </a>
        </div>

        {/* Resumen de Saldo y Puntos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div
            className={`rounded-2xl border p-4 sm:p-5 shadow-xs flex flex-col justify-between ${
              debtVal > 0
                ? "border-red-200 bg-red-50/50 dark:border-red-900/40 dark:bg-red-950/20"
                : debtVal < 0
                  ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/40 dark:bg-emerald-950/20"
                  : "border-[#E5E2DA] bg-[#FFFFFF] dark:border-[#282C32] dark:bg-[#181B1E]"
            }`}
          >
            <span className="text-[11px] font-bold text-[#78716C] dark:text-[#9CA3AF]">
              {debtVal > 0
                ? "Saldo Pendiente"
                : debtVal < 0
                  ? "Saldo a Favor"
                  : "Estado de Cuenta"}
            </span>
            <div
              className={`text-2xl sm:text-3xl font-black font-tabular mt-1 ${
                debtVal > 0
                  ? "text-red-600 dark:text-red-400"
                  : debtVal < 0
                    ? "text-emerald-700 dark:text-emerald-400"
                    : "text-[#1C1917] dark:text-[#F3F2EE]"
              }`}
            >
              ${Math.abs(debtVal).toFixed(2)}
            </div>
            <span className="text-[11px] text-[#78716C] dark:text-[#9CA3AF] mt-1">
              {debtVal > 0
                ? "Total acumulado por pagar"
                : debtVal < 0
                  ? "Saldo a favor disponible"
                  : "Cuentas completamente al día"}
            </span>
          </div>

          <div className="rounded-2xl border border-[#E5E2DA] bg-[#FFFFFF] p-4 sm:p-5 shadow-xs dark:border-[#282C32] dark:bg-[#181B1E] flex flex-col justify-between">
            <span className="text-[11px] font-bold text-[#78716C] dark:text-[#9CA3AF]">
              Puntos de Recompensas
            </span>
            <div className="text-2xl sm:text-3xl font-black font-tabular mt-1 text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
              <Icon path={mdiStar} size={0.8} />
              <span>{Number(client.points || 0).toFixed(1)} pts</span>
            </div>
            <span className="text-[11px] text-[#78716C] dark:text-[#9CA3AF] mt-1">
              Canjeables por productos en el mostrador
            </span>
          </div>
        </div>

        {/* Datos de Transferencia Bancaria Directa */}
        <div className="rounded-2xl border border-amber-500/20 bg-amber-50/50 p-4 sm:p-5 shadow-xs dark:border-amber-400/20 dark:bg-amber-950/20 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-300">
            <Icon path={mdiStore} size={0.7} />
            <span>Datos para Pago por Transferencia (SPEI)</span>
          </div>

          <div className="rounded-xl border border-[#E5E2DA] bg-[#FFFFFF] p-3 dark:border-[#282C32] dark:bg-[#181B1E] flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold text-[#78716C] dark:text-[#9CA3AF] block">
                Cuenta CLABE Interbancaria (STP)
              </span>
              <span className="font-mono font-bold text-sm sm:text-base text-[#1C1917] dark:text-[#F3F2EE] tracking-wider select-all">
                {settings.bank_clabe}
              </span>
            </div>

            <button
              type="button"
              onClick={handleCopyClabe}
              className="flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-2 text-xs font-bold text-white hover:bg-amber-700 transition shadow-xs active:scale-[0.98]"
            >
              <Icon path={copiedClabe ? mdiCheck : mdiContentCopy} size={0.6} />
              <span>{copiedClabe ? "¡CLABE Copiada!" : "Copiar CLABE"}</span>
            </button>
          </div>
        </div>

        {/* Historial de Compras y Movimientos */}
        <div className="rounded-2xl border border-[#E5E2DA] bg-[#FFFFFF] p-4 sm:p-5 shadow-xs dark:border-[#282C32] dark:bg-[#181B1E] space-y-3">
          <h2 className="text-sm font-bold text-[#1C1917] dark:text-[#F3F2EE]">
            Historial de Compras y Pagos
          </h2>

          {movements.length === 0 ? (
            <p className="text-xs text-[#78716C] dark:text-[#9CA3AF] py-6 text-center">
              No hay movimientos registrados para esta cuenta.
            </p>
          ) : (
            <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-0.5">
              {movements.map((mov) => {
                const isCharge = mov.amount > 0;
                return (
                  <div
                    key={mov.id}
                    className="rounded-xl border border-[#E5E2DA] p-3 bg-[#F7F6F2]/40 dark:border-[#282C32] dark:bg-[#111315]/40 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#1C1917] dark:text-[#F3F2EE]">
                        {mov.concept}
                      </span>
                      <span
                        className={`font-black font-tabular ${
                          isCharge
                            ? "text-red-600 dark:text-red-400"
                            : "text-emerald-700 dark:text-emerald-400"
                        }`}
                      >
                        {isCharge
                          ? `+$${Number(mov.amount).toFixed(2)}`
                          : `-$${Math.abs(Number(mov.amount)).toFixed(2)}`}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[#78716C] dark:text-[#9CA3AF]">
                      <span>
                        {new Date(mov.created_at).toLocaleString("es-MX", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>

                      {mov.items && mov.items.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setSelectedMovement(mov)}
                          className="rounded-md border border-amber-500/20 bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-900 dark:border-amber-400/20 dark:bg-amber-950/40 dark:text-amber-300"
                        >
                          Ver {mov.items.length} producto
                          {mov.items.length !== 1 ? "s" : ""}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pie de página */}
        <div className="text-center text-[11px] text-[#78716C] dark:text-[#9CA3AF] pt-2">
          <p>
            © {new Date().getFullYear()} {settings.business_name || "Tiendita"}{" "}
            — Control de mostrador
          </p>
        </div>
      </div>

      {/* Modal de Detalle de Productos */}
      <AnimatePresence>
        {selectedMovement && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-2xl border border-[#E5E2DA] bg-[#FFFFFF] p-5 shadow-xl dark:border-[#282C32] dark:bg-[#181B1E]"
            >
              <div className="mb-1 flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#1C1917] dark:text-[#F3F2EE]">
                  Detalle del Ticket
                </h3>
                <button
                  onClick={() => setSelectedMovement(null)}
                  className="rounded-lg p-1 text-[#78716C] hover:bg-[#F7F6F2] dark:text-[#9CA3AF] dark:hover:bg-[#282C32]"
                >
                  <Icon path={mdiClose} size={0.65} />
                </button>
              </div>

              <div className="mb-3 text-[11px] text-[#78716C] dark:text-[#9CA3AF]">
                {selectedMovement.concept || "Compra"} —{" "}
                {new Date(selectedMovement.created_at).toLocaleString("es-MX")}
              </div>

              <div className="overflow-hidden rounded-xl border border-[#E5E2DA] dark:border-[#282C32]">
                <table className="min-w-full text-left text-xs">
                  <thead className="bg-[#F7F6F2] text-[#57534E] border-b border-[#E5E2DA] dark:bg-[#111315] dark:text-[#9CA3AF] dark:border-[#282C32]">
                    <tr>
                      <th className="px-3 py-2 font-semibold">Producto</th>
                      <th className="px-3 py-2 text-center font-semibold">
                        Pzas
                      </th>
                      <th className="px-3 py-2 text-right font-semibold">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E2DA] dark:divide-[#282C32] font-tabular">
                    {selectedMovement.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-3 py-2 font-medium">{item.name}</td>
                        <td className="px-3 py-2 text-center text-[#78716C] dark:text-[#9CA3AF]">
                          {item.quantity}
                        </td>
                        <td className="px-3 py-2 text-right font-black">
                          $
                          {(
                            Number(item.unit_price || 0) *
                            Number(item.quantity || 0)
                          ).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedMovement(null)}
                  className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700 transition"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
