// WhatsApp Settings Management
class WhatsAppManager {
    constructor() {
        this.status = null;
        this.qrCode = null;
        this.statusCheckInterval = null;
        this.qrModalOpen = false; // Track if QR modal is open
        this.wasConnected = false; // Track previous connection state
    }

    // Initialize WhatsApp settings
    async init() {
        await this.loadStatus();
        await this.loadSettings();
        this.setupEventListeners();
        this.startStatusPolling();
    }

    // Load WhatsApp connection status
    async loadStatus(showAlert = false) {
        try {
            const statusBtn = document.getElementById('whatsapp-status');
            if (statusBtn && showAlert) {
                statusBtn.disabled = true;
                statusBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Checking...';
            }

            const response = await axios.get('/whatsapp/status');
            const newStatus = response.data.data;

            // Check if just connected
            if (!this.wasConnected && newStatus.isReady) {
                console.log('🎉 WhatsApp just connected!');

                // Close QR modal if open
                if (this.qrModalOpen) {
                    const modal = document.getElementById('qr-modal');
                    if (modal && document.body.contains(modal)) {
                        document.body.removeChild(modal);
                        this.qrModalOpen = false;
                    }
                }

                // Show success notification
                Utils.showAlert('🎉 WhatsApp berhasil terhubung! Anda sekarang dapat mengirim notifikasi otomatis.', 'success');
            }

            this.wasConnected = newStatus.isReady;
            this.status = newStatus;
            this.updateStatusUI();

            if (showAlert) {
                Utils.showAlert('Status WhatsApp berhasil dimuat', 'success');
            }

            return this.status;
        } catch (error) {
            console.error('Error loading WhatsApp status:', error);
            if (showAlert) {
                Utils.showAlert('Gagal memuat status WhatsApp: ' + (error.message || 'Unknown error'), 'error');
            }
            return null;
        } finally {
            const statusBtn = document.getElementById('whatsapp-status');
            if (statusBtn && showAlert) {
                statusBtn.disabled = false;
                statusBtn.innerHTML = '<i class="fas fa-info-circle mr-1"></i> Check Status';
            }
        }
    }

    // Load WhatsApp settings from Settings API
    async loadSettings() {
        try {
            const response = await axios.get('/settings/category/notification?include_private=true');
            if (response.data.success) {
                const settings = response.data.data;

                console.log('WhatsApp settings loaded:', settings);

                // Populate WhatsApp settings (use correct ID: admin-phone)
                const enableCheckbox = document.getElementById('whatsapp-enabled');
                const adminPhone = document.getElementById('admin-phone');

                if (enableCheckbox && settings.whatsapp_enabled !== undefined) {
                    enableCheckbox.checked = settings.whatsapp_enabled;
                }

                if (adminPhone && settings.admin_phone) {
                    adminPhone.value = settings.admin_phone;
                }
            }
        } catch (error) {
            console.error('Error loading WhatsApp settings:', error);
        }
    }

    // Save WhatsApp settings
    async saveSettings() {
        try {
            const enableCheckbox = document.getElementById('whatsapp-enabled');
            const adminPhone = document.getElementById('admin-phone');

            const settings = {
                whatsapp_enabled: enableCheckbox?.checked || false,
                admin_phone: adminPhone?.value || ''
            };

            // Validate phone number
            if (settings.whatsapp_enabled && !settings.admin_phone) {
                Utils.showAlert('Nomor WhatsApp Admin harus diisi', 'warning');
                return false;
            }

            // Validate phone format (Indonesian)
            if (settings.admin_phone && !this.validatePhoneNumber(settings.admin_phone)) {
                Utils.showAlert('Format nomor WhatsApp tidak valid. Gunakan format: 628xxx atau 08xxx', 'warning');
                return false;
            }

            console.log('Saving WhatsApp settings:', settings);

            // Save via Settings API
            const response = await axios.put('/settings/bulk', { settings });

            if (response.data.success) {
                Utils.showAlert('Pengaturan WhatsApp berhasil disimpan!', 'success');
                return true;
            }
        } catch (error) {
            console.error('Error saving WhatsApp settings:', error);
            Utils.showAlert('Gagal menyimpan pengaturan WhatsApp: ' + (error.message || 'Unknown error'), 'error');
            return false;
        }
    }

