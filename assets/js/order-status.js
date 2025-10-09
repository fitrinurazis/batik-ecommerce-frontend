document.addEventListener("DOMContentLoaded", function () {
  function waitForDependencies() {
    if (
      typeof window.ApiService !== "undefined" &&
      typeof window.Utils !== "undefined"
    ) {
      initOrderStatus();
    } else {
      setTimeout(waitForDependencies, 100);
    }
  }

  waitForDependencies();
});

let currentOrder = null;

async function initOrderStatus() {
  try {
    // Load site settings
    await loadSiteSettings();

    // Get order ID from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get("order");

    if (!orderId) {
      showError("ID pesanan tidak ditemukan di URL");
      return;
    }

    // Load order details
    await loadOrderDetails(orderId);

    // Setup payment form
    setupPaymentForm();

    // Set footer year
    document.getElementById("footer-year").textContent =
      new Date().getFullYear();
  } catch (error) {
    console.error("Error initializing order status:", error);
    showError("Terjadi kesalahan saat memuat halaman");
  }
}

async function loadSiteSettings() {
  try {
    const settings = await window.ApiService.get("/settings/public");

    if (settings.site_name) {
      document.getElementById("site-title").textContent = settings.site_name;
      document.getElementById("footer-brand").textContent = settings.site_name;
      document.title = `Status Pesanan - ${settings.site_name}`;
    }

    if (settings.site_logo) {
      const logoImg = document.getElementById("site-logo");
      logoImg.src = settings.site_logo;
      logoImg.classList.remove("hidden");
      document.getElementById("site-logo-icon").style.display = "none";
    }
  } catch (error) {
    console.error("Error loading site settings:", error);
  }
}

async function loadOrderDetails(orderId) {
  try {
    document.getElementById("loading-state").classList.remove("hidden");
    document.getElementById("error-state").classList.add("hidden");
    document.getElementById("order-content").classList.add("hidden");

    const response = await window.ApiService.get(`/orders/track/${orderId}`);

    if (!response.order) {
      throw new Error("Order not found");
    }

    currentOrder = response.order;
    displayOrderDetails(currentOrder);

    document.getElementById("loading-state").classList.add("hidden");
    document.getElementById("order-content").classList.remove("hidden");
  } catch (error) {
    console.error("Error loading order:", error);
    document.getElementById("loading-state").classList.add("hidden");
    document.getElementById("error-state").classList.remove("hidden");

    if (error.message.includes("404")) {
      document.getElementById("error-message").textContent =
        "Pesanan tidak ditemukan. Periksa kembali ID pesanan Anda.";
    } else {
      document.getElementById("error-message").textContent =
        "Gagal memuat data pesanan. Silakan coba lagi nanti.";
    }
  }
}

function displayOrderDetails(order) {
  // Order header
  document.getElementById("order-id-display").textContent = `#${order.id}`;
  document.getElementById("order-date").textContent = formatDate(
    order.created_at
  );

  // Status badge
  const statusBadge = document.getElementById("order-status-badge");
  const statusConfig = getStatusConfig(order.status);
  statusBadge.textContent = statusConfig.text;
  statusBadge.className = `px-4 py-2 rounded-full text-sm font-semibold text-center ${statusConfig.class}`;

  // Invoice button
  const invoiceBtn = document.getElementById("view-invoice-btn");
  invoiceBtn.href = `/invoice?order=${order.id}`;

  // Status timeline
  displayStatusTimeline(order.status);

  // Order items
  displayOrderItems(order.items);

  // Order summary
  document.getElementById("order-subtotal").textContent = formatCurrency(
    order.subtotal
  );
  if (order.shipping_cost) {
    document.getElementById("order-shipping").textContent = formatCurrency(
      order.shipping_cost
    );
  } else {
    document.getElementById("shipping-cost-row").style.display = "none";
  }
  document.getElementById("order-total").textContent = formatCurrency(
    order.total
  );

  // Customer info
  document.getElementById("customer-name").textContent = order.customer_name;
  document.getElementById("customer-email").textContent = order.customer_email;
  document.getElementById("customer-phone").textContent = order.customer_phone;

  // Shipping info
  document.getElementById("shipping-address").textContent =
    order.shipping_address;
  document.getElementById(
    "shipping-city"
  ).textContent = `${order.shipping_city}, ${order.shipping_postal}`;

  // Payment section
  if (order.status === "pending" && !order.payment) {
    document.getElementById("payment-section").classList.remove("hidden");
    document.getElementById("payment-total").textContent = formatCurrency(
      order.total
    );
  } else if (order.payment) {
    displayPaymentInfo(order.payment);
  }
}

