// Payment JavaScript
document.addEventListener("DOMContentLoaded", function () {
  console.log("=== Payment page loaded ===");
  console.log("DOM fully loaded and parsed");

  // Initialize payment page
  initializePayment();
  initEventListeners();
  startCountdown();

  console.log("=== Payment page initialization completed ===");
});

// Global variables
let currentOrder = null;
let selectedPaymentMethod = null;
let paymentProofFile = null;
let countdownInterval = null;
let paymentMethods = {}; // Will be loaded from backend
let codFee = 5000; // Default COD fee

async function loadPaymentMethods() {
  console.log("=== Loading Payment Methods ===");

  try {
    // Check if ApiService exists
    if (!window.ApiService) {
      console.error("ApiService not available");
      throw new Error("ApiService tidak tersedia");
    }

    console.log("Fetching payment methods from API...");
    // Load payment methods from backend API
    const response = await window.ApiService.get("/settings/payment-methods");
    console.log("Payment methods API response:", response);

    // Extract data from response
    const data = {
      enabled_methods: response.enabled_methods || {
        bank_transfer: true,
        ewallet: false,
        cod: false,
      },
      bank_accounts: response.bank_accounts || [],
      ewallet_accounts: response.ewallet_accounts || [],
      cod_fee: response.cod_fee || 5000,
    };

    console.log("Extracted data:", data);

    // Update COD fee
    codFee = data.cod_fee || 5000;
    console.log("COD fee set to:", codFee);

    // Transform bank accounts to payment methods
    if (data.bank_accounts && Array.isArray(data.bank_accounts)) {
      console.log("Processing", data.bank_accounts.length, "bank accounts");
      data.bank_accounts.forEach((bank) => {
        paymentMethods[bank.id] = {
          id: bank.id,
          name: bank.bank_name,
          fullName: bank.bank_name,
          account: bank.account_number,
          accountHolder: bank.account_holder,
          branch: bank.branch,
          type: "bank",
          fee: 0,
          description: `Transfer ke rekening ${bank.bank_name}. Gratis biaya admin.`,
        };
        console.log("Added bank:", bank.bank_name);
      });
    }

    // Transform e-wallet accounts to payment methods
    if (data.ewallet_accounts && Array.isArray(data.ewallet_accounts)) {
      console.log("Processing", data.ewallet_accounts.length, "e-wallet accounts");
      data.ewallet_accounts.forEach((ewallet) => {
        paymentMethods[ewallet.id] = {
          id: ewallet.id,
          name: ewallet.provider,
          fullName: ewallet.provider,
          account: ewallet.account_number,
          accountHolder: ewallet.account_holder,
          type: "ewallet",
          fee: 0,
          description: `Transfer ke ${ewallet.provider}. Gratis biaya admin.`,
        };
        console.log("Added e-wallet:", ewallet.provider);
      });
    }

    // Add COD if enabled
    if (data.enabled_methods && data.enabled_methods.cod) {
      console.log("COD is enabled");
      paymentMethods["cod"] = {
        id: "cod",
        name: "COD",
        fullName: "Cash on Delivery (Bayar di Tempat)",
        type: "cod",
        fee: codFee,
        description: `Bayar saat barang diterima. Biaya layanan: Rp ${formatCurrency(
          codFee
        )}`,
      };
      console.log("Added COD payment method");
    }

    // Populate dropdown with loaded payment methods
    populatePaymentMethodDropdown(data);

    console.log("Payment methods loaded successfully:", paymentMethods);
    console.log("Total payment methods:", Object.keys(paymentMethods).length);
  } catch (error) {
    console.error("Error loading payment methods:", error);
    console.error("Error stack:", error.stack);
    showError("Gagal memuat metode pembayaran");
  }
}

