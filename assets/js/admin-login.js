window.addEventListener('error', function(e) {
    if (e.filename && e.filename.includes('wireframe')) {
        e.preventDefault();
        return false;
    }
});

document.addEventListener('DOMContentLoaded', function() {
    initLoginPage();
});

async function initLoginPage() {
    const user = await AuthManager.checkAuth();
    if (user) {
        Utils.showAlert('Anda sudah login. Mengalihkan ke dashboard...', 'info');
        setTimeout(() => {
            window.location.href = '/pages/dashboard-home.html';
        }, 1000);
        return;
    }

    const loginForm = document.getElementById('login-form');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const togglePasswordBtn = document.getElementById('toggle-password');
    const loginText = document.getElementById('login-text');
    const loginLoading = document.getElementById('login-loading');

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

    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            await handleLogin();
        });
    }

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

        const submitBtn = loginForm.querySelector('button[type="submit"]');
        setLoadingState(true);

        try {
            const response = await ApiService.login({
                username: username,
                password: password
            });

            Utils.showAlert('Login berhasil! Mengalihkan ke dashboard...', 'success');

            if (usernameInput) usernameInput.value = '';
            if (passwordInput) passwordInput.value = '';

            setTimeout(() => {
                window.location.href = '/pages/dashboard-home.html';
            }, 1500);

        } catch (error) {
            Utils.showAlert(error.message || 'Login gagal. Periksa username dan password Anda.', 'error');

            usernameInput?.focus();
            usernameInput?.select();

        } finally {
            setLoadingState(false);
        }
    }

    function setLoadingState(isLoading) {
        const submitBtn = loginForm?.querySelector('button[type="submit"]');

        if (isLoading) {
            if (usernameInput) usernameInput.disabled = true;
            if (passwordInput) passwordInput.disabled = true;
            if (submitBtn) submitBtn.disabled = true;

            if (loginText) loginText.classList.add('hidden');
            if (loginLoading) loginLoading.classList.remove('hidden');
        } else {
            if (usernameInput) usernameInput.disabled = false;
            if (passwordInput) passwordInput.disabled = false;
            if (submitBtn) submitBtn.disabled = false;

            if (loginText) loginText.classList.remove('hidden');
            if (loginLoading) loginLoading.classList.add('hidden');
        }
    }

    addLoginHelpers();
}

function addLoginHelpers() {
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');

    const savedUsername = localStorage.getItem('last_admin_username');
    if (savedUsername && usernameInput) {
        usernameInput.value = savedUsername;
        if (passwordInput) passwordInput.focus();
    }

    const originalLogin = ApiService.login;
    ApiService.login = async function(credentials) {
        const result = await originalLogin.call(this, credentials);
        localStorage.setItem('last_admin_username', credentials.username);
        return result;
    };

    window.addEventListener('beforeunload', function() {
        if (!localStorage.getItem('admin_token')) {
            localStorage.removeItem('last_admin_username');
        }
    });

    if (usernameInput && !usernameInput.value) {
        usernameInput.focus();
    } else if (passwordInput && !passwordInput.value) {
        passwordInput.focus();
    }

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

window.addEventListener('online', function() {
    Utils.showAlert('Koneksi internet tersambung kembali', 'success', 3000);
});

window.addEventListener('offline', function() {
    Utils.showAlert('Koneksi internet terputus. Periksa koneksi Anda.', 'warning', 0);
});

async function updateCSRFToken() {
    try {
        const csrfInput = document.getElementById('csrf_token');
        if (csrfInput) {
            csrfInput.value = '';
        }
    } catch (error) {
        console.error('Failed to update CSRF token:', error);
    }
}

updateCSRFToken();