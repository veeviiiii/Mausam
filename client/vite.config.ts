import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    // Honour an assigned PORT when something else already holds 5173.
    // Vite does not read PORT on its own, so wire it up explicitly.
    port: Number(process.env.PORT) || 5173,
    host: true,
  },
  build: { target: "es2020", sourcemap: true },
});
