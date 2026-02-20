import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // All /api requests → your .NET backend
      "/api": {
        target: "http://localhost:5000", // ← change to your actual backend port
        changeOrigin: true,
        secure: false,
      },
      // SignalR hub
      "/hubs": {
        target: "http://localhost:5000", // ← same backend port
        changeOrigin: true,
        secure: false,
        ws: true, // ← required for WebSockets
      },
    },
  },
});