function populatePaymentMethodDropdown(data) {
  const dropdown = document.getElementById("payment-method");

  // Clear existing options except the first one (placeholder)
  dropdown.innerHTML =
    '<option value="">-- Pilih Metode Pembayaran --</option>';

  // Add bank transfer options
  if (
    data.enabled_methods &&
    data.enabled_methods.bank_transfer &&
    data.bank_accounts &&
    data.bank_accounts.length > 0
  ) {
    const bankGroup = document.createElement("optgroup");
    bankGroup.label = "Transfer Bank";

    data.bank_accounts.forEach((bank) => {
      const option = document.createElement("option");
      option.value = bank.id;
      option.textContent = `${bank.bank_name} - ${bank.account_holder}`;
      bankGroup.appendChild(option);
    });

    dropdown.appendChild(bankGroup);
  }

  // Add e-wallet options
  if (
    data.enabled_methods &&
    data.enabled_methods.ewallet &&
    data.ewallet_accounts &&
    data.ewallet_accounts.length > 0
  ) {
    const ewalletGroup = document.createElement("optgroup");
    ewalletGroup.label = "E-Wallet";

    data.ewallet_accounts.forEach((ewallet) => {
      const option = document.createElement("option");
      option.value = ewallet.id;
      option.textContent = `${ewallet.provider} - ${ewallet.account_number}`;
      ewalletGroup.appendChild(option);
    });

    dropdown.appendChild(ewalletGroup);
  }

  // Add COD option
  if (data.enabled_methods && data.enabled_methods.cod) {
    const otherGroup = document.createElement("optgroup");
    otherGroup.label = "Lainnya";

    const codOption = document.createElement("option");
    codOption.value = "cod";
    codOption.textContent = `COD (Bayar di Tempat) - +${formatCurrency(
      data.cod_fee
    )}`;
    otherGroup.appendChild(codOption);

    dropdown.appendChild(otherGroup);
  }
}

async function initializePayment() {
  console.log("Initializing payment page...");

  try {
    // Load payment methods from backend first
    await loadPaymentMethods();

    // Try to get from localStorage first (priority)
    const storedOrderId = localStorage.getItem("currentOrderId");
    const storedOrder = localStorage.getItem("currentOrder");

    if (storedOrderId && storedOrder) {
      // Use localStorage data
      currentOrder = JSON.parse(storedOrder);
      displayOrderInfo(currentOrder);
      console.log("Loaded order from localStorage:", currentOrder);
    } else {
      // If no localStorage, try to get from URL parameter
      const urlParams = new URLSearchParams(window.location.search);
      const orderId = urlParams.get("order");

      if (orderId) {
        showError("Sesi pembayaran telah berakhir. Mengarahkan ke beranda...");
        setTimeout(() => {
          window.location.href = "/";
        }, 2000);
        return;
      } else {
        showError("Order tidak ditemukan. Mengarahkan ke beranda...");
        setTimeout(() => {
          window.location.href = "/";
        }, 2000);
        return;
      }
    }

    console.log("Payment page initialized successfully");
  } catch (error) {
    console.error("Error initializing payment:", error);
    showError("Gagal memuat halaman pembayaran");
  }
}

function displayOrderInfo(order) {
  // Display order number
  const orderNumber = `ORD-${order.id.toString().padStart(6, "0")}`;
  document.getElementById("order-number").textContent = orderNumber;

  // Display order date
  const orderDate = new Date(order.created_at || order.createdAt || Date.now());
  document.getElementById("order-date").textContent = formatDate(orderDate);

  // Display total
  const total = parseFloat(order.total);
  document.getElementById("order-total").textContent = formatCurrency(total);
  document.getElementById("transfer-amount").textContent =
    formatCurrency(total);
}

