// Products Management JavaScript
document.addEventListener('DOMContentLoaded', function() {
    console.log('Products page loaded');

    // Initialize products page
    initializeProductsPage();
});

// Global variables
let allProducts = [];
let filteredProducts = [];
let currentFilters = {
    search: '',
    category: '',
    sort: 'newest',
    page: 1,
    limit: 10
};

async function initializeProductsPage() {
    console.log('Initializing products page...');

    try {
        // Show loading state
        showLoadingState();

        // Wait for dependencies
        await waitForDependencies();

        // Load products
        await loadProducts();

        // Initialize event listeners
        initEventListeners();

        // Initial render
        applyFilters();

    } catch (error) {
        console.error('Error initializing products page:', error);
        showError('Gagal memuat halaman produk');
    } finally {
        hideLoadingState();
    }
}

async function waitForDependencies() {
    return new Promise((resolve) => {
        const checkDependencies = () => {
            if (typeof ApiService !== 'undefined' && typeof Utils !== 'undefined') {
                resolve();
            } else {
                setTimeout(checkDependencies, 100);
            }
        };
        checkDependencies();
    });
}

async function loadProducts() {
    try {
        console.log('Loading products...');
        const response = await ApiService.getProducts();
        allProducts = response.products || response || [];
        console.log('Loaded products:', allProducts.length);
    } catch (error) {
        console.error('Error loading products:', error);
        allProducts = [];
        showError('Gagal memuat data produk');
    }
}

function applyFilters() {
    console.log('Applying filters:', currentFilters);

    // Start with all products
    filteredProducts = [...allProducts];

    // Apply search filter
    if (currentFilters.search) {
        const searchTerm = currentFilters.search.toLowerCase();
        filteredProducts = filteredProducts.filter(product =>
            (product.name || '').toLowerCase().includes(searchTerm) ||
            (product.description || '').toLowerCase().includes(searchTerm)
        );
    }

    // Apply category filter
    if (currentFilters.category && currentFilters.category !== '') {
        filteredProducts = filteredProducts.filter(product =>
            product.category === currentFilters.category
        );
    }

    // Apply sorting
    sortProducts();

    // Render products
    renderProducts();

    // Update pagination
    updatePagination();
}

function sortProducts() {
    filteredProducts.sort((a, b) => {
        switch (currentFilters.sort) {
            case 'newest':
                return new Date(b.created_at || 0) - new Date(a.created_at || 0);
            case 'oldest':
                return new Date(a.created_at || 0) - new Date(b.created_at || 0);
            case 'price-asc':
                return (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0);
            case 'price-desc':
                return (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0);
            case 'name-asc':
                return (a.name || '').localeCompare(b.name || '');
            case 'name-desc':
                return (b.name || '').localeCompare(a.name || '');
            default:
                return 0;
        }
    });
}

