import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { devApi } from "./vite-plugin-api";

export default defineConfig(({ mode }) => {
  /**
   * Load the whole .env, not just VITE_*.
   *
   * Vite only exposes VITE_-prefixed variables, which is exactly right for the
   * bundle — but the dev API middleware runs in this same Node process and
   * needs DATA_GOV_KEY, which must never carry that prefix. Copying it into
   * process.env here keeps the key server-side while still making /api/aqi
   * work locally. In production Vercel supplies it as a real env var.
   */
  const env = loadEnv(mode, process.cwd(), "");
  for (const [k, v] of Object.entries(env)) {
    if (!k.startsWith("VITE_") && process.env[k] === undefined) process.env[k] = v;
  }

  return {
    plugins: [react(), devApi()],
    server: {
      // Honour an assigned PORT when something else already holds 5173.
      // Vite does not read PORT on its own, so wire it up explicitly.
      port: Number(process.env.PORT) || 5173,
      host: true,
    },
    build: { target: "es2020", sourcemap: true },
  };
});
