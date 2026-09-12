import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Icon from "@mdi/react";
import {
  mdiMenu,
  mdiClose,
  mdiWeatherNight,
  mdiWhiteBalanceSunny,
  mdiCandycane,
  mdiClipboardList,
  mdiAccountGroup,
  mdiLogout,
  mdiLogin,
  mdiChartBar,
  mdiStore,
  mdiCog,
} from "@mdi/js";
import brandLogo from "../assets/logo.png";

export default function Navbar({
  token,
  theme,
  setTheme,
  onLogout,
  onNavigate,
  systemVersion = "1.8.1",
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { path: "/clientes", icon: mdiAccountGroup, label: "Clientes" },
    { path: "/precios", icon: mdiClipboardList, label: "Punto de Venta" },
    { path: "/inventario", icon: mdiCandycane, label: "Inventario" },
    { path: "/compras", icon: mdiStore, label: "Compras" },
    { path: "/estadisticas", icon: mdiChartBar, label: "Estadísticas" },
    { path: "/configuracion", icon: mdiCog, label: "Configuración" },
  ];

  function navigateTo(path) {
    if (onNavigate) {
      const handled = onNavigate(path);
      if (handled) {
        setMenuOpen(false);
        return;
      }
    }
    navigate(path);
    setMenuOpen(false);
  }

  return (
    <nav className="sticky top-0 z-30 border-b border-[#E5E2DA] bg-[#FFFFFF]/90 backdrop-blur-md dark:border-[#282C32] dark:bg-[#181B1E]/90 transition-colors pt-[env(safe-area-inset-top,0px)] w-full max-w-full">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8 py-2.5">
        {/* Brand & Version Badge */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigateTo(token ? "/clientes" : "/login")}
            className="group flex items-center gap-2.5 text-left focus:outline-none"
            title="Ir a Clientes"
          >
            <div className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl border border-amber-500/30 bg-amber-50 shadow-xs dark:border-amber-400/20 dark:bg-amber-950/40">
              <img
                src={brandLogo}
                alt="Logo Tiendita"
                className="h-8 w-8 object-cover transition-transform group-hover:scale-105"
              />
            </div>
            <div>
              <span className="block text-base font-extrabold tracking-tight text-[#1C1917] dark:text-[#F3F2EE] leading-none">
                Tiendita
              </span>
              <span className="block text-[11px] font-medium text-[#78716C] dark:text-[#9CA3AF] leading-none mt-0.5">
                Mostrador
              </span>
            </div>
          </button>

          <button
            onClick={() => navigateTo("/releases")}
            title="Ver registro de versiones (Releases)"
            className="flex items-center gap-1 rounded-md border border-amber-500/20 bg-amber-50 px-2 py-0.5 font-mono text-[11px] font-semibold text-amber-900 transition hover:border-amber-500/40 hover:bg-amber-100 dark:border-amber-400/20 dark:bg-amber-950/50 dark:text-amber-300 dark:hover:bg-amber-900/60"
          >
            v{systemVersion}
          </button>
        </div>

        {/* Desktop Nav Links */}
        {token && (
          <div className="hidden flex-1 items-center justify-center gap-1 text-sm md:flex max-w-3xl">
            {navLinks.map(({ path, icon, label }) => {
              const active =
                location.pathname === path ||
                (path === "/clientes" && location.pathname === "/");
              return (
                <button
                  key={path}
                  onClick={() => navigateTo(path)}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                    active
                      ? "border border-amber-500/30 bg-amber-500/10 font-bold text-amber-950 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-300 shadow-xs"
                      : "text-[#57534E] hover:bg-[#F7F6F2] hover:text-[#1C1917] dark:text-[#9CA3AF] dark:hover:bg-[#282C32] dark:hover:text-[#F3F2EE]"
                  }`}
                >
                  <Icon path={icon} size={0.7} />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Right Controls */}
        <div className="flex items-center gap-2">
          <button
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E5E2DA] bg-[#FFFFFF] text-[#57534E] transition hover:bg-[#F7F6F2] hover:text-[#1C1917] dark:border-[#282C32] dark:bg-[#181B1E] dark:text-[#9CA3AF] dark:hover:bg-[#282C32] dark:hover:text-[#F3F2EE]"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            title={
              theme === "dark"
                ? "Cambiar a modo claro"
                : "Cambiar a modo oscuro"
            }
          >
            <Icon
              path={theme === "dark" ? mdiWhiteBalanceSunny : mdiWeatherNight}
              size={0.8}
            />
          </button>

          {token ? (
            <button
              className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50/50 px-2.5 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300 dark:hover:bg-red-900/40"
              onClick={onLogout}
              title="Cerrar sesión"
            >
              <Icon path={mdiLogout} size={0.65} />
              <span className="hidden sm:inline">Cerrar Sesión</span>
            </button>
          ) : (
            <button
              onClick={() => navigateTo("/login")}
              className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-900 hover:bg-amber-100 dark:border-amber-400/30 dark:bg-amber-950/50 dark:text-amber-300"
            >
              <Icon path={mdiLogin} size={0.65} />
              <span>Entrar</span>
            </button>
          )}

          {/* Mobile hamburger */}
          {token && (
            <button
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E5E2DA] bg-[#FFFFFF] text-[#1C1917] transition hover:bg-[#F7F6F2] dark:border-[#282C32] dark:bg-[#181B1E] dark:text-[#F3F2EE] md:hidden"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label="Abrir menú"
            >
              <Icon path={menuOpen ? mdiClose : mdiMenu} size={0.85} />
            </button>
          )}
        </div>
      </div>

      {/* Mobile dropdown menu */}
      <AnimatePresence>
        {menuOpen && token && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-[#E5E2DA] bg-[#FFFFFF] px-4 py-3 text-sm dark:border-[#282C32] dark:bg-[#181B1E] md:hidden"
          >
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
              {navLinks.map(({ path, icon, label }) => {
                const active =
                  location.pathname === path ||
                  (path === "/clientes" && location.pathname === "/");
                return (
                  <button
                    key={path}
                    onClick={() => navigateTo(path)}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium transition ${
                      active
                        ? "border border-amber-500/30 bg-amber-500/10 font-bold text-amber-950 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-300"
                        : "text-[#57534E] hover:bg-[#F7F6F2] hover:text-[#1C1917] dark:text-[#9CA3AF] dark:hover:bg-[#282C32]"
                    }`}
                  >
                    <Icon path={icon} size={0.75} />
                    <span>{label}</span>
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
