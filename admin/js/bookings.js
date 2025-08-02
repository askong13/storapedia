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
// BOOKINGS LOGIC
// =====================================================================
function renderBookingsTable() {
    const tbody = document.getElementById('bookings-table-body');
    const cardView = document.getElementById('bookings-card-view');
    const searchTerm = document.getElementById('booking-search').value.toLowerCase();
    const statusFilter = document.getElementById('booking-status-filter').value;
    const locationFilter = document.getElementById('booking-location-filter').value;
    
    // Clear both table and card views before re-rendering
    tbody.innerHTML = '';
    cardView.innerHTML = '';

    // Log current filter values for debugging
    console.log('Bookings Table Filters: Search:', searchTerm, 'Status:', statusFilter, 'Location:', locationFilter);
    console.log('Current allBookings data:', allBookings);
    console.log('Current allUsers data:', allUsers);

    const filtered = (allBookings || []).filter(b => {
        // Skip invalid booking objects
        if (!b || !b.id) {
            console.warn('Skipping invalid booking object:', b);
            return false;
        }

        const user = allUsers[b.userId];
        // Handle cases where user data might be missing (e.g., user deleted)
        const userName = user?.name || '';
        const userEmail = user?.email || '';
        
        const searchCorpus = `${userName} ${userEmail} ${b.id} ${b.locationName || ''} ${b.storageType || ''}`.toLowerCase();
        
        const matchesSearch = !searchTerm || searchCorpus.includes(searchTerm);
        const matchesStatus = !statusFilter || b.bookingStatus === statusFilter;
        const matchesLocation = !locationFilter || b.locationId === locationFilter;
        
        // Log individual booking filter results for debugging
        // console.log(`Booking ${b.id}: Search (${matchesSearch}), Status (${matchesStatus}), Location (${matchesLocation}) - Result: ${matchesSearch && matchesStatus && matchesLocation}`);

        return matchesSearch && matchesStatus && matchesLocation;
    });

    console.log('Filtered bookings to display:', filtered);

    if (filtered.length === 0) {
        const noResultsHtml = `<tr><td colspan="5" class="text-center p-8 text-gray-500">No bookings found matching your criteria.</td></tr>`;
        tbody.innerHTML = noResultsHtml;
        cardView.innerHTML = `<p class="text-center text-gray-500 p-4">No bookings found matching your criteria.</p>`;
        return;
    }

    filtered.forEach(b => {
        const user = allUsers[b.userId];
        const userNameDisplay = user?.name || `<span class="text-red-500">Unknown User</span>`;
        const userEmailDisplay = user?.email || `<span class="text-red-500">ID: ${b.userId}</span>`;
        const startDate = b.startDate ? new Date(b.startDate).toLocaleDateString('en-US') : 'N/A';
        const endDate = b.endDate ? new Date(b.endDate).toLocaleDateString('en-US') : 'N/A';
        
        let statusClass = 'bg-gray-100 text-gray-800';
        if (b.bookingStatus === 'active') statusClass = 'bg-blue-100 text-blue-800';
        if (b.bookingStatus === 'checked_in') statusClass = 'bg-green-100 text-green-800';
        if (b.bookingStatus === 'completed') statusClass = 'bg-purple-100 text-purple-800';
        if (b.bookingStatus === 'cancelled') statusClass = 'bg-red-100 text-red-800';

        // Table Row for Desktop
        const row = document.createElement('tr');
        row.className = 'bg-white border-b hover:bg-gray-50';
        row.innerHTML = `
            <td class="px-6 py-4">
                <div class="font-semibold">${userNameDisplay}</div>
                <div class="text-gray-500 text-xs">${userEmailDisplay}</div>
            </td>
            <td class="px-6 py-4">
                <div class="font-semibold">${b.locationName || 'N/A'} (${b.storageType || 'N/A'})</div>
                <div class="text-gray-500 text-xs">ID: ${b.id}</div>
            </td>
            <td class="px-6 py-4">${startDate} - ${endDate}</td>
            <td class="px-6 py-4"><span class="px-2 py-1 font-semibold leading-tight rounded-full text-xs capitalize ${statusClass}">${(b.bookingStatus || 'unknown').replace(/_/g, ' ')}</span></td>
            <td class="px-6 py-4 space-x-2">
                <button class="text-blue-600 hover:text-blue-900" title="View Details" onclick="viewBookingDetails('${b.id}')"><i class="fas fa-eye"></i></button>
                <button class="text-primary-600 hover:text-primary-800" title="Edit Booking" onclick="openEditBookingModal('${b.id}')"><i class="fas fa-edit"></i></button>
                ${b.bookingStatus === 'active' ? `<button class="text-green-600 hover:text-green-900" title="Check In" onclick="handleCheckIn('${b.id}')"><i class="fas fa-sign-in-alt"></i></button>` : ''}
                ${b.bookingStatus === 'checked_in' ? `<button class="text-red-600 hover:text-red-900" title="Check Out" onclick="handleCheckOut('${b.id}', '${b.locationId}')"><i class="fas fa-sign-out-alt"></i></button>` : ''}
            </td>
        `;
        tbody.appendChild(row);

        // Card View for Mobile
        const card = document.createElement('div');
        card.className = 'data-card';
        card.innerHTML = `
            <div class="card-row">
                <span class="card-label">User:</span>
                <span class="card-value">${userNameDisplay}</span>
            </div>
            <div class="card-row">
                <span class="card-label">Booking ID:</span>
                <span class="card-value">${b.id}</span>
            </div>
            <div class="card-row">
                <span class="card-label">Location:</span>
                <span class="card-value">${b.locationName || 'N/A'}</span>
            </div>
            <div class="card-row">
                <span class="card-label">Storage Type:</span>
                <span class="card-value">${b.storageType || 'N/A'}</span>
            </div>
            <div class="card-row">
                <span class="card-label">Dates:</span>
                <span class="card-value">${startDate} - ${endDate}</span>
            </div>
            <div class="card-row">
                <span class="card-label">Status:</span>
                <span class="card-value"><span class="px-2 py-1 font-semibold leading-tight rounded-full text-xs capitalize ${statusClass}">${(b.bookingStatus || 'unknown').replace(/_/g, ' ')}</span></span>
            </div>
            <div class="card-actions">
                <button class="text-blue-600 hover:text-blue-900" onclick="viewBookingDetails('${b.id}')"><i class="fas fa-eye"></i> View</button>
                <button class="text-primary-600 hover:text-primary-800" onclick="openEditBookingModal('${b.id}')"><i class="fas fa-edit"></i> Edit</button>
                ${b.bookingStatus === 'active' ? `<button class="text-green-600 hover:text-green-900" onclick="handleCheckIn('${b.id}')"><i class="fas fa-sign-in-alt"></i> Check In</button>` : ''}
                ${b.bookingStatus === 'checked_in' ? `<button class="text-red-600 hover:text-red-900" onclick="handleCheckOut('${b.id}', '${b.locationId}')"><i class="fas fa-sign-out-alt"></i> Check Out</button>` : ''}
            </div>
        `;
        cardView.appendChild(card);
    });
}

