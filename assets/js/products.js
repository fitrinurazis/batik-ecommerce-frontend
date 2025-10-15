document.addEventListener('DOMContentLoaded', function() {
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
    try {
        showLoadingState();
        await waitForDependencies();
        loadCartFromStorage();
        await loadProducts();
        loadSearchFromURL();
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

function loadSearchFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('search');

    if (searchQuery) {
        currentFilters.search = searchQuery;

        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.value = searchQuery;
        }

        const searchIndicator = document.getElementById('search-indicator');
        const searchQueryDisplay = document.getElementById('search-query');

        if (searchIndicator && searchQueryDisplay) {
            searchQueryDisplay.textContent = searchQuery;
            searchIndicator.classList.remove('hidden');
        }

        const clearSearch = document.getElementById('clear-search');
        if (clearSearch) {
            clearSearch.addEventListener('click', function() {
                currentFilters.search = '';
                const url = new URL(window.location);
                url.searchParams.delete('search');
                window.history.pushState({}, '', url);

                if (searchInput) searchInput.value = '';
                if (searchIndicator) searchIndicator.classList.add('hidden');

                applyFilters();
            });
        }
    }
}

async function loadProducts() {
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

        if (products.length === 0) {
            products = getFallbackProducts();
        }

        allProducts = products;

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
    card.className = 'product-card bg-white rounded-lg shadow-sm hover:shadow-lg overflow-hidden border border-gray-200 cursor-pointer group';

    // Handle image URL
    let imageUrl = product.image_url || product.imageUrl;
    if (imageUrl && imageUrl.startsWith('/api/media/')) {
        imageUrl = `https://admin30.fitrinurazis.com${imageUrl}`;
    }
    const fallbackImage = 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop&crop=center&q=80';
    const finalImageUrl = imageUrl || fallbackImage;

    // Calculate prices
    const price = parseFloat(product.price || 0);
    const discount = parseFloat(product.discount || 0);
    const hasDiscount = discount > 0;
    const discountedPrice = hasDiscount ? price * (1 - discount / 100) : price;

    card.innerHTML = `
        <div class="product-image-wrapper">
            <img src="${finalImageUrl}" alt="${product.name}"
                 class="product-image"
                 onerror="this.src='${fallbackImage}'">

            ${hasDiscount ? `
                <div class="absolute top-2 left-2 bg-red-500 text-white px-2 py-0.5 rounded text-[10px] font-bold z-10">
                    ${Math.round(discount)}%
                </div>
            ` : ''}

            ${product.stock === 0 ? `
                <div class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
                    <span class="text-white font-bold text-xs sm:text-sm px-3 py-1.5 bg-red-600 rounded">HABIS</span>
                </div>
            ` : ''}
        </div>

        <div class="product-content p-2 sm:p-3">
            <h3 class="font-normal text-gray-800 mb-1 line-clamp-2 text-xs sm:text-sm leading-snug min-h-[2.5rem] sm:min-h-[2.8rem]">
                ${product.name}
            </h3>

            <div class="flex flex-col gap-1">
                <div class="flex items-center gap-1.5">
                    ${hasDiscount ? `
                        <span class="text-[10px] sm:text-xs text-gray-400 line-through">
                            ${formatCurrency(price)}
                        </span>
                    ` : ''}
                </div>
                <span class="text-sm sm:text-base font-bold text-gray-900">
                    ${formatCurrency(discountedPrice)}
                </span>
            </div>

            ${product.stock > 0 && product.stock <= 5 ? `
                <div class="mt-2 text-[10px] sm:text-xs text-orange-600 font-medium">
                    <i class="fas fa-fire text-orange-500 mr-1"></i>Stok terbatas
                </div>
            ` : ''}
        </div>
    `;

    // Add click event for entire product card
    card.addEventListener('click', () => {
        viewProduct(product.id);
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
                class="px-3 sm:px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors text-sm ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}"
                ${currentPage === 1 ? 'disabled' : ''}>
            <i class="fas fa-chevron-left"></i>
        </button>
    `;

    // Page numbers
    const isMobile = window.innerWidth < 640;
    const startPage = Math.max(1, currentPage - (isMobile ? 1 : 2));
    const endPage = Math.min(totalPages, currentPage + (isMobile ? 1 : 2));

    if (startPage > 1) {
        paginationHTML += `
            <button onclick="changePage(1)" class="px-3 sm:px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors text-sm">1</button>
        `;
        if (startPage > 2) {
            paginationHTML += '<span class="px-2 py-2 text-gray-500 text-sm">...</span>';
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
            <button onclick="changePage(${i})"
                    class="px-3 sm:px-4 py-2 rounded-lg border transition-colors text-sm font-medium ${i === currentPage ? 'bg-amber-600 text-white border-amber-600 shadow-md' : 'border-gray-300 hover:bg-gray-50'}">
                ${i}
            </button>
        `;
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            paginationHTML += '<span class="px-2 py-2 text-gray-500 text-sm">...</span>';
        }
        paginationHTML += `
            <button onclick="changePage(${totalPages})" class="px-3 sm:px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors text-sm">${totalPages}</button>
        `;
    }

    // Next button
    paginationHTML += `
        <button onclick="changePage(${currentPage + 1})"
                class="px-3 sm:px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors text-sm ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}"
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
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            currentFilters.sort = this.value;
            currentFilters.page = 1;
            applyFilters();
        });
    }

    // Clear filters button
    const clearFiltersBtn = document.getElementById('clear-filters');
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', function() {
            // Reset all filters
            currentFilters = {
                search: '',
                category: 'all',
                sort: 'created_at-desc',
                page: 1,
                limit: 12
            };

            // Reset form elements
            if (searchInput) searchInput.value = '';
            if (sortSelect) sortSelect.value = 'created_at-desc';

            // Reset category radio buttons
            const allCategoryRadio = document.querySelector('input[name="category"][value="all"]');
            if (allCategoryRadio) allCategoryRadio.checked = true;

            applyFilters();
        });
    }

    // View toggle buttons
    const gridViewBtn = document.getElementById('grid-view');
    const listViewBtn = document.getElementById('list-view');

    if (gridViewBtn) {
        gridViewBtn.addEventListener('click', function() {
            this.classList.add('bg-amber-500', 'text-white');
            this.classList.remove('text-gray-500', 'hover:bg-white', 'hover:text-amber-600');

            if (listViewBtn) {
                listViewBtn.classList.remove('bg-amber-500', 'text-white');
                listViewBtn.classList.add('text-gray-500', 'hover:bg-white', 'hover:text-amber-600');
            }

            // Switch to grid view
            const container = document.getElementById('products-container');
            container.className = 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3 md:gap-4 mb-8';
        });
    }

    if (listViewBtn) {
        listViewBtn.addEventListener('click', function() {
            this.classList.add('bg-amber-500', 'text-white');
            this.classList.remove('text-gray-500', 'hover:bg-white', 'hover:text-amber-600');

            if (gridViewBtn) {
                gridViewBtn.classList.remove('bg-amber-500', 'text-white');
                gridViewBtn.classList.add('text-gray-500', 'hover:bg-white', 'hover:text-amber-600');
            }

            // Switch to list view
            const container = document.getElementById('products-container');
            container.className = 'grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-8';
        });
    }

    // Cart success modal (keep for future use or remove if not needed)
    const continueShoppingBtn = document.getElementById('continue-shopping');
    const viewCartBtn = document.getElementById('view-cart');

    if (continueShoppingBtn) {
        continueShoppingBtn.addEventListener('click', function() {
            hideCartSuccessModal();
        });
    }

    if (viewCartBtn) {
        viewCartBtn.addEventListener('click', function() {
            window.location.href = 'cart.html';
        });
    }
}

// Global functions
function viewProduct(productId) {
    // Use clean URL as defined in server.js routing
    window.location.href = `/product-detail?id=${productId}`;
}

function addToCart(productId) {
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

    // Add animation
    animateCartIcon();
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

function animateCartIcon() {
    const cartIcon = document.querySelector('.fa-shopping-cart');
    const cartCount = document.getElementById('cart-count');

    if (cartIcon) {
        // Add bounce animation to cart icon
        cartIcon.classList.add('animate-bounce');
        setTimeout(() => {
            cartIcon.classList.remove('animate-bounce');
        }, 1000);
    }

    if (cartCount) {
        // Add scale animation to cart count
        cartCount.style.transform = 'scale(1.5)';
        cartCount.style.transition = 'transform 0.3s ease';
        setTimeout(() => {
            cartCount.style.transform = 'scale(1)';
        }, 300);
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