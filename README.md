# Batik E-commerce Frontend

Frontend aplikasi e-commerce Batik Nusantara yang dibangun dengan HTML5, CSS3, JavaScript ES6, dan Tailwind CSS.

## 🚀 Quick Start

```bash
# Clone repository
git clone <repository-url>
cd batik-ecommerce-frontend

# Install dependencies
npm install

# Setup environment (edit .env sesuai kebutuhan)
# VITE_API_BASE_URL=https://admin30.fitrinurazis.com/api

# Jalankan development server
npm start

# Aplikasi berjalan di http://localhost:3001
```

## 📋 Persyaratan Sistem

Sebelum memulai instalasi, pastikan sistem Anda memiliki:

- **Node.js** (versi 16 atau lebih tinggi)
- **npm** (Node Package Manager)
- **Web browser** modern (Chrome, Firefox, Safari, Edge)

## 🚀 Instalasi

### 1. Clone Repository

```bash
git clone <repository-url>
cd batik-ecommerce-frontend
```

### 2. Install Dependencies

Install semua dependencies yang diperlukan:

```bash
npm install
```

### 3. Konfigurasi Environment

Buat file `.env` di root project dan konfigurasi sesuai kebutuhan:

```env
# Frontend Environment Configuration
VITE_API_BASE_URL=https://admin30.fitrinurazis.com/api
VITE_APP_NAME=Batik Nusantara
VITE_APP_VERSION=1.0.0

# Development settings
VITE_DEBUG=true
VITE_LOG_LEVEL=debug

# API Configuration
VITE_API_TIMEOUT=10000
VITE_API_RETRY_ATTEMPTS=3

# Upload settings
VITE_MAX_FILE_SIZE=5242880
VITE_ALLOWED_IMAGE_TYPES=image/jpeg,image/png,image/webp

# UI Configuration
VITE_ITEMS_PER_PAGE=10
VITE_PAGINATION_LIMIT=5
```

**Catatan:** Sesuaikan `VITE_API_BASE_URL` dengan URL backend API Anda.

## 🖥️ Menjalankan Aplikasi

### Mode Development

Jalankan development server dengan Express:

```bash
npm start
# atau
npm run dev
```

Server akan berjalan di `http://localhost:3001` dengan routing berikut:

- **Homepage:** `http://localhost:3001/`
- **Products:** `http://localhost:3001/products`
- **About:** `http://localhost:3001/about`
- **Contact:** `http://localhost:3001/contact`
- **Cart:** `http://localhost:3001/cart`
- **Checkout:** `http://localhost:3001/checkout`
- **Admin:** `http://localhost:3001/admin`

### Mode Production

#### 1. Build aplikasi:

```bash
npm run build
```

#### 2. Jalankan production server:

```bash
npm run serve
# atau
npm run serve:static
```

#### 3. Preview build:

```bash
npm run preview
```

Server production akan berjalan di `http://localhost:3001`

## 📁 Struktur Project

```
batik-ecommerce-frontend/
├── assets/                  # Asset statis
│   ├── css/                # Custom CSS files
│   ├── js/                 # JavaScript modules
│   │   ├── main.js         # Core utilities dan API service
│   │   ├── homepage.js     # Homepage functionality
│   │   ├── products.js     # Product catalog
│   │   ├── product-detail.js # Product detail page
│   │   ├── cart.js         # Shopping cart
│   │   └── checkout.js     # Checkout process
│   └── images/             # Gambar dan media
├── pages/                  # Halaman-halaman aplikasi
│   ├── products.html       # Katalog produk
│   ├── product-detail.html # Detail produk
│   ├── cart.html          # Keranjang belanja
│   ├── checkout.html      # Halaman checkout
│   ├── payment.html       # Halaman pembayaran
│   ├── invoice.html       # Invoice/struk
│   ├── order-status.html  # Status pesanan
│   ├── about.html         # Tentang kami
│   ├── contact.html       # Kontak
│   ├── admin-login.html   # Login admin
│   ├── dashboard.html     # Dashboard admin
│   └── dashboard-*.html   # Admin dashboard pages
├── index.html             # Homepage
├── server.js              # Express development server
├── serve-dist.js          # Production server
├── vite.config.js         # Vite configuration
├── package.json           # Dependencies dan scripts
├── package-lock.json      # Lock file dependencies
└── .env                   # Environment variables
```

## 🎨 Teknologi yang Digunakan

- **HTML5** - Struktur halaman
- **Tailwind CSS** - Framework CSS utility-first
- **JavaScript ES6+** - Interaktivitas dan logic
- **Express.js** - Web server untuk development dan routing
- **Vite** - Build tool dan bundler
- **Axios** - HTTP client untuk API calls
- **SweetAlert2** - Modal dan alert yang indah
- **Toastify.js** - Notifikasi toast
- **Font Awesome** - Icon library