async function viewBookingDetails(bookingId) {
    const booking = allBookings.find(b => b.id === bookingId);
    if (!booking) return Swal.fire('Error', 'Booking not found.', 'error');
    const user = allUsers[booking.userId];
    const sealPhotoHtml = booking.sealPhotoUrl ? `<img src="${booking.sealPhotoUrl}" class="w-full h-auto max-w-sm mx-auto rounded-lg shadow-md border my-4">` : '<p class="text-center text-gray-500 bg-gray-100 p-4 rounded-lg my-4">No seal photo uploaded.</p>';
    
    Swal.fire({
        title: 'Booking Details',
        html: `
            <div class="text-left space-y-4">
                <div>
                    <h3 class="font-bold text-lg">${user?.name || 'Unknown User'}</h3>
                    <p class="text-sm text-gray-500">${user?.email || 'N/A'} | ${user?.phone || 'N/A'}</p>
                </div>
                <div class="border-t pt-4">
                    <p><strong class="w-32 inline-block">Booking ID:</strong> ${booking.id}</p>
                    <p><strong class="w-32 inline-block">Location:</strong> ${booking.locationName || 'N/A'}</p>
                    <p><strong class="w-32 inline-block">Unit Type:</strong> ${booking.storageType || 'N/A'}</p>
                    <p><strong class="w-32 inline-block">Period:</strong> ${booking.startDate ? new Date(booking.startDate).toLocaleDateString('en-US') : 'N/A'} - ${booking.endDate ? new Date(booking.endDate).toLocaleDateString('en-US') : 'N/A'}</p>
                    <p><strong class="w-32 inline-block">Total Price:</strong> ${currencyFormatter.format(booking.totalPrice || 0)}</p>
                    <p><strong class="w-32 inline-block">Payment Method:</strong> ${booking.paymentMethod?.replace(/_/g, ' ') || 'N/A'}</p>
                    <p><strong class="w-32 inline-block">Payment Status:</strong> ${booking.paymentStatus?.replace(/_/g, ' ') || 'N/A'}</p>
                    <p><strong class="w-32 inline-block">Service Type:</strong> ${booking.serviceType?.replace(/_/g, ' ') || 'N/A'}</p>
                </div>
                <div class="border-t pt-4">
                    <h4 class="font-semibold mb-2">Seal Details:</h4>
                    <p><strong class="w-32 inline-block">Seal Number:</strong> ${booking.sealNumber || 'Not set'}</p>
                    <div class="mt-2">
                        <h5 class="font-medium text-sm">Seal Photo:</h5>
                        ${sealPhotoHtml}
                    </div>
                </div>
            </div>
        `,
        width: '600px',
        showCloseButton: true,
        showConfirmButton: false
    });
}

