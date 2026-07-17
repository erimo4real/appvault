import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon.svg"],
      manifest: {
        name: "AppVault",
        short_name: "AppVault",
        description: "App portfolio & project manager",
        start_url: "/",
        display: "standalone",
        background_color: "#f4f7fb",
        theme_color: "#1976d2",
        icons: [
          { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "/icon.svg", sizes: "any", type: "image/svg+xml" }
        ]
      },
      workbox: {
        globPatterns: [],
        additionalManifestEntries: [
          { url: "/", revision: "1" },
          { url: "/index.html", revision: "1" }
        ]
      },
      devOptions: {
        enabled: true,
        type: "module"
      }
    })
  ],
  server: {
    port: 5173
  }
});
