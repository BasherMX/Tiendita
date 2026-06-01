import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);

if ("serviceWorker" in navigator) {
  globalThis.addEventListener("load", () => {
    let refreshing = false;

    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshing) return;
      refreshing = true;
      globalThis.location.reload();
    });

    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        if (registration.waiting) {
          registration.waiting.postMessage({ type: "SKIP_WAITING" });
        }

        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              newWorker.postMessage({ type: "SKIP_WAITING" });
            }
          });
        });
      })
      .catch((error) => {
        console.error("Service worker registration failed:", error);
      });
  });
}
