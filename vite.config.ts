import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  vite: {
    server: {
      allowedHosts: ["expocenternorte.2see.io"],
    },
  },

  tanstackStart: {
    server: { entry: "server" },
  },
});
