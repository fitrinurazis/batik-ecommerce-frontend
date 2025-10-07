document.addEventListener('DOMContentLoaded', function() {
    function waitForDependencies() {
        if (typeof window.ApiService !== 'undefined' && typeof window.Utils !== 'undefined') {
            initHomepage();
        } else {
            setTimeout(waitForDependencies, 100);
        }
    }

    waitForDependencies();
});

function initHomepage() {
    try {
        initSmoothScrolling();
        initCarousel();

        if (window.navbar && typeof window.navbar.updateCartCount === 'function') {
            window.navbar.updateCartCount();
        } else {
            updateCartCount();
        }
    } catch (error) {
        console.error('Error initializing homepage:', error);
    }
}


function initSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);

            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

function initCarousel() {
    const slides = document.querySelectorAll('.carousel-slide');
    const indicators = document.querySelectorAll('.indicator');
    const prevBtn = document.querySelector('.carousel-prev');
    const nextBtn = document.querySelector('.carousel-next');

    let currentSlide = 0;
    let autoplayInterval;
    const autoplayDelay = 5000; // 5 seconds

    // Show specific slide
    function showSlide(index) {
        // Remove active class from all slides and indicators
        slides.forEach(slide => {
            slide.classList.remove('active');
        });
        indicators.forEach(indicator => {
            indicator.classList.remove('active');
        });

        // Add active class to current slide and indicator
        slides[index].classList.add('active');
        indicators[index].classList.add('active');
    }

    // Go to next slide
    function nextSlide() {
        currentSlide = (currentSlide + 1) % slides.length;
        showSlide(currentSlide);
        resetAutoplay();
    }

    // Go to previous slide
    function prevSlide() {
        currentSlide = (currentSlide - 1 + slides.length) % slides.length;
        showSlide(currentSlide);
        resetAutoplay();
    }

    // Start autoplay
    function startAutoplay() {
        autoplayInterval = setInterval(nextSlide, autoplayDelay);
    }

    // Reset autoplay (stop and start again)
    function resetAutoplay() {
        clearInterval(autoplayInterval);
        startAutoplay();
    }

    // Stop autoplay on hover
    const heroCarousel = document.querySelector('.hero-carousel');
    if (heroCarousel) {
        heroCarousel.addEventListener('mouseenter', () => {
            clearInterval(autoplayInterval);
        });

        heroCarousel.addEventListener('mouseleave', () => {
            startAutoplay();
        });
    }

    // Event listeners for navigation buttons
    if (prevBtn) {
        prevBtn.addEventListener('click', prevSlide);
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', nextSlide);
    }

    // Event listeners for indicators
    indicators.forEach((indicator, index) => {
        indicator.addEventListener('click', () => {
            currentSlide = index;
            showSlide(currentSlide);
            resetAutoplay();
        });
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
            prevSlide();
        } else if (e.key === 'ArrowRight') {
            nextSlide();
        }
    });

    // Touch swipe support for mobile
    let touchStartX = 0;
    let touchEndX = 0;

    if (heroCarousel) {
        heroCarousel.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        });

        heroCarousel.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        });
    }

    function handleSwipe() {
        const swipeThreshold = 50; // minimum distance for swipe
        if (touchEndX < touchStartX - swipeThreshold) {
            // Swipe left - next slide
            nextSlide();
        } else if (touchEndX > touchStartX + swipeThreshold) {
            // Swipe right - previous slide
            prevSlide();
        }
    }

    // Start autoplay on page load
    startAutoplay();

    // Pause autoplay when page is not visible
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            clearInterval(autoplayInterval);
        } else {
            startAutoplay();
        }
    });
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount);
}

function viewProduct(productId) {
    const baseUrl = window.location.origin;
    const currentPath = window.location.pathname;

    let rootPath = currentPath.replace('/index.html', '');
    if (!rootPath.endsWith('/')) {
        rootPath += '/';
    }

    if (currentPath.includes('/pages/')) {
        const segments = currentPath.split('/');
        const rootSegments = segments.slice(0, segments.indexOf('pages'));
        rootPath = rootSegments.join('/') + '/';
    }

    const targetUrl = `${baseUrl}${rootPath}pages/product-detail.html?id=${productId}`;
    window.location.href = targetUrl;
}

function addToCart(productId) {
    try {
        let cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const existingIndex = cart.findIndex(item => (item.id || item.productId) == productId);

        if (existingIndex !== -1) {
            cart[existingIndex].quantity += 1;
        } else {
            cart.push({
                id: productId,
                productId: productId,
                quantity: 1,
                addedAt: new Date().toISOString()
            });
        }

        localStorage.setItem('cart', JSON.stringify(cart));

        if (window.navbar && typeof window.navbar.updateCartCount === 'function') {
            window.navbar.updateCartCount();
        } else {
            updateCartCount();
        }

        showSuccessToast('Produk berhasil ditambahkan ke keranjang!');

    } catch (error) {
        console.error('Error adding to cart:', error);
        showErrorToast('Gagal menambahkan produk ke keranjang');
    }
}

function updateCartCount() {
    const cartCountElement = document.getElementById('cart-count');
    if (cartCountElement) {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const totalItems = cart.reduce((sum, item) => sum + parseInt(item.quantity || 0), 0);
        cartCountElement.textContent = totalItems;

        if (totalItems > 0) {
            cartCountElement.classList.add('animate-pulse');
        } else {
            cartCountElement.classList.remove('animate-pulse');
        }
    }
}

function showSuccessToast(message) {
    if (typeof Toastify !== 'undefined') {
        Toastify({
            text: message,
            duration: 3000,
            gravity: "top",
            position: "right",
            backgroundColor: "#10B981",
            stopOnFocus: true,
        }).showToast();
    } else {
        // Fallback
        alert(message);
    }
}

function showErrorToast(message) {
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
        // Fallback
        alert(message);
    }
}

window.viewProduct = viewProduct;
window.addToCart = addToCart;