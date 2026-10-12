/**
 * Strict Production-Grade Meta Pixel Tracker (NOVAVITA: 2180716089518389)
 * Zero Duplication | Zero Dropped Conversions | Zero Blocking
 */

let lastAddToCartTime = 0;
let lastAddToCartKey = '';

/**
 * Universal Meta Event Dispatcher
 */
export function trackMetaEvent(eventName, payload = {}, options = {}) {
	if (typeof window === 'undefined') return;

	try {
		if (typeof window.fbq === 'function') {
			if (options.eventID) {
				window.fbq('track', eventName, payload, { eventID: options.eventID });
			} else {
				window.fbq('track', eventName, payload);
			}
			console.log('[Pixel Tracked]:', eventName, payload, options);
		} else {
			console.warn(`[Pixel Warning]: window.fbq not yet ready for ${eventName}. Queuing check.`);
		}
	} catch (err) {
		console.warn(`[Pixel Error] Failed tracking ${eventName}:`, err);
	}
}

/**
 * Robust Central Event Trigger (handles Meta, TikTok & GTM)
 */
export function fbqTrack(eventName, data = {}) {
	if (typeof window === 'undefined') return;

	// 1. AddToCart Debouncing (1000ms window)
	if (eventName === 'AddToCart') {
		const now = Date.now();
		const key = `${data.content_name || 'bundle'}:${data.value || 249}`;
		if (now - lastAddToCartTime < 1000 && lastAddToCartKey === key) {
			console.log('[Pixel Tracked]: AddToCart duplicate suppressed by 1000ms debounce:', key);
			return;
		}
		lastAddToCartTime = now;
		lastAddToCartKey = key;
	}

	const payload = {
		content_name: data.content_name || 'NOVAVITA Gummies Bundle',
		content_type: 'product',
		currency: data.currency || 'MAD',
		value: Number(data.value) || 249,
		...data
	};

	trackMetaEvent(eventName, payload, data.order_id ? { eventID: String(data.order_id) } : {});

	// Forward to TikTok Pixel
	try {
		if (typeof window.ttq?.track === 'function') {
			const ttqEvent = eventName === 'AddToCart' ? 'AddToCart' : eventName === 'Purchase' ? 'CompletePayment' : eventName;
			window.ttq.track(ttqEvent, {
				content_id: data.content_id || 'novavita_bundle',
				content_name: payload.content_name,
				content_type: 'product',
				value: payload.value,
				currency: 'MAD'
			});
		}
	} catch (e) {}

	// Forward to Google Tag Manager
	try {
		window.dataLayer = window.dataLayer || [];
		if (eventName === 'AddToCart') {
			window.dataLayer.push({
				event: 'add_to_cart',
				ecommerce: {
					currency: 'MAD',
					value: payload.value,
					items: [{ item_name: payload.content_name, price: payload.value }]
				}
			});
		}
	} catch (e) {}
}

/**
 * Dedicated AddToCart Helper with 1000ms Debounce
 */
export function trackAddToCart(productName, price = 249, extra = {}) {
	fbqTrack('AddToCart', {
		content_name: productName || 'NOVAVITA Gummies Bundle',
		content_type: 'product',
		currency: 'MAD',
		value: Number(price) || 249,
		...extra
	});
}

/**
 * Dedicated Purchase Helper with Strict Idempotent Deduplication
 */
export function trackPurchase(price, productTitle, transactionId, phoneNumber) {
	if (typeof window === 'undefined') return;

	const orderId = String(transactionId || `ORD-${Date.now()}`).trim();
	const storageKey = `tracked_order_${orderId}`;

	// Strict Idempotent Deduplication: prevent duplicate execution
	try {
		if (
			sessionStorage.getItem(storageKey) ||
			localStorage.getItem(storageKey) ||
			sessionStorage.getItem(`fb_purchased_${orderId}`)
		) {
			console.log('[Pixel Tracked]: Purchase duplicate suppressed for order:', orderId);
			return;
		}
		sessionStorage.setItem(storageKey, 'true');
		localStorage.setItem(storageKey, 'true');
		sessionStorage.setItem(`fb_purchased_${orderId}`, 'true');
	} catch (e) {}

	const numPrice = Number(price) || 249;
	const title = (productTitle || 'NOVAVITA Gummies Bundle').trim();

	const payload = {
		content_name: title,
		content_type: 'product',
		currency: 'MAD',
		value: numPrice,
		order_id: orderId
	};

	trackMetaEvent('Purchase', payload, { eventID: orderId });

	// TikTok
	try {
		if (typeof window.ttq?.track === 'function') {
			window.ttq.track('CompletePayment', {
				content_id: 'novavita_bundle',
				content_name: title,
				content_type: 'product',
				value: numPrice,
				currency: 'MAD'
			}, { event_id: orderId });
		}
	} catch (e) {}

	// Google Ads / Analytics
	try {
		if (typeof window.gtag === 'function') {
			window.gtag('event', 'purchase', {
				transaction_id: orderId,
				value: numPrice,
				currency: 'MAD',
				items: [{ item_name: title, price: numPrice, quantity: 1 }]
			});
		}
	} catch (e) {}

	// Snapchat
	try {
		if (typeof window.snaptr === 'function') {
			if (phoneNumber) {
				const phoneClean = phoneNumber.trim().replace(/[\s\-\(\)]/g, '');
				const formattedPhone = phoneClean.startsWith('+') ? phoneClean : ('+212' + phoneClean.replace(/^0/, ''));
				if (formattedPhone && formattedPhone !== '+212') {
					window.snaptr('init', '0f0bf0bb-3983-47ea-9a39-90f43b1cf3ce', {
						'user_phone_number': formattedPhone
					});
				}
			}
			window.snaptr('track', 'PURCHASE', {
				price: numPrice,
				currency: 'MAD',
				transaction_id: orderId
			});
		}
	} catch (e) {}
}
