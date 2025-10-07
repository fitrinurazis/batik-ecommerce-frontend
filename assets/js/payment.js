// Payment JavaScript
document.addEventListener('DOMContentLoaded', function() {
    console.log('Payment page loaded');

    // Initialize payment page
    initializePayment();
    initEventListeners();
    startCountdown();
});

// Global variables
let currentOrder = null;
let selectedPaymentMethod = null;
let paymentProofFile = null;
let countdownInterval = null;
let paymentMethods = {}; // Will be loaded from backend
let codFee = 5000; // Default COD fee

async function loadPaymentMethods() {
    try {
        const response = await fetch('http://localhost:3000/api/settings/payment-methods');

        if (!response.ok) {
            throw new Error('Gagal mengambil data metode pembayaran');
        }

        const data = await response.json();

        // Update COD fee
        codFee = data.cod_fee || 5000;

        // Transform bank accounts to payment methods
        if (data.bank_accounts && Array.isArray(data.bank_accounts)) {
            data.bank_accounts.forEach(bank => {
                paymentMethods[bank.id] = {
                    id: bank.id,
                    name: bank.bank_name,
                    fullName: bank.bank_name,
                    account: bank.account_number,
                    accountHolder: bank.account_holder,
                    branch: bank.branch,
                    type: 'bank',
                    fee: 0,
                    description: `Transfer ke rekening ${bank.bank_name}. Gratis biaya admin.`
                };
            });
        }

        // Transform e-wallet accounts to payment methods
        if (data.ewallet_accounts && Array.isArray(data.ewallet_accounts)) {
            data.ewallet_accounts.forEach(ewallet => {
                paymentMethods[ewallet.id] = {
                    id: ewallet.id,
                    name: ewallet.provider,
                    fullName: ewallet.provider,
                    account: ewallet.account_number,
                    accountHolder: ewallet.account_holder,
                    type: 'ewallet',
                    fee: 0,
                    description: `Transfer ke ${ewallet.provider}. Gratis biaya admin.`
                };
            });
        }

        // Add COD if enabled
        if (data.enabled_methods && data.enabled_methods.cod) {
            paymentMethods['cod'] = {
                id: 'cod',
                name: 'COD',
                fullName: 'Cash on Delivery (Bayar di Tempat)',
                type: 'cod',
                fee: codFee,
                description: `Bayar saat barang diterima. Biaya layanan: Rp ${formatCurrency(codFee)}`
            };
        }

        // Populate dropdown with loaded payment methods
        populatePaymentMethodDropdown(data);

        console.log('Payment methods loaded:', paymentMethods);

    } catch (error) {
        console.error('Error loading payment methods:', error);
        showError('Gagal memuat metode pembayaran');
    }
}

function populatePaymentMethodDropdown(data) {
    const dropdown = document.getElementById('payment-method');

    // Clear existing options except the first one (placeholder)
    dropdown.innerHTML = '<option value="">-- Pilih Metode Pembayaran --</option>';

    // Add bank transfer options
    if (data.enabled_methods && data.enabled_methods.bank_transfer && data.bank_accounts && data.bank_accounts.length > 0) {
        const bankGroup = document.createElement('optgroup');
        bankGroup.label = 'Transfer Bank';

        data.bank_accounts.forEach(bank => {
            const option = document.createElement('option');
            option.value = bank.id;
            option.textContent = `${bank.bank_name} - ${bank.account_holder}`;
            bankGroup.appendChild(option);
        });

        dropdown.appendChild(bankGroup);
    }

    // Add e-wallet options
    if (data.enabled_methods && data.enabled_methods.ewallet && data.ewallet_accounts && data.ewallet_accounts.length > 0) {
        const ewalletGroup = document.createElement('optgroup');
        ewalletGroup.label = 'E-Wallet';

        data.ewallet_accounts.forEach(ewallet => {
            const option = document.createElement('option');
            option.value = ewallet.id;
            option.textContent = `${ewallet.provider} - ${ewallet.account_number}`;
            ewalletGroup.appendChild(option);
        });

        dropdown.appendChild(ewalletGroup);
    }

    // Add COD option
    if (data.enabled_methods && data.enabled_methods.cod) {
        const otherGroup = document.createElement('optgroup');
        otherGroup.label = 'Lainnya';

        const codOption = document.createElement('option');
        codOption.value = 'cod';
        codOption.textContent = `COD (Bayar di Tempat) - +${formatCurrency(data.cod_fee)}`;
        otherGroup.appendChild(codOption);

        dropdown.appendChild(otherGroup);
    }
}

