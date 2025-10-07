// Product Detail JavaScript
document.addEventListener('DOMContentLoaded', function() {
    console.log('Product detail page loaded');
    console.log('Current URL:', window.location.href);

    // Get product ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    console.log('URL parameters:', Object.fromEntries(urlParams));
    console.log('Extracted product ID:', productId);

    if (!productId) {
        console.error('No product ID provided in URL');
        showError('Produk tidak ditemukan - ID produk tidak ada di URL');
        return;
    }

    // Check if required DOM elements exist
    const requiredElements = ['loading-state', 'product-content', 'main-image', 'product-name'];
    let missingElements = [];

    requiredElements.forEach(id => {
        const element = document.getElementById(id);
        if (!element) {
            missingElements.push(id);
        }
    });

    if (missingElements.length > 0) {
        console.error('Missing DOM elements:', missingElements);
        showError('Error: Elemen halaman tidak lengkap');
        return;
    }

    console.log('All required DOM elements found');

    // Initialize page
    initProductDetail(productId);
    initEventListeners();
});

// Global variables
let currentProduct = null;
let currentQuantity = 1;
let currentImageIndex = 0;
let productImages = [];

async function initProductDetail(productId) {
    console.log('Loading product with ID:', productId);

    try {
        // Show loading state
        const loadingState = document.getElementById('loading-state');
        const productContent = document.getElementById('product-content');

        console.log('Loading state element:', loadingState);
        console.log('Product content element:', productContent);

        if (loadingState) loadingState.classList.remove('hidden');
        if (productContent) productContent.classList.add('hidden');

        // Wait for dependencies
        console.log('Waiting for dependencies...');
        await waitForDependencies();
        console.log('Dependencies ready');

        // Load product data
        console.log('Calling API for product:', productId);
        const response = await window.ApiService.getProduct(productId);
        console.log('Product API response:', response);

        if (response && response.id) {
            console.log('Product data received, rendering...');
            currentProduct = response;
            renderProductDetail(response);
            loadRelatedProducts(response.category);
        } else {
            console.error('Invalid product response:', response);
            throw new Error('Product not found');
        }

    } catch (error) {
        console.error('Error loading product:', error);
        console.error('Error stack:', error.stack);
        showError('Gagal memuat detail produk: ' + error.message);

        // Hide loading and show error state
        const loadingState = document.getElementById('loading-state');
        if (loadingState) loadingState.classList.add('hidden');
    }
}

async function waitForDependencies() {
    return new Promise((resolve) => {
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds max

        function checkDependencies() {
            attempts++;
            console.log(`Checking dependencies (attempt ${attempts}):`, {
                ApiService: typeof window.ApiService,
                Utils: typeof window.Utils,
                axios: typeof axios
            });

            if (typeof window.ApiService !== 'undefined') {
                console.log('Dependencies ready!');
                resolve();
            } else if (attempts >= maxAttempts) {
                console.error('Dependencies timeout after', attempts, 'attempts');
                resolve(); // Continue anyway
            } else {
                setTimeout(checkDependencies, 100);
            }
        }
        checkDependencies();
    });
}

function renderProductDetail(product) {
    try {
        console.log('Rendering product:', product);

        // Hide loading and show content
        document.getElementById('loading-state').classList.add('hidden');
        document.getElementById('product-content').classList.remove('hidden');

        // Update page title and breadcrumb
        document.title = `${product.name} - Batik Nusantara`;
        document.getElementById('breadcrumb-product').textContent = product.name;

        // Product images
        setupProductImages(product);

        // Product info
        document.getElementById('product-category').textContent = product.category || 'Batik';
        document.getElementById('product-name').textContent = product.name;
        document.getElementById('product-description').textContent = product.description || 'Batik berkualitas tinggi dengan motif tradisional yang indah dan detail yang sempurna.';

        // Price
        setupPricing(product);

        // Stock
        setupStockInfo(product);

        // Tabs content
        document.getElementById('full-description').textContent = product.description || 'Batik berkualitas tinggi dengan motif tradisional yang indah dan detail yang sempurna. Dibuat dengan teknik tradisional menggunakan bahan berkualitas tinggi.';
        document.getElementById('spec-category').textContent = product.category || 'Batik';

        console.log('Product rendered successfully');

    } catch (error) {
        console.error('Error rendering product:', error);
        showError('Gagal menampilkan detail produk');
    }
}

