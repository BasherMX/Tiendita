import { useState } from "react";
import Icon from "@mdi/react";
import {
  mdiGift,
  mdiPlus,
  mdiStar,
  mdiPencil,
  mdiDelete,
  mdiHandHeart,
} from "@mdi/js";

export default function RewardsPage({
  rewards = [],
  clients = [],
  onNewReward,
  onEditReward,
  onDeleteReward,
  onRedeemReward,
}) {
  const [selectedClientId, setSelectedClientId] = useState("");

  const selectedClient = clients.find(
    (c) => String(c.id) === String(selectedClientId),
  );
  const clientPoints = Number(selectedClient?.points || 0);

  function handleRedeem(reward) {
    if (!selectedClientId) return;
    onRedeemReward({
      clientId: selectedClientId,
      rewardId: reward.id,
      sweetId: reward.sweet_id,
      pointsCost: reward.points_cost,
    });
  }

  return (
    <div className="space-y-5">
      {/* Selector de Cliente para Canjes */}
      <div className="rounded-2xl border border-[#E5E2DA] bg-[#FFFFFF] p-4 sm:p-6 shadow-xs dark:border-[#282C32] dark:bg-[#181B1E]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E2DA] pb-3 dark:border-[#282C32]">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-500/20 bg-amber-500/10 text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-300">
              <Icon path={mdiHandHeart} size={0.75} />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1C1917] dark:text-[#F3F2EE] leading-tight">
                Canje de Recompensas por Puntos
              </h2>
              <p className="text-[11px] text-[#78716C] dark:text-[#9CA3AF]">
                Premia la fidelidad y compras frecuentes de tus clientes
              </p>
            </div>
          </div>

          <button
            onClick={onNewReward}
            className="flex items-center gap-1.5 rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-amber-700 active:scale-[0.98] transition"
          >
            <Icon path={mdiPlus} size={0.65} />
            <span>Nuevo Premio</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs font-bold text-[#1C1917] dark:text-[#F3F2EE]">
            Cliente:
          </label>
          <select
            className="w-full sm:w-72 rounded-xl border border-[#E5E2DA] bg-[#F7F6F2] px-3 py-2 text-xs outline-none dark:border-[#282C32] dark:bg-[#111315] text-[#1C1917] dark:text-[#F3F2EE]"
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
          >
            <option value="" className="dark:bg-[#181B1E]">
              Seleccionar cliente para canjear...
            </option>
            {clients.map((c) => (
              <option key={c.id} value={c.id} className="dark:bg-[#181B1E]">
                {c.name} ({Number(c.points || 0).toFixed(1)} pts)
              </option>
            ))}
          </select>

          {selectedClient && (
            <div className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/20 bg-amber-50 px-3 py-1.5 text-xs font-bold font-tabular text-amber-900 dark:border-amber-400/20 dark:bg-amber-950/40 dark:text-amber-300">
              <Icon path={mdiStar} size={0.5} />
              <span>Puntos acumulados: {clientPoints.toFixed(1)} pts</span>
            </div>
          )}
        </div>
      </div>

      {/* Catálogo de Premios Disponibles */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rewards.map((reward) => {
          const cost = Number(reward.points_cost || 0);
          const stock = Number(reward.stock || 0);
          const canRedeem = selectedClient && clientPoints >= cost && stock > 0;

          return (
            <div
              key={reward.id}
              className="flex flex-col justify-between rounded-2xl border border-[#E5E2DA] bg-[#FFFFFF] p-4 sm:p-5 shadow-xs dark:border-[#282C32] dark:bg-[#181B1E] transition hover:border-amber-500/30"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-50 text-amber-700 dark:border-amber-400/20 dark:bg-amber-950/40 dark:text-amber-400">
                      <Icon path={mdiGift} size={0.8} />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-[#1C1917] dark:text-[#F3F2EE] leading-tight">
                        {reward.name}
                      </h3>
                      <span className="text-[11px] text-[#78716C] dark:text-[#9CA3AF]">
                        {stock} disponible{stock !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-1">
                    <button
                      onClick={() => onEditReward(reward)}
                      className="rounded-lg p-1 text-[#78716C] hover:bg-amber-100 hover:text-amber-900 dark:text-[#9CA3AF] dark:hover:bg-[#282C32] dark:hover:text-amber-300 transition"
                      title="Editar premio"
                    >
                      <Icon path={mdiPencil} size={0.65} />
                    </button>
                    <button
                      onClick={() => onDeleteReward(reward.id)}
                      className="rounded-lg p-1 text-[#78716C] hover:bg-red-50 hover:text-red-600 dark:text-[#9CA3AF] dark:hover:bg-red-950/40 dark:hover:text-red-400 transition"
                      title="Eliminar premio"
                    >
                      <Icon path={mdiDelete} size={0.65} />
                    </button>
                  </div>
                </div>

                <div className="my-3.5 flex items-baseline justify-between border-y border-[#E5E2DA] py-2.5 dark:border-[#282C32]">
                  <span className="text-[11px] font-bold text-[#78716C] dark:text-[#9CA3AF]">
                    Costo en Puntos
                  </span>
                  <span className="text-xl font-black font-tabular text-amber-700 dark:text-amber-400">
                    {cost.toFixed(1)}{" "}
                    <span className="text-xs font-bold text-amber-900/60 dark:text-amber-400/70">
                      pts
                    </span>
                  </span>
                </div>
              </div>

              <button
                disabled={!canRedeem}
                onClick={() => handleRedeem(reward)}
                className={`w-full rounded-xl py-2.5 text-xs font-bold transition shadow-xs ${
                  canRedeem
                    ? "bg-amber-600 text-white hover:bg-amber-700 active:scale-[0.99]"
                    : "bg-[#F7F6F2] text-[#78716C] cursor-not-allowed dark:bg-[#111315] dark:text-[#9CA3AF]"
                }`}
              >
                {!selectedClient
                  ? "Selecciona un cliente para canjear"
                  : stock <= 0
                    ? "Premio Agotado"
                    : clientPoints < cost
                      ? `Faltan ${(cost - clientPoints).toFixed(1)} pts`
                      : "Canjear Premio"}
              </button>
            </div>
          );
        })}

        {rewards.length === 0 && (
          <div className="col-span-full py-12 text-center text-xs text-[#78716C] dark:text-[#9CA3AF]">
            No hay premios registrados en el catálogo. Pulsa "+ Nuevo Premio"
            para agregar el primero.
          </div>
        )}
      </div>
    </div>
  );
}
