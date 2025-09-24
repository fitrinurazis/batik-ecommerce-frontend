// Order Management Script

let currentOrder = null;
let orderFilters = {};
let orderPage = 1;

// Initialize order management functionality
function initOrderManagement() {
    initOrderFilters();
    initOrderActions();
    loadOrdersData();
}

function initOrderFilters() {
    // Status filter
    const statusFilter = document.getElementById('status-filter');
    if (statusFilter) {
        statusFilter.addEventListener('change', async (e) => {
            orderFilters.status = e.target.value;
            orderPage = 1;
            await loadOrdersData();
        });
    }

    // Date filter
    const dateFilter = document.getElementById('date-filter');
    if (dateFilter) {
        dateFilter.addEventListener('change', async (e) => {
            orderFilters.date = e.target.value;
            orderPage = 1;
            await loadOrdersData();

            // Show custom date inputs if 'custom' is selected
            if (e.target.value === 'custom') {
                showCustomDateFilter();
            } else {
                hideCustomDateFilter();
            }
        });
    }

    // Search orders
    const searchOrders = document.getElementById('search-orders');
    if (searchOrders) {
        const debouncedSearch = Utils.debounce(async (query) => {
            orderFilters.search = query;
            orderPage = 1;
            await loadOrdersData();
        }, 500);

        searchOrders.addEventListener('input', (e) => {
            debouncedSearch(e.target.value);
        });
    }

    // Export orders button
    const exportBtn = document.getElementById('export-orders');
    if (exportBtn) {
        exportBtn.addEventListener('click', handleExportOrders);
    }

    // Refresh orders button
    const refreshBtn = document.getElementById('refresh-orders');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
            Utils.setLoading(refreshBtn, true, 'Memperbarui...');
            try {
                await loadOrdersData();
                Utils.showAlert('Data pesanan diperbarui', 'success');
            } catch (error) {
                Utils.showAlert('Gagal memperbarui data', 'error');
            } finally {
                Utils.setLoading(refreshBtn, false);
            }
        });
    }
}

function initOrderActions() {
    // Order pagination
    const prevBtn = document.getElementById('orders-prev-page');
    const nextBtn = document.getElementById('orders-next-page');

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (orderPage > 1) {
                orderPage--;
                loadOrdersData();
            }
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            orderPage++;
            loadOrdersData();
        });
    }

    // Modal close buttons
    const closeModalBtns = document.querySelectorAll('#close-order-modal, #close-order-detail');
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = document.getElementById('order-detail-modal');
            if (modal) modal.classList.add('hidden');
        });
    });

    // Close modal on backdrop click
    const modal = document.getElementById('order-detail-modal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.add('hidden');
            }
        });
    }
}

