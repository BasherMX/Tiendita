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
        handleBeforeInstallPrompt,
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
          className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md overflow-hidden rounded-2xl border border-[#E5E2DA] bg-white/95 p-4 shadow-2xl backdrop-blur-md dark:border-[#282C32] dark:bg-[#181B1E]/95"
        >
          <div className="flex items-start gap-3">
            <img
              src={brandLogo}
              alt="Tiendita"
              className="h-11 w-11 shrink-0 rounded-xl border border-[#E5E2DA] object-cover dark:border-[#282C32]"
            />
            <div className="flex-1 pr-2">
              <h3 className="text-sm font-bold text-[#1C1917] dark:text-[#F3F4F6]">
                Instalar Tiendita
              </h3>
              <p className="text-xs text-[#78716C] dark:text-[#9CA3AF] mt-0.5">
                Acceso rápido desde tu pantalla de inicio y funcionamiento sin
                conexión.
              </p>
            </div>
            <button
              onClick={handleDismiss}
              aria-label="Cerrar"
              className="rounded-lg p-1 text-[#A8A29E] hover:bg-[#FAF7F0] hover:text-[#1C1917] dark:hover:bg-[#202428] dark:hover:text-[#F3F4F6] transition"
            >
              <Icon path={mdiClose} size={0.75} />
            </button>
          </div>

          <div className="mt-3.5 flex flex-col gap-2">
            {isIOS ? (
              <div className="rounded-xl border border-[#E5E2DA] bg-[#FAF7F0] p-3 text-xs text-[#57534E] dark:border-[#282C32] dark:bg-[#121417] dark:text-[#D1D5DB]">
                <div className="flex items-center gap-1.5 font-bold mb-1.5 text-[#1C1917] dark:text-[#F3F4F6]">
                  Instrucciones para iOS (Safari):
                </div>
                <ol className="list-inside list-decimal space-y-1 text-[#78716C] dark:text-[#9CA3AF]">
                  <li className="flex items-center gap-1">
                    Toca el botón compartir{" "}
                    <Icon
                      path={mdiShareVariant}
                      size={0.65}
                      className="inline text-[#D97706] dark:text-[#F59E0B]"
                    />
                  </li>
                  <li className="flex items-center gap-1">
                    Selecciona{" "}
                    <span className="font-semibold text-[#1C1917] dark:text-[#F3F4F6]">
                      "Agregar a inicio"
                    </span>{" "}
                    <Icon
                      path={mdiPlusBox}
                      size={0.65}
                      className="inline text-[#D97706] dark:text-[#F59E0B]"
                    />
                  </li>
                </ol>
              </div>
            ) : (
              <button
                onClick={handleInstallClick}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#D97706] px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#B45309] transition active:scale-[0.99]"
              >
                <Icon path={mdiDownload} size={0.75} />
                Instalar Aplicación en Dispositivo
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
