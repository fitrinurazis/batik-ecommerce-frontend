// Dashboard Page Script

let currentUser = null;
let currentPage = 1;
let currentFilters = {};

document.addEventListener("DOMContentLoaded", function () {
  console.log('Dashboard script loaded');

  // Wait for dependencies to be available
  function waitForDependencies() {
    if (typeof window.ApiService !== 'undefined' &&
        typeof window.Utils !== 'undefined' &&
        typeof window.AuthManager !== 'undefined') {
      console.log('Dependencies available, initializing dashboard...');
      initDashboard();
    } else {
      console.log('Waiting for dependencies...', {
        ApiService: typeof window.ApiService,
        Utils: typeof window.Utils,
        AuthManager: typeof window.AuthManager
      });
      setTimeout(waitForDependencies, 100);
    }
  }

  waitForDependencies();
});

async function initDashboard() {
  console.log("Dashboard - Starting initialization...");

  // Check if we have a token first (quick check)
  const token = localStorage.getItem("admin_token");
  if (!token) {
    console.log("Dashboard - No token found, redirecting to login");
    window.location.href = "/pages/admin-login.html";
    return;
  }

  console.log("Dashboard - Token found, checking authentication...");

  // Try to get user info, but don't redirect immediately if backend is down
  try {
    currentUser = await window.AuthManager.checkAuth();
    if (currentUser) {
      console.log("Dashboard - User authenticated:", currentUser);
    } else {
      console.log(
        "Dashboard - Auth check failed, but token exists - continuing anyway"
      );
      // Create a dummy user object to continue
      currentUser = { username: "admin", name: "Admin" };
    }
  } catch (error) {
    console.error("Dashboard - Auth error:", error);
    // If there's an error but we have token, continue with dummy user
    currentUser = { username: "admin", name: "Admin" };
  }

  // Update user info in sidebar
  updateUserInfo();

  // Initialize components
  await loadDashboardData();
  initNavigation();
  initEventListeners();
  initModals();

  // Load initial data
  await loadInitialData();

  window.Utils.showAlert("Dashboard berhasil dimuat", "success", 3000);
}

function updateUserInfo() {
  const adminName = document.getElementById("admin-name");
  const adminUsername = document.getElementById("admin-username");

  if (adminName && currentUser.name) {
    adminName.textContent = currentUser.name;
  }
  if (adminUsername && currentUser.username) {
    adminUsername.textContent = currentUser.username;
  }
}

async function loadDashboardData() {
  try {
    const stats = await window.ApiService.getDashboardStats();

    // Update dashboard statistics using correct API response structure
    if (stats.overview) {
      updateElement("total-products", stats.overview.total_products || 0);
      updateElement("total-orders", stats.overview.total_orders || 0);
      updateElement("new-orders", stats.overview.pending_orders || 0);
      updateElement(
        "total-revenue",
        window.Utils.formatCurrency(parseFloat(stats.overview.total_revenue || 0))
      );
    }

    if (stats.alerts) {
      updateElement("low-stock", stats.alerts.low_stock_products || 0);
    }

    // Load recent activity from API response if available
    if (stats.recent_activity && stats.recent_activity.recent_orders) {
      loadRecentActivityFromStats(stats.recent_activity.recent_orders);
    } else {
      await loadRecentActivity();
    }

    // Load additional dashboard components
    await loadPopularProducts();
    await loadSalesChart();

    return stats;
  } catch (error) {
    console.error("Error loading dashboard data:", error);
    Utils.showAlert("Gagal memuat data dashboard", "error");
  }
}

function loadRecentActivityFromStats(orders) {
  const container = document.getElementById("recent-activity");
  if (!container || !orders) return;

  if (orders.length > 0) {
    container.innerHTML = orders
      .map(
        (order) => `
            <div class="flex items-center text-sm text-gray-600">
                <i class="fas fa-shopping-cart mr-2 text-amber-600"></i>
                <span>Pesanan #${order.id} dari ${order.customer_name}</span>
                <span class="ml-auto text-xs text-gray-400">${Utils.formatDateShort(
                  order.created_at
                )}</span>
            </div>
        `
      )
      .join("");
  } else {
    container.innerHTML =
      '<p class="text-gray-500 text-sm">Belum ada aktivitas terbaru</p>';
  }
}

