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
        console.log('Loading current settings...');

        const settings = await ApiService.getSettings();
        populateSettingsForm(settings);

    } catch (error) {
        console.error('Error loading settings:', error);
        Utils.showAlert('Gagal memuat pengaturan', 'error');
    }
}

async function saveGeneralSettings() {
    try {
        const formData = {
            site_name: document.getElementById('site-name').value,
            site_description: document.getElementById('site-description').value,
            site_address: document.getElementById('site-address').value,
            site_phone: document.getElementById('site-phone').value,
            site_email: document.getElementById('site-email').value,
            currency: document.getElementById('currency').value,
            timezone: document.getElementById('timezone').value
        };

        await ApiService.saveSettings('general', formData);
        Utils.showAlert('Pengaturan umum berhasil disimpan!', 'success');
    } catch (error) {
        console.error('Error saving general settings:', error);
        Utils.showAlert('Gagal menyimpan pengaturan umum', 'error');
    }
}

async function saveEmailSettings() {
    try {
        const formData = {
            smtp_host: document.getElementById('smtp-host').value,
            smtp_port: document.getElementById('smtp-port').value,
            smtp_username: document.getElementById('smtp-username').value,
            smtp_password: document.getElementById('smtp-password').value,
            smtp_secure: document.getElementById('smtp-secure').checked,
            email_from_name: document.getElementById('email-from-name').value
        };

        await ApiService.saveSettings('email', formData);
        Utils.showAlert('Pengaturan email berhasil disimpan!', 'success');
    } catch (error) {
        console.error('Error saving email settings:', error);
        Utils.showAlert('Gagal menyimpan pengaturan email', 'error');
    }
}

async function savePaymentSettings() {
    try {
        const paymentMethods = {
            bank_transfer: document.getElementById('bank-transfer').checked,
            e_wallet: document.getElementById('e-wallet').checked,
            credit_card: document.getElementById('credit-card').checked,
            cod: document.getElementById('cod').checked
        };

        const formData = {
            payment_methods: JSON.stringify(paymentMethods)
        };

        await ApiService.saveSettings('payment', formData);
        Utils.showAlert('Pengaturan pembayaran berhasil disimpan!', 'success');
    } catch (error) {
        console.error('Error saving payment settings:', error);
        Utils.showAlert('Gagal menyimpan pengaturan pembayaran', 'error');
    }
}

async function saveShippingSettings() {
    try {
        const shippingCouriers = {
            jne: document.getElementById('jne').checked,
            pos: document.getElementById('pos').checked,
            tiki: document.getElementById('tiki').checked
        };

        const formData = {
            shipping_couriers: JSON.stringify(shippingCouriers),
            free_shipping_min: document.getElementById('free-shipping-min').value,
            weight_unit: document.getElementById('shipping-weight-unit').value
        };

        await ApiService.saveSettings('shipping', formData);
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

        await ApiService.changePassword(currentPassword, newPassword);
        Utils.showAlert('Password berhasil diubah!', 'success');

        document.getElementById('current-password').value = '';
        document.getElementById('new-password').value = '';
        document.getElementById('confirm-password').value = '';

    } catch (error) {
        console.error('Error changing password:', error);
        Utils.showAlert('Gagal mengubah password', 'error');
    }
}

function populateSettingsForm(settings) {
    try {
        if (settings.general) {
            const general = settings.general;
            if (general.site_name !== undefined) document.getElementById('site-name').value = general.site_name || '';
            if (general.site_description !== undefined) document.getElementById('site-description').value = general.site_description || '';
            if (general.site_address !== undefined) document.getElementById('site-address').value = general.site_address || '';
            if (general.site_phone !== undefined) document.getElementById('site-phone').value = general.site_phone || '';
            if (general.site_email !== undefined) document.getElementById('site-email').value = general.site_email || '';
            if (general.currency !== undefined) document.getElementById('currency').value = general.currency || 'IDR';
            if (general.timezone !== undefined) document.getElementById('timezone').value = general.timezone || 'Asia/Jakarta';
        }

        if (settings.email) {
            const email = settings.email;
            if (email.smtp_host !== undefined) document.getElementById('smtp-host').value = email.smtp_host || '';
            if (email.smtp_port !== undefined) document.getElementById('smtp-port').value = email.smtp_port || '587';
            if (email.smtp_username !== undefined) document.getElementById('smtp-username').value = email.smtp_username || '';
            if (email.smtp_password !== undefined) document.getElementById('smtp-password').value = email.smtp_password || '';
            if (email.smtp_secure !== undefined) document.getElementById('smtp-secure').checked = email.smtp_secure === true;
            if (email.email_from_name !== undefined) document.getElementById('email-from-name').value = email.email_from_name || '';
        }

        if (settings.payment && settings.payment.payment_methods) {
            const paymentMethods = settings.payment.payment_methods;
            if (paymentMethods.bank_transfer !== undefined) document.getElementById('bank-transfer').checked = paymentMethods.bank_transfer;
            if (paymentMethods.e_wallet !== undefined) document.getElementById('e-wallet').checked = paymentMethods.e_wallet;
            if (paymentMethods.credit_card !== undefined) document.getElementById('credit-card').checked = paymentMethods.credit_card;
            if (paymentMethods.cod !== undefined) document.getElementById('cod').checked = paymentMethods.cod;
        }

        if (settings.shipping) {
            const shipping = settings.shipping;
            if (shipping.shipping_couriers) {
                const couriers = shipping.shipping_couriers;
                if (couriers.jne !== undefined) document.getElementById('jne').checked = couriers.jne;
                if (couriers.pos !== undefined) document.getElementById('pos').checked = couriers.pos;
                if (couriers.tiki !== undefined) document.getElementById('tiki').checked = couriers.tiki;
            }
            if (shipping.free_shipping_min !== undefined) document.getElementById('free-shipping-min').value = shipping.free_shipping_min || '500000';
            if (shipping.weight_unit !== undefined) document.getElementById('shipping-weight-unit').value = shipping.weight_unit || 'gram';
        }
    } catch (error) {
        console.error('Error populating settings form:', error);
    }
}

window.SettingsManager = {
    showSettingsSection,
    saveGeneralSettings,
    saveEmailSettings,
    savePaymentSettings,
    saveShippingSettings,
    changePassword,
    populateSettingsForm
};