## 🌟 Fitur Aplikasi

### 🏠 Homepage (`index.html`)
- Hero section dengan CTA
- Featured products carousel
- Categories showcase
- Newsletter subscription
- Responsive design

### 🛍️ Katalog Produk (`pages/products.html`)
- **Pencarian produk** dengan real-time search
- **Filter kategori** (Klasik, Pesisir, Modern)
- **Sorting** berdasarkan terbaru, harga, nama
- **Pagination** untuk navigasi halaman
- **Grid/List view** toggle
- **Loading states** dan empty states

### 📱 Detail Produk (`pages/product-detail.html`)
- Image gallery dengan zoom
- Product specifications
- Price calculation (dengan diskon)
- Add to cart functionality
- Related products
- Product tabs (deskripsi, spesifikasi, ulasan)

### 🛒 Keranjang Belanja (`pages/cart.html`)
- Item management (update quantity, remove)
- Price calculations dengan diskon
- Promo code functionality
- Order summary
- Checkout navigation

### 💳 Checkout (`pages/checkout.html`)
- **Form pelanggan** (nama, email, telepon)
- **Alamat pengiriman** lengkap
- **Metode pembayaran** (Transfer Bank, E-wallet, Kartu Kredit, COD)
- **Order summary** dengan service fee calculation
- **Form validation** Indonesia (nomor telepon, kode pos)
- **Success modal** dengan order confirmation

### 💰 Payment & Invoice (`pages/payment.html`, `pages/invoice.html`)
- Halaman pembayaran dengan instruksi
- Invoice/struk pembelian
- Order status tracking

### 👨‍💼 Admin Dashboard (`pages/admin-login.html`, `pages/dashboard*.html`)
- Login admin dengan autentikasi
- Dashboard home dengan statistik
- Management produk (CRUD)
- Management orders
- Settings panel

## 🔌 Integrasi Backend API

### Konfigurasi API Base URL

Edit file `.env` dan sesuaikan URL backend API Anda:

```env
VITE_API_BASE_URL=https://admin30.fitrinurazis.com/api
# atau untuk development lokal:
# VITE_API_BASE_URL=http://localhost:3000/api
```

### API Endpoints yang Digunakan

- `GET /api/products` - List produk
- `GET /api/products/:id` - Detail produk
- `GET /api/products/featured` - Produk unggulan
- `GET /api/products/related/:id` - Produk terkait
- `POST /api/orders` - Create order

### File API Service (`assets/js/main.js`)

```javascript
// API Service configuration
window.ApiService = {
    baseURL: 'http://localhost:3000/api',

    async getProducts() {
        // Implementation
    },

    async getProduct(id) {
        // Implementation
    },

    async createOrder(orderData) {
        // Implementation
    }
};
```

## 🛠️ Development

### Menambah Halaman Baru

1. Buat file HTML di folder `pages/`
2. Tambahkan route di `server.js`:
   ```javascript
   app.get("/nama-halaman", (req, res) => {
     res.sendFile(path.join(__dirname, "pages/nama-halaman.html"));
   });
   ```
3. Buat file JavaScript di folder `assets/js/` (jika diperlukan)
4. Include script di halaman HTML
5. Update navigasi menu

### Menambah Komponen JavaScript

1. Buat file baru di `assets/js/`
2. Export functions yang diperlukan
3. Import di file yang membutuhkan
4. Daftarkan event listeners

### Styling dengan Tailwind

Aplikasi menggunakan Tailwind CSS via CDN:

```html
<script src="https://cdn.tailwindcss.com"></script>
```

Untuk custom styles, edit file di `assets/css/`

### Available NPM Scripts

- `npm start` / `npm run dev` - Jalankan development server
- `npm run build` - Build untuk production
- `npm run preview` - Preview production build
- `npm run serve` - Jalankan production server
- `npm run clean` - Bersihkan folder dist

## 🧪 Testing

### Manual Testing Checklist

#### Homepage
- [ ] Hero section tampil dengan baik
- [ ] Featured products loading dari API
- [ ] Navigation menu berfungsi
- [ ] Cart counter update
- [ ] Responsive di mobile/desktop

#### Products Page
- [ ] Search functionality
- [ ] Category filters
- [ ] Sorting options
- [ ] Pagination
- [ ] Add to cart
- [ ] Product navigation

#### Product Detail
- [ ] Product loading by ID
- [ ] Image gallery
- [ ] Add to cart dengan quantity
- [ ] Related products
- [ ] Navigation ke cart

