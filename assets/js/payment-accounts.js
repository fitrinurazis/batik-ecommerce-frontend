let bankAccounts = [];
let ewalletAccounts = [];

document.addEventListener('DOMContentLoaded', function() {
    initializePaymentAccounts();
});

function initializePaymentAccounts() {
    document.body.addEventListener('click', function(e) {
        if (e.target.id === 'add-bank-btn' || e.target.closest('#add-bank-btn')) {
            e.preventDefault();
            openBankModal();
        }

        if (e.target.id === 'add-ewallet-btn' || e.target.closest('#add-ewallet-btn')) {
            e.preventDefault();
            openEwalletModal();
        }
    });

    const bankForm = document.getElementById('bank-form');
    if (bankForm) {
        bankForm.addEventListener('submit', handleBankFormSubmit);
    }

    const ewalletForm = document.getElementById('ewallet-form');
    if (ewalletForm) {
        ewalletForm.addEventListener('submit', handleEwalletFormSubmit);
    }
}

function renderBankAccounts() {
    const container = document.getElementById('bank-accounts-list');
    if (!container) return;

    if (bankAccounts.length === 0) {
        container.innerHTML = '<p class="text-sm text-gray-500">Belum ada rekening bank. Klik "Tambah Bank" untuk menambahkan.</p>';
        return;
    }

    container.innerHTML = bankAccounts.map((account, index) => `
        <div class="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50">
            <div class="flex-1">
                <div class="flex items-center">
                    <i class="fas fa-university text-blue-600 mr-3"></i>
                    <div>
                        <p class="text-sm font-medium text-gray-900">${account.bank}</p>
                        <p class="text-xs text-gray-600">${account.account_number}</p>
                        <p class="text-xs text-gray-500">${account.account_holder}</p>
                        ${account.branch ? `<p class="text-xs text-gray-400">${account.branch}</p>` : ''}
                    </div>
                </div>
            </div>
            <div class="flex space-x-2">
                <button type="button" onclick="editBankAccount(${index})" class="text-blue-600 hover:text-blue-800">
                    <i class="fas fa-edit"></i>
                </button>
                <button type="button" onclick="deleteBankAccount(${index})" class="text-red-600 hover:text-red-800">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function openBankModal(index = null) {
    const modal = document.getElementById('bank-modal');
    const modalTitle = document.getElementById('bank-modal-title');
    const form = document.getElementById('bank-form');

    if (!modal) return;

    form.reset();
    document.getElementById('bank-index').value = '';

    if (index !== null && bankAccounts[index]) {
        modalTitle.textContent = 'Edit Rekening Bank';
        document.getElementById('bank-index').value = index;
        document.getElementById('bank-name').value = bankAccounts[index].bank;
        document.getElementById('bank-account-number').value = bankAccounts[index].account_number;
        document.getElementById('bank-account-holder').value = bankAccounts[index].account_holder;
        document.getElementById('bank-branch').value = bankAccounts[index].branch || '';
    } else {
        modalTitle.textContent = 'Tambah Rekening Bank';
    }

    modal.classList.remove('hidden');
}

function closeBankModal() {
    const modal = document.getElementById('bank-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

function handleBankFormSubmit(e) {
    e.preventDefault();

    const index = document.getElementById('bank-index').value;
    const bankData = {
        bank: document.getElementById('bank-name').value,
        account_number: document.getElementById('bank-account-number').value,
        account_holder: document.getElementById('bank-account-holder').value,
        branch: document.getElementById('bank-branch').value || ''
    };

    if (index !== '') {
        bankAccounts[parseInt(index)] = bankData;
    } else {
        bankAccounts.push(bankData);
    }

    renderBankAccounts();
    closeBankModal();
}

function editBankAccount(index) {
    openBankModal(index);
}

function deleteBankAccount(index) {
    if (confirm('Apakah Anda yakin ingin menghapus rekening bank ini?')) {
        bankAccounts.splice(index, 1);
        renderBankAccounts();
    }
}

function renderEwalletAccounts() {
    const container = document.getElementById('ewallet-accounts-list');
    if (!container) return;

    if (ewalletAccounts.length === 0) {
        container.innerHTML = '<p class="text-sm text-gray-500">Belum ada akun e-wallet. Klik "Tambah E-Wallet" untuk menambahkan.</p>';
        return;
    }

    container.innerHTML = ewalletAccounts.map((account, index) => `
        <div class="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50">
            <div class="flex-1">
                <div class="flex items-center">
                    <i class="fas fa-mobile-alt text-green-600 mr-3"></i>
                    <div>
                        <p class="text-sm font-medium text-gray-900">${account.provider}</p>
                        <p class="text-xs text-gray-600">${account.account_number}</p>
                        <p class="text-xs text-gray-500">${account.account_holder}</p>
                    </div>
                </div>
            </div>
            <div class="flex space-x-2">
                <button type="button" onclick="editEwalletAccount(${index})" class="text-blue-600 hover:text-blue-800">
                    <i class="fas fa-edit"></i>
                </button>
                <button type="button" onclick="deleteEwalletAccount(${index})" class="text-red-600 hover:text-red-800">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function openEwalletModal(index = null) {
    const modal = document.getElementById('ewallet-modal');
    const modalTitle = document.getElementById('ewallet-modal-title');
    const form = document.getElementById('ewallet-form');

    if (!modal) return;

    form.reset();
    document.getElementById('ewallet-index').value = '';

    if (index !== null && ewalletAccounts[index]) {
        modalTitle.textContent = 'Edit E-Wallet';
        document.getElementById('ewallet-index').value = index;
        document.getElementById('ewallet-provider').value = ewalletAccounts[index].provider;
        document.getElementById('ewallet-account-number').value = ewalletAccounts[index].account_number;
        document.getElementById('ewallet-account-holder').value = ewalletAccounts[index].account_holder;
    } else {
        modalTitle.textContent = 'Tambah E-Wallet';
    }

    modal.classList.remove('hidden');
}

function closeEwalletModal() {
    const modal = document.getElementById('ewallet-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

function handleEwalletFormSubmit(e) {
    e.preventDefault();

    const index = document.getElementById('ewallet-index').value;
    const ewalletData = {
        provider: document.getElementById('ewallet-provider').value,
        account_number: document.getElementById('ewallet-account-number').value,
        account_holder: document.getElementById('ewallet-account-holder').value
    };

    if (index !== '') {
        ewalletAccounts[parseInt(index)] = ewalletData;
    } else {
        ewalletAccounts.push(ewalletData);
    }

    renderEwalletAccounts();
    closeEwalletModal();
}

function editEwalletAccount(index) {
    openEwalletModal(index);
}

function deleteEwalletAccount(index) {
    if (confirm('Apakah Anda yakin ingin menghapus akun e-wallet ini?')) {
        ewalletAccounts.splice(index, 1);
        renderEwalletAccounts();
    }
}

function loadPaymentAccounts(settings) {
    if (settings.payment && settings.payment.bank_accounts) {
        bankAccounts = Array.isArray(settings.payment.bank_accounts)
            ? settings.payment.bank_accounts
            : [];
        renderBankAccounts();
    }

    if (settings.payment && settings.payment.ewallet_accounts) {
        ewalletAccounts = Array.isArray(settings.payment.ewallet_accounts)
            ? settings.payment.ewallet_accounts
            : [];
        renderEwalletAccounts();
    }
}

function getPaymentAccountsData() {
    return {
        bank_accounts: bankAccounts,
        ewallet_accounts: ewalletAccounts
    };
}
window.loadPaymentAccounts = loadPaymentAccounts;
window.getPaymentAccountsData = getPaymentAccountsData;
window.closeBankModal = closeBankModal;
window.closeEwalletModal = closeEwalletModal;
window.editBankAccount = editBankAccount;
window.deleteBankAccount = deleteBankAccount;
window.editEwalletAccount = editEwalletAccount;
window.deleteEwalletAccount = deleteEwalletAccount;