async function initializePayment() {
    console.log('Initializing payment page...');

    try {
        // Load payment methods from backend first
        await loadPaymentMethods();

        // Try to get from localStorage first (priority)
        const storedOrderId = localStorage.getItem('currentOrderId');
        const storedOrder = localStorage.getItem('currentOrder');

        if (storedOrderId && storedOrder) {
            // Use localStorage data
            currentOrder = JSON.parse(storedOrder);
            displayOrderInfo(currentOrder);
            console.log('Loaded order from localStorage:', currentOrder);
        } else {
            // If no localStorage, try to get from URL parameter
            const urlParams = new URLSearchParams(window.location.search);
            const orderId = urlParams.get('order');

            if (orderId) {
                showError('Sesi pembayaran telah berakhir. Mengarahkan ke beranda...');
                setTimeout(() => {
                    window.location.href = '/';
                }, 2000);
                return;
            } else {
                showError('Order tidak ditemukan. Mengarahkan ke beranda...');
                setTimeout(() => {
                    window.location.href = '/';
                }, 2000);
                return;
            }
        }

        console.log('Payment page initialized successfully');

    } catch (error) {
        console.error('Error initializing payment:', error);
        showError('Gagal memuat halaman pembayaran');
    }
}

function displayOrderInfo(order) {
    // Display order number
    const orderNumber = `ORD-${order.id.toString().padStart(6, '0')}`;
    document.getElementById('order-number').textContent = orderNumber;

    // Display order date
    const orderDate = new Date(order.created_at || order.createdAt || Date.now());
    document.getElementById('order-date').textContent = formatDate(orderDate);

    // Display total
    const total = parseFloat(order.total);
    document.getElementById('order-total').textContent = formatCurrency(total);
    document.getElementById('transfer-amount').textContent = formatCurrency(total);
}

function initEventListeners() {
    // Payment method selection
    const paymentMethodSelect = document.getElementById('payment-method');
    if (paymentMethodSelect) {
        paymentMethodSelect.addEventListener('change', function() {
            const method = this.value;
            if (method) {
                selectPaymentMethod(method);
            } else {
                hidePaymentDetails();
            }
        });
    }

    // File upload
    const fileInput = document.getElementById('payment-proof');
    const uploadArea = document.getElementById('upload-area');

    fileInput.addEventListener('change', handleFileSelect);

    // Drag and drop
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleFileDrop);

    // Confirm payment button
    document.getElementById('confirm-payment-btn').addEventListener('click', handlePaymentConfirmation);
}

function selectPaymentMethod(method) {
    selectedPaymentMethod = method;
    const methodDetails = paymentMethods[method];

    if (!methodDetails) return;

    // Show payment method info
    const infoContainer = document.getElementById('payment-method-info');
    const nameElement = document.getElementById('payment-method-name');
    const descriptionElement = document.getElementById('payment-method-description');

    nameElement.textContent = methodDetails.fullName;
    descriptionElement.textContent = methodDetails.description;
    infoContainer.classList.remove('hidden');

    const uploadSection = document.getElementById('upload-section');
    const confirmBtn = document.getElementById('confirm-payment-btn');

    // Show account details for bank and e-wallet
    if (methodDetails.type === 'bank' || methodDetails.type === 'ewallet') {
        displayPaymentDetails(method);
        // Show upload section
        if (uploadSection) uploadSection.classList.remove('hidden');
        // Disable confirm button until file is uploaded
        confirmBtn.disabled = !paymentProofFile;
        // Reset total (no fee for bank transfer and e-wallet)
        resetTotal();
    } else if (methodDetails.type === 'cod') {
        // Hide account details for COD
        hideAccountDetails();
        // Hide upload section for COD
        if (uploadSection) uploadSection.classList.add('hidden');
        // Enable confirm button for COD (no file needed)
        confirmBtn.disabled = false;
        // Update total with COD fee
        updateTotalWithFee(methodDetails.fee);
    }
}

