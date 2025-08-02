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
};// LOCATIONS LOGIC
// =====================================================================
function fetchAndRenderLocations() {
    allLocations = [];
    const locFilter = document.getElementById('booking-location-filter');
    locFilter.innerHTML = '<option value="">All Locations</option>';

    db.ref('storageLocations').once('value', snapshot => {
        snapshot.forEach(child => {
            const loc = { id: child.key, ...child.val() };
            allLocations.push(loc);
            const opt = document.createElement('option');
            opt.value = loc.id;
            opt.textContent = loc.name;
            locFilter.appendChild(opt);
        });
        renderLocationsTable(allLocations);
    });
}

function renderLocationsTable(locations) {
    const tbody = document.getElementById('locations-table-body');
    const cardView = document.getElementById('locations-card-view');
    
    tbody.innerHTML = '';
    cardView.innerHTML = '';

    if (!locations || locations.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center p-8">No locations found.</td></tr>`;
        cardView.innerHTML = `<p class="text-center text-gray-500 p-4">No locations found.</p>`;
        return;
    }

    locations.forEach(loc => {
        const row = document.createElement('tr');
        row.className = 'bg-white border-b hover:bg-gray-50';
        row.innerHTML = `
            <td class="px-6 py-4 font-semibold">${loc.name || 'N/A'}</td>
            <td class="px-6 py-4 text-xs">${loc.address || 'N/A'}</td>
            <td class="px-6 py-4">${typeof loc.capacity === 'number' ? loc.capacity + ' units' : 'N/A'}</td>
            <td class="px-6 py-4 space-x-3">
                <button class="text-gray-500 hover:text-green-600" title="Edit Location" onclick="openLocationModal('${loc.id}')"><i class="fas fa-edit"></i></button>
                <button class="text-gray-500 hover:text-red-600" title="Delete Location" onclick="deleteItem('storageLocations', '${loc.id}', 'location')"><i class="fas fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(row);

        const card = document.createElement('div');
        card.className = 'data-card md:hidden';
        card.innerHTML = `
            <div class="card-row">
                <span class="card-label">Name:</span>
                <span class="card-value font-semibold">${loc.name || 'N/A'}</span>
            </div>
            <div class="card-row">
                <span class="card-label">Address:</span>
                <span class="card-value text-xs">${loc.address || 'N/A'}</span>
            </div>
            <div class="card-row">
                <span class="card-label">Capacity:</span>
                <span class="card-value">${typeof loc.capacity === 'number' ? loc.capacity + ' units' : 'N/A'}</span>
            </div>
            <div class="card-actions">
                <button class="text-gray-500 hover:text-green-600" onclick="openLocationModal('${loc.id}')"><i class="fas fa-edit"></i> Edit</button>
                <button class="text-gray-500 hover:text-red-600" onclick="deleteItem('storageLocations', '${loc.id}', 'location')"><i class="fas fa-trash"></i> Delete</button>
            </div>
        `;
        cardView.appendChild(card);
    });
}

async function openLocationModal(locationId = null) {
    try {
        let loc = {};
        if (locationId) {
            const snapshot = await db.ref(`storageLocations/${locationId}`).once('value');
            loc = snapshot.val() || {};
        }
        const isEdit = !!locationId;

        Swal.fire({
            title: isEdit ? 'Edit Location' : 'Add New Location',
            width: '800px',
            html: `
                <form id="location-form" class="text-left space-y-4">
                    <input id="swal-loc-name" class="swal2-input" placeholder="Location Name" value="${loc.name || ''}">
                    <input id="swal-loc-address-search" class="swal2-input" placeholder="Search Address" value="${loc.address || ''}">
                    <div id="swal-map" class="w-full h-48 bg-gray-200 my-2 rounded-lg"></div>
                    <div class="grid grid-cols-2 gap-4">
                        <input id="swal-loc-lat" class="swal2-input" placeholder="Latitude" value="${loc.geolocation?.latitude || ''}">
                        <input id="swal-loc-lng" class="swal2-input" placeholder="Longitude" value="${loc.geolocation?.longitude || ''}">
                    </div>
                    <textarea id="swal-loc-desc" class="swal2-textarea" placeholder="Description">${loc.description || ''}</textarea>
                    <input id="swal-loc-capacity" type="number" class="swal2-input" placeholder="Total Capacity (Units)" value="${loc.capacity || ''}">
                    <input id="swal-loc-image" class="swal2-input" placeholder="Location Image URL" value="${loc.imageUrl || ''}">
                    <input id="swal-loc-image-upload" type="file" class="swal2-file" accept="image/*">
                    <div class="p-3 border rounded-lg">
                        <h4 class="font-semibold mb-2">Location Features</h4>
                        <div id="features-container" class="space-y-2"></div>
                        <button type="button" id="add-feature-btn" class="text-sm font-semibold text-blue-600 mt-2"><i class="fas fa-plus mr-1"></i>Add Feature</button>
                    </div>
                    <div class="p-3 border rounded-lg">
                        <h4 class="font-semibold mb-2">Pricing Scheme</h4>
                        <div id="pricing-container" class="pricing-scheme-container"></div>
                        <button type="button" id="add-storage-type-btn" class="text-sm font-semibold text-blue-600 mt-2"><i class="fas fa-plus mr-1"></i>Add Storage Type</button>
                    </div>
                </form>
            `,
            showCancelButton: true,
            confirmButtonText: isEdit ? 'Save Changes' : 'Create Location',
            didOpen: () => {
                // Initial coordinates for map center, ensure it's a plain object
                const initialCoordsForMap = { lat: loc.geolocation?.latitude, lng: loc.geolocation?.longitude };
                initializeLocationModalMap(initialCoordsForMap);

                const featuresContainer = document.getElementById('features-container');
                (loc.features || []).forEach(f => addFeatureRow(featuresContainer, faIcons, f.name, f.icon));
                document.getElementById('add-feature-btn').addEventListener('click', () => addFeatureRow(featuresContainer, faIcons));
                const pricingContainer = document.getElementById('pricing-container');
                (loc.pricing || []).forEach(p => addStorageTypeGroup(pricingContainer, p.storageType, p.rates));
                document.getElementById('add-storage-type-btn').addEventListener('click', () => addStorageTypeGroup(pricingContainer));
            },
            preConfirm: async () => {
                Swal.showLoading();
                const imageFile = document.getElementById('swal-loc-image-upload').files[0];
                let imageUrl = document.getElementById('swal-loc-image').value;
                if (imageFile) {
                    const filePath = `locations/${Date.now()}-${imageFile.name}`;
                    const snapshot = await storage.ref(filePath).put(imageFile);
                    imageUrl = await snapshot.ref.getDownloadURL();
                }
                const features = Array.from(document.querySelectorAll('#features-container .feature-row')).map(row => ({
                    name: row.querySelector('.feature-name').value,
                    icon: row.querySelector('.feature-icon-display').className.split(' ').slice(1).join(' ')
                })).filter(f => f.name && f.icon);
                const pricing = Array.from(document.querySelectorAll('#pricing-container .storage-type-group')).map(group => ({
                    storageType: group.querySelector('.storage-type-input').value,
                    rates: Array.from(group.querySelectorAll('.rate-row')).map(row => ({
                        duration: row.querySelector('.rate-duration').value,
                        price: parseFloat(row.querySelector('.rate-price').value) || 0,
                    })).filter(r => r.duration && r.price > 0)
                })).filter(p => p.storageType && p.rates.length > 0);
                return {
                    name: document.getElementById('swal-loc-name').value,
                    address: document.getElementById('swal-loc-address-search').value,
                    description: document.getElementById('swal-loc-desc').value,
                    capacity: parseInt(document.getElementById('swal-loc-capacity').value) || 0,
                    imageUrl,
                    geolocation: {
                        latitude: parseFloat(document.getElementById('swal-loc-lat').value),
                        longitude: parseFloat(document.getElementById('swal-loc-lng').value)
                    },
                    features,
                    pricing
                };
            }
        }).then(result => {
            if (result.isConfirmed) {
                const data = result.value;
                const ref = locationId ? db.ref(`storageLocations/${locationId}`) : db.ref('storageLocations').push();
                ref.set(data)
                    .then(() => Swal.fire('Success', `Location ${isEdit ? 'updated' : 'created'}.`, 'success'))
                    .catch(err => Swal.fire('Error', err.message, 'error'));
            }
        });
    } catch (error) {
        console.error("Error opening location modal:", error);
        Swal.fire('Error', 'Could not open location manager.', 'error');
    }
}

// Global variables for Google Map instance
let locationMapInstance = null; // Changed name to avoid conflict with `locationMap` from main.js
let locationMarkerInstance = null; // Changed name

function initializeLocationModalMap(initialCoords = {}) {
    const defaultCenter = { lat: -8.6702, lng: 115.2124 }; // Denpasar, Bali coordinates
    const center = (initialCoords.lat && initialCoords.lng) ? initialCoords : defaultCenter;
    
    const mapElement = document.getElementById('swal-map');
    if (!mapElement) return;

    // Destroy existing map instance if any to prevent multiple maps
    if (locationMapInstance) {
        // No direct destroy method, clear HTML and nullify
        mapElement.innerHTML = '';
        locationMapInstance = null;
        locationMarkerInstance = null;
    }

    // Create a new LatLng object for the map center
    const mapCenterLatLng = new google.maps.LatLng(center.lat, center.lng);

    locationMapInstance = new google.maps.Map(mapElement, { center: mapCenterLatLng, zoom: 12 });
    locationMarkerInstance = new google.maps.Marker({ map: locationMapInstance, position: mapCenterLatLng, draggable: true });
    
    const searchInput = document.getElementById('swal-loc-address-search');
    if (searchInput) {
        // Autocomplete can be slow to initialize sometimes
        const locationAutocomplete = new google.maps.places.Autocomplete(searchInput);
        locationAutocomplete.bindTo('bounds', locationMapInstance);
        locationAutocomplete.addListener('place_changed', () => {
            const place = locationAutocomplete.getPlace();
            if (!place.geometry) return;
            locationMapInstance.setCenter(place.geometry.location);
            locationMapInstance.setZoom(17);
            locationMarkerInstance.setPosition(place.geometry.location);
            updateLatLngInputs(place.geometry.location); // This returns LatLng object
        });
    }
    
    locationMarkerInstance.addListener('dragend', () => updateLatLngInputs(locationMarkerInstance.getPosition())); // This returns LatLng object

    // Initial update of inputs using the new LatLng object
    updateLatLngInputs(mapCenterLatLng);
}

function updateLatLngInputs(position) {
    // Check if position is a LatLng object (has .lat() and .lng() methods)
    // or a plain object {lat, lng}
    const lat = typeof position.lat === 'function' ? position.lat() : position.lat;
    const lng = typeof position.lng === 'function' ? position.lng() : position.lng;
    
    document.getElementById('swal-loc-lat').value = lat.toFixed(6);
    document.getElementById('swal-loc-lng').value = lng.toFixed(6);
}

function addStorageTypeGroup(container, typeName = '', rates = []) {
    const groupId = `group-${Date.now()}`;
    const group = document.createElement('div');
    group.className = 'storage-type-group';
    group.id = groupId;
    group.innerHTML = `
        <div class="storage-type-header">
            <input type="text" class="storage-type-input flex-grow px-2 py-1 border rounded font-semibold" placeholder="Storage Type (e.g., Suitcase)" value="${typeName}">
            <button type="button" class="remove-btn" onclick="document.getElementById('${groupId}').remove()" title="Delete Storage Type"><i class="fas fa-trash-alt"></i></button>
        </div>
        <div class="rates-container space-y-2"></div>
        <button type="button" class="add-rate-btn mt-2 text-xs font-semibold text-blue-600"><i class="fas fa-plus mr-1"></i>Add Duration</button>`;
    container.appendChild(group);
    const ratesContainer = group.querySelector('.rates-container');
    if (rates.length > 0) rates.forEach(rate => addPricingRateRow(ratesContainer, rate.duration, rate.price));
    else addPricingRateRow(ratesContainer);
    group.querySelector('.add-rate-btn').addEventListener('click', () => addPricingRateRow(ratesContainer));
}

function addPricingRateRow(container, duration = '', price = '') {
    const rowId = `rate-${Date.now()}`;
    const row = document.createElement('div');
    row.className = 'rate-row';
    row.id = rowId;
    row.innerHTML = `
        <input type="text" class="rate-duration" placeholder="Duration (e.g., Daily, Weekly)" value="${duration}">
        <input type="number" class="rate-price" placeholder="Price" value="${price}">
        <button type="button" class="remove-btn" onclick="document.getElementById('${rowId}').remove()"><i class="fas fa-times-circle"></i></button>`;
    container.appendChild(row);
}

function addFeatureRow(container, iconList, name = '', icon = 'fas fa-check') {
    const rowId = `feature-${Date.now()}`;
    const row = document.createElement('div');
    row.className = 'feature-row flex items-center gap-2';
    row.id = rowId;
    row.innerHTML = `
        <button type="button" class="feature-icon-btn p-2 border rounded"><i class="feature-icon-display ${icon}"></i></button>
        <input type="text" class="feature-name flex-grow px-2 py-1 border rounded" placeholder="Feature Name" value="${name}">
        <button type="button" class="remove-btn" onclick="document.getElementById('${rowId}').remove()"><i class="fas fa-trash"></i></button>`;
    container.appendChild(row);
    row.querySelector('.feature-icon-btn').addEventListener('click', (e) => openIconPicker(e.currentTarget, iconList));
}

function openIconPicker(button, iconList) {
    Swal.fire({
        title: 'Select Icon',
        html: `<input type="text" id="icon-search" placeholder="Search icon..." class="swal2-input"><div id="icon-grid" class="max-h-64 overflow-y-auto grid grid-cols-8 gap-2 mt-4"></div>`,
        showConfirmButton: false,
        didOpen: () => {
            const grid = document.getElementById('icon-grid');
            const search = document.getElementById('icon-search');
            const renderIcons = (filter = '') => {
                grid.innerHTML = iconList.filter(i => i.includes(filter)).map(icon => `<div class="p-2 text-center text-xl cursor-pointer hover:bg-gray-200 rounded" data-icon="${icon}"><i class="${icon}"></i></div>`).join('');
                grid.querySelectorAll('.p-2').forEach(el => el.addEventListener('click', () => {
                    button.querySelector('i').className = `feature-icon-display ${el.dataset.icon}`;
                    Swal.close();
                }));
            };
            search.addEventListener('input', () => renderIcons(search.value));
            renderIcons();
        }
    });
}