async function loadRecentActivity() {
  const container = document.getElementById("recent-activity");
  if (!container) return;

  try {
    // Try to get recent orders, but handle errors gracefully
    const orders = await ApiService.getOrders({ page: 1, limit: 5 });

    // Handle different response formats
    const orderData = orders.orders || orders.data || [];

    if (orderData && orderData.length > 0) {
      container.innerHTML = orderData
        .map(
          (order) => `
                <div class="flex items-center text-sm text-gray-600">
                    <i class="fas fa-shopping-cart mr-2 text-amber-600"></i>
                    <span>Pesanan baru #${order.id} dari ${
            order.customer_name
          }</span>
                    <span class="ml-auto text-xs text-gray-400">${Utils.formatDateShort(
                      order.created_at
                    )}</span>
                </div>
            `
        )
        .join("");
    } else {
      container.innerHTML =
        '<p class="text-gray-500 text-sm">Belum ada aktivitas terbaru</p>';
    }
  } catch (error) {
    console.error("Error loading recent activity:", error);
    // Show placeholder activity instead of error
    container.innerHTML = `
            <div class="flex items-center text-sm text-gray-600">
                <i class="fas fa-info-circle mr-2 text-blue-600"></i>
                <span>Tidak dapat memuat aktivitas terbaru</span>
            </div>
        `;
  }
}

async function loadPopularProducts() {
  const container = document.getElementById("popular-products");
  if (!container) return;

  try {
    const stats = await ApiService.getProductStats();

    if (stats.top_performers && stats.top_performers.length > 0) {
      container.innerHTML = stats.top_performers
        .slice(0, 5)
        .map(
          (product) => `
                <div class="flex items-center justify-between text-sm">
                    <div>
                        <p class="font-medium text-gray-800">${product.name}</p>
                        <p class="text-gray-500">${
                          product.units_sold
                        } terjual</p>
                    </div>
                    <div class="text-right">
                        <p class="font-medium text-green-600">${Utils.formatCurrency(
                          parseFloat(product.revenue)
                        )}</p>
                        <p class="text-xs text-gray-400">${Utils.formatCurrency(
                          parseFloat(product.price)
                        )}</p>
                    </div>
                </div>
            `
        )
        .join("");
    } else {
      container.innerHTML =
        '<p class="text-gray-500 text-sm">Belum ada data produk</p>';
    }
  } catch (error) {
    console.error("Error loading popular products:", error);
    container.innerHTML = `
            <div class="flex items-center text-sm text-gray-600">
                <i class="fas fa-info-circle mr-2 text-blue-600"></i>
                <span>Tidak dapat memuat data produk</span>
            </div>
        `;
  }
}

async function loadSalesChart() {
  const container = document.querySelector(
    ".h-64.flex.items-center.justify-center.bg-gray-50.rounded-lg"
  );
  if (!container) return;

  try {
    const stats = await ApiService.getOrderStats();

    if (stats.sales_trend && stats.sales_trend.length > 0) {
      // Simple text-based chart representation
      const maxRevenue = Math.max(
        ...stats.sales_trend.map((day) => parseFloat(day.daily_revenue))
      );

      container.innerHTML = `
                <div class="w-full">
                    <h4 class="text-sm font-medium text-gray-700 mb-4">Tren Penjualan (${
                      stats.period
                    })</h4>
                    <div class="space-y-2">
                        ${stats.sales_trend
                          .map((day) => {
                            const percentage =
                              (parseFloat(day.daily_revenue) / maxRevenue) *
                              100;
                            return `
                                <div class="flex items-center text-xs">
                                    <span class="w-16 text-gray-600">${Utils.formatDateShort(
                                      day.date
                                    )}</span>
                                    <div class="flex-1 mx-2 bg-gray-200 rounded-full h-2">
                                        <div class="bg-amber-600 h-2 rounded-full" style="width: ${percentage}%"></div>
                                    </div>
                                    <span class="w-20 text-right text-gray-800">${Utils.formatCurrency(
                                      parseFloat(day.daily_revenue)
                                    )}</span>
                                </div>
                            `;
                          })
                          .join("")}
                    </div>
                    <div class="mt-4 text-center">
                        <p class="text-xs text-gray-500">Total: ${Utils.formatCurrency(
                          parseFloat(stats.statistics.summary.total_revenue)
                        )}</p>
                    </div>
                </div>
            `;
    } else {
      container.innerHTML = `
                <div class="text-center text-gray-500">
                    <i class="fas fa-chart-line text-3xl mb-2"></i>
                    <p>Belum ada data penjualan</p>
                </div>
            `;
    }
  } catch (error) {
    console.error("Error loading sales chart:", error);
    container.innerHTML = `
            <div class="text-center text-gray-500">
                <i class="fas fa-exclamation-triangle text-3xl mb-2"></i>
                <p>Tidak dapat memuat grafik penjualan</p>
            </div>
        `;
  }
}

