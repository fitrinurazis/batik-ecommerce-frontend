// Products Catalog JavaScript
document.addEventListener('DOMContentLoaded', function() {
    console.log('Products page loaded');

    // Initialize products catalog
    initializeProductsCatalog();
    initEventListeners();
});

// Global variables
let allProducts = [];
let filteredProducts = [];
let currentFilters = {
    search: '',
    category: 'all',
    sort: 'created_at-desc',
    page: 1,
    limit: 12
};
let cart = [];

async function initializeProductsCatalog() {
    console.log('Initializing products catalog...');

    try {
        // Show loading state
        showLoadingState();

        // Wait for dependencies
        await waitForDependencies();

        // Load cart from localStorage
        loadCartFromStorage();

        // Load products
        await loadProducts();

        // Initial render
        applyFilters();

    } catch (error) {
        console.error('Error initializing products catalog:', error);
        showError('Gagal memuat katalog produk');
    } finally {
        hideLoadingState();
    }
}

async function waitForDependencies() {
    return new Promise((resolve) => {
        let attempts = 0;
        const maxAttempts = 50;

        function checkDependencies() {
            attempts++;
            if (typeof window.ApiService !== 'undefined') {
                resolve();
            } else if (attempts >= maxAttempts) {
                resolve();
            } else {
                setTimeout(checkDependencies, 100);
            }
        }
        checkDependencies();
    });
}

function loadCartFromStorage() {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
        updateCartCount();
    }
}

async function loadProducts() {
    console.log('Loading products...');

    try {
        let products = [];

        if (typeof window.ApiService !== 'undefined') {
            const response = await window.ApiService.getProducts();

            if (response && response.data) {
                products = response.data;
            } else if (response && response.products) {
                products = response.products;
            } else if (Array.isArray(response)) {
                products = response;
            }
        }

        // Fallback data if no products from API
        if (products.length === 0) {
            products = getFallbackProducts();
        }

        allProducts = products;
        console.log(`Loaded ${allProducts.length} products`);

    } catch (error) {
        console.error('Error loading products:', error);
        // Use fallback data on error
        allProducts = getFallbackProducts();
        showError('Menggunakan data contoh karena gagal memuat dari server');
    }
}

function getFallbackProducts() {
    return [
        {
            id: 1,
            name: 'Batik Klasik Parang Kusumo',
            category: 'Klasik',
            price: 250000,
            discount: 10,
            image_url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop&crop=center&q=80',
            description: 'Batik klasik dengan motif parang kusumo yang elegan',
            stock: 15,
            is_active: true,
            created_at: '2024-01-15T10:00:00Z'
        },
        {
            id: 2,
            name: 'Batik Pesisir Mega Mendung',
            category: 'Pesisir',
            price: 300000,
            discount: 15,
            image_url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop&crop=center&q=80',
            description: 'Batik pesisir dengan motif mega mendung khas Cirebon',
            stock: 8,
            is_active: true,
            created_at: '2024-01-20T10:00:00Z'
        },
        {
            id: 3,
            name: 'Batik Modern Geometris',
            category: 'Modern',
            price: 180000,
            discount: 0,
            image_url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop&crop=center&q=80',
            description: 'Batik modern dengan pola geometris kontemporer',
            stock: 20,
            is_active: true,
            created_at: '2024-01-25T10:00:00Z'
        }
    ];
}

function applyFilters() {
    console.log('Applying filters:', currentFilters);

    let filtered = [...allProducts];

    // Apply search filter
    if (currentFilters.search) {
        const searchTerm = currentFilters.search.toLowerCase();
        filtered = filtered.filter(product =>
            product.name.toLowerCase().includes(searchTerm) ||
            product.description.toLowerCase().includes(searchTerm)
        );
    }

    // Apply category filter
    if (currentFilters.category !== 'all') {
        filtered = filtered.filter(product => product.category === currentFilters.category);
    }

    // Apply sorting
    filtered = sortProducts(filtered, currentFilters.sort);

    filteredProducts = filtered;

    // Update pagination
    const totalPages = Math.ceil(filteredProducts.length / currentFilters.limit);
    if (currentFilters.page > totalPages) {
        currentFilters.page = 1;
    }

    // Render products
    renderProducts();
    renderPagination();
    updateResultsInfo();
}

