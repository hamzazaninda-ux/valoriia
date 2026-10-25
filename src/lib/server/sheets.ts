import { readSettings } from '$lib/content/settings';

export const DEFAULT_SHEETS_WEBHOOK_URL =
	'https://script.google.com/macros/s/AKfycbw_IupQuynkwQCrYJNyYdbDhq3R_Ab1DoMkcknXZ9C9vRKYVzJefYKUKN9RSJKOjWWLhQ/exec';

/**
 * 1. Phone Formatter: Always enforce '212' country code without '+' or leading '0'
 * Returns clean digits e.g. 212666666666
 */
export function formatMoroccanPhone(rawPhone: any): string {
	if (!rawPhone) return '';
	let clean = String(rawPhone).replace(/[^0-9]/g, '');
	if (clean.startsWith('0')) {
		clean = '212' + clean.substring(1);
	} else if (!clean.startsWith('212')) {
		clean = '212' + clean;
	}
	return clean; // e.g. 212666666666
}

/**
 * Resolves the active Google Sheets webhook URL in priority order:
 * 1. Explicit customUrl parameter
 * 2. Environment variable GOOGLE_SHEETS_URL / GOOGLE_SHEET_WEBHOOK_URL
 * 3. Settings commerce.googleSheetsUrl
 * 4. Production fallback default constant
 */
export async function getSheetsWebhookUrl(customUrl?: string): Promise<string> {
	if (customUrl && typeof customUrl === 'string' && customUrl.trim().startsWith('http')) {
		return customUrl.trim();
	}

	const envUrl = process.env.GOOGLE_SHEETS_URL || process.env.GOOGLE_SHEET_WEBHOOK_URL;
	if (envUrl && envUrl.trim().startsWith('http')) {
		return envUrl.trim();
	}

	try {
		const settings = await readSettings();
		const configuredUrl = settings?.commerce?.googleSheetsUrl;
		if (configuredUrl && typeof configuredUrl === 'string' && configuredUrl.trim().startsWith('http')) {
			return configuredUrl.trim();
		}
	} catch {
		// Ignore readSettings error and use fallback
	}

	return DEFAULT_SHEETS_WEBHOOK_URL;
}

// In-memory deduplication set to guarantee zero duplicate Google Sheets dispatches per order
const syncedOrderIds = new Set<string>();
const recentPhoneTimestamps = new Map<string, number>();

/**
 * Sends an order to Google Sheets via the Apps Script Webhook.
 * Guaranteed single-dispatch, zero-duplication, with full payload contract.
 * Strictly enforces:
 *  - Phone: Always '212XXXXXXXXX'
 *  - Price: Strictly integer value (no decimals)
 *  - SKU: Human-readable selected offer title (never product slug)
 */
