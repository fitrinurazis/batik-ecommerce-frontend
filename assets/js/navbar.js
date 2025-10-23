/**
 * Navbar functionality for Batik Windasari E-commerce
 * Handles mobile menu, search, cart, and navigation interactions
 */

class NavbarManager {
  constructor() {
    this.isInitialized = false;
    this.mobileMenuOpen = false;
    this.mobileSearchOpen = false;

    // DOM elements
    this.elements = {};

    this.init();
  }

  /**
   * Initialize navbar functionality
   */
  init() {
    if (this.isInitialized) return;

    // Wait for DOM to be fully loaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      // DOM is already loaded, setup immediately
      this.setup();
    }
  }

  /**
   * Setup all navbar functionality
   */
  setup() {
    try {
      this.cacheElements();
      this.bindEvents();
      this.initializeSearch();
      this.initializeCart();

      this.isInitialized = true;
      console.log('Navbar initialized successfully');
    } catch (error) {
      console.error('Error initializing navbar:', error);
    }
  }

  /**
   * Cache DOM elements for better performance
   */
  cacheElements() {
    this.elements = {
      // Mobile menu elements
      mobileMenuButton: document.getElementById('mobile-menu-button'),
      mobileMenu: document.getElementById('mobile-menu'),

      // Mobile search elements
      mobileSearchButton: document.getElementById('mobile-search-button'),
      mobileSearch: document.getElementById('mobile-search'),
      mobileSearchInput: document.getElementById('mobile-search-input'),
      mobileSearchBtn: document.getElementById('mobile-search-btn'),

      // Desktop search elements
      headerSearch: document.getElementById('header-search'),
      headerSearchBtn: document.getElementById('header-search-btn'),

      // Cart elements
      cartCount: document.getElementById('cart-count'),
      cartLinks: document.querySelectorAll('a[href="/cart"]'),

      // Navigation links
      navLinks: document.querySelectorAll('nav a[href]'),
    };
  }

  /**
   * Bind all event listeners
   */
  bindEvents() {
    // Mobile menu toggle
    if (this.elements.mobileMenuButton) {
      this.elements.mobileMenuButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Mobile menu button clicked');
        this.toggleMobileMenu();
      });
      console.log('Mobile menu button event bound');
    } else {
      console.warn('Mobile menu button not found');
    }

    // Mobile search toggle
    if (this.elements.mobileSearchButton) {
      this.elements.mobileSearchButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Mobile search button clicked');
        this.toggleMobileSearch();
      });
      console.log('Mobile search button event bound');
    } else {
      console.warn('Mobile search button not found');
    }

    // Search functionality
    this.bindSearchEvents();

    // Navigation link handling
    this.bindNavigationEvents();

    // Close menus on outside click
    document.addEventListener('click', (e) => this.handleOutsideClick(e));

    // Handle window resize
    window.addEventListener('resize', () => this.handleResize());

    // Handle escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeAllMenus();
      }
    });
  }

  /**
   * Initialize search functionality
   */
  initializeSearch() {
    // Auto-populate search from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('search');

    if (searchQuery) {
      if (this.elements.headerSearch) {
        this.elements.headerSearch.value = searchQuery;
      }
      if (this.elements.mobileSearchInput) {
        this.elements.mobileSearchInput.value = searchQuery;
      }
    }
  }

  /**
   * Bind search-related events
   */
  bindSearchEvents() {
    // Desktop search
    if (this.elements.headerSearch) {
      this.elements.headerSearch.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.performSearch(this.elements.headerSearch.value);
        }
      });

      this.elements.headerSearch.addEventListener('input', (e) => {
        this.handleSearchInput(e.target.value);
      });
    }

    if (this.elements.headerSearchBtn) {
      this.elements.headerSearchBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.performSearch(this.elements.headerSearch?.value || '');
      });
    }

    // Mobile search
    if (this.elements.mobileSearchInput) {
      this.elements.mobileSearchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.performSearch(this.elements.mobileSearchInput.value);
        }
      });

      this.elements.mobileSearchInput.addEventListener('input', (e) => {
        this.handleSearchInput(e.target.value);
      });
    }

    if (this.elements.mobileSearchBtn) {
      this.elements.mobileSearchBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.performSearch(this.elements.mobileSearchInput?.value || '');
      });
    }
  }

  /**
   * Bind navigation events
   */
  bindNavigationEvents() {
    // Handle navigation links with smooth scrolling for anchor links
    this.elements.navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');

        // Handle anchor links on same page
        if (href && href.startsWith('#')) {
          e.preventDefault();
          const target = document.querySelector(href);
          if (target) {
            this.scrollToElement(target);
            this.closeAllMenus();
          }
        }
        // Handle external navigation
        else if (href && !href.startsWith('http') && !href.startsWith('mailto')) {
          // Close mobile menus before navigation
          this.closeAllMenus();
        }
      });
    });
  }

  /**
   * Initialize cart functionality
   */
  initializeCart() {
    this.updateCartCount();

    // Listen for cart updates
    window.addEventListener('cartUpdated', () => {
      this.updateCartCount();
    });

    // Listen for storage changes (for cross-tab cart sync)
    window.addEventListener('storage', (e) => {
      if (e.key === 'cart' || e.key === 'cartItems') {
        this.updateCartCount();
      }
    });
  }

  /**
   * Toggle mobile menu visibility
   */
  toggleMobileMenu() {
    console.log('toggleMobileMenu called', {
      mobileMenu: this.elements.mobileMenu,
      mobileMenuButton: this.elements.mobileMenuButton,
      currentState: this.mobileMenuOpen
    });

    if (!this.elements.mobileMenu || !this.elements.mobileMenuButton) {
      console.error('Mobile menu or button element not found');
      return;
    }

    this.mobileMenuOpen = !this.mobileMenuOpen;
    console.log('New mobile menu state:', this.mobileMenuOpen);

    if (this.mobileMenuOpen) {
      this.elements.mobileMenu.classList.remove('hidden');
      this.elements.mobileMenuButton.innerHTML = '<i class="fas fa-times text-xl"></i>';
      // Close search if open
      this.closeMobileSearch();
      console.log('Mobile menu opened');
    } else {
      this.elements.mobileMenu.classList.add('hidden');
      this.elements.mobileMenuButton.innerHTML = '<i class="fas fa-bars text-xl"></i>';
      console.log('Mobile menu closed');
    }
  }

  /**
   * Toggle mobile search visibility
   */
  toggleMobileSearch() {
    if (!this.elements.mobileSearch) return;

    this.mobileSearchOpen = !this.mobileSearchOpen;

    if (this.mobileSearchOpen) {
      this.elements.mobileSearch.classList.remove('hidden');
      // Focus on search input
      setTimeout(() => {
        if (this.elements.mobileSearchInput) {
          this.elements.mobileSearchInput.focus();
        }
      }, 100);
      // Close mobile menu if open
      this.closeMobileMenu();
    } else {
      this.elements.mobileSearch.classList.add('hidden');
    }
  }

  /**
   * Close mobile menu
   */
  closeMobileMenu() {
    if (this.mobileMenuOpen && this.elements.mobileMenu) {
      this.elements.mobileMenu.classList.add('hidden');
      this.mobileMenuOpen = false;
      if (this.elements.mobileMenuButton) {
        this.elements.mobileMenuButton.innerHTML = '<i class="fas fa-bars text-xl"></i>';
      }
    }
  }

  /**
   * Close mobile search
   */
  closeMobileSearch() {
    if (this.mobileSearchOpen && this.elements.mobileSearch) {
      this.elements.mobileSearch.classList.add('hidden');
      this.mobileSearchOpen = false;
    }
  }

  /**
   * Close all mobile menus
   */
  closeAllMenus() {
    this.closeMobileMenu();
    this.closeMobileSearch();
  }

  /**
   * Handle clicks outside of menus
   */
  handleOutsideClick(event) {
    const target = event.target;

    // Check if click is outside mobile menu
    if (this.mobileMenuOpen &&
        this.elements.mobileMenu &&
        !this.elements.mobileMenu.contains(target) &&
        !this.elements.mobileMenuButton.contains(target)) {
      this.closeMobileMenu();
    }

    // Check if click is outside mobile search
    if (this.mobileSearchOpen &&
        this.elements.mobileSearch &&
        !this.elements.mobileSearch.contains(target) &&
        !this.elements.mobileSearchButton.contains(target)) {
      this.closeMobileSearch();
    }
  }

  /**
   * Handle window resize
   */
  handleResize() {
    // Close mobile menus on desktop breakpoint
    if (window.innerWidth >= 768) { // md breakpoint
      this.closeAllMenus();
    }
  }

  /**
   * Perform search functionality
   */
  performSearch(query) {
    if (!this.validateSearchQuery(query)) {
      return;
    }

    const searchQuery = query.trim();
    this.showSearchFeedback(true);
    this.closeAllMenus();

    const currentPath = window.location.pathname;
    const isHomePage = currentPath === '/' || currentPath.endsWith('/index.html') || currentPath === '';
    const isProductsPage = currentPath.includes('products');

    let targetUrl;

    if (isProductsPage) {
      const url = new URL(window.location);
      url.searchParams.set('search', searchQuery);
      targetUrl = url.toString();
    } else if (isHomePage) {
      targetUrl = `/pages/products.html?search=${encodeURIComponent(searchQuery)}`;
    } else {
      const baseUrl = window.location.origin;
      const pathSegments = currentPath.split('/');

      if (pathSegments.includes('pages')) {
        const rootIndex = pathSegments.indexOf('pages');
        const rootPath = pathSegments.slice(0, rootIndex).join('/');
        targetUrl = `${baseUrl}${rootPath}/pages/products.html?search=${encodeURIComponent(searchQuery)}`;
      } else {
        targetUrl = `${baseUrl}/pages/products.html?search=${encodeURIComponent(searchQuery)}`;
      }
    }

    setTimeout(() => {
      window.location.href = targetUrl;
    }, 300);
  }

  /**
   * Handle search input changes (for autocomplete, etc.)
   */
  handleSearchInput(value) {
    window.dispatchEvent(new CustomEvent('searchInputChanged', {
      detail: { query: value }
    }));
  }

  /**
   * Show search feedback (loading state, etc.)
   */
  showSearchFeedback(isLoading = false) {
    const buttons = [this.elements.headerSearchBtn, this.elements.mobileSearchBtn];

    buttons.forEach(btn => {
      if (!btn) return;

      if (isLoading) {
        const originalContent = btn.innerHTML;
        btn.dataset.originalContent = originalContent;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        btn.disabled = true;
      } else {
        if (btn.dataset.originalContent) {
          btn.innerHTML = btn.dataset.originalContent;
          delete btn.dataset.originalContent;
        }
        btn.disabled = false;
      }
    });
  }

  /**
   * Validate search query
   */
  validateSearchQuery(query) {
    if (!query || !query.trim()) {
      this.showSearchError('Masukkan kata kunci pencarian');
      return false;
    }

    if (query.trim().length < 2) {
      this.showSearchError('Kata kunci minimal 2 karakter');
      return false;
    }

    return true;
  }

  /**
   * Show search error message
   */
  showSearchError(message) {
    if (typeof Toastify !== 'undefined') {
      Toastify({
        text: message,
        duration: 3000,
        gravity: "top",
        position: "right",
        backgroundColor: "#EF4444",
        stopOnFocus: true,
      }).showToast();
    } else {
      alert(message);
    }
  }

  /**
   * Update cart count display
   */
  updateCartCount() {
    if (!this.elements.cartCount) return;

    try {
      // Get cart items from localStorage or your preferred storage method
      const cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
      const totalItems = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);

      this.elements.cartCount.textContent = totalItems;

      // Update visibility
      if (totalItems > 0) {
        this.elements.cartCount.classList.remove('hidden');
        this.elements.cartCount.classList.add('animate-pulse');
      } else {
        this.elements.cartCount.textContent = '0';
        this.elements.cartCount.classList.remove('animate-pulse');
      }

      // Dispatch cart update event
      window.dispatchEvent(new CustomEvent('cartCountUpdated', {
        detail: { count: totalItems }
      }));

    } catch (error) {
      console.error('Error updating cart count:', error);
      this.elements.cartCount.textContent = '0';
    }
  }

  /**
   * Smooth scroll to element
   */
  scrollToElement(element) {
    const headerHeight = document.querySelector('header')?.offsetHeight || 80;
    const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
    const offsetPosition = elementPosition - headerHeight;

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });
  }

  /**
   * Add item to cart (utility method)
   */
  addToCart(product) {
    try {
      const cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');

      // Check if item already exists
      const existingIndex = cartItems.findIndex(item => item.id === product.id);

      if (existingIndex > -1) {
        cartItems[existingIndex].quantity = (cartItems[existingIndex].quantity || 1) + 1;
      } else {
        cartItems.push({
          ...product,
          quantity: 1,
          addedAt: new Date().toISOString()
        });
      }

      localStorage.setItem('cartItems', JSON.stringify(cartItems));
      this.updateCartCount();

      // Dispatch cart updated event
      window.dispatchEvent(new CustomEvent('cartUpdated', {
        detail: { action: 'add', product, cartItems }
      }));

      return true;
    } catch (error) {
      console.error('Error adding to cart:', error);
      return false;
    }
  }

  /**
   * Get current cart items
   */
  getCartItems() {
    try {
      return JSON.parse(localStorage.getItem('cartItems') || '[]');
    } catch (error) {
      console.error('Error getting cart items:', error);
      return [];
    }
  }

  /**
   * Clear cart
   */
  clearCart() {
    try {
      localStorage.removeItem('cartItems');
      this.updateCartCount();

      window.dispatchEvent(new CustomEvent('cartUpdated', {
        detail: { action: 'clear', cartItems: [] }
      }));

      return true;
    } catch (error) {
      console.error('Error clearing cart:', error);
      return false;
    }
  }

}

// Initialize navbar when script loads
const navbar = new NavbarManager();

// Export for use in other scripts
if (typeof window !== 'undefined') {
  window.NavbarManager = NavbarManager;
  window.navbar = navbar;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = NavbarManager;
}