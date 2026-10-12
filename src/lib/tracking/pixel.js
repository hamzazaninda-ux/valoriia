/**
 * Unified Pixel & Tracking Helper (NOVAVITA DTC)
 * Handles Meta Pixel (fbq), TikTok Pixel (ttq), Snapchat (snaptr), and GA4/GTM (dataLayer).
 */

export function fbqTrack(event, data = {}) {
	if (typeof window === 'undefined') return;

	// 1. Meta / Facebook Pixel
	try {
		if (typeof window.fbq === 'function') {
			window.fbq('track', event, data);
			console.log(`[Pixel] Meta fbq track: ${event}`, data);
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
				content_type: data.content_type || 'product',
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
