import { defineConfig } from "vite";
import legacy from "@vitejs/plugin-legacy";

export default defineConfig({
  plugins: [
    react(),
    removeConsole(),
    legacy({
      targets: ["defaults", "not IE 11"],
    }),
  ],
  server: {
    port: 3001,
    host: true,
  },
  build: {
    outDir: "dist",
    assetsDir: "assets",
    rollupOptions: {
      input: {
        main: "./index.html",
        about: "./pages/about.html",
        products: "./pages/products.html",
        cart: "./pages/cart.html",
        checkout: "./pages/checkout.html",
        contact: "./pages/contact.html",
        "product-detail": "./pages/product-detail.html",
        invoice: "./pages/invoice.html",
        dashboard: "./pages/dashboard.html",
        "admin-login": "./pages/admin-login.html",
      },
    },
  },
  envPrefix: "VITE_",
});
