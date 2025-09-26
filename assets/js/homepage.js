// Homepage Functionality
document.addEventListener('DOMContentLoaded', function() {
    console.log('Homepage script loaded');

    // Wait for dependencies to be available
    function waitForDependencies() {
        if (typeof window.ApiService !== 'undefined' && typeof window.Utils !== 'undefined') {
            console.log('Dependencies available, initializing homepage...');
            initHomepage();
        } else {
            console.log('Waiting for dependencies...');
            setTimeout(waitForDependencies, 100);
        }
    }

    waitForDependencies();
});

function initHomepage() {
    console.log('Initializing homepage functionality...');

    try {
        // Initialize smooth scrolling
        initSmoothScrolling();

        // Initialize newsletter form
        initNewsletterForm();

        // Initialize cart count (use navbar's method if available)
        if (window.navbar && typeof window.navbar.updateCartCount === 'function') {
            window.navbar.updateCartCount();
        } else {
            updateCartCount();
        }

        // Load products with delay to ensure DOM is ready
        setTimeout(() => {
            console.log('Starting to load products...');
            loadFeaturedProducts();
            loadRecommendedProducts();
        }, 500);

    } catch (error) {
        console.error('Error initializing homepage:', error);
    }
}


function initSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);

            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

async function loadFeaturedProducts() {
    console.log('loadFeaturedProducts called');
    const grid = document.getElementById('featured-products-grid');
    if (!grid) {
        console.error('Featured products grid not found!');
        return;
    }

    console.log('Grid found, current content:', grid.innerHTML.substring(0, 100));

    try {
        console.log('Calling ApiService.getFeaturedProducts...');

        // Check if ApiService is available
        if (typeof window.ApiService === 'undefined') {
            console.error('ApiService is not available!');
            throw new Error('ApiService not loaded');
        }

        // Get featured products from API
        const response = await window.ApiService.getFeaturedProducts();
        console.log('Featured products response:', response);

        if (response && response.length > 0) {
            console.log(`Got ${response.length} featured products, displaying first 4...`);
            // Clear loading skeleton
            grid.innerHTML = '';

            // Limit to 4 products for homepage
            const featuredProducts = response.slice(0, 4);

            featuredProducts.forEach(product => {
                const productCard = createProductCard(product);
                grid.appendChild(productCard);
            });

            console.log('Featured products rendered successfully');
        } else {
            console.log('No featured products, trying regular products...');
            // Fallback: Load regular products if no featured products
            const fallbackResponse = await window.ApiService.getProducts({ limit: 4 });
            console.log('Fallback products response:', fallbackResponse);

            if (fallbackResponse.data && fallbackResponse.data.length > 0) {
                grid.innerHTML = '';
                fallbackResponse.data.forEach(product => {
                    const productCard = createProductCard(product);
                    grid.appendChild(productCard);
                });
                console.log('Fallback products rendered successfully');
            } else {
                throw new Error('No products available');
            }
        }

    } catch (error) {
        console.error('Error loading featured products:', error);

        // Show error message
        grid.innerHTML = `
            <div class="col-span-full text-center py-12">
                <div class="text-gray-500">
                    <i class="fas fa-exclamation-triangle text-4xl mb-4"></i>
                    <p class="text-lg mb-2">Gagal memuat produk unggulan</p>
                    <p class="text-sm mb-4 text-red-500">Error: ${error.message}</p>
                    <button onclick="loadFeaturedProducts()" class="text-amber-600 hover:text-amber-700 font-medium">
                        Coba Lagi
                    </button>
                </div>
            </div>
        `;
    }
}