function displayPaymentDetails(method) {
    const detailsContainer = document.getElementById('bank-details');
    const methodDetails = paymentMethods[method];

    if (methodDetails) {
        // Update account label
        const accountLabelElement = document.getElementById('account-label');
        const accountLabel = methodDetails.type === 'ewallet' ? 'Nomor E-Wallet' : 'Nomor Rekening';
        accountLabelElement.textContent = accountLabel;

        // Update account number or phone number
        const accountNumber = document.getElementById('account-number');
        accountNumber.textContent = methodDetails.account;

        // Update account holder name
        const holderName = methodDetails.accountHolder || 'PT Batik Nusantara Indonesia';
        document.querySelector('#bank-details .text-lg').textContent = holderName;

        detailsContainer.classList.remove('hidden');
    }
}

function hideAccountDetails() {
    const detailsContainer = document.getElementById('bank-details');
    detailsContainer.classList.add('hidden');
}

function hidePaymentDetails() {
    const infoContainer = document.getElementById('payment-method-info');
    const detailsContainer = document.getElementById('bank-details');

    infoContainer.classList.add('hidden');
    detailsContainer.classList.add('hidden');
}

function resetTotal() {
    if (!currentOrder) return;

    const baseTotal = parseFloat(currentOrder.total);

    document.getElementById('order-total').textContent = formatCurrency(baseTotal);
    document.getElementById('transfer-amount').textContent = formatCurrency(baseTotal);
}

function updateTotalWithFee(fee) {
    if (!currentOrder) return;

    const baseTotal = parseFloat(currentOrder.total);
    const newTotal = baseTotal + fee;

    document.getElementById('order-total').textContent = formatCurrency(newTotal);
    document.getElementById('transfer-amount').textContent = formatCurrency(newTotal);
}

function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.add('drag-over');
}

function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('drag-over');
}

function handleFileDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('drag-over');

    const files = e.dataTransfer.files;
    if (files.length > 0) {
        processFile(files[0]);
    }
}

function handleFileSelect(e) {
    const files = e.target.files;
    if (files.length > 0) {
        processFile(files[0]);
    }
}

function processFile(file) {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
        showError('Format file tidak didukung. Gunakan JPG, PNG, atau PDF');
        return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
        showError('Ukuran file terlalu besar. Maksimal 5MB');
        return;
    }

    paymentProofFile = file;

    // Show preview
    showFilePreview(file);

    // Enable confirm button
    document.getElementById('confirm-payment-btn').disabled = false;
}

function showFilePreview(file) {
    const placeholder = document.getElementById('upload-placeholder');
    const previewContainer = document.getElementById('preview-container');
    const previewImage = document.getElementById('preview-image');
    const fileInfo = document.getElementById('file-info');

    placeholder.classList.add('hidden');
    previewContainer.classList.remove('hidden');

    // Show image preview for image files
    if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function(e) {
            previewImage.src = e.target.result;
            previewImage.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    } else {
        // For PDF, show icon instead
        previewImage.src = 'https://via.placeholder.com/200x200/EF4444/FFFFFF?text=PDF';
        previewImage.classList.remove('hidden');
    }

    // Show file info
    const fileSize = (file.size / 1024).toFixed(2);
    fileInfo.textContent = `${file.name} (${fileSize} KB)`;
}

function removePreview() {
    const placeholder = document.getElementById('upload-placeholder');
    const previewContainer = document.getElementById('preview-container');
    const fileInput = document.getElementById('payment-proof');

    previewContainer.classList.add('hidden');
    placeholder.classList.remove('hidden');

    paymentProofFile = null;
    fileInput.value = '';

    // Disable confirm button
    document.getElementById('confirm-payment-btn').disabled = true;
}

