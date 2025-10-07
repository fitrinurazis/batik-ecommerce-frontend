// Shopping Cart JavaScript
document.addEventListener("DOMContentLoaded", function () {
  console.log("Cart page loaded");

  // Initialize cart
  initializeCart();
  initEventListeners();
});

// Global variables
let cart = [];
let products = {};
let itemToRemove = null;

async function initializeCart() {
  console.log("Initializing cart...");

  try {
    // Show loading
    document.getElementById("cart-loading").classList.remove("hidden");

    // Wait for dependencies
    await waitForDependencies();

    // Load cart from localStorage
    loadCartFromStorage();

    // If cart has items, load product details
    if (cart.length > 0) {
      await loadProductDetails();
      renderCartItems();
      updateOrderSummary();
      document.getElementById("order-summary").classList.remove("hidden");
      document.getElementById("clear-cart").classList.remove("hidden");
    } else {
      showEmptyCart();
    }

    // Load recommended products
    loadRecommendedProducts();
  } catch (error) {
    console.error("Error initializing cart:", error);
    showError("Gagal memuat keranjang belanja");
  } finally {
    document.getElementById("cart-loading").classList.add("hidden");
  }
}

async function waitForDependencies() {
  return new Promise((resolve) => {
    let attempts = 0;
    const maxAttempts = 50;

    function checkDependencies() {
      attempts++;
      if (typeof window.ApiService !== "undefined") {
        resolve();
      } else if (attempts >= maxAttempts) {
        resolve();
      } else {
        setTimeout(checkDependencies, 100);
      }
    }
    checkDependencies();
  });
}

function loadCartFromStorage() {
  const savedCart = localStorage.getItem("cart");
  if (savedCart) {
    cart = JSON.parse(savedCart);
    console.log("Loaded cart from storage:", cart);
  }

  // Update cart count in header
  updateCartCount();
}

async function loadProductDetails() {
  console.log("Loading product details for cart items...");

  try {
    const productIds = cart.map((item) => item.id || item.productId);
    console.log("Product IDs to load:", productIds);

    // Load product details for each cart item
    for (const id of productIds) {
      if (!products[id] && typeof window.ApiService !== "undefined") {
        try {
          const product = await window.ApiService.getProduct(id);
          if (product) {
            products[id] = product;
            console.log("Loaded product:", id, product.name);
          }
        } catch (error) {
          console.error("Failed to load product:", id, error);
          // Use fallback data if available in cart item
          const cartItem = cart.find(
            (item) => (item.id || item.productId) == id
          );
          if (cartItem && cartItem.name) {
            products[id] = {
              id: id,
              name: cartItem.name,
              price: cartItem.price,
              image_url: cartItem.image_url,
              stock: 999, // Default stock
            };
          }
        }
      }
    }

    console.log("All products loaded:", products);
  } catch (error) {
    console.error("Error loading product details:", error);
  }
}

function renderCartItems() {
  console.log("Rendering cart items...");

  const container = document.getElementById("cart-items");
  container.innerHTML = "";

  cart.forEach((item, index) => {
    const productId = item.id || item.productId;
    const product = products[productId];

    if (!product) {
      console.warn("Product not found for cart item:", item);
      return;
    }

    const cartItemElement = createCartItemElement(item, product, index);
    container.appendChild(cartItemElement);
  });

  console.log(`Rendered ${cart.length} cart items`);
}

