import { useState } from "react";
import Icon from "@mdi/react";
import {
  mdiGift,
  mdiPlusCircle,
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
    <div className="space-y-6">
      {/* Selector de Cliente para Canjes */}
      <div className="rounded-3xl border border-amber-100/70 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-slate-100">
            <Icon path={mdiHandHeart} size={1} className="text-amber-500" />
            Canje de Premios por Puntos
          </div>
          <button
            onClick={onNewReward}
            className="flex items-center gap-2 rounded-2xl bg-amber-500 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-amber-600 transition"
          >
            <Icon path={mdiPlusCircle} size={0.75} />
            Nuevo Premio
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs font-semibold uppercase text-slate-500">
            Seleccionar Cliente:
          </label>
          <select
            className="w-full sm:w-72 rounded-2xl border border-amber-100/70 bg-transparent px-4 py-2 text-sm outline-none dark:border-slate-700 dark:text-slate-100"
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
          >
            <option value="" className="dark:bg-slate-900">
              Seleccionar cliente...
            </option>
            {clients.map((c) => (
              <option key={c.id} value={c.id} className="dark:bg-slate-900">
                {c.name} ({Number(c.points || 0).toFixed(1)} pts)
              </option>
            ))}
          </select>

          {selectedClient && (
            <div className="flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900 dark:bg-slate-800 dark:text-amber-300">
              <Icon path={mdiStar} size={0.5} />
              Puntos disponibles: {clientPoints.toFixed(1)} pts
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
              className="flex flex-col justify-between rounded-3xl border border-amber-100/70 bg-white/90 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/80"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="rounded-2xl bg-amber-100 p-2.5 text-amber-600 dark:bg-slate-800 dark:text-amber-400">
                      <Icon path={mdiGift} size={1} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 dark:text-slate-100">
                        {reward.name}
                      </h3>
                      <span className="text-xs text-slate-400">
                        Stock: {stock} disponibles
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-1">
                    <button
                      onClick={() => onEditReward(reward)}
                      className="rounded-xl p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
                    >
                      <Icon path={mdiPencil} size={0.7} />
                    </button>
                    <button
                      onClick={() => onDeleteReward(reward.id)}
                      className="rounded-xl p-1 text-rose-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950"
                    >
                      <Icon path={mdiDelete} size={0.7} />
                    </button>
                  </div>
                </div>

                <div className="my-4 flex items-center justify-between border-y border-slate-100 py-3 dark:border-slate-800">
                  <span className="text-xs font-semibold uppercase text-slate-400">
                    Costo
                  </span>
                  <span className="text-xl font-black text-amber-600 dark:text-amber-400">
                    {cost.toFixed(1)} pts
                  </span>
                </div>
              </div>

              <button
                disabled={!canRedeem}
                onClick={() => handleRedeem(reward)}
                className={`w-full rounded-2xl py-2.5 text-xs font-bold transition shadow-sm ${
                  canRedeem
                    ? "bg-amber-500 text-white hover:bg-amber-600"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-600"
                }`}
              >
                {!selectedClient
                  ? "Selecciona un cliente"
                  : stock <= 0
                    ? "Agotado"
                    : clientPoints < cost
                      ? `Faltan ${(cost - clientPoints).toFixed(1)} pts`
                      : "Canjear Premio"}
              </button>
            </div>
          );
        })}

        {rewards.length === 0 && (
          <div className="col-span-full py-12 text-center text-sm text-slate-500">
            No hay premios registrados. Haz clic en "Nuevo Premio" para crear
            uno.
          </div>
        )}
      </div>
    </div>
  );
}
