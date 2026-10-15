import { readSettings } from '$lib/content/settings';
import { buildOrderFulfillmentLabel } from '$lib/data/products';
import {
	formatCasablancaDisplayDateTime,
	formatCasablancaDateTime,
	normalizeMoroccanPhone,
	resolveSpaceSellerSku,
	resolveSpaceSellerNote,
	buildSpaceSellerConfirmationNote,
	calculateOrderTotals
} from '$lib/server/spaceseller';

export const DEFAULT_SHEETS_WEBHOOK_URL =
	'https://script.google.com/macros/s/AKfycbw_IupQuynkwQCrYJNyYdbDhq3R_Ab1DoMkcknXZ9C9vRKYVzJefYKUKN9RSJKOjWWLhQ/exec';

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

/**
 * Sends an order to Google Sheets via the Apps Script Webhook.
 * Guaranteed single-dispatch, zero-duplication, with full payload contract.
 */
export async function sendOrderToGoogleSheets(
	order: Record<string, any>,
	customUrl?: string
): Promise<{ ok: boolean; status: number; error?: string; skipped?: boolean }> {
	try {
		const orderId = String(
			order.id || order.orderId || ('ORD-' + Math.floor(100000 + Math.random() * 900000))
		).trim();

		// STRICT DEDUPLICATION GUARD: If already synced or marked as synced, skip immediately
		if (order.sheetsSynced || (orderId && syncedOrderIds.has(orderId))) {
			console.log(`🛡️ [Google Sheets Deduplication] Order ${orderId} already synced. Skipping duplicate dispatch.`);
			return { ok: true, status: 200, skipped: true };
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

		// Format exact timestamp in Casablanca time: YYYY-MM-DD HH:mm:ss (Col A)
		const dateOrder = formatCasablancaDateTime(
			order.createdAt ? new Date(order.createdAt) : new Date()
		);

		const customerName = String(order.fullName || order.name || '').trim();
		const rawPhone = String(order.phoneNumber || order.phone || '').trim();
		const customerPhone = normalizeMoroccanPhone(rawPhone);
		// Prepend ' so Google Sheets forces text format and preserves the leading zero (e.g. '0646466464)
		const sheetPhone = customerPhone.startsWith('0') ? `'${customerPhone}` : `'0${customerPhone.replace(/^'+/, '')}`;

		let rawItems = order.items;
		if (typeof rawItems === 'string') {
			try {
				const parsed = JSON.parse(rawItems);
				if (Array.isArray(parsed)) rawItems = parsed;
			} catch {}
		}
		const itemsList = Array.isArray(rawItems) ? rawItems : [];

		let productLabel = String(
			order.selectedOfferTitle ||
			(order.offer && order.productTitle && order.offer.trim() && order.offer.trim() !== order.productTitle.trim()
				? `${order.productTitle} (${order.offer})`
				: order.offer) ||
			order.productTitle ||
			order.product ||
			'NOVAVITA Gummies'
		).trim();

		// Fail-safe: If productLabel contains generic 'علبة العرض الخاطف' or is missing specific upsell, rebuild it
		if (
			productLabel.includes('علبة العرض الخاطف') ||
			(order.hasUpsell && !productLabel.includes('(العرض الخاطف)'))
		) {
			productLabel = buildOrderFulfillmentLabel({
				tier: order.tier,
				mainSku: order.sku || order.mainSku,
				mainTitle: productLabel,
				items: itemsList,
				hasUpsell: Boolean(order.hasUpsell)
			});
		}

		// Col D (address placeholder): strictly "سيتم التأكيد عبر الهاتف" to prevent phone duplication
		const addressPlaceholder = 'سيتم التأكيد عبر الهاتف';

		// Col E (sku): Exact SKU code
		// * If Collagen + Upsell: "pack-collagen-gummies-3"
		// * If Collagen base offer: "gummies_collagen"
		// * If Biotine base offer: "gummies_biotine"
		// * If Multivitamins base offer: "gumies_vitamine"
		const exactSku = resolveSpaceSellerSku({
			mainSku: order.sku || order.mainSku,
			productLabel,
			items: itemsList,
			hasUpsell: Boolean(order.hasUpsell)
		});

		// Col F (qte): 1 (integer: always 1 for packs and single base offers)
		const qte = 1;

		// Col G (price): Numeric total calculated price (e.g. 298 / 378 / 448 for Collagen + Upsell, 279 for base)
		const { totalPrice: calculatedTotal } = calculateOrderTotals({
			tier: order.tier,
			items: itemsList,
			hasUpsell: Boolean(order.hasUpsell),
			rawTotal: Number(order.totalPrice ?? order.total ?? order.price ?? 0)
		});
		const totalPrice = calculatedTotal || Number(order.totalPrice ?? order.total ?? order.price ?? 279);

		// Col H (note): Full confirmation note with tier, upsell, total price and order ID
		// Format: "باقة 3 علب كولاجين + أبسيل بيوتين (99 DH) | المجموع: 448 DH | NV-815421"
		const confirmationNote = buildSpaceSellerConfirmationNote({
			orderId,
			tier: order.tier,
			mainSku: order.sku || order.mainSku,
			productLabel,
			items: itemsList,
			hasUpsell: Boolean(order.hasUpsell),
			totalPrice,
			customerNote: order.notes
		});

		// Mandatory 9-column array strictly aligned from Column A to Column I
		const row = [
			dateOrder,          // Col A: date_order (e.g. "2026-10-15 14:18:37")
			customerName,       // Col B: full_name (e.g. "Test")
			sheetPhone,         // Col C: phone (e.g. "'0646466464" - preserves leading 0)
			addressPlaceholder, // Col D: address ("سيتم التأكيد عبر الهاتف")
			exactSku,           // Col E: exact SKU code (e.g. "pack-collagen-gummies-3")
			1,                  // Col F: quantity (always 1)
			totalPrice,         // Col G: numeric total price (e.g. 448)
			confirmationNote,   // Col H: Confirmation note (e.g. "باقة 3 علب كولاجين + أبسيل بيوتين (99 DH) | المجموع: 448 DH | NV-815421")
			confirmationNote    // Col I: delivery note / confirmation
		];

		const sheetsPayload = {
			// 1. Direct 9-column SpaceSeller array (Col A to I)
			row,
			rowData: row,
			values: row,

			// 2. SpaceSeller exact 9 named keys
			date_order: dateOrder,
			full_name: customerName,
			phone: addressPlaceholder, // CRITICAL: Sets phone to placeholder so legacy Apps Script doesn't write phone to Col D!
			customer_phone: sheetPhone,
			client_phone: sheetPhone,
			address: addressPlaceholder,
			sku: exactSku,
			qte: 1,
			price: totalPrice,
			note: confirmationNote,
			delivery_note: confirmationNote,

			// 3. Positional mappings for legacy Google Apps Script:
			// Col A: date
			date: dateOrder,
			orderDate: dateOrder,

			// Col B: Apps Script reads data.orderId / data.id -> provide customerName
			orderId: customerName,
			id: customerName,

			// Col C: Apps Script reads data.name / data.fullName -> provide sheetPhone (with ' prefix)
			name: sheetPhone,
			fullName: sheetPhone,

			// Col D: Apps Script reads data.phone / data.phoneNumber / data.address -> MUST BE addressPlaceholder!
			phoneNumber: addressPlaceholder,

			// Col E: Apps Script reads data.product / data.productTitle / data.sku -> provide exactSku
			product: exactSku,
			productTitle: exactSku,
			selectedOfferTitle: exactSku,

			// Col F: Apps Script reads data.quantity / data.qte -> provide 1
			quantity: 1,

			// Col G: Apps Script reads data.total / data.totalPrice / data.price -> provide totalPrice
			total: totalPrice,
			totalPrice: totalPrice,

			// Col H: Populate ALL candidate keys (status, city, notes, comment, etc.) with confirmationNote!
			notes: confirmationNote,
			status: confirmationNote,
			city: confirmationNote,
			comment: confirmationNote,
			comments: confirmationNote,
			order_note: confirmationNote,
			note_order: confirmationNote,
			details: confirmationNote,

			// 4. Safe internal metadata (preserved for debugging / audits)
			realOrderId: orderId,
			actualOrderId: orderId,
			actualFullName: customerName,
			actualPhone: customerPhone,
			actualPhoneWithPrefix: sheetPhone,
			marketingProductTitle: productLabel,
			items: itemsList,
			pack_slug: exactSku.startsWith('pack-') ? exactSku : undefined,
			pack_id: exactSku === 'pack-collagen-gummies-3' ? 3498 : undefined,
			hasUpsell: Boolean(order.hasUpsell)
		};

		console.log('📦 Sent Sheets Payload (9-column SpaceSeller aligned):', sheetsPayload);

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
