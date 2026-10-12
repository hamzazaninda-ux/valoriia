/**
 * Unified Production-Grade Meta Pixel & Tracking Helper (NOVAVITA DTC)
 * Pixel ID: 2180716089518389
 * Handles Meta Pixel (fbq), TikTok Pixel (ttq), and GA4/GTM (dataLayer).
 * Strict Deduplication | Zero Dropped Conversions
 */

let lastAddToCartTime = 0;
let lastAddToCartKey = '';

export function fbqTrack(event, data = {}) {
	if (typeof window === 'undefined') return;

	// Deduplication guard for AddToCart (1500ms debounce)
	if (event === 'AddToCart') {
		const now = Date.now();
		const key = `${data.content_name || 'bundle'}:${data.value || 249}`;
		if (now - lastAddToCartTime < 1500 && lastAddToCartKey === key) {
			console.log('[Pixel] AddToCart duplicate suppressed by deduplication guard:', key);
			return;
		}
		lastAddToCartTime = now;
		lastAddToCartKey = key;
	}

	// 1. Meta / Facebook Pixel (NOVAVITA: 2180716089518389)
	try {
		if (typeof window.fbq === 'function') {
			const payload = {
				content_name: data.content_name || 'NOVAVITA Gummies Bundle',
				content_type: 'product',
				currency: data.currency || 'MAD',
				value: data.value || 249,
				...data
			};
			window.fbq('track', event, payload);
			console.log(`[Pixel] Meta fbq track: ${event}`, payload);
		}
	} catch (err) {
		console.warn('[Pixel] Meta fbq error:', err);
	}

	// 2. TikTok Pixel
	try {
		if (typeof window.ttq?.track === 'function') {
			const ttqEvent = event === 'AddToCart' ? 'AddToCart' : event;
			window.ttq.track(ttqEvent, {
				content_id: data.content_id || 'novavita_bundle',
				content_name: data.content_name || 'NOVAVITA Gummies Bundle',
				content_type: 'product',
				value: data.value || 249,
				currency: data.currency || 'MAD'
			});
			console.log(`[Pixel] TikTok ttq track: ${ttqEvent}`, data);
		}
	} catch (err) {
		console.warn('[Pixel] TikTok ttq error:', err);
	}

	// 3. Google Tag Manager / dataLayer
	try {
		window.dataLayer = window.dataLayer || [];
		if (event === 'AddToCart') {
			window.dataLayer.push({
				event: 'add_to_cart',
				ecommerce: {
					currency: data.currency || 'MAD',
					value: data.value || 249,
					items: [
						{
							item_name: data.content_name || 'NOVAVITA Gummies Bundle',
							price: data.value || 249
						}
					]
				}
			});
		}
	} catch (err) {
		console.warn('[Pixel] dataLayer error:', err);
	}
}
