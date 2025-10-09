import express from "express";
import path from "path";

const app = express();
const __dirname = path.resolve();

// Middleware to parse JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (CSS, JS, images, etc.)
app.use("/assets", express.static(path.join(__dirname, "assets")));
app.use("/js", express.static(path.join(__dirname, "js")));

// Serve index.html at root
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Clean URL routing for main pages
app.get("/products", (req, res) => {
  res.sendFile(path.join(__dirname, "pages/products.html"));
});

app.get("/about", (req, res) => {
  res.sendFile(path.join(__dirname, "pages/about.html"));
});

app.get("/contact", (req, res) => {
  res.sendFile(path.join(__dirname, "pages/contact.html"));
});

app.get("/cart", (req, res) => {
  res.sendFile(path.join(__dirname, "pages/cart.html"));
});

app.get("/checkout", (req, res) => {
  res.sendFile(path.join(__dirname, "pages/checkout.html"));
});

app.get("/payment", (req, res) => {
  res.sendFile(path.join(__dirname, "pages/payment.html"));
});

app.get("/product-detail", (req, res) => {
  res.sendFile(path.join(__dirname, "pages/product-detail.html"));
});

app.get("/invoice", (req, res) => {
  res.sendFile(path.join(__dirname, "pages/invoice.html"));
});

app.get("/order-status", (req, res) => {
  res.sendFile(path.join(__dirname, "pages/order-status.html"));
});

// Admin routes
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "pages/admin-login.html"));
});

app.get("/admin/login", (req, res) => {
  res.sendFile(path.join(__dirname, "pages/admin-login.html"));
});

app.get("/admin/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "pages/dashboard.html"));
});

app.get("/admin/dashboard/home", (req, res) => {
  res.sendFile(path.join(__dirname, "pages/dashboard-home.html"));
});

app.get("/admin/dashboard/products", (req, res) => {
  res.sendFile(path.join(__dirname, "pages/dashboard-products.html"));
});

app.get("/admin/dashboard/orders", (req, res) => {
  res.sendFile(path.join(__dirname, "pages/dashboard-orders.html"));
});

app.get("/admin/dashboard/settings", (req, res) => {
  res.sendFile(path.join(__dirname, "pages/dashboard-settings.html"));
});

// Fallback for any other static files (keep original structure for compatibility)
app.use(express.static(__dirname));

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Frontend server berjalan di http://localhost:${PORT}`);
  console.log(`\n📌 Clean URLs tersedia:`);
  console.log(`   - Homepage:     http://localhost:${PORT}/`);
  console.log(`   - Products:     http://localhost:${PORT}/products`);
  console.log(`   - About:        http://localhost:${PORT}/about`);
  console.log(`   - Contact:      http://localhost:${PORT}/contact`);
  console.log(`   - Cart:         http://localhost:${PORT}/cart`);
  console.log(`   - Admin:        http://localhost:${PORT}/admin`);
});
