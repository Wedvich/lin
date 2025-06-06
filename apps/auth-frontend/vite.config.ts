import { defineConfig } from "vite";
import { parsePort } from "@lin/utils";

const PORT = parsePort(process.env.AUTH_FRONTEND_PORT, 5173);

export default defineConfig({
  base: "/auth/",
  build: {
    outDir: "dist",
  },
  experimental: {
    enableNativePlugin: true,
  },
  server: {
    port: PORT,
  },
});
