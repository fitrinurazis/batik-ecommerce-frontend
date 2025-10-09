// Order Management Script

let currentOrder = null;
let orderFilters = {};
let orderPage = 1;
let statusModalOrderId = null;
let statusModalCurrentStatus = null;
let currentPayment = null;

// Initialize order management functionality
function initOrderManagement() {
  initOrderFilters();
  initOrderActions();
  initStatusModal();
  initPaymentModal();
  loadOrdersData();
}

function initOrderFilters() {
  // Status filter
  const statusFilter = document.getElementById("status-filter");
  if (statusFilter) {
    statusFilter.addEventListener("change", async (e) => {
      orderFilters.status = e.target.value;
      orderPage = 1;
      await loadOrdersData();
    });
  }

  // Date filter
  const dateFilter = document.getElementById("date-filter");
  if (dateFilter) {
    dateFilter.addEventListener("change", async (e) => {
      orderFilters.date = e.target.value;
      orderPage = 1;
      await loadOrdersData();

      // Show custom date inputs if 'custom' is selected
      if (e.target.value === "custom") {
        showCustomDateFilter();
      } else {
        hideCustomDateFilter();
      }
    });
  }

  // Payment filter
  const paymentFilter = document.getElementById("payment-filter");
  if (paymentFilter) {
    paymentFilter.addEventListener("change", async (e) => {
      orderFilters.payment_status = e.target.value;
      orderPage = 1;
      await loadOrdersData();
    });
  }

  // Search orders
  const searchOrders = document.getElementById("search-orders");
  if (searchOrders) {
    const debouncedSearch = Utils.debounce(async (query) => {
      orderFilters.search = query;
      orderPage = 1;
      await loadOrdersData();
    }, 500);

    searchOrders.addEventListener("input", (e) => {
      debouncedSearch(e.target.value);
    });
  }

  // Export orders button
  const exportBtn = document.getElementById("export-orders");
  if (exportBtn) {
    exportBtn.addEventListener("click", handleExportOrders);
  }

  // Refresh orders button
  const refreshBtn = document.getElementById("refresh-orders");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", async () => {
      Utils.setLoading(refreshBtn, true, "Memperbarui...");
      try {
        await loadOrdersData();
        Utils.showAlert("Data pesanan diperbarui", "success");
      } catch (error) {
        Utils.showAlert("Gagal memperbarui data", "error");
      } finally {
        Utils.setLoading(refreshBtn, false);
      }
    });
  }
}

function initOrderActions() {
  // Order pagination
  const prevBtn = document.getElementById("orders-prev-page");
  const nextBtn = document.getElementById("orders-next-page");

  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      if (orderPage > 1) {
        orderPage--;
        loadOrdersData();
      }
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      orderPage++;
      loadOrdersData();
    });
  }

  // Modal close buttons
  const closeModalBtns = document.querySelectorAll(
    "#close-order-modal, #close-order-detail"
  );
  closeModalBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const modal = document.getElementById("order-detail-modal");
      if (modal) modal.classList.add("hidden");
    });
  });

  // Close modal on backdrop click
  const modal = document.getElementById("order-detail-modal");
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.classList.add("hidden");
      }
    });
  }
}

