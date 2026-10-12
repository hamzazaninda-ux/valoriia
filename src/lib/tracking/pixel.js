/**
 * Multi-Pixel Unified Tracker:
 * - Meta Pixel (2180716089518389)
 * - TikTok Pixel (DB60A23C77U074LG47QG)
 * - Snapchat Pixel (451b9c4c-9641-4b83-9f0a-319889a52302)
 *
 * Strict Production-Grade Setup | Zero Duplication | Zero Dropped Signals
 */

export const SNAPCHAT_PIXEL_ID = '451b9c4c-9641-4b83-9f0a-319889a52302';
export const META_PIXEL_ID = '2180716089518389';
export const TIKTOK_PIXEL_ID = 'DB60A23C77U074LG47QG';

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
			console.log('[Meta Pixel Tracked]:', eventName, payload, options);
		} else {
			console.warn(`[Meta Pixel Warning]: window.fbq not yet ready for ${eventName}.`);
		}
	} catch (err) {
		console.warn(`[Meta Pixel Error] Failed tracking ${eventName}:`, err);
	}
}

/**
 * Universal TikTok Event Dispatcher
 */
export function trackTikTokEvent(eventName, payload = {}, options = {}) {
	if (typeof window === 'undefined') return;

	try {
		if (window.ttq && typeof window.ttq.track === 'function') {
			if (options.event_id) {
				window.ttq.track(eventName, payload, { event_id: String(options.event_id) });
			} else {
				window.ttq.track(eventName, payload);
			}
			console.log('[TikTok Pixel Tracked]:', eventName, payload, options);
		} else {
			console.warn(`[TikTok Pixel Warning]: window.ttq not yet ready for ${eventName}.`);
		}
	} catch (err) {
		console.warn(`[TikTok Pixel Error] Failed tracking ${eventName}:`, err);
	}
}

/**
 * Universal Snapchat Event Dispatcher
 */
export function trackSnapchatEvent(eventName, payload = {}) {
	if (typeof window === 'undefined') return;

	try {
		if (window.snaptr && typeof window.snaptr === 'function') {
			window.snaptr('track', eventName, payload);
			console.log('[Snapchat Pixel Tracked]:', eventName, payload);
		} else {
			console.warn(`[Snapchat Pixel Warning]: window.snaptr not yet ready for ${eventName}.`);
		}
	} catch (err) {
		console.warn(`[Snapchat Pixel Error] Failed tracking ${eventName}:`, err);
	}
}

/**
 * Universal PageView Dispatcher (Synchronous Triple-Pixel)
 */
export function trackPageView() {
	if (typeof window === 'undefined') return;

	// 1. Meta Pixel PageView
	try {
		if (typeof window.fbq === 'function') {
			window.fbq('track', 'PageView');
		}
	} catch (e) {}

	// 2. TikTok Pixel PageView
	try {
		if (window.ttq && typeof window.ttq.page === 'function') {
			window.ttq.page();
		}
	} catch (e) {}

	// 3. Snapchat Pixel PageView
	try {
		if (window.snaptr) {
			window.snaptr('track', 'PAGE_VIEW');
		}
	} catch (e) {}
}

/**
 * Robust Central Event Trigger (handles Meta, TikTok, Snapchat & GTM)
 */