function initNavigation() {
  // Let admin-layout.js handle sidebar toggle and navigation
  // This is a single page dashboard, no need for section navigation
}

// Section functions removed - this is a single-page dashboard
// Navigation is handled by admin-layout.js

function initEventListeners() {
  // Logout buttons
  document.querySelectorAll("#logout-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      handleLogout();
    });
  });

  // Refresh dashboard
  const refreshBtn = document.getElementById("refresh-dashboard");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", async () => {
      Utils.setLoading(refreshBtn, true, "Memperbarui...");
      try {
        await loadDashboardData();
        Utils.showAlert("Data dashboard diperbarui", "success");
      } catch (error) {
        Utils.showAlert("Gagal memperbarui data", "error");
      } finally {
        Utils.setLoading(refreshBtn, false);
      }
    });
  }

  // Add product button
  const addProductBtn = document.getElementById("add-product-btn");
  if (addProductBtn) {
    addProductBtn.addEventListener("click", () => {
      openProductModal();
    });
  }

  // Search functionality
  initSearchListeners();

  // Filter functionality
  initFilterListeners();
}

function initSearchListeners() {
  const searchProducts = document.getElementById("search-products");
  if (searchProducts) {
    const debouncedSearch = Utils.debounce(async (query) => {
      currentFilters.search = query;
      await loadProductsData();
    }, 500);

    searchProducts.addEventListener("input", (e) => {
      debouncedSearch(e.target.value);
    });
  }

  const searchOrders = document.getElementById("search-orders");
  if (searchOrders) {
    const debouncedSearch = Utils.debounce(async (query) => {
      currentFilters.search = query;
      await loadOrdersData();
    }, 500);

    searchOrders.addEventListener("input", (e) => {
      debouncedSearch(e.target.value);
    });
  }
}

function initFilterListeners() {
  // Category filter
  const categoryFilter = document.getElementById("category-filter");
  if (categoryFilter) {
    categoryFilter.addEventListener("change", async (e) => {
      currentFilters.category = e.target.value;
      await loadProductsData();
    });
  }

  // Sort filter
  const sortBy = document.getElementById("sort-by");
  if (sortBy) {
    sortBy.addEventListener("change", async (e) => {
      currentFilters.sort = e.target.value;
      await loadProductsData();
    });
  }

  // Status filter for orders
  const statusFilter = document.getElementById("status-filter");
  if (statusFilter) {
    statusFilter.addEventListener("change", async (e) => {
      currentFilters.status = e.target.value;
      await loadOrdersData();
    });
  }

  // Date filter for orders
  const dateFilter = document.getElementById("date-filter");
  if (dateFilter) {
    dateFilter.addEventListener("change", async (e) => {
      currentFilters.date = e.target.value;
      await loadOrdersData();
    });
  }
}

async function loadInitialData() {
  // Load categories for filters
  await loadCategoriesData();

  // Load products data for products section
  await loadProductsData();

  // Load orders data for orders section
  await loadOrdersData();
}

async function loadCategoriesData() {
  const categoryFilter = document.getElementById("category-filter");
  const productCategorySelect = document.getElementById("product-category");

  try {
    const categories = await ApiService.getCategories();

    if (categories && categories.length > 0) {
      // Update filter dropdown
      if (categoryFilter) {
        categoryFilter.innerHTML = '<option value="">Semua Kategori</option>';
        categories.forEach((category) => {
          const option = document.createElement("option");
          option.value = category.name;
          option.textContent = `${category.name} (${
            category.product_count || 0
          })`;
          categoryFilter.appendChild(option);
        });
      }

      // Update product modal category dropdown
      if (productCategorySelect) {
        productCategorySelect.innerHTML =
          '<option value="">Pilih Kategori</option>';
        categories.forEach((category) => {
          const option = document.createElement("option");
          option.value = category.name;
          option.textContent = category.name;
          productCategorySelect.appendChild(option);
        });
      }
    }
  } catch (error) {
    console.error("Error loading categories:", error);
    // Keep default options if API fails
  }
}

