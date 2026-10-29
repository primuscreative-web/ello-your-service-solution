import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

const deploymentAssetNamespace = (
  process.env.VERCEL_DEPLOYMENT_ID ?? `local-${Date.now().toString(36)}`
).replace(/[^a-zA-Z0-9_-]/g, "");

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  server: {
    port: 3001,
  },
  build: {
    assetsDir: `assets/${deploymentAssetNamespace}`,
  },
  plugins: [
    tailwindcss(),
    tanstackStart({
      server: { entry: "server" },
    }),
    nitro({ preset: "vercel" }),
    react(),
  ],
});
