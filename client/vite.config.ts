import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    "import.meta.env.VITE_API_URL": JSON.stringify(
      process.env.VITE_API_URL
        ? (() => {
            let url = process.env.VITE_API_URL.trim();
            if (!url.startsWith("http://") && !url.startsWith("https://")) {
              url = `https://${url}`;
            }
            if (!url.includes(".") && !url.includes("localhost") && !url.includes("127.0.0.1")) {
              url = `${url}.onrender.com`;
            }
            return url;
          })()
        : ""
    ),
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
      "/login": {
        target: "http://localhost:3000",
        changeOrigin: true,
        bypass: (req) => {
          if (req.headers.accept && req.headers.accept.indexOf("html") !== -1) {
            return "/index.html";
          }
        },
      },
      "/register": {
        target: "http://localhost:3000",
        changeOrigin: true,
        bypass: (req) => {
          if (req.headers.accept && req.headers.accept.indexOf("html") !== -1) {
            return "/index.html";
          }
        },
      },
      "/logout": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
      "/auth": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
      "/profile": {
        target: "http://localhost:3000",
        changeOrigin: true,
        bypass: (req) => {
          if (req.headers.accept && req.headers.accept.indexOf("html") !== -1) {
            return "/index.html";
          }
        },
      },
    },
  },
});
