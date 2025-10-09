document.addEventListener('DOMContentLoaded', function() {
    function waitForDependencies() {
        if (typeof window.ApiService !== 'undefined' && typeof window.Utils !== 'undefined') {
            initInvoice();
        } else {
            setTimeout(waitForDependencies, 100);
        }
    }

    waitForDependencies();
});

async function initInvoice() {
    try {
        // Load site settings
        await loadSiteSettings();

        // Get order ID from URL parameter
        const urlParams = new URLSearchParams(window.location.search);
        const orderId = urlParams.get('order');

        if (!orderId) {
            alert('ID pesanan tidak ditemukan di URL');
            window.location.href = '/';
            return;
        }

        // Load order details
        await loadOrderDetails(orderId);

    } catch (error) {
        console.error('Error initializing invoice:', error);
        alert('Terjadi kesalahan saat memuat halaman');
    }
}

async function loadSiteSettings() {
    try {
        const settings = await window.ApiService.get('/settings/public');

        if (settings.site_name) {
            document.getElementById('site-title').textContent = settings.site_name;
            document.getElementById('footer-title').textContent = settings.site_name;
            document.title = `Invoice - ${settings.site_name}`;
        }

        if (settings.site_logo) {
            const logoImg = document.getElementById('site-logo');
            logoImg.src = settings.site_logo;
            logoImg.classList.remove('hidden');
            document.getElementById('site-logo-icon').style.display = 'none';
        }
    } catch (error) {
        console.error('Error loading site settings:', error);
    }
}

async function loadOrderDetails(orderId) {
    try {
        const response = await window.ApiService.get(`/orders/track/${orderId}`);

        if (!response.order) {
            throw new Error('Order not found');
        }

        displayInvoiceDetails(response.order);

    } catch (error) {
        console.error('Error loading order:', error);
        alert('Gagal memuat data pesanan. Silakan coba lagi nanti.');
        window.location.href = '/';
    }
}

function displayInvoiceDetails(order) {
    // Invoice header
    document.getElementById('invoice-id').textContent = `INV-${String(order.id).padStart(5, '0')}`;

    // Customer info
    document.getElementById('customer-name').textContent = order.customer_name;
    document.getElementById('customer-address').textContent = order.shipping_address;
    document.getElementById('customer-city').textContent = `${order.shipping_city}, ${order.shipping_postal}`;
    document.getElementById('customer-email').textContent = order.customer_email;

    // Order details
    document.getElementById('order-date').textContent = formatDate(order.created_at);

    // Payment status
    const paymentStatusEl = document.getElementById('payment-status');
    const statusConfig = getPaymentStatusConfig(order.status, order.payment);
    paymentStatusEl.textContent = statusConfig.text;
    paymentStatusEl.className = `${statusConfig.class} font-medium`;

    // Invoice items
    displayInvoiceItems(order.items);

    // Order summary
    document.getElementById('subtotal').textContent = formatCurrency(order.subtotal);
    document.getElementById('shipping').textContent = formatCurrency(order.shipping_cost || 0);
    document.getElementById('total').textContent = formatCurrency(order.total);

    // Show/hide payment instructions based on payment status
    const paymentInstructions = document.getElementById('payment-instructions');
    const paymentVerifiedNotice = document.getElementById('payment-verified-notice');

    // Show instructions only if payment is pending or not verified
    if (order.payment && order.payment.status === 'verified') {
        // Payment verified - hide instructions, show verified notice
        paymentInstructions.classList.add('hidden');
        paymentVerifiedNotice.classList.remove('hidden');
    } else if (order.status === 'cancelled') {
        // Order cancelled - hide both
        paymentInstructions.classList.add('hidden');
        paymentVerifiedNotice.classList.add('hidden');
    } else {
        // Payment pending or not uploaded - show instructions
        paymentInstructions.classList.remove('hidden');
        paymentVerifiedNotice.classList.add('hidden');
    }
}

function displayInvoiceItems(items) {
    const container = document.getElementById('invoice-items');

    if (!items || items.length === 0) {
        container.innerHTML = `
            <tr>
                <td colspan="4" class="py-4 text-center text-gray-500">
                    Tidak ada item
                </td>
            </tr>
        `;
        return;
    }

    container.innerHTML = items.map(item => `
        <tr class="border-b">
            <td class="py-3 px-4">
                <div class="font-medium">${item.product_name}</div>
                ${item.category ? `<div class="text-sm text-gray-500">${item.category}</div>` : ''}
            </td>
            <td class="py-3 px-4 text-center">${item.quantity}</td>
            <td class="py-3 px-4 text-right">${formatCurrency(item.price)}</td>
            <td class="py-3 px-4 text-right font-medium">${formatCurrency(item.subtotal)}</td>
        </tr>
    `).join('');
}

function getPaymentStatusConfig(orderStatus, payment) {
    if (payment && payment.status === 'verified') {
        return { text: 'Lunas', class: 'text-green-600' };
    } else if (payment && payment.status === 'pending') {
        return { text: 'Menunggu Verifikasi', class: 'text-amber-600' };
    } else if (orderStatus === 'cancelled') {
        return { text: 'Dibatalkan', class: 'text-red-600' };
    } else {
        return { text: 'Menunggu Pembayaran', class: 'text-yellow-600' };
    }
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    }).format(date);
}
