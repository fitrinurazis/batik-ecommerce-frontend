import { defineConfig, loadEnv } from "vite";
import legacy from "@vitejs/plugin-legacy";
import removeConsole from "vite-plugin-remove-console";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
  define: {
    '__API_BASE_URL__': JSON.stringify(env.VITE_API_BASE_URL || 'http://localhost:3000/api'),
    '__APP_NAME__': JSON.stringify(env.VITE_APP_NAME || 'Batik Windasari'),
  },
  plugins: [
    removeConsole(),
    legacy({
      targets: ["defaults", "not IE 11"],
    }),
  ],
  server: {
    port: 3001,
    host: true,
  },
  preview: {
    port: 3001,
    host: true,
  },
  build: {
    outDir: "dist",
    assetsDir: "assets",
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
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
        "order-status": "./pages/order-status.html",
        payment: "./pages/payment.html",
        "admin-login": "./pages/admin-login.html",
        "admin-layout": "./pages/admin-layout.html",
        "dashboard-home": "./pages/dashboard-home.html",
        "dashboard-orders": "./pages/dashboard-orders.html",
        "dashboard-products": "./pages/dashboard-products.html",
        "dashboard-settings": "./pages/dashboard-settings.html",
      },
      output: {
        manualChunks: {
          vendor: ["axios"],
          utils: ["toastify-js"],
        },
      },
    },
  },
  envPrefix: "VITE_",
  };
});
