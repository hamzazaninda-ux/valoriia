// Shared checkout submission — same Google Sheets contract as the inline
// template forms (all legacy fields preserved) plus cart detail fields.
// Extra fields are ignored by existing sheet scripts; legacy columns keep working.

import type { CartLine } from '$lib/stores/cart.svelte';

export interface CheckoutCustomer {
	fullName: string;
	phoneNumber: string;
	city?: string;
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
		address: customer.city?.trim() || 'يُحدد عند التأكيد',
		city: customer.city?.trim() || 'يُحدد عند التأكيد',
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

	// Deduplication guard: prevent duplicate events within 1500ms for identical item
	const now = Date.now();
	const key = `${id}:${numPrice}`;
	if (now - lastAddToCartTime < 1500 && lastAddToCartKey === key) {
		console.log('[Tracking] AddToCart debounced (duplicate suppressed):', key);
		return;
	}
	lastAddToCartTime = now;
	lastAddToCartKey = key;

	// 1. Google Tag Manager / GA4 dataLayer event (Standard e-commerce schema)
	try {
		(window as any).dataLayer = (window as any).dataLayer || [];
		(window as any).dataLayer.push({
			event: 'add_to_cart',
			ecommerce: {
				currency: 'MAD',
				value: numPrice,
				items: [
					{
						item_id: id,
						item_name: title,
						price: numPrice,
						quantity: numberItems || 1
					}
				]
			}
		});
	} catch (err) {
		console.warn('[Tracking] dataLayer add_to_cart error:', err);
	}

	// 2. Snapchat Pixel (Single Source of Truth)
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

	// 3. Meta / Facebook Pixel
	try {
		if (typeof (window as any).fbq === 'function') {
			(window as any).fbq('track', 'AddToCart', {
				content_name: title,
				content_type: 'product',
				value: numPrice,
				currency: 'MAD'
			});
		}
	} catch (err) {
		console.warn('[Pixel] Meta AddToCart error:', err);
	}

	// 4. Google Analytics / GA4 / Google Ads (gtag)
	try {
		if (typeof (window as any).gtag === 'function') {
			(window as any).gtag('event', 'add_to_cart', {
				currency: 'MAD',
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
	const storageKey = `tracked_order_${txnId}`;
	try {
		if (
			sessionStorage.getItem(storageKey) ||
			localStorage.getItem(storageKey) ||
			sessionStorage.getItem(`snap_order_${txnId}`) ||
			sessionStorage.getItem(`snap_purchased_${txnId}`)
		) {
			console.log('[Tracking] Purchase already tracked for transaction:', txnId);
			return; // Already tracked for this transaction
		}
		sessionStorage.setItem(storageKey, 'true');
		localStorage.setItem(storageKey, 'true');
		sessionStorage.setItem(`snap_order_${txnId}`, 'true');
	} catch {
		// storage fallback
	}

	// 1. Google Tag Manager / GA4 dataLayer event (Standard e-commerce schema)
	try {
		(window as any).dataLayer = (window as any).dataLayer || [];
		(window as any).dataLayer.push({
			event: 'purchase',
			ecommerce: {
				transaction_id: txnId,
				value: numPrice,
				currency: 'MAD',
				items: [
					{
						item_name: title,
						price: numPrice,
						quantity: 1
					}
				]
			}
		});
	} catch (err) {
		console.warn('[Tracking] dataLayer purchase error:', err);
	}

	// 2. Snapchat Pixel
	try {
		if (typeof (window as any).snaptr === 'function') {
			(window as any).snaptr('track', 'PURCHASE', {
				price: numPrice,
				currency: 'MAD',
				transaction_id: txnId
			});
		}
	} catch (err) {
		console.warn('[Pixel] Snap PURCHASE error:', err);
	}

	// 3. Meta / Facebook Pixel
	try {
		if (typeof (window as any).fbq === 'function') {
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

	// 4. Google Analytics / GA4 / Google Ads (gtag)
	try {
		if (typeof (window as any).gtag === 'function') {
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

/** Dual-storage order submission: saves to in-app storage via /api/orders and Google Sheets in parallel. */
export async function sendOrder(payload: Record<string, unknown>, sheetsUrl?: string): Promise<void> {
	const inAppPromise = fetch('/api/orders', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload)
	})
		.then((r) => r.json())
		.catch((err) => {
			console.warn('[Orders] In-app save warning:', err);
			return null;
		});

	const sheetsPromise = sheetsUrl
		? fetch(sheetsUrl, {
				method: 'POST',
				mode: 'no-cors',
				headers: { 'Content-Type': 'text/plain;charset=utf-8' },
			body: JSON.stringify(payload)
			})
				.then(() => undefined)
				.catch((err) => {
					console.warn('[Orders] Sheets webhook warning:', err);
					return undefined;
				})
		: Promise.resolve();

	await Promise.allSettled([inAppPromise, sheetsPromise]);
}