function createCartItemElement(cartItem, product, index) {
  const div = document.createElement("div");
  div.className = "cart-item bg-white rounded-lg shadow-md p-6";
  div.dataset.index = index;

  // Handle image URL
  let imageUrl = product.image_url || product.imageUrl;
  if (imageUrl && imageUrl.startsWith("/api/media/")) {
    imageUrl = `http://localhost:3000${imageUrl}`;
  }
  const fallbackImage =
    "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=200&h=200&fit=crop&crop=center&q=80";
  const finalImageUrl = imageUrl || fallbackImage;

  // Calculate prices
  const price = parseFloat(product.price || 0);
  const discount = parseFloat(product.discount || 0);
  const hasDiscount = discount > 0;
  const discountedPrice = hasDiscount ? price * (1 - discount / 100) : price;
  const quantity = parseInt(cartItem.quantity || 1);
  const totalPrice = discountedPrice * quantity;

  div.innerHTML = `
        <div class="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-6">
            <!-- Product Image -->
            <div class="flex-shrink-0">
                <div class="w-24 h-24 md:w-32 md:h-32 bg-gray-200 rounded-lg overflow-hidden cursor-pointer" onclick="viewProduct(${
                  product.id
                })">
                    <img src="${finalImageUrl}" alt="${product.name}"
                         class="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                         onerror="this.src='${fallbackImage}'">
                </div>
            </div>

            <!-- Product Details -->
            <div class="flex-1">
                <div class="flex flex-col md:flex-row md:justify-between">
                    <!-- Product Info -->
                    <div class="flex-1 mb-4 md:mb-0">
                        <h3 class="text-lg font-semibold text-gray-900 mb-1 cursor-pointer hover:text-amber-600 transition-colors"
                            onclick="viewProduct(${product.id})">
                            ${product.name}
                        </h3>
                        <p class="text-gray-600 text-sm mb-2">${
                          product.category || "Batik"
                        }</p>

                        <!-- Price -->
                        <div class="flex items-baseline space-x-2">
                            <span class="text-lg font-bold text-amber-600">
                                ${formatCurrency(discountedPrice)}
                            </span>
                            ${
                              hasDiscount
                                ? `
                                <span class="text-sm text-gray-500 line-through">
                                    ${formatCurrency(price)}
                                </span>
                                <span class="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">
                                    -${Math.round(discount)}%
                                </span>
                            `
                                : ""
                            }
                        </div>

                        <!-- Stock Info -->
                        <div class="mt-2">
                            ${
                              product.stock > 0
                                ? `
                                <span class="text-green-600 text-sm">
                                    <i class="fas fa-check-circle text-xs mr-1"></i>
                                    Tersedia ${product.stock} pcs
                                </span>
                            `
                                : `
                                <span class="text-red-500 text-sm">
                                    <i class="fas fa-exclamation-circle text-xs mr-1"></i>
                                    Stok Habis
                                </span>
                            `
                            }
                        </div>
                    </div>

                    <!-- Quantity and Actions -->
                    <div class="flex flex-row md:flex-col items-start md:items-end space-x-4 md:space-x-0 md:space-y-4">
                        <!-- Quantity Controls -->
                        <div class="flex items-center space-x-2">
                            <label class="text-sm text-gray-600 hidden md:block">Jumlah:</label>
                            <div class="flex items-center border border-gray-300 rounded-lg">
                                <button onclick="updateQuantity(${index}, ${
    quantity - 1
  })"
                                        class="px-3 py-2 hover:bg-gray-100 transition-colors ${
                                          quantity <= 1
                                            ? "opacity-50 cursor-not-allowed"
                                            : ""
                                        }"
                                        ${quantity <= 1 ? "disabled" : ""}>
                                    <i class="fas fa-minus text-sm"></i>
                                </button>
                                <input type="number" value="${quantity}" min="1" max="${
    product.stock || 999
  }"
                                       class="quantity-input w-16 text-center py-2 border-none focus:ring-0 focus:outline-none"
                                       onchange="updateQuantity(${index}, this.value)">
                                <button onclick="updateQuantity(${index}, ${
    quantity + 1
  })"
                                        class="px-3 py-2 hover:bg-gray-100 transition-colors ${
                                          quantity >= (product.stock || 999)
                                            ? "opacity-50 cursor-not-allowed"
                                            : ""
                                        }"
                                        ${
                                          quantity >= (product.stock || 999)
                                            ? "disabled"
                                            : ""
                                        }>
                                    <i class="fas fa-plus text-sm"></i>
                                </button>
                            </div>
                        </div>

                        <!-- Total Price -->
                        <div class="text-right">
                            <div class="text-lg font-bold text-gray-900">
                                ${formatCurrency(totalPrice)}
                            </div>
                            <button onclick="removeItem(${index})"
                                    class="text-red-500 hover:text-red-700 text-sm mt-2 transition-colors">
                                <i class="fas fa-trash mr-1"></i>
                                Hapus
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

  return div;
}

function updateQuantity(index, newQuantity) {
  const quantity = parseInt(newQuantity);

  if (quantity < 1) return;

  const cartItem = cart[index];
  const productId = cartItem.id || cartItem.productId;
  const product = products[productId];

  if (product && quantity > (product.stock || 999)) {
    showError(`Stok tidak mencukupi. Maksimal ${product.stock || 999} pcs`);
    return;
  }

  // Update quantity
  cart[index].quantity = quantity;

  // Save to localStorage
  saveCartToStorage();

  // Re-render
  renderCartItems();
  updateOrderSummary();
  updateCartCount();

  showSuccess("Jumlah produk berhasil diperbarui");
}

function removeItem(index) {
  itemToRemove = index;

  // Show confirmation modal
  const modal = document.getElementById("remove-modal");
  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

function confirmRemoveItem() {
  if (itemToRemove !== null) {
    // Add removing animation
    const itemElement = document.querySelector(
      `[data-index="${itemToRemove}"]`
    );
    if (itemElement) {
      itemElement.classList.add("removing");

      setTimeout(() => {
        // Remove from cart
        cart.splice(itemToRemove, 1);

        // Save to localStorage
        saveCartToStorage();

        // Update display
        updateCartCount();

        if (cart.length > 0) {
          renderCartItems();
          updateOrderSummary();
        } else {
          showEmptyCart();
          document.getElementById("order-summary").classList.add("hidden");
          document.getElementById("clear-cart").classList.add("hidden");
        }

        showSuccess("Produk berhasil dihapus dari keranjang");
      }, 300);
    }
  }

  // Hide modal
  hideRemoveModal();
  itemToRemove = null;
}

function hideRemoveModal() {
  const modal = document.getElementById("remove-modal");
  modal.classList.add("hidden");
  modal.classList.remove("flex");
}

function clearCart() {
  if (cart.length === 0) return;

  if (confirm("Apakah Anda yakin ingin mengosongkan keranjang?")) {
    cart = [];
    saveCartToStorage();
    updateCartCount();
    showEmptyCart();
    document.getElementById("order-summary").classList.add("hidden");
    document.getElementById("clear-cart").classList.add("hidden");
    showSuccess("Keranjang berhasil dikosongkan");
  }
}

function updateOrderSummary() {
  let subtotal = 0;
  let totalItems = 0;
  let totalDiscount = 0;

  cart.forEach((item) => {
    const productId = item.id || item.productId;
    const product = products[productId];

    if (product) {
      const price = parseFloat(product.price || 0);
      const discount = parseFloat(product.discount || 0);
      const quantity = parseInt(item.quantity || 1);

      const hasDiscount = discount > 0;
      const discountedPrice = hasDiscount
        ? price * (1 - discount / 100)
        : price;
      const discountAmount = hasDiscount
        ? (price - discountedPrice) * quantity
        : 0;

      subtotal += discountedPrice * quantity;
      totalItems += quantity;
      totalDiscount += discountAmount;
    }
  });

  const grandTotal = subtotal; // No shipping cost

  // Update summary display
  document.getElementById("total-items").textContent = totalItems;
  document.getElementById("subtotal").textContent = formatCurrency(subtotal);
  document.getElementById("discount-amount").textContent = formatCurrency(
    totalDiscount
  ).replace("Rp ", "");
  document.getElementById("grand-total").textContent =
    formatCurrency(grandTotal);

  console.log("Order summary updated:", {
    subtotal,
    totalItems,
    totalDiscount,
    grandTotal,
  });
}

function showEmptyCart() {
  document.getElementById("cart-items").innerHTML = "";
  document.getElementById("empty-cart").classList.remove("hidden");
}

function saveCartToStorage() {
  localStorage.setItem("cart", JSON.stringify(cart));
  console.log("Cart saved to storage:", cart);
}

function updateCartCount() {
  const totalItems = cart.reduce(
    (sum, item) => sum + parseInt(item.quantity || 1),
    0
  );
  const cartCountEl = document.getElementById("cart-count");
  if (cartCountEl) {
    cartCountEl.textContent = totalItems;
  }
}

async function loadRecommendedProducts() {
  try {
    if (typeof window.ApiService !== "undefined") {
      const response = await window.ApiService.getProducts({ limit: 4 });

      let products = [];
      if (response && response.data) {
        products = response.data;
      } else if (response && response.products) {
        products = response.products;
      }

      if (products.length > 0) {
        renderRecommendedProducts(products);
      }
    }
  } catch (error) {
    console.error("Error loading recommended products:", error);
  }
}

function renderRecommendedProducts(products) {
  const container = document.getElementById("recommended-products");
  container.innerHTML = "";

  products.forEach((product) => {
    const productCard = createRecommendedProductCard(product);
    container.appendChild(productCard);
  });
}

function createRecommendedProductCard(product) {
  const card = document.createElement("div");
  card.className = 'product-card bg-white rounded-lg shadow-sm hover:shadow-lg overflow-hidden border border-gray-200 cursor-pointer group';

  // Handle image URL
  let imageUrl = product.image_url || product.imageUrl;
  if (imageUrl && imageUrl.startsWith("/api/media/")) {
    imageUrl = `http://localhost:3000${imageUrl}`;
  }
  const fallbackImage =
    "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop&crop=center&q=80";
  const finalImageUrl = imageUrl || fallbackImage;

  const price = parseFloat(product.price || 0);
  const discount = parseFloat(product.discount || 0);
  const hasDiscount = discount > 0;
  const discountedPrice = hasDiscount ? price * (1 - discount / 100) : price;

  card.innerHTML = `
        <div class="product-image-wrapper">
            <img src="${finalImageUrl}" alt="${product.name}"
                 class="product-image"
                 onerror="this.src='${fallbackImage}'">

            ${hasDiscount ? `
                <div class="absolute top-2 left-2 bg-red-500 text-white px-2 py-0.5 rounded text-[10px] font-bold z-10">
                    ${Math.round(discount)}%
                </div>
            ` : ''}

            ${product.stock === 0 ? `
                <div class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
                    <span class="text-white font-bold text-xs sm:text-sm px-3 py-1.5 bg-red-600 rounded">HABIS</span>
                </div>
            ` : ''}
        </div>

        <div class="product-content p-2 sm:p-3">
            <h3 class="font-normal text-gray-800 mb-1 line-clamp-2 text-xs sm:text-sm leading-snug min-h-[2.5rem] sm:min-h-[2.8rem]">
                ${product.name}
            </h3>

            <div class="flex flex-col gap-1">
                <div class="flex items-center gap-1.5">
                    ${hasDiscount ? `
                        <span class="text-[10px] sm:text-xs text-gray-400 line-through">
                            ${formatCurrency(price)}
                        </span>
                    ` : ''}
                </div>
                <span class="text-sm sm:text-base font-bold text-gray-900">
                    ${formatCurrency(discountedPrice)}
                </span>
            </div>

            ${product.stock > 0 && product.stock <= 5 ? `
                <div class="mt-2 text-[10px] sm:text-xs text-orange-600 font-medium">
                    <i class="fas fa-fire text-orange-500 mr-1"></i>Stok terbatas
                </div>
            ` : ''}
        </div>
    `;

  card.addEventListener("click", () => {
    viewProduct(product.id);
  });

  return card;
}