function handleCheckIn(bookingId) {
    Swal.fire({
        title: 'Confirm Check-In?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#2563eb',
        confirmButtonText: 'Yes, Check In'
    }).then(result => {
        if (result.isConfirmed) {
            db.ref(`bookings/${bookingId}`).update({ bookingStatus: 'checked_in', checkInTime: firebase.database.ServerValue.TIMESTAMP })
                .then(() => Swal.fire('Success', 'Booking has been checked-in.', 'success'))
                .catch(err => Swal.fire('Error', err.message, 'error'));
        }
    });
}

function handleCheckOut(bookingId, locationId) {
    Swal.fire({
        title: 'Confirm Check-Out?',
        text: "This will free up the unit.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        confirmButtonText: 'Yes, Check Out'
    }).then(result => {
        if (result.isConfirmed) {
            db.ref(`bookings/${bookingId}`).update({ bookingStatus: 'completed', checkOutTime: firebase.database.ServerValue.TIMESTAMP })
                .then(() => {
                    // Only increase capacity if it's a valid locationId and we have capacity data
                    if(locationId && allLocations.find(loc => loc.id === locationId)) {
                        db.ref(`storageLocations/${locationId}/capacity`).transaction(currentCapacity => {
                            return (currentCapacity || 0) + 1; // Increment capacity
                        });
                    }
                    Swal.fire('Success', 'Booking has been checked-out.', 'success');
                })
                .catch(err => Swal.fire('Error', err.message, 'error'));
        }
    });
}

