import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Icon from "@mdi/react";
import {
  mdiMenu,
  mdiWeatherNight,
  mdiWhiteBalanceSunny,
  mdiCandycane,
  mdiClipboardList,
  mdiAccountGroup,
  mdiLogout,
  mdiLogin,
  mdiChartBar,
  mdiStore,
  mdiGift,
  mdiWhatsapp,
} from "@mdi/js";
import brandLogo from "../assets/logo.png";

export default function Navbar({
  token,
  theme,
  setTheme,
  onLogout,
  systemVersion = "1.4.0",
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { path: "/precios", icon: mdiClipboardList, label: "Precios" },
    { path: "/inventario", icon: mdiCandycane, label: "Inventario" },
    { path: "/clientes", icon: mdiAccountGroup, label: "Clientes" },
    { path: "/recompensas", icon: mdiGift, label: "Recompensas" },
    { path: "/whatsapp", icon: mdiWhatsapp, label: "WhatsApp" },
    { path: "/compras", icon: mdiStore, label: "Compras" },
    { path: "/estadisticas", icon: mdiChartBar, label: "Estadísticas" },
  ];

  function navigateTo(path) {
    navigate(path);
    setMenuOpen(false);
  }

  return (
    <nav className="sticky top-0 z-30 border-b border-amber-100/70 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        {/* Brand */}
        <button
          onClick={() => navigateTo(token ? "/precios" : "/login")}
          className="flex items-center gap-2.5 text-left transition hover:opacity-85"
        >
          <img
            src={brandLogo}
            alt="Logo Tiendita"
            className="h-10 w-10 rounded-2xl border border-amber-200 object-cover shadow-sm dark:border-slate-700"
          />
          <span className="flex items-center gap-1.5 text-lg font-bold tracking-tight text-amber-950 dark:text-amber-100">
            Tiendita
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-800 dark:bg-slate-800 dark:text-amber-300">
              v{systemVersion}
            </span>
          </span>
        </button>

        {/* Desktop Nav */}
        {token && (
          <div className="hidden flex-1 items-center gap-1 text-sm md:flex">
            {navLinks.map(({ path, icon, label }) => {
              const active =
                location.pathname === path ||
                (path === "/precios" && location.pathname === "/");
              return (
                <button
                  key={path}
                  onClick={() => navigateTo(path)}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 transition ${
                    active
                      ? "bg-amber-100 font-semibold text-amber-800 dark:bg-slate-700 dark:text-amber-300"
                      : "hover:bg-amber-50 text-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                  }`}
                >
                  <Icon path={icon} size={0.75} />
                  {label}
                </button>
              );
            })}
          </div>
        )}

        {/* Spacer on mobile */}
        <div className="flex-1 md:hidden" />

        {/* Right Controls */}
        <div className="flex items-center gap-2">
          <button
            className="rounded-full border border-amber-200/70 p-2 text-amber-900 transition hover:rotate-6 dark:border-slate-700 dark:text-amber-200"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            title="Cambiar tema"
          >
            <Icon
              path={theme === "dark" ? mdiWhiteBalanceSunny : mdiWeatherNight}
              size={0.9}
            />
          </button>

          {token ? (
            <button
              className="flex items-center gap-1.5 rounded-full border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 dark:border-rose-700 dark:text-rose-200 dark:hover:bg-rose-900/40"
              onClick={onLogout}
            >
              <Icon path={mdiLogout} size={0.75} />
              Salir
            </button>
          ) : (
            <button
              onClick={() => navigateTo("/login")}
              className="flex items-center gap-1.5 rounded-full border border-amber-200 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-50 dark:border-slate-700 dark:text-amber-300 dark:hover:bg-slate-800"
            >
              <Icon path={mdiLogin} size={0.75} />
              Login
            </button>
          )}

          {/* Mobile hamburger */}
          {token && (
            <button
              className="rounded-full bg-amber-100 p-2 text-amber-900 transition hover:scale-105 dark:bg-slate-800 dark:text-amber-200 md:hidden"
              onClick={() => setMenuOpen((prev) => !prev)}
            >
              <Icon path={mdiMenu} size={0.9} />
            </button>
          )}
        </div>
      </div>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {menuOpen && token && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-amber-100/60 bg-white/95 px-4 py-3 text-sm dark:border-slate-800 dark:bg-slate-900/95 md:hidden"
          >
            <div className="flex flex-col gap-2">
              {navLinks.map(({ path, icon, label }) => {
                const active =
                  location.pathname === path ||
                  (path === "/precios" && location.pathname === "/");
                return (
                  <button
                    key={path}
                    onClick={() => navigateTo(path)}
                    className={`flex items-center gap-2 rounded-xl px-3 py-2 text-left transition ${
                      active
                        ? "bg-amber-100 font-semibold text-amber-900 dark:bg-slate-800 dark:text-amber-300"
                        : "hover:bg-amber-50/70 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <Icon path={icon} size={0.8} />
                    {label}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
