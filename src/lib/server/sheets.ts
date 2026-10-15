import { readSettings } from '$lib/content/settings';
import { buildOrderFulfillmentLabel } from '$lib/data/products';
import {
	formatCasablancaDisplayDateTime,
	formatCasablancaDateTime,
	normalizeMoroccanPhone,
	resolveSpaceSellerSku,
	resolveSpaceSellerNote,
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

		// Format exact timestamp in Casablanca time: DD/MM/YYYY HH:mm:ss (Col A)
		const dateOrder = formatCasablancaDisplayDateTime(
			order.createdAt ? new Date(order.createdAt) : new Date()
		);

		const customerName = String(order.fullName || order.name || '').trim();
		const rawPhone = String(order.phoneNumber || order.phone || '').trim();
		const customerPhone = normalizeMoroccanPhone(rawPhone);

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

		// Col D (address): Empty string "" (or explicit address if customer actually provided one)
		const rawAddr = String(order.address || order.city || '').trim();
		const address =
			rawAddr &&
			rawAddr !== 'تحدد عند التأكيد' &&
			rawAddr !== 'يُحدد عند التأكيد' &&
			rawAddr !== 'تحدد عند الاتصال'
				? rawAddr
				: '';

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

		// Col G (price): Numeric total calculated price (e.g. 298 for Collagen + Upsell, 279 for base)
		const { totalPrice: calculatedTotal } = calculateOrderTotals({
			tier: order.tier,
			items: itemsList,
			hasUpsell: Boolean(order.hasUpsell),
			rawTotal: Number(order.totalPrice ?? order.total ?? order.price ?? 0)
		});
		const totalPrice = calculatedTotal || Number(order.totalPrice ?? order.total ?? order.price ?? 279);

		// Col H (note): Order ID + Arabic Title / Upsell breakdown
		// Format: "NV-815421 | عرض كولاجين + أبسيل (99 DH)" or "NV-815421 | NOVAVITA كولاجين..."
		const upsellNote = resolveSpaceSellerNote({
			mainSku: order.sku || order.mainSku,
			productLabel,
			items: itemsList,
			hasUpsell: Boolean(order.hasUpsell),
			tier: order.tier
		});
		const noteDetails = order.hasUpsell
			? upsellNote
			: (productLabel && productLabel !== 'NOVAVITA Gummies' ? productLabel : upsellNote);
		const orderNotesPart = order.notes && String(order.notes).trim() ? ` | ${String(order.notes).trim()}` : '';
		const orderIdNotes = orderId ? `${orderId} | ${noteDetails}${orderNotesPart}` : `${noteDetails}${orderNotesPart}`;

		// Col I (delivery_note): "الدفع عند الاستلام"
		const deliveryNote = 'الدفع عند الاستلام';

		// Mandatory 9-column array strictly aligned from Column A to Column I
		const row = [
			dateOrder,     // Col A: date_order (e.g. "15/10/2026 14:51:48")
			customerName,  // Col B: full_name (e.g. "Test") — NOT the order ID!
			customerPhone, // Col C: phone (e.g. "0646466464")
			address,       // Col D: address (leave empty string "" or placeholder)
			exactSku,      // Col E: exact SKU code (e.g. "pack-collagen-gummies-3")
			1,             // Col F: quantity (always 1)
			totalPrice,    // Col G: numeric total price (e.g. 279 or 298)
			orderIdNotes,  // Col H: Order ID + notes (e.g. "NV-815421 | عرض كولاجين + أبسيل")
			deliveryNote   // Col I: delivery note ("الدفع عند الاستلام")
		];

		const sheetsPayload = {
			// 1. Direct 9-column SpaceSeller array (Col A to I)
			row,
			rowData: row,
			values: row,

			// 2. SpaceSeller exact 9 named keys
			date_order: dateOrder,
			full_name: customerName,
			phone: customerPhone,
			address,
			sku: exactSku,
			qte: 1,
			price: totalPrice,
			note: orderIdNotes,
			delivery_note: deliveryNote,

			// 3. Dual-compatibility positional mappings for legacy Google Apps Script:
			// If legacy script maps Col B to data.orderId -> provide customerName!
			orderId: customerName,
			id: customerName,

			// If legacy script maps Col C to data.name / data.fullName -> provide customerPhone!
			name: customerPhone,
			fullName: customerPhone,

			// If legacy script maps Col D to data.phone / data.phoneNumber -> provide address ("")!
			phoneNumber: address,

			// If legacy script maps Col E to data.product / data.productTitle -> provide exactSku!
			product: exactSku,
			productTitle: exactSku,
			selectedOfferTitle: exactSku,

			// If legacy script maps Col F to data.quantity -> provide 1!
			quantity: 1,

			// If legacy script maps Col G to data.total / data.totalPrice -> provide totalPrice!
			total: totalPrice,
			totalPrice: totalPrice,

			// If legacy script maps Col H to data.notes / data.note -> provide orderIdNotes!
			notes: orderIdNotes,

			// 4. Safe internal metadata (preserved for debugging / audits)
			realOrderId: orderId,
			actualOrderId: orderId,
			actualFullName: customerName,
			actualPhone: customerPhone,
			marketingProductTitle: productLabel,
			items: itemsList,
			pack_slug: exactSku.startsWith('pack-') ? exactSku : undefined,
			pack_id: exactSku === 'pack-collagen-gummies-3' ? 3498 : undefined,
			hasUpsell: Boolean(order.hasUpsell),
			status: 'طلب جديد - في انتظار التأكيد'
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
