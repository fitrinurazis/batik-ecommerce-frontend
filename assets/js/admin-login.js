// Admin Login Page Script

// Handle third-party extension errors
window.addEventListener('error', function(e) {
    if (e.filename && e.filename.includes('wireframe')) {
        e.preventDefault();
        console.warn('Wireframe extension detected, ignoring error');
        return false;
    }
});

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing login page...');
    // Initialize login page
    initLoginPage();
});

async function initLoginPage() {
    // Check if already authenticated
    const user = await AuthManager.checkAuth();
    if (user) {
        Utils.showAlert('Anda sudah login. Mengalihkan ke dashboard...', 'info');
        setTimeout(() => {
            window.location.href = '/pages/dashboard-home.html';
        }, 1000);
        return;
    }

    // Get form elements
    const loginForm = document.getElementById('login-form');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const togglePasswordBtn = document.getElementById('toggle-password');
    const loginText = document.getElementById('login-text');
    const loginLoading = document.getElementById('login-loading');

    // Toggle password visibility
    if (togglePasswordBtn && passwordInput) {
        togglePasswordBtn.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);

            const icon = this.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-eye');
                icon.classList.toggle('fa-eye-slash');
            }
        });
    }

    // Handle form submission
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            await handleLogin();
        });
    }

    // Handle Enter key press
    [usernameInput, passwordInput].forEach(input => {
        if (input) {
            input.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    handleLogin();
                }
            });
        }
    });

    async function handleLogin() {
        const username = usernameInput?.value?.trim();
        const password = passwordInput?.value;

        // Validation
        if (!username) {
            Utils.showAlert('Username tidak boleh kosong', 'error');
            usernameInput?.focus();
            return;
        }

        if (!password) {
            Utils.showAlert('Password tidak boleh kosong', 'error');
            passwordInput?.focus();
            return;
        }

        // Show loading state
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        setLoadingState(true);

        try {
            // Attempt login
            console.log('Attempting login with:', { username, password: '***' });
            const response = await ApiService.login({
                username: username,
                password: password
            });

            console.log('Login response:', response);
            // Login successful
            Utils.showAlert('Login berhasil! Mengalihkan ke dashboard...', 'success');

            // Clear form
            if (usernameInput) usernameInput.value = '';
            if (passwordInput) passwordInput.value = '';

            // Redirect to dashboard
            setTimeout(() => {
                console.log('Redirecting to dashboard...');
                window.location.href = '/pages/dashboard-home.html';
            }, 1500);

        } catch (error) {
            // Login failed
            Utils.showAlert(error.message || 'Login gagal. Periksa username dan password Anda.', 'error');

            // Focus on username field
            usernameInput?.focus();
            usernameInput?.select();

        } finally {
            // Hide loading state
            setLoadingState(false);
        }
    }

    function setLoadingState(isLoading) {
        const submitBtn = loginForm?.querySelector('button[type="submit"]');

        if (isLoading) {
            // Disable form elements
            if (usernameInput) usernameInput.disabled = true;
            if (passwordInput) passwordInput.disabled = true;
            if (submitBtn) submitBtn.disabled = true;

            // Show loading indicator
            if (loginText) loginText.classList.add('hidden');
            if (loginLoading) loginLoading.classList.remove('hidden');
        } else {
            // Enable form elements
            if (usernameInput) usernameInput.disabled = false;
            if (passwordInput) passwordInput.disabled = false;
            if (submitBtn) submitBtn.disabled = false;

            // Hide loading indicator
            if (loginText) loginText.classList.remove('hidden');
            if (loginLoading) loginLoading.classList.add('hidden');
        }
    }

    // Add some helpful features
    addLoginHelpers();
}

function addLoginHelpers() {
    // Remember last username (optional feature)
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');

    // Load saved username
    const savedUsername = localStorage.getItem('last_admin_username');
    if (savedUsername && usernameInput) {
        usernameInput.value = savedUsername;
        if (passwordInput) passwordInput.focus();
    }

    // Save username on successful login
    const originalLogin = ApiService.login;
    ApiService.login = async function(credentials) {
        const result = await originalLogin.call(this, credentials);
        localStorage.setItem('last_admin_username', credentials.username);
        return result;
    };

    // Clear saved data on logout
    window.addEventListener('beforeunload', function() {
        if (!localStorage.getItem('admin_token')) {
            localStorage.removeItem('last_admin_username');
        }
    });

    // Auto-focus first empty field
    if (usernameInput && !usernameInput.value) {
        usernameInput.focus();
    } else if (passwordInput && !passwordInput.value) {
        passwordInput.focus();
    }

    // Form validation feedback
    [usernameInput, passwordInput].forEach(input => {
        if (!input) return;

        input.addEventListener('input', function() {
            this.classList.remove('border-red-500');
            if (this.value.trim()) {
                this.classList.add('border-green-500');
            } else {
                this.classList.remove('border-green-500');
            }
        });

        input.addEventListener('blur', function() {
            if (!this.value.trim()) {
                this.classList.add('border-red-500');
                this.classList.remove('border-green-500');
            }
        });
    });
}

// Handle connection errors gracefully
window.addEventListener('online', function() {
    Utils.showAlert('Koneksi internet tersambung kembali', 'success', 3000);
});

window.addEventListener('offline', function() {
    Utils.showAlert('Koneksi internet terputus. Periksa koneksi Anda.', 'warning', 0);
});

// CSRF token handling (if needed)
async function updateCSRFToken() {
    try {
        // This would typically fetch a fresh CSRF token
        // For now, we'll just clear any existing token
        const csrfInput = document.getElementById('csrf_token');
        if (csrfInput) {
            csrfInput.value = '';
        }
    } catch (error) {
        console.error('Failed to update CSRF token:', error);
    }
}

// Initialize CSRF token on page load
updateCSRFToken();