function setupProductImages(product) {
    const fallbackImage = 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=400&fit=crop&crop=center&q=80';
    const baseURL = 'http://localhost:3000';

    // Build images array from product data
    productImages = [];

    // Add images from product.images array if available
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
        product.images.forEach(imageUrl => {
            if (imageUrl) {
                const fullUrl = imageUrl.startsWith('/api/media/') ? baseURL + imageUrl : imageUrl;
                productImages.push(fullUrl);
            }
        });
    }

    // Fallback to product.image_url if no images array
    if (productImages.length === 0) {
        let imageUrl = product.image_url || product.imageUrl;
        if (imageUrl) {
            const fullUrl = imageUrl.startsWith('/api/media/') ? baseURL + imageUrl : imageUrl;
            productImages.push(fullUrl);
        }
    }

    // Ultimate fallback to placeholder
    if (productImages.length === 0) {
        productImages.push(fallbackImage);
    }

    // Reset to first image
    currentImageIndex = 0;

    // Set main image
    const mainImage = document.getElementById('main-image');
    mainImage.src = productImages[0];
    mainImage.alt = product.name;
    mainImage.onerror = function() { this.src = fallbackImage; };

    // Update image counter
    updateImageCounter();

    // Render thumbnails
    renderThumbnails();

    // Setup navigation arrows
    setupImageNavigation();

    // Show/hide arrows based on image count
    const prevBtn = document.getElementById('prev-image');
    const nextBtn = document.getElementById('next-image');
    if (productImages.length <= 1) {
        if (prevBtn) prevBtn.classList.add('hidden');
        if (nextBtn) nextBtn.classList.add('hidden');
    } else {
        if (prevBtn) prevBtn.classList.remove('hidden');
        if (nextBtn) nextBtn.classList.remove('hidden');
    }
}

function renderThumbnails() {
    const thumbnailContainer = document.getElementById('thumbnail-container');
    if (!thumbnailContainer) return;

    const fallbackImage = 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=400&fit=crop&crop=center&q=80';

    thumbnailContainer.innerHTML = productImages.map((imageUrl, index) => {
        const isActive = index === currentImageIndex;
        const activeClass = isActive ? 'thumbnail-active' : 'thumbnail-inactive';

        return `
            <button onclick="changeImage(${index})" class="${activeClass} w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border-2 ${isActive ? 'border-amber-600' : 'border-transparent opacity-70'} flex-shrink-0 hover:opacity-100 transition-all">
                <img src="${imageUrl}" alt="View ${index + 1}" class="w-full h-full object-cover" onerror="this.src='${fallbackImage}'">
            </button>
        `;
    }).join('');
}

function updateImageCounter() {
    const currentIndexEl = document.getElementById('current-image-index');
    const totalImagesEl = document.getElementById('total-images');

    if (currentIndexEl) currentIndexEl.textContent = currentImageIndex + 1;
    if (totalImagesEl) totalImagesEl.textContent = productImages.length;
}

function changeImage(index) {
    if (index < 0 || index >= productImages.length) return;

    currentImageIndex = index;

    // Update main image
    const mainImage = document.getElementById('main-image');
    if (mainImage) {
        mainImage.src = productImages[index];
    }

    // Update counter
    updateImageCounter();

    // Update thumbnail active states
    renderThumbnails();
}

