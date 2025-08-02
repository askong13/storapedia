// admin/js/notifications.js

// Mendeklarasikan objek Audio untuk suara notifikasi admin
// Penting: Pastikan path ini menunjuk ke file suara notifikasi yang valid.
const adminNotificationSound = new Audio('/admin/assets/sounds/notification.wav'); 
let lastAdminUnreadCount = 0; // Variabel untuk melacak jumlah notifikasi admin yang belum dibaca terakhir kali

// Fungsi untuk inisialisasi sistem notifikasi admin
function initNotificationSystem() {
    // Mengambil notifikasi admin dari database, urut terbaru
    const notificationsRef = firebase.database().ref('notifications/admin').orderByChild('timestamp').limitToLast(50);
    const badge = document.getElementById('notification-count'); // Element badge notifikasi
    const popup = document.getElementById('notification-popup'); // Element pop-up notifikasi
    const list = document.getElementById('notification-list');   // Element daftar notifikasi

    if (!badge || !popup || !list) {
        console.warn('Elemen notifikasi tidak ditemukan di DOM.');
        return;
    }

    notificationsRef.on('value', snapshot => {
        const notifications = [];
        snapshot.forEach(childSnapshot => {
            notifications.push({ id: childSnapshot.key, ...childSnapshot.val() });
        });
        notifications.reverse(); // Membalik urutan agar notifikasi terbaru muncul di atas
        updateNotificationUI(notifications, badge, list); // Memperbarui tampilan notifikasi
    });

    // Event: klik tombol lonceng/badge untuk menampilkan/menyembunyikan pop-up notifikasi
    const bellBtn = document.getElementById('notification-button');
    if (bellBtn) {
        bellBtn.onclick = e => {
            e.stopPropagation();
            popup.classList.toggle('hidden');
            if (!popup.classList.contains('hidden')) {
                markVisibleNotificationsAsRead(); // Panggil tanpa parameter
                setTimeout(() => {
                    list.scrollTop = 0;
                }, 100);
            }
        };
    }

    // Event: klik di luar popup untuk menutup
    document.body.addEventListener('click', e => {
        if (!popup.classList.contains('hidden')) {
            if (!popup.contains(e.target) && !bellBtn.contains(e.target)) {
                popup.classList.add('hidden');
            }
        }
    });

    // Event: klik tombol "Mark all as read"
    const markAllBtn = document.getElementById('mark-all-read-btn');
    if (markAllBtn) {
        markAllBtn.onclick = async () => {
            const snapshot = await firebase.database().ref('notifications/admin').orderByChild('read').equalTo(false).once('value');
            const updates = {};
            snapshot.forEach(child => {
                updates[`${child.key}/read`] = true;
            });
            await firebase.database().ref('notifications/admin').update(updates);
            popup.classList.add('hidden');
        };
    }
}

// Fungsi bantu untuk menandai notifikasi yang sedang terlihat sebagai sudah dibaca
async function markVisibleNotificationsAsRead() { 
    const snapshot = await firebase.database().ref('notifications/admin').orderByChild('read').equalTo(false).once('value');
    const updates = {};
    snapshot.forEach(child => {
        if (!child.val().read) {
            updates[`${child.key}/read`] = true;
        }
    });
    if (Object.keys(updates).length > 0) {
        await firebase.database().ref('notifications/admin').update(updates);
    }
}