function sortProducts(products, sortOption) {
    const [field, order] = sortOption.split('-');

    return products.sort((a, b) => {
        let valueA, valueB;

        switch (field) {
            case 'name':
                valueA = a.name.toLowerCase();
                valueB = b.name.toLowerCase();
                break;
            case 'price':
                valueA = parseFloat(a.price);
                valueB = parseFloat(b.price);
                break;
            case 'created_at':
                valueA = new Date(a.created_at);
                valueB = new Date(b.created_at);
                break;
            default:
                return 0;
        }

        if (order === 'asc') {
            return valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
        } else {
            return valueA > valueB ? -1 : valueA < valueB ? 1 : 0;
        }
    });
}

function renderProducts() {
    const container = document.getElementById('products-container');
    const startIndex = (currentFilters.page - 1) * currentFilters.limit;
    const endIndex = startIndex + currentFilters.limit;
    const productsToShow = filteredProducts.slice(startIndex, endIndex);

    container.innerHTML = '';

    if (productsToShow.length === 0) {
        showEmptyState();
        return;
    }

    hideEmptyState();

    productsToShow.forEach(product => {
        const productCard = createProductCard(product);
        container.appendChild(productCard);
    });

    // Add fade-in animation
    container.classList.add('fade-in');
    setTimeout(() => container.classList.remove('fade-in'), 500);
}

function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card bg-white rounded-lg shadow-md hover:shadow-xl overflow-hidden transition-all duration-300 group cursor-pointer';

    // Handle image URL
    let imageUrl = product.image_url || product.imageUrl;
    if (imageUrl && imageUrl.startsWith('/api/media/')) {
        imageUrl = `http://localhost:3000${imageUrl}`;
    }
    const fallbackImage = 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop&crop=center&q=80';
    const finalImageUrl = imageUrl || fallbackImage;

    // Calculate prices
    const price = parseFloat(product.price || 0);
    const discount = parseFloat(product.discount || 0);
    const hasDiscount = discount > 0;
    const discountedPrice = hasDiscount ? price * (1 - discount / 100) : price;

    card.innerHTML = `
        <div class="relative overflow-hidden">
            <img src="${finalImageUrl}" alt="${product.name}"
                 class="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                 onerror="this.src='${fallbackImage}'">

            ${hasDiscount ? `
                <div class="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                    -${Math.round(discount)}%
                </div>
            ` : ''}

            ${product.stock <= 5 && product.stock > 0 ? `
                <div class="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-bold">
                    Stok Terbatas
                </div>
            ` : ''}

            ${product.stock === 0 ? `
                <div class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <span class="text-white font-bold text-lg">STOK HABIS</span>
                </div>
            ` : ''}

            <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300"></div>
        </div>

        <div class="p-4">
            <div class="mb-2">
                <span class="inline-block px-2 py-1 text-xs font-medium bg-amber-100 text-amber-800 rounded-full">
                    ${product.category || 'Batik'}
                </span>
            </div>

            <h3 class="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-amber-600 transition-colors">
                ${product.name}
            </h3>

            <div class="flex items-center justify-between mb-3">
                <div class="flex flex-col">
                    <span class="text-lg font-bold text-amber-600">
                        ${formatCurrency(discountedPrice)}
                    </span>
                    ${hasDiscount ? `
                        <span class="text-sm text-gray-500 line-through">
                            ${formatCurrency(price)}
                        </span>
                    ` : ''}
                </div>
                <div class="text-right">
                    ${product.stock > 0 ? `
                        <span class="text-xs text-green-600">
                            <i class="fas fa-check-circle mr-1"></i>
                            Tersedia
                        </span>
                    ` : `
                        <span class="text-xs text-red-500">
                            <i class="fas fa-times-circle mr-1"></i>
                            Habis
                        </span>
                    `}
                </div>
            </div>

            <div class="flex space-x-2">
                <button onclick="viewProduct(${product.id})"
                        class="flex-1 bg-amber-50 text-amber-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-amber-100 transition-colors border border-amber-200">
                    <i class="fas fa-eye mr-1"></i>
                    Detail
                </button>
                <button onclick="addToCart(${product.id})"
                        class="flex-1 bg-amber-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors ${product.stock === 0 ? 'opacity-50 cursor-not-allowed' : ''}"
                        ${product.stock === 0 ? 'disabled' : ''}>
                    <i class="fas fa-cart-plus mr-1"></i>
                    ${product.stock === 0 ? 'Habis' : 'Keranjang'}
                </button>
            </div>
        </div>
    `;

    // Add click event for product card
    card.addEventListener('click', (e) => {
        if (e.target.tagName !== 'BUTTON' && !e.target.closest('button')) {
            viewProduct(product.id);
        }
    });

    return card;
}