function setupImageNavigation() {
    const prevBtn = document.getElementById('prev-image');
    const nextBtn = document.getElementById('next-image');

    if (prevBtn) {
        prevBtn.onclick = () => {
            const newIndex = currentImageIndex - 1;
            if (newIndex >= 0) {
                changeImage(newIndex);
            } else {
                // Loop to last image
                changeImage(productImages.length - 1);
            }
        };
    }

    if (nextBtn) {
        nextBtn.onclick = () => {
            const newIndex = currentImageIndex + 1;
            if (newIndex < productImages.length) {
                changeImage(newIndex);
            } else {
                // Loop to first image
                changeImage(0);
            }
        };
    }
}

function setupPricing(product) {
    const price = parseFloat(product.price || 0);
    const discount = parseFloat(product.discount || 0);

    const hasDiscount = discount > 0;
    const discountedPrice = hasDiscount ? price * (1 - discount / 100) : price;

    // Current price
    document.getElementById('current-price').textContent = formatCurrency(discountedPrice);

    // Original price and discount
    const originalPriceEl = document.getElementById('original-price');
    const discountBadge = document.getElementById('discount-badge');
    const savingsEl = document.getElementById('savings');

    if (hasDiscount) {
        originalPriceEl.textContent = formatCurrency(price);
        originalPriceEl.classList.remove('hidden');

        document.getElementById('discount-percent').textContent = Math.round(discount);
        discountBadge.classList.remove('hidden');

        const savings = price - discountedPrice;
        document.getElementById('savings-amount').textContent = formatCurrency(savings).replace('Rp ', '');
        savingsEl.classList.remove('hidden');
    } else {
        originalPriceEl.classList.add('hidden');
        discountBadge.classList.add('hidden');
        savingsEl.classList.add('hidden');
    }

    // Initialize subtotal
    updateSubtotal();
}

function updateSubtotal() {
    if (!currentProduct) return;

    const price = parseFloat(currentProduct.price || 0);
    const discount = parseFloat(currentProduct.discount || 0);
    const hasDiscount = discount > 0;
    const discountedPrice = hasDiscount ? price * (1 - discount / 100) : price;

    const subtotal = discountedPrice * currentQuantity;

    const subtotalEl = document.getElementById('subtotal-amount');
    if (subtotalEl) {
        subtotalEl.textContent = formatCurrency(subtotal);
    }
}

function setupStockInfo(product) {
    const stock = parseInt(product.stock || 0);
    const stockInfo = document.getElementById('stock-info');

    if (!stockInfo) return;

    if (stock > 0) {
        stockInfo.innerHTML = `
            <div class="flex items-center justify-between">
                <span class="text-sm font-semibold text-gray-700">Stok</span>
                <div class="flex items-center gap-2">
                    <div class="flex items-center text-green-600 text-sm">
                        <i class="fas fa-check-circle mr-2"></i>
                        <span><span id="stock-count" class="font-semibold">${stock}</span> tersedia</span>
                    </div>
                </div>
            </div>
        `;

        // Enable quantity controls and buttons
        const qtyInput = document.getElementById('quantity');
        const addToCartBtn = document.getElementById('add-to-cart-btn');
        const buyNowBtn = document.getElementById('buy-now-btn');

        if (qtyInput) qtyInput.max = stock;
        if (addToCartBtn) {
            addToCartBtn.disabled = false;
            addToCartBtn.innerHTML = '<i class="fas fa-shopping-cart mr-2"></i>Tambah ke Keranjang';
        }
        if (buyNowBtn) {
            buyNowBtn.disabled = false;
            buyNowBtn.innerHTML = '<i class="fas fa-bolt mr-2"></i>Beli Sekarang';
        }

    } else {
        stockInfo.innerHTML = `
            <div class="flex items-center justify-between">
                <span class="text-sm font-semibold text-gray-700">Stok</span>
                <div class="flex items-center gap-2">
                    <div class="flex items-center text-red-500 text-sm">
                        <i class="fas fa-exclamation-circle mr-2"></i>
                        <span class="font-semibold">Stok Habis</span>
                    </div>
                </div>
            </div>
        `;

        // Disable quantity controls and buttons
        const qtyInput = document.getElementById('quantity');
        const addToCartBtn = document.getElementById('add-to-cart-btn');
        const buyNowBtn = document.getElementById('buy-now-btn');

        if (qtyInput) qtyInput.disabled = true;
        if (addToCartBtn) {
            addToCartBtn.disabled = true;
            addToCartBtn.innerHTML = '<i class="fas fa-ban mr-2"></i>Stok Habis';
        }
        if (buyNowBtn) {
            buyNowBtn.disabled = true;
            buyNowBtn.innerHTML = '<i class="fas fa-ban mr-2"></i>Stok Habis';
        }
    }
}

