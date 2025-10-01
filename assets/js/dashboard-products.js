// Dashboard Products Management JavaScript
document.addEventListener('DOMContentLoaded', function() {
    console.log('Dashboard Products page loaded');
    initDashboardProducts();
});

// Global variables
let allProducts = [];
let currentPage = 1;
let currentFilters = {
    search: '',
    category: '',
    sortBy: 'newest'
};
let productToDelete = null;

// Helper function to get base URL for media
function getBaseURL() {
    const apiUrl = window.API_BASE_URL || "http://localhost:3000/api";
    return apiUrl.replace('/api', '');
}

async function initDashboardProducts() {
    console.log('Initializing dashboard products...');

    try {
        // Wait for dependencies
        await waitForDependencies();

        // Check authentication
        const user = await AuthManager.requireAuth();
        if (!user) return;

        // Initialize event listeners
        initEventListeners();

        // Load products
        await loadProducts();

    } catch (error) {
        console.error('Error initializing dashboard products:', error);
        Utils.showAlert('Gagal memuat halaman produk', 'error');
    }
}

async function waitForDependencies() {
    return new Promise((resolve) => {
        let attempts = 0;
        const maxAttempts = 50;

        function checkDependencies() {
            attempts++;
            if (typeof window.ApiService !== 'undefined' &&
                typeof window.Utils !== 'undefined' &&
                typeof window.AuthManager !== 'undefined') {
                console.log('Dependencies loaded');
                resolve();
            } else if (attempts >= maxAttempts) {
                console.warn('Dependencies timeout');
                resolve();
            } else {
                setTimeout(checkDependencies, 100);
            }
        }
        checkDependencies();
    });
}

async function loadProducts() {
    console.log('Loading products...');

    try {
        // Get all products without pagination limit for dashboard
        const response = await ApiService.getProducts({ limit: 1000 });

        if (response && response.products) {
            allProducts = response.products;
        } else if (response && response.data) {
            allProducts = response.data;
        } else if (Array.isArray(response)) {
            allProducts = response;
        } else {
            allProducts = [];
        }

        console.log(`Loaded ${allProducts.length} products`);
        renderProducts();

    } catch (error) {
        console.error('Error loading products:', error);
        Utils.showAlert('Gagal memuat data produk', 'error');
        renderProducts(); // Render empty state
    }
}

function renderProducts() {
    const tbody = document.getElementById('products-table-body');
    if (!tbody) return;

    // Apply filters
    let filtered = [...allProducts];

    // Search filter
    if (currentFilters.search) {
        const search = currentFilters.search.toLowerCase();
        filtered = filtered.filter(p =>
            p.name.toLowerCase().includes(search) ||
            p.description?.toLowerCase().includes(search)
        );
    }

    // Category filter
    if (currentFilters.category) {
        filtered = filtered.filter(p => p.category === currentFilters.category);
    }

    // Sort
    filtered = sortProducts(filtered, currentFilters.sortBy);

    // Pagination
    const itemsPerPage = 10;
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedProducts = filtered.slice(startIndex, endIndex);

    // Render table rows
    if (paginatedProducts.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-8 text-center text-gray-500">
                    <i class="fas fa-box-open text-4xl mb-2"></i>
                    <p>Tidak ada produk ditemukan</p>
                </td>
            </tr>
        `;
    } else {
        const baseURL = getBaseURL();
        tbody.innerHTML = paginatedProducts.map(product => `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4">
                    <div class="flex items-center">
                        <img src="${product.image_url ? baseURL + product.image_url : 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22%3E%3Crect fill=%22%23ddd%22 width=%22100%22 height=%22100%22/%3E%3Ctext fill=%22%23999%22 font-family=%22sans-serif%22 font-size=%2214%22 dy=%22.3em%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22%3ENo Image%3C/text%3E%3C/svg%3E'}"
                             alt="${product.name}"
                             class="w-12 h-12 rounded-md object-cover mr-3"
                             onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22%3E%3Crect fill=%22%23ddd%22 width=%22100%22 height=%22100%22/%3E%3Ctext fill=%22%23999%22 font-family=%22sans-serif%22 font-size=%2214%22 dy=%22.3em%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22%3ENo Image%3C/text%3E%3C/svg%3E'">
                        <div>
                            <div class="font-medium text-gray-900">${product.name}</div>
                            <div class="text-sm text-gray-500">${product.description?.substring(0, 50) || ''}...</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 text-sm text-gray-900">${product.category || '-'}</td>
                <td class="px-6 py-4 text-sm text-gray-900">${Utils.formatCurrency(product.price)}</td>
                <td class="px-6 py-4">
                    <span class="text-sm ${product.stock < 10 ? 'text-red-600 font-semibold' : 'text-gray-900'}">
                        ${product.stock}
                    </span>
                </td>
                <td class="px-6 py-4 text-sm text-gray-900">${product.discount || 0}%</td>
                <td class="px-6 py-4 text-right text-sm font-medium space-x-2">
                    <button onclick="editProduct(${product.id})"
                            class="text-blue-600 hover:text-blue-900">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteProduct(${product.id}, '${product.name.replace(/'/g, "\\'")}'))"
                            class="text-red-600 hover:text-red-900">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    // Update pagination
    updatePagination(filtered.length, itemsPerPage, totalPages);
}

