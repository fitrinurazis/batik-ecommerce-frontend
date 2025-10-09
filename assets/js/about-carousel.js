document.addEventListener("DOMContentLoaded", function () {
  const slides = document.querySelectorAll(".carousel-slide-about");
  const indicators = document.querySelectorAll(".indicator-about");
  const prevBtn = document.querySelector(".carousel-prev-about");
  const nextBtn = document.querySelector(".carousel-next-about");

  let currentSlide = 0;
  let autoplayInterval;
  const autoplayDelay = 4000; // 4 seconds

  // Show specific slide
  function showSlide(index) {
    // Remove active class from all slides and indicators
    slides.forEach((slide) => {
      slide.classList.remove("active");
    });
    indicators.forEach((indicator) => {
      indicator.classList.remove("active");
    });

    // Add active class to current slide and indicator
    slides[index].classList.add("active");
    indicators[index].classList.add("active");
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
  const aboutCarousel = document.querySelector(".about-carousel");
  if (aboutCarousel) {
    aboutCarousel.addEventListener("mouseenter", () => {
      clearInterval(autoplayInterval);
    });

    aboutCarousel.addEventListener("mouseleave", () => {
      startAutoplay();
    });
  }

  // Event listeners for navigation buttons
  if (prevBtn) {
    prevBtn.addEventListener("click", prevSlide);
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", nextSlide);
  }

  // Event listeners for indicators
  indicators.forEach((indicator, index) => {
    indicator.addEventListener("click", () => {
      currentSlide = index;
      showSlide(currentSlide);
      resetAutoplay();
    });
  });

  // Touch swipe support for mobile
  let touchStartX = 0;
  let touchEndX = 0;

  if (aboutCarousel) {
    aboutCarousel.addEventListener("touchstart", (e) => {
      touchStartX = e.changedTouches[0].screenX;
    });

    aboutCarousel.addEventListener("touchend", (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    });
  }

  function handleSwipe() {
    const swipeThreshold = 50;
    if (touchEndX < touchStartX - swipeThreshold) {
      nextSlide();
    } else if (touchEndX > touchStartX + swipeThreshold) {
      prevSlide();
    }
  }

  // Start autoplay on page load
  startAutoplay();

  // Pause autoplay when page is not visible
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      clearInterval(autoplayInterval);
    } else {
      startAutoplay();
    }
  });
});