function initEventListeners() {
    // Quantity controls
    document.getElementById('decrease-qty').addEventListener('click', () => {
        const qtyInput = document.getElementById('quantity');
        const currentQty = parseInt(qtyInput.value);
        if (currentQty > 1) {
            qtyInput.value = currentQty - 1;
            currentQuantity = currentQty - 1;
            updateSubtotal();
        }
    });

    document.getElementById('increase-qty').addEventListener('click', () => {
        const qtyInput = document.getElementById('quantity');
        const currentQty = parseInt(qtyInput.value);
        const maxStock = parseInt(qtyInput.max);
        if (currentQty < maxStock) {
            qtyInput.value = currentQty + 1;
            currentQuantity = currentQty + 1;
            updateSubtotal();
        }
    });

    document.getElementById('quantity').addEventListener('change', function() {
        const value = parseInt(this.value);
        const max = parseInt(this.max);
        if (value < 1) {
            this.value = 1;
            currentQuantity = 1;
        } else if (value > max) {
            this.value = max;
            currentQuantity = max;
        } else {
            currentQuantity = value;
        }
        updateSubtotal();
    });

    // Add to cart button
    document.getElementById('add-to-cart-btn').addEventListener('click', () => {
        if (currentProduct) {
            addToCart(currentProduct.id, currentQuantity);
        }
    });

    // Buy now button
    document.getElementById('buy-now-btn').addEventListener('click', () => {
        if (currentProduct) {
            buyNow(currentProduct.id, currentQuantity);
        }
    });

    // Tab switching
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');
            switchTab(tabName);
        });
    });
}

function switchTab(tabName) {
    // Update button states
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active', 'border-amber-600', 'text-amber-600');
        btn.classList.add('border-transparent', 'text-gray-500');
    });

    const activeButton = document.querySelector(`[data-tab="${tabName}"]`);
    activeButton.classList.add('active', 'border-amber-600', 'text-amber-600');
    activeButton.classList.remove('border-transparent', 'text-gray-500');

    // Update content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });

    document.getElementById(`tab-${tabName}`).classList.remove('hidden');
}

function addToCart(productId, quantity) {
    try {
        console.log('Adding to cart:', productId, quantity);

        // Get existing cart
        let cart = JSON.parse(localStorage.getItem('cart') || '[]');

        // Check if product already in cart
        const existingIndex = cart.findIndex(item => item.id == productId);

        if (existingIndex !== -1) {
            // Update quantity
            cart[existingIndex].quantity += quantity;
        } else {
            // Add new item
            cart.push({
                id: productId,
                name: currentProduct.name,
                price: currentProduct.price,
                discount: currentProduct.discount || 0,
                image_url: currentProduct.image_url,
                quantity: quantity
            });
        }

        // Save cart
        localStorage.setItem('cart', JSON.stringify(cart));

        // Update cart count in header
        updateCartCount();

        // Show success message
        showSuccess(`${currentProduct.name} berhasil ditambahkan ke keranjang!`);

    } catch (error) {
        console.error('Error adding to cart:', error);
        showError('Gagal menambahkan ke keranjang');
    }
}