function sortProducts(products, sortBy) {
    const sorted = [...products];

    switch(sortBy) {
        case 'newest':
            return sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        case 'oldest':
            return sorted.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        case 'price-asc':
            return sorted.sort((a, b) => a.price - b.price);
        case 'price-desc':
            return sorted.sort((a, b) => b.price - a.price);
        case 'name-asc':
            return sorted.sort((a, b) => a.name.localeCompare(b.name));
        case 'name-desc':
            return sorted.sort((a, b) => b.name.localeCompare(a.name));
        default:
            return sorted;
    }
}

function updatePagination(totalItems, itemsPerPage, totalPages) {
    const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    // Update pagination text
    document.getElementById('pagination-start').textContent = startItem;
    document.getElementById('pagination-end').textContent = endItem;
    document.getElementById('pagination-total').textContent = totalItems;

    // Update pagination buttons
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');
    const paginationNumbers = document.getElementById('pagination-numbers');

    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages || totalPages === 0;

    // Generate page numbers
    let numbersHtml = '';
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
            numbersHtml += `
                <button onclick="goToPage(${i})"
                        class="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium ${i === currentPage ? 'text-amber-600 bg-amber-50' : 'text-gray-700 hover:bg-gray-50'}">
                    ${i}
                </button>
            `;
        } else if (i === currentPage - 2 || i === currentPage + 2) {
            numbersHtml += `<span class="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">...</span>`;
        }
    }
    paginationNumbers.innerHTML = numbersHtml;
}

function goToPage(page) {
    currentPage = page;
    renderProducts();
}

function initEventListeners() {
    // Add product button
    const addBtn = document.getElementById('add-product-btn');
    if (addBtn) {
        addBtn.addEventListener('click', () => openProductModal());
    }

    // Search
    const searchInput = document.getElementById('search-products');
    if (searchInput) {
        searchInput.addEventListener('input', Utils.debounce((e) => {
            currentFilters.search = e.target.value;
            currentPage = 1;
            renderProducts();
        }, 500));
    }

    // Category filter
    const categoryFilter = document.getElementById('category-filter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', (e) => {
            currentFilters.category = e.target.value;
            currentPage = 1;
            renderProducts();
        });
    }

    // Sort
    const sortBy = document.getElementById('sort-by');
    if (sortBy) {
        sortBy.addEventListener('change', (e) => {
            currentFilters.sortBy = e.target.value;
            renderProducts();
        });
    }

    // Pagination
    const prevBtn = document.getElementById('prev-page');
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderProducts();
            }
        });
    }

    const nextBtn = document.getElementById('next-page');
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            const totalPages = Math.ceil(allProducts.length / 10);
            if (currentPage < totalPages) {
                currentPage++;
                renderProducts();
            }
        });
    }

    // Modal event listeners
    initModalEventListeners();
}