async function openEditBookingModal(bookingId) {
    const booking = allBookings.find(b => b.id === bookingId);
    if (!booking) {
        return Swal.fire('Error', 'Booking not found.', 'error');
    }
    const user = allUsers[booking.userId];

    const modal = document.getElementById('edit-booking-modal');
    modal.classList.remove('hidden');

    // Populate form fields
    document.getElementById('edit-booking-id').value = booking.id;
    document.getElementById('edit-booking-user-name').value = user?.name || 'N/A';
    document.getElementById('edit-booking-location-name').value = booking.locationName || 'N/A';
    document.getElementById('edit-booking-storage-type').value = booking.storageType || 'N/A';
    document.getElementById('edit-booking-start-date').value = booking.startDate ? new Date(booking.startDate).toISOString().split('T')[0] : '';
    document.getElementById('edit-booking-end-date').value = booking.endDate ? new Date(booking.endDate).toISOString().split('T')[0] : '';
    document.getElementById('edit-booking-total-price').value = booking.totalPrice || 0;
    document.getElementById('edit-booking-payment-status').value = booking.paymentStatus || 'unpaid_on_site';
    document.getElementById('edit-booking-status').value = booking.bookingStatus || 'active';
    document.getElementById('edit-booking-seal-number').value = booking.sealNumber || '';

    const sealPhotoPreviewImg = document.getElementById('seal-photo-preview-img');
    const sealPhotoPreviewIcon = document.getElementById('seal-photo-preview-icon');
    const removeSealPhotoBtn = document.getElementById('remove-seal-photo-btn');
    const uploadSealPhotoBtn = document.getElementById('upload-seal-photo-btn');
    const sealPhotoInput = document.getElementById('edit-booking-seal-photo-input');

    // Initialize temporary URL holder for the new image upload
    sealPhotoPreviewImg.dataset.uploadedUrl = booking.sealPhotoUrl || ''; 

    const updateSealPhotoDisplay = (url) => {
        if (url) {
            sealPhotoPreviewImg.src = url;
            sealPhotoPreviewImg.classList.remove('hidden');
            sealPhotoPreviewIcon.classList.add('hidden');
            removeSealPhotoBtn.classList.remove('hidden');
            uploadSealPhotoBtn.textContent = 'Change Photo'; // Change button text
        } else {
            sealPhotoPreviewImg.classList.add('hidden');
            sealPhotoPreviewIcon.classList.remove('hidden');
            removeSealPhotoBtn.classList.add('hidden');
            sealPhotoPreviewImg.src = '';
            uploadSealPhotoBtn.textContent = 'Upload Photo'; // Reset button text
        }
    };

    updateSealPhotoDisplay(booking.sealPhotoUrl); // Set initial display

    // Trigger file input click (which can open camera on mobile)
    uploadSealPhotoBtn.onclick = () => sealPhotoInput.click(); 

    // Handle file selection (from camera or gallery)
    sealPhotoInput.onchange = async (event) => {
        const file = event.target.files[0];
        if (file) {
            Swal.fire({
                title: 'Uploading image...',
                allowOutsideClick: false,
                didOpen: () => { Swal.showLoading(); }
            });
            try {
                // Ensure unique file path to avoid conflicts
                const filePath = `seal_photos/${bookingId}-${Date.now()}-${file.name}`;
                const snapshot = await storage.ref(filePath).put(file);
                const downloadURL = await snapshot.ref.getDownloadURL();
                
                // Update display and temporary URL
                updateSealPhotoDisplay(downloadURL);
                sealPhotoPreviewImg.dataset.uploadedUrl = downloadURL; 
                
                Swal.close();
                Swal.fire('Success', 'Image uploaded successfully!', 'success');
            } catch (error) {
                console.error("Seal photo upload failed:", error);
                Swal.fire('Upload Failed', error.message, 'error');
            }
        }
        // Clear the input to allow re-selection of the same file if needed
        sealPhotoInput.value = '';
    };

    // Handle photo removal
    removeSealPhotoBtn.onclick = () => {
        updateSealPhotoDisplay(''); // Clear display
        sealPhotoPreviewImg.dataset.uploadedUrl = ''; // Clear stored URL
    };

    // Handle form submission
    document.getElementById('edit-booking-form').onsubmit = async (e) => {
        e.preventDefault();
        Swal.fire({
            title: 'Saving changes...',
            allowOutsideClick: false,
            didOpen: () => { Swal.showLoading(); }
        });

        const updatedBookingData = {
            startDate: new Date(document.getElementById('edit-booking-start-date').value).getTime(),
            endDate: new Date(document.getElementById('edit-booking-end-date').value).getTime(),
            totalPrice: parseFloat(document.getElementById('edit-booking-total-price').value),
            paymentStatus: document.getElementById('edit-booking-payment-status').value,
            bookingStatus: document.getElementById('edit-booking-status').value,
            sealNumber: document.getElementById('edit-booking-seal-number').value,
            // Use the URL from dataset.uploadedUrl which holds the latest value (original or newly uploaded)
            sealPhotoUrl: sealPhotoPreviewImg.dataset.uploadedUrl || '' 
        };

        try {
            await db.ref(`bookings/${bookingId}`).update(updatedBookingData);
            Swal.fire('Success', 'Booking updated successfully!', 'success');
            modal.classList.add('hidden');
        } catch (error) {
            console.error("Booking update failed:", error);
            Swal.fire('Error', error.message, 'error');
        }
    };
}