    // Validate Indonesian phone number
    validatePhoneNumber(phone) {
        // Remove spaces and special characters
        phone = phone.replace(/[\s\-\(\)]/g, '');

        // Check format: 628xxx or 08xxx or 8xxx
        return /^(62|0)?8\d{8,11}$/.test(phone);
    }

    // Initialize WhatsApp connection
    async initializeConnection(forceRestart = false) {
        try {
            const btn = document.getElementById('whatsapp-init') || document.getElementById('init-whatsapp-btn');
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Initializing...';
            }

            const response = await axios.post('/whatsapp/init', { forceRestart });

            if (response.data.success) {
                const message = forceRestart
                    ? 'WhatsApp restarted. Generating new QR code...'
                    : 'WhatsApp initialization started. Waiting for QR code...';
                Utils.showAlert(message, 'info');

                // Start checking for QR code
                setTimeout(() => this.loadQRCode(), 3000);
            }
        } catch (error) {
            console.error('Error initializing WhatsApp:', error);
            Utils.showAlert('Failed to initialize WhatsApp: ' + (error.response?.data?.error || error.message), 'error');
        } finally {
            const btn = document.getElementById('whatsapp-init') || document.getElementById('init-whatsapp-btn');
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-qrcode mr-1"></i> Initialize WhatsApp';
            }
        }
    }

    // Load QR Code
    async loadQRCode() {
        try {
            const qrBtn = document.getElementById('whatsapp-qr');
            if (qrBtn) {
                qrBtn.disabled = true;
                qrBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Loading...';
            }

            console.log('Loading QR code from /whatsapp/qr...');
            const response = await axios.get('/whatsapp/qr');
            console.log('QR response:', response.data);

            if (response.data.isReady) {
                // Already connected
                console.log('WhatsApp already connected');
                this.status = { isReady: true, hasQR: false };
                this.updateStatusUI();
                Utils.showAlert('WhatsApp sudah terhubung!', 'success');
            } else if (response.data.qrCode) {
                // QR code available
                console.log('QR code received, length:', response.data.qrCode.length);
                this.qrCode = response.data.qrCode;
                this.displayQRCode();

                // Show QR in modal/alert as backup
                this.showQRModal();
            } else {
                // Not available yet
                console.log('QR code not available yet');
                Utils.showAlert('QR Code belum tersedia. Silakan klik "Initialize WhatsApp" terlebih dahulu.', 'warning');
            }
        } catch (error) {
            console.error('Error loading QR code:', error);
            console.error('Error response:', error.response?.data);
            Utils.showAlert('Gagal memuat QR Code: ' + (error.response?.data?.error || error.message), 'error');
        } finally {
            const qrBtn = document.getElementById('whatsapp-qr');
            if (qrBtn) {
                qrBtn.disabled = false;
                qrBtn.innerHTML = '<i class="fas fa-qrcode mr-1"></i> Show QR Code';
            }
        }
    }

    // Show QR in modal
    showQRModal() {
        // Don't open multiple modals
        if (this.qrModalOpen) {
            console.log('QR modal already open, skipping');
            return;
        }

        this.qrModalOpen = true;

        // Create modal overlay
        const modal = document.createElement('div');
        modal.id = 'qr-modal';
        modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); z-index: 9999; display: flex; align-items: center; justify-content: center;';

        const modalContent = document.createElement('div');
        modalContent.style.cssText = 'background: white; padding: 30px; border-radius: 12px; max-width: 400px; text-align: center;';

        modalContent.innerHTML = `
            <h3 style="font-size: 20px; font-weight: bold; margin-bottom: 15px; color: #1f2937;">Scan QR Code WhatsApp</h3>
            <p style="font-size: 14px; color: #6b7280; margin-bottom: 20px;">Buka WhatsApp di HP → Menu → Linked Devices → Scan QR</p>
            <div id="qr-modal-container" style="padding: 20px; background: white; border: 2px solid #e5e7eb; border-radius: 8px; margin-bottom: 20px;"></div>
            <div style="display: flex; gap: 10px; justify-content: center;">
                <button id="refresh-qr-btn" style="background: #f59e0b; color: white; padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;">🔄 Get New QR</button>
                <button id="close-qr-modal" style="background: #ef4444; color: white; padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;">Close</button>
            </div>
            <p style="font-size: 12px; color: #9ca3af; margin-top: 15px;">💡 Tip: QR Code expired atau gagal scan? Klik "Get New QR"</p>
        `;

        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        // Generate QR code in modal
        const qrModalContainer = document.getElementById('qr-modal-container');
        if (typeof QRCode !== 'undefined') {
            new QRCode(qrModalContainer, {
                text: this.qrCode,
                width: 256,
                height: 256,
                colorDark: '#000000',
                colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.H
            });
        } else {
            qrModalContainer.innerHTML = `<div style="font-size: 10px; word-break: break-all; font-family: monospace; padding: 10px; background: #f3f4f6;">${this.qrCode}</div>`;
        }

        const closeModal = () => {
            if (document.body.contains(modal)) {
                document.body.removeChild(modal);
                this.qrModalOpen = false;
            }
        };

        // Refresh QR code
        const refreshQRBtn = document.getElementById('refresh-qr-btn');
        if (refreshQRBtn) {
            refreshQRBtn.addEventListener('click', async () => {
                refreshQRBtn.disabled = true;
                refreshQRBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';

                try {
                    // Force restart WhatsApp to get new QR
                    await this.initializeConnection(true);

                    // Wait for new QR code
                    setTimeout(async () => {
                        const response = await axios.get('/whatsapp/qr');
                        if (response.data.qrCode) {
                            this.qrCode = response.data.qrCode;

                            // Regenerate QR in modal
                            const qrModalContainer = document.getElementById('qr-modal-container');
                            qrModalContainer.innerHTML = '';

                            if (typeof QRCode !== 'undefined') {
                                new QRCode(qrModalContainer, {
                                    text: this.qrCode,
                                    width: 256,
                                    height: 256,
                                    colorDark: '#000000',
                                    colorLight: '#ffffff',
                                    correctLevel: QRCode.CorrectLevel.H
                                });
                            }

                            Utils.showAlert('QR Code baru berhasil di-generate!', 'success');
                        }
                        refreshQRBtn.disabled = false;
                        refreshQRBtn.innerHTML = '🔄 Get New QR';
                    }, 3000);
                } catch (error) {
                    console.error('Error refreshing QR:', error);
                    Utils.showAlert('Gagal generate QR baru', 'error');
                    refreshQRBtn.disabled = false;
                    refreshQRBtn.innerHTML = '🔄 Get New QR';
                }
            });
        }

        // Close modal
        document.getElementById('close-qr-modal').addEventListener('click', closeModal);

        // Close on overlay click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    }

    // Display QR Code using qrcode library or image
    displayQRCode() {
        const qrContainer = document.getElementById('qr-code-container');
        const qrSection = document.getElementById('whatsapp-qr-section');
        const connectedSection = document.getElementById('whatsapp-connected-section');
        const disconnectedSection = document.getElementById('whatsapp-disconnected-section');

        console.log('displayQRCode called');
        console.log('qrContainer:', qrContainer);
        console.log('qrSection:', qrSection);
        console.log('this.qrCode:', this.qrCode);
        console.log('QRCode library available:', typeof QRCode !== 'undefined');

        if (!qrContainer) {
            console.error('QR container not found!');
            return;
        }

        if (!this.qrCode) {
            console.error('QR code data is empty!');
            return;
        }

        // Hide other sections
        if (connectedSection) {
            connectedSection.classList.add('hidden');
            connectedSection.style.display = 'none';
        }
        if (disconnectedSection) {
            disconnectedSection.classList.add('hidden');
            disconnectedSection.style.display = 'none';
        }

        // Make sure QR section is visible (force display block to override Tailwind hidden)
        if (qrSection) {
            qrSection.classList.remove('hidden');
            qrSection.style.display = 'block';
            qrSection.style.visibility = 'visible';
            qrSection.style.opacity = '1';
            console.log('QR section classes after unhide:', qrSection.className);
            console.log('QR section display:', window.getComputedStyle(qrSection).display);
            console.log('QR section visibility:', window.getComputedStyle(qrSection).visibility);
            console.log('QR section offsetHeight:', qrSection.offsetHeight);
            console.log('QR section offsetWidth:', qrSection.offsetWidth);
        }

        // Make sure container is visible
        qrContainer.classList.remove('hidden');
        qrContainer.style.display = 'flex';
        qrContainer.style.visibility = 'visible';
        qrContainer.style.opacity = '1';
        qrContainer.style.minHeight = '300px';
        console.log('QR container classes after unhide:', qrContainer.className);
        console.log('QR container offsetHeight:', qrContainer.offsetHeight);
        console.log('QR container offsetWidth:', qrContainer.offsetWidth);

        // Clear previous QR code
        qrContainer.innerHTML = '';

        // Check if QRCode library is available
        if (typeof QRCode !== 'undefined') {
            console.log('Using QRCode library');

            // Create wrapper div with explicit styling
            const wrapperDiv = document.createElement('div');
            wrapperDiv.id = 'qrcode';
            wrapperDiv.style.cssText = 'display: flex; justify-content: center; padding: 20px; background: white; border-radius: 8px; border: 1px solid #e5e7eb; margin: 0 auto; max-width: 300px;';
            qrContainer.appendChild(wrapperDiv);

            console.log('Wrapper div created:', wrapperDiv);

            try {
                const qrcode = new QRCode(wrapperDiv, {
                    text: this.qrCode,
                    width: 256,
                    height: 256,
                    colorDark: '#000000',
                    colorLight: '#ffffff',
                    correctLevel: QRCode.CorrectLevel.H
                });
                console.log('QR code instance created:', qrcode);
                console.log('QR code generated successfully');

                // Check if canvas/img was created
                setTimeout(() => {
                    const canvas = wrapperDiv.querySelector('canvas');
                    const img = wrapperDiv.querySelector('img');
                    console.log('Canvas found:', canvas);
                    console.log('Img found:', img);
                    console.log('Wrapper div children:', wrapperDiv.children);

                    // Scroll to QR section
                    if (qrSection) {
                        qrSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        // Add temporary highlight
                        qrSection.style.border = '3px solid #10b981';
                        qrSection.style.backgroundColor = '#f0fdf4';
                        setTimeout(() => {
                            qrSection.style.border = '';
                            qrSection.style.backgroundColor = '';
                        }, 3000);
                    }
                }, 200);
            } catch (error) {
                console.error('Error generating QR code:', error);
                // Fallback to text display
                this.displayQRCodeFallback(qrContainer);
            }
        } else {
            // Fallback: display as text or use external QR generator
            console.log('QRCode library not available, using fallback');
            this.displayQRCodeFallback(qrContainer);
        }
    }

    // Fallback QR display
    displayQRCodeFallback(container) {
        container.innerHTML = `
            <div class="bg-white p-4 rounded-lg border max-w-md mx-auto">
                <p class="text-sm mb-2 font-medium">Scan QR Code with WhatsApp:</p>
                <div class="text-xs break-all bg-gray-100 p-2 rounded font-mono">${this.qrCode}</div>
                <p class="text-xs text-gray-500 mt-2">Open WhatsApp → Linked Devices → Scan QR</p>
            </div>
        `;
    }

    // Disconnect WhatsApp
    async disconnect() {
        if (!confirm('Are you sure you want to disconnect WhatsApp? You will need to scan QR code again.')) {
            return;
        }

        try {
            const btn = document.getElementById('disconnect-whatsapp-btn');
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Disconnecting...';
            }

            const response = await axios.post('/whatsapp/disconnect');

            if (response.data.success) {
                Utils.showAlert('WhatsApp disconnected successfully', 'success');
                this.status = { isReady: false, hasQR: false };
                this.qrCode = null;
                this.updateStatusUI();
            }
        } catch (error) {
            console.error('Error disconnecting WhatsApp:', error);
            Utils.showAlert('Failed to disconnect WhatsApp', 'error');
        } finally {
            const btn = document.getElementById('disconnect-whatsapp-btn');
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-unlink mr-1"></i> Disconnect';
            }
        }
    }

    // Send test message

    // Update Status UI
    updateStatusUI() {
        const statusIndicator = document.getElementById('whatsapp-status-indicator');
        const statusText = document.getElementById('whatsapp-status-text');
        const statusMessage = document.getElementById('whatsapp-status-message');
        const connectedSection = document.getElementById('whatsapp-connected-section');
        const qrSection = document.getElementById('whatsapp-qr-section');
        const disconnectedSection = document.getElementById('whatsapp-disconnected-section');

        if (!this.status) return;

        if (this.status.isReady) {
            // Connected
            if (statusIndicator) statusIndicator.className = 'w-3 h-3 rounded-full bg-green-500';
            if (statusText) statusText.textContent = 'Connected';
            if (statusText) statusText.className = 'text-sm font-medium text-green-600';
            if (statusMessage) statusMessage.textContent = this.status.message || 'WhatsApp is ready';

            if (connectedSection) connectedSection.classList.remove('hidden');
            if (qrSection) qrSection.classList.add('hidden');
            if (disconnectedSection) disconnectedSection.classList.add('hidden');
        } else if (this.status.hasQR) {
            // QR Available
            if (statusIndicator) statusIndicator.className = 'w-3 h-3 rounded-full bg-yellow-500';
            if (statusText) statusText.textContent = 'Waiting for QR Scan';
            if (statusText) statusText.className = 'text-sm font-medium text-yellow-600';
            if (statusMessage) statusMessage.textContent = this.status.message || 'Please scan QR code';

            if (connectedSection) connectedSection.classList.add('hidden');
            if (qrSection) qrSection.classList.remove('hidden');
            if (disconnectedSection) disconnectedSection.classList.add('hidden');

            // Load QR code only if modal is not already open
            if (!this.qrModalOpen) {
                console.log('QR available but modal not open, auto-loading QR code');
                this.loadQRCode();
            } else {
                console.log('QR modal already open, skipping auto-load');
            }
        } else {
            // Disconnected
            if (statusIndicator) statusIndicator.className = 'w-3 h-3 rounded-full bg-red-500';
            if (statusText) statusText.textContent = 'Disconnected';
            if (statusText) statusText.className = 'text-sm font-medium text-red-600';
            if (statusMessage) statusMessage.textContent = this.status.message || 'WhatsApp is not connected';

            if (connectedSection) connectedSection.classList.add('hidden');
            if (qrSection) qrSection.classList.add('hidden');
            if (disconnectedSection) disconnectedSection.classList.remove('hidden');
        }
    }

    // Start polling status (adaptive interval)
    startStatusPolling() {
        // Clear existing interval
        if (this.statusCheckInterval) {
            clearInterval(this.statusCheckInterval);
        }

        // Poll with adaptive interval
        this.statusCheckInterval = setInterval(async () => {
            await this.loadStatus();

            // Adjust polling based on status
            if (this.status && !this.status.isReady && this.status.hasQR) {
                // Faster polling when waiting for QR scan (every 3 seconds)
                this.adjustPollingInterval(3000);
            } else {
                // Normal polling when connected or idle (every 30 seconds)
                this.adjustPollingInterval(30000);
            }
        }, 3000); // Start with 3 seconds
    }

    // Adjust polling interval dynamically
    adjustPollingInterval(newInterval) {
        const currentInterval = this.statusCheckInterval?._repeat;
        if (currentInterval && currentInterval !== newInterval) {
            console.log(`Adjusting polling interval to ${newInterval}ms`);
            clearInterval(this.statusCheckInterval);
            this.statusCheckInterval = setInterval(async () => {
                await this.loadStatus();
            }, newInterval);
        }
    }

    // Stop polling
    stopStatusPolling() {
        if (this.statusCheckInterval) {
            clearInterval(this.statusCheckInterval);
            this.statusCheckInterval = null;
        }
    }

    // Setup event listeners
    setupEventListeners() {
        console.log('Setting up WhatsApp event listeners...');

        // Save settings button
        const saveBtn = document.getElementById('save-whatsapp-settings-btn');
        console.log('Save button:', saveBtn);
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveSettings());
        }

        // Initialize connection button (new ID from HTML)
        const initBtn = document.getElementById('whatsapp-init');
        console.log('Init button:', initBtn);
        if (initBtn) {
            initBtn.addEventListener('click', () => this.initializeConnection());
        }

        // Also support old ID for backward compatibility
        const initBtnOld = document.getElementById('init-whatsapp-btn');
        console.log('Init button (old):', initBtnOld);
        if (initBtnOld) {
            initBtnOld.addEventListener('click', () => this.initializeConnection());
        }

        // Show QR Code button
        const qrBtn = document.getElementById('whatsapp-qr');
        console.log('QR button:', qrBtn);
        if (qrBtn) {
            qrBtn.addEventListener('click', () => this.loadQRCode());
        }

        // Check Status button
        const statusBtn = document.getElementById('whatsapp-status');
        console.log('Status button:', statusBtn);
        if (statusBtn) {
            statusBtn.addEventListener('click', () => this.loadStatus(true));
        }

        // Disconnect button
        const disconnectBtn = document.getElementById('disconnect-whatsapp-btn');
        console.log('Disconnect button:', disconnectBtn);
        if (disconnectBtn) {
            disconnectBtn.addEventListener('click', () => this.disconnect());
        }

        console.log('Event listeners setup complete');
    }
}

