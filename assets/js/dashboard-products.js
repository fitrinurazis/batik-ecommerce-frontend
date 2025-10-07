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
let uploadedImages = []; // Store uploaded image URLs (max 5)

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

    // Add image button
    const addImageBtn = document.getElementById('add-image-btn');
    if (addImageBtn) {
        addImageBtn.addEventListener('click', () => {
            const fileInput = document.getElementById('product-images');
            fileInput.click();
        });
    }

    // File input change
    const imagesInput = document.getElementById('product-images');
    if (imagesInput) {
        imagesInput.addEventListener('change', handleImageAdd);
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
    // Format price with thousand separator (parse as integer first to remove decimals)
    const priceValue = parseInt(product.price) || 0;
    document.getElementById('product-price').value = formatNumber(priceValue);
    document.getElementById('product-stock').value = product.stock;
    document.getElementById('product-discount').value = product.discount || 0;

    // Load existing images into uploadedImages array
    uploadedImages = [];
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
        uploadedImages = [...product.images];
    } else if (product.image_url) {
        uploadedImages = [product.image_url];
    }

    // Update UI
    updateHiddenInputs();
    updateImagePreview();
    updateImageCounter();
    updateAddButtonState();

    // Trigger discount calculation
    calculateDiscountedPrice();
}

async function handleProductSubmit(e) {
    e.preventDefault();

    const productId = document.getElementById('product-id').value;

    // Validasi: gambar harus sudah diupload (kecuali edit dan tidak ganti gambar)
    if (uploadedImages.length === 0 && !productId) {
        Utils.showAlert('Upload minimal 1 gambar terlebih dahulu', 'warning');
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
        image_url: uploadedImages.length > 0 ? uploadedImages[0] : '',
        images: uploadedImages
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

// Handle add single image
async function handleImageAdd(e) {
    const file = e.target.files[0];
    const maxFiles = 5;

    // Clear file input for next upload
    e.target.value = '';

    if (!file) {
        return;
    }

    // Check if already at max
    if (uploadedImages.length >= maxFiles) {
        Utils.showAlert(`Maksimal ${maxFiles} gambar`, 'warning');
        return;
    }

    try {
        // Validate image
        Utils.validateImage(file);

        // Show upload progress
        const uploadProgress = document.getElementById('upload-progress');
        const uploadProgressBar = document.getElementById('upload-progress-bar');
        const uploadProgressText = document.getElementById('upload-progress-text');
        const uploadError = document.getElementById('upload-error-status');

        uploadProgress.classList.remove('hidden');
        uploadProgressBar.style.width = '0%';
        uploadProgressText.textContent = `Uploading ${file.name}...`;
        uploadError.classList.add('hidden');

        // Simulate progress
        let progress = 0;
        const progressInterval = setInterval(() => {
            if (progress < 90) {
                progress += 15;
                uploadProgressBar.style.width = progress + '%';
            }
        }, 100);

        // Upload to server
        const response = await ApiService.uploadProductImage(file);

        clearInterval(progressInterval);
        uploadProgressBar.style.width = '100%';

        // Extract URL from response
        let imageUrl = null;
        if (response.image_url) {
            imageUrl = response.image_url;
        } else if (response.imageUrl) {
            imageUrl = response.imageUrl;
        }

        if (imageUrl) {
            // Add to uploaded images array
            uploadedImages.push(imageUrl);

            // Update hidden inputs
            updateHiddenInputs();

            // Update preview
            updateImagePreview();

            // Update counter
            updateImageCounter();

            // Hide progress
            setTimeout(() => {
                uploadProgress.classList.add('hidden');
                uploadProgressBar.style.width = '0%';
            }, 500);

            Utils.showAlert('Gambar berhasil ditambahkan', 'success');

            // Hide add button if reached max
            updateAddButtonState();
        } else {
            throw new Error('URL tidak ditemukan dalam response');
        }

    } catch (error) {
        console.error('Upload error:', error);
        const uploadError = document.getElementById('upload-error-status');
        const uploadErrorText = document.getElementById('upload-error-text');
        uploadError.classList.remove('hidden');
        uploadErrorText.textContent = error.message || 'Gagal upload gambar';
        Utils.showAlert(error.message || 'Gagal upload gambar', 'error');

        // Hide progress
        const uploadProgress = document.getElementById('upload-progress');
        uploadProgress.classList.add('hidden');
    }
}

// Update image preview grid
function updateImagePreview() {
    const grid = document.getElementById('images-preview-grid');
    const baseURL = getBaseURL();

    if (uploadedImages.length === 0) {
        grid.innerHTML = '';
        return;
    }

    grid.innerHTML = uploadedImages.map((url, index) => `
        <div class="relative group">
            <div class="border-2 border-solid border-gray-300 rounded-md aspect-square overflow-hidden bg-white">
                <img src="${baseURL + url}"
                     class="w-full h-full object-cover"
                     alt="Image ${index + 1}">
            </div>
            ${index === 0 ? `
                <div class="absolute top-1 left-1 bg-amber-600 text-white text-xs px-2 py-1 rounded-md font-medium">
                    <i class="fas fa-star mr-1"></i>Utama
                </div>
            ` : ''}
            <button type="button"
                    onclick="removeUploadedImage(${index})"
                    class="absolute top-1 right-1 bg-red-600 text-white w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700 flex items-center justify-center">
                <i class="fas fa-times text-xs"></i>
            </button>
        </div>
    `).join('');
}

// Update hidden inputs with current uploaded images
function updateHiddenInputs() {
    document.getElementById('product-images-urls').value = JSON.stringify(uploadedImages);
    document.getElementById('product-image-url').value = uploadedImages.length > 0 ? uploadedImages[0] : '';
}

// Update image counter
function updateImageCounter() {
    const counter = document.getElementById('image-counter');
    if (counter) {
        counter.textContent = `(${uploadedImages.length}/5 gambar)`;
    }
}

// Update add button state (disable if max reached)
function updateAddButtonState() {
    const addZone = document.getElementById('add-image-zone');
    const addBtn = document.getElementById('add-image-btn');

    if (uploadedImages.length >= 5) {
        addZone.classList.add('opacity-50', 'pointer-events-none');
        addBtn.disabled = true;
    } else {
        addZone.classList.remove('opacity-50', 'pointer-events-none');
        addBtn.disabled = false;
    }
}

// Remove uploaded image
function removeUploadedImage(index) {
    uploadedImages.splice(index, 1);

    // Update everything
    updateHiddenInputs();
    updateImagePreview();
    updateImageCounter();
    updateAddButtonState();

    Utils.showAlert('Gambar berhasil dihapus', 'info');
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
    // Clear uploaded images array
    uploadedImages = [];

    // Reset all UI elements
    updateImagePreview();
    updateHiddenInputs();
    updateImageCounter();
    updateAddButtonState();

    // Reset status elements
    const uploadError = document.getElementById('upload-error-status');
    const uploadProgress = document.getElementById('upload-progress');
    const fileInput = document.getElementById('product-images');
    const discountContainer = document.getElementById('discounted-price-container');

    if (uploadError) uploadError.classList.add('hidden');
    if (uploadProgress) uploadProgress.classList.add('hidden');
    if (fileInput) fileInput.value = '';
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
window.removeUploadedImage = removeUploadedImage;
