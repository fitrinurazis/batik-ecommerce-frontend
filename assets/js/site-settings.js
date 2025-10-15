/**
 * Site Settings Loader
 * Loads public site settings and updates the UI
 */

async function loadSiteSettings() {
  try {
    const response = await axios.get("https://admin30.fitrinurazis.com/api/settings/public");

    if (response.data && response.data.success) {
      const settings = response.data.data;
      updateSiteInfo(settings);
    }
  } catch (error) {
    console.warn("Could not load site settings, using defaults:", error.message);
    // Page will continue to work with default values
  }
}

function updateSiteInfo(settings) {
  const general = settings?.general || {};

  // Update site title in navbar
  if (general.site_title) {
    const siteTitleEl = document.getElementById("site-title");
    if (siteTitleEl) {
      siteTitleEl.textContent = general.site_title;
    }

    // Update footer title
    const footerTitleEl = document.getElementById("footer-title");
    if (footerTitleEl) {
      footerTitleEl.textContent = general.site_title;
    }

    // Update document title
    const currentTitle = document.title;
    if (currentTitle.includes("Batik Nusantara")) {
      document.title = currentTitle.replace("Batik Nusantara", general.site_title);
    }
  }

  // Update site tagline in footer
  if (general.site_tagline) {
    const footerTaglineEl = document.getElementById("footer-tagline");
    if (footerTaglineEl) {
      footerTaglineEl.textContent = general.site_tagline;
    }

    // Update meta description with site_tagline if available
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && !metaDesc.hasAttribute('data-user-set')) {
      // Only update if not manually set by user
      const descText = general.site_tagline;
      metaDesc.setAttribute("content", descText);
    }
  }

  // Update site logo in navbar
  if (general.site_logo) {
    const siteLogoEl = document.getElementById("site-logo");
    const siteLogoIconEl = document.getElementById("site-logo-icon");

    if (siteLogoEl && siteLogoIconEl) {
      siteLogoEl.src = general.site_logo;
      siteLogoEl.classList.remove("hidden");
      siteLogoEl.style.display = "block";

      // Hide the icon when logo is loaded successfully
      siteLogoEl.onload = function() {
        siteLogoIconEl.style.display = "none";
      };

      // Show icon if logo fails to load
      siteLogoEl.onerror = function() {
        this.style.display = "none";
        siteLogoIconEl.style.display = "block";
      };
    }

    // Update footer logo
    const footerLogoEl = document.getElementById("footer-logo");
    const footerLogoIconEl = document.getElementById("footer-logo-icon");

    if (footerLogoEl && footerLogoIconEl) {
      footerLogoEl.src = general.site_logo;
      footerLogoEl.classList.remove("hidden");
      footerLogoEl.style.display = "block";

      // Hide the icon when logo is loaded successfully
      footerLogoEl.onload = function() {
        footerLogoIconEl.style.display = "none";
      };

      // Show icon if logo fails to load
      footerLogoEl.onerror = function() {
        this.style.display = "none";
        footerLogoIconEl.style.display = "block";
      };
    }
  }

  // Update footer contact information
  const shop = settings?.shop || {};

  // Update footer address
  if (shop.shop_address) {
    const footerAddressEl = document.getElementById("footer-address");
    if (footerAddressEl) {
      footerAddressEl.innerHTML = shop.shop_address.replace(/\n/g, "<br>");
    }
  }

  // Update footer phone
  if (shop.shop_phone) {
    const footerPhoneEl = document.getElementById("footer-phone");
    if (footerPhoneEl) {
      footerPhoneEl.textContent = shop.shop_phone;
    }
  }

  // Update footer email
  if (shop.shop_email) {
    const footerEmailEl = document.getElementById("footer-email");
    if (footerEmailEl) {
      footerEmailEl.textContent = shop.shop_email;
    }
  }

  // Update footer social media links
  if (shop.shop_facebook) {
    const fbEl = document.getElementById("footer-social-facebook");
    if (fbEl) {
      fbEl.style.display = "inline-block";
      const fbUrl = shop.shop_facebook.startsWith("http")
        ? shop.shop_facebook
        : `https://facebook.com/${shop.shop_facebook}`;
      fbEl.href = fbUrl;
    }
  }

  if (shop.shop_instagram) {
    const igEl = document.getElementById("footer-social-instagram");
    if (igEl) {
      igEl.style.display = "inline-block";
      const igUsername = shop.shop_instagram.replace("@", "");
      const igUrl = shop.shop_instagram.startsWith("http")
        ? shop.shop_instagram
        : `https://instagram.com/${igUsername}`;
      igEl.href = igUrl;
    }
  }

  if (shop.shop_whatsapp) {
    const waEl = document.getElementById("footer-social-whatsapp");
    if (waEl) {
      waEl.style.display = "inline-block";
      const waNumber = shop.shop_whatsapp.replace(/\D/g, "");
      waEl.href = `https://wa.me/${waNumber}`;
    }
  }

  if (shop.shop_tiktok) {
    const ttEl = document.getElementById("footer-social-tiktok");
    if (ttEl) {
      ttEl.style.display = "inline-block";
      const ttUsername = shop.shop_tiktok.replace("@", "");
      const ttUrl = shop.shop_tiktok.startsWith("http")
        ? shop.shop_tiktok
        : `https://tiktok.com/@${ttUsername}`;
      ttEl.href = ttUrl;
    }
  }

  // Store settings globally for other scripts to use
  window.siteSettings = settings;
}

// Load settings when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadSiteSettings);
} else {
  loadSiteSettings();
}

// Export for use in other scripts
if (typeof window !== 'undefined') {
  window.loadSiteSettings = loadSiteSettings;
}