async function loadProductsData() {
  const tableBody = document.getElementById("products-table-body");
  if (!tableBody) return;

  try {
    // Show loading state
    tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-4 text-center text-gray-500">
                    <div class="flex flex-col items-center justify-center py-4">
                        <i class="fas fa-spinner fa-spin text-amber-600 text-2xl mb-2"></i>
                        <p>Memuat data produk...</p>
                    </div>
                </td>
            </tr>
        `;

    // Map frontend sort values to backend format
    const sortMapping = {
      newest: { sort: "created_at", order: "DESC" },
      oldest: { sort: "created_at", order: "ASC" },
      "price-asc": { sort: "price", order: "ASC" },
      "price-desc": { sort: "price", order: "DESC" },
      "name-asc": { sort: "name", order: "ASC" },
      "name-desc": { sort: "name", order: "DESC" },
    };

    const params = {
      page: currentPage,
      limit: window.ITEMS_PER_PAGE || 10,
      ...currentFilters,
    };

    // Apply sort mapping
    if (currentFilters.sort && sortMapping[currentFilters.sort]) {
      const { sort, order } = sortMapping[currentFilters.sort];
      params.sort = sort;
      params.order = order;
      // Remove the frontend sort value
      const { sort: frontendSort, ...restParams } = params;
      Object.assign(params, restParams);
    }

    const response = await ApiService.getProducts(params);

    if (response.products && response.products.length > 0) {
      renderProductsTable(response.products);
      updateProductsPagination(response.pagination);
    } else if (response.data && response.data.length > 0) {
      renderProductsTable(response.data);
      updateProductsPagination(response.pagination);
    } else {
      tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="px-6 py-4 text-center text-gray-500">
                        <div class="flex flex-col items-center justify-center py-4">
                            <i class="fas fa-box-open text-gray-400 text-3xl mb-2"></i>
                            <p>Tidak ada produk ditemukan</p>
                        </div>
                    </td>
                </tr>
            `;
    }
  } catch (error) {
    console.error("Error loading products:", error);
    tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-4 text-center text-gray-500">
                    <div class="flex flex-col items-center justify-center py-4">
                        <i class="fas fa-box-open text-gray-400 text-2xl mb-2"></i>
                        <p>Belum ada produk dalam database</p>
                        <p class="text-xs text-gray-400 mt-1">Tambah produk baru untuk mulai</p>
                    </div>
                </td>
            </tr>
        `;
  }
}

function renderProductsTable(products) {
  const tableBody = document.getElementById("products-table-body");
  if (!tableBody) return;

  tableBody.innerHTML = products
    .map(
      (product) => `
        <tr class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                    <div class="flex-shrink-0 h-12 w-12">
                        <img class="h-12 w-12 rounded-lg object-cover"
                             src="${product.image_url ? (product.image_url.startsWith('http') ? product.image_url : (product.image_url.startsWith('/') ? product.image_url : `/uploads/${product.image_url}`)) : '/assets/images/placeholder.svg'}"
                             alt="${product.name}"
                             onerror="this.src='/assets/images/placeholder.svg'">
                    </div>
                    <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900">${
                          product.name
                        }</div>
                        <div class="text-sm text-gray-500">${
                          product.description
                            ? product.description.substring(0, 50) + "..."
                            : ""
                        }</div>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    ${product.category}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ${Utils.formatCurrency(product.price)}
                ${
                  product.discount > 0
                    ? `<br><span class="text-xs text-red-500">Diskon ${product.discount}%</span>`
                    : ""
                }
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <span class="${
                  product.stock < 10 ? "text-red-600 font-medium" : ""
                }">${product.stock}</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ${product.discount > 0 ? product.discount + "%" : "-"}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button onclick="editProduct(${
                  product.id
                })" class="text-indigo-600 hover:text-indigo-900 mr-3">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteProduct(${product.id}, '${
        product.name
      }')" class="text-red-600 hover:text-red-900">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `
    )
    .join("");
}