function initModalEventListeners() {
    // Close modal buttons
    const closeModalBtn = document.getElementById('close-modal');
    const cancelFormBtn = document.getElementById('cancel-form');

    if (closeModalBtn) closeModalBtn.addEventListener('click', closeProductModal);
    if (cancelFormBtn) cancelFormBtn.addEventListener('click', closeProductModal);

    // Product form
    const productForm = document.getElementById('product-form');
    if (productForm) {
        productForm.addEventListener('submit', handleProductSubmit);
    }

    // Image file selection
    const imageInput = document.getElementById('product-image');
    if (imageInput) {
        imageInput.addEventListener('change', handleImageSelect);
    }

    // Upload image button
    const uploadBtn = document.getElementById('upload-image-btn');
    if (uploadBtn) {
        uploadBtn.addEventListener('click', handleImageUpload);
    }

    // Format price input with thousand separator
    const priceInput = document.getElementById('product-price');
    if (priceInput) {
        priceInput.addEventListener('input', function(e) {
            formatPriceInput(e);
            calculateDiscountedPrice();
        });
        priceInput.addEventListener('blur', function(e) {
            formatPriceInput(e);
            calculateDiscountedPrice();
        });
    }

    // Calculate discounted price when discount changes
    const discountInput = document.getElementById('product-discount');
    if (discountInput) {
        discountInput.addEventListener('input', calculateDiscountedPrice);
    }

    // Delete modal
    const closeDeleteBtn = document.getElementById('close-delete-modal');
    const cancelDeleteBtn = document.getElementById('cancel-delete');
    const confirmDeleteBtn = document.getElementById('confirm-delete');

    if (closeDeleteBtn) closeDeleteBtn.addEventListener('click', closeDeleteModal);
    if (cancelDeleteBtn) cancelDeleteBtn.addEventListener('click', closeDeleteModal);
    if (confirmDeleteBtn) confirmDeleteBtn.addEventListener('click', confirmDelete);
}

function openProductModal(productId = null) {
    const modal = document.getElementById('product-modal');
    const modalTitle = document.getElementById('modal-title');
    const form = document.getElementById('product-form');

    // Always reset form first to clear previous data
    form.reset();
    document.getElementById('product-id').value = '';
    resetImagePreview();

    if (productId) {
        // Edit mode
        modalTitle.textContent = 'Edit Produk';
        loadProductToForm(productId);
    } else {
        // Add mode
        modalTitle.textContent = 'Tambah Produk Baru';
    }

    modal.classList.remove('hidden');
}

function closeProductModal() {
    const modal = document.getElementById('product-modal');
    const form = document.getElementById('product-form');

    // Reset form when closing
    form.reset();
    document.getElementById('product-id').value = '';
    resetImagePreview();

    modal.classList.add('hidden');
}

function loadProductToForm(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;

    document.getElementById('product-id').value = product.id;
    document.getElementById('product-name').value = product.name;
    document.getElementById('product-category').value = product.category;
    document.getElementById('product-description').value = product.description;
    // Format price with thousand separator
    document.getElementById('product-price').value = formatNumber(product.price);
    document.getElementById('product-stock').value = product.stock;
    document.getElementById('product-discount').value = product.discount || 0;

    // Show current image and set image_url
    if (product.image_url) {
        document.getElementById('product-image-url').value = product.image_url;
        const preview = document.getElementById('image-preview');
        const uploadStatus = document.getElementById('upload-status');
        const baseURL = getBaseURL();
        const imageUrl = product.image_url.startsWith('http') ? product.image_url : baseURL + product.image_url;
        preview.innerHTML = `<img src="${imageUrl}" class="w-full h-full object-cover rounded-md" onerror="this.parentElement.innerHTML='<i class=\\"fas fa-image text-gray-400 text-2xl\\"></i>'">`;
        uploadStatus.classList.remove('hidden');
    }
}

