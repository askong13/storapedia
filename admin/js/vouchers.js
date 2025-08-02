// Di awal file js/reviews.js atau di mana pun handleReviewReply didefinisikan
window.handleReviewReply = async function(e, locationId, reviewId, userId) {
    // ... kode yang sudah ada untuk membalas review
};

// Di awal file js/bookings.js
window.viewBookingDetails = async function(bookingId) {
    // ... kode yang sudah ada untuk melihat detail booking
};

// Di awal file js/inbox.js
window.openDirectMessageModal = function(userId) {
    // ... kode yang sudah ada untuk membuka chat
};// =====================================================================
// VOUCHERS LOGIC
// =====================================================================
function fetchAndRenderVouchers() {
    allVouchers = [];
    db.ref('vouchers').once('value', snapshot => {
        console.log("Snapshot Firebase:", snapshot.val()); // Ini akan menampilkan seluruh objek vouchers
        console.log("Jumlah children di Snapshot:", snapshot.numChildren()); // Ini akan menampilkan berapa banyak anak yang dilihat snapshot
        snapshot.forEach(child => {
            console.log("Memproses child:", child.key); // Ini akan menampilkan kunci setiap child yang diproses
            allVouchers.push({id: child.key, ...child.val()});
        });
        console.log("Data allVouchers setelah diproses:", allVouchers);
        renderVouchersTable(allVouchers);
    });
}

