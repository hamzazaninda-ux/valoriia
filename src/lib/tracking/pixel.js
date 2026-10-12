/**
 * Unified Pixel & Tracking Helper (NOVAVITA DTC)
 * Handles Meta Pixel (fbq), TikTok Pixel (ttq), Snapchat (snaptr), and GA4/GTM (dataLayer).
 */

export function fbqTrack(event: string, data: Record<string, any> = {}) {
	if (typeof window === 'undefined') return;

	// 1. Meta / Facebook Pixel
	try {
		if (typeof (window as any).fbq === 'function') {
			(window as any).fbq('track', event, data);
			console.log(`[Pixel] Meta fbq track: ${event}`, data);
		}
	} catch (err) {
		console.warn('[Pixel] Meta fbq error:', err);
	}

	// 2. TikTok Pixel
	try {
		if (typeof (window as any).ttq?.track === 'function') {
			const ttqEvent = event === 'AddToCart' ? 'AddToCart' : event;
			(window as any).ttq.track(ttqEvent, {
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
		(window as any).dataLayer = (window as any).dataLayer || [];
		if (event === 'AddToCart') {
			(window as any).dataLayer.push({
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
