import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import Icon from "@mdi/react";
import {
  mdiWhatsapp,
  mdiStar,
  mdiShareVariant,
  mdiStore,
  mdiEye,
  mdiAlertCircleOutline,
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-amber-100 dark:from-slate-950 dark:to-slate-900 text-slate-700 dark:text-slate-200">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="font-semibold text-sm">Cargando estado de cuenta...</p>
        </div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-slate-950 dark:to-slate-900 text-slate-700 dark:text-slate-200">
        <div className="max-w-md w-full rounded-3xl bg-white dark:bg-slate-900 p-8 shadow-xl text-center space-y-4 border border-amber-100 dark:border-slate-800">
          <div className="text-rose-500 text-4xl font-bold">⚠️</div>
          <h2 className="text-xl font-bold">Enlace no disponible</h2>
          <p className="text-sm text-slate-500">
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
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-amber-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-800 dark:text-slate-100 py-8 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="rounded-3xl border border-amber-100/70 bg-white/90 dark:border-slate-800 dark:bg-slate-900/80 p-6 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={brandLogo}
              alt="Logo Tiendita"
              className="h-12 w-12 rounded-2xl border border-amber-200 object-cover shadow-sm dark:border-slate-700"
            />
            <div>
              <h1 className="text-xl font-bold">{client.name}</h1>
              <p className="text-xs text-slate-500">
                Estado de Cuenta | {settings.business_name || "Tiendita"}
              </p>
            </div>
          </div>
          <a
            href={`https://wa.me/${waPhone}?text=Hola,%20quisiera%20consultar%20dudas%20sobre%20mi%20estado%20de%20cuenta`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-2xl bg-emerald-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-emerald-700 transition shadow-sm"
          >
            <Icon path={mdiWhatsapp} size={0.8} />
            <span className="hidden sm:inline">WhatsApp</span>
          </a>
        </div>

        {/* Resumen de Saldo y Puntos */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div
            className={`rounded-3xl border p-4 sm:p-6 shadow-sm flex flex-col justify-between ${
              debtVal > 0
                ? "border-rose-200 bg-rose-50/70 dark:border-rose-900/50 dark:bg-rose-950/40"
                : debtVal < 0
                  ? "border-emerald-200 bg-emerald-50/70 dark:border-emerald-900/50 dark:bg-emerald-950/40"
                  : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
            }`}
          >
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500">
              {debtVal > 0
                ? "Saldo Pendiente"
                : debtVal < 0
                  ? "Saldo a Favor"
                  : "Saldo al Día"}
            </span>
            <div
              className={`text-xl sm:text-3xl font-extrabold mt-1 sm:mt-2 ${
                debtVal > 0
                  ? "text-rose-600 dark:text-rose-400"
                  : debtVal < 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-slate-700 dark:text-slate-300"
              }`}
            >
              ${Math.abs(debtVal).toFixed(2)}
            </div>
            <span className="text-[10px] sm:text-[11px] text-slate-500 mt-1">
              {debtVal > 0
                ? "Pendiente de pago"
                : debtVal < 0
                  ? "Crédito a tu favor"
                  : "Cuentas al día"}
            </span>
          </div>

          <div className="rounded-3xl border border-amber-100/70 bg-white/90 dark:border-slate-800 dark:bg-slate-900/80 p-4 sm:p-6 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500">
              Puntos
            </span>
            <div className="text-xl sm:text-3xl font-extrabold mt-1 sm:mt-2 text-amber-600 dark:text-amber-400 flex items-center gap-1 sm:gap-2">
              <Icon path={mdiStar} size={0.9} />
              <span>{Number(client.points || 0).toFixed(1)} pts</span>
            </div>
            <span className="text-[10px] sm:text-[11px] text-slate-500 mt-1">
              Acumulados en compras
            </span>
          </div>
        </div>

        {/* Historial de Movimientos */}
        <div className="rounded-3xl border border-amber-100/70 bg-white/90 dark:border-slate-800 dark:bg-slate-900/80 p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-bold">
            Historial de Compras y Movimientos
          </h2>
          {movements.length === 0 ? (
            <p className="text-sm text-slate-500">
              No hay movimientos registrados.
            </p>
          ) : (
            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
              {movements.map((mov) => (
                <div
                  key={mov.id}
                  className="rounded-2xl border border-slate-100 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-800/40 space-y-2"
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold">{mov.concept}</span>
                    <span
                      className={`font-bold ${
                        mov.amount > 0
                          ? "text-rose-600 dark:text-rose-400"
                          : "text-emerald-600 dark:text-emerald-400"
                      }`}
                    >
                      {mov.amount > 0
                        ? `+$${Number(mov.amount).toFixed(2)}`
                        : `-$${Math.abs(Number(mov.amount)).toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>
                      {new Date(mov.created_at).toLocaleString("es-MX")}
                    </span>
                    {mov.items && mov.items.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedMovement(mov)}
                        className="rounded-lg border border-amber-200 px-2 py-0.5 text-xs text-amber-700 hover:bg-amber-50 dark:border-amber-900/50 dark:text-amber-400 dark:hover:bg-amber-900/20"
                      >
                        Ver detalle ({mov.items.length} productos)
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Datos de Transferencia Bancaria */}
        <div className="rounded-3xl border border-amber-200/80 bg-amber-50/60 dark:border-slate-800 dark:bg-slate-900/90 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-lg font-bold text-amber-900 dark:text-amber-300">
            <Icon path={mdiStore} size={0.9} />
            <span>Datos para Pago por Transferencia</span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 text-sm">
            <div className="bg-white/80 dark:bg-slate-800/80 p-3.5 rounded-2xl border border-amber-100 dark:border-slate-700">
              <span className="text-xs uppercase text-slate-400 font-semibold block">
                Banco
              </span>
              <span className="font-bold text-slate-800 dark:text-slate-100 text-base">
                STP
              </span>
            </div>

            <div className="bg-white/80 dark:bg-slate-800/80 p-3.5 rounded-2xl border border-amber-100 dark:border-slate-700">
              <span className="text-xs uppercase text-slate-400 font-semibold block">
                Negocio
              </span>
              <span className="font-bold text-slate-800 dark:text-slate-100 text-base">
                {settings.business_name || "Tiendita"}
              </span>
            </div>

            <div className="sm:col-span-2 bg-white/90 dark:bg-slate-800/90 p-4 rounded-2xl border border-amber-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-xs uppercase text-slate-400 font-semibold block">
                  Cuenta CLABE
                </span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-lg tracking-wider">
                  {settings.bank_clabe}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyClabe}
                className="flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs px-4 py-2.5 transition shadow-sm"
              >
                <Icon path={mdiShareVariant} size={0.7} />
                <span>{copiedClabe ? "¡CLABE Copiada!" : "Copiar CLABE"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-slate-400 pt-4">
          <p>
            © {new Date().getFullYear()} {settings.business_name || "Tiendita"}{" "}
            — Estado de Cuenta Digital
          </p>
        </div>
      </div>

      {/* Modal de Detalle de Productos en Movimiento */}
      {selectedMovement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-lg rounded-3xl border border-amber-100/70 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="mb-2 text-lg font-bold text-slate-800 dark:text-slate-100">
              Detalle de Productos
            </div>
            <div className="mb-4 text-xs text-slate-500">
              {selectedMovement.concept || "Compra"} —{" "}
              {new Date(selectedMovement.created_at).toLocaleString("es-MX")}
            </div>

            <div className="overflow-hidden rounded-2xl border border-amber-100/70 dark:border-slate-800">
              <table className="min-w-full text-left text-xs">
                <thead className="bg-amber-50 text-amber-950 dark:bg-slate-800 dark:text-amber-200">
                  <tr>
                    <th className="px-4 py-2.5">Dulce</th>
                    <th className="px-4 py-2.5 text-center">Cantidad</th>
                    <th className="px-4 py-2.5 text-right">Precio Unit.</th>
                    <th className="px-4 py-2.5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-100/70 dark:divide-slate-800">
                  {selectedMovement.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-2 font-medium">{item.name}</td>
                      <td className="px-4 py-2 text-center">{item.quantity}</td>
                      <td className="px-4 py-2 text-right">
                        ${Number(item.unit_price || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-2 text-right font-bold">
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

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedMovement(null)}
                className="rounded-2xl bg-amber-500 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-amber-600"
              >
                Cerrar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
