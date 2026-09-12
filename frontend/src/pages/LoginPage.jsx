import { useState } from "react";
import Icon from "@mdi/react";
import { mdiClipboardList } from "@mdi/js";
import brandLogo from "../assets/logo.png";

export default function LoginPage({
  onLogin,
  prices = [],
  pricesQuery = "",
  setPricesQuery,
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const filteredPrices = pricesQuery.trim()
    ? prices.filter((p) =>
        p.name.toLowerCase().includes(pricesQuery.trim().toLowerCase()),
      )
    : prices;

  function handleSubmit(e) {
    e.preventDefault();
    onLogin({ username, password });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
      {/* Login Card */}
      <div className="mx-auto w-full max-w-md">
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-amber-100/70 bg-white/90 p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900/80"
        >
          <div className="mb-4 flex justify-center">
            <img
              src={brandLogo}
              alt="Logo Tiendita"
              className="h-16 w-16 rounded-2xl border border-amber-200 object-cover shadow-sm dark:border-slate-700"
            />
          </div>
          <div className="mb-6 text-center text-2xl font-bold text-slate-800 dark:text-slate-100">
            Iniciar Sesión
          </div>
          <div className="grid gap-4">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                Usuario
              </label>
              <input
                required
                className="w-full rounded-2xl border border-amber-100/70 bg-transparent px-4 py-3 text-sm outline-none dark:border-slate-700 dark:text-slate-100"
                placeholder="admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                Contraseña
              </label>
              <input
                required
                className="w-full rounded-2xl border border-amber-100/70 bg-transparent px-4 py-3 text-sm outline-none dark:border-slate-700 dark:text-slate-100"
                placeholder="••••••••"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="mt-2 rounded-2xl bg-amber-500 py-3 text-sm font-semibold text-white shadow-sm hover:bg-amber-600 transition"
            >
              Entrar al Sistema
            </button>
          </div>
        </form>
      </div>

      {/* Public Prices Panel */}
      <div className="rounded-3xl border border-amber-100/70 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-slate-100">
            <Icon path={mdiClipboardList} size={1} className="text-amber-500" />
            Lista de Precios al Público
          </div>
          <input
            type="search"
            className="w-full sm:w-56 rounded-2xl border border-amber-100/70 bg-transparent px-4 py-2 text-xs outline-none dark:border-slate-700 dark:text-slate-100"
            placeholder="Buscar dulce o precio..."
            value={pricesQuery}
            onChange={(e) => setPricesQuery(e.target.value)}
          />
        </div>

        <div className="max-h-[60vh] overflow-y-auto rounded-2xl border border-amber-100/70 dark:border-slate-800">
          <table className="min-w-full text-left text-sm">
            <thead className="sticky top-0 bg-amber-50 text-amber-950 dark:bg-slate-800 dark:text-amber-200">
              <tr>
                <th className="px-4 py-2.5">Producto</th>
                <th className="px-4 py-2.5 text-right">Precio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-100/70 dark:divide-slate-800">
              {filteredPrices.map((p, index) => (
                <tr
                  key={index}
                  className="hover:bg-amber-50/50 dark:hover:bg-slate-800/40"
                >
                  <td className="px-4 py-2 font-medium text-slate-800 dark:text-slate-200">
                    {p.name}
                  </td>
                  <td className="px-4 py-2 text-right font-bold text-amber-700 dark:text-amber-400">
                    ${Number(p.price || p.sale_price).toFixed(2)}
                  </td>
                </tr>
              ))}
              {filteredPrices.length === 0 && (
                <tr>
                  <td
                    colSpan={2}
                    className="px-4 py-6 text-center text-sm text-slate-500"
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
