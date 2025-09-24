// API Configuration - Read from .env or use fallback values
const getEnvVar = (key, fallback) => {
  try {
    return import.meta?.env?.[key] || fallback;
  } catch {
    return fallback;
  }
};

const API_BASE_URL = getEnvVar("VITE_API_BASE_URL", "http://localhost:3000/api");
const API_TIMEOUT = getEnvVar("VITE_API_TIMEOUT", 10000);
const API_RETRY_ATTEMPTS = getEnvVar("VITE_API_RETRY_ATTEMPTS", 3);
const APP_NAME = getEnvVar("VITE_APP_NAME", "Batik Nusantara");
const ITEMS_PER_PAGE = getEnvVar("VITE_ITEMS_PER_PAGE", 10);

// Wait for axios to be available from CDN
function initializeAxios() {
  if (typeof axios === "undefined") {
    console.error("Axios is not loaded. Make sure the CDN script is included.");
    return false;
  }

  // Configure axios defaults
  axios.defaults.baseURL = API_BASE_URL;
  axios.defaults.timeout = API_TIMEOUT;
  axios.defaults.headers.common["Content-Type"] = "application/json";

  console.log("Axios initialized with baseURL:", axios.defaults.baseURL);
  return true;
}

// Initialize axios when available
function setupAxiosInterceptors() {
  if (typeof axios === "undefined") {
    setTimeout(setupAxiosInterceptors, 100);
    return;
  }

  // Axios interceptors for authentication
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

  // Response interceptor for handling authentication errors
  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        // Token expired or invalid
        localStorage.removeItem("admin_token");
        if (window.location.pathname !== "/pages/admin-login.html") {
          window.location.href = "/pages/admin-login.html";
        }
      }
      return Promise.reject(error);
    }
  );
}

// API Service Class
class ApiService {
  // Authentication endpoints
  static async login(credentials) {
    try {
      console.log(
        "ApiService.login - Making request to:",
        axios.defaults.baseURL + "/auth/login"
      );
      const response = await axios.post("/auth/login", credentials);
      console.log("ApiService.login - Response status:", response.status);
      console.log("ApiService.login - Response data:", response.data);

      if (response.data.accessToken || response.data.token) {
        const token = response.data.accessToken || response.data.token;
        localStorage.setItem("admin_token", token);
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        console.log("ApiService.login - Token saved to localStorage");
      } else {
        console.warn("ApiService.login - No token in response");
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

  // Dashboard/Statistics endpoints
  static async getDashboardStats() {
    try {
      const response = await axios.get("/stats/dashboard");
      return response.data;
    } catch (error) {
      console.error("getDashboardStats - Error:", error);
      // Return minimal fallback to prevent crash
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

  // Products endpoints
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

  // Orders endpoints
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

  // Upload endpoints
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

  // Email endpoints
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

  // Utility endpoints
  static async getCategories() {
    try {
      const response = await axios.get("/categories");
      return response.data;
    } catch (error) {
      console.error("getCategories - Error:", error);
      // Return minimal fallback categories to prevent crash
      return [
        { id: 1, name: "Klasik" },
        { id: 2, name: "Pesisir" },
        { id: 3, name: "Modern" },
      ];
    }
  }

  // Error handler
  static handleError(error) {
    if (error.response) {
      // Server responded with error status
      const message =
        error.response.data?.message ||
        error.response.data?.error ||
        "Terjadi kesalahan pada server";
      return new Error(message);
    } else if (error.request) {
      // Request was made but no response received
      return new Error(
        "Tidak dapat terhubung ke server. Periksa koneksi internet Anda."
      );
    } else {
      // Something else happened
      return new Error(
        error.message || "Terjadi kesalahan yang tidak diketahui"
      );
    }
  }
}

// Utility Functions
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

// Authentication Manager
class AuthManager {
  static async checkAuth() {
    const token = localStorage.getItem("admin_token");
    console.log("CheckAuth - Token exists:", !!token);

    if (!token) return null;

    try {
      console.log("CheckAuth - Calling getProfile API...");
      const response = await ApiService.getProfile();
      console.log("CheckAuth - API response:", response);
      return response.user;
    } catch (error) {
      console.error("CheckAuth - API error:", error);
      // Remove invalid token
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

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  // Setup axios configuration and interceptors
  if (initializeAxios()) {
    setupAxiosInterceptors();

    // Set existing token if available
    const token = localStorage.getItem("admin_token");
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
  }
});

// Also setup when axios becomes available (fallback)
setupAxiosInterceptors();

// Export for global access
window.ApiService = ApiService;
window.Utils = Utils;
window.AuthManager = AuthManager;
window.ITEMS_PER_PAGE = ITEMS_PER_PAGE;
window.API_BASE_URL = API_BASE_URL;