function updateProductsPagination(pagination) {
  if (!pagination) return;

  // Update pagination info
  updateElement("pagination-start", pagination.offset + 1);
  updateElement(
    "pagination-end",
    Math.min(pagination.offset + pagination.limit, pagination.total)
  );
  updateElement("pagination-total", pagination.total);

  // Update pagination buttons
  const prevBtn = document.getElementById("prev-page");
  const nextBtn = document.getElementById("next-page");

  if (prevBtn) {
    prevBtn.disabled = pagination.page <= 1;
    prevBtn.onclick =
      pagination.page > 1 ? () => changePage(pagination.page - 1) : null;
  }

  if (nextBtn) {
    nextBtn.disabled = pagination.page >= pagination.totalPages;
    nextBtn.onclick =
      pagination.page < pagination.totalPages
        ? () => changePage(pagination.page + 1)
        : null;
  }
}

async function changePage(page) {
  currentPage = page;
  await loadProductsData();
}

async function loadOrdersData() {
  const tableBody = document.getElementById("orders-table-body");
  if (!tableBody) return;

  try {
    const params = {
      page: currentPage,
      limit: window.ITEMS_PER_PAGE || 10,
      ...currentFilters,
    };

    const response = await ApiService.getOrders(params);

    if (response.data && response.data.length > 0) {
      renderOrdersTable(response.data);
      updateOrdersPagination(response.pagination);
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
    tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-4 text-center text-gray-500">
                    <div class="flex flex-col items-center justify-center py-4">
                        <i class="fas fa-shopping-cart text-gray-400 text-3xl mb-2"></i>
                        <p>Belum ada pesanan dalam database</p>
                        <p class="text-xs text-gray-400 mt-1">Pesanan akan muncul di sini</p>
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
    .map(
      (order) => `
        <tr class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                #${order.id}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">${order.customer_name}</div>
                <div class="text-sm text-gray-500">${order.customer_email}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ${Utils.formatDateShort(order.created_at)}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ${Utils.formatCurrency(order.total)}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                ${Utils.getStatusBadge(order.status)}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button onclick="viewOrderDetail(${
                  order.id
                })" class="text-indigo-600 hover:text-indigo-900 mr-3">
                    <i class="fas fa-eye"></i>
                </button>
                <button onclick="updateOrderStatus(${
                  order.id
                })" class="text-amber-600 hover:text-amber-900">
                    <i class="fas fa-edit"></i>
                </button>
            </td>
        </tr>
    `
    )
    .join("");
}

function updateOrdersPagination(pagination) {
  if (!pagination) return;

  updateElement("orders-showing-start", pagination.offset + 1);
  updateElement(
    "orders-showing-end",
    Math.min(pagination.offset + pagination.limit, pagination.total)
  );
  updateElement("orders-total-items", pagination.total);

  const prevBtn = document.getElementById("orders-prev-page");
  const nextBtn = document.getElementById("orders-next-page");

  if (prevBtn) {
    prevBtn.disabled = pagination.page <= 1;
  }

  if (nextBtn) {
    nextBtn.disabled = pagination.page >= pagination.totalPages;
  }
}

function initModals() {
  // Initialize product modal
  initProductModal();

  // Initialize order detail modal
  initOrderDetailModal();

  // Initialize delete confirmation modal
  initDeleteModal();
}

function initProductModal() {
  const modal = document.getElementById("product-modal");
  const closeBtn = document.getElementById("close-modal");
  const cancelBtn = document.getElementById("cancel-form");

  if (closeBtn) {
    closeBtn.addEventListener("click", closeProductModal);
  }

  if (cancelBtn) {
    cancelBtn.addEventListener("click", closeProductModal);
  }

  // Close modal when clicking outside
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        closeProductModal();
      }
    });
  }
}

function initOrderDetailModal() {
  const modal = document.getElementById("order-detail-modal");
  const closeBtn = document.getElementById("close-order-modal");
  const closeDetailBtn = document.getElementById("close-order-detail");

  if (closeBtn) {
    closeBtn.addEventListener("click", closeOrderDetailModal);
  }

  if (closeDetailBtn) {
    closeDetailBtn.addEventListener("click", closeOrderDetailModal);
  }

  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        closeOrderDetailModal();
      }
    });
  }
}

