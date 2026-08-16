import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    let reloadingForUpdate = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!reloadingForUpdate) {
        reloadingForUpdate = true;
        window.location.reload();
      }
    });
    navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" }).then((registration) => {
      registration.update();
      const activateWaitingWorker = () => registration.waiting?.postMessage({ type: "SKIP_WAITING" });
      activateWaitingWorker();
      registration.addEventListener("updatefound", () => {
        const installing = registration.installing;
        installing?.addEventListener("statechange", () => {
          if (installing.state === "installed" && navigator.serviceWorker.controller) activateWaitingWorker();
        });
      });
    }).catch(() => {
      // Registration can fail in local preview; the app remains usable without offline caching.
    });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
