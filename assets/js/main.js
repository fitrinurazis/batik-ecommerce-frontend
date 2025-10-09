const API_BASE_URL = "http://localhost:3000/api";
const API_TIMEOUT = 10000;
const API_RETRY_ATTEMPTS = 3;
const APP_NAME = "Batik Nusantara";
const ITEMS_PER_PAGE = 10;

function initializeAxios() {
  if (typeof axios === "undefined") {
    console.error("Axios is not loaded. Make sure the CDN script is included.");
    return false;
  }

  axios.defaults.baseURL = API_BASE_URL;
  axios.defaults.timeout = API_TIMEOUT;
  axios.defaults.headers.common["Content-Type"] = "application/json";

  return true;
}

function setupAxiosInterceptors() {
  if (typeof axios === "undefined") {
    setTimeout(setupAxiosInterceptors, 100);
    return;
  }

  axios.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem("admin_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        localStorage.removeItem("admin_token");
        if (window.location.pathname !== "/pages/admin-login.html") {
          window.location.href = "/pages/admin-login.html";
        }
      }
      return Promise.reject(error);
    }
  );
}

class ApiService {
  static async login(credentials) {
    try {
      const response = await axios.post("/auth/login", credentials);

      if (response.data.accessToken || response.data.token) {
        const token = response.data.accessToken || response.data.token;
        localStorage.setItem("admin_token", token);
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      }
      return response.data;
    } catch (error) {
      console.error("ApiService.login - Error:", error);
      throw this.handleError(error);
    }
  }

