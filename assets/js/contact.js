const contactForm = document.getElementById("contact-form");
const submitBtn = document.getElementById("submit-btn");
let adminEmail = "";
let shopWhatsapp = "6281234567890"; // Default WhatsApp number
let shopPhone = "+62 274 123456"; // Default phone number

async function loadSettings() {
  try {
    // Load public settings from backend (no auth required)
    const API_BASE = window.API_BASE_URL || "https://admin30.fitrinurazis.com/api";
    const response = await axios.get(`${API_BASE}/settings/public`);

    // Check if response is successful
    if (response.data && response.data.success) {
      const settings = response.data.data;

      // Set admin email from shop settings
      adminEmail = settings?.shop?.shop_email || "info@batiknusantara.com";

      updateContactInfo(settings);
    } else {
      console.warn("Invalid response format from backend");
      adminEmail = "info@batiknusantara.com";
    }
  } catch (error) {
    console.warn("Could not load settings from backend, using default values:", error.message);
    // Set default admin email if backend is unavailable
    adminEmail = "info@batiknusantara.com";
    // Page will still work with default contact info shown in HTML
  }
}

function updateContactInfo(settings) {
  console.log("=== Contact Info Update ===");
  console.log("Full settings:", settings);

  const shop = settings?.shop || {};
  console.log("Shop settings:", shop);

  // Store contact info for later use
  if (shop.shop_whatsapp) {
    shopWhatsapp = shop.shop_whatsapp.replace(/\D/g, "");
  }
  if (shop.shop_phone) {
    shopPhone = shop.shop_phone;
  }

  // Update shop address
  if (shop.shop_address) {
    const addressEl = document.getElementById("shop-address-display");
    if (addressEl) {
      addressEl.innerHTML = shop.shop_address.replace(/\n/g, "<br>");
    }

    const footerAddressEl = document.getElementById("footer-address");
    if (footerAddressEl) {
      footerAddressEl.innerHTML = shop.shop_address.replace(/\n/g, "<br>");
    }
  }

  // Update shop phone
  if (shop.shop_phone) {
    const phoneEl = document.getElementById("shop-phone-display");
    if (phoneEl) {
      phoneEl.textContent = shop.shop_phone;
    }

    const footerPhoneEl = document.getElementById("footer-phone");
    if (footerPhoneEl) {
      footerPhoneEl.textContent = shop.shop_phone;
    }
  }

  // Update shop email
  if (shop.shop_email) {
    const emailEl = document.getElementById("shop-email-display");
    if (emailEl) {
      emailEl.textContent = shop.shop_email;
    }

    const footerEmailEl = document.getElementById("footer-email");
    if (footerEmailEl) {
      footerEmailEl.textContent = shop.shop_email;
    }
  }

  // Update WhatsApp contact info
  if (shop.shop_whatsapp) {
    const waContainer = document.getElementById("shop-whatsapp-container");
    const waEl = document.getElementById("shop-whatsapp-display");
    if (waEl && waContainer) {
      waContainer.style.display = "flex";
      const waNumber = shop.shop_whatsapp.replace(/\D/g, "");
      waEl.href = `https://wa.me/${waNumber}`;
      waEl.textContent = shop.shop_whatsapp;
    }
  } else {
    const waContainer = document.getElementById("shop-whatsapp-container");
    if (waContainer) {
      waContainer.style.display = "none";
    }
  }

  // Update social media links
  if (shop.shop_facebook) {
    const fbEl = document.getElementById("social-facebook");
    if (fbEl) {
      fbEl.style.display = "inline-block";
      const fbUrl = shop.shop_facebook.startsWith("http")
        ? shop.shop_facebook
        : `https://facebook.com/${shop.shop_facebook}`;
      fbEl.href = fbUrl;
    }
  }

  if (shop.shop_instagram) {
    const igEl = document.getElementById("social-instagram");
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
    const waEl = document.getElementById("social-whatsapp");
    if (waEl) {
      waEl.style.display = "inline-block";
      const waNumber = shop.shop_whatsapp.replace(/\D/g, "");
      waEl.href = `https://wa.me/${waNumber}`;
    }
  }

  // Update operating hours if available
  if (shop.shop_operating_hours) {
    const hours = shop.shop_operating_hours;
    const operatingHoursContainer = document.querySelector('.text-gray-700.space-y-1');

    if (operatingHoursContainer && hours.weekdays) {
      operatingHoursContainer.innerHTML = `
        <p>
          <span class="font-medium">Senin - Jumat:</span> ${hours.weekdays}
        </p>
        <p>
          <span class="font-medium">Sabtu:</span> ${hours.saturday || 'Tutup'}
        </p>
        <p><span class="font-medium">Minggu:</span> ${hours.sunday || 'Tutup'}</p>
      `;
    }
  }
}

loadSettings();

if (contactForm) {
  contactForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const subject = document.getElementById("subject").value;
    const message = document.getElementById("message").value.trim();

    if (!name || !email || !subject || !message) {
      Swal.fire({
        icon: "warning",
        title: "Peringatan",
        text: "Mohon lengkapi semua field yang wajib diisi!",
        confirmButtonColor: "#d97706",
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Swal.fire({
        icon: "error",
        title: "Email Tidak Valid",
        text: "Mohon masukkan alamat email yang valid!",
        confirmButtonColor: "#d97706",
      });
      return;
    }

    const originalBtnContent = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML =
      '<i class="fas fa-spinner fa-spin mr-2"></i> Mengirim...';

    try {
      const API_BASE = window.API_BASE_URL || "https://admin30.fitrinurazis.com/api";
      const response = await axios.post(
        `${API_BASE}/email/contact`,
        {
          name: name,
          email: email,
          subject: subject,
          message: message,
          to: adminEmail || "info@batiknusantara.com",
        }
      );

      Swal.fire({
        icon: "success",
        title: "Pesan Terkirim!",
        text: "Terima kasih atas pesan Anda. Tim kami akan segera menghubungi Anda.",
        confirmButtonColor: "#d97706",
      });

      contactForm.reset();
    } catch (error) {
      console.error("Error sending message:", error);

      // Check if backend is not available
      if (!error.response) {
        // Backend is offline - show alternative contact methods
        const waLink = `https://wa.me/${shopWhatsapp}`;
        const emailLink = `mailto:${adminEmail || 'info@batiknusantara.com'}`;

        Swal.fire({
          icon: "info",
          title: "Layanan Email Sedang Tidak Tersedia",
          html: `
            <p class="mb-4">Maaf, layanan email sedang dalam pemeliharaan.</p>
            <p class="mb-2">Silakan hubungi kami melalui:</p>
            <div class="text-left">
              <p class="mb-2">📧 Email: <a href="${emailLink}" class="text-amber-600 hover:underline">${adminEmail || 'info@batiknusantara.com'}</a></p>
              <p class="mb-2">📱 WhatsApp: <a href="${waLink}" class="text-amber-600 hover:underline" target="_blank">${shopPhone}</a></p>
              <p>📞 Telepon: ${shopPhone}</p>
            </div>
          `,
          confirmButtonColor: "#d97706",
          confirmButtonText: "OK"
        });
      } else {
        const errorMessage =
          error.response?.data?.message ||
          "Terjadi kesalahan saat mengirim pesan. Silakan coba lagi.";

        Swal.fire({
          icon: "error",
          title: "Gagal Mengirim",
          text: errorMessage,
          confirmButtonColor: "#d97706",
        });
      }
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnContent;
    }
  });
}
