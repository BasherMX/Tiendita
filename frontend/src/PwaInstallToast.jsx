import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Icon from "@mdi/react";
import {
  mdiClose,
  mdiDownload,
  mdiShareVariant,
  mdiPlusBox,
  mdiCheckCircle,
} from "@mdi/js";
import brandLogo from "./assets/logo.png";

export default function PwaInstallToast() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // 1. Check if app is already running in standalone mode (installed)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;

    if (isStandalone) {
      setInstalled(true);
      return;
    }

    // 2. Check if prompt was recently dismissed by user (e.g. within 3 days)
    const lastDismissed = localStorage.getItem("pwa_install_dismissed");
    if (lastDismissed) {
      const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
      if (Date.now() - Number(lastDismissed) < threeDaysMs) {
        return;
      }
    }

    // 3. Detect iOS environment
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice =
      /iphone|ipad|ipod/.test(ua) ||
      (window.navigator.platform === "MacIntel" &&
        window.navigator.maxTouchPoints > 1);

    if (isIosDevice) {
      setIsIOS(true);
      setShowToast(true);
      return;
    }

    // 4. Handle Chrome/Android/Edge beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowToast(true);
    };

    const handleAppInstalled = () => {
      setShowToast(false);
      setDeferredPrompt(null);
      setInstalled(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowToast(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowToast(false);
    localStorage.setItem("pwa_install_dismissed", String(Date.now()));
  };

  if (installed || !showToast) return null;

  return (
    <AnimatePresence>
      {showToast && (
        <motion.div
          initial={{ y: 100, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 100, opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", damping: 22, stiffness: 260 }}
          className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md overflow-hidden rounded-3xl border border-amber-200/80 bg-white/90 p-4 shadow-2xl backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90"
        >
          <div className="flex items-start gap-3">
            <img
              src={brandLogo}
              alt="Tiendita"
              className="h-12 w-12 shrink-0 rounded-2xl border border-amber-200 object-cover shadow-sm dark:border-slate-700"
            />
            <div className="flex-1 pr-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Instalar Tiendita
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Agrega la app a tu pantalla de inicio para un acceso rápido y sin conexión.
              </p>
            </div>
            <button
              onClick={handleDismiss}
              aria-label="Cerrar"
              className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition"
            >
              <Icon path={mdiClose} size={0.8} />
            </button>
          </div>

          <div className="mt-3.5 flex flex-col gap-2">
            {isIOS ? (
              <div className="rounded-2xl bg-amber-50 p-2.5 text-xs text-amber-900 dark:bg-slate-800/80 dark:text-amber-200">
                <div className="flex items-center gap-1.5 font-semibold mb-1">
                  Instrucciones para iOS (Safari):
                </div>
                <ol className="list-inside list-decimal space-y-1 text-slate-700 dark:text-slate-300">
                  <li className="flex items-center gap-1">
                    Toca el botón compartir{" "}
                    <Icon path={mdiShareVariant} size={0.65} className="inline text-amber-600 dark:text-amber-400" />
                  </li>
                  <li className="flex items-center gap-1">
                    Selecciona{" "}
                    <span className="font-medium">"Agregar a inicio"</span>{" "}
                    <Icon path={mdiPlusBox} size={0.65} className="inline text-amber-600 dark:text-amber-400" />
                  </li>
                </ol>
              </div>
            ) : (
              <button
                onClick={handleInstallClick}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:from-amber-600 hover:to-amber-700 active:scale-[0.98]"
              >
                <Icon path={mdiDownload} size={0.8} />
                Instalar Aplicación
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
