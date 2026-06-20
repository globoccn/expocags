import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  vite: {
    server: {
      allowedHosts: ["expocenternorte.2see.io"],
    },
  },
<<<<<<< HEAD
=======

>>>>>>> 4173ea2df941e841bb931d0d1a82b580d5d7610d
  tanstackStart: {
    server: { entry: "server" },
  },
});