async function loadOrdersData() {
  const tableBody = document.getElementById("orders-table-body");
  if (!tableBody) return;

  try {
    // Show loading state
    tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-4 text-center text-gray-500">
                    <div class="flex flex-col items-center justify-center py-4">
                        <i class="fas fa-spinner fa-spin text-amber-600 text-2xl mb-2"></i>
                        <p>Memuat data pesanan...</p>
                    </div>
                </td>
            </tr>
        `;

    const params = {
      page: orderPage,
      limit: window.ITEMS_PER_PAGE || 10,
      ...orderFilters,
    };

    const response = await ApiService.getOrders(params);

    // Backend returns {data: [...], pagination: {...}}
    const orders = response.data || [];
    const pagination = response.pagination;

    if (orders && orders.length > 0) {
      renderOrdersTable(orders);
      if (pagination) {
        updateOrdersPagination(pagination);
      }
    } else {
      tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="px-6 py-4 text-center text-gray-500">
                        <div class="flex flex-col items-center justify-center py-4">
                            <i class="fas fa-shopping-cart text-gray-400 text-3xl mb-2"></i>
                            <p>Tidak ada pesanan ditemukan</p>
                        </div>
                    </td>
                </tr>
            `;
    }
  } catch (error) {
    console.error("Error loading orders:", error);

    let errorMessage = "Gagal memuat data pesanan";
    if (error.message.includes("401") || error.message.includes("Token")) {
      errorMessage = "Silahkan login terlebih dahulu";
    } else if (
      error.message.includes("Network") ||
      error.message.includes("fetch")
    ) {
      errorMessage = "Tidak dapat terhubung ke server";
    }

    tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-4 text-center text-red-500">
                    <div class="flex flex-col items-center justify-center py-4">
                        <i class="fas fa-exclamation-triangle text-red-400 text-2xl mb-2"></i>
                        <p>${errorMessage}</p>
                        ${
                          error.message.includes("401") ||
                          error.message.includes("Token")
                            ? '<a href="admin-login.html" class="text-blue-600 hover:text-blue-800 mt-2 inline-block">Login Sekarang</a>'
                            : '<button onclick="loadOrdersData()" class="text-blue-600 hover:text-blue-800 mt-2">Coba Lagi</button>'
                        }
                    </div>
                </td>
            </tr>
        `;
  }
}

function renderOrdersTable(orders) {
  const tableBody = document.getElementById("orders-table-body");
  if (!tableBody) return;

  tableBody.innerHTML = orders
    .map((order) => {
      const paymentBadge = getPaymentBadge(order.payment);
      return `
        <tr class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                #${order.id}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">${
                  order.customer_name || "-"
                }</div>
                <div class="text-sm text-gray-500">${
                  order.customer_email || "-"
                }</div>
                ${
                  order.customer_phone
                    ? `<div class="text-sm text-gray-500">${order.customer_phone}</div>`
                    : ""
                }
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <div>${Utils.formatDateShort(order.created_at)}</div>
                <div class="text-xs text-gray-500">${new Date(
                  order.created_at
                ).toLocaleTimeString("id-ID")}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <div class="font-medium">${Utils.formatCurrency(
                  order.total
                )}</div>
                <div class="text-xs text-gray-500">${
                  order.items ? order.items.length : 0
                } item</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                ${Utils.getStatusBadge(order.status)}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                ${paymentBadge}
                ${
                  order.payment &&
                  (order.payment.payment_status === "pending" ||
                    order.payment.status === "pending")
                    ? `
                    <button onclick="viewPaymentProof(${order.id})"
                            class="text-xs text-blue-600 hover:text-blue-800 mt-1 block">
                        Lihat Bukti
                    </button>
                `
                    : ""
                }
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div class="flex justify-end space-x-2">
                    <button onclick="viewOrderDetail(${order.id})"
                            class="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition"
                            title="Lihat Detail">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button onclick="editOrderStatus(${order.id}, '${
        order.status
      }')"
                            class="text-amber-600 hover:text-amber-900 p-1 rounded hover:bg-amber-50 transition"
                            title="Update Status">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="printInvoice(${order.id})"
                            class="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50 transition"
                            title="Cetak Invoice">
                        <i class="fas fa-print"></i>
                    </button>
                </div>
            </td>
        </tr>
        `;
    })
    .join("");
}

function updateOrdersPagination(pagination) {
  if (!pagination) return;

  // Update pagination info
  const startElement = document.getElementById("orders-showing-start");
  const endElement = document.getElementById("orders-showing-end");
  const totalElement = document.getElementById("orders-total-items");

  if (startElement) startElement.textContent = pagination.offset + 1;
  if (endElement)
    endElement.textContent = Math.min(
      pagination.offset + pagination.limit,
      pagination.total
    );
  if (totalElement) totalElement.textContent = pagination.total;

  // Update pagination buttons
  const prevBtn = document.getElementById("orders-prev-page");
  const nextBtn = document.getElementById("orders-next-page");

  if (prevBtn) {
    prevBtn.disabled = pagination.page <= 1;
    prevBtn.classList.toggle("opacity-50", pagination.page <= 1);
  }

  if (nextBtn) {
    nextBtn.disabled = pagination.page >= pagination.totalPages;
    nextBtn.classList.toggle(
      "opacity-50",
      pagination.page >= pagination.totalPages
    );
  }
}

// Order detail modal functions
async function viewOrderDetail(orderId) {
  try {
    Utils.showAlert("Memuat detail pesanan...", "info", 2000);
    const order = await ApiService.getOrder(orderId);
    currentOrder = order;

    // Load payment data separately to get the latest info including payment_proof
    let paymentData = null;
    try {
      paymentData = await ApiService.getPaymentByOrder(orderId);
    } catch (error) {
      console.log("No payment data for this order:", error);
    }

    displayOrderDetail(order, paymentData);

    const modal = document.getElementById("order-detail-modal");
    if (modal) modal.classList.remove("hidden");
  } catch (error) {
    console.error("Error loading order detail:", error);
    Utils.showAlert("Gagal memuat detail pesanan", "error");
  }
}

function displayOrderDetail(order, paymentData = null) {
  // Update order info
  updateElement("order-id", order.id);
  updateElement("customer-name", order.customer_name);
  updateElement("customer-email", order.customer_email);
  updateElement("customer-phone", order.customer_phone || "-");

  // Update shipping info
  updateElement("shipping-address", order.shipping_address);
  updateElement("shipping-city", order.shipping_city);
  updateElement("shipping-postal", order.shipping_postal);
  updateElement("shipping-method", order.shipping_method || "Standar");

  // Update totals
  updateElement("order-subtotal", Utils.formatCurrency(order.subtotal));
  updateElement("order-shipping", Utils.formatCurrency(order.shipping_cost));
  updateElement("order-total", Utils.formatCurrency(order.total));

  // Update status
  const statusElement = document.getElementById("current-status");
  if (statusElement) {
    statusElement.innerHTML = Utils.getStatusBadge(order.status);
  }

  const statusSelect = document.getElementById("update-status");
  if (statusSelect) {
    statusSelect.value = order.status;
  }

  // Render order items
  renderOrderItems(order.items || []);

  // Display payment info with the payment data from API
  displayPaymentInfo(order, paymentData);

  // Setup save status button
  const saveStatusBtn = document.getElementById("save-status");
  if (saveStatusBtn) {
    saveStatusBtn.onclick = () => saveOrderStatus(order.id);
  }

  // Setup print invoice button
  const printBtn = document.getElementById("print-invoice");
  if (printBtn) {
    printBtn.onclick = () => printInvoice(order.id);
  }
}

function displayPaymentInfo(order, paymentData = null) {
  const contentDiv = document.getElementById("payment-info-content");
  if (!contentDiv) return;

  // Use paymentData from API if available, otherwise fallback to order.payment
  const payment = paymentData || order.payment;

  if (payment) {
    const status = payment.payment_status || payment.status;

    contentDiv.innerHTML = `
            <div class="flex items-center justify-between mb-4">
                <div>
                    <p class="text-sm text-gray-600 mb-1">Status Pembayaran:</p>
                    <div>${getPaymentBadge(payment)}</div>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-4 text-sm mb-4">
                <div>
                    <p class="text-gray-600 mb-1">Metode Pembayaran:</p>
                    <p class="font-medium">${payment.payment_method || "-"}</p>
                </div>
                <div>
                    <p class="text-gray-600 mb-1">Jumlah Transfer:</p>
                    <p class="font-medium text-green-600">${Utils.formatCurrency(
                      payment.amount
                    )}</p>
                </div>
                ${
                  payment.bank_name
                    ? `
                <div>
                    <p class="text-gray-600 mb-1">Bank:</p>
                    <p class="font-medium">${payment.bank_name}</p>
                </div>
                `
                    : ""
                }
                ${
                  payment.account_holder
                    ? `
                <div>
                    <p class="text-gray-600 mb-1">Atas Nama:</p>
                    <p class="font-medium">${payment.account_holder}</p>
                </div>
                `
                    : ""
                }
                ${
                  payment.payment_date
                    ? `
                <div>
                    <p class="text-gray-600 mb-1">Tanggal Transfer:</p>
                    <p class="font-medium">${Utils.formatDateShort(
                      payment.payment_date
                    )}</p>
                </div>
                `
                    : ""
                }
                ${
                  payment.created_at
                    ? `
                <div>
                    <p class="text-gray-600 mb-1">Diupload:</p>
                    <p class="font-medium">${Utils.formatDateShort(
                      payment.created_at
                    )}</p>
                </div>
                `
                    : ""
                }
            </div>

            ${
              payment.notes
                ? `
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                <p class="text-sm text-blue-600 font-medium mb-1">
                    <i class="fas fa-comment mr-1"></i> Catatan dari Pelanggan:
                </p>
                <p class="text-sm text-blue-800">${payment.notes}</p>
            </div>
            `
                : ""
            }

            ${
              payment.payment_proof
                ? `
            <div class="mb-3">
                <p class="text-sm text-gray-600 font-medium mb-2">
                    <i class="fas fa-image mr-1"></i> Bukti Transfer:
                </p>
                <div class="relative">
                    <img src="${getImageUrl(payment.payment_proof)}"
                         alt="Bukti Transfer"
                         class="w-full max-w-md border-2 border-gray-300 rounded-lg shadow-md cursor-pointer hover:border-blue-500 transition"
                         onclick="viewPaymentProof(${order.id})"
                         onerror="this.parentElement.innerHTML='<div class=\'bg-red-50 border border-red-200 rounded-lg p-4 text-center\'><i class=\'fas fa-exclamation-triangle text-red-500 text-2xl mb-2\'></i><p class=\'text-sm text-red-600\'>Gambar tidak dapat dimuat</p></div>'">
                    <div class="absolute top-2 right-2">
                        <button onclick="viewPaymentProof(${order.id})"
                                class="bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-700 px-2 py-1 rounded-md text-xs shadow-md transition">
                            <i class="fas fa-expand-alt mr-1"></i> Perbesar
                        </button>
                    </div>
                </div>
            </div>
            `
                : ""
            }

            ${
              status === "pending" && payment.payment_proof
                ? `
            <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                <p class="text-sm text-yellow-700 font-medium mb-2">
                    <i class="fas fa-clock mr-1"></i> Menunggu Verifikasi
                </p>
                <p class="text-xs text-yellow-600 mb-3">
                    Bukti pembayaran telah diupload dan menunggu verifikasi admin. Silakan cek bukti transfer di atas.
                </p>
                <div class="flex space-x-2">
                    <button onclick="viewPaymentProof(${order.id}); setTimeout(() => document.getElementById('verify-payment-btn').click(), 300)"
                            class="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-md text-xs transition flex-1">
                        <i class="fas fa-check mr-1"></i> Verifikasi Sekarang
                    </button>
                    <button onclick="viewPaymentProof(${order.id}); setTimeout(() => document.getElementById('reject-payment-btn').click(), 300)"
                            class="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-md text-xs transition flex-1">
                        <i class="fas fa-times mr-1"></i> Tolak
                    </button>
                </div>
            </div>
            `
                : ""
            }

            ${
              status === "verified" && payment.verified_at
                ? `
            <div class="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                <p class="text-sm text-green-600 font-medium mb-1">
                    <i class="fas fa-check-circle mr-1"></i> Pembayaran Terverifikasi
                </p>
                <p class="text-xs text-green-700">Diverifikasi pada ${Utils.formatDate(
                  payment.verified_at
                )}</p>
            </div>
            `
                : ""
            }

            ${
              status === "rejected" && payment.rejection_reason
                ? `
            <div class="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                <p class="text-sm text-red-600 font-medium mb-1">
                    <i class="fas fa-times-circle mr-1"></i> Pembayaran Ditolak
                </p>
                <p class="text-sm text-red-800 mb-1"><strong>Alasan:</strong> ${
                  payment.rejection_reason
                }</p>
                ${
                  payment.verified_at
                    ? `<p class="text-xs text-red-700">Ditolak pada ${Utils.formatDate(
                        payment.verified_at
                      )}</p>`
                    : ""
                }
                <p class="text-xs text-red-600 mt-2">
                    <i class="fas fa-info-circle mr-1"></i> Pelanggan perlu mengupload ulang bukti transfer yang valid.
                </p>
            </div>
            `
                : ""
            }
        `;
  } else {
    contentDiv.innerHTML = `
            <div class="text-center py-8">
                <i class="fas fa-receipt text-gray-300 text-5xl mb-3"></i>
                <p class="text-gray-500 text-sm font-medium mb-1">Belum ada bukti pembayaran</p>
                <p class="text-gray-400 text-xs">Pelanggan belum mengupload bukti transfer</p>
            </div>
        `;
  }
}

function renderOrderItems(items) {
  const container = document.getElementById("order-items");
  if (!container) return;

  if (items.length === 0) {
    container.innerHTML = `
            <tr>
                <td colspan="4" class="px-6 py-4 text-center text-gray-500">
                    Tidak ada item dalam pesanan ini
                </td>
            </tr>
        `;
    return;
  }

  container.innerHTML = items
    .map(
      (item) => `
        <tr>
            <td class="px-6 py-4 text-sm text-gray-900">
                <div class="font-medium">${item.product_name}</div>
                ${
                  item.product_id
                    ? `<div class="text-xs text-gray-500">ID: ${item.product_id}</div>`
                    : ""
                }
            </td>
            <td class="px-6 py-4 text-sm text-gray-900">
                ${Utils.formatCurrency(item.price)}
            </td>
            <td class="px-6 py-4 text-sm text-gray-900">
                ${item.quantity}
            </td>
            <td class="px-6 py-4 text-sm text-gray-900 font-medium">
                ${Utils.formatCurrency(item.subtotal)}
            </td>
        </tr>
    `
    )
    .join("");
}

// Status Modal Management
function initStatusModal() {
  // Close status modal buttons
  const closeStatusModalBtn = document.getElementById("close-status-modal");
  const cancelStatusBtn = document.getElementById("cancel-status-update");

  if (closeStatusModalBtn) {
    closeStatusModalBtn.addEventListener("click", closeStatusModal);
  }

  if (cancelStatusBtn) {
    cancelStatusBtn.addEventListener("click", closeStatusModal);
  }

  // Confirm status update
  const confirmBtn = document.getElementById("confirm-status-update");
  if (confirmBtn) {
    confirmBtn.addEventListener("click", confirmStatusUpdate);
  }

  // Close on backdrop click
  const modal = document.getElementById("update-status-modal");
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        closeStatusModal();
      }
    });
  }
}

function openStatusModal(orderId, currentStatus) {
  statusModalOrderId = orderId;
  statusModalCurrentStatus = currentStatus;

  // Update modal content
  document.getElementById("status-order-id").textContent = orderId;
  document.getElementById("status-current-badge").innerHTML =
    Utils.getStatusBadge(currentStatus);

  const statusSelect = document.getElementById("status-select");
  if (statusSelect) {
    statusSelect.value = currentStatus;
  }

  // Show modal
  const modal = document.getElementById("update-status-modal");
  if (modal) {
    modal.classList.remove("hidden");
  }
}

function closeStatusModal() {
  const modal = document.getElementById("update-status-modal");
  if (modal) {
    modal.classList.add("hidden");
  }
  statusModalOrderId = null;
  statusModalCurrentStatus = null;
}

async function confirmStatusUpdate() {
  const statusSelect = document.getElementById("status-select");
  const newStatus = statusSelect.value;

  if (!statusModalOrderId) return;

  // Validate if status changed
  if (newStatus === statusModalCurrentStatus) {
    Utils.showAlert("Status tidak berubah", "info");
    closeStatusModal();
    return;
  }

  const confirmBtn = document.getElementById("confirm-status-update");
  const confirmText = document.getElementById("confirm-status-text");
  const confirmLoading = document.getElementById("confirm-status-loading");

  // Show loading state
  confirmBtn.disabled = true;
  confirmText.textContent = "Menyimpan...";
  confirmLoading.classList.remove("hidden");

  try {
    await ApiService.updateOrderStatus(statusModalOrderId, newStatus);
    Utils.showAlert("Status pesanan berhasil diperbarui", "success");

    // Refresh orders table
    await loadOrdersData();

    // Close modal after successful update
    closeStatusModal();
  } catch (error) {
    console.error("Error updating order status:", error);
    Utils.showAlert("Gagal memperbarui status pesanan", "error");
  } finally {
    // Reset button state
    confirmBtn.disabled = false;
    confirmText.textContent = "Simpan";
    confirmLoading.classList.add("hidden");
  }
}

// Status management
async function editOrderStatus(orderId, currentStatus) {
  openStatusModal(orderId, currentStatus);
}

async function saveOrderStatus(orderId) {
  // Close detail modal first
  const detailModal = document.getElementById("order-detail-modal");
  if (detailModal) {
    detailModal.classList.add("hidden");
  }

  // Open status update modal
  const currentStatus = currentOrder ? currentOrder.status : "pending";
  openStatusModal(orderId, currentStatus);
}

// Export and printing functions
async function handleExportOrders() {
  const exportBtn = document.getElementById("export-orders");
  Utils.setLoading(exportBtn, true, "Mengekspor...");

  try {
    // Get all orders with current filters
    const params = {
      ...orderFilters,
      limit: 1000, // Export all matching orders
      export: true,
    };

    const response = await ApiService.getOrders(params);

    if (response.data && response.data.length > 0) {
      exportToCSV(response.data);
      Utils.showAlert(
        `${response.data.length} pesanan berhasil diekspor`,
        "success"
      );
    } else {
      Utils.showAlert("Tidak ada data untuk diekspor", "warning");
    }
  } catch (error) {
    console.error("Error exporting orders:", error);
    Utils.showAlert("Gagal mengekspor data pesanan", "error");
  } finally {
    Utils.setLoading(exportBtn, false);
  }
}

function exportToCSV(orders) {
  const headers = [
    "ID Pesanan",
    "Tanggal",
    "Nama Pelanggan",
    "Email Pelanggan",
    "Telepon",
    "Alamat Pengiriman",
    "Kota",
    "Kode Pos",
    "Subtotal",
    "Ongkos Kirim",
    "Total",
    "Status",
    "Jumlah Item",
  ];

  const csvContent = [
    headers.join(","),
    ...orders.map((order) =>
      [
        order.id,
        new Date(order.created_at).toLocaleDateString("id-ID"),
        `"${order.customer_name}"`,
        order.customer_email,
        order.customer_phone || "",
        `"${order.shipping_address}"`,
        order.shipping_city,
        order.shipping_postal,
        order.subtotal,
        order.shipping_cost,
        order.total,
        order.status,
        order.items ? order.items.length : 0,
      ].join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `pesanan_${new Date().toISOString().split("T")[0]}.csv`
  );
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

async function printInvoice(orderId) {
  try {
    // If order is not loaded, load it first
    let order = currentOrder;
    if (!order || order.id !== orderId) {
      order = await ApiService.getOrder(orderId);
    }

    generateInvoicePrint(order);
  } catch (error) {
    console.error("Error printing invoice:", error);
    Utils.showAlert("Gagal mencetak invoice", "error");
  }
}

function generateInvoicePrint(order) {
  const printWindow = window.open("", "_blank");

  const invoiceHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Invoice #${order.id}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
                .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
                .company-name { font-size: 24px; font-weight: bold; color: #d97706; }
                .invoice-title { font-size: 20px; margin-top: 10px; }
                .info-section { margin: 20px 0; }
                .info-row { display: flex; justify-content: space-between; margin: 10px 0; }
                .customer-info, .order-info { width: 48%; }
                .section-title { font-weight: bold; font-size: 16px; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 10px; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f8f9fa; font-weight: bold; }
                .text-right { text-align: right; }
                .total-row { font-weight: bold; background-color: #f8f9fa; }
                .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
                .status { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
                .status-pending { background-color: #fef3c7; color: #92400e; }
                .status-processing { background-color: #dbeafe; color: #1e40af; }
                .status-shipped { background-color: #e0e7ff; color: #5b21b6; }
                .status-delivered { background-color: #dcfce7; color: #166534; }
                .status-cancelled { background-color: #fee2e2; color: #dc2626; }
                @media print {
                    body { margin: 0; }
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="company-name">Batik Nusantara</div>
                <div class="invoice-title">INVOICE #${order.id}</div>
                <div>Tanggal: ${Utils.formatDate(order.created_at)}</div>
            </div>

            <div class="info-section">
                <div class="info-row">
                    <div class="customer-info">
                        <div class="section-title">Informasi Pelanggan</div>
                        <div><strong>Nama:</strong> ${order.customer_name}</div>
                        <div><strong>Email:</strong> ${
                          order.customer_email
                        }</div>
                        <div><strong>Telepon:</strong> ${
                          order.customer_phone || "-"
                        }</div>
                    </div>
                    <div class="order-info">
                        <div class="section-title">Informasi Pengiriman</div>
                        <div><strong>Alamat:</strong> ${
                          order.shipping_address
                        }</div>
                        <div><strong>Kota:</strong> ${order.shipping_city}</div>
                        <div><strong>Kode Pos:</strong> ${
                          order.shipping_postal
                        }</div>
                        <div><strong>Status:</strong> <span class="status status-${
                          order.status
                        }">${getStatusText(order.status)}</span></div>
                    </div>
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>Produk</th>
                        <th>Harga</th>
                        <th>Jumlah</th>
                        <th class="text-right">Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    ${
                      order.items
                        ? order.items
                            .map(
                              (item) => `
                        <tr>
                            <td>${item.product_name}</td>
                            <td>${Utils.formatCurrency(item.price)}</td>
                            <td>${item.quantity}</td>
                            <td class="text-right">${Utils.formatCurrency(
                              item.subtotal
                            )}</td>
                        </tr>
                    `
                            )
                            .join("")
                        : ""
                    }
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="3" class="text-right"><strong>Subtotal:</strong></td>
                        <td class="text-right">${Utils.formatCurrency(
                          order.subtotal
                        )}</td>
                    </tr>
                    <tr>
                        <td colspan="3" class="text-right"><strong>Ongkos Kirim:</strong></td>
                        <td class="text-right">${Utils.formatCurrency(
                          order.shipping_cost
                        )}</td>
                    </tr>
                    <tr class="total-row">
                        <td colspan="3" class="text-right"><strong>TOTAL:</strong></td>
                        <td class="text-right"><strong>${Utils.formatCurrency(
                          order.total
                        )}</strong></td>
                    </tr>
                </tfoot>
            </table>

            <div class="footer">
                <p>Terima kasih atas pesanan Anda!</p>
                <p>Untuk pertanyaan, hubungi kami di email atau telepon yang tertera di website.</p>
            </div>

            <script>
                window.onload = function() {
                    window.print();
                }
            </script>
        </body>
        </html>
    `;

  printWindow.document.write(invoiceHTML);
  printWindow.document.close();
}

