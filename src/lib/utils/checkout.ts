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

export function trackPurchase(price: number, productTitle: string) {
	if (typeof window === 'undefined') return;
	if ((window as any).fbq) {
		(window as any).fbq('track', 'Purchase', { value: price, currency: 'MAD', content_name: productTitle });
	}
	if ((window as any).ttq) {
		(window as any).ttq.track('CompletePayment', { value: price, currency: 'MAD', content_name: productTitle });
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
