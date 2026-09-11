import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { AppProvider } from "./state/AppState";
import { LanguageProvider } from "./i18n/LanguageProvider";
import "./index.css";

/*
 * Register the service worker — production only.
 *
 * In `vite dev` the served modules are not the built output, so a worker
 * caching them would serve yesterday's source after an edit and look exactly
 * like a broken hot reload. The worker has one job, offline launch, and that
 * only means anything against a real build.
 *
 * Failure is deliberately silent: an app that cannot register a worker is an
 * app without offline support, not a broken app, and the weather still loads.
 */
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <LanguageProvider>
      <AppProvider>
        <App />
      </AppProvider>
    </LanguageProvider>
  </StrictMode>,
);