function getStatusText(status) {
  const statusMap = {
    pending: "Menunggu Pembayaran",
    processing: "Diproses",
    shipped: "Dikirim",
    delivered: "Selesai",
    cancelled: "Dibatalkan",
  };
  return statusMap[status] || status;
}

// Custom date filter
function showCustomDateFilter() {
  const container = document.getElementById("custom-date-container");
  if (container) {
    container.classList.remove("hidden");
  } else {
    // Create custom date inputs if they don't exist
    const dateFilter = document.getElementById("date-filter");
    if (dateFilter && dateFilter.parentNode) {
      const customDiv = document.createElement("div");
      customDiv.id = "custom-date-container";
      customDiv.className = "flex space-x-2 mt-2";
      customDiv.innerHTML = `
                <input type="date" id="start-date" class="border border-gray-300 rounded-md px-3 py-2 text-sm">
                <input type="date" id="end-date" class="border border-gray-300 rounded-md px-3 py-2 text-sm">
                <button onclick="applyCustomDateFilter()" class="bg-amber-600 text-white px-3 py-2 rounded-md text-sm hover:bg-amber-700">
                    Terapkan
                </button>
            `;
      dateFilter.parentNode.appendChild(customDiv);
    }
  }
}

function hideCustomDateFilter() {
  const container = document.getElementById("custom-date-container");
  if (container) {
    container.classList.add("hidden");
  }
}