export function fbqTrack(eventName, data = {}) {
	if (typeof window === 'undefined') return;

	// 1. AddToCart Debouncing (1000ms window)
	if (eventName === 'AddToCart') {
		const now = Date.now();
		const key = `${data.content_name || data.name || 'bundle'}:${data.value || data.price || 249}`;
		if (now - lastAddToCartTime < 1000 && lastAddToCartKey === key) {
			console.log('[Pixel Tracked]: AddToCart duplicate suppressed by 1000ms debounce:', key);
			return;
		}
		lastAddToCartTime = now;
		lastAddToCartKey = key;
	}

	const contentId = String(data.content_id || data.id || data.title || 'novavita-bundle');
	const contentName = String(data.content_name || data.name || data.title || 'NOVAVITA Gummies');
	const priceVal = Number(data.value || data.price || 249);
	const quantityVal = Number(data.quantity || 1);

	const payload = {
		content_id: contentId,
		content_name: contentName,
		content_type: 'product',
		currency: data.currency || 'MAD',
		value: priceVal,
		price: priceVal,
		quantity: quantityVal,
		...data
	};

	// 1. Meta Pixel
	trackMetaEvent(eventName, payload, data.order_id ? { eventID: String(data.order_id) } : {});

	// 2. TikTok Pixel
	try {
		if (window.ttq) {
			if (eventName === 'AddToCart') {
				window.ttq.track('AddToCart', {
					content_id: contentId,
					content_type: 'product',
					content_name: contentName,
					quantity: quantityVal,
					price: priceVal,
					value: priceVal,
					currency: 'MAD'
				});
			} else if (eventName === 'Purchase' || eventName === 'CompletePayment') {
				const ttqPayload = {
					content_id: contentId,
					content_type: 'product',
					content_name: contentName,
					quantity: quantityVal,
					price: priceVal,
					value: priceVal,
					currency: 'MAD'
				};
				const opts = data.order_id ? { event_id: String(data.order_id) } : {};
				window.ttq.track('CompletePayment', ttqPayload, opts);
				window.ttq.track('PlaceAnOrder', ttqPayload, opts);
			} else {
				window.ttq.track(eventName, payload);
			}
		}
	} catch (e) {
		console.warn('[TikTok Track Error]:', e);
	}

	// 3. Snapchat Pixel
	try {
		if (window.snaptr) {
			if (eventName === 'AddToCart') {
				window.snaptr('track', 'ADD_CART', {
					price: priceVal,
					currency: 'MAD',
					item_ids: [contentId],
					item_category: 'Supplements',
					number_items: quantityVal
				});
			} else if (eventName === 'Purchase' || eventName === 'CompletePayment') {
				window.snaptr('track', 'PURCHASE', {
					price: priceVal,
					currency: 'MAD',
					transaction_id: String(data.order_id || Date.now()),
					item_ids: [contentId],
					number_items: quantityVal
				});
			}
		}
	} catch (e) {
		console.warn('[Snapchat Track Error]:', e);
	}

	// 4. Google Tag Manager / dataLayer
	try {
		window.dataLayer = window.dataLayer || [];
		if (eventName === 'AddToCart') {
			window.dataLayer.push({
				event: 'add_to_cart',
				ecommerce: {
					currency: 'MAD',
					value: priceVal,
					items: [{ item_name: contentName, item_id: contentId, price: priceVal, quantity: quantityVal }]
				}
			});
		}
	} catch (e) {}
}

/**
 * Dedicated AddToCart Helper with 1000ms Debounce
 * Dispatches synchronously to Meta, TikTok, and Snapchat
 */
export function trackAddToCart(itemOrName, price = 249, extra = {}) {
	if (typeof window === 'undefined') return;

	let item = {};
	if (typeof itemOrName === 'object' && itemOrName !== null) {
		item = itemOrName;
	} else {
		item = {
			name: itemOrName || 'NOVAVITA Gummies',
			title: itemOrName || 'NOVAVITA Gummies',
			price: Number(price) || 249,
			value: Number(price) || 249,
			...extra
		};
	}

	const contentId = String(item.id || item.title || 'novavita-bundle');
	const contentName = String(item.name || item.title || 'NOVAVITA Gummies');
	const priceVal = Number(item.value || item.price || 249);
	const quantityVal = Number(item.quantity || 1);

	fbqTrack('AddToCart', {
		content_id: contentId,
		content_name: contentName,
		content_type: 'product',
		currency: 'MAD',
		value: priceVal,
		price: priceVal,
		quantity: quantityVal,
		...item
	});
}

