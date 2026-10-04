// Shared checkout submission — same Google Sheets contract as the inline
// template forms (all legacy fields preserved) plus cart detail fields.
// Extra fields are ignored by existing sheet scripts; legacy columns keep working.

import type { CartLine } from '$lib/stores/cart.svelte';

export interface CheckoutCustomer {
	fullName: string;
	phoneNumber: string;
}

export interface CheckoutContext {
	productTitle: string;
	sku: string;
	currency: string;
	pageUrl: string;
}

export function buildOrderPayload(
	customer: CheckoutCustomer,
	lines: CartLine[],
	ctx: CheckoutContext,
	orderType: 'cart' | 'upsell' = 'cart',
	parentOrderId?: string
) {
	const orderId =
		orderType === 'upsell' && parentOrderId
			? `${parentOrderId}-U1`
			: 'ORD-' + Math.floor(100000 + Math.random() * 900000);

	const titles = lines.map((l) => `${l.qty}x ${l.title}${l.offerTitle ? ` (${l.offerTitle})` : ''}`);
	const subtotal = lines.reduce((a, l) => a + l.qty * l.price, 0);
	const totalQty = lines.reduce((a, l) => a + l.qty, 0);
	const now = new Date();

	return {
		orderId,
		fullName: customer.fullName.trim(),
		phoneNumber: customer.phoneNumber.trim(),
		// City is collected on the confirmation call for popup orders.
		address: 'يُحدد عند التأكيد',
		city: 'يُحدد عند التأكيد',
		offer: titles.join(' + '),
		price: subtotal,
		quantity: totalQty,
		qte: totalQty,
		sku: ctx.sku,
		productTitle: ctx.productTitle,
		pageUrl: ctx.pageUrl,
		date: now.toLocaleDateString('ar-MA', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		}),
		timestamp: now.toISOString(),
		// Cart detail (new columns; safely ignored by older sheet scripts)
		items: JSON.stringify(
			lines.map((l) => ({ slug: l.slug, title: l.title, offer: l.offerTitle, price: l.price, qty: l.qty }))
		),
		orderType
	};
}

let lastAddToCartTime = 0;
let lastAddToCartKey = '';

export function trackAddToCart(
	price: number,
	productTitle: string,
	currency: string = 'MAD',
	itemId?: string | number,
	numberItems: number = 1
) {
	if (typeof window === 'undefined') return;

	const cur = 'MAD';
	const numPrice = Number(price) || 0;
	const title = (productTitle || '').trim();
	const id = String(itemId || 'kit-tandim');

	// Deduplication guard: prevent duplicate events within 500ms for identical item
	const now = Date.now();
	const key = `${id}:${numPrice}`;
	if (now - lastAddToCartTime < 500 && lastAddToCartKey === key) {
		return;
	}
	lastAddToCartTime = now;
	lastAddToCartKey = key;

	// Snapchat Pixel (Single Source of Truth)
	try {
		if (typeof (window as any).snaptr === 'function') {
			(window as any).snaptr('track', 'ADD_CART', {
				price: numPrice,
				currency: 'MAD',
				item_ids: [id]
			});
		}
	} catch (err) {
		console.warn('[Pixel] Snap ADD_CART error:', err);
	}

	// Meta / Facebook Pixel
	try {
		if (typeof (window as any).fbq === 'function') {
			(window as any).fbq('track', 'AddToCart', {
				content_name: title,
				content_type: 'product',
				value: numPrice,
				currency: cur
			});
		}
	} catch (err) {
		console.warn('[Pixel] Meta AddToCart error:', err);
	}

	// TikTok Pixel
	try {
		if (typeof (window as any).ttq?.track === 'function') {
			(window as any).ttq.track('AddToCart', {
				content_name: title,
				content_type: 'product',
				value: numPrice,
				currency: cur
			});
		}
	} catch (err) {
		console.warn('[Pixel] TikTok AddToCart error:', err);
	}

	// Google Analytics / GA4 / Google Ads (gtag)
	try {
		if (typeof (window as any).gtag === 'function') {
			(window as any).gtag('event', 'add_to_cart', {
				currency: cur,
				value: numPrice,
				items: [
					{
						item_name: title,
						price: numPrice,
						quantity: numberItems || 1
					}
				]
			});
		}
	} catch (err) {
		console.warn('[Pixel] gtag add_to_cart error:', err);
	}
}

export function trackPurchase(price: number, productTitle: string, transactionId?: string) {
	if (typeof window === 'undefined') return;
	const numPrice = Number(price) || 0;
	const title = (productTitle || '').trim();
	const txnId = (transactionId || `ORD-${Date.now()}`).trim();

	// Deduplication Guard: prevent duplicate Purchase events (especially on page reload or double firing)
	const storageKey = `snap_order_${txnId}`;
	try {
		if (sessionStorage.getItem(storageKey) || sessionStorage.getItem(`snap_purchased_${txnId}`)) {
			return; // Already tracked for this transaction
		}
		sessionStorage.setItem(storageKey, 'true');
	} catch {
		// sessionStorage fallback
	}

	// Snapchat Pixel
	try {
		if (typeof (window as any).snaptr === 'function') {
			(window as any).snaptr('track', 'PURCHASE', {
				price: numPrice,
				currency: 'MAD',
				transaction_id: txnId,
				item_category: title
			});
		}
	} catch (err) {
		console.warn('[Pixel] Snap Purchase error:', err);
	}

	// Meta / Facebook Pixel
	try {
		if ((window as any).fbq) {
			(window as any).fbq('track', 'Purchase', {
				value: numPrice,
				currency: 'MAD',
				content_name: title,
				order_id: txnId
			});
		}
	} catch (err) {
		console.warn('[Pixel] Meta Purchase error:', err);
	}

	// TikTok Pixel
	try {
		if ((window as any).ttq) {
			(window as any).ttq.track('CompletePayment', {
				value: numPrice,
				currency: 'MAD',
				content_name: title,
				order_id: txnId
			});
		}
	} catch (err) {
		console.warn('[Pixel] TikTok Purchase error:', err);
	}

	// Google Analytics / GA4 / Google Ads (gtag)
	try {
		if ((window as any).gtag) {
			(window as any).gtag('event', 'purchase', {
				currency: 'MAD',
				value: numPrice,
				transaction_id: txnId,
				items: [{ item_name: title, price: numPrice, quantity: 1 }]
			});
		}
	} catch (err) {
		console.warn('[Pixel] gtag purchase error:', err);
	}
}

/** Fire-and-forget POST to the Sheets webhook. Always resolves (never blocks redirect). */
export function sendOrder(payload: Record<string, unknown>, sheetsUrl: string): Promise<void> {
	if (!sheetsUrl) return Promise.resolve();
	return fetch(sheetsUrl, {
		method: 'POST',
		mode: 'no-cors',
		headers: { 'Content-Type': 'text/plain;charset=utf-8' },
		body: JSON.stringify(payload)
	})
		.then(() => undefined)
		.catch(() => undefined);
}