async function handleProductSubmit(e) {
    e.preventDefault();

    const productId = document.getElementById('product-id').value;
    const imageUrl = document.getElementById('product-image-url').value;

    // Validasi: gambar harus sudah diupload (kecuali edit dan tidak ganti gambar)
    if (!imageUrl && !productId) {
        Utils.showAlert('Upload gambar terlebih dahulu', 'warning');
        return;
    }

    // Parse price (remove dots and convert to number)
    const priceValue = document.getElementById('product-price').value.replace(/\./g, '');

    const productData = {
        name: document.getElementById('product-name').value,
        category: document.getElementById('product-category').value,
        description: document.getElementById('product-description').value,
        price: parseFloat(priceValue) || 0,
        stock: parseInt(document.getElementById('product-stock').value) || 0,
        discount: parseInt(document.getElementById('product-discount').value) || 0,
        image_url: imageUrl
    };

    // Show loading
    const submitBtn = document.querySelector('#product-form button[type="submit"]');
    const submitText = document.getElementById('submit-text');
    const submitLoading = document.getElementById('submit-loading');
    submitText.classList.add('hidden');
    submitLoading.classList.remove('hidden');
    submitBtn.disabled = true;

    try {
        if (productId) {
            // Update product
            await ApiService.updateProduct(productId, productData);
            Utils.showAlert('Produk berhasil diperbarui', 'success');
        } else {
            // Create product
            await ApiService.createProduct(productData);
            Utils.showAlert('Produk berhasil ditambahkan', 'success');
        }

        // Reload products first to get fresh data
        await loadProducts();

        // Then close modal
        closeProductModal();

    } catch (error) {
        console.error('Error saving product:', error);
        Utils.showAlert(error.message || 'Gagal menyimpan produk', 'error');
    } finally {
        submitText.classList.remove('hidden');
        submitLoading.classList.add('hidden');
        submitBtn.disabled = false;
    }
}

// Handle file selection (show preview, enable upload button)
function handleImageSelect(e) {
    const file = e.target.files[0];
    const uploadBtn = document.getElementById('upload-image-btn');

    if (!file) {
        uploadBtn.disabled = true;
        return;
    }

    try {
        Utils.validateImage(file);

        // Show local preview
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById('image-preview');
            preview.innerHTML = `<img src="${e.target.result}" class="w-full h-full object-cover rounded-md">`;
        };
        reader.readAsDataURL(file);

        // Enable upload button
        uploadBtn.disabled = false;
    } catch (error) {
        Utils.showAlert(error.message, 'error');
        e.target.value = '';
        uploadBtn.disabled = true;
    }
}

// Handle image upload to server
async function handleImageUpload() {
    const fileInput = document.getElementById('product-image');
    const file = fileInput.files[0];

    if (!file) {
        Utils.showAlert('Pilih gambar terlebih dahulu', 'warning');
        return;
    }

    const uploadBtn = document.getElementById('upload-image-btn');
    const uploadText = document.getElementById('upload-text');
    const uploadLoading = document.getElementById('upload-loading');
    const uploadStatus = document.getElementById('upload-status');

    // Show loading
    uploadText.classList.add('hidden');
    uploadLoading.classList.remove('hidden');
    uploadBtn.disabled = true;

    try {
        // Upload image using ApiService
        const response = await ApiService.uploadProductImage(file);

        if (response && response.image_url) {
            // Save image_url to hidden input
            document.getElementById('product-image-url').value = response.image_url;

            // Update preview with server image
            const preview = document.getElementById('image-preview');
            const baseURL = getBaseURL();
            preview.innerHTML = `<img src="${baseURL + response.image_url}" class="w-full h-full object-cover rounded-md">`;

            // Show success status
            uploadStatus.classList.remove('hidden');
            Utils.showAlert('Gambar berhasil diupload', 'success');
        } else {
            throw new Error('Response tidak valid dari server');
        }
    } catch (error) {
        console.error('Upload error:', error);
        Utils.showAlert(error.message || 'Gagal upload gambar', 'error');
        uploadBtn.disabled = false;
    } finally {
        uploadText.classList.remove('hidden');
        uploadLoading.classList.add('hidden');
    }
}