#### Cart
- [ ] Items loading dari localStorage
- [ ] Quantity update
- [ ] Item removal
- [ ] Price calculations
- [ ] Checkout navigation

#### Checkout
- [ ] Form validation
- [ ] Payment method selection
- [ ] Order creation
- [ ] Success modal
- [ ] Cart cleanup

### Cross-browser Testing

Test di browser berikut:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

### Mobile Responsiveness

Test di viewport:
- Mobile (320px - 768px)
- Tablet (768px - 1024px)
- Desktop (1024px+)

## 🚀 Deployment

### Build untuk Production

```bash
# Bersihkan folder dist lama
npm run clean

# Build project
npm run build
```

File hasil build akan berada di folder `dist/`

### Deploy ke Web Server

#### 1. VPS/Server dengan Node.js

Upload semua file project ke server, lalu:

```bash
# Install dependencies
npm install --production

# Jalankan production server
npm run serve
```

Atau gunakan PM2 untuk production:

```bash
# Install PM2
npm install -g pm2

# Jalankan dengan PM2
pm2 start serve-dist.js --name batik-frontend
pm2 save
pm2 startup
```

#### 2. Static Hosting (Netlify, Vercel, etc)

Upload folder `dist/` hasil build:

- **Netlify**: Drag & drop folder `dist/` atau connect repository
- **Vercel**: Import project dari Git
- **GitHub Pages**: Deploy folder `dist/`

#### 3. Apache/Nginx

Upload folder `dist/` ke document root dan konfigurasi:

**Nginx:**
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /path/to/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### Environment Variables Production

Sesuaikan file `.env` untuk production:

```env
VITE_API_BASE_URL=https://api.yourdomain.com/api
VITE_DEBUG=false
VITE_LOG_LEVEL=error
```

### Konfigurasi CORS

Pastikan backend dikonfigurasi untuk allow origin frontend:

```env
# Backend .env
CORS_ORIGIN=https://yourdomain.com
```

## 🛠️ Troubleshooting

### Server tidak bisa dijalankan

**Error: `Cannot find module 'express'`**
- Pastikan sudah menjalankan `npm install`
- Cek file `package.json` dan `node_modules/` ada

**Error: `Port 3001 already in use`**
- Port sudah digunakan aplikasi lain
- Ubah PORT di `server.js` atau gunakan environment variable:
  ```bash
  PORT=3002 npm start
  ```

### Error: "API Service not found"
- Pastikan file `assets/js/main.js` sudah di-load
- Check network tab untuk error loading script
- Pastikan order loading script sudah benar

### Error: "CORS policy error"
- Check backend CORS configuration
- Pastikan CORS_ORIGIN di backend sesuai dengan frontend URL
- Untuk development, gunakan `http://localhost:3001`

### Error: "Products not loading"
- Check backend server status (pastikan backend API berjalan)
- Check API base URL di `.env` (VITE_API_BASE_URL)
- Check network tab untuk HTTP errors (404, 500, etc)
- Check browser console untuk JavaScript errors
- Pastikan backend API endpoint `/api/products` tersedia

### Error: "Cart not persisting"
- Check localStorage quota (max 5-10MB per domain)
- Check browser privacy settings (private mode membatasi localStorage)
- Clear localStorage dan coba ulang:
  ```javascript
  localStorage.clear()
  ```

### Styling Issues
- Clear browser cache (Ctrl+Shift+Delete)
- Check Tailwind CDN loading di Network tab
- Check custom CSS conflicts di DevTools
- Verify responsive classes dengan device toolbar

### Build Errors

**Error saat `npm run build`**
- Clear cache: `npm run clean`
- Reinstall dependencies: `rm -rf node_modules package-lock.json && npm install`
- Check syntax errors di JavaScript files

## 📱 PWA (Future Enhancement)

Untuk mengubah menjadi Progressive Web App:

1. Tambah `manifest.json`
2. Implementasi Service Worker
3. Add to Home Screen functionality
4. Offline support

## 🤝 Kontribusi

1. Fork repository
2. Buat branch untuk fitur baru (`git checkout -b feature/amazing-feature`)
3. Commit perubahan (`git commit -m 'Add amazing feature'`)
4. Push ke branch (`git push origin feature/amazing-feature`)
5. Buat Pull Request

## 📝 License

Project ini menggunakan lisensi MIT - lihat file [LICENSE](LICENSE) untuk detail.

## 🆘 Support

Jika mengalami masalah atau memiliki pertanyaan:

- Buat issue di repository GitHub
- Email: support@batiknusantara.com
- Documentation: [docs.batiknusantara.com](https://docs.batiknusantara.com)

---

**Batik Nusantara E-commerce Frontend**
*Preserving Indonesian Heritage Through Beautiful Web Experience*