function renderProducts() {
    const tableBody = document.getElementById('products-table-body');
    if (!tableBody) {
        console.error('products-table-body element not found');
        return;
    }

    const startIndex = (currentFilters.page - 1) * currentFilters.limit;
    const endIndex = startIndex + currentFilters.limit;
    const productsToShow = filteredProducts.slice(startIndex, endIndex);

    if (productsToShow.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-4 text-center text-gray-500">
                    <div class="flex flex-col items-center justify-center py-8">
                        <i class="fas fa-box-open text-4xl mb-4 text-gray-300"></i>
                        <p class="text-lg font-medium">Tidak ada produk ditemukan</p>
                        <p class="text-sm">Coba ubah filter atau kata kunci pencarian</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    // Generate table rows
    const rows = productsToShow.map(product => createProductRow(product)).join('');
    tableBody.innerHTML = rows;

    // Update pagination info
    updatePaginationInfo(startIndex, endIndex);
}

function createProductRow(product) {
    // Handle image URL
    let imageUrl = product.image_url || product.imageUrl;
    if (imageUrl && imageUrl.startsWith('/api/media/')) {
        imageUrl = `http://localhost:3000${imageUrl}`;
    }
    const fallbackImage = 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=100&h=100&fit=crop&crop=center&q=80';
    const finalImageUrl = imageUrl || fallbackImage;

    // Calculate prices
    const price = parseFloat(product.price || 0);
    const discount = parseFloat(product.discount || 0);
    const hasDiscount = discount > 0;
    const discountedPrice = hasDiscount ? price * (1 - discount / 100) : price;

    return `
        <tr class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                    <div class="flex-shrink-0 h-16 w-16">
                        <img class="h-16 w-16 rounded-lg object-cover" src="${finalImageUrl}" alt="${product.name || 'Product'}" onerror="this.src='${fallbackImage}'">
                    </div>
                    <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900">${product.name || 'Unnamed Product'}</div>
                        <div class="text-sm text-gray-500">${(product.description || '').substring(0, 50)}${(product.description || '').length > 50 ? '...' : ''}</div>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800">
                    ${product.category || 'Uncategorized'}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ${hasDiscount ? `
                    <div class="flex flex-col">
                        <span class="font-medium">Rp ${Math.round(discountedPrice).toLocaleString('id-ID')}</span>
                        <span class="text-xs text-gray-500 line-through">Rp ${Math.round(price).toLocaleString('id-ID')}</span>
                    </div>
                ` : `
                    <span class="font-medium">Rp ${Math.round(price).toLocaleString('id-ID')}</span>
                `}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <span class="font-medium ${product.stock <= 5 ? 'text-red-600' : 'text-gray-900'}">${product.stock || 0}</span>
                ${product.stock <= 5 && product.stock > 0 ? '<div class="text-xs text-red-500">Stok rendah</div>' : ''}
                ${product.stock === 0 ? '<div class="text-xs text-red-500">Habis</div>' : ''}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ${hasDiscount ? `
                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                        ${Math.round(discount)}%
                    </span>
                ` : '<span class="text-gray-400">-</span>'}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button onclick="editProduct('${product.id}')" class="text-amber-600 hover:text-amber-900 mr-3" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteProduct('${product.id}', '${product.name}')" class="text-red-600 hover:text-red-900" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `;
}

function updatePaginationInfo(startIndex, endIndex) {
    // Update pagination text
    const paginationStart = document.getElementById('pagination-start');
    const paginationEnd = document.getElementById('pagination-end');
    const paginationTotal = document.getElementById('pagination-total');

    if (paginationStart) paginationStart.textContent = startIndex + 1;
    if (paginationEnd) paginationEnd.textContent = endIndex;
    if (paginationTotal) paginationTotal.textContent = filteredProducts.length;
}

function updatePagination() {
    const totalPages = Math.ceil(filteredProducts.length / currentFilters.limit);

    // Update prev/next buttons
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');

    if (prevBtn) {
        prevBtn.disabled = currentFilters.page <= 1;
        prevBtn.classList.toggle('opacity-50', currentFilters.page <= 1);
    }

    if (nextBtn) {
        nextBtn.disabled = currentFilters.page >= totalPages;
        nextBtn.classList.toggle('opacity-50', currentFilters.page >= totalPages);
    }
}

function showLoadingState() {
    const tableBody = document.getElementById('products-table-body');
    if (tableBody) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-4 text-center text-gray-500">
                    <div class="flex flex-col items-center justify-center py-4">
                        <i class="fas fa-spinner fa-spin text-amber-600 text-2xl mb-2"></i>
                        <p>Memuat data produk...</p>
                    </div>
                </td>
            </tr>
        `;
    }
}

function hideLoadingState() {
    // Loading state will be hidden when products are rendered
}

function showError(message) {
    const tableBody = document.getElementById('products-table-body');
    if (tableBody) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-4 text-center text-gray-500">
                    <div class="flex flex-col items-center justify-center py-4">
                        <i class="fas fa-exclamation-triangle text-red-500 text-2xl mb-2"></i>
                        <p class="text-red-600">${message}</p>
                    </div>
                </td>
            </tr>
        `;
    }
}