function initEventListeners() {
  console.log("=== Initializing Event Listeners ===");

  // Payment method selection
  const paymentMethodSelect = document.getElementById("payment-method");
  if (paymentMethodSelect) {
    console.log("Payment method select found");
    paymentMethodSelect.addEventListener("change", function () {
      const method = this.value;
      console.log("Payment method changed to:", method);
      if (method) {
        selectPaymentMethod(method);
      } else {
        hidePaymentDetails();
      }
    });
  } else {
    console.error("Payment method select NOT found");
  }

  // File upload
  const fileInput = document.getElementById("payment-proof");
  const uploadArea = document.getElementById("upload-area");

  if (fileInput) {
    console.log("File input found");
    fileInput.addEventListener("change", handleFileSelect);
  } else {
    console.error("File input NOT found");
  }

  // Drag and drop
  if (uploadArea) {
    console.log("Upload area found");
    uploadArea.addEventListener("dragover", handleDragOver);
    uploadArea.addEventListener("dragleave", handleDragLeave);
    uploadArea.addEventListener("drop", handleFileDrop);
  } else {
    console.error("Upload area NOT found");
  }

  // Confirm payment button
  const confirmBtn = document.getElementById("confirm-payment-btn");
  if (confirmBtn) {
    console.log("Confirm payment button found:", confirmBtn);
    console.log("Button disabled state:", confirmBtn.disabled);
    confirmBtn.addEventListener("click", function(e) {
      console.log("=== Confirm Payment Button Clicked ===");
      console.log("Event:", e);
      handlePaymentConfirmation();
    });
    console.log("Event listener attached to confirm button");
  } else {
    console.error("Confirm payment button NOT found");
  }

  console.log("=== Event Listeners Initialized ===");
}

function selectPaymentMethod(method) {
  console.log("=== Select Payment Method ===");
  console.log("Method ID:", method);

  selectedPaymentMethod = method;
  const methodDetails = paymentMethods[method];

  console.log("Method details:", methodDetails);

  if (!methodDetails) {
    console.error("Method details not found for:", method);
    return;
  }

  // Show payment method info
  const infoContainer = document.getElementById("payment-method-info");
  const nameElement = document.getElementById("payment-method-name");
  const descriptionElement = document.getElementById(
    "payment-method-description"
  );

  nameElement.textContent = methodDetails.fullName;
  descriptionElement.textContent = methodDetails.description;
  infoContainer.classList.remove("hidden");

  const uploadSection = document.getElementById("upload-section");
  const confirmBtn = document.getElementById("confirm-payment-btn");

  console.log("Payment type:", methodDetails.type);
  console.log("Current payment proof file:", paymentProofFile);

  // Show account details for bank and e-wallet
  if (methodDetails.type === "bank" || methodDetails.type === "ewallet") {
    console.log("Setting up bank/ewallet payment");
    displayPaymentDetails(method);
    // Show upload section
    if (uploadSection) uploadSection.classList.remove("hidden");
    // Enable confirm button only if file is uploaded
    if (confirmBtn) {
      const shouldEnable = !!paymentProofFile;
      confirmBtn.disabled = !shouldEnable;
      console.log("Confirm button disabled:", !shouldEnable, "(file uploaded:", !!paymentProofFile, ")");
    }
    // Reset total (no fee for bank transfer and e-wallet)
    resetTotal();
  } else if (methodDetails.type === "cod") {
    console.log("Setting up COD payment");
    // Hide account details for COD
    hideAccountDetails();
    // Hide upload section for COD
    if (uploadSection) uploadSection.classList.add("hidden");
    // Enable confirm button for COD (no file needed)
    if (confirmBtn) {
      confirmBtn.disabled = false;
      console.log("Confirm button enabled for COD");
    }
    // Update total with COD fee
    updateTotalWithFee(methodDetails.fee);
  }
}

function displayPaymentDetails(method) {
  const detailsContainer = document.getElementById("bank-details");
  const methodDetails = paymentMethods[method];

  if (methodDetails) {
    // Update account label
    const accountLabelElement = document.getElementById("account-label");
    const accountLabel =
      methodDetails.type === "ewallet" ? "Nomor E-Wallet" : "Nomor Rekening";
    accountLabelElement.textContent = accountLabel;

    // Update account number or phone number
    const accountNumber = document.getElementById("account-number");
    accountNumber.textContent = methodDetails.account;

    // Update account holder name
    const holderName =
      methodDetails.accountHolder || "PT Batik Windasari Indonesia";
    document.querySelector("#bank-details .text-lg").textContent = holderName;

    detailsContainer.classList.remove("hidden");
  }
}

