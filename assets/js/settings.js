// Settings Page Functionality
document.addEventListener('DOMContentLoaded', function() {
    initializeSettingsPage();
});

function initializeSettingsPage() {
    const settingsNavLinks = document.querySelectorAll('.settings-nav-link');
    const settingsContents = document.querySelectorAll('.settings-content');

    settingsNavLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1) + '-settings';
            showSettingsSection(targetId);

            settingsNavLinks.forEach(navLink => {
                navLink.classList.remove('text-amber-700', 'bg-amber-50', 'border', 'border-amber-200');
                navLink.classList.add('text-gray-700', 'hover:bg-gray-50');
            });

            this.classList.remove('text-gray-700', 'hover:bg-gray-50');
            this.classList.add('text-amber-700', 'bg-amber-50', 'border', 'border-amber-200');
        });
    });

    setupFormHandlers();
    setupEmailTest();
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
    const generalForm = document.querySelector('#general-settings form');
    if (generalForm) {
        generalForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveGeneralSettings();
        });
    }

    const emailForm = document.querySelector('#email-settings form');
    if (emailForm) {
        emailForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveEmailSettings();
        });
    }

    const paymentForm = document.querySelector('#payment-form');
    if (paymentForm) {
        paymentForm.addEventListener('submit', function(e) {
            e.preventDefault();
            savePaymentSettings();
        });
    }

    const shippingForm = document.querySelector('#shipping-form');
    if (shippingForm) {
        shippingForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveShippingSettings();
        });
    }

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
        // Fetch dari API
        const response = await ApiService.getSettings();

        // Group by category
        const groupedSettings = {};
        if (Array.isArray(response)) {
            response.forEach(setting => {
                if (!groupedSettings[setting.category]) {
                    groupedSettings[setting.category] = {};
                }
                groupedSettings[setting.category][setting.key] = setting.value;
            });
        }

        // Save to global variable
        window.siteSettings = groupedSettings;

        // Populate form
        populateSettingsForm(groupedSettings);

    } catch (error) {
        console.error('Error loading settings:', error);
        Utils.showAlert('Gagal memuat pengaturan', 'error');
    }
}

async function saveGeneralSettings() {
    try {
        const settings = {};

        const getElementValue = (htmlId, apiKey) => {
            const el = document.getElementById(htmlId);
            if (el) {
                // Always send value, even if empty, so users can clear fields
                settings[apiKey] = el.value || '';
            }
        };

        const getElementChecked = (htmlId, apiKey) => {
            const el = document.getElementById(htmlId);
            if (el) settings[apiKey] = el.checked;
        };

        getElementValue('site-title', 'site_title');
        getElementValue('site-tagline', 'site_tagline');
        getElementValue('site-logo', 'site_logo');
        getElementValue('currency', 'currency');
        getElementValue('timezone', 'timezone');
        getElementValue('language', 'language');
        getElementChecked('maintenance-mode', 'maintenance_mode');
        getElementValue('shop-name', 'shop_name');
        getElementValue('shop-owner', 'shop_owner');
        getElementValue('shop-address', 'shop_address');
        getElementValue('shop-phone', 'shop_phone');
        getElementValue('shop-email', 'shop_email');
        getElementValue('shop-whatsapp', 'shop_whatsapp');
        getElementValue('shop-instagram', 'shop_instagram');
        getElementValue('shop-facebook', 'shop_facebook');
        getElementValue('shop-tiktok', 'shop_tiktok');

        // Save to API (data akan tersimpan di database)
        await ApiService.saveSettings('general', settings);

        // Update global variable - split by category like backend does
        if (!window.siteSettings) {
            window.siteSettings = {};
        }
        if (!window.siteSettings.general) {
            window.siteSettings.general = {};
        }
        if (!window.siteSettings.shop) {
            window.siteSettings.shop = {};
        }

        // Split settings into correct categories
        Object.keys(settings).forEach(key => {
            if (key.startsWith('shop_')) {
                window.siteSettings.shop[key] = settings[key];
            } else {
                window.siteSettings.general[key] = settings[key];
            }
        });

        Utils.showAlert('Pengaturan umum berhasil disimpan!', 'success');
    } catch (error) {
        console.error('Error saving general settings:', error);
        Utils.showAlert('Gagal menyimpan pengaturan umum: ' + (error.message || 'Unknown error'), 'error');
    }
}