// Fungsi untuk memperbarui tampilan notifikasi (badge dan daftar)
function updateNotificationUI(notifications, badge, list) {
    if (!list) return;

    if (notifications.length === 0) {
        list.innerHTML = '<p class="text-gray-500 text-sm p-4 text-center">Tidak ada notifikasi.</p>';
    } else {
        list.innerHTML = notifications.map(notification => `
            <div class="notification-item p-2 rounded-md cursor-pointer hover:bg-gray-100 ${!notification.read ? 'bg-blue-50' : ''}"
                 data-notif-id="${notification.id}"
                 data-notif-type="${notification.type || 'general'}"
                 data-booking-id="${notification.bookingId || ''}"
                 data-user-id="${notification.userId || ''}"
                 data-location-id="${notification.locationId || ''}"
                 data-review-id="${notification.reviewId || ''}">
                <p class="font-bold text-sm">${notification.title || ''}</p>
                <p class="text-xs text-gray-600">${notification.body || notification.message || ''}</p>
                <p class="text-right text-xs text-gray-400 mt-1">${notification.timestamp ? new Date(notification.timestamp).toLocaleString() : ''}</p>
            </div>
        `).join('');

        list.querySelectorAll('.notification-item').forEach(item => {
            item.onclick = async (e) => {
                const notifId = item.getAttribute('data-notif-id');
                const notifType = item.getAttribute('data-notif-type');
                const bookingId = item.getAttribute('data-booking-id');
                const userId = item.getAttribute('data-user-id');
                const locationId = item.getAttribute('data-location-id');
                const reviewId = item.getAttribute('data-review-id');

                // Tandai notifikasi sebagai sudah dibaca
                if (item.classList.contains('bg-blue-50')) {
                    await firebase.database().ref('notifications/admin/' + notifId).update({ read: true });
                    item.classList.remove('bg-blue-50');
                }

                // Lakukan aksi berdasarkan tipe notifikasi
                switch (notifType) {
                    case 'booking': // Tipe booking yang sudah ada (misal: new order)
                    case 'booking_new': // Explicitly new booking
                    case 'booking_check_in':
                    case 'booking_check_out':
                    case 'booking_extend':
                        if (typeof viewBookingDetails === 'function' && bookingId) {
                            viewBookingDetails(bookingId);
                        } else {
                            console.warn('Fungsi viewBookingDetails tidak ditemukan atau bookingId kosong.', { notifId, notifType, bookingId });
                            Swal.fire('Detail Notifikasi', `Informasi terkait booking (${notifType}): ID Booking ${bookingId}`, 'info');
                        }
                        break;
                    case 'chat':
                        if (typeof openDirectMessageModal === 'function' && userId) {
                            openDirectMessageModal(userId);
                        } else {
                            console.warn('Fungsi openDirectMessageModal tidak ditemukan atau userId kosong.', { notifId, notifType, userId });
                            Swal.fire('Detail Notifikasi', `Pesan baru dari pengguna: ${userId}`, 'info');
                        }
                        break;
                    case 'review': // Tipe review yang sudah ada
                    case 'review_new': // Explicitly new review
                        if (typeof handleReviewReply === 'function' && reviewId && locationId && userId) {
                             handleReviewReply(e, locationId, reviewId, userId); 
                        } else if (typeof renderReviews === 'function') {
                            renderReviews(); 
                            Swal.fire('Detail Notifikasi', `Review baru: ${reviewId}`, 'info');
                        } else {
                            console.warn('Fungsi handleReviewReply atau renderReviews tidak ditemukan.', { notifId, notifType, reviewId, locationId, userId });
                            Swal.fire('Detail Notifikasi', `Review baru untuk lokasi: ${locationId}`, 'info');
                        }
                        break;
                    case 'general':
                    default:
                        Swal.fire('Detail Notifikasi', `Notifikasi umum: ${notification.title || ''}`, 'info');
                        break;
                }
            };
        });
    }

    // Hitung jumlah notifikasi yang belum dibaca
    const currentUnreadCount = notifications.filter(n => !n.read).length;

    // Memutar suara notifikasi jika ada notifikasi baru yang belum dibaca
    // dan pengguna telah berinteraksi dengan halaman (untuk melewati batasan autoplay browser)
    // Asumsi 'window.hasInteracted' adalah variabel global yang diatur oleh body click listener di admin/js/main.js
    if (currentUnreadCount > lastAdminUnreadCount && window.hasInteracted) {
        adminNotificationSound.play().catch(e => console.warn("Suara notifikasi admin gagal diputar:", e));
    }
    lastAdminUnreadCount = currentUnreadCount;

    // Perbarui tampilan badge notifikasi
    if (currentUnreadCount > 0) {
        badge.textContent = currentUnreadCount;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
}

// Jalankan inisialisasi sistem notifikasi admin saat dokumen selesai dimuat
document.addEventListener('DOMContentLoaded', initNotificationSystem);

// Membuat fungsi-fungsi ini tersedia secara global agar bisa dipanggil dari notification.js
window.handleReviewReply = window.handleReviewReply || async function(e, locationId, reviewId, userId) {
    console.warn("handleReviewReply (placeholder) dipanggil.");
    // Logika default atau placeholder
    Swal.fire('Review', `Review ID: ${reviewId}, User ID: ${userId}`, 'info');
};

window.viewBookingDetails = window.viewBookingDetails || async function(bookingId) {
    console.warn("viewBookingDetails (placeholder) dipanggil.");
    // Logika default atau placeholder
    Swal.fire('Detail Booking', `Booking ID: ${bookingId}`, 'info');
};

window.openDirectMessageModal = window.openDirectMessageModal || function(userId) {
    console.warn("openDirectMessageModal (placeholder) dipanggil.");
    // Logika default atau placeholder
    Swal.fire('Pesan Langsung', `User ID: ${userId}`, 'info');
};

// Tambahkan placeholder untuk renderReviews jika tidak ada di reviews.js
window.renderReviews = window.renderReviews || function() {
    console.warn("renderReviews (placeholder) dipanggil.");
    // Logika default atau placeholder untuk me-render ulang daftar review
    Swal.fire('Review List', 'Daftar review sedang dimuat ulang.', 'info');
};