async function loadOrdersData() {
    const tableBody = document.getElementById('orders-table-body');
    if (!tableBody) return;

    try {
        // Show loading state
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-4 text-center text-gray-500">
                    <div class="flex flex-col items-center justify-center py-4">
                        <i class="fas fa-spinner fa-spin text-amber-600 text-2xl mb-2"></i>
                        <p>Memuat data pesanan...</p>
                    </div>
                </td>
            </tr>
        `;

        const params = {
            page: orderPage,
            limit: window.ITEMS_PER_PAGE || 10,
            ...orderFilters
        };

        const response = await ApiService.getOrders(params);

        if (response.data && response.data.length > 0) {
            renderOrdersTable(response.data);
            updateOrdersPagination(response.pagination);
        } else {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="px-6 py-4 text-center text-gray-500">
                        <div class="flex flex-col items-center justify-center py-4">
                            <i class="fas fa-shopping-cart text-gray-400 text-3xl mb-2"></i>
                            <p>Tidak ada pesanan ditemukan</p>
                        </div>
                    </td>
                </tr>
            `;
        }
    } catch (error) {
        console.error('Error loading orders:', error);

        let errorMessage = 'Gagal memuat data pesanan';
        if (error.message.includes('401') || error.message.includes('Token')) {
            errorMessage = 'Silahkan login terlebih dahulu';
        } else if (error.message.includes('Network') || error.message.includes('fetch')) {
            errorMessage = 'Tidak dapat terhubung ke server';
        }

        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-4 text-center text-red-500">
                    <div class="flex flex-col items-center justify-center py-4">
                        <i class="fas fa-exclamation-triangle text-red-400 text-2xl mb-2"></i>
                        <p>${errorMessage}</p>
                        ${error.message.includes('401') || error.message.includes('Token') ?
                            '<a href="admin-login.html" class="text-blue-600 hover:text-blue-800 mt-2 inline-block">Login Sekarang</a>' :
                            '<button onclick="loadOrdersData()" class="text-blue-600 hover:text-blue-800 mt-2">Coba Lagi</button>'
                        }
                    </div>
                </td>
            </tr>
        `;
    }
}

function renderOrdersTable(orders) {
    const tableBody = document.getElementById('orders-table-body');
    if (!tableBody) return;

    tableBody.innerHTML = orders.map(order => `
        <tr class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                #${order.id}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">${order.customer_name}</div>
                <div class="text-sm text-gray-500">${order.customer_email}</div>
                <div class="text-sm text-gray-500">${order.customer_phone || ''}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <div>${Utils.formatDateShort(order.created_at)}</div>
                <div class="text-xs text-gray-500">${new Date(order.created_at).toLocaleTimeString('id-ID')}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <div class="font-medium">${Utils.formatCurrency(order.total)}</div>
                <div class="text-xs text-gray-500">${order.items ? order.items.length : 0} item</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                ${Utils.getStatusBadge(order.status)}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div class="flex justify-end space-x-2">
                    <button onclick="viewOrderDetail(${order.id})"
                            class="text-blue-600 hover:text-blue-900 p-1 rounded"
                            title="Lihat Detail">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button onclick="editOrderStatus(${order.id}, '${order.status}')"
                            class="text-amber-600 hover:text-amber-900 p-1 rounded"
                            title="Update Status">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="printInvoice(${order.id})"
                            class="text-green-600 hover:text-green-900 p-1 rounded"
                            title="Cetak Invoice">
                        <i class="fas fa-print"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function updateOrdersPagination(pagination) {
    if (!pagination) return;

    // Update pagination info
    const startElement = document.getElementById('orders-showing-start');
    const endElement = document.getElementById('orders-showing-end');
    const totalElement = document.getElementById('orders-total-items');

    if (startElement) startElement.textContent = pagination.offset + 1;
    if (endElement) endElement.textContent = Math.min(pagination.offset + pagination.limit, pagination.total);
    if (totalElement) totalElement.textContent = pagination.total;

    // Update pagination buttons
    const prevBtn = document.getElementById('orders-prev-page');
    const nextBtn = document.getElementById('orders-next-page');

    if (prevBtn) {
        prevBtn.disabled = pagination.page <= 1;
        prevBtn.classList.toggle('opacity-50', pagination.page <= 1);
    }

    if (nextBtn) {
        nextBtn.disabled = pagination.page >= pagination.totalPages;
        nextBtn.classList.toggle('opacity-50', pagination.page >= pagination.totalPages);
    }
}

// Order detail modal functions
async function viewOrderDetail(orderId) {
    try {
        Utils.showAlert('Memuat detail pesanan...', 'info', 2000);
        const order = await ApiService.getOrder(orderId);
        currentOrder = order;
        displayOrderDetail(order);

        const modal = document.getElementById('order-detail-modal');
        if (modal) modal.classList.remove('hidden');
    } catch (error) {
        console.error('Error loading order detail:', error);
        Utils.showAlert('Gagal memuat detail pesanan', 'error');
    }
}

function displayOrderDetail(order) {
    // Update order info
    updateElement('order-id', order.id);
    updateElement('customer-name', order.customer_name);
    updateElement('customer-email', order.customer_email);
    updateElement('customer-phone', order.customer_phone || '-');

    // Update shipping info
    updateElement('shipping-address', order.shipping_address);
    updateElement('shipping-city', order.shipping_city);
    updateElement('shipping-postal', order.shipping_postal);
    updateElement('shipping-method', order.shipping_method || 'Standar');

    // Update totals
    updateElement('order-subtotal', Utils.formatCurrency(order.subtotal));
    updateElement('order-shipping', Utils.formatCurrency(order.shipping_cost));
    updateElement('order-total', Utils.formatCurrency(order.total));

    // Update status
    const statusElement = document.getElementById('current-status');
    if (statusElement) {
        statusElement.innerHTML = Utils.getStatusBadge(order.status);
    }

    const statusSelect = document.getElementById('update-status');
    if (statusSelect) {
        statusSelect.value = order.status;
    }

    // Render order items
    renderOrderItems(order.items || []);

    // Setup save status button
    const saveStatusBtn = document.getElementById('save-status');
    if (saveStatusBtn) {
        saveStatusBtn.onclick = () => saveOrderStatus(order.id);
    }

    // Setup print invoice button
    const printBtn = document.getElementById('print-invoice');
    if (printBtn) {
        printBtn.onclick = () => printInvoice(order.id);
    }
}

function renderOrderItems(items) {
    const container = document.getElementById('order-items');
    if (!container) return;

    if (items.length === 0) {
        container.innerHTML = `
            <tr>
                <td colspan="4" class="px-6 py-4 text-center text-gray-500">
                    Tidak ada item dalam pesanan ini
                </td>
            </tr>
        `;
        return;
    }

    container.innerHTML = items.map(item => `
        <tr>
            <td class="px-6 py-4 text-sm text-gray-900">
                <div class="font-medium">${item.product_name}</div>
                ${item.product_id ? `<div class="text-xs text-gray-500">ID: ${item.product_id}</div>` : ''}
            </td>
            <td class="px-6 py-4 text-sm text-gray-900">
                ${Utils.formatCurrency(item.price)}
            </td>
            <td class="px-6 py-4 text-sm text-gray-900">
                ${item.quantity}
            </td>
            <td class="px-6 py-4 text-sm text-gray-900 font-medium">
                ${Utils.formatCurrency(item.subtotal)}
            </td>
        </tr>
    `).join('');
}

// Status management
async function editOrderStatus(orderId, currentStatus) {
    const statuses = [
        { value: 'pending', label: 'Menunggu Pembayaran' },
        { value: 'processing', label: 'Diproses' },
        { value: 'shipped', label: 'Dikirim' },
        { value: 'delivered', label: 'Selesai' },
        { value: 'cancelled', label: 'Dibatalkan' }
    ];

    const options = statuses.map(status =>
        `<option value="${status.value}" ${status.value === currentStatus ? 'selected' : ''}>${status.label}</option>`
    ).join('');

    const newStatus = prompt(`Pilih status baru untuk pesanan #${orderId}:\n\n${statuses.map((s, i) => `${i + 1}. ${s.label}`).join('\n')}\n\nMasukkan nomor (1-5):`);

    if (newStatus && newStatus >= 1 && newStatus <= 5) {
        const selectedStatus = statuses[newStatus - 1].value;
        await updateOrderStatus(orderId, selectedStatus);
    }
}

async function saveOrderStatus(orderId) {
    const statusSelect = document.getElementById('update-status');
    if (!statusSelect) return;

    const newStatus = statusSelect.value;
    const saveBtn = document.getElementById('save-status');

    Utils.setLoading(saveBtn, true, 'Menyimpan...');

    try {
        await ApiService.updateOrderStatus(orderId, newStatus);
        Utils.showAlert('Status pesanan berhasil diperbarui', 'success');

        // Update current order object
        if (currentOrder) {
            currentOrder.status = newStatus;
        }

        // Update status display
        const statusElement = document.getElementById('current-status');
        if (statusElement) {
            statusElement.innerHTML = Utils.getStatusBadge(newStatus);
        }

        // Refresh orders table
        await loadOrdersData();

    } catch (error) {
        console.error('Error updating order status:', error);
        Utils.showAlert('Gagal memperbarui status pesanan', 'error');
    } finally {
        Utils.setLoading(saveBtn, false);
    }
}

async function updateOrderStatus(orderId, status) {
    try {
        await ApiService.updateOrderStatus(orderId, status);
        Utils.showAlert('Status pesanan berhasil diperbarui', 'success');
        await loadOrdersData();
    } catch (error) {
        console.error('Error updating order status:', error);
        Utils.showAlert('Gagal memperbarui status pesanan', 'error');
    }
}

// Export and printing functions
async function handleExportOrders() {
    const exportBtn = document.getElementById('export-orders');
    Utils.setLoading(exportBtn, true, 'Mengekspor...');

    try {
        // Get all orders with current filters
        const params = {
            ...orderFilters,
            limit: 1000, // Export all matching orders
            export: true
        };

        const response = await ApiService.getOrders(params);

        if (response.data && response.data.length > 0) {
            exportToCSV(response.data);
            Utils.showAlert(`${response.data.length} pesanan berhasil diekspor`, 'success');
        } else {
            Utils.showAlert('Tidak ada data untuk diekspor', 'warning');
        }

    } catch (error) {
        console.error('Error exporting orders:', error);
        Utils.showAlert('Gagal mengekspor data pesanan', 'error');
    } finally {
        Utils.setLoading(exportBtn, false);
    }
}

function exportToCSV(orders) {
    const headers = [
        'ID Pesanan',
        'Tanggal',
        'Nama Pelanggan',
        'Email Pelanggan',
        'Telepon',
        'Alamat Pengiriman',
        'Kota',
        'Kode Pos',
        'Subtotal',
        'Ongkos Kirim',
        'Total',
        'Status',
        'Jumlah Item'
    ];

    const csvContent = [
        headers.join(','),
        ...orders.map(order => [
            order.id,
            new Date(order.created_at).toLocaleDateString('id-ID'),
            `"${order.customer_name}"`,
            order.customer_email,
            order.customer_phone || '',
            `"${order.shipping_address}"`,
            order.shipping_city,
            order.shipping_postal,
            order.subtotal,
            order.shipping_cost,
            order.total,
            order.status,
            order.items ? order.items.length : 0
        ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `pesanan_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

async function printInvoice(orderId) {
    try {
        // If order is not loaded, load it first
        let order = currentOrder;
        if (!order || order.id !== orderId) {
            order = await ApiService.getOrder(orderId);
        }

        generateInvoicePrint(order);

    } catch (error) {
        console.error('Error printing invoice:', error);
        Utils.showAlert('Gagal mencetak invoice', 'error');
    }
}

function generateInvoicePrint(order) {
    const printWindow = window.open('', '_blank');

    const invoiceHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Invoice #${order.id}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
                .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
                .company-name { font-size: 24px; font-weight: bold; color: #d97706; }
                .invoice-title { font-size: 20px; margin-top: 10px; }
                .info-section { margin: 20px 0; }
                .info-row { display: flex; justify-content: space-between; margin: 10px 0; }
                .customer-info, .order-info { width: 48%; }
                .section-title { font-weight: bold; font-size: 16px; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 10px; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f8f9fa; font-weight: bold; }
                .text-right { text-align: right; }
                .total-row { font-weight: bold; background-color: #f8f9fa; }
                .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
                .status { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
                .status-pending { background-color: #fef3c7; color: #92400e; }
                .status-processing { background-color: #dbeafe; color: #1e40af; }
                .status-shipped { background-color: #e0e7ff; color: #5b21b6; }
                .status-delivered { background-color: #dcfce7; color: #166534; }
                .status-cancelled { background-color: #fee2e2; color: #dc2626; }
                @media print {
                    body { margin: 0; }
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="company-name">Batik Nusantara</div>
                <div class="invoice-title">INVOICE #${order.id}</div>
                <div>Tanggal: ${Utils.formatDate(order.created_at)}</div>
            </div>

            <div class="info-section">
                <div class="info-row">
                    <div class="customer-info">
                        <div class="section-title">Informasi Pelanggan</div>
                        <div><strong>Nama:</strong> ${order.customer_name}</div>
                        <div><strong>Email:</strong> ${order.customer_email}</div>
                        <div><strong>Telepon:</strong> ${order.customer_phone || '-'}</div>
                    </div>
                    <div class="order-info">
                        <div class="section-title">Informasi Pengiriman</div>
                        <div><strong>Alamat:</strong> ${order.shipping_address}</div>
                        <div><strong>Kota:</strong> ${order.shipping_city}</div>
                        <div><strong>Kode Pos:</strong> ${order.shipping_postal}</div>
                        <div><strong>Status:</strong> <span class="status status-${order.status}">${getStatusText(order.status)}</span></div>
                    </div>
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>Produk</th>
                        <th>Harga</th>
                        <th>Jumlah</th>
                        <th class="text-right">Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    ${order.items ? order.items.map(item => `
                        <tr>
                            <td>${item.product_name}</td>
                            <td>${Utils.formatCurrency(item.price)}</td>
                            <td>${item.quantity}</td>
                            <td class="text-right">${Utils.formatCurrency(item.subtotal)}</td>
                        </tr>
                    `).join('') : ''}
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="3" class="text-right"><strong>Subtotal:</strong></td>
                        <td class="text-right">${Utils.formatCurrency(order.subtotal)}</td>
                    </tr>
                    <tr>
                        <td colspan="3" class="text-right"><strong>Ongkos Kirim:</strong></td>
                        <td class="text-right">${Utils.formatCurrency(order.shipping_cost)}</td>
                    </tr>
                    <tr class="total-row">
                        <td colspan="3" class="text-right"><strong>TOTAL:</strong></td>
                        <td class="text-right"><strong>${Utils.formatCurrency(order.total)}</strong></td>
                    </tr>
                </tfoot>
            </table>

            <div class="footer">
                <p>Terima kasih atas pesanan Anda!</p>
                <p>Untuk pertanyaan, hubungi kami di email atau telepon yang tertera di website.</p>
            </div>

            <script>
                window.onload = function() {
                    window.print();
                }
            </script>
        </body>
        </html>
    `;

    printWindow.document.write(invoiceHTML);
    printWindow.document.close();
}

function getStatusText(status) {
    const statusMap = {
        'pending': 'Menunggu Pembayaran',
        'processing': 'Diproses',
        'shipped': 'Dikirim',
        'delivered': 'Selesai',
        'cancelled': 'Dibatalkan'
    };
    return statusMap[status] || status;
}

// Custom date filter
function showCustomDateFilter() {
    const container = document.getElementById('custom-date-container');
    if (container) {
        container.classList.remove('hidden');
    } else {
        // Create custom date inputs if they don't exist
        const dateFilter = document.getElementById('date-filter');
        if (dateFilter && dateFilter.parentNode) {
            const customDiv = document.createElement('div');
            customDiv.id = 'custom-date-container';
            customDiv.className = 'flex space-x-2 mt-2';
            customDiv.innerHTML = `
                <input type="date" id="start-date" class="border border-gray-300 rounded-md px-3 py-2 text-sm">
                <input type="date" id="end-date" class="border border-gray-300 rounded-md px-3 py-2 text-sm">
                <button onclick="applyCustomDateFilter()" class="bg-amber-600 text-white px-3 py-2 rounded-md text-sm hover:bg-amber-700">
                    Terapkan
                </button>
            `;
            dateFilter.parentNode.appendChild(customDiv);
        }
    }
}

function hideCustomDateFilter() {
    const container = document.getElementById('custom-date-container');
    if (container) {
        container.classList.add('hidden');
    }
}

async function applyCustomDateFilter() {
    const startDate = document.getElementById('start-date')?.value;
    const endDate = document.getElementById('end-date')?.value;

    if (!startDate || !endDate) {
        Utils.showAlert('Pilih tanggal mulai dan akhir', 'warning');
        return;
    }

    if (new Date(startDate) > new Date(endDate)) {
        Utils.showAlert('Tanggal mulai harus sebelum tanggal akhir', 'warning');
        return;
    }

    orderFilters.startDate = startDate;
    orderFilters.endDate = endDate;
    orderPage = 1;
    await loadOrdersData();
}

// Utility function to update DOM elements
function updateElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('dashboard-orders.html')) {
        initOrderManagement();
    }
});

// Global functions for onclick handlers
window.viewOrderDetail = viewOrderDetail;
window.editOrderStatus = editOrderStatus;
window.updateOrderStatus = updateOrderStatus;
window.printInvoice = printInvoice;
window.applyCustomDateFilter = applyCustomDateFilter;