function initDeleteModal() {
  const modal = document.getElementById("delete-modal");
  const closeBtn = document.getElementById("close-delete-modal");
  const cancelBtn = document.getElementById("cancel-delete");

  if (closeBtn) {
    closeBtn.addEventListener("click", closeDeleteModal);
  }

  if (cancelBtn) {
    cancelBtn.addEventListener("click", closeDeleteModal);
  }

  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        closeDeleteModal();
      }
    });
  }
}

// Modal control functions
function openProductModal(productId = null) {
  const modal = document.getElementById("product-modal");
  const title = document.getElementById("modal-title");

  if (modal) modal.classList.remove("hidden");

  if (productId) {
    if (title) title.textContent = "Edit Produk";
    loadProductForEdit(productId);
  } else {
    if (title) title.textContent = "Tambah Produk Baru";
    clearProductForm();
  }
}

function closeProductModal() {
  const modal = document.getElementById("product-modal");
  if (modal) modal.classList.add("hidden");
}

function closeOrderDetailModal() {
  const modal = document.getElementById("order-detail-modal");
  if (modal) modal.classList.add("hidden");
}

function closeDeleteModal() {
  const modal = document.getElementById("delete-modal");
  if (modal) modal.classList.add("hidden");
}

// Product management functions
async function editProduct(productId) {
  openProductModal(productId);
}

async function deleteProduct(productId, productName) {
  const modal = document.getElementById("delete-modal");
  const productNameSpan = document.getElementById("delete-product-name");
  const confirmBtn = document.getElementById("confirm-delete");

  if (productNameSpan) productNameSpan.textContent = productName;
  if (modal) modal.classList.remove("hidden");

  if (confirmBtn) {
    confirmBtn.onclick = async () => {
      Utils.setLoading(confirmBtn, true, "Menghapus...");
      try {
        await ApiService.deleteProduct(productId);
        Utils.showAlert("Produk berhasil dihapus", "success");
        await loadProductsData();
        closeDeleteModal();
      } catch (error) {
        Utils.showAlert(error.message || "Gagal menghapus produk", "error");
      } finally {
        Utils.setLoading(confirmBtn, false);
      }
    };
  }
}

// Order management functions
async function viewOrderDetail(orderId) {
  try {
    const order = await ApiService.getOrder(orderId);
    displayOrderDetail(order);

    const modal = document.getElementById("order-detail-modal");
    if (modal) modal.classList.remove("hidden");
  } catch (error) {
    Utils.showAlert("Gagal memuat detail pesanan", "error");
  }
}

function displayOrderDetail(order) {
  // Update order detail in modal
  updateElement("order-id", order.id);
  updateElement("customer-name", order.customer_name);
  updateElement("customer-email", order.customer_email);
  updateElement("customer-phone", order.customer_phone);
  updateElement("shipping-address", order.shipping_address);
  updateElement("shipping-city", order.shipping_city);
  updateElement("shipping-postal", order.shipping_postal);
  updateElement("shipping-method", order.shipping_method || "Standar");
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
  const itemsContainer = document.getElementById("order-items");
  if (itemsContainer && order.items) {
    itemsContainer.innerHTML = order.items
      .map(
        (item) => `
            <tr>
                <td class="px-6 py-4 text-sm text-gray-900">${
                  item.product_name
                }</td>
                <td class="px-6 py-4 text-sm text-gray-900">${Utils.formatCurrency(
                  item.price
                )}</td>
                <td class="px-6 py-4 text-sm text-gray-900">${
                  item.quantity
                }</td>
                <td class="px-6 py-4 text-sm text-gray-900">${Utils.formatCurrency(
                  item.subtotal
                )}</td>
            </tr>
        `
      )
      .join("");
  }
}

// Utility functions
function updateElement(id, value) {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = value;
  }
}

function handleLogout() {
  if (confirm("Apakah Anda yakin ingin logout?")) {
    AuthManager.logout();
  }
}

// Global functions for onclick handlers
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.viewOrderDetail = viewOrderDetail;
window.changePage = changePage;