async function saveEmailSettings() {
    try {
        const settings = {};

        // Helper function to always send value, even if empty
        const getElementValue = (htmlId, apiKey) => {
            const el = document.getElementById(htmlId);
            if (el) {
                settings[apiKey] = el.value || '';
            }
        };

        const getElementNumber = (htmlId, apiKey, defaultValue = 0) => {
            const el = document.getElementById(htmlId);
            if (el) {
                settings[apiKey] = parseInt(el.value) || defaultValue;
            }
        };

        const getElementChecked = (htmlId, apiKey) => {
            const el = document.getElementById(htmlId);
            if (el) {
                settings[apiKey] = el.checked;
            }
        };

        // Always send these fields, even if empty
        getElementValue('smtp-host', 'smtp_host');
        getElementNumber('smtp-port', 'smtp_port', 587);
        getElementValue('smtp-username', 'smtp_user');
        getElementValue('email-from-name', 'email_from_name');
        getElementValue('admin-email', 'admin_email');
        getElementChecked('smtp-secure', 'smtp_secure');

        // Only send password if user fills it (to update password)
        const smtpPass = document.getElementById('smtp-password');
        if (smtpPass && smtpPass.value) {
            settings.smtp_pass = smtpPass.value;
        }

        await ApiService.saveSettings('notification', settings);
        Utils.showAlert('Pengaturan email berhasil disimpan!', 'success');
    } catch (error) {
        console.error('Error saving email settings:', error);
        Utils.showAlert('Gagal menyimpan pengaturan email: ' + (error.message || 'Unknown error'), 'error');
    }
}

async function savePaymentSettings() {
    try {
        const paymentMethods = [];

        const transferBank = document.getElementById('transfer-bank');
        if (transferBank && transferBank.checked) paymentMethods.push('transfer_bank');

        const ewallet = document.getElementById('ewallet');
        if (ewallet && ewallet.checked) paymentMethods.push('ewallet');

        const cod = document.getElementById('cod');
        if (cod && cod.checked) paymentMethods.push('cod');

        const codFee = document.getElementById('cod-fee');
        const codFeeValue = codFee ? parseInt(codFee.value) || 0 : 0;

        const accountsData = typeof getPaymentAccountsData === 'function'
            ? getPaymentAccountsData()
            : { bank_accounts: [], ewallet_accounts: [] };

        const settings = {
            payment_methods: paymentMethods,
            cod_enabled: cod ? cod.checked : false,
            cod_fee: codFeeValue,
            bank_accounts: accountsData.bank_accounts,
            ewallet_accounts: accountsData.ewallet_accounts
        };

        await ApiService.saveSettings('payment', settings);
        Utils.showAlert('Pengaturan pembayaran berhasil disimpan!', 'success');
    } catch (error) {
        console.error('Error saving payment settings:', error);
        Utils.showAlert('Gagal menyimpan pengaturan pembayaran: ' + (error.message || 'Unknown error'), 'error');
    }
}

