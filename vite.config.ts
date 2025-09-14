// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Chatbot API in dev
      "/api": {
        target: process.env.VITE_PROXY_TARGET || process.env.CHATBOT_SERVER || "http://localhost:8787",
        changeOrigin: true,
      },
      // Bank API in dev
      "/bank": {
        // Keep /v1 in the TARGET, and strip the /bank prefix from the request
        target: process.env.VITE_BANK_API_TARGET || "http://localhost:4000/v1",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/bank/, ""), // <-- key line
      },
    },
  },
});
