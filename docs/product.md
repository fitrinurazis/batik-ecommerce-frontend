📋 FLOW FRONTEND - Create Product

  ┌─────────────────────────────────────────────────────────┐
  │  1. USER BUKA FORM "TAMBAH PRODUK"                      │
  └─────────────────────────────────────────────────────────┘
                            ↓
  ┌─────────────────────────────────────────────────────────┐
  │  2. USER ISI FORM                                        │
  │     - Nama produk                                        │
  │     - Deskripsi                                          │
  │     - Kategori                                           │
  │     - Harga                                              │
  │     - Stok                                               │
  │     - Diskon                                             │
  │     - Pilih file gambar (belum upload)                   │
  └─────────────────────────────────────────────────────────┘
                            ↓
  ┌─────────────────────────────────────────────────────────┐
  │  3. USER KLIK "UPLOAD GAMBAR" atau "PREVIEW"            │
  │     Frontend: Upload file ke API                        │
  │     POST /api/upload/product-image                      │
  │     FormData: { image: file }                           │
  └─────────────────────────────────────────────────────────┘
                            ↓
  ┌─────────────────────────────────────────────────────────┐
  │  4. BACKEND PROSES UPLOAD                                │
  │     - Validasi file (format, size)                       │
  │     - Resize & optimize gambar                           │
  │     - Generate thumbnail                                 │
  │     - Save ke /uploads/                                  │
  │     - Return: { image_url, thumbnail_url }               │
  └─────────────────────────────────────────────────────────┘
                            ↓
  ┌─────────────────────────────────────────────────────────┐
  │  5. FRONTEND TERIMA RESPONSE                             │
  │     - Tampilkan preview gambar                           │
  │     - Simpan image_url di state/form                     │
  │     - Tombol "Simpan Produk" aktif                       │
  └─────────────────────────────────────────────────────────┘
                            ↓
  ┌─────────────────────────────────────────────────────────┐
  │  6. USER KLIK "SIMPAN PRODUK"                            │
  │     Frontend: POST /api/products                         │
  │     Body JSON: {                                         │
  │       name, description, category,                       │
  │       price, stock, discount,                            │
  │       image_url: "/api/media/xxx.jpg"  ← dari step 4    │
  │     }                                                    │
  └─────────────────────────────────────────────────────────┘
                            ↓
  ┌─────────────────────────────────────────────────────────┐
  │  7. PRODUK BERHASIL DIBUAT                               │
  │     - Redirect ke list produk                            │
  │     - Atau tampilkan success message                     │
  └─────────────────────────────────────────────────────────┘

  ---
  💻 CONTOH IMPLEMENTASI REACT/NEXT.JS

  import { useState } from 'react';
  import axios from 'axios';

  function CreateProductForm() {
    const [formData, setFormData] = useState({
      name: '',
      description: '',
      category: '',
      price: '',
      stock: '',
      discount: 0,
      image_url: '', // ← Akan diisi setelah upload
      is_active: true
    });

    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Handler untuk pilih file
    const handleFileSelect = (e) => {
      const file = e.target.files[0];
      if (file) {
        setSelectedFile(file);
        // Preview lokal (optional)
        const localPreview = URL.createObjectURL(file);
        setPreviewUrl(localPreview);
      }
    };

    // STEP 1: Upload gambar dulu
    const handleUploadImage = async () => {
      if (!selectedFile) {
        alert('Pilih gambar terlebih dahulu');
        return;
      }

      setUploading(true);
      try {
        const formData = new FormData();
        formData.append('image', selectedFile);

        const response = await axios.post(
          '/api/upload/product-image',
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
              'Authorization': `Bearer
  ${localStorage.getItem('token')}`
            }
          }
        );

        // Simpan image_url dari response
        setFormData(prev => ({
          ...prev,
          image_url: response.data.image_url
        }));

        // Update preview dengan gambar dari server
        setPreviewUrl(response.data.image_url);

        alert('Gambar berhasil diupload!');
      } catch (error) {
        console.error('Upload error:', error);
        alert('Gagal upload gambar');
      } finally {
        setUploading(false);
      }
    };

    // STEP 2: Submit form create product
    const handleSubmit = async (e) => {
      e.preventDefault();

      // Validasi: gambar harus sudah diupload
      if (!formData.image_url) {
        alert('Upload gambar terlebih dahulu');
        return;
      }

      setSubmitting(true);
      try {
        const response = await axios.post(
          '/api/products',
          formData,
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer
  ${localStorage.getItem('token')}`
            }
          }
        );

        alert('Produk berhasil dibuat!');
        // Redirect atau reset form
        window.location.href = '/admin/products';
      } catch (error) {
        console.error('Submit error:', error);
        alert('Gagal membuat produk');
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <form onSubmit={handleSubmit}>
        {/* Input Nama */}
        <div>
          <label>Nama Produk:</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name:
  e.target.value})}
            required
          />
        </div>

        {/* Input lainnya... */}

        {/* Upload Gambar Section */}
        <div>
          <label>Gambar Produk:</label>

          {/* File Input */}
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
          />

          {/* Button Upload */}
          <button
            type="button"
            onClick={handleUploadImage}
            disabled={!selectedFile || uploading}
          >
            {uploading ? 'Uploading...' : 'Upload Gambar'}
          </button>

          {/* Preview */}
          {previewUrl && (
            <div>
              <img src={previewUrl} alt="Preview" style={{maxWidth:    
   '200px'}} />
              <p>✅ Gambar siap</p>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!formData.image_url || submitting}
        >
          {submitting ? 'Menyimpan...' : 'Simpan Produk'}
        </button>
      </form>
    );
  }

  ---
  🎯 ALTERNATIF FLOW: Auto Upload on File Select

  Jika ingin lebih otomatis (upload langsung saat pilih file):

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await
  axios.post('/api/upload/product-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });

      // Auto update form
      setFormData(prev => ({
        ...prev,
        image_url: response.data.image_url
      }));

      setPreviewUrl(response.data.image_url);
    } catch (error) {
      alert('Upload gagal');
    } finally {
      setUploading(false);
    }
  };

  ---
  ✅ FLOW UNTUK EDIT PRODUCT

  1. Load data produk (GET /api/products/:id)
  2. Populate form dengan data existing
  3. Tampilkan gambar existing sebagai preview
  4. User bisa:
     a. Keep gambar lama → pakai image_url yang sudah ada
     b. Ganti gambar → upload baru → update image_url
  5. Submit PUT /api/products/:id dengan image_url (lama/baru)

  ---
  Kesimpulan Flow:
  1. Upload image dulu → dapat image_url
  2. Isi form produk dengan image_url tersebut
  3. Submit produk dengan semua data termasuk image_url