function buyNow(productId, quantity) {
    // Add to cart first
    addToCart(productId, quantity);

    // Redirect to cart page using clean URL
    setTimeout(() => {
        window.location.href = '/cart';
    }, 1000);
}

async function loadRelatedProducts(category) {
    console.log('Loading related products for category:', category);

    try {
        console.log('Calling API for related products...');
        const response = await window.ApiService.getProducts({
            category: category,
            limit: 4
        });

        console.log('Related products API response:', response);

        if (response && response.data && response.data.length > 0) {
            console.log('Found related products:', response.data.length);
            renderRelatedProducts(response.data);
        } else if (response && response.products && response.products.length > 0) {
            // Try different response structure
            console.log('Found related products in products array:', response.products.length);
            renderRelatedProducts(response.products);
        } else {
            console.log('No related products found, trying fallback...');
            // Fallback: get any products
            const fallbackResponse = await window.ApiService.getProducts({ limit: 4 });
            console.log('Fallback products response:', fallbackResponse);

            if (fallbackResponse && fallbackResponse.data && fallbackResponse.data.length > 0) {
                renderRelatedProducts(fallbackResponse.data.slice(0, 4));
            } else if (fallbackResponse && fallbackResponse.products && fallbackResponse.products.length > 0) {
                renderRelatedProducts(fallbackResponse.products.slice(0, 4));
            } else {
                console.log('No products available for related section');
            }
        }
    } catch (error) {
        console.error('Error loading related products:', error);
        console.error('Error details:', error.message, error.stack);
    }
}

function renderRelatedProducts(products) {
    console.log('Rendering related products:', products);

    const container = document.getElementById('related-products');
    if (!container) {
        console.error('Related products container not found!');
        return;
    }

    console.log('Container found, clearing existing content...');
    container.innerHTML = '';

    let rendered = 0;
    products.forEach(product => {
        console.log('Processing product:', product.id, product.name);

        if (product.id != currentProduct?.id) { // Don't show current product
            console.log('Creating card for product:', product.id);
            const productCard = createRelatedProductCard(product);
            container.appendChild(productCard);
            rendered++;
        } else {
            console.log('Skipping current product:', product.id);
        }
    });

    console.log(`Rendered ${rendered} related products out of ${products.length} total`);
}

function createRelatedProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card bg-white rounded-lg shadow-sm hover:shadow-lg overflow-hidden border border-gray-200 cursor-pointer group';

    // Handle image URL
    let imageUrl = product.image_url || product.imageUrl;
    if (imageUrl && imageUrl.startsWith('/api/media/')) {
        imageUrl = `http://localhost:3000${imageUrl}`;
    }

    const fallbackImage = 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop&crop=center&q=80';
    const finalImageUrl = imageUrl || fallbackImage;

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

    card.addEventListener('click', () => {
        viewProduct(product.id);
    });

    return card;
}

// Global functions
function viewProduct(productId) {
    // Use clean URL as defined in server.js routing
    window.location.href = `/product-detail?id=${productId}`;
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

function updateCartCount() {
    try {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

        const cartCountEl = document.getElementById('cart-count');
        if (cartCountEl) {
            cartCountEl.textContent = totalItems;
        }
    } catch (error) {
        console.error('Error updating cart count:', error);
    }
}

function showSuccess(message) {
    if (typeof Toastify !== 'undefined') {
        Toastify({
            text: message,
            backgroundColor: '#10B981',
            duration: 3000,
            close: true
        }).showToast();
    } else {
        alert(message);
    }
}

function showError(message) {
    if (typeof Toastify !== 'undefined') {
        Toastify({
            text: message,
            backgroundColor: '#EF4444',
            duration: 3000,
            close: true
        }).showToast();
    } else {
        alert(message);
    }
}

// Initialize cart count on page load
document.addEventListener('DOMContentLoaded', updateCartCount);

// Make changeImage globally accessible for onclick handlers
window.changeImage = changeImage;