import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import RubyPlugin from "vite-plugin-ruby";
import fs from "node:fs";
import path from "node:path";

const indexHtml = fs.readFileSync(path.resolve(__dirname, "index.html"), "utf-8");

export default defineConfig({
  plugins: [react(), RubyPlugin()],
  build: {
    rollupOptions: {
      input: {
        application: path.resolve(__dirname, "entrypoints/application.js"),
      },
    },
  },
  server: {
    port: 3036,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url.includes(".")) {
          return next();
        }
        res.setHeader("Content-Type", "text/html");
        res.end(indexHtml);
      });
    },
  },
});
