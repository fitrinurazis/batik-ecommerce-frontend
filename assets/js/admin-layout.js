// Admin Layout Common Functionality
document.addEventListener("DOMContentLoaded", function () {
  // Sidebar toggle functionality
  const toggleSidebar = document.getElementById("toggle-sidebar");
  const closeSidebar = document.getElementById("close-sidebar");
  const sidebar = document.querySelector(".sidebar");

  if (toggleSidebar) {
    toggleSidebar.addEventListener("click", function () {
      sidebar.classList.toggle("open");
    });
  }

  if (closeSidebar) {
    closeSidebar.addEventListener("click", function () {
      sidebar.classList.remove("open");
    });
  }

  // Close sidebar when clicking outside on mobile
  document.addEventListener("click", function (event) {
    if (window.innerWidth <= 768) {
      if (
        !sidebar.contains(event.target) &&
        !toggleSidebar.contains(event.target)
      ) {
        sidebar.classList.remove("open");
      }
    }
  });

  // Logout functionality
  const logoutBtns = document.querySelectorAll("#logout-btn");
  logoutBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      if (confirm("Apakah Anda yakin ingin logout?")) {
        AuthManager.logout();
      }
    });
  });

  // Load admin profile data
  loadAdminProfile();

  // Initialize authentication check
  AuthManager.requireAuth().then((user) => {
    if (user) {
      updateAdminInfo(user);
    }
  });
});

// Load and display admin profile information
async function loadAdminProfile() {
  try {
    const user = await AuthManager.checkAuth();
    if (user) {
      updateAdminInfo(user);
    }
  } catch (error) {
    console.error("Error loading admin profile:", error);
  }
}

// Update admin information in sidebar
function updateAdminInfo(user) {
  const adminNameElements = document.querySelectorAll("#admin-name");
  const adminUsernameElements = document.querySelectorAll("#admin-username");

  adminNameElements.forEach((element) => {
    if (element) {
      element.textContent = user.name || user.fullName || "Admin";
    }
  });

  adminUsernameElements.forEach((element) => {
    if (element) {
      element.textContent = user.username || user.email || "admin";
    }
  });
}

// Navigation active state management
function setActiveNavigation() {
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll(".nav-link");

  navLinks.forEach((link) => {
    const href = link.getAttribute("href");
    if (href && currentPath.includes(href.replace(".html", ""))) {
      link.classList.add("bg-amber-700");
      link.classList.remove("hover:bg-amber-700");
    } else {
      link.classList.remove("bg-amber-700");
      link.classList.add("hover:bg-amber-700");
    }
  });
}

// Call setActiveNavigation when DOM is loaded
document.addEventListener("DOMContentLoaded", setActiveNavigation);

// Utility function to show page-specific alerts
function showPageAlert(message, type = "info", duration = 5000) {
  if (typeof Utils !== "undefined" && Utils.showAlert) {
    Utils.showAlert(message, type, duration);
  } else {
    console.log(`${type.toUpperCase()}: ${message}`);
  }
}

// Common page loading state
function setPageLoading(isLoading, elementId = "page-content") {
  const element = document.getElementById(elementId);
  if (!element) return;

  if (isLoading) {
    element.innerHTML = `
            <div class="flex flex-col items-center justify-center py-12">
                <i class="fas fa-spinner fa-spin text-amber-600 text-3xl mb-4"></i>
                <p class="text-gray-600">Memuat data...</p>
            </div>
        `;
  }
}

// Error display function
function showPageError(message, elementId = "page-content") {
  const element = document.getElementById(elementId);
  if (!element) return;

  element.innerHTML = `
        <div class="flex flex-col items-center justify-center py-12">
            <i class="fas fa-exclamation-triangle text-red-500 text-3xl mb-4"></i>
            <p class="text-gray-600 mb-4">${message}</p>
            <button onclick="location.reload()" class="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-md transition">
                Muat Ulang
            </button>
        </div>
    `;
}

// Export for global access
window.AdminLayout = {
  setActiveNavigation,
  showPageAlert,
  setPageLoading,
  showPageError,
  updateAdminInfo,
};