async function loadRecommendedProducts() {
    console.log('loadRecommendedProducts called');
    const grid = document.getElementById('recommended-products');
    if (!grid) {
        console.error('Recommended products grid not found!');
        return;
    }

    console.log('Recommended grid found, current content:', grid.innerHTML.substring(0, 100));

    try {
        console.log('Calling ApiService.getRecommendedProducts...');

        // Check if ApiService is available
        if (typeof window.ApiService === 'undefined') {
            console.error('ApiService is not available!');
            throw new Error('ApiService not loaded');
        }

        // Get recommended products from API
        const response = await window.ApiService.getRecommendedProducts();
        console.log('Recommended products response:', response);

        if (response && response.length > 0) {
            console.log(`Got ${response.length} recommended products, displaying first 4...`);
            // Clear loading skeleton
            grid.innerHTML = '';

            // Limit to 4 products
            const recommendedProducts = response.slice(0, 4);

            recommendedProducts.forEach(product => {
                const productCard = createProductCard(product, 'recommended');
                grid.appendChild(productCard);
            });

            console.log('Recommended products rendered successfully');
        } else {
            console.log('No recommended products, trying regular products...');
            // Fallback: Load regular products
            const fallbackResponse = await window.ApiService.getProducts({ limit: 4, offset: 4 });
            console.log('Fallback recommended products response:', fallbackResponse);

            if (fallbackResponse.data && fallbackResponse.data.length > 0) {
                grid.innerHTML = '';
                fallbackResponse.data.forEach(product => {
                    const productCard = createProductCard(product, 'recommended');
                    grid.appendChild(productCard);
                });
                console.log('Fallback recommended products rendered successfully');
            } else {
                throw new Error('No recommended products available');
            }
        }

    } catch (error) {
        console.error('Error loading recommended products:', error);

        // Show error message
        grid.innerHTML = `
            <div class="col-span-full text-center py-12">
                <div class="text-gray-500">
                    <i class="fas fa-exclamation-triangle text-4xl mb-4"></i>
                    <p class="text-lg mb-2">Gagal memuat rekomendasi produk</p>
                    <p class="text-sm mb-4 text-red-500">Error: ${error.message}</p>
                    <button onclick="loadRecommendedProducts()" class="text-amber-600 hover:text-amber-700 font-medium">
                        Coba Lagi
                    </button>
                </div>
            </div>
        `;
    }
}

function createProductCard(product, type = 'featured') {
    const card = document.createElement('div');
    card.className = 'product-card group bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer w-full';

    // Calculate discount
    const hasDiscount = product.discount > 0;
    const originalPrice = parseFloat(product.price || 0);
    const discountedPrice = hasDiscount ? originalPrice * (1 - product.discount / 100) : originalPrice;

    // Handle image URL - support both full URLs and relative paths
    let imageUrl = product.image_url || product.imageUrl;
    if (imageUrl && imageUrl.startsWith('/api/media/')) {
        imageUrl = `http://localhost:3000${imageUrl}`;
    }

    const fallbackImage = 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop&crop=center&q=80';
    const finalImageUrl = imageUrl || fallbackImage;

    card.innerHTML = `
        <!-- Product Image -->
        <div class="relative">
            <div class="aspect-square w-full relative bg-gray-50">
                <img
                    src="${finalImageUrl}"
                    alt="${product.name}"
                    class="w-full h-full object-cover"
                    onerror="this.src='${fallbackImage}'"
                    loading="lazy"
                />

                <!-- Discount Badge -->
                ${hasDiscount ? `
                    <div class="absolute top-2 left-2">
                        <div class="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                            ${Math.round(product.discount)}%
                        </div>
                    </div>
                ` : ''}

                <!-- Stock Status Overlay -->
                ${product.stock <= 0 ? `
                    <div class="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                        <div class="text-white text-center">
                            <i class="fas fa-ban text-2xl mb-1"></i>
                            <p class="text-sm font-medium">Stok Habis</p>
                        </div>
                    </div>
                ` : ''}
            </div>
        </div>

        <!-- Card Content -->
        <div class="card-content p-2 sm:p-3">
            <!-- Product Name -->
            <h3 class="card-title text-xs sm:text-sm font-medium text-gray-800 mb-1 sm:mb-2 line-clamp-2 leading-tight sm:leading-relaxed">
                ${product.name}
            </h3>

            <!-- Price Section -->
            <div class="price-section">
                ${hasDiscount ? `
                    <!-- Original Price (crossed out) -->
                    <div class="text-xs text-gray-500 line-through mb-1">
                        ${formatCurrency(originalPrice)}
                    </div>
                    <!-- Discounted Price -->
                    <div class="card-price text-sm sm:text-base font-bold text-red-600 mb-1">
                        ${formatCurrency(discountedPrice)}
                    </div>
                    <!-- Discount Percentage -->
                    <div class="text-xs text-red-600 font-medium">
                        Hemat ${Math.round(product.discount)}%
                    </div>
                ` : `
                    <!-- Regular Price -->
                    <div class="card-price text-sm sm:text-base font-bold text-gray-900">
                        ${formatCurrency(discountedPrice)}
                    </div>
                `}
            </div>
        </div>
    `;

    // Add click event to navigate to product detail
    card.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('Card clicked, product:', product);
        if (product.id) {
            viewProduct(product.id);
        } else {
            console.error('Product ID is missing:', product);
        }
    });

    return card;
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount);
}

