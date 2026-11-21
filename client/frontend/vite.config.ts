import { resolve } from "node:path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig, searchForWorkspaceRoot } from "vite"

// https://vite.dev/config/
export default defineConfig({
  server: {
    port: 3000,
    strictPort: true,
    fs: {
      allow: [
        searchForWorkspaceRoot(import.meta.dirname),
        resolve(import.meta.dirname, "../assets"),
      ],
    },
    proxy: { "/api": "http://127.0.0.1:5000" },
  },
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": resolve(import.meta.dirname, "./src"),
    },
  },
})