function hideAccountDetails() {
  const detailsContainer = document.getElementById("bank-details");
  detailsContainer.classList.add("hidden");
}

function hidePaymentDetails() {
  const infoContainer = document.getElementById("payment-method-info");
  const detailsContainer = document.getElementById("bank-details");

  infoContainer.classList.add("hidden");
  detailsContainer.classList.add("hidden");
}

function resetTotal() {
  if (!currentOrder) return;

  const baseTotal = parseFloat(currentOrder.total);

  document.getElementById("order-total").textContent =
    formatCurrency(baseTotal);
  document.getElementById("transfer-amount").textContent =
    formatCurrency(baseTotal);
}

function updateTotalWithFee(fee) {
  if (!currentOrder) return;

  const baseTotal = parseFloat(currentOrder.total);
  const newTotal = baseTotal + fee;

  document.getElementById("order-total").textContent = formatCurrency(newTotal);
  document.getElementById("transfer-amount").textContent =
    formatCurrency(newTotal);
}

function handleDragOver(e) {
  e.preventDefault();
  e.stopPropagation();
  e.currentTarget.classList.add("drag-over");
}

function handleDragLeave(e) {
  e.preventDefault();
  e.stopPropagation();
  e.currentTarget.classList.remove("drag-over");
}

function handleFileDrop(e) {
  e.preventDefault();
  e.stopPropagation();
  e.currentTarget.classList.remove("drag-over");

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
  console.log("=== Processing File ===");
  console.log("File name:", file.name);
  console.log("File type:", file.type);
  console.log("File size:", file.size, "bytes");

  // Validate file type
  const validTypes = ["image/jpeg", "image/png", "application/pdf"];
  if (!validTypes.includes(file.type)) {
    const fileExt = file.name.split('.').pop().toUpperCase();
    console.error("Invalid file type:", file.type);
    showError(`Format file ${fileExt} tidak didukung. Gunakan JPG, PNG, atau PDF`);
    return;
  }

  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    console.error("File too large:", fileSizeMB, "MB");
    showError(`Ukuran file ${fileSizeMB} MB terlalu besar. Maksimal 5 MB`);
    return;
  }

  // Validate if payment method requires file upload
  const methodDetails = paymentMethods[selectedPaymentMethod];
  console.log("Current payment method:", selectedPaymentMethod, methodDetails);
  if (methodDetails && methodDetails.type === "cod") {
    console.error("COD does not require file upload");
    showError("Metode COD tidak memerlukan bukti pembayaran");
    return;
  }

  console.log("File validation passed");
  paymentProofFile = file;

  // Show preview
  showFilePreview(file);

  // Enable confirm button
  const confirmBtn = document.getElementById("confirm-payment-btn");
  if (confirmBtn) {
    confirmBtn.disabled = false;
    console.log("Confirm button enabled after file upload");
  }

  // Show success feedback
  showSuccess("File berhasil diunggah. Silakan konfirmasi pembayaran.");
}

function showFilePreview(file) {
  const placeholder = document.getElementById("upload-placeholder");
  const previewContainer = document.getElementById("preview-container");
  const previewImage = document.getElementById("preview-image");
  const fileInfo = document.getElementById("file-info");

  placeholder.classList.add("hidden");
  previewContainer.classList.remove("hidden");

  // Show image preview for image files
  if (file.type.startsWith("image/")) {
    const reader = new FileReader();
    reader.onload = function (e) {
      previewImage.src = e.target.result;
      previewImage.classList.remove("hidden");
    };
    reader.readAsDataURL(file);
  } else {
    // For PDF, show icon instead
    previewImage.src =
      "https://via.placeholder.com/200x200/EF4444/FFFFFF?text=PDF";
    previewImage.classList.remove("hidden");
  }

  // Show file info
  const fileSize = (file.size / 1024).toFixed(2);
  fileInfo.textContent = `${file.name} (${fileSize} KB)`;
}