function addToCartFromRecommendation(productId) {
  console.log("Adding product to cart from recommendation:", productId);

  // Check if product already in cart
  const existingIndex = cart.findIndex(
    (item) => (item.id || item.productId) == productId
  );

  if (existingIndex !== -1) {
    // Update quantity
    cart[existingIndex].quantity += 1;
  } else {
    // Add new item
    cart.push({
      id: productId,
      quantity: 1,
      addedAt: new Date().toISOString(),
    });
  }

  // Save and update
  saveCartToStorage();
  updateCartCount();

  // If we're on cart page, refresh
  if (window.location.pathname.includes("cart")) {
    initializeCart();
  }

  showSuccess("Produk berhasil ditambahkan ke keranjang!");
}

function initEventListeners() {
  // Clear cart button
  document.getElementById("clear-cart").addEventListener("click", clearCart);

  // Remove modal buttons
  document
    .getElementById("cancel-remove")
    .addEventListener("click", hideRemoveModal);
  document
    .getElementById("confirm-remove")
    .addEventListener("click", confirmRemoveItem);

  // Checkout button
  document.getElementById("checkout-btn").addEventListener("click", () => {
    if (cart.length === 0) {
      showError("Keranjang masih kosong");
      return;
    }

    // Redirect to checkout page
    window.location.href = "checkout";
  });

  // Promo code
  document
    .getElementById("apply-promo")
    .addEventListener("click", applyPromoCode);
}

