// =====================================================================
// SETTINGS LOGIC
// =====================================================================
async function fetchAndRenderSettings() {
    const settingsSnap = await db.ref('settings').once('value');
    const settings = settingsSnap.val() || {};
    
    // Populate Banner
    document.getElementById('setting-banner-title').value = settings.banner?.title || '';
    document.getElementById('setting-banner-subtitle').value = settings.banner?.subtitle || '';
    document.getElementById('setting-banner-imageUrl').value = settings.banner?.imageUrl || '';
    
    // Populate Pricing
    document.getElementById('setting-pricing-pickupFee').value = settings.pricing?.pickupFee || 0;
    
    // Populate Footer Links
    const footerLinksContainer = document.getElementById('footer-links-container');
    footerLinksContainer.innerHTML = ''; // Clear existing
    if (settings.footerLinks) {
        Object.entries(settings.footerLinks).forEach(([category, links]) => {
            links.forEach(link => addFooterLinkRow(footerLinksContainer, category, link.text, link.url));
        });
    }
    document.getElementById('add-footer-link-btn').addEventListener('click', () => addFooterLinkRow(footerLinksContainer));
    
    // Populate Social Media
    const socialMediaContainer = document.getElementById('social-media-container');
    socialMediaContainer.innerHTML = ''; // Clear existing
    (settings.social_media || []).forEach(sm => addSocialMediaRow(socialMediaContainer, sm.platform, sm.url));
    document.getElementById('add-social-media-btn').addEventListener('click', () => addSocialMediaRow(socialMediaContainer));
}

function addFooterLinkRow(container, category = 'company', text = '', url = '') {
    const rowId = `footer-link-${Date.now()}`;
    const row = document.createElement('div');
    row.className = 'footer-link-row flex gap-2';
    row.id = rowId;
    row.innerHTML = `
        <select class="link-category px-2 py-1 border rounded" style="width:120px;">
            <option value="company" ${category === 'company' ? 'selected' : ''}>Company</option>
            <option value="resources" ${category === 'resources' ? 'selected' : ''}>Resources</option>
        </select>
        <input type="text" class="link-text flex-grow px-2 py-1 border rounded" placeholder="Link Text" value="${text}">
        <input type="text" class="link-url flex-grow px-2 py-1 border rounded" placeholder="Link URL" value="${url}">
        <button type="button" class="remove-btn" onclick="document.getElementById('${rowId}').remove()"><i class="fas fa-trash"></i></button>
    `;
    container.appendChild(row);
}

function addSocialMediaRow(container, platform = '', url = '') {
    const rowId = `social-media-${Date.now()}`;
    const row = document.createElement('div');
    row.className = 'social-media-row flex gap-2';
    row.id = rowId;
    row.innerHTML = `
        <input type="text" class="social-platform flex-grow px-2 py-1 border rounded" placeholder="Platform (e.g., facebook)" value="${platform}">
        <input type="text" class="social-url flex-grow px-2 py-1 border rounded" placeholder="Profile URL" value="${url}">
        <button type="button" class="remove-btn" onclick="document.getElementById('${rowId}').remove()"><i class="fas fa-trash"></i></button>
    `;
    container.appendChild(row);
}

async function handleWebsiteSettingsSubmit(e) {
    e.preventDefault();
    Swal.showLoading();
    const settings = {
        banner: {
            title: document.getElementById('setting-banner-title').value,
            subtitle: document.getElementById('setting-banner-subtitle').value,
            imageUrl: document.getElementById('setting-banner-imageUrl').value,
        },
        pricing: {
            pickupFee: parseFloat(document.getElementById('setting-pricing-pickupFee').value) || 0,
        },
        footerLinks: { company: [], resources: [] },
        social_media: [],
    };
    
    document.querySelectorAll('.footer-link-row').forEach(row => {
        const category = row.querySelector('.link-category').value;
        const text = row.querySelector('.link-text').value;
        const url = row.querySelector('.link-url').value;
        if (text && url) settings.footerLinks[category].push({ text, url });
    });
    
    document.querySelectorAll('.social-media-row').forEach(row => {
        const platform = row.querySelector('.social-platform').value;
        const url = row.querySelector('.social-url').value;
        if (platform && url) settings.social_media.push({ platform, url });
    });
    
    await db.ref('settings').set(settings);
    Swal.fire('Success!', 'Website settings saved successfully.', 'success');
}