// Calculate and display discounted price
function calculateDiscountedPrice() {
    const priceInput = document.getElementById('product-price');
    const discountInput = document.getElementById('product-discount');
    const container = document.getElementById('discounted-price-container');
    const normalPriceDisplay = document.getElementById('display-normal-price');
    const discountedPriceDisplay = document.getElementById('display-discounted-price');
    const discountPercentDisplay = document.getElementById('display-discount-percent');
    const savingsDisplay = document.getElementById('display-savings');

    // Get values
    const priceStr = priceInput.value.replace(/\./g, '');
    const price = parseFloat(priceStr) || 0;
    const discount = parseFloat(discountInput.value) || 0;

    // If no price or no discount, hide container
    if (price === 0 || discount === 0) {
        container.classList.add('hidden');
        return;
    }

    // Calculate discounted price
    const discountAmount = price * (discount / 100);
    const finalPrice = price - discountAmount;

    // Format and display
    normalPriceDisplay.textContent = 'Rp ' + formatNumber(price);
    discountedPriceDisplay.textContent = 'Rp ' + formatNumber(Math.round(finalPrice));
    discountPercentDisplay.textContent = discount + '%';
    savingsDisplay.textContent = 'Rp ' + formatNumber(Math.round(discountAmount));

    // Show container
    container.classList.remove('hidden');
}

function resetImagePreview() {
    const preview = document.getElementById('image-preview');
    const uploadBtn = document.getElementById('upload-image-btn');
    const uploadStatus = document.getElementById('upload-status');
    const fileInput = document.getElementById('product-image');
    const imageUrlInput = document.getElementById('product-image-url');
    const discountContainer = document.getElementById('discounted-price-container');

    preview.innerHTML = '<i class="fas fa-image text-gray-400 text-2xl"></i>';
    uploadBtn.disabled = true;
    uploadStatus.classList.add('hidden');
    if (fileInput) fileInput.value = '';
    if (imageUrlInput) imageUrlInput.value = '';
    if (discountContainer) discountContainer.classList.add('hidden');
}

function deleteProduct(productId, productName) {
    productToDelete = productId;
    document.getElementById('delete-product-name').textContent = productName;
    document.getElementById('delete-modal').classList.remove('hidden');
}

function closeDeleteModal() {
    productToDelete = null;
    document.getElementById('delete-modal').classList.add('hidden');
}

async function confirmDelete() {
    if (!productToDelete) return;

    const deleteText = document.getElementById('delete-text');
    const deleteLoading = document.getElementById('delete-loading');
    const confirmBtn = document.getElementById('confirm-delete');

    deleteText.classList.add('hidden');
    deleteLoading.classList.remove('hidden');
    confirmBtn.disabled = true;

    try {
        await ApiService.deleteProduct(productToDelete);
        Utils.showAlert('Produk berhasil dihapus', 'success');
        closeDeleteModal();
        await loadProducts();
    } catch (error) {
        console.error('Error deleting product:', error);
        Utils.showAlert(error.message || 'Gagal menghapus produk', 'error');
    } finally {
        deleteText.classList.remove('hidden');
        deleteLoading.classList.add('hidden');
        confirmBtn.disabled = false;
    }
}

// Format number with thousand separator
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// Parse formatted number back to integer
function parseFormattedNumber(str) {
    return parseInt(str.replace(/\./g, '')) || 0;
}

// Format price input on the fly
function formatPriceInput(e) {
    let value = e.target.value;
    // Remove all non-digit characters
    value = value.replace(/\D/g, '');

    if (value === '') {
        e.target.value = '';
        return;
    }

    // Format with thousand separator
    e.target.value = formatNumber(value);
}

// Make functions globally accessible
window.editProduct = openProductModal;
window.deleteProduct = deleteProduct;
window.goToPage = goToPage;