function removePreview() {
  const placeholder = document.getElementById("upload-placeholder");
  const previewContainer = document.getElementById("preview-container");
  const fileInput = document.getElementById("payment-proof");
  const confirmBtn = document.getElementById("confirm-payment-btn");

  previewContainer.classList.add("hidden");
  placeholder.classList.remove("hidden");

  paymentProofFile = null;
  fileInput.value = "";

  // Disable confirm button only if payment method is not COD
  if (confirmBtn) {
    const methodDetails = paymentMethods[selectedPaymentMethod];
    if (methodDetails && methodDetails.type === "cod") {
      // Keep button enabled for COD
      confirmBtn.disabled = false;
    } else {
      // Disable for bank/ewallet (requires file upload)
      confirmBtn.disabled = true;
    }
  }
}

async function handlePaymentConfirmation() {
  console.log("=== Payment Confirmation Started ===");
  console.log("Selected payment method:", selectedPaymentMethod);
  console.log("Payment proof file:", paymentProofFile);
  console.log("Current order:", currentOrder);

  if (!selectedPaymentMethod) {
    console.error("No payment method selected");
    showError("Pilih metode pembayaran terlebih dahulu");
    return;
  }

  const methodDetails = paymentMethods[selectedPaymentMethod];
  console.log("Method details:", methodDetails);

  if (!methodDetails) {
    console.error("Payment method details not found");
    showError("Metode pembayaran tidak valid");
    return;
  }

  // For COD, no need to upload payment proof
  if (methodDetails.type === "cod") {
    console.log("Processing COD order");
    confirmCODOrder();
    return;
  }

  if (!paymentProofFile) {
    console.error("No payment proof file uploaded");
    showError("Upload bukti pembayaran terlebih dahulu");
    return;
  }

  if (!currentOrder) {
    console.error("Current order not found");
    showError("Data pesanan tidak ditemukan");
    return;
  }

  try {
    const button = document.getElementById("confirm-payment-btn");
    button.disabled = true;
    button.innerHTML =
      '<i class="fas fa-spinner fa-spin mr-2"></i>Memproses...';

    console.log("Preparing form data...");
    // Upload payment proof using ApiService (same as order-status.js)
    const formData = new FormData();
    formData.append("payment_proof", paymentProofFile);
    formData.append("payment_method", methodDetails.type === "bank" ? "transfer_bank" : methodDetails.type === "ewallet" ? "ewallet" : "cod");
    formData.append("bank_name", methodDetails.name || selectedPaymentMethod);

    // Calculate amount (include COD fee if applicable)
    const amount = methodDetails.type === "cod"
      ? parseFloat(currentOrder.total) + methodDetails.fee
      : parseFloat(currentOrder.total);
    formData.append("amount", amount);

    console.log("Form data prepared. Payment method:", formData.get("payment_method"));
    console.log("Bank name:", formData.get("bank_name"));
    console.log("Amount:", formData.get("amount"));

    // Check if ApiService exists
    if (!window.ApiService) {
      console.error("ApiService is not available");
      throw new Error("ApiService tidak tersedia. Pastikan main.js sudah dimuat.");
    }

    console.log("Uploading to API:", `/payments/upload/${currentOrder.id}`);
    const result = await window.ApiService.post(`/payments/upload/${currentOrder.id}`, formData, true);
    console.log("Payment proof uploaded successfully:", result);

    // Clear localStorage
    localStorage.removeItem("currentOrderId");
    localStorage.removeItem("currentOrder");
    localStorage.removeItem("cart");

    // Stop countdown
    if (countdownInterval) {
      clearInterval(countdownInterval);
    }

    // Show success modal
    showSuccessModal(result);
  } catch (error) {
    console.error("Payment confirmation error:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      response: error.response
    });
    showError(error.message || "Gagal mengkonfirmasi pembayaran");

    const button = document.getElementById("confirm-payment-btn");
    button.disabled = false;
    button.innerHTML =
      '<i class="fas fa-check-circle mr-2"></i>Konfirmasi Pembayaran';
  }
}

