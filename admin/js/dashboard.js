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
// DASHBOARD LOGIC
// =====================================================================
function fetchAndRenderDashboard() {
    let totalRevenue = 0;
    let activeBookingsCount = 0;
    const now = Date.now();
    const sevenDaysFromNow = now + (7 * 24 * 60 * 60 * 1000); // 7 days in milliseconds
    let expiringSoonHtml = '';
    let overdueCheckoutHtml = '';

    (allBookings || []).forEach(booking => {
        // Calculate revenue from paid bookings
        if (booking.paymentStatus === 'paid' && typeof booking.totalPrice === 'number') {
            totalRevenue += booking.totalPrice;
        }
        
        // Count active bookings
        if (['active', 'checked_in'].includes(booking.bookingStatus)) {
            activeBookingsCount++;
            const userName = allUsers[booking.userId]?.name || 'Unknown User';
            
            // Check for bookings expiring within 7 days
            if (booking.endDate < sevenDaysFromNow && booking.endDate > now) {
                 expiringSoonHtml += `<div class="p-2 bg-orange-50 rounded-md flex justify-between items-center"><span><strong>${userName}</strong> at ${booking.locationName || 'N/A'}</span> <button class="text-blue-500 text-xs font-semibold" onclick="viewBookingDetails('${booking.id}')">View</button></div>`;
            // Check for overdue check-outs
            } else if (booking.endDate < now && booking.bookingStatus === 'checked_in') {
                overdueCheckoutHtml += `<div class="p-2 bg-red-50 rounded-md flex justify-between items-center"><span><strong>${userName}</strong> at ${booking.locationName || 'N/A'}</span> <button class="text-blue-500 text-xs font-semibold" onclick="followUpOverdue('${booking.id}')">Follow Up</button></div>`;
            }
        }
    });

    document.getElementById('stat-revenue').textContent = currencyFormatter.format(totalRevenue);
    document.getElementById('stat-active-bookings').textContent = activeBookingsCount;
    document.getElementById('expiring-soon-list').innerHTML = expiringSoonHtml || '<p class="text-gray-500 text-center p-2">No bookings expiring soon.</p>';
    document.getElementById('overdue-checkout-list').innerHTML = overdueCheckoutHtml || '<p class="text-gray-500 text-center p-2">No overdue check-outs.</p>';
    
    // Render revenue chart
    renderRevenueChart(allBookings);
    
    // Fetch and display total users and capacity
    db.ref('users').once('value', snapshot => document.getElementById('stat-total-users').textContent = snapshot.numChildren());
    db.ref('storageLocations').once('value', snapshot => {
        let total = 0;
        snapshot.forEach(child => total += (Number(child.val().capacity) || 0));
        document.getElementById('stat-total-capacity').textContent = `${total} Units`;
    });
}

function renderRevenueChart(bookings) {
    const ctx = document.getElementById('revenue-chart').getContext('2d');
    const monthlyRevenue = {};
    (bookings || []).forEach(b => {
        if (b.paymentStatus === 'paid' && b.createdAt && typeof b.totalPrice === 'number') {
            const month = new Date(b.createdAt).toLocaleString('default', { month: 'short', year: 'numeric' });
            monthlyRevenue[month] = (monthlyRevenue[month] || 0) + b.totalPrice;
        }
    });
    const labels = Object.keys(monthlyRevenue).sort((a,b) => new Date(a) - new Date(b));
    const data = labels.map(label => monthlyRevenue[label]);

    if (revenueChart) revenueChart.destroy();
    revenueChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Revenue (USD)',
                data,
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 2,
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

function showRevenueDetails() {
    const tableBody = allBookings.filter(b => b.paymentStatus === 'paid').map(b => `
        <tr class="border-b">
            <td class="p-2">${allUsers[b.userId]?.name || 'N/A'}</td>
            <td class="p-2">${b.locationName}</td>
            <td class="p-2">${currencyFormatter.format(b.totalPrice)}</td>
        </tr>
    `).join('');
    Swal.fire({
        title: 'Revenue Details',
        html: `<div class="max-h-96 overflow-y-auto"><table class="w-full text-sm text-left"><thead class="bg-gray-100"><tr><th class="p-2">User</th><th class="p-2">Location</th><th class="p-2">Amount</th></tr></thead><tbody>${tableBody}</tbody></table></div>`,
        width: '600px'
    });
}

function showActiveBookingsDetails() {
    const tableBody = allBookings.filter(b => ['active', 'checked_in'].includes(b.bookingStatus)).map(b => `
        <tr class="border-b">
            <td class="p-2">${allUsers[b.userId]?.name || 'N/A'}</td>
            <td class="p-2">${b.locationName}</td>
            <td class="p-2">${b.endDate ? new Date(b.endDate).toLocaleDateString('en-US') : 'N/A'}</td>
        </tr>
    `).join('');
    Swal.fire({
        title: 'Active Booking Details',
        html: `<div class="max-h-96 overflow-y-auto"><table class="w-full text-sm text-left"><thead class="bg-gray-100"><tr><th class="p-2">User</th><th class="p-2">Location</th><th class="p-2">End Date</th></tr></thead><tbody>${tableBody}</tbody></table></div>`,
        width: '600px'
    });
}

function showCapacityDetails() {
    const tableBody = allLocations.map(loc => `
        <tr class="border-b">
            <td class="p-2">${loc.name}</td>
            <td class="p-2">${loc.capacity} units available</td>
        </tr>
    `).join('');
    Swal.fire({
        title: 'Capacity per Location',
        html: `<div class="max-h-96 overflow-y-auto"><table class="w-full text-sm text-left"><thead class="bg-gray-100"><tr><th class="p-2">Location</th><th class="p-2">Available Capacity</th></tr></thead><tbody>${tableBody}</tbody></table></div>`,
        width: '600px'
    });
}