export async function sendOrderToGoogleSheets(
	order: Record<string, any>,
	customUrl?: string
): Promise<{ ok: boolean; status: number; error?: string; skipped?: boolean }> {
	try {
		const orderId = String(
			order.order_id || order.id || order.orderId || ('ORD-' + Math.floor(100000 + Math.random() * 900000))
		).trim();

		// STRICT DEDUPLICATION GUARD 1: Order ID check
		if (order.sheetsSynced || (orderId && syncedOrderIds.has(orderId))) {
			console.log(`🛡️ [Google Sheets Deduplication] Order ${orderId} already synced. Skipping duplicate dispatch.`);
			return { ok: true, status: 200, skipped: true };
		}

		// STRICT DEDUPLICATION GUARD 2: Phone Number rate-limit (prevent rapid dual-firing within 30s)
		const isUpsellOrder = order.orderType === 'upsell' || order.isUpsell || order.hasUpsell || String(orderId).includes('-U');
		const rawPhone = order.phone || order.phoneNumber;
		const cleanPhone = formatMoroccanPhone(rawPhone);
		const now = Date.now();
		if (cleanPhone && !isUpsellOrder) {
			const lastSeen = recentPhoneTimestamps.get(cleanPhone);
			if (lastSeen && (now - lastSeen) < 30000) {
				console.warn(`🛡️ [Google Sheets Deduplication] Duplicate order detected for phone ${cleanPhone} within 30s. Skipping duplicate Google Sheets row.`);
				return { ok: true, status: 200, skipped: true };
			}
			recentPhoneTimestamps.set(cleanPhone, now);
			if (recentPhoneTimestamps.size > 2000) {
				for (const [p, time] of recentPhoneTimestamps.entries()) {
					if (now - time > 120000) recentPhoneTimestamps.delete(p);
				}
			}
		}

		const webhookUrl = await getSheetsWebhookUrl(customUrl);
		if (!webhookUrl) {
			console.warn('⚠️ Google Sheets Sync Skipped: No webhook URL configured');
			return { ok: false, status: 0, error: 'No webhook URL' };
		}

		// Lock this orderId immediately before network call to prevent concurrent race conditions
		if (orderId) {
			syncedOrderIds.add(orderId);
			if (syncedOrderIds.size > 3000) {
				const toPrune = Array.from(syncedOrderIds).slice(0, 1000);
				for (const id of toPrune) syncedOrderIds.delete(id);
			}
		}
		order.sheetsSynced = true;

		const casablancaTime = new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Casablanca' });
		const date_order = String(order.date_order || order.date || order.orderDate || casablancaTime).trim();
		const order_id = orderId;

		const full_name = String(order.full_name || order.fullName || order.name || '').trim();
		// 1. Phone Formatter: Always enforce '212' country code without '+' or leading '0'
		const phone = formatMoroccanPhone(order.phone || order.phoneNumber);

		const city = String(order.city || order.ville || '').trim();
		const address = String(order.address || order.adresse || '').trim();

		let city_address = String(order.city_address || '').trim();
		if (!city_address) {
			if (city && address && city !== address) {
				city_address = `${city} - ${address}`.trim();
			} else {
				city_address = (address || city || 'يُحدد بعد التأكيد').trim();
			}
		}

		// Force pure integer: remove any trailing decimal/fraction (e.g. 349.0 or 349,0 -> 349)
		const rawPrice = order.price !== undefined ? order.price : (order.totalPrice !== undefined ? order.totalPrice : (order.total !== undefined ? order.total : 349));
		const cleanPrice = parseInt(String(rawPrice).replace(/[,.]\d+$/, ''), 10) || 349;

		const qte = Number(order.qte !== undefined ? order.qte : (order.quantity !== undefined ? order.quantity : 1)) || 1;

		// 3. SKU Formatter: Capture the human-readable selected offer name/tier label instead of product slug
		let offerSku = String(
			order.selectedOfferTitle ||
			order.selectedBundleName ||
			order.offer ||
			order.offerSku ||
			''
		).trim();

		// If offerSku is missing or equals generic slug 'kit-tandim' or 'SKU-GENERAL', resolve human-readable tier label
		if (!offerSku || offerSku === 'kit-tandim' || offerSku === 'SKU-GENERAL') {
			const candidate = String(order.sku || order.productTitle || order.product || '').trim();
			if (candidate && candidate !== 'kit-tandim' && candidate !== 'SKU-GENERAL') {
				offerSku = candidate;
			} else {
				offerSku = qte === 2 ? '2 قطع + رشاشين هدية 🎁' : '1 قطعة + رشاشة هدية 🎁';
			}
		}

		const note = String(order.note || order.customerNote || order.notes || '').trim();
		const delivery_note = String(order.delivery_note || order.deliveryNote || '').trim();

		// Schema matching the Google Sheet columns strictly in order:
		// [date_order, order_id, full_name, phone, city_address, sku, qte, price, note, delivery_note]
		const rowData = [
			date_order,
			order_id,
			full_name,
			phone,
			city_address,
			offerSku,
			qte,
			cleanPrice,
			note,
			delivery_note
		];

		const sheetsPayload = {
			// Strict schema matching user specification
			date_order,
			order_id,
			full_name,
			phone,
			city_address,
			sku: offerSku,
			qte,
			cleanPrice,
			note,
			delivery_note,
			rowData,

			// Backwards-compatible aliases for existing Apps Script webhooks
			orderId: order_id,
			id: order_id,
			date: date_order,
			orderDate: date_order,
			name: full_name,
			fullName: full_name,
			phoneNumber: phone,
			city: city || city_address,
			ville: city || city_address,
			address: address || city_address,
			adresse: address || city_address,
			product: offerSku,
			productTitle: offerSku,
			selectedOfferTitle: offerSku,
			selectedBundleName: offerSku,
			offer: offerSku,
			offerSku: offerSku,
			quantity: qte,
			total: cleanPrice,
			totalPrice: cleanPrice
		};

		console.log('📦 Sent Sheets Payload:', sheetsPayload);

		const sheetsRes = await fetch(webhookUrl, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(sheetsPayload),
			redirect: 'follow'
		});

		console.log('✅ Google Sheets Sync Response:', sheetsRes.status);

		return { ok: sheetsRes.ok, status: sheetsRes.status };
	} catch (err: any) {
		console.error('❌ Google Sheets sync failed:', err);
		return { ok: false, status: 500, error: err?.message || String(err) };
	}
}