function initEventListeners() {
    // Search input
    const searchInput = document.getElementById('search-products');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                currentFilters.search = this.value.trim();
                currentFilters.page = 1;
                applyFilters();
            }, 500);
        });
    }

    // Sort select
    const sortSelect = document.getElementById('sort-by');
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            currentFilters.sort = this.value;
            currentFilters.page = 1;
            applyFilters();
        });
    }

    // Category filter
    const categoryFilter = document.getElementById('category-filter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', function() {
            currentFilters.category = this.value;
            currentFilters.page = 1;
            applyFilters();
        });
    }

    // Pagination buttons
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');

    if (prevBtn) {
        prevBtn.addEventListener('click', function() {
            if (currentFilters.page > 1) {
                currentFilters.page--;
                applyFilters();
            }
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', function() {
            const totalPages = Math.ceil(filteredProducts.length / currentFilters.limit);
            if (currentFilters.page < totalPages) {
                currentFilters.page++;
                applyFilters();
            }
        });
    }

    // Add product button
    const addProductBtn = document.getElementById('add-product-btn');
    if (addProductBtn) {
        addProductBtn.addEventListener('click', function() {
            openProductModal();
        });
    }

    // Modal event listeners
    initModalEventListeners();
}

function initModalEventListeners() {
    // Close modal buttons
    const closeModalBtn = document.getElementById('close-modal');
    const cancelFormBtn = document.getElementById('cancel-form');
    const modal = document.getElementById('product-modal');

    if (closeModalBtn && modal) {
        closeModalBtn.addEventListener('click', function() {
            closeProductModal();
        });
    }

    if (cancelFormBtn && modal) {
        cancelFormBtn.addEventListener('click', function() {
            closeProductModal();
        });
    }

    // Close modal when clicking outside
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeProductModal();
            }
        });
    }

    // Form submission
    const form = document.getElementById('product-form');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            handleProductSubmit();
        });
    }

    // Image preview
    const imageInput = document.getElementById('product-image');
    if (imageInput) {
        imageInput.addEventListener('change', function(e) {
            handleImagePreview(e);
        });
    }
}

function closeProductModal() {
    const modal = document.getElementById('product-modal');
    if (modal) {
        modal.classList.add('hidden');
    }

    // Reset form
    const form = document.getElementById('product-form');
    if (form) {
        form.reset();
    }

    // Reset image preview
    resetImagePreview();
}

function handleImagePreview(event) {
    const file = event.target.files[0];
    const preview = document.getElementById('image-preview');

    if (!file || !preview) return;

    try {
        // Validate image
        Utils.validateImage(file);

        // Create preview
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.innerHTML = `
                <img src="${e.target.result}" alt="Preview" class="w-full h-full object-cover rounded-md">
            `;
        };
        reader.readAsDataURL(file);
    } catch (error) {
        Utils.showAlert(error.message, 'error');
        event.target.value = '';
        resetImagePreview();
    }
}

function resetImagePreview() {
    const preview = document.getElementById('image-preview');
    if (preview) {
        preview.innerHTML = `
            <i class="fas fa-image text-gray-400 text-2xl"></i>
        `;
    }
}

async function handleProductSubmit() {
    try {
        // Show loading state
        setSubmitLoading(true);

        // Get form data
        const formData = getFormData();

        // Validate form
        validateProductForm(formData);

        // Check if editing or creating
        const productId = document.getElementById('product-id').value;

        let response;
        if (productId) {
            // Edit existing product
            response = await ApiService.updateProduct(productId, formData);
            Utils.showAlert('Produk berhasil diperbarui!', 'success');
        } else {
            // Create new product
            response = await ApiService.createProduct(formData);
            Utils.showAlert('Produk berhasil ditambahkan!', 'success');
        }

        // Close modal
        closeProductModal();

        // Reload products
        await loadProducts();
        applyFilters();

    } catch (error) {
        console.error('Error submitting product:', error);
        Utils.showAlert(error.message || 'Gagal menyimpan produk', 'error');
    } finally {
        setSubmitLoading(false);
    }
}

