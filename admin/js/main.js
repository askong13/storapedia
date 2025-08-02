let allBookings = [];
let allUsers = {};
let allLocations = [];
let allVouchers = [];
let allConversations = [];
let allFaqs = [];
let allReviews = [];
let allTestimonials = [];

let revenueChart = null;
let html5QrCode = null;
let locationMap, locationMarker, locationAutocomplete;
let currentChatUserId = null;
let conversationListeners = {};
let lastKnownUnreadCount = 0;
let hasInteracted = false;

const notificationSound = new Audio('/admin/assets/sounds/notification.wav'); 

const currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });

const faIcons = ["fas fa-shield-alt", "fas fa-video", "fas fa-fire-extinguisher", "fas fa-key", "fas fa-snowflake", "fas fa-box-open", "fas fa-car", "fas fa-motorcycle", "fas fa-wifi", "fas fa-plug", "fas fa-user-shield", "fas fa-clock", "fas fa-thermometer-half", "fas fa-wind", "fas fa-lightbulb", "fas fa-lock", "fas fa-water", "fas fa-person-shelter", "fas fa-truck-moving", "fas fa-temperature-high"];

const firebaseConfig = {
    apiKey: typeof STORAPEDIA_API_KEY !== 'undefined' ? STORAPEDIA_API_KEY : "YOUR_FIREBASE_API_KEY",
    authDomain: typeof STORAPEDIA_AUTH_DOMAIN !== 'undefined' ? STORAPEDIA_AUTH_DOMAIN : "YOUR_FIREBASE_AUTH_DOMAIN",
    projectId: typeof STORAPEDIA_PROJECT_ID !== 'undefined' ? STORAPEDIA_PROJECT_ID : "storapedia",
    storageBucket: typeof STORAPEDIA_STORAGE_BUCKET !== 'undefined' ? STORAPEDIA_STORAGE_BUCKET : "storapedia.appspot.com",
    messagingSenderId: typeof STORAPEDIA_MESSAGING_SENDER_ID !== 'undefined' ? STORAPEDIA_MESSAGING_SENDER_ID : "145464021088",
    appId: typeof STORAPEDIA_APP_ID !== 'undefined' ? STORAPEDIA_APP_ID : "1:145464021088:web:1e24a2847994ac5003f305",
    databaseURL: typeof STORAPEDIA_DATABASE_URL !== 'undefined' ? STORAPEDIA_DATABASE_URL : "https://storapedia-default-rtdb.firebaseio.com/"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();
const storage = firebase.storage();

window.initAdminMap = function() {
};

function loadGoogleMapsScript() {
    if (typeof Maps_API_KEY === 'undefined' || Maps_API_KEY === '') {
        console.error('Google Maps API Key tidak ditemukan. Pastikan variabel lingkungan Maps_API_KEY diatur.');
        return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${Maps_API_KEY}&libraries=places,geometry&callback=initAdminMap`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
}

document.addEventListener('DOMContentLoaded', () => {
    document.body.addEventListener('click', () => { hasInteracted = true; }, { once: true });
    
    document.getElementById('login-form').addEventListener('submit', handleAdminLogin);
    document.getElementById('admin-logout-btn').addEventListener('click', handleAdminLogout);
    
    auth.onAuthStateChanged(user => {
        if (user) { 
            const isAdmin = user.email.endsWith('@storapedia.com') || user.email === 'admin@storapedia.com' || user.email === 'jamal.rc2@gmail.com';
            if (isAdmin) {
                document.getElementById('login-screen').classList.add('hidden');
                document.getElementById('admin-layout').classList.remove('hidden');
                document.getElementById('admin-user-info').innerHTML = `<p class="font-semibold">${user.email}</p>`;
                initializeApp();
            } else {
                document.getElementById('login-screen').classList.remove('hidden');
                document.getElementById('admin-layout').classList.add('hidden');
                auth.signOut();
            }
        } else {
            document.getElementById('login-screen').classList.remove('hidden');
            document.getElementById('admin-layout').classList.add('hidden');
        }
    });

    document.getElementById('mobile-menu-btn').addEventListener('click', () => {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.toggle('hidden');
        sidebar.classList.toggle('active');
    });

    loadGoogleMapsScript();
});

async function initializeApp() {
    setupEventListeners();
    
    await db.ref('users').once('value', snapshot => {
        allUsers = snapshot.val() || {};
    });

    attachDataListeners();
    
    showPage('dashboard');
}

function attachDataListeners() {
    db.ref('users').on('value', snapshot => {
        allUsers = snapshot.val() || {};
        renderUsersTable(Object.values(allUsers).map((user, i) => ({...user, id: Object.keys(allUsers)[i]})));
        if (document.getElementById('page-bookings').classList.contains('active')) renderBookingsTable();
        if (document.getElementById('page-inbox').classList.contains('active')) renderConversationsList();
        if (document.getElementById('page-reviews').classList.contains('active')) window.renderReviews();
    }, (error) => {
        console.error("Error fetching users:", error);
    });
    
    db.ref('bookings').on('value', snapshot => {
        allBookings = [];
        snapshot.forEach(child => { allBookings.push({ id: child.key, ...child.val() }); });
        allBookings.sort((a,b) => (b.createdAt || 0) - (a.createdAt || 0));
        if (document.getElementById('page-bookings').classList.contains('active')) renderBookingsTable();
        fetchAndRenderDashboard();
    }, (error) => {
        console.error("Error fetching bookings:", error);
    });
    
    db.ref('faqs').on('value', snapshot => {
        allFaqs = [];
        snapshot.forEach(child => { allFaqs.push({ id: child.key, ...child.val() }); });
        if (document.getElementById('page-faqs').classList.contains('active')) renderFaqsTable(allFaqs);
    }, (error) => {
        console.error("Error fetching FAQs:", error);
    });
    
    db.ref('chats').on('value', snapshot => {
        if (document.getElementById('page-inbox').classList.contains('active')) fetchAndRenderConversations(true);
    }, (error) => {
        console.error("Error fetching chats:", error);
    });
    
    db.ref('storageLocations').on('value', snapshot => {
        allLocations = [];
        const locFilter = document.getElementById('booking-location-filter');
        locFilter.innerHTML = '<option value="">All Locations</option>'; 
        snapshot.forEach(child => {
            const loc = { id: child.key, ...child.val() };
            allLocations.push(loc);
            const opt = document.createElement('option');
            opt.value = loc.id;
            opt.textContent = loc.name;
            locFilter.appendChild(opt);
        });
        if (document.getElementById('page-locations').classList.contains('active')) renderLocationsTable(allLocations);
        if (document.getElementById('page-bookings').classList.contains('active')) renderBookingsTable();
        if (document.getElementById('page-reviews').classList.contains('active')) window.renderReviews();
    }, (error) => {
        console.error("Error fetching storageLocations:", error);
    });

    db.ref('vouchers').on('value', snapshot => {
        allVouchers = [];
        snapshot.forEach(child => allVouchers.push({id: child.key, ...child.val()}));
        if (document.getElementById('page-vouchers').classList.contains('active')) renderVouchersTable(allVouchers);
    }, (error) => {
        console.error("Error fetching vouchers:", error);
    });

    db.ref('testimonials').on('value', snapshot => {
        allTestimonials = [];
        snapshot.forEach(child => allTestimonials.push({id: child.key, ...child.val()}));
        if (document.getElementById('page-reviews').classList.contains('active')) window.renderTestimonials();
    }, (error) => {
        console.error("Error fetching testimonials:", error);
    });

    db.ref('reviews').on('value', snapshot => {
        allReviews = [];
        snapshot.forEach(locationSnapshot => { 
            const locationId = locationSnapshot.key;
            locationSnapshot.forEach(reviewSnapshot => { 
                allReviews.push({
                    id: reviewSnapshot.key,
                    locationId: locationId,
                    ...reviewSnapshot.val()
                });
            });
        });
        if (document.getElementById('page-reviews').classList.contains('active')) window.renderReviews();
    }, (error) => {
        console.error("Error fetching reviews:", error);
    });
}

function setupEventListeners() {
    document.querySelectorAll('.sidebar-link').forEach(link => link.addEventListener('click', e => {
        e.preventDefault();
        showPage(e.currentTarget.dataset.page);
        if (window.innerWidth < 768) {
            const sidebar = document.getElementById('sidebar');
            sidebar.classList.add('hidden');
            sidebar.classList.remove('active');
        }
    }));
    
    document.getElementById('booking-search').addEventListener('input', renderBookingsTable);
    document.getElementById('booking-status-filter').addEventListener('change', renderBookingsTable);
    document.getElementById('booking-location-filter').addEventListener('change', renderBookingsTable);
    document.getElementById('user-search').addEventListener('input', () => renderUsersTable(Object.values(allUsers).map((user, i) => ({...user, id: Object.keys(allUsers)[i]}))));
    document.getElementById('conversation-search').addEventListener('input', renderConversationsList);
    document.querySelectorAll('.inbox-filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.inbox-filter-btn').forEach(b => {
                b.classList.remove('bg-primary-600', 'text-white');
                b.classList.add('bg-gray-200', 'text-gray-700');
            });
            e.currentTarget.classList.add('bg-primary-600', 'text-white');
            e.currentTarget.classList.remove('bg-gray-200', 'text-gray-700');
            renderConversationsList();
        });
    });

    document.getElementById('scan-qr-btn').addEventListener('click', startQrScanner);
    document.getElementById('add-location-btn').addEventListener('click', () => openLocationModal());
    document.getElementById('add-faq-btn').addEventListener('click', () => openFaqModal());
    document.getElementById('add-voucher-btn').addEventListener('click', () => openVoucherModal());
    document.getElementById('new-message-btn').addEventListener('click', openNewMessageModal);
    document.getElementById('broadcast-message-btn').addEventListener('click', openBroadcastModal);
    document.getElementById('chat-form').addEventListener('submit', handleSendMessage);
    document.getElementById('website-settings-form').addEventListener('submit', handleWebsiteSettingsSubmit);

    document.getElementById('close-qr-scanner-btn').addEventListener('click', () => {
        document.getElementById('qr-scanner-modal').classList.add('hidden');
        if (html5QrCode && html5QrCode.isScanning) html5QrCode.stop();
    });
    document.getElementById('close-edit-booking-modal').addEventListener('click', () => {
        document.getElementById('edit-booking-modal').classList.add('hidden');
    });
}

function showPage(pageId) {
    if (!pageId) {
        return;
    }

    document.querySelectorAll('.admin-page').forEach(p => p.classList.remove('active'));
    document.getElementById(`page-${pageId}`).classList.add('active');
    
    document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
    const activeLink = document.querySelector(`.sidebar-link[data-page="${pageId}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
    
    const title = pageId.charAt(0).toUpperCase() + pageId.slice(1);
    document.getElementById('page-title').textContent = title === 'Faqs' ? 'FAQs' : title;
    
    switch(pageId) {
        case 'dashboard': fetchAndRenderDashboard(); break;
        case 'bookings': renderBookingsTable(); break;
        case 'users': renderUsersTable(Object.values(allUsers).map((user, i) => ({...user, id: Object.keys(allUsers)[i]}))); break;
        case 'inbox': fetchAndRenderConversations(true); break; 
        case 'locations': renderLocationsTable(allLocations); break;
        case 'vouchers': renderVouchersTable(allVouchers); break;
        case 'reviews': 
            window.renderReviews(); 
            window.renderTestimonials(); 
            break;
        case 'faqs': renderFaqsTable(allFaqs); break;
        case 'settings': fetchAndRenderSettings(); break;
    }
}

function deleteItem(path, id, itemName) {
    Swal.fire({
        title: `Delete this ${itemName}?`,
        text: "This action cannot be undone.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        confirmButtonText: 'Yes, delete it!'
    }).then(result => {
        if (result.isConfirmed) {
            db.ref(`${path}/${id}`).remove()
                .then(() => Swal.fire('Deleted!', `${itemName} has been deleted.`, 'success'))
                .catch(err => Swal.fire('Error', err.message, 'error'));
        }
    });
}

function generateStarsHtml(rating) {
    const roundedRating = Math.round(rating);
    let starsHtml = '';
    for (let i = 1; i <= 5; i++) {
        starsHtml += `<i class="fa-solid fa-star ${i <= roundedRating ? 'text-yellow-500' : 'text-gray-300'}"></i>`;
    }
    return starsHtml;
}

function startQrScanner() {
    if(html5QrCode && html5QrCode.isScanning) { html5QrCode.stop(); }
    document.getElementById('qr-scanner-modal').classList.remove('hidden');
    
    html5QrCode = new Html5Qrcode("qr-reader");
    const successCb = (decodedText, decodedResult) => {
        document.getElementById('qr-scanner-modal').classList.add('hidden');
        if (html5QrCode && html5QrCode.isScanning) html5QrCode.stop();
        const booking = allBookings.find(b => b.id === decodedText);
        if(booking) {
            if (booking.bookingStatus === 'active') {
                handleCheckIn(decodedText);
            } else {
                Swal.fire('Info', `Booking status is ${booking.bookingStatus}.`, 'info');
            }
        } else {
            Swal.fire('Error', `Booking ID ${decodedText} not found.`, 'error');
        }
    };
    html5QrCode.start({ facingMode: "environment" }, { fps: 10, qrbox: { width: 250, height: 250 } }, successCb).catch(err => {
        Swal.fire('Camera Error', 'Could not start camera. Please ensure camera permissions are granted and no other app is using it.', 'error');
    });
}

function followUpOverdue(bookingId) {
    const booking = allBookings.find(b => b.id === bookingId);
    const user = allUsers[booking.userId];
    if (!booking || !user || !user.phone) {
        return Swal.fire('Error', 'User data or phone number not found for this booking.', 'error');
    }
    
    const template = "Hello {userName}, your storage for {storageType} at {locationName} is overdue. Please check out soon or contact us for extension.";
    const message = template.replace(/{userName}/g, user.name).replace(/{locationName}/g, booking.locationName).replace(/{storageType}/g, (booking.storageType || 'storage unit'));
    const sanitizedPhone = user.phone.replace(/[^0-9]/g, '');
    const waLink = `https://wa.me/${sanitizedPhone}?text=${encodeURIComponent(message)}`;
    window.open(waLink, '_blank');
}