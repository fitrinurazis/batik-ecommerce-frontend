// Settings Page Functionality
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded - Initializing Settings Page');
    initializeSettingsPage();
});

function initializeSettingsPage() {
    console.log('Initializing settings page...');

    const settingsNavLinks = document.querySelectorAll('.settings-nav-link');
    const settingsContents = document.querySelectorAll('.settings-content');

    console.log(`Found ${settingsNavLinks.length} nav links and ${settingsContents.length} content sections`);

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

    // Wait a bit to ensure all form elements are in DOM, then load settings
    setTimeout(() => {
        console.log('Loading current settings...');
        loadCurrentSettings();
    }, 100);
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

            // Ambil konfigurasi SMTP dari form
            const smtpHost = document.getElementById('smtp-host')?.value;
            const smtpPort = parseInt(document.getElementById('smtp-port')?.value) || 587;
            const smtpUsername = document.getElementById('smtp-username')?.value;
            const smtpPassword = document.getElementById('smtp-password')?.value;
            const smtpSecure = document.getElementById('smtp-secure')?.checked;
            const emailFromName = document.getElementById('email-from-name')?.value;
            const adminEmail = document.getElementById('admin-email')?.value;

            // Validasi konfigurasi SMTP
            if (!smtpHost || !smtpUsername || !emailFromName || !adminEmail) {
                if (typeof Swal !== 'undefined') {
                    Swal.fire({
                        icon: 'warning',
                        title: 'Konfigurasi Belum Lengkap',
                        text: 'Silakan lengkapi semua field yang wajib diisi (bertanda *) terlebih dahulu',
                        confirmButtonColor: '#D97706'
                    });
                } else {
                    Utils.showAlert('Silakan lengkapi konfigurasi SMTP terlebih dahulu', 'warning');
                }
                return;
            }

            // Validasi password diperlukan untuk menyimpan
            if (!smtpPassword) {
                if (typeof Swal !== 'undefined') {
                    Swal.fire({
                        icon: 'info',
                        title: 'Password Diperlukan',
                        html: `<p class="text-gray-600">Untuk test email, konfigurasi SMTP harus disimpan terlebih dahulu.</p>
                               <p class="text-gray-600 mt-2">Silakan isi SMTP Password, lalu klik <strong>"Simpan Perubahan"</strong> sebelum test email.</p>`,
                        confirmButtonColor: '#2563EB'
                    });
                } else {
                    Utils.showAlert('Silakan isi SMTP Password dan simpan konfigurasi terlebih dahulu', 'warning');
                }
                return;
            }

            // Validasi port
            if (smtpPort < 1 || smtpPort > 65535) {
                if (typeof Swal !== 'undefined') {
                    Swal.fire({
                        icon: 'warning',
                        title: 'Port Tidak Valid',
                        text: 'SMTP Port harus antara 1-65535',
                        confirmButtonColor: '#D97706'
                    });
                } else {
                    Utils.showAlert('SMTP Port harus antara 1-65535', 'warning');
                }
                return;
            }

            // Validasi format email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(smtpUsername)) {
                if (typeof Swal !== 'undefined') {
                    Swal.fire({
                        icon: 'warning',
                        title: 'Format Email Tidak Valid',
                        text: 'Format SMTP Username/Email tidak valid',
                        confirmButtonColor: '#D97706'
                    });
                } else {
                    Utils.showAlert('Format SMTP Username/Email tidak valid', 'warning');
                }
                return;
            }

            if (!emailRegex.test(adminEmail)) {
                if (typeof Swal !== 'undefined') {
                    Swal.fire({
                        icon: 'warning',
                        title: 'Format Email Tidak Valid',
                        text: 'Format Admin Email tidak valid',
                        confirmButtonColor: '#D97706'
                    });
                } else {
                    Utils.showAlert('Format Admin Email tidak valid', 'warning');
                }
                return;
            }

            // Konfirmasi untuk simpan dan test
            if (typeof Swal !== 'undefined') {
                const result = await Swal.fire({
                    icon: 'question',
                    title: 'Simpan & Test Email',
                    html: `<p class="text-gray-600">Konfigurasi SMTP akan disimpan terlebih dahulu sebelum melakukan test email.</p>
                           <p class="text-gray-600 mt-2">Lanjutkan?</p>`,
                    showCancelButton: true,
                    confirmButtonText: 'Ya, Simpan & Test',
                    cancelButtonText: 'Batal',
                    confirmButtonColor: '#2563EB',
                    cancelButtonColor: '#6B7280'
                });

                if (!result.isConfirmed) return;

                try {
                    // Simpan konfigurasi terlebih dahulu
                    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i><span>Menyimpan...</span>';
                    btn.disabled = true;

                    const settings = {
                        smtp_host: smtpHost,
                        smtp_port: smtpPort,
                        smtp_user: smtpUsername,
                        smtp_pass: smtpPassword,
                        smtp_secure: smtpSecure,
                        email_from_name: emailFromName,
                        admin_email: adminEmail
                    };

                    await ApiService.saveSettings('notification', settings);

                    // Update global settings
                    if (!window.siteSettings) window.siteSettings = {};
                    if (!window.siteSettings.notification) window.siteSettings.notification = {};
                    Object.assign(window.siteSettings.notification, settings);

                    // Clear password field after save
                    const smtpPassField = document.getElementById('smtp-password');
                    if (smtpPassField) smtpPassField.value = '';

                    // Sekarang minta email tujuan untuk test
                    const { value: testEmail } = await Swal.fire({
                        title: 'Test Email',
                        text: 'Konfigurasi berhasil disimpan! Masukkan alamat email tujuan untuk test:',
                        input: 'email',
                        inputPlaceholder: 'contoh@email.com',
                        showCancelButton: true,
                        confirmButtonText: 'Kirim Test Email',
                        cancelButtonText: 'Batal',
                        confirmButtonColor: '#2563EB',
                        cancelButtonColor: '#6B7280',
                        inputValidator: (value) => {
                            if (!value) {
                                return 'Email tidak boleh kosong!';
                            }
                            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                            if (!emailRegex.test(value)) {
                                return 'Format email tidak valid!';
                            }
                        }
                    });

                    if (!testEmail) {
                        btn.innerHTML = originalText;
                        btn.disabled = false;
                        return;
                    }

                    // Test email
                    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i><span>Mengirim Email...</span>';
                    await ApiService.sendTestEmail(testEmail);

                    Swal.fire({
                        icon: 'success',
                        title: 'Email Berhasil Dikirim!',
                        html: `<p class="text-gray-700">Email test telah dikirim ke <strong>${testEmail}</strong></p>
                               <p class="text-sm text-gray-500 mt-2">Silakan cek inbox atau folder spam Anda</p>`,
                        confirmButtonColor: '#10B981'
                    });

                } catch (error) {
                    console.error('Test email error:', error);
                    Swal.fire({
                        icon: 'error',
                        title: 'Gagal Test Email',
                        html: `<p class="text-gray-600">${error.message}</p>
                               <p class="text-sm text-gray-500 mt-2">Periksa kembali konfigurasi SMTP Anda:</p>
                               <ul class="text-xs text-gray-500 text-left mt-2 ml-4 list-disc">
                                 <li>Pastikan Host dan Port sudah benar</li>
                                 <li>Pastikan Username/Email valid</li>
                                 <li>Pastikan Password/App Password sudah benar</li>
                                 <li>Untuk Gmail, gunakan App Password (bukan password akun)</li>
                               </ul>`,
                        confirmButtonColor: '#EF4444'
                    });
                } finally {
                    btn.innerHTML = originalText;
                    btn.disabled = false;
                }
            } else {
                // Fallback tanpa SweetAlert2
                const confirmSave = confirm('Konfigurasi SMTP akan disimpan terlebih dahulu sebelum test. Lanjutkan?');
                if (!confirmSave) return;

                try {
                    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i><span>Menyimpan & Testing...</span>';
                    btn.disabled = true;

                    // Simpan
                    const settings = {
                        smtp_host: smtpHost,
                        smtp_port: smtpPort,
                        smtp_user: smtpUsername,
                        smtp_pass: smtpPassword,
                        smtp_secure: smtpSecure,
                        email_from_name: emailFromName,
                        admin_email: adminEmail
                    };

                    await ApiService.saveSettings('notification', settings);

                    // Update global
                    if (!window.siteSettings) window.siteSettings = {};
                    if (!window.siteSettings.notification) window.siteSettings.notification = {};
                    Object.assign(window.siteSettings.notification, settings);

                    // Clear password
                    const smtpPassField = document.getElementById('smtp-password');
                    if (smtpPassField) smtpPassField.value = '';

                    // Test
                    const testEmail = prompt('Masukkan alamat email untuk test:');
                    if (!testEmail) {
                        Utils.showAlert('Konfigurasi berhasil disimpan!', 'success');
                        return;
                    }

                    await ApiService.sendTestEmail(testEmail);
                    Utils.showAlert('Email test berhasil dikirim ke ' + testEmail, 'success');
                } catch (error) {
                    console.error('Test email error:', error);
                    Utils.showAlert('Gagal: ' + error.message, 'error');
                } finally {
                    btn.innerHTML = originalText;
                    btn.disabled = false;
                }
            }
        });
    }
}

