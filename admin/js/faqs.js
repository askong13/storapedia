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
// FAQs LOGIC
// =====================================================================
function renderFaqsTable(faqs) {
    const tbody = document.getElementById('faqs-table-body');
    const cardView = document.getElementById('faqs-card-view'); // Added for mobile view
    
    tbody.innerHTML = '';
    cardView.innerHTML = '';

    if (!faqs || faqs.length === 0) {
        const noResultsHtml = `<tr><td colspan="3" class="text-center p-8">No FAQs found.</td></tr>`;
        tbody.innerHTML = noResultsHtml;
        cardView.innerHTML = `<p class="text-center text-gray-500 p-4">No FAQs found.</p>`;
        return;
    }

    faqs.forEach(faq => {
        // Table Row for Desktop
        const row = document.createElement('tr');
        row.className = 'bg-white border-b hover:bg-gray-50';
        row.innerHTML = `
            <td class="px-6 py-4 font-semibold w-1/3">${faq.q || '<i>No Question</i>'}</td>
            <td class="px-6 py-4 w-2/3">${faq.a || '<i>No Answer</i>'}</td>
            <td class="px-6 py-4 space-x-2">
                <button class="text-blue-600 hover:text-blue-900" onclick="openFaqModal('${faq.id}')"><i class="fas fa-edit"></i></button>
                <button class="text-red-600 hover:text-red-900" onclick="deleteItem('faqs', '${faq.id}', 'FAQ')"><i class="fas fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(row);

        // Card View for Mobile
        const card = document.createElement('div');
        card.className = 'data-card';
        card.innerHTML = `
            <div class="card-row">
                <span class="card-label">Question:</span>
                <span class="card-value font-semibold">${faq.q || '<i>No Question</i>'}</span>
            </div>
            <div class="card-row">
                <span class="card-label">Answer:</span>
                <span class="card-value">${faq.a || '<i>No Answer</i>'}</span>
            </div>
            <div class="card-actions">
                <button class="text-blue-600 hover:text-blue-900" onclick="openFaqModal('${faq.id}')"><i class="fas fa-edit"></i> Edit</button>
                <button class="text-red-600 hover:text-red-900" onclick="deleteItem('faqs', '${faq.id}', 'FAQ')"><i class="fas fa-trash"></i> Delete</button>
            </div>
        `;
        cardView.appendChild(card);
    });
}

async function openFaqModal(faqId = null) {
    let faq = {};
    if (faqId) {
        const snapshot = await db.ref(`faqs/${faqId}`).once('value');
        faq = snapshot.val() || {};
    }
    Swal.fire({
        title: faqId ? 'Edit FAQ' : 'Add New FAQ',
        html: `
            <input id="swal-faq-q" class="swal2-input" placeholder="Question" value="${faq.q || ''}">
            <textarea id="swal-faq-a" class="swal2-textarea" placeholder="Answer">${faq.a || ''}</textarea>
        `,
        showCancelButton: true,
        confirmButtonText: 'Save',
        preConfirm: () => ({
            q: document.getElementById('swal-faq-q').value,
            a: document.getElementById('swal-faq-a').value
        })
    }).then(result => {
        if (result.isConfirmed && result.value.q && result.value.a) {
            const ref = faqId ? db.ref(`faqs/${faqId}`) : db.ref('faqs').push();
            ref.set(result.value)
                .then(() => Swal.fire('Success', 'FAQ saved.', 'success'))
                .catch(err => Swal.fire('Error', err.message, 'error'));
        } else if (result.isConfirmed) {
            Swal.fire('Warning', 'Question and Answer cannot be empty.', 'warning');
        }
    });
}