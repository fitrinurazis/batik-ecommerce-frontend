# Batik E-commerce Frontend

Frontend aplikasi e-commerce Batik Nusantara yang dibangun dengan HTML5, CSS3, JavaScript ES6, dan Tailwind CSS.

## 📋 Persyaratan Sistem

Sebelum memulai instalasi, pastikan sistem Anda memiliki:

- **Node.js** (versi 16 atau lebih tinggi)
- **npm** atau **yarn**
- **Web browser** modern (Chrome, Firefox, Safari, Edge)
- **Python** (untuk HTTP server alternatif)

## 🚀 Instalasi

### 1. Clone Repository

```bash
git clone <repository-url>
cd batik-ecommerce/frontend
```

### 2. Install Dependencies (Opsional)

Jika ingin menggunakan development server atau build tools:

```bash
npm install
```

### 3. Konfigurasi Environment

Salin file environment example:

```bash
cp .env.example .env
```

Edit file `.env` sesuai konfigurasi Anda:

```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_BACKEND_URL=http://localhost:3000
```

## 🖥️ Menjalankan Aplikasi

### Metode 1: HTTP Server Sederhana (Direkomendasikan)

#### Menggunakan Python:

```bash
# Python 3
python3 -m http.server 3001

# Python 2
python -m SimpleHTTPServer 3001
```

#### Menggunakan Node.js (http-server):

```bash
# Install http-server globally
npm install -g http-server

# Jalankan server
http-server -p 3001
```

#### Menggunakan PHP:

```bash
php -S localhost:3001
```

### Metode 2: Vite Development Server

```bash
npm run dev
```

### Metode 3: Live Server (VS Code Extension)

1. Install extension "Live Server" di VS Code
2. Buka folder frontend di VS Code
3. Klik kanan pada `index.html`
4. Pilih "Open with Live Server"

Aplikasi akan berjalan di `http://localhost:3001`

## 📁 Struktur Project

```
frontend/
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
│   ├── about.html         # Tentang kami
│   └── contact.html       # Kontak
├── index.html             # Homepage
├── package.json           # Dependencies (opsional)
├── vite.config.js         # Vite configuration
└── .env                   # Environment variables
```

## 🎨 Teknologi yang Digunakan

- **HTML5** - Struktur halaman
- **Tailwind CSS** - Framework CSS utility-first
- **JavaScript ES6+** - Interaktivitas dan logic
- **Vite** - Build tool dan development server
- **Axios** - HTTP client untuk API calls
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

## 🔌 Integrasi Backend API

### Konfigurasi API Base URL

Edit file `.env`:

```env
VITE_API_BASE_URL=http://localhost:3000/api
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
2. Buat file JavaScript di folder `assets/js/`
3. Include script di halaman HTML
4. Update navigasi menu

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
npm run build
```

### Deploy ke Web Server

1. **Apache/Nginx**: Upload folder `dist/` ke document root
2. **GitHub Pages**: Push ke repository, enable Pages
3. **Netlify**: Drag & drop folder atau connect repository
4. **Vercel**: Import project dari Git

### Konfigurasi CORS

Pastikan backend dikonfigurasi untuk allow origin frontend:

```env
# Backend .env
CORS_ORIGIN=https://yourdomain.com
```

### Environment Variables Production

```env
VITE_API_BASE_URL=https://api.yourdomain.com/api
VITE_BACKEND_URL=https://api.yourdomain.com
```

## 🛠️ Troubleshooting

### Error: "API Service not found"
- Pastikan file `assets/js/main.js` sudah di-load
- Check network tab untuk error loading script
- Pastikan order loading script sudah benar

### Error: "CORS policy error"
- Check backend CORS configuration
- Pastikan CORS_ORIGIN di backend sesuai dengan frontend URL
- Untuk development, gunakan `http://localhost:3001`

### Error: "Products not loading"
- Check backend server status
- Check API base URL di `.env`
- Check network tab untuk HTTP errors
- Check browser console untuk JavaScript errors

### Error: "Cart not persisting"
- Check localStorage quota
- Check browser privacy settings
- Clear localStorage dan coba ulang

### Styling Issues
- Clear browser cache
- Check Tailwind CDN loading
- Check custom CSS conflicts
- Verify responsive classes

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