function displayStatusTimeline(currentStatus) {
  const timeline = document.getElementById("status-timeline");

  const statuses = [
    { key: "pending", icon: "fa-clock", label: "Menunggu Pembayaran" },
    { key: "processing", icon: "fa-box", label: "Sedang Diproses" },
    { key: "shipped", icon: "fa-truck", label: "Dalam Pengiriman" },
    { key: "delivered", icon: "fa-check-circle", label: "Pesanan Diterima" },
  ];

  const statusIndex = statuses.findIndex((s) => s.key === currentStatus);

  timeline.innerHTML = statuses
    .map((status, index) => {
      let statusClass = "";
      let iconClass = "";
      let lineClass = "bg-gray-300";

      if (currentStatus === "cancelled") {
        statusClass = index === 0 ? "text-red-600" : "text-gray-400";
        iconClass = index === 0 ? "bg-red-600" : "bg-gray-300";
      } else if (index < statusIndex) {
        statusClass = "text-green-600";
        iconClass = "bg-green-600";
        lineClass = "bg-green-600";
      } else if (index === statusIndex) {
        statusClass = "text-amber-600";
        iconClass = "bg-amber-600";
      } else {
        statusClass = "text-gray-400";
        iconClass = "bg-gray-300";
      }

      const showLine = index < statuses.length - 1;

      return `
            <div class="flex items-start">
                <div class="flex flex-col items-center mr-4">
                    <div class="${iconClass} w-10 h-10 rounded-full flex items-center justify-center text-white">
                        <i class="fas ${status.icon}"></i>
                    </div>
                    ${
                      showLine
                        ? `<div class="${lineClass} w-1 h-12 mt-2"></div>`
                        : ""
                    }
                </div>
                <div class="flex-1 ${
                  index < statuses.length - 1 ? "pb-8" : ""
                }">
                    <h3 class="font-semibold ${statusClass}">${
        status.label
      }</h3>
                    <p class="text-sm text-gray-500 mt-1">
                        ${getStatusDescription(
                          status.key,
                          currentStatus,
                          index,
                          statusIndex
                        )}
                    </p>
                </div>
            </div>
        `;
    })
    .join("");

  // Add cancelled status if applicable
  if (currentStatus === "cancelled") {
    timeline.innerHTML += `
            <div class="flex items-start">
                <div class="flex flex-col items-center mr-4">
                    <div class="bg-red-600 w-10 h-10 rounded-full flex items-center justify-center text-white">
                        <i class="fas fa-times-circle"></i>
                    </div>
                </div>
                <div class="flex-1">
                    <h3 class="font-semibold text-red-600">Pesanan Dibatalkan</h3>
                    <p class="text-sm text-gray-500 mt-1">
                        Pesanan telah dibatalkan. Pengembalian dana akan diproses jika pembayaran sudah dilakukan.
                    </p>
                </div>
            </div>
        `;
  }
}

function getStatusDescription(statusKey, currentStatus, index, currentIndex) {
  if (currentStatus === "cancelled") {
    return statusKey === "pending" ? "Pesanan dibatalkan" : "";
  }

  if (index < currentIndex) {
    return "✓ Selesai";
  } else if (index === currentIndex) {
    const descriptions = {
      pending: "Silakan lakukan pembayaran untuk melanjutkan pesanan",
      processing: "Pesanan sedang dikemas oleh tim kami",
      shipped: "Paket sedang dalam perjalanan ke alamat tujuan",
      delivered: "Pesanan telah diterima. Terima kasih!",
    };
    return descriptions[statusKey] || "";
  } else {
    return "Belum diproses";
  }
}

function displayOrderItems(items) {
  const container = document.getElementById("order-items");

  if (!items || items.length === 0) {
    container.innerHTML = '<p class="text-gray-500">Tidak ada item</p>';
    return;
  }

  container.innerHTML = items
    .map(
      (item) => `
        <div class="flex items-center gap-4 border-b pb-4 last:border-0">
            <div class="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                ${
                  item.image_url
                    ? `<img src="${item.image_url}" alt="${item.product_name}" class="w-full h-full object-cover">`
                    : `<div class="w-full h-full flex items-center justify-center text-gray-400">
                        <i class="fas fa-image text-2xl"></i>
                       </div>`
                }
            </div>
            <div class="flex-1 min-w-0">
                <h3 class="font-semibold text-gray-800 truncate">${
                  item.product_name
                }</h3>
                <p class="text-sm text-gray-600">Qty: ${
                  item.quantity
                } × ${formatCurrency(item.price)}</p>
            </div>
            <div class="text-right">
                <p class="font-semibold text-gray-800">${formatCurrency(
                  item.subtotal
                )}</p>
            </div>
        </div>
    `
    )
    .join("");
}