async function saveShippingSettings() {
    try {
        const shippingMethods = [];

        const jne = document.getElementById('jne');
        if (jne && jne.checked) shippingMethods.push('jne');

        const pos = document.getElementById('pos');
        if (pos && pos.checked) shippingMethods.push('pos');

        const tiki = document.getElementById('tiki');
        if (tiki && tiki.checked) shippingMethods.push('tiki');

        const jnt = document.getElementById('jnt');
        if (jnt && jnt.checked) shippingMethods.push('jnt');

        const settings = {
            shipping_enabled: document.getElementById('shipping-enabled')?.checked || false,
            shipping_methods: shippingMethods,
            shipping_origin_city: document.getElementById('shipping-origin-city')?.value || '',
            shipping_origin_province: document.getElementById('shipping-origin-province')?.value || '',
            shipping_origin_postal_code: document.getElementById('shipping-origin-postal-code')?.value || '',
            flat_shipping_rate: parseInt(document.getElementById('flat-shipping-rate')?.value) || 0,
            weight_unit: document.getElementById('weight-unit')?.value || 'gram',
            free_shipping_enabled: document.getElementById('free-shipping-enabled')?.checked || false,
            free_shipping_min_amount: parseInt(document.getElementById('free-shipping-min-amount')?.value) || 0,
            rajaongkir_enabled: document.getElementById('rajaongkir-enabled')?.checked || false,
            rajaongkir_api_key: document.getElementById('rajaongkir-api-key')?.value || ''
        };

        await ApiService.saveSettings('shipping', settings);
        Utils.showAlert('Pengaturan pengiriman berhasil disimpan!', 'success');
    } catch (error) {
        console.error('Error saving shipping settings:', error);
        Utils.showAlert('Gagal menyimpan pengaturan pengiriman: ' + (error.message || 'Unknown error'), 'error');
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
        const setElementValue = (htmlId, apiKey, category, defaultValue = '') => {
            const el = document.getElementById(htmlId);
            if (el && settings[category] && settings[category][apiKey] !== undefined) {
                const value = settings[category][apiKey] || defaultValue;
                el.value = value;
            }
        };

        const setElementChecked = (htmlId, apiKey, category) => {
            const el = document.getElementById(htmlId);
            if (el && settings[category] && settings[category][apiKey] !== undefined) {
                const checked = settings[category][apiKey] === true || settings[category][apiKey] === 'true';
                el.checked = checked;
            }
        };

        if (settings.general) {
            setElementValue('site-title', 'site_title', 'general');
            setElementValue('site-tagline', 'site_tagline', 'general');
            setElementValue('site-logo', 'site_logo', 'general');

            setElementValue('currency', 'currency', 'general', 'IDR');
            setElementValue('timezone', 'timezone', 'general', 'Asia/Jakarta');
            setElementValue('language', 'language', 'general', 'id');

            setElementChecked('maintenance-mode', 'maintenance_mode', 'general');
        }

        if (settings.shop) {
            setElementValue('shop-name', 'shop_name', 'shop');
            setElementValue('shop-owner', 'shop_owner', 'shop');
            setElementValue('shop-address', 'shop_address', 'shop');
            setElementValue('shop-phone', 'shop_phone', 'shop');
            setElementValue('shop-email', 'shop_email', 'shop');
            setElementValue('shop-whatsapp', 'shop_whatsapp', 'shop');
            setElementValue('shop-instagram', 'shop_instagram', 'shop');
            setElementValue('shop-facebook', 'shop_facebook', 'shop');
            setElementValue('shop-tiktok', 'shop_tiktok', 'shop');
        }

        if (settings.notification) {
            setElementValue('smtp-host', 'smtp_host', 'notification');
            setElementValue('smtp-port', 'smtp_port', 'notification', '587');
            setElementValue('smtp-username', 'smtp_user', 'notification');
            setElementValue('smtp-password', 'smtp_pass', 'notification');
            setElementChecked('smtp-secure', 'smtp_secure', 'notification');
            setElementValue('email-from-name', 'email_from_name', 'notification');
            setElementValue('admin-email', 'admin_email', 'notification');
            setElementChecked('whatsapp-enabled', 'whatsapp_enabled', 'notification');
            setElementValue('whatsapp-admin-phone', 'admin_phone', 'notification');
        }

        if (settings.payment) {
            if (settings.payment.payment_methods && Array.isArray(settings.payment.payment_methods)) {
                const methods = settings.payment.payment_methods;

                const transferBankEl = document.getElementById('transfer-bank');
                if (transferBankEl) transferBankEl.checked = methods.includes('transfer_bank');

                const ewalletEl = document.getElementById('ewallet');
                if (ewalletEl) ewalletEl.checked = methods.includes('ewallet');

                const codEl = document.getElementById('cod');
                if (codEl) codEl.checked = methods.includes('cod');
            }

            const codFeeEl = document.getElementById('cod-fee');
            if (codFeeEl && settings.payment.cod_fee !== undefined) {
                codFeeEl.value = settings.payment.cod_fee;
            }

            if (typeof loadPaymentAccounts === 'function') {
                loadPaymentAccounts(settings);
            }
        }

        if (settings.shipping) {
            setElementChecked('shipping-enabled', 'shipping_enabled', 'shipping');

            if (settings.shipping.shipping_methods && Array.isArray(settings.shipping.shipping_methods)) {
                const methods = settings.shipping.shipping_methods;

                const jneEl = document.getElementById('jne');
                if (jneEl) jneEl.checked = methods.includes('jne');

                const posEl = document.getElementById('pos');
                if (posEl) posEl.checked = methods.includes('pos');

                const tikiEl = document.getElementById('tiki');
                if (tikiEl) tikiEl.checked = methods.includes('tiki');

                const jntEl = document.getElementById('jnt');
                if (jntEl) jntEl.checked = methods.includes('jnt');
            }

            setElementValue('shipping-origin-city', 'shipping_origin_city', 'shipping');
            setElementValue('shipping-origin-province', 'shipping_origin_province', 'shipping');
            setElementValue('shipping-origin-postal-code', 'shipping_origin_postal_code', 'shipping');

            setElementValue('flat-shipping-rate', 'flat_shipping_rate', 'shipping');
            setElementValue('weight-unit', 'weight_unit', 'shipping', 'gram');

            setElementChecked('free-shipping-enabled', 'free_shipping_enabled', 'shipping');
            setElementValue('free-shipping-min-amount', 'free_shipping_min_amount', 'shipping', '500000');

            setElementChecked('rajaongkir-enabled', 'rajaongkir_enabled', 'shipping');
            setElementValue('rajaongkir-api-key', 'rajaongkir_api_key', 'shipping');
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