async function handlePaymentConfirmation() {
    if (!selectedPaymentMethod) {
        showError('Pilih metode pembayaran terlebih dahulu');
        return;
    }

    const methodDetails = paymentMethods[selectedPaymentMethod];

    // For COD, no need to upload payment proof
    if (methodDetails.type === 'cod') {
        confirmCODOrder();
        return;
    }

    if (!paymentProofFile) {
        showError('Upload bukti pembayaran terlebih dahulu');
        return;
    }

    if (!currentOrder) {
        showError('Data pesanan tidak ditemukan');
        return;
    }

    try {
        const button = document.getElementById('confirm-payment-btn');
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Memproses...';

        // Upload payment proof
        const formData = new FormData();
        formData.append('payment_proof', paymentProofFile);
        formData.append('order_id', currentOrder.id);
        formData.append('bank', selectedPaymentMethod);

        // Convert payment method type to backend ENUM format
        const paymentMethodType = methodDetails.type === 'bank' ? 'transfer_bank' :
                                   methodDetails.type === 'ewallet' ? 'ewallet' : 'cod';
        formData.append('payment_method', paymentMethodType);

        const response = await fetch('http://localhost:3000/api/orders/payment', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Gagal mengunggah bukti pembayaran');
        }

        const result = await response.json();
        console.log('Payment proof uploaded successfully:', result);

        // Clear localStorage
        localStorage.removeItem('currentOrderId');
        localStorage.removeItem('currentOrder');
        localStorage.removeItem('cart');

        // Stop countdown
        if (countdownInterval) {
            clearInterval(countdownInterval);
        }

        // Show success modal
        showSuccessModal(result);

    } catch (error) {
        console.error('Payment confirmation error:', error);
        showError(error.message || 'Gagal mengkonfirmasi pembayaran');

        const button = document.getElementById('confirm-payment-btn');
        button.disabled = false;
        button.innerHTML = '<i class="fas fa-check-circle mr-2"></i>Konfirmasi Pembayaran';
    }
}

function confirmCODOrder() {
    // For COD, just show success message
    localStorage.removeItem('currentOrderId');
    localStorage.removeItem('currentOrder');
    localStorage.removeItem('cart');

    // Stop countdown
    if (countdownInterval) {
        clearInterval(countdownInterval);
    }

    // Show success modal
    const result = {
        notifications: {
            email: currentOrder.customer_email,
            phone: currentOrder.customer_phone
        }
    };
    showSuccessModal(result);
}

function showSuccessModal(result) {
    // Update modal with notification info
    if (result.notifications) {
        document.getElementById('notif-email').textContent = result.notifications.email || currentOrder.customer_email;
        document.getElementById('notif-phone').textContent = result.notifications.phone || currentOrder.customer_phone;
    }

    // Show modal
    const modal = document.getElementById('success-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function startCountdown() {
    // Set countdown to 24 hours from order creation
    const expiryTime = new Date();
    expiryTime.setHours(expiryTime.getHours() + 24);

    countdownInterval = setInterval(() => {
        const now = new Date().getTime();
        const distance = expiryTime.getTime() - now;

        if (distance < 0) {
            clearInterval(countdownInterval);
            document.getElementById('countdown-timer').textContent = '00:00:00';
            showError('Waktu pembayaran telah habis. Pesanan dibatalkan.');
            setTimeout(() => {
                window.location.href = '/';
            }, 3000);
            return;
        }

        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        document.getElementById('countdown-timer').textContent =
            `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }, 1000);
}

function copyAccountNumber() {
    const accountNumber = document.getElementById('account-number').textContent;
    copyToClipboard(accountNumber);
    showSuccess('Nomor rekening berhasil disalin');
}

function copyTransferAmount() {
    const transferAmount = document.getElementById('transfer-amount').textContent;
    const amountOnly = transferAmount.replace(/[^\d]/g, '');
    copyToClipboard(amountOnly);
    showSuccess('Jumlah transfer berhasil disalin');
}

function copyToClipboard(text) {
    const tempInput = document.createElement('input');
    tempInput.value = text;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);
}

function goToHome() {
    window.location.href = '/';
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

function formatDate(date) {
    return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}

function showSuccess(message) {
    if (typeof Toastify !== 'undefined') {
        Toastify({
            text: message,
            style: {
                background: '#10B981'
            },
            duration: 3000,
            close: true
        }).showToast();
    }
}

function showError(message) {
    if (typeof Toastify !== 'undefined') {
        Toastify({
            text: message,
            style: {
                background: '#EF4444'
            },
            duration: 4000,
            close: true
        }).showToast();
    }
}

// Make functions globally accessible
window.copyAccountNumber = copyAccountNumber;
window.copyTransferAmount = copyTransferAmount;
window.removePreview = removePreview;
window.goToHome = goToHome;