function renderVouchersTable(vouchers) {
    const tbody = document.getElementById('vouchers-table-body');
    const cardView = document.getElementById('vouchers-card-view'); // Added for mobile view
    
    tbody.innerHTML = '';
    cardView.innerHTML = '';

    if (!vouchers || vouchers.length === 0) {
        const noResultsHtml = `<tr><td colspan="6" class="text-center p-8">No vouchers found.</td></tr>`;
        tbody.innerHTML = noResultsHtml;
        cardView.innerHTML = `<p class="text-center text-gray-500 p-4">No vouchers found.</p>`;
        return;
    }

    vouchers.forEach(v => {
        let appliesTo = 'All Locations';
        if (v.appliesTo === 'specific' && v.locations) { appliesTo = `${Object.keys(v.locations).length} specific locations`; }

        // Table Row for Desktop
        const row = document.createElement('tr');
        row.className = 'bg-white border-b hover:bg-gray-50';
        row.innerHTML = `
            <td class="px-6 py-4"><img src="${v.imageUrl || 'https://placehold.co/100x60/e2e8f0/64748b?text=Voucher'}" class="w-24 h-auto rounded-md"></td>
            <td class="px-6 py-4 font-semibold">${v.code || 'N/A'}</td>
            <td class="px-6 py-4">${v.discount_percent || '0'}%</td>
            <td class="px-6 py-4 text-xs">${appliesTo}</td>
            <td class="px-6 py-4"><span class="px-2 py-1 font-semibold leading-tight rounded-full text-xs ${v.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">${v.active ? 'Active' : 'Inactive'}</span></td>
            <td class="px-6 py-4 space-x-2">
                <button class="text-blue-600 hover:text-blue-900" onclick="openVoucherModal('${v.code}')"><i class="fas fa-edit"></i></button>
                <button class="text-red-600 hover:text-red-900" onclick="deleteItem('vouchers', '${v.code}', 'voucher')"><i class="fas fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(row);

        // Card View for Mobile
        const card = document.createElement('div');
        card.className = 'data-card';
        card.innerHTML = `
            <div class="card-row">
                <span class="card-label">Code:</span>
                <span class="card-value font-semibold">${v.code || 'N/A'}</span>
            </div>
            <div class="card-row">
                <span class="card-label">Discount:</span>
                <span class="card-value">${v.discount_percent || '0'}%</span>
            </div>
            <div class="card-row">
                <span class="card-label">Applies To:</span>
                <span class="card-value text-xs">${appliesTo}</span>
            </div>
            <div class="card-row">
                <span class="card-label">Status:</span>
                <span class="card-value"><span class="px-2 py-1 font-semibold leading-tight rounded-full text-xs ${v.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">${v.active ? 'Active' : 'Inactive'}</span></span>
            </div>
            <div class="card-actions">
                <button class="text-blue-600 hover:text-blue-900" onclick="openVoucherModal('${v.code}')"><i class="fas fa-edit"></i> Edit</button>
                <button class="text-red-600 hover:text-red-900" onclick="deleteItem('vouchers', '${v.code}', 'voucher')"><i class="fas fa-trash"></i> Delete</button>
            </div>
        `;
        cardView.appendChild(card);
    });
}

async function openVoucherModal(voucherId = null) {
    let v = {};
    if (voucherId) {
        const snapshot = await db.ref(`vouchers/${voucherId}`).once('value');
        v = { id: voucherId, ...snapshot.val() };
    }
    const isEdit = !!voucherId;
    const locationOptions = allLocations.map(l => `<label class="flex items-center gap-2"><input type="checkbox" class="specific-location-cb" value="${l.id}" ${v.locations?.[l.id] ? 'checked' : ''}> ${l.name}</label>`).join('');

    Swal.fire({
        title: isEdit ? 'Edit Voucher' : 'Add New Voucher',
        html: `
            <form id="voucher-form" class="text-left space-y-4">
                <input id="swal-voucher-code" class="swal2-input" placeholder="Voucher Code (e.g., DISCOUNT10)" value="${v.code || ''}" ${isEdit ? 'disabled' : ''}>
                <input id="swal-voucher-discount" type="number" class="swal2-input" placeholder="Discount (%)" value="${v.discount_percent || ''}">
                <label class="block text-sm font-medium text-gray-700">Voucher Status</label>
                <select id="swal-voucher-status" class="swal2-input">
                    <option value="true" ${v.active ? 'selected' : ''}>Active</option>
                    <option value="false" ${!v.active ? 'selected' : ''}>Inactive</option>
                </select>
                <label class="block text-sm font-medium text-gray-700">Voucher Image URL</label>
                <input id="swal-voucher-image" class="swal2-input" placeholder="Image URL" value="${v.imageUrl || ''}">
                <div class="p-3 border rounded-lg">
                    <h4 class="font-semibold mb-2">Applies To</h4>
                    <label class="flex items-center gap-2"><input type="radio" name="appliesTo" value="all" ${v.appliesTo !== 'specific' ? 'checked' : ''}> All Locations</label>
                    <label class="flex items-center gap-2"><input type="radio" name="appliesTo" value="specific" ${v.appliesTo === 'specific' ? 'checked' : ''}> Specific Locations</label>
                    <div id="specific-locations-container" class="mt-2 pl-6 space-y-2 ${v.appliesTo !== 'specific' ? 'hidden' : ''}">${locationOptions}</div>
                </div>
            </form>
        `,
        didOpen: () => {
            const specificCheckbox = document.querySelector('input[name="appliesTo"][value="specific"]');
            const allCheckbox = document.querySelector('input[name="appliesTo"][value="all"]');
            const specificContainer = document.getElementById('specific-locations-container');
            specificCheckbox.addEventListener('change', () => specificContainer.classList.remove('hidden'));
            allCheckbox.addEventListener('change', () => specificContainer.classList.add('hidden'));
        },
        showCancelButton: true,
        confirmButtonText: 'Save',
        preConfirm: () => {
            const code = document.getElementById('swal-voucher-code').value;
            const discount_percent = parseInt(document.getElementById('swal-voucher-discount').value);
            const active = document.getElementById('swal-voucher-status').value === 'true';
            const imageUrl = document.getElementById('swal-voucher-image').value;
            const appliesTo = document.querySelector('input[name="appliesTo"]:checked').value;
            let locations = null;
            if (appliesTo === 'specific') {
                locations = {};
                document.querySelectorAll('.specific-location-cb:checked').forEach(cb => locations[cb.value] = true);
            }
            return { code, discount_percent, active, imageUrl, appliesTo, locations };
        }
    }).then(result => {
        if (result.isConfirmed) {
            const data = result.value;
            if (!data.code || isNaN(data.discount_percent)) {
                return Swal.fire('Error', 'Code and Discount (%) are required.', 'error');
            }
            db.ref(`vouchers/${data.code}`).set(data)
                .then(() => Swal.fire('Success', 'Voucher saved.', 'success'))
                .catch(err => Swal.fire('Error', err.message, 'error'));
        }
    });
}