async function applyCustomDateFilter() {
  const startDate = document.getElementById("start-date")?.value;
  const endDate = document.getElementById("end-date")?.value;

  if (!startDate || !endDate) {
    Utils.showAlert("Pilih tanggal mulai dan akhir", "warning");
    return;
  }

  if (new Date(startDate) > new Date(endDate)) {
    Utils.showAlert("Tanggal mulai harus sebelum tanggal akhir", "warning");
    return;
  }

  orderFilters.startDate = startDate;
  orderFilters.endDate = endDate;
  orderPage = 1;
  await loadOrdersData();
}

// Utility function to update DOM elements
function updateElement(id, value) {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = value;
  }
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  if (window.location.pathname.includes("dashboard-orders.html")) {
    initOrderManagement();
  }
});

// Helper function to get correct image URL
function getImageUrl(imagePath) {
  if (!imagePath) return "";

  // If already a full URL, return as is
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }

  // If path starts with /api/media or /uploads, prepend base URL
  if (imagePath.startsWith("/api/media") || imagePath.startsWith("/uploads")) {
    return `http://localhost:3000${imagePath}`;
  }

  // If just filename, assume it's in /api/media
  return `http://localhost:3000/api/media/${imagePath}`;
}

// Payment Badge Helper
function getPaymentBadge(payment) {
  if (!payment) {
    return '<span class="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">Belum Upload</span>';
  }

  const statusConfig = {
    pending: {
      class: "bg-yellow-100 text-yellow-800",
      text: "Menunggu Verifikasi",
      icon: "clock",
    },
    verified: {
      class: "bg-green-100 text-green-800",
      text: "Terverifikasi",
      icon: "check-circle",
    },
    rejected: {
      class: "bg-red-100 text-red-800",
      text: "Ditolak",
      icon: "times-circle",
    },
  };

  const status = payment.payment_status || payment.status; // Support both field names
  const config = statusConfig[status] || statusConfig.pending;
  return `<span class="px-2 py-1 text-xs rounded-full ${config.class}">
        <i class="fas fa-${config.icon} mr-1"></i>${config.text}
    </span>`;
}

