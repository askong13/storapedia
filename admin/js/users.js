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
// USERS LOGIC
// =====================================================================
function renderUsersTable(users) {
    const tbody = document.getElementById('users-table-body');
    const cardView = document.getElementById('users-card-view'); 
    const searchTerm = document.getElementById('user-search').value.toLowerCase();
    
    tbody.innerHTML = '';
    cardView.innerHTML = '';

    const filtered = (users || []).filter(u => u && ((u.name?.toLowerCase() || '').includes(searchTerm) || (u.email?.toLowerCase() || '').includes(searchTerm)));

    if (filtered.length === 0) {
        const noResultsHtml = `<tr><td colspan="5" class="text-center p-8">No users found.</td></tr>`;
        tbody.innerHTML = noResultsHtml;
        cardView.innerHTML = `<p class="text-center text-gray-500 p-4">No users found.</p>`;
        return;
    }

    filtered.forEach(u => {
        if (!u || !u.id) return;

        // Table Row for Desktop
        const row = document.createElement('tr');
        row.className = 'bg-white border-b hover:bg-gray-50';
        row.innerHTML = `
            <td class="px-6 py-4 font-semibold">${u.name || 'N/A'}</td>
            <td class="px-6 py-4">${u.email || 'N/A'}</td>
            <td class="px-6 py-4">${u.phone || 'N/A'}</td>
            <td class="px-6 py-4">${u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-US') : 'N/A'}</td>
            <td class="px-6 py-4 space-x-2">
                <button class="text-blue-600 hover:text-blue-900" title="Edit User" onclick="openUserEditModal('${u.id}')"><i class="fas fa-edit"></i></button>
                <button class="text-purple-600 hover:text-purple-900" title="Send Message" onclick="openDirectMessageModal('${u.id}')"><i class="fas fa-comment-dots"></i></button>
            </td>
        `;
        tbody.appendChild(row);

        // Card View for Mobile
        const card = document.createElement('div');
        card.className = 'data-card';
        card.innerHTML = `
            <div class="card-row">
                <span class="card-label">Name:</span>
                <span class="card-value font-semibold">${u.name || 'N/A'}</span>
            </div>
            <div class="card-row">
                <span class="card-label">Email:</span>
                <span class="card-value">${u.email || 'N/A'}</span>
            </div>
            <div class="card-row">
                <span class="card-label">Phone:</span>
                <span class="card-value">${u.phone || 'N/A'}</span>
            </div>
            <div class="card-row">
                <span class="card-label">Joined On:</span>
                <span class="card-value">${u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-US') : 'N/A'}</span>
            </div>
            <div class="card-actions">
                <button class="text-blue-600 hover:text-blue-900" onclick="openUserEditModal('${u.id}')"><i class="fas fa-edit"></i> Edit</button>
                <button class="text-purple-600 hover:text-purple-900" onclick="openDirectMessageModal('${u.id}')"><i class="fas fa-comment-dots"></i> Message</button>
            </div>
        `;
        cardView.appendChild(card);
    });
}

async function openUserEditModal(userId) {
    const user = allUsers[userId];
    if (!user) return;
    Swal.fire({
        title: `Edit User: ${user.name}`,
        html: `
            <input id="swal-user-name" class="swal2-input" placeholder="Full Name" value="${user.name || ''}">
            <input id="swal-user-email" class="swal2-input" placeholder="Email" value="${user.email || ''}" disabled>
            <input id="swal-user-phone" class="swal2-input" placeholder="Phone Number" value="${user.phone || ''}">
            <button id="swal-reset-password-btn" class="swal2-confirm swal2-styled mt-4">Send Password Reset</button>
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'Save Changes',
        didOpen: () => {
            document.getElementById('swal-reset-password-btn').addEventListener('click', () => sendPasswordReset(user.email));
        },
        preConfirm: () => ({
            name: document.getElementById('swal-user-name').value,
            phone: document.getElementById('swal-user-phone').value
        })
    }).then(result => {
        if (result.isConfirmed) {
            db.ref(`users/${userId}`).update(result.value)
                .then(() => Swal.fire('Success', 'User details updated.', 'success'))
                .catch(err => Swal.fire('Error', err.message, 'error'));
        }
    });
}