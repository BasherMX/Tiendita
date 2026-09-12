import { useState } from "react";
import Icon from "@mdi/react";
import { mdiClipboardList, mdiMagnify, mdiLogin } from "@mdi/js";
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
    <div className="grid gap-6 lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)] items-start">
      {/* Login Card */}
      <div className="w-full">
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-[#E5E2DA] bg-[#FFFFFF] p-6 sm:p-8 shadow-xs dark:border-[#282C32] dark:bg-[#181B1E]"
        >
          <div className="mb-4 flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-50 shadow-xs dark:border-amber-400/20 dark:bg-amber-950/40 mb-3">
              <img
                src={brandLogo}
                alt="Logo Tiendita"
                className="h-11 w-11 object-cover"
              />
            </div>
            <h1 className="text-xl font-black text-[#1C1917] dark:text-[#F3F2EE] tracking-tight">
              Mostrador Tiendita
            </h1>
            <p className="text-xs text-[#78716C] dark:text-[#9CA3AF] mt-0.5">
              Acceso a cobros, fiados, almacén y clientes
            </p>
          </div>

          <div className="space-y-3.5 pt-2">
            <div>
              <label className="mb-1 block text-[11px] font-bold text-[#78716C] dark:text-[#9CA3AF]">
                Usuario
              </label>
              <input
                required
                className="w-full rounded-xl border border-[#E5E2DA] bg-[#F7F6F2] px-3.5 py-2.5 text-xs outline-none transition focus:bg-[#FFFFFF] dark:border-[#282C32] dark:bg-[#111315] text-[#1C1917] dark:text-[#F3F2EE]"
                placeholder="Nombre de usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-bold text-[#78716C] dark:text-[#9CA3AF]">
                Contraseña
              </label>
              <input
                required
                className="w-full rounded-xl border border-[#E5E2DA] bg-[#F7F6F2] px-3.5 py-2.5 text-xs outline-none transition focus:bg-[#FFFFFF] dark:border-[#282C32] dark:bg-[#111315] text-[#1C1917] dark:text-[#F3F2EE]"
                placeholder="••••••••"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-600 py-3 text-xs font-bold text-white shadow-xs hover:bg-amber-700 active:scale-[0.98] transition"
            >
              <Icon path={mdiLogin} size={0.7} />
              <span>Entrar al Mostrador</span>
            </button>
          </div>
        </form>
      </div>

      {/* Public Prices Panel */}
      <div className="flex flex-col rounded-2xl border border-[#E5E2DA] bg-[#FFFFFF] p-4 sm:p-6 shadow-xs dark:border-[#282C32] dark:bg-[#181B1E]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E2DA] pb-3 dark:border-[#282C32]">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-500/20 bg-amber-500/10 text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-300">
              <Icon path={mdiClipboardList} size={0.7} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#1C1917] dark:text-[#F3F2EE] leading-tight">
                Lista de Precios al Público
              </h2>
              <p className="text-[11px] text-[#78716C] dark:text-[#9CA3AF]">
                Consulta rápida de precios de mostrador
              </p>
            </div>
          </div>

          <div className="relative w-full sm:w-52">
            <Icon
              path={mdiMagnify}
              size={0.65}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#78716C] dark:text-[#9CA3AF]"
            />
            <input
              type="search"
              className="w-full rounded-lg border border-[#E5E2DA] bg-[#F7F6F2] py-1.5 pl-8 pr-2.5 text-xs outline-none dark:border-[#282C32] dark:bg-[#111315] text-[#1C1917] dark:text-[#F3F2EE]"
              placeholder="Buscar dulce o precio..."
              value={pricesQuery}
              onChange={(e) => setPricesQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto rounded-xl border border-[#E5E2DA] dark:border-[#282C32]">
          <table className="min-w-full text-left text-xs">
            <thead className="sticky top-0 bg-[#F7F6F2] text-[#57534E] border-b border-[#E5E2DA] dark:bg-[#111315] dark:text-[#9CA3AF] dark:border-[#282C32] z-10">
              <tr>
                <th className="px-4 py-2 font-semibold">Producto</th>
                <th className="px-4 py-2 text-right font-semibold">
                  Precio al Público
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E2DA] dark:divide-[#282C32] font-tabular">
              {filteredPrices.map((p, index) => (
                <tr
                  key={index}
                  className="hover:bg-[#F7F6F2]/60 dark:hover:bg-[#202428]/50 transition-colors"
                >
                  <td className="px-4 py-2 font-medium text-[#1C1917] dark:text-[#F3F2EE]">
                    {p.name}
                  </td>
                  <td className="px-4 py-2 text-right font-black text-amber-700 dark:text-amber-400">
                    ${Number(p.price || p.sale_price).toFixed(2)}
                  </td>
                </tr>
              ))}
              {filteredPrices.length === 0 && (
                <tr>
                  <td
                    colSpan={2}
                    className="px-4 py-8 text-center text-xs text-[#78716C] dark:text-[#9CA3AF]"
                  >
                    No se encontraron productos disponibles
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
