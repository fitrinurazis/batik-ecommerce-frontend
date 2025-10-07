// Checkout JavaScript
document.addEventListener('DOMContentLoaded', function() {
    console.log('Checkout page loaded');

    // Initialize checkout
    initializeCheckout();
    initEventListeners();
});

// Global variables
let cart = [];
let orderTotal = 0;
let serviceFee = 0;

async function initializeCheckout() {
    console.log('Initializing checkout...');

    try {
        // Wait for dependencies
        await waitForDependencies();

        // Load cart from localStorage
        loadCartFromStorage();

        // If cart is empty, redirect to cart page
        if (cart.length === 0) {
            showError('Keranjang kosong. Silakan tambahkan produk terlebih dahulu.');
            setTimeout(() => {
                window.location.href = 'cart.html';
            }, 2000);
            return;
        }

        // Load product details and render
        await loadProductDetails();
        renderOrderItems();
        calculateOrderSummary();

        console.log('Checkout initialized successfully');

    } catch (error) {
        console.error('Error initializing checkout:', error);
        showError('Gagal memuat halaman checkout');
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
        console.log('Loaded cart for checkout:', cart);
    }
}

async function loadProductDetails() {
    console.log('Loading product details for checkout...');

    const products = {};

    try {
        const productIds = cart.map(item => item.id || item.productId);

        for (const id of productIds) {
            if (typeof window.ApiService !== 'undefined') {
                try {
                    const product = await window.ApiService.getProduct(id);
                    if (product) {
                        products[id] = product;
                    }
                } catch (error) {
                    console.error('Failed to load product:', id, error);
                    // Use fallback data if available
                    const cartItem = cart.find(item => (item.id || item.productId) == id);
                    if (cartItem && cartItem.name) {
                        products[id] = {
                            id: id,
                            name: cartItem.name,
                            price: cartItem.price,
                            image_url: cartItem.image_url
                        };
                    }
                }
            }
        }

        // Update cart items with product details
        cart = cart.map(item => {
            const productId = item.id || item.productId;
            const product = products[productId];

            return {
                ...item,
                productDetails: product
            };
        });

        console.log('Product details loaded:', cart);

    } catch (error) {
        console.error('Error loading product details:', error);
    }
}

function renderOrderItems() {
    const container = document.getElementById('order-items');
    container.innerHTML = '';

    cart.forEach(item => {
        const product = item.productDetails;
        if (!product) return;

        const itemElement = createOrderItemElement(item, product);
        container.appendChild(itemElement);
    });
}

function createOrderItemElement(cartItem, product) {
    const div = document.createElement('div');
    div.className = 'flex items-center space-x-4 p-4 bg-gray-50 rounded-lg';

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
    const quantity = parseInt(cartItem.quantity || 1);
    const totalPrice = discountedPrice * quantity;

    div.innerHTML = `
        <div class="flex-shrink-0">
            <img src="${finalImageUrl}" alt="${product.name}"
                 class="w-16 h-16 object-cover rounded-lg"
                 onerror="this.src='${fallbackImage}'">
        </div>
        <div class="flex-1">
            <h4 class="font-medium text-gray-900">${product.name}</h4>
            <div class="text-sm text-gray-600">${product.category || 'Batik'}</div>
            <div class="flex items-center space-x-2 mt-1">
                <span class="font-medium text-amber-600">${formatCurrency(discountedPrice)}</span>
                ${hasDiscount ? `<span class="text-xs text-gray-500 line-through">${formatCurrency(price)}</span>` : ''}
                <span class="text-sm text-gray-600">× ${quantity}</span>
            </div>
        </div>
        <div class="text-right">
            <div class="font-semibold text-gray-900">${formatCurrency(totalPrice)}</div>
        </div>
    `;

    return div;
}

function calculateOrderSummary() {
    let subtotal = 0;
    let totalItems = 0;
    let totalDiscount = 0;

    cart.forEach(item => {
        const product = item.productDetails;
        if (!product) return;

        const price = parseFloat(product.price || 0);
        const discount = parseFloat(product.discount || 0);
        const quantity = parseInt(item.quantity || 1);

        const hasDiscount = discount > 0;
        const discountedPrice = hasDiscount ? price * (1 - discount / 100) : price;
        const discountAmount = hasDiscount ? (price - discountedPrice) * quantity : 0;

        subtotal += discountedPrice * quantity;
        totalItems += quantity;
        totalDiscount += discountAmount;
    });

    // No service fee - free shipping
    serviceFee = 0;

    orderTotal = subtotal + serviceFee;

    // Update display
    document.getElementById('total-items').textContent = totalItems;
    document.getElementById('subtotal').textContent = formatCurrency(subtotal);
    document.getElementById('service-fee').textContent = formatCurrency(serviceFee);
    document.getElementById('discount-amount').textContent = formatCurrency(totalDiscount).replace('Rp ', '');
    document.getElementById('grand-total').textContent = formatCurrency(orderTotal);

    console.log('Order summary calculated:', {
        subtotal,
        totalItems,
        totalDiscount,
        serviceFee,
        orderTotal
    });
}

function initEventListeners() {
    // Same as billing checkbox
    document.getElementById('same-as-billing').addEventListener('change', function() {
        if (this.checked) {
            fillShippingFromBilling();
        }
    });

    // Form submission
    document.getElementById('checkout-form').addEventListener('submit', handleCheckoutSubmission);

    // Province change (for dynamic city loading in future)
    document.querySelector('select[name="province"]').addEventListener('change', function() {
        console.log('Province changed:', this.value);
        // Here you can add logic to load cities based on province
    });
}