function viewProduct(productId) {
    console.log('Navigating to product detail:', productId);

    // Always navigate to absolute URL to avoid path conflicts
    const baseUrl = window.location.origin;
    const currentPath = window.location.pathname;

    // Get the root path (remove index.html if present)
    let rootPath = currentPath.replace('/index.html', '');
    if (!rootPath.endsWith('/')) {
        rootPath += '/';
    }

    // If we're in a subdirectory, go back to root
    if (currentPath.includes('/pages/')) {
        const segments = currentPath.split('/');
        const rootSegments = segments.slice(0, segments.indexOf('pages'));
        rootPath = rootSegments.join('/') + '/';
    }

    const targetUrl = `${baseUrl}${rootPath}pages/product-detail.html?id=${productId}`;

    console.log('Current path:', currentPath);
    console.log('Root path:', rootPath);
    console.log('Final target URL:', targetUrl);

    window.location.href = targetUrl;
}

function addToCart(productId) {
    console.log('Adding product to cart:', productId);

    try {
        // Get cart from localStorage
        let cart = JSON.parse(localStorage.getItem('cart') || '[]');

        // Check if product already in cart
        const existingIndex = cart.findIndex(item => (item.id || item.productId) == productId);

        if (existingIndex !== -1) {
            cart[existingIndex].quantity += 1;
            console.log('Updated existing item quantity');
        } else {
            cart.push({
                id: productId,
                productId: productId, // For backward compatibility
                quantity: 1,
                addedAt: new Date().toISOString()
            });
            console.log('Added new item to cart');
        }

        // Save cart
        localStorage.setItem('cart', JSON.stringify(cart));

        // Update cart count (use navbar's method if available)
        if (window.navbar && typeof window.navbar.updateCartCount === 'function') {
            window.navbar.updateCartCount();
        } else {
            updateCartCount();
        }

        // Show success message
        showSuccessToast('Produk berhasil ditambahkan ke keranjang!');

        console.log('Cart updated:', cart);

    } catch (error) {
        console.error('Error adding to cart:', error);
        showErrorToast('Gagal menambahkan produk ke keranjang');
    }
}

function updateCartCount() {
    const cartCountElement = document.getElementById('cart-count');
    if (cartCountElement) {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const totalItems = cart.reduce((sum, item) => sum + parseInt(item.quantity || 0), 0);
        cartCountElement.textContent = totalItems;

        // Add animation
        if (totalItems > 0) {
            cartCountElement.classList.add('animate-pulse');
        } else {
            cartCountElement.classList.remove('animate-pulse');
        }

        console.log('Cart count updated:', totalItems);
    }
}

function initNewsletterForm() {
    const form = document.getElementById('newsletter-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = form.email.value;
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;

            try {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

                // Simulate API call (replace with actual endpoint when available)
                await new Promise(resolve => setTimeout(resolve, 1000));

                showSuccessToast('Terima kasih! Anda telah berlangganan newsletter kami.');
                form.reset();

            } catch (error) {
                showErrorToast('Gagal mendaftarkan email. Silakan coba lagi.');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        });
    }
}

function showSuccessToast(message) {
    if (typeof Toastify !== 'undefined') {
        Toastify({
            text: message,
            duration: 3000,
            gravity: "top",
            position: "right",
            backgroundColor: "#10B981",
            stopOnFocus: true,
        }).showToast();
    } else {
        // Fallback
        alert(message);
    }
}

function showErrorToast(message) {
    if (typeof Toastify !== 'undefined') {
        Toastify({
            text: message,
            duration: 3000,
            gravity: "top",
            position: "right",
            backgroundColor: "#EF4444",
            stopOnFocus: true,
        }).showToast();
    } else {
        // Fallback
        alert(message);
    }
}

// Global functions
window.viewProduct = viewProduct;
window.addToCart = addToCart;
window.loadFeaturedProducts = loadFeaturedProducts;
window.loadRecommendedProducts = loadRecommendedProducts;