async function loadCurrentSettings() {
    try {
        // Fetch dari API
        const response = await ApiService.getSettings();
        console.log('Settings response from API:', response);

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

        console.log('Grouped settings:', groupedSettings);

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
        const generalSettings = {};
        const shopSettings = {};

        const getElementValue = (htmlId, apiKey, category) => {
            const el = document.getElementById(htmlId);
            if (el) {
                const value = el.value || '';
                if (category === 'shop') {
                    shopSettings[apiKey] = value;
                } else {
                    generalSettings[apiKey] = value;
                }
            }
        };

        const getElementChecked = (htmlId, apiKey, category) => {
            const el = document.getElementById(htmlId);
            if (el) {
                if (category === 'shop') {
                    shopSettings[apiKey] = el.checked;
                } else {
                    generalSettings[apiKey] = el.checked;
                }
            }
        };

        // General category settings
        getElementValue('site-title', 'site_title', 'general');
        getElementValue('site-tagline', 'site_tagline', 'general');
        getElementValue('site-logo', 'site_logo', 'general');
        getElementValue('currency', 'currency', 'general');
        getElementValue('timezone', 'timezone', 'general');
        getElementValue('language', 'language', 'general');
        getElementChecked('maintenance-mode', 'maintenance_mode', 'general');

        // Shop category settings
        getElementValue('shop-name', 'shop_name', 'shop');
        getElementValue('shop-owner', 'shop_owner', 'shop');
        getElementValue('shop-address', 'shop_address', 'shop');
        getElementValue('shop-phone', 'shop_phone', 'shop');
        getElementValue('shop-email', 'shop_email', 'shop');
        getElementValue('shop-whatsapp', 'shop_whatsapp', 'shop');
        getElementValue('shop-instagram', 'shop_instagram', 'shop');
        getElementValue('shop-facebook', 'shop_facebook', 'shop');
        getElementValue('shop-tiktok', 'shop_tiktok', 'shop');

        // Save both categories to API
        await Promise.all([
            ApiService.saveSettings('general', generalSettings),
            ApiService.saveSettings('shop', shopSettings)
        ]);

        // Update global variable
        if (!window.siteSettings) {
            window.siteSettings = {};
        }
        if (!window.siteSettings.general) {
            window.siteSettings.general = {};
        }
        if (!window.siteSettings.shop) {
            window.siteSettings.shop = {};
        }

        Object.assign(window.siteSettings.general, generalSettings);
        Object.assign(window.siteSettings.shop, shopSettings);

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

        // Validasi input required
        const smtpHost = document.getElementById('smtp-host')?.value;
        const smtpUsername = document.getElementById('smtp-username')?.value;
        const emailFromName = document.getElementById('email-from-name')?.value;
        const adminEmail = document.getElementById('admin-email')?.value;

        if (!smtpHost || !smtpUsername || !emailFromName || !adminEmail) {
            Utils.showAlert('Mohon lengkapi semua field yang wajib diisi (bertanda *)', 'warning');
            return;
        }

        // Validasi format email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(smtpUsername)) {
            Utils.showAlert('Format SMTP Username/Email tidak valid', 'warning');
            return;
        }
        if (!emailRegex.test(adminEmail)) {
            Utils.showAlert('Format Admin Email tidak valid', 'warning');
            return;
        }

        // Validasi port
        const smtpPort = parseInt(document.getElementById('smtp-port')?.value);
        if (!smtpPort || smtpPort < 1 || smtpPort > 65535) {
            Utils.showAlert('SMTP Port harus antara 1-65535', 'warning');
            return;
        }

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

        console.log('Saving email settings:', settings);

        // Show loading
        const submitBtn = document.querySelector('#email-settings-form button[type="submit"]');
        const originalBtnText = submitBtn?.innerHTML;
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i><span>Menyimpan...</span>';
            submitBtn.disabled = true;
        }

        const response = await ApiService.saveSettings('notification', settings);
        console.log('Save response:', response);

        // Update global settings
        if (!window.siteSettings) {
            window.siteSettings = {};
        }
        if (!window.siteSettings.notification) {
            window.siteSettings.notification = {};
        }

        // Merge saved settings into global
        Object.assign(window.siteSettings.notification, settings);
        console.log('Updated global settings:', window.siteSettings);

        // Clear password field after successful save
        if (smtpPass) {
            smtpPass.value = '';
        }

        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'success',
                title: 'Berhasil!',
                text: 'Pengaturan email berhasil disimpan',
                confirmButtonColor: '#10B981',
                timer: 2000
            });
        } else {
            Utils.showAlert('Pengaturan email berhasil disimpan!', 'success');
        }

        // Restore button
        if (submitBtn && originalBtnText) {
            submitBtn.innerHTML = originalBtnText;
            submitBtn.disabled = false;
        }
    } catch (error) {
        console.error('Error saving email settings:', error);

        // Restore button
        const submitBtn = document.querySelector('#email-settings-form button[type="submit"]');
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-save mr-2"></i><span>Simpan Perubahan</span>';
            submitBtn.disabled = false;
        }

        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'error',
                title: 'Gagal Menyimpan',
                text: error.message || 'Terjadi kesalahan saat menyimpan pengaturan email',
                confirmButtonColor: '#EF4444'
            });
        } else {
            Utils.showAlert('Gagal menyimpan pengaturan email: ' + (error.message || 'Unknown error'), 'error');
        }
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
                console.log(`Set ${htmlId} = ${value} (from ${category}.${apiKey})`);
            } else {
                if (el && defaultValue) {
                    el.value = defaultValue;
                    console.log(`Set ${htmlId} = ${defaultValue} (default)`);
                }
                console.log(`Could not set ${htmlId}: element=${!!el}, category=${category}, hasKey=${settings[category] && settings[category][apiKey] !== undefined}`);
            }
        };

        const setElementChecked = (htmlId, apiKey, category) => {
            const el = document.getElementById(htmlId);
            if (el && settings[category] && settings[category][apiKey] !== undefined) {
                const checked = settings[category][apiKey] === true || settings[category][apiKey] === 'true' || settings[category][apiKey] === '1' || settings[category][apiKey] === 1;
                el.checked = checked;
                console.log(`Set ${htmlId} checked = ${checked} (from ${category}.${apiKey})`);
            } else {
                console.log(`Could not set ${htmlId} checked: element=${!!el}, category=${category}, hasKey=${settings[category] && settings[category][apiKey] !== undefined}`);
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
            console.log('Populating notification settings:', settings.notification);
            setElementValue('smtp-host', 'smtp_host', 'notification');
            setElementValue('smtp-port', 'smtp_port', 'notification', '587');
            setElementValue('smtp-username', 'smtp_user', 'notification');
            // DO NOT populate password for security reasons
            // setElementValue('smtp-password', 'smtp_pass', 'notification');
            setElementChecked('smtp-secure', 'smtp_secure', 'notification');
            setElementValue('email-from-name', 'email_from_name', 'notification');
            setElementValue('admin-email', 'admin_email', 'notification');
            setElementChecked('whatsapp-enabled', 'whatsapp_enabled', 'notification');
            setElementValue('whatsapp-admin-phone', 'admin_phone', 'notification');
        } else {
            console.log('No notification settings found in response');
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