function displayPaymentInfo(payment) {
  document.getElementById("payment-section").classList.add("hidden");
  document.getElementById("payment-info-section").classList.remove("hidden");

  const methodText =
    payment.payment_method === "transfer_bank"
      ? "Transfer Bank"
      : payment.payment_method === "ewallet"
      ? "E-Wallet"
      : "Cash on Delivery";

  document.getElementById("payment-method-display").textContent = methodText;

  if (payment.bank_name) {
    document.getElementById("bank-name-display").textContent =
      payment.bank_name;
  } else {
    document.getElementById("bank-name-row").style.display = "none";
  }

  document.getElementById("payment-amount-display").textContent =
    formatCurrency(payment.amount);

  const statusText =
    payment.status === "verified"
      ? "✅ Terverifikasi"
      : payment.status === "rejected"
      ? "❌ Ditolak"
      : "⏳ Menunggu Verifikasi";
  const statusClass =
    payment.status === "verified"
      ? "text-green-600"
      : payment.status === "rejected"
      ? "text-red-600"
      : "text-amber-600";

  const statusDisplay = document.getElementById("payment-status-display");
  statusDisplay.textContent = statusText;
  statusDisplay.className = `font-semibold ${statusClass}`;
}

function setupPaymentForm() {
  const paymentMethodSelect = document.getElementById("payment-method");
  const bankFields = document.getElementById("bank-fields");

  paymentMethodSelect.addEventListener("change", function () {
    if (this.value === "transfer_bank") {
      bankFields.classList.remove("hidden");
      document.getElementById("bank-name").required = true;
      document.getElementById("account-holder").required = true;
    } else {
      bankFields.classList.add("hidden");
      document.getElementById("bank-name").required = false;
      document.getElementById("account-holder").required = false;
    }
  });

  const paymentForm = document.getElementById("payment-form");
  paymentForm.addEventListener("submit", handlePaymentSubmit);
}

async function handlePaymentSubmit(e) {
  e.preventDefault();

  const submitBtn = document.getElementById("submit-payment-btn");
  const originalText = submitBtn.innerHTML;

  try {
    submitBtn.disabled = true;
    submitBtn.innerHTML =
      '<i class="fas fa-spinner fa-spin mr-2"></i>Mengupload...';

    const formData = new FormData(e.target);

    const response = await window.ApiService.post(
      `/payments/upload/${currentOrder.id}`,
      formData,
      true
    );

    showSuccess(
      "Bukti pembayaran berhasil diupload! Tim kami akan segera memverifikasi."
    );

    // Reload order details
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  } catch (error) {
    console.error("Error uploading payment:", error);
    showError(error.message || "Gagal mengupload bukti pembayaran");
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
  }
}

function getStatusConfig(status) {
  const configs = {
    pending: {
      text: "Menunggu Pembayaran",
      class: "bg-amber-100 text-amber-800",
    },
    processing: { text: "Sedang Diproses", class: "bg-blue-100 text-blue-800" },
    shipped: {
      text: "Dalam Pengiriman",
      class: "bg-purple-100 text-purple-800",
    },
    delivered: {
      text: "Pesanan Diterima",
      class: "bg-green-100 text-green-800",
    },
    cancelled: { text: "Dibatalkan", class: "bg-red-100 text-red-800" },
  };
  return (
    configs[status] || { text: status, class: "bg-gray-100 text-gray-800" }
  );
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function showError(message) {
  if (typeof Toastify !== "undefined") {
    Toastify({
      text: message,
      duration: 4000,
      gravity: "top",
      position: "right",
      backgroundColor: "#EF4444",
      stopOnFocus: true,
    }).showToast();
  } else {
    alert(message);
  }
}

function showSuccess(message) {
  if (typeof Toastify !== "undefined") {
    Toastify({
      text: message,
      duration: 4000,
      gravity: "top",
      position: "right",
      backgroundColor: "#10B981",
      stopOnFocus: true,
    }).showToast();
  } else {
    alert(message);
  }
}