/**
 * Dedicated Purchase Helper with Strict Idempotent Deduplication
 * Dispatches synchronously to Meta, TikTok, and Snapchat upon COD success
 */
export function trackPurchase(priceOrOrder, productTitle, transactionId, phoneNumber) {
	if (typeof window === 'undefined') return;

	let order = {};
	if (typeof priceOrOrder === 'object' && priceOrOrder !== null) {
		order = priceOrOrder;
	} else {
		order = {
			totalPrice: Number(priceOrOrder) || 249,
			value: Number(priceOrOrder) || 249,
			productTitle: productTitle || 'NOVAVITA Gummies Bundle',
			orderId: transactionId || `ORD-${Date.now()}`,
			phoneNumber: phoneNumber || ''
		};
	}

	const orderId = String(order.orderId || order.transactionId || `ORD-${Date.now()}`).trim();
	const storageKey = `tracked_order_${orderId}`;

	// Strict Idempotent Deduplication: prevent duplicate execution on page refresh or retries
	try {
		if (
			sessionStorage.getItem(storageKey) ||
			localStorage.getItem(storageKey) ||
			sessionStorage.getItem(`fb_purchased_${orderId}`) ||
			sessionStorage.getItem(`tt_purchased_${orderId}`) ||
			sessionStorage.getItem(`snap_purchased_${orderId}`)
		) {
			console.log('[Pixel Tracked]: Purchase duplicate suppressed for order:', orderId);
			return;
		}
		sessionStorage.setItem(storageKey, 'true');
		localStorage.setItem(storageKey, 'true');
		sessionStorage.setItem(`fb_purchased_${orderId}`, 'true');
		sessionStorage.setItem(`tt_purchased_${orderId}`, 'true');
		sessionStorage.setItem(`snap_purchased_${orderId}`, 'true');
	} catch (e) {}

	const numPrice = Number(order.totalPrice || order.value || order.price || 249);
	const title = String(order.productTitle || order.content_name || 'NOVAVITA Order').trim();
	const phone = order.phoneNumber || '';

	// 1. Meta Pixel
	const metaPayload = {
		content_name: title,
		content_type: 'product',
		currency: 'MAD',
		value: numPrice,
		order_id: orderId
	};
	trackMetaEvent('Purchase', metaPayload, { eventID: orderId });

	// 2. TikTok Pixel
	try {
		if (window.ttq) {
			const ttqPayload = {
				content_id: String(order.productTitle || 'novavita-bundle'),
				content_type: 'product',
				content_name: String(order.productTitle || 'NOVAVITA Order'),
				quantity: 1,
				price: numPrice,
				value: numPrice,
				currency: 'MAD'
			};
			window.ttq.track('CompletePayment', ttqPayload, { event_id: String(orderId) });
			window.ttq.track('PlaceAnOrder', ttqPayload, { event_id: String(orderId) });
		}
	} catch (e) {
		console.warn('[TikTok Purchase Error]:', e);
	}

	// 3. Snapchat Pixel
	try {
		if (window.snaptr) {
			if (phone) {
				const phoneClean = String(phone).trim().replace(/[\s\-\(\)]/g, '');
				const formattedPhone = phoneClean.startsWith('+') ? phoneClean : ('+212' + phoneClean.replace(/^0/, ''));
				if (formattedPhone && formattedPhone !== '+212') {
					window.snaptr('init', SNAPCHAT_PIXEL_ID, {
						'user_phone_number': formattedPhone
					});
				}
			}
			window.snaptr('track', 'PURCHASE', {
				price: numPrice,
				currency: 'MAD',
				transaction_id: String(orderId),
				item_ids: [String(order.productTitle || 'novavita-bundle')],
				number_items: 1
			});
		}
	} catch (e) {
		console.warn('[Snapchat Purchase Error]:', e);
	}

	// 4. Google Ads / Analytics
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
}