function renderPagination() {
    const container = document.getElementById('pagination-container');
    const totalPages = Math.ceil(filteredProducts.length / currentFilters.limit);
    const currentPage = currentFilters.page;

    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    let paginationHTML = '';

    // Previous button
    paginationHTML += `
        <button onclick="changePage(${currentPage - 1})"
                class="px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}"
                ${currentPage === 1 ? 'disabled' : ''}>
            <i class="fas fa-chevron-left"></i>
        </button>
    `;

    // Page numbers
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);

    if (startPage > 1) {
        paginationHTML += `
            <button onclick="changePage(1)" class="px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors">1</button>
        `;
        if (startPage > 2) {
            paginationHTML += '<span class="px-2 py-2 text-gray-500">...</span>';
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
            <button onclick="changePage(${i})"
                    class="px-3 py-2 rounded-lg border transition-colors ${i === currentPage ? 'bg-amber-600 text-white border-amber-600' : 'border-gray-300 hover:bg-gray-50'}">
                ${i}
            </button>
        `;
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            paginationHTML += '<span class="px-2 py-2 text-gray-500">...</span>';
        }
        paginationHTML += `
            <button onclick="changePage(${totalPages})" class="px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors">${totalPages}</button>
        `;
    }

    // Next button
    paginationHTML += `
        <button onclick="changePage(${currentPage + 1})"
                class="px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}"
                ${currentPage === totalPages ? 'disabled' : ''}>
            <i class="fas fa-chevron-right"></i>
        </button>
    `;

    container.innerHTML = paginationHTML;
}

function changePage(page) {
    const totalPages = Math.ceil(filteredProducts.length / currentFilters.limit);
    if (page < 1 || page > totalPages) return;

    currentFilters.page = page;
    renderProducts();
    renderPagination();
    updateResultsInfo();

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateResultsInfo() {
    const startIndex = (currentFilters.page - 1) * currentFilters.limit;
    const endIndex = Math.min(startIndex + currentFilters.limit, filteredProducts.length);

    document.getElementById('showing-count').textContent = `${startIndex + 1}-${endIndex}`;
    document.getElementById('total-count').textContent = filteredProducts.length;
}

function showEmptyState() {
    document.getElementById('empty-state').classList.remove('hidden');
}

function hideEmptyState() {
    document.getElementById('empty-state').classList.add('hidden');
}

function showLoadingState() {
    document.getElementById('loading-state').classList.remove('hidden');
    document.getElementById('products-container').classList.add('hidden');
}

function hideLoadingState() {
    document.getElementById('loading-state').classList.add('hidden');
    document.getElementById('products-container').classList.remove('hidden');
}

function initEventListeners() {
    // Search input
    const searchInput = document.getElementById('search-input');
    let searchTimeout;
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            currentFilters.search = this.value.trim();
            currentFilters.page = 1;
            applyFilters();
        }, 500);
    });

    // Sort select
    document.getElementById('sort-select').addEventListener('change', function() {
        currentFilters.sort = this.value;
        currentFilters.page = 1;
        applyFilters();
    });

    // Per page select
    document.getElementById('per-page-select').addEventListener('change', function() {
        currentFilters.limit = parseInt(this.value);
        currentFilters.page = 1;
        applyFilters();
    });

    // Category filter buttons
    document.querySelectorAll('.filter-button').forEach(button => {
        button.addEventListener('click', function() {
            // Update active state
            document.querySelectorAll('.filter-button').forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            currentFilters.category = this.dataset.category;
            currentFilters.page = 1;
        });
    });

    // Apply filters button
    document.getElementById('apply-filters').addEventListener('click', function() {
        applyFilters();
    });

    // Clear filters button
    document.getElementById('clear-filters').addEventListener('click', function() {
        // Reset all filters
        currentFilters = {
            search: '',
            category: 'all',
            sort: 'created_at-desc',
            page: 1,
            limit: 12
        };

        // Reset form elements
        document.getElementById('search-input').value = '';
        document.getElementById('sort-select').value = 'created_at-desc';
        document.getElementById('per-page-select').value = '12';

        // Reset category buttons
        document.querySelectorAll('.filter-button').forEach(btn => btn.classList.remove('active'));
        document.querySelector('[data-category="all"]').classList.add('active');

        applyFilters();
    });

    // View toggle buttons
    document.getElementById('grid-view').addEventListener('click', function() {
        this.classList.add('bg-amber-100', 'text-amber-600');
        this.classList.remove('text-gray-400', 'hover:bg-gray-100');

        document.getElementById('list-view').classList.remove('bg-amber-100', 'text-amber-600');
        document.getElementById('list-view').classList.add('text-gray-400', 'hover:bg-gray-100');

        // Switch to grid view
        const container = document.getElementById('products-container');
        container.className = 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8';
    });

    document.getElementById('list-view').addEventListener('click', function() {
        this.classList.add('bg-amber-100', 'text-amber-600');
        this.classList.remove('text-gray-400', 'hover:bg-gray-100');

        document.getElementById('grid-view').classList.remove('bg-amber-100', 'text-amber-600');
        document.getElementById('grid-view').classList.add('text-gray-400', 'hover:bg-gray-100');

        // Switch to list view
        const container = document.getElementById('products-container');
        container.className = 'grid grid-cols-1 gap-6 mb-8';
    });

    // Cart success modal
    document.getElementById('continue-shopping').addEventListener('click', function() {
        hideCartSuccessModal();
    });

    document.getElementById('view-cart').addEventListener('click', function() {
        window.location.href = 'cart.html';
    });
}

// Global functions
function viewProduct(productId) {
    window.location.href = `product-detail.html?id=${productId}`;
}

function addToCart(productId) {
    console.log('Adding product to cart:', productId);

    const product = allProducts.find(p => p.id == productId);
    if (!product) {
        showError('Produk tidak ditemukan');
        return;
    }

    if (product.stock === 0) {
        showError('Produk sedang tidak tersedia');
        return;
    }

    // Check if product already in cart
    const existingIndex = cart.findIndex(item => (item.id || item.productId) == productId);

    if (existingIndex !== -1) {
        // Update quantity
        cart[existingIndex].quantity += 1;
    } else {
        // Add new item
        cart.push({
            id: productId,
            quantity: 1,
            name: product.name,
            price: product.price,
            image_url: product.image_url,
            addedAt: new Date().toISOString()
        });
    }

    // Save to localStorage
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();

    // Show success modal
    showCartSuccessModal();
}

function showCartSuccessModal() {
    const modal = document.getElementById('cart-success-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function hideCartSuccessModal() {
    const modal = document.getElementById('cart-success-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

function updateCartCount() {
    const totalItems = cart.reduce((sum, item) => sum + parseInt(item.quantity || 1), 0);
    const cartCountEl = document.getElementById('cart-count');
    if (cartCountEl) {
        cartCountEl.textContent = totalItems;
    }
}

// Utility functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

function showSuccess(message) {
    if (typeof Toastify !== 'undefined') {
        Toastify({
            text: message,
            backgroundColor: '#10B981',
            duration: 3000,
            close: true
        }).showToast();
    }
}

function showError(message) {
    if (typeof Toastify !== 'undefined') {
        Toastify({
            text: message,
            backgroundColor: '#EF4444',
            duration: 4000,
            close: true
        }).showToast();
    }
}

// Initialize cart count on page load
document.addEventListener('DOMContentLoaded', function() {
    loadCartFromStorage();
});