// Payment Modal Management
function initPaymentModal() {
  const closePaymentModalBtn = document.getElementById("close-payment-modal");
  if (closePaymentModalBtn) {
    closePaymentModalBtn.addEventListener("click", closePaymentModal);
  }

  const verifyBtn = document.getElementById("verify-payment-btn");
  if (verifyBtn) {
    verifyBtn.addEventListener("click", showVerifyConfirmation);
  }

  const rejectBtn = document.getElementById("reject-payment-btn");
  if (rejectBtn) {
    rejectBtn.addEventListener("click", showRejectModal);
  }

  // Close on backdrop click
  const modal = document.getElementById("payment-proof-modal");
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        closePaymentModal();
      }
    });
  }

  // Verify confirmation modal
  const cancelVerifyBtn = document.getElementById("cancel-verify-btn");
  if (cancelVerifyBtn) {
    cancelVerifyBtn.addEventListener("click", closeVerifyConfirmation);
  }

  const confirmVerifyBtn = document.getElementById("confirm-verify-btn");
  if (confirmVerifyBtn) {
    confirmVerifyBtn.addEventListener("click", handleVerifyPayment);
  }

  // Reject payment modal
  const closeRejectModalBtn = document.getElementById("close-reject-modal");
  if (closeRejectModalBtn) {
    closeRejectModalBtn.addEventListener("click", closeRejectModal);
  }

  const cancelRejectBtn = document.getElementById("cancel-reject-btn");
  if (cancelRejectBtn) {
    cancelRejectBtn.addEventListener("click", closeRejectModal);
  }

  const confirmRejectBtn = document.getElementById("confirm-reject-btn");
  if (confirmRejectBtn) {
    confirmRejectBtn.addEventListener("click", handleRejectPayment);
  }

  // Close modals on backdrop click
  const verifyModal = document.getElementById("verify-confirmation-modal");
  if (verifyModal) {
    verifyModal.addEventListener("click", (e) => {
      if (e.target === verifyModal) {
        closeVerifyConfirmation();
      }
    });
  }

  const rejectModal = document.getElementById("reject-payment-modal");
  if (rejectModal) {
    rejectModal.addEventListener("click", (e) => {
      if (e.target === rejectModal) {
        closeRejectModal();
      }
    });
  }
}

