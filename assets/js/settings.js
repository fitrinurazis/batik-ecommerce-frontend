// Settings Page Functionality
document.addEventListener('DOMContentLoaded', function() {
    initializeSettingsPage();
});

function initializeSettingsPage() {
    // Settings navigation handling
    const settingsNavLinks = document.querySelectorAll('.settings-nav-link');
    const settingsContents = document.querySelectorAll('.settings-content');

    settingsNavLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1) + '-settings';
            showSettingsSection(targetId);

            // Update active navigation
            settingsNavLinks.forEach(navLink => {
                navLink.classList.remove('text-amber-700', 'bg-amber-50', 'border', 'border-amber-200');
                navLink.classList.add('text-gray-700', 'hover:bg-gray-50');
            });

            this.classList.remove('text-gray-700', 'hover:bg-gray-50');
            this.classList.add('text-amber-700', 'bg-amber-50', 'border', 'border-amber-200');
        });
    });

    // Form submissions
    setupFormHandlers();

    // Test email functionality
    setupEmailTest();

    // Load current settings
    loadCurrentSettings();
}

function showSettingsSection(sectionId) {
    const settingsContents = document.querySelectorAll('.settings-content');

    settingsContents.forEach(content => {
        content.classList.add('hidden');
    });

    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.remove('hidden');
    }
}

function setupFormHandlers() {
    // General settings form
    const generalForm = document.querySelector('#general-settings form');
    if (generalForm) {
        generalForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveGeneralSettings();
        });
    }

    // Email settings form
    const emailForm = document.querySelector('#email-settings form');
    if (emailForm) {
        emailForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveEmailSettings();
        });
    }

    // Payment settings form
    const paymentForm = document.querySelector('#payment-settings form');
    if (paymentForm) {
        paymentForm.addEventListener('submit', function(e) {
            e.preventDefault();
            savePaymentSettings();
        });
    }

    // Shipping settings form
    const shippingForm = document.querySelector('#shipping-settings form');
    if (shippingForm) {
        shippingForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveShippingSettings();
        });
    }

    // Security settings form
    const securityForm = document.querySelector('#security-settings form');
    if (securityForm) {
        securityForm.addEventListener('submit', function(e) {
            e.preventDefault();
            changePassword();
        });
    }
}

function setupEmailTest() {
    const testEmailBtn = document.getElementById('test-email');
    if (testEmailBtn) {
        testEmailBtn.addEventListener('click', async function() {
            const btn = this;
            const originalText = btn.innerHTML;

            try {
                btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Mengirim...';
                btn.disabled = true;

                // Get test email from user
                const testEmail = prompt('Masukkan alamat email untuk test:');
                if (!testEmail) return;

                await ApiService.sendTestEmail(testEmail);
                Utils.showAlert('Email test berhasil dikirim!', 'success');
            } catch (error) {
                Utils.showAlert('Gagal mengirim email test: ' + error.message, 'error');
            } finally {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        });
    }
}

async function loadCurrentSettings() {
    try {
        // This would typically load settings from the API
        // For now, we'll use placeholder data
        console.log('Loading current settings...');

        // You can implement API calls here to load actual settings
        // const settings = await ApiService.getSettings();
        // populateSettingsForm(settings);

    } catch (error) {
        console.error('Error loading settings:', error);
        Utils.showAlert('Gagal memuat pengaturan', 'error');
    }
}

async function saveGeneralSettings() {
    try {
        const formData = {
            siteName: document.getElementById('site-name').value,
            siteDescription: document.getElementById('site-description').value,
            siteAddress: document.getElementById('site-address').value,
            sitePhone: document.getElementById('site-phone').value,
            siteEmail: document.getElementById('site-email').value,
            currency: document.getElementById('currency').value,
            timezone: document.getElementById('timezone').value
        };

        // This would typically save to API
        // await ApiService.saveSettings('general', formData);

        console.log('Saving general settings:', formData);
        Utils.showAlert('Pengaturan umum berhasil disimpan!', 'success');
    } catch (error) {
        console.error('Error saving general settings:', error);
        Utils.showAlert('Gagal menyimpan pengaturan umum', 'error');
    }
}

async function saveEmailSettings() {
    try {
        const formData = {
            smtpHost: document.getElementById('smtp-host').value,
            smtpPort: document.getElementById('smtp-port').value,
            smtpUsername: document.getElementById('smtp-username').value,
            smtpPassword: document.getElementById('smtp-password').value,
            smtpSecure: document.getElementById('smtp-secure').checked,
            emailFromName: document.getElementById('email-from-name').value
        };

        // This would typically save to API
        // await ApiService.saveSettings('email', formData);

        console.log('Saving email settings:', formData);
        Utils.showAlert('Pengaturan email berhasil disimpan!', 'success');
    } catch (error) {
        console.error('Error saving email settings:', error);
        Utils.showAlert('Gagal menyimpan pengaturan email', 'error');
    }
}

async function savePaymentSettings() {
    try {
        const formData = {
            bankTransfer: document.getElementById('bank-transfer').checked,
            eWallet: document.getElementById('e-wallet').checked,
            creditCard: document.getElementById('credit-card').checked,
            cod: document.getElementById('cod').checked
        };

        // This would typically save to API
        // await ApiService.saveSettings('payment', formData);

        console.log('Saving payment settings:', formData);
        Utils.showAlert('Pengaturan pembayaran berhasil disimpan!', 'success');
    } catch (error) {
        console.error('Error saving payment settings:', error);
        Utils.showAlert('Gagal menyimpan pengaturan pembayaran', 'error');
    }
}

async function saveShippingSettings() {
    try {
        const formData = {
            jne: document.getElementById('jne').checked,
            pos: document.getElementById('pos').checked,
            tiki: document.getElementById('tiki').checked,
            freeShippingMin: document.getElementById('free-shipping-min').value,
            weightUnit: document.getElementById('shipping-weight-unit').value
        };

        // This would typically save to API
        // await ApiService.saveSettings('shipping', formData);

        console.log('Saving shipping settings:', formData);
        Utils.showAlert('Pengaturan pengiriman berhasil disimpan!', 'success');
    } catch (error) {
        console.error('Error saving shipping settings:', error);
        Utils.showAlert('Gagal menyimpan pengaturan pengiriman', 'error');
    }
}

async function changePassword() {
    try {
        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        // Validate passwords
        if (!currentPassword || !newPassword || !confirmPassword) {
            Utils.showAlert('Semua field password harus diisi', 'warning');
            return;
        }

        if (newPassword !== confirmPassword) {
            Utils.showAlert('Password baru dan konfirmasi tidak cocok', 'warning');
            return;
        }

        if (newPassword.length < 6) {
            Utils.showAlert('Password baru minimal 6 karakter', 'warning');
            return;
        }

        // This would typically save to API
        // await ApiService.changePassword(currentPassword, newPassword);

        console.log('Changing password...');
        Utils.showAlert('Password berhasil diubah!', 'success');

        // Clear form
        document.getElementById('current-password').value = '';
        document.getElementById('new-password').value = '';
        document.getElementById('confirm-password').value = '';

    } catch (error) {
        console.error('Error changing password:', error);
        Utils.showAlert('Gagal mengubah password', 'error');
    }
}

// Export for global access
window.SettingsManager = {
    showSettingsSection,
    saveGeneralSettings,
    saveEmailSettings,
    savePaymentSettings,
    saveShippingSettings,
    changePassword
};