// Initialize WhatsApp Manager
let whatsappManager;

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded - Initializing WhatsApp Manager...');

    // Only initialize if on settings page and whatsapp tab exists
    const whatsappSettingsDiv = document.getElementById('whatsapp-settings');
    console.log('WhatsApp settings div:', whatsappSettingsDiv);

    if (whatsappSettingsDiv) {
        console.log('Creating WhatsAppManager instance...');
        whatsappManager = new WhatsAppManager();
        console.log('WhatsAppManager created:', whatsappManager);

        // IMPORTANT: Setup event listeners immediately, not just when tab is clicked
        console.log('Setting up event listeners immediately...');
        try {
            whatsappManager.setupEventListeners();
            console.log('✅ Event listeners setup completed successfully');
        } catch (error) {
            console.error('❌ Error setting up event listeners:', error);
        }

        // Initialize when WhatsApp tab is clicked
        const whatsappNavLink = document.querySelector('a[href="#whatsapp"]');
        console.log('WhatsApp nav link:', whatsappNavLink);

        if (whatsappNavLink) {
            whatsappNavLink.addEventListener('click', () => {
                console.log('WhatsApp tab clicked');
                setTimeout(() => {
                    if (!whatsappManager.status) {
                        // Only load status and settings, not full init
                        console.log('Loading WhatsApp status and settings...');
                        whatsappManager.loadStatus();
                        whatsappManager.loadSettings();
                        whatsappManager.startStatusPolling();
                    } else {
                        console.log('WhatsApp Manager already loaded');
                    }
                }, 100);
            });

            // Check if WhatsApp tab is already active on page load
            const whatsappSettings = document.getElementById('whatsapp-settings');
            if (whatsappSettings && !whatsappSettings.classList.contains('hidden')) {
                console.log('WhatsApp tab is active, initializing...');
                whatsappManager.init();
            }
        }
    } else {
        console.log('WhatsApp settings not found on this page');
    }
});

// Export for global access
window.WhatsAppManager = WhatsAppManager;
window.whatsappManager = whatsappManager;