function getFormData() {
    const form = document.getElementById('product-form');
    const formData = new FormData(form);

    return {
        name: formData.get('name'),
        category: formData.get('category'),
        description: formData.get('description'),
        price: parseFloat(formData.get('price')) || 0,
        stock: parseInt(formData.get('stock')) || 0,
        discount: parseFloat(formData.get('discount')) || 0,
        image: formData.get('image')
    };
}

function validateProductForm(data) {
    if (!data.name || data.name.trim().length < 3) {
        throw new Error('Nama produk harus diisi minimal 3 karakter');
    }

    if (!data.category) {
        throw new Error('Kategori produk harus dipilih');
    }

    if (!data.description || data.description.trim().length < 10) {
        throw new Error('Deskripsi produk harus diisi minimal 10 karakter');
    }

    if (data.price <= 0) {
        throw new Error('Harga produk harus lebih dari 0');
    }

    if (data.stock < 0) {
        throw new Error('Stok produk tidak boleh negatif');
    }

    if (data.discount < 0 || data.discount > 100) {
        throw new Error('Diskon harus antara 0-100%');
    }
}

function setSubmitLoading(isLoading) {
    const submitText = document.getElementById('submit-text');
    const submitLoading = document.getElementById('submit-loading');
    const submitBtn = document.querySelector('#product-form button[type="submit"]');

    if (submitText && submitLoading && submitBtn) {
        if (isLoading) {
            submitText.classList.add('hidden');
            submitLoading.classList.remove('hidden');
            submitBtn.disabled = true;
        } else {
            submitText.classList.remove('hidden');
            submitLoading.classList.add('hidden');
            submitBtn.disabled = false;
        }
    }
}

async function loadProductData(productId) {
    try {
        const product = await ApiService.getProduct(productId);

        // Fill form with product data
        document.getElementById('product-id').value = product.id;
        document.getElementById('product-name').value = product.name || '';
        document.getElementById('product-category').value = product.category || '';
        document.getElementById('product-description').value = product.description || '';
        document.getElementById('product-price').value = product.price || '';
        document.getElementById('product-stock').value = product.stock || '';
        document.getElementById('product-discount').value = product.discount || '';

        // Show image preview if available
        if (product.image_url || product.imageUrl) {
            const imageUrl = product.image_url || product.imageUrl;
            const fullImageUrl = imageUrl.startsWith('/api/media/')
                ? `http://localhost:3000${imageUrl}`
                : imageUrl;

            const preview = document.getElementById('image-preview');
            if (preview) {
                preview.innerHTML = `
                    <img src="${fullImageUrl}" alt="Product Image" class="w-full h-full object-cover rounded-md">
                `;
            }
        }

    } catch (error) {
        console.error('Error loading product data:', error);
        Utils.showAlert('Gagal memuat data produk', 'error');
        closeProductModal();
    }
}

// Product management functions
function editProduct(productId) {
    console.log('Edit product:', productId);
    openProductModal(productId);
}

function deleteProduct(productId, productName) {
    console.log('Delete product:', productId, productName);
    // TODO: Implement delete functionality
    if (confirm(`Apakah Anda yakin ingin menghapus produk "${productName}"?`)) {
        Utils.showAlert('Fitur hapus produk akan segera tersedia', 'info');
    }
}

function openProductModal(productId = null) {
    console.log('Open product modal:', productId ? 'Edit mode' : 'Add mode');

    const modal = document.getElementById('product-modal');
    const modalTitle = document.getElementById('modal-title');
    const form = document.getElementById('product-form');

    if (!modal || !modalTitle || !form) {
        console.error('Modal elements not found');
        return;
    }

    // Reset form
    form.reset();

    // Set modal title and mode
    if (productId) {
        modalTitle.textContent = 'Edit Produk';
        loadProductData(productId);
    } else {
        modalTitle.textContent = 'Tambah Produk Baru';
        document.getElementById('product-id').value = '';
    }

    // Show modal
    modal.classList.remove('hidden');

    // Focus on first input
    const firstInput = form.querySelector('input[type="text"]');
    if (firstInput) {
        setTimeout(() => firstInput.focus(), 100);
    }
}

// Export functions for global access
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.openProductModal = openProductModal;