async function viewPaymentProof(orderId) {
  try {
    const payment = await ApiService.getPaymentByOrder(orderId);
    currentPayment = payment;

    document.getElementById("payment-order-id").textContent = orderId;

    const contentDiv = document.getElementById("payment-content");
    if (payment) {
      contentDiv.innerHTML = `
                <div class="space-y-4">
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <p class="text-sm text-gray-600">Status:</p>
                            <p class="font-medium">${getPaymentBadge(
                              payment
                            )}</p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-600">Metode Pembayaran:</p>
                            <p class="font-medium">${
                              payment.payment_method || "-"
                            }</p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-600">Bank:</p>
                            <p class="font-medium">${
                              payment.bank_name || "-"
                            }</p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-600">Atas Nama:</p>
                            <p class="font-medium">${
                              payment.account_holder || "-"
                            }</p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-600">Jumlah:</p>
                            <p class="font-medium">${Utils.formatCurrency(
                              payment.amount
                            )}</p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-600">Tanggal Transfer:</p>
                            <p class="font-medium">${Utils.formatDateShort(
                              payment.payment_date
                            )}</p>
                        </div>
                    </div>
                    ${
                      payment.notes
                        ? `
                        <div>
                            <p class="text-sm text-gray-600">Catatan:</p>
                            <p class="font-medium">${payment.notes}</p>
                        </div>
                    `
                        : ""
                    }
                    ${
                      payment.payment_proof
                        ? `
                        <div>
                            <p class="text-sm text-gray-600 mb-2">Bukti Transfer:</p>
                            <img src="${getImageUrl(
                              payment.payment_proof
                            )}" alt="Bukti Transfer" class="max-w-96 mx-auto border rounded-lg shadow-sm" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22300%22%3E%3Crect fill=%22%23ddd%22 width=%22400%22 height=%22300%22/%3E%3Ctext fill=%22%23999%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22%3EGambar tidak ditemukan%3C/text%3E%3C/svg%3E'">
                        </div>
                    `
                        : ""
                    }
                    ${
                      payment.rejection_reason
                        ? `
                        <div class="bg-red-50 border border-red-200 rounded-lg p-3">
                            <p class="text-sm text-red-600 font-medium">Alasan Penolakan:</p>
                            <p class="text-sm text-red-800">${payment.rejection_reason}</p>
                        </div>
                    `
                        : ""
                    }
                </div>
            `;

      // Show action buttons only for pending payments
      const actionsDiv = document.getElementById("payment-actions");
      const status = payment.payment_status || payment.status;
      if (status === "pending") {
        actionsDiv.classList.remove("hidden");
      } else {
        actionsDiv.classList.add("hidden");
      }
    } else {
      contentDiv.innerHTML =
        '<p class="text-gray-500 text-center py-4">Belum ada bukti pembayaran</p>';
      document.getElementById("payment-actions").classList.add("hidden");
    }

    const modal = document.getElementById("payment-proof-modal");
    if (modal) modal.classList.remove("hidden");
  } catch (error) {
    console.error("Error loading payment proof:", error);
    Utils.showAlert("Gagal memuat bukti pembayaran", "error");
  }
}

