import express from "express";
import path from "path";

const app = express();
const __dirname = path.resolve();
const distPath = path.join(__dirname, "dist");

// Serve static files from dist
app.use(express.static(distPath));

// Clean URL routing for main pages - serve from dist/pages
app.get("/products", (req, res) => {
  res.sendFile(path.join(distPath, "pages/products.html"));
});

app.get("/about", (req, res) => {
  res.sendFile(path.join(distPath, "pages/about.html"));
});

app.get("/contact", (req, res) => {
  res.sendFile(path.join(distPath, "pages/contact.html"));
});

app.get("/cart", (req, res) => {
  res.sendFile(path.join(distPath, "pages/cart.html"));
});

app.get("/checkout", (req, res) => {
  res.sendFile(path.join(distPath, "pages/checkout.html"));
});

app.get("/payment", (req, res) => {
  res.sendFile(path.join(distPath, "pages/payment.html"));
});

app.get("/product-detail", (req, res) => {
  res.sendFile(path.join(distPath, "pages/product-detail.html"));
});

app.get("/invoice", (req, res) => {
  res.sendFile(path.join(distPath, "pages/invoice.html"));
});

app.get("/order-status", (req, res) => {
  res.sendFile(path.join(distPath, "pages/order-status.html"));
});

// Admin routes
app.get("/admin", (req, res) => {
  res.sendFile(path.join(distPath, "pages/admin-login.html"));
});

app.get("/admin/login", (req, res) => {
  res.sendFile(path.join(distPath, "pages/admin-login.html"));
});

app.get("/admin/dashboard/home", (req, res) => {
  res.sendFile(path.join(distPath, "pages/dashboard-home.html"));
});

app.get("/admin/dashboard/products", (req, res) => {
  res.sendFile(path.join(distPath, "pages/dashboard-products.html"));
});

app.get("/admin/dashboard/orders", (req, res) => {
  res.sendFile(path.join(distPath, "pages/dashboard-orders.html"));
});

app.get("/admin/dashboard/settings", (req, res) => {
  res.sendFile(path.join(distPath, "pages/dashboard-settings.html"));
});

// Fallback to index.html for root
app.get("/", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Production build server running at http://localhost:${PORT}`);
  console.log(`📦 Serving files from: dist/`);
  console.log(`\n✅ Clean URLs available:`);
  console.log(`   - http://localhost:${PORT}/products`);
  console.log(`   - http://localhost:${PORT}/about`);
  console.log(`   - http://localhost:${PORT}/cart`);
  console.log(`   - etc...`);
});