function applyPromoCode() {
  const promoInput = document.getElementById("promo-code");
  const promoMessage = document.getElementById("promo-message");
  const promoCode = promoInput.value.trim().toUpperCase();

  if (!promoCode) {
    showError("Masukkan kode promo");
    return;
  }

  // Mock promo codes
  const validPromos = {
    BATIK10: { discount: 10, message: "Selamat! Anda mendapat diskon 10%" },
    WELCOME: { discount: 5, message: "Selamat datang! Diskon 5% untuk Anda" },
    NEWUSER: { discount: 15, message: "Pengguna baru mendapat diskon 15%" },
  };

  if (validPromos[promoCode]) {
    const promo = validPromos[promoCode];
    promoMessage.textContent = promo.message;
    promoMessage.className = "mt-2 text-sm text-green-600";
    promoMessage.classList.remove("hidden");

    showSuccess(`Kode promo berhasil diterapkan! Diskon ${promo.discount}%`);

    // Disable input and button
    promoInput.disabled = true;
    document.getElementById("apply-promo").disabled = true;
    document.getElementById("apply-promo").textContent = "Diterapkan";
  } else {
    promoMessage.textContent = "Kode promo tidak valid atau sudah kadaluarsa";
    promoMessage.className = "mt-2 text-sm text-red-600";
    promoMessage.classList.remove("hidden");

    showError("Kode promo tidak valid");
  }
}

// Global helper functions
function viewProduct(productId) {
  window.location.href = `product-detail?id=${productId}`;
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function showSuccess(message) {
  if (typeof Toastify !== "undefined") {
    Toastify({
      text: message,
      backgroundColor: "#10B981",
      duration: 3000,
      close: true,
    }).showToast();
  }
}

function showError(message) {
  if (typeof Toastify !== "undefined") {
    Toastify({
      text: message,
      backgroundColor: "#EF4444",
      duration: 3000,
      close: true,
    }).showToast();
  }
}

// Initialize cart count on page load
document.addEventListener("DOMContentLoaded", updateCartCount);