  static async logout() {
    try {
      await axios.post("/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("admin_token");
      delete axios.defaults.headers.common["Authorization"];
    }
  }

  static async getProfile() {
    try {
      const response = await axios.get("/auth/me");
      return response.data;
    } catch (error) {
      console.error("ApiService.getProfile - Error:", error);
      throw this.handleError(error);
    }
  }

  static async refreshToken() {
    try {
      const response = await axios.post("/auth/refresh");
      if (response.data.token) {
        localStorage.setItem("admin_token", response.data.token);
        axios.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${response.data.token}`;
      }
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async getDashboardStats() {
    try {
      const response = await axios.get("/stats/dashboard");
      return response.data;
    } catch (error) {
      console.error("getDashboardStats - Error:", error);
      return {
        totalProducts: 0,
        newOrders: 0,
        lowStock: 0,
        totalRevenue: 0,
      };
    }
  }

  static async getProductStats() {
    try {
      const response = await axios.get("/stats/products");
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async getOrderStats() {
    try {
      const response = await axios.get("/stats/orders");
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async getProducts(params = {}) {
    try {
      const response = await axios.get("/products", { params });
      return response.data;
    } catch (error) {
      console.error("getProducts - Error:", error);
      throw this.handleError(error);
    }
  }

  static async getProduct(id) {
    try {
      const response = await axios.get(`/products/${id}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async createProduct(productData) {
    try {
      const response = await axios.post("/products", productData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async updateProduct(id, productData) {
    try {
      const response = await axios.put(`/products/${id}`, productData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async deleteProduct(id) {
    try {
      const response = await axios.delete(`/products/${id}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async getFeaturedProducts() {
    try {
      const response = await axios.get("/products/featured");
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async getRecommendedProducts() {
    try {
      const response = await axios.get("/products/recommended");
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async getRelatedProducts(id) {
    try {
      const response = await axios.get(`/products/related/${id}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async getOrders(params = {}) {
    try {
      const response = await axios.get("/orders", { params });
      return response.data;
    } catch (error) {
      console.error("getOrders - Error:", error);
      throw this.handleError(error);
    }
  }

  static async getOrder(id) {
    try {
      const response = await axios.get(`/orders/${id}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async createOrder(orderData) {
    try {
      const response = await axios.post("/orders", orderData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async updateOrderStatus(id, status) {
    try {
      const response = await axios.put(`/orders/${id}/status`, { status });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async getPaymentByOrder(orderId) {
    try {
      const response = await axios.get(`/payments/order/${orderId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async getPendingPayments(params = {}) {
    try {
      const response = await axios.get("/payments/pending", { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async getPayment(id) {
    try {
      const response = await axios.get(`/payments/${id}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async verifyPayment(id) {
    try {
      const response = await axios.post(`/payments/${id}/verify`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async rejectPayment(id, rejectionReason) {
    try {
      const response = await axios.post(`/payments/${id}/reject`, { rejection_reason: rejectionReason });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async uploadProductImage(file) {
    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await axios.post("/upload/product-image", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async uploadProductImages(files) {
    try {
      const formData = new FormData();

      // Append multiple files with key 'images[]'
      for (let i = 0; i < files.length; i++) {
        formData.append("images", files[i]);
      }

      const response = await axios.post("/upload/product-images", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async testEmailConnection() {
    try {
      const response = await axios.post("/email/test-connection");
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async sendTestEmail(email) {
    try {
      const response = await axios.post("/email/send-test", { email });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async getCategories() {
    try {
      const response = await axios.get("/categories");
      return response.data;
    } catch (error) {
      console.error("getCategories - Error:", error);
      return [
        { id: 1, name: "Klasik" },
        { id: 2, name: "Pesisir" },
        { id: 3, name: "Modern" },
      ];
    }
  }

  static async getSettings() {
    try {
      const response = await axios.get("/settings?include_private=true");
      return response.data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async saveSettings(category, settings) {
    try {
      const response = await axios.put("/settings/bulk", { settings });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async changePassword(currentPassword, newPassword) {
    try {
      const response = await axios.put("/auth/change-password", {
        currentPassword,
        newPassword
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Generic HTTP methods
  static async get(url, config = {}) {
    try {
      const response = await axios.get(url, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async post(url, data = {}, isFormData = false) {
    try {
      const config = isFormData ? {
        headers: { 'Content-Type': 'multipart/form-data' }
      } : {};
      const response = await axios.post(url, data, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async put(url, data = {}) {
    try {
      const response = await axios.put(url, data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async delete(url, config = {}) {
    try {
      const response = await axios.delete(url, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static handleError(error) {
    if (error.response) {
      const message =
        error.response.data?.message ||
        error.response.data?.error ||
        "Terjadi kesalahan pada server";
      return new Error(message);
    } else if (error.request) {
      return new Error(
        "Tidak dapat terhubung ke server. Periksa koneksi internet Anda."
      );
    } else {
      return new Error(
        error.message || "Terjadi kesalahan yang tidak diketahui"
      );
    }
  }
}

class Utils {
  static showAlert(message, type = "info", duration = 5000) {
    const alertContainer = document.getElementById("alert-container");
    if (!alertContainer) return;

    const alertColors = {
      success: "bg-green-100 border-green-400 text-green-700",
      error: "bg-red-100 border-red-400 text-red-700",
      warning: "bg-yellow-100 border-yellow-400 text-yellow-700",
      info: "bg-blue-100 border-blue-400 text-blue-700",
    };

    const alertIcons = {
      success: "fas fa-check-circle",
      error: "fas fa-exclamation-circle",
      warning: "fas fa-exclamation-triangle",
      info: "fas fa-info-circle",
    };

    const alertHtml = `
            <div class="border px-4 py-3 rounded ${alertColors[type]} flex items-center">
                <i class="${alertIcons[type]} mr-2"></i>
                <span class="block sm:inline">${message}</span>
                <button type="button" class="ml-auto text-xl leading-none" onclick="this.parentElement.parentElement.classList.add('hidden')">
                    &times;
                </button>
            </div>
        `;

    alertContainer.innerHTML = alertHtml;
    alertContainer.classList.remove("hidden");

    if (duration > 0) {
      setTimeout(() => {
        alertContainer.classList.add("hidden");
      }, duration);
    }
  }

  static formatCurrency(amount) {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  }

  static formatDate(dateString) {
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  static formatDateShort(dateString) {
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  static debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  static setLoading(element, isLoading, loadingText = "Memuat...") {
    if (!element) return;

    const originalText = element.dataset.originalText || element.textContent;

    if (isLoading) {
      element.dataset.originalText = originalText;
      element.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i>${loadingText}`;
      element.disabled = true;
    } else {
      element.textContent = originalText;
      element.disabled = false;
      delete element.dataset.originalText;
    }
  }

  static validateImage(file) {
    const allowedTypes = "image/jpeg,image/png,image/webp".split(",");
    const maxSize = 5242880; // 5MB

    if (!allowedTypes.includes(file.type)) {
      throw new Error(
        "Format file tidak didukung. Gunakan JPG, PNG, atau WebP."
      );
    }

    if (file.size > maxSize) {
      const maxSizeMB = Math.round(maxSize / 1024 / 1024);
      throw new Error(`Ukuran file terlalu besar. Maksimal ${maxSizeMB}MB.`);
    }

    return true;
  }

  static getStatusBadge(status) {
    const statusConfig = {
      pending: {
        class: "bg-yellow-100 text-yellow-800",
        text: "Menunggu Pembayaran",
      },
      processing: { class: "bg-blue-100 text-blue-800", text: "Diproses" },
      shipped: { class: "bg-purple-100 text-purple-800", text: "Dikirim" },
      delivered: { class: "bg-green-100 text-green-800", text: "Selesai" },
      cancelled: { class: "bg-red-100 text-red-800", text: "Dibatalkan" },
    };

    const config = statusConfig[status] || statusConfig.pending;
    return `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${config.class}">${config.text}</span>`;
  }
}

class AuthManager {
  static async checkAuth() {
    const token = localStorage.getItem("admin_token");

    if (!token) return null;

    try {
      const response = await ApiService.getProfile();
      return response.user;
    } catch (error) {
      console.error("CheckAuth - API error:", error);
      localStorage.removeItem("admin_token");
      delete axios.defaults.headers.common["Authorization"];
      return null;
    }
  }

  static async requireAuth() {
    const user = await this.checkAuth();
    if (!user && window.location.pathname !== "/pages/admin-login.html") {
      window.location.href = "/pages/admin-login.html";
      return null;
    }
    return user;
  }

  static logout() {
    ApiService.logout().then(() => {
      window.location.href = "/pages/admin-login.html";
    });
  }
}

document.addEventListener("DOMContentLoaded", function () {
  if (initializeAxios()) {
    setupAxiosInterceptors();

    const token = localStorage.getItem("admin_token");
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
  }
});

setupAxiosInterceptors();

window.ApiService = ApiService;
window.Utils = Utils;
window.AuthManager = AuthManager;
window.ITEMS_PER_PAGE = ITEMS_PER_PAGE;
window.API_BASE_URL = API_BASE_URL;