function confirmCODOrder() {
  console.log("=== Confirming COD Order ===");
  console.log("Current order:", currentOrder);

  // For COD, just show success message
  localStorage.removeItem("currentOrderId");
  localStorage.removeItem("currentOrder");
  localStorage.removeItem("cart");

  console.log("LocalStorage cleared");

  // Stop countdown
  if (countdownInterval) {
    clearInterval(countdownInterval);
    console.log("Countdown stopped");
  }

  // Show success modal
  const result = {
    notifications: {
      email: currentOrder.customer_email,
      phone: currentOrder.customer_phone,
    },
  };
  console.log("Showing success modal with:", result);
  showSuccessModal(result);
}

function showSuccessModal(result) {
  console.log("=== Show Success Modal ===");
  console.log("Result:", result);
  console.log("Current Order:", currentOrder);

  // Always use currentOrder data (from form checkout)
  const emailElement = document.getElementById("notif-email");
  const phoneElement = document.getElementById("notif-phone");

  if (emailElement && currentOrder) {
    // Priority: currentOrder data (from checkout form) -> result.notifications -> fallback
    const email = currentOrder.customer_email ||
                  (result.notifications && result.notifications.email) ||
                  "email@example.com";
    emailElement.textContent = email;
    console.log("Email set to:", email);
  }

  if (phoneElement && currentOrder) {
    // Priority: currentOrder data (from checkout form) -> result.notifications -> fallback
    const phone = currentOrder.customer_phone ||
                  (result.notifications && result.notifications.phone) ||
                  "+62 8xx-xxxx-xxxx";
    phoneElement.textContent = phone;
    console.log("Phone set to:", phone);
  }

  // Show modal
  const modal = document.getElementById("success-modal");
  if (modal) {
    modal.classList.remove("hidden");
    modal.classList.add("flex");
    console.log("Success modal displayed");
  } else {
    console.error("Success modal element not found");
  }
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
      document.getElementById("countdown-timer").textContent = "00:00:00";
      showError("Waktu pembayaran telah habis. Pesanan dibatalkan.");
      setTimeout(() => {
        window.location.href = "/";
      }, 3000);
      return;
    }

    const hours = Math.floor(
      (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    document.getElementById("countdown-timer").textContent = `${String(
      hours
    ).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(
      seconds
    ).padStart(2, "0")}`;
  }, 1000);
}

function copyAccountNumber() {
  const accountNumber = document.getElementById("account-number").textContent;
  copyToClipboard(accountNumber);
  showSuccess("Nomor rekening berhasil disalin");
}

function copyTransferAmount() {
  const transferAmount = document.getElementById("transfer-amount").textContent;
  const amountOnly = transferAmount.replace(/[^\d]/g, "");
  copyToClipboard(amountOnly);
  showSuccess("Jumlah transfer berhasil disalin");
}

function copyToClipboard(text) {
  const tempInput = document.createElement("input");
  tempInput.value = text;
  document.body.appendChild(tempInput);
  tempInput.select();
  document.execCommand("copy");
  document.body.removeChild(tempInput);
}

function goToHome() {
  window.location.href = "/";
}

// Utility functions
function formatCurrency(amount) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function showSuccess(message) {
  if (typeof Toastify !== "undefined") {
    Toastify({
      text: message,
      style: {
        background: "#10B981",
      },
      duration: 3000,
      close: true,
    }).showToast();
  }
}

function showError(message) {
  if (typeof Toastify !== "undefined") {
    Toastify({
      text: message,
      style: {
        background: "#EF4444",
      },
      duration: 4000,
      close: true,
    }).showToast();
  }
}

// Make functions globally accessible
window.copyAccountNumber = copyAccountNumber;
window.copyTransferAmount = copyTransferAmount;
window.removePreview = removePreview;
window.goToHome = goToHome;