function fillShippingFromBilling() {
    // In a real application, you might want to copy billing address fields
    // For now, we'll just show a message
    showInfo('Fitur ini akan menyalin alamat pelanggan ke alamat pengiriman');
}

async function handleCheckoutSubmission(event) {
    event.preventDefault();

    console.log('Processing checkout...');

    // Validate form
    if (!validateCheckoutForm()) {
        return;
    }

    // Show loading
    showLoading();

    try {
        // Collect form data
        const formData = new FormData(event.target);
        const subtotal = orderTotal - serviceFee;

        // Prepare order data according to backend API structure
        const orderData = {
            order_data: {
                customer_name: formData.get('fullName'),
                customer_email: formData.get('email'),
                customer_phone: formData.get('phone'),
                customer_birth_date: formData.get('birthDate'),
                shipping_address: formData.get('address'),
                shipping_province: formData.get('province'),
                shipping_city: formData.get('city'),
                shipping_postal: formData.get('postalCode'),
                shipping_notes: formData.get('shippingNotes'),
                subtotal: subtotal,
                shipping_cost: serviceFee,
                total: orderTotal,
                agree_terms: formData.get('agreeTerms') === 'on',
                agree_newsletter: formData.get('agreeNewsletter') === 'on'
            },
            items: cart.map(item => {
                const product = item.productDetails;
                const originalPrice = parseFloat(product?.price || 0);
                const discount = parseFloat(product?.discount || 0);
                const finalPrice = discount > 0 ? originalPrice * (1 - discount / 100) : originalPrice;

                return {
                    product_id: parseInt(item.id || item.productId),
                    quantity: parseInt(item.quantity),
                    price: finalPrice
                };
            })
        };

        console.log('Order data:', orderData);

        // Send order to backend API
        const orderResponse = await submitOrder(orderData);

        // Clear cart
        localStorage.removeItem('cart');

        // Show success
        showOrderSuccess(orderResponse);

    } catch (error) {
        console.error('Checkout error:', error);
        showError('Gagal memproses pesanan. Silakan coba lagi.');
    } finally {
        hideLoading();
    }
}

function validateCheckoutForm() {
    const requiredFields = [
        'fullName', 'email', 'phone', 'address', 'province', 'city', 'postalCode'
    ];

    const missingFields = [];

    requiredFields.forEach(field => {
        const element = document.querySelector(`[name="${field}"]`);
        if (!element || !element.value.trim()) {
            missingFields.push(field);
        }
    });

    // Check terms agreement
    const agreeTerms = document.querySelector('input[name="agreeTerms"]:checked');
    if (!agreeTerms) {
        showError('Anda harus menyetujui syarat & ketentuan');
        return false;
    }

    if (missingFields.length > 0) {
        showError('Lengkapi semua field yang diperlukan');
        return false;
    }

    // Validate email
    const email = document.querySelector('[name="email"]').value;
    if (!isValidEmail(email)) {
        showError('Format email tidak valid');
        return false;
    }

    // Validate phone
    const phone = document.querySelector('[name="phone"]').value;
    if (!isValidPhone(phone)) {
        showError('Nomor telepon tidak valid');
        return false;
    }

    // Validate postal code
    const postalCode = document.querySelector('[name="postalCode"]').value;
    if (!/^\d{5}$/.test(postalCode)) {
        showError('Kode pos harus 5 digit angka');
        return false;
    }

    return true;
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidPhone(phone) {
    const phoneRegex = /^(\+62|62|0)[2-9]\d{7,11}$/;
    return phoneRegex.test(phone.replace(/\s|-/g, ''));
}

async function submitOrder(orderData) {
    try {
        const response = await fetch('http://localhost:3000/api/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to create order');
        }

        const result = await response.json();
        console.log('Order created successfully:', result);
        return result;

    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

function showOrderSuccess(orderResponse) {
    // Use order data from API response
    const order = orderResponse.order;

    // Save order ID to localStorage for payment page
    localStorage.setItem('currentOrderId', order.id);
    localStorage.setItem('currentOrder', JSON.stringify(order));

    console.log('Order created successfully, redirecting to payment page...');

    // Show success message briefly before redirect
    showSuccess('Pesanan berhasil dibuat! Mengarahkan ke halaman pembayaran...');

    // Redirect to payment page after short delay
    setTimeout(() => {
        window.location.href = `/payment?order=${order.id}`;
    }, 1500);
}

function continueShoppingFromModal() {
    window.location.href = '../index.html';
}

function viewOrderDetails() {
    // In a real application, this would redirect to order details page
    showInfo('Fitur detail pesanan akan segera tersedia');
    setTimeout(() => {
        window.location.href = '../index.html';
    }, 2000);
}

function showLoading() {
    const overlay = document.getElementById('loading-overlay');
    overlay.classList.remove('hidden');
    overlay.classList.add('flex');
}

function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    overlay.classList.add('hidden');
    overlay.classList.remove('flex');
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

function showInfo(message) {
    if (typeof Toastify !== 'undefined') {
        Toastify({
            text: message,
            backgroundColor: '#3B82F6',
            duration: 3000,
            close: true
        }).showToast();
    }
}