function closePaymentModal() {
  const modal = document.getElementById("payment-proof-modal");
  if (modal) modal.classList.add("hidden");
  currentPayment = null;
}

// Verify Payment Confirmation Modal
function showVerifyConfirmation() {
  const modal = document.getElementById("verify-confirmation-modal");
  if (modal) modal.classList.remove("hidden");
}

function closeVerifyConfirmation() {
  const modal = document.getElementById("verify-confirmation-modal");
  if (modal) modal.classList.add("hidden");
}

async function handleVerifyPayment() {
  if (!currentPayment) return;

  const confirmBtn = document.getElementById("confirm-verify-btn");
  Utils.setLoading(confirmBtn, true, "Memverifikasi...");

  try {
    await ApiService.verifyPayment(currentPayment.id);
    Utils.showAlert(
      "Pembayaran berhasil diverifikasi! Notifikasi telah dikirim ke pelanggan.",
      "success"
    );
    closeVerifyConfirmation();
    closePaymentModal();

    // Refresh orders table
    await loadOrdersData();

    // Refresh order detail modal if it's open
    if (currentOrder && currentOrder.id) {
      const order = await ApiService.getOrder(currentOrder.id);
      const paymentData = await ApiService.getPaymentByOrder(currentOrder.id);
      displayOrderDetail(order, paymentData);
    }
  } catch (error) {
    console.error("Error verifying payment:", error);
    Utils.showAlert(error.message || "Gagal memverifikasi pembayaran", "error");
  } finally {
    Utils.setLoading(confirmBtn, false);
  }
}

// Reject Payment Modal
function showRejectModal() {
  const modal = document.getElementById("reject-payment-modal");
  const textarea = document.getElementById("rejection-reason");
  if (textarea) textarea.value = "";
  if (modal) modal.classList.remove("hidden");
}

function closeRejectModal() {
  const modal = document.getElementById("reject-payment-modal");
  if (modal) modal.classList.add("hidden");
}

async function handleRejectPayment() {
  if (!currentPayment) return;

  const reasonInput = document.getElementById("rejection-reason");
  const reason = reasonInput?.value?.trim();

  if (!reason) {
    Utils.showAlert("Alasan penolakan harus diisi", "warning");
    reasonInput?.focus();
    return;
  }

  const confirmBtn = document.getElementById("confirm-reject-btn");
  Utils.setLoading(confirmBtn, true, "Menolak...");

  try {
    await ApiService.rejectPayment(currentPayment.id, reason);
    Utils.showAlert(
      "Pembayaran ditolak. Notifikasi telah dikirim ke pelanggan.",
      "success"
    );
    closeRejectModal();
    closePaymentModal();

    // Refresh orders table
    await loadOrdersData();

    // Refresh order detail modal if it's open
    if (currentOrder && currentOrder.id) {
      const order = await ApiService.getOrder(currentOrder.id);
      const paymentData = await ApiService.getPaymentByOrder(currentOrder.id);
      displayOrderDetail(order, paymentData);
    }
  } catch (error) {
    console.error("Error rejecting payment:", error);
    Utils.showAlert(error.message || "Gagal menolak pembayaran", "error");
  } finally {
    Utils.setLoading(confirmBtn, false);
  }
}

// Global functions for onclick handlers
window.viewOrderDetail = viewOrderDetail;
window.editOrderStatus = editOrderStatus;
window.printInvoice = printInvoice;
window.applyCustomDateFilter = applyCustomDateFilter;
window.viewPaymentProof = viewPaymentProof;
