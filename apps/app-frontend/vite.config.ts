import { defineConfig } from "vite";
import { parsePort } from "@lin/utils/port";

const PORT = parsePort(process.env.APP_FRONTEND_PORT, 5174);

export default defineConfig({
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
