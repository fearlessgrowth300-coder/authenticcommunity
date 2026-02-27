import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // registration can fail in preview/dev; production still auto-updates via new worker lifecycle
    });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
