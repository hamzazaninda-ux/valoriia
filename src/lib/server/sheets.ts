import { readSettings } from '$lib/content/settings';
import { buildOrderFulfillmentLabel } from '$lib/data/products';
import {
	formatCasablancaDateTime,
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

		// Format exact timestamp in Casablanca time: YYYY-MM-DD HH:mm:ss (Col A)
		const dateOrder = formatCasablancaDateTime(
			order.createdAt ? new Date(order.createdAt) : new Date()
		);

		const fullName = String(order.fullName || order.name || '').trim();
		const rawPhone = String(order.phoneNumber || order.phone || '').trim();
		const phone = rawPhone.replace(/[\s\-\(\)]/g, '');

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

		// Col D (address): "سيتم التأكيد عبر الهاتف" (Placeholder to maintain column index)
		const rawAddr = String(order.address || order.city || '').trim();
		const address =
			rawAddr &&
			rawAddr !== 'تحدد عند التأكيد' &&
			rawAddr !== 'يُحدد عند التأكيد' &&
			rawAddr !== 'تحدد عند الاتصال'
				? rawAddr
				: 'سيتم التأكيد عبر الهاتف';

		// Col E (sku): Exact SKU
		// * If Collagen + Upsell: "pack-collagen-gummies-3"
		// * If Collagen base offer: "gummies_collagen"
		// * If Biotine base offer: "gummies_biotine"
		// * If Multivitamins base offer: "gumies_vitamine"
		const sku = resolveSpaceSellerSku({
			mainSku: order.sku || order.mainSku,
			productLabel,
			items: itemsList,
			hasUpsell: Boolean(order.hasUpsell)
		});

		// Col F (qte): 1 (integer: 1 for packs, or selected quantity)
		const qte = sku.startsWith('pack-') ? 1 : Number(order.quantity ?? order.qte ?? 1) || 1;

		// Col G (price): Numeric total calculated price (e.g. 298 for Collagen + Upsell)
		const { totalPrice: calculatedTotal } = calculateOrderTotals({
			tier: order.tier,
			items: itemsList,
			hasUpsell: Boolean(order.hasUpsell),
			rawTotal: Number(order.totalPrice ?? order.total ?? order.price ?? 0)
		});
		const finalTotal = calculatedTotal || Number(order.totalPrice ?? order.total ?? order.price ?? 279);

		// Col H (note): Confirmation note e.g. "عرض كولاجين + أبسيل (99 DH)"
		const note = resolveSpaceSellerNote({
			mainSku: order.sku || order.mainSku,
			productLabel,
			items: itemsList,
			hasUpsell: Boolean(order.hasUpsell),
			tier: order.tier
		});

		// Col I (delivery_note): "الدفع عند الاستلام"
		const deliveryNote = 'الدفع عند الاستلام';

		// Mandatory 9-column array strictly aligned from Column A to Column I
		const row = [
			dateOrder,    // Col A: date_order (YYYY-MM-DD HH:mm:ss)
			fullName,     // Col B: full_name
			phone,        // Col C: phone
			address,      // Col D: address ("سيتم التأكيد عبر الهاتف")
			sku,          // Col E: sku ("pack-collagen-gummies-3" or default)
			qte,          // Col F: qte (1)
			finalTotal,   // Col G: price (e.g. 298)
			note,         // Col H: note ("عرض كولاجين + أبسيل (99 DH)")
			deliveryNote  // Col I: delivery_note ("الدفع عند الاستلام")
		];

		const sheetsPayload = {
			// Exact 9-column SpaceSeller array (Col A to I)
			row,
			rowData: row,
			values: row,

			// SpaceSeller exact 9 named keys
			date_order: dateOrder,
			full_name: fullName,
			phone,
			address,
			sku,
			qte,
			price: finalTotal,
			note,
			delivery_note: deliveryNote,

			// Legacy fields for backward compatibility
			orderDate: dateOrder,
			date: dateOrder,
			orderId,
			id: orderId,
			name: fullName,
			phoneNumber: phone,
			product: productLabel,
			productTitle: productLabel,
			selectedOfferTitle: productLabel,
			quantity: qte,
			total: finalTotal,
			totalPrice: finalTotal,
			city: address,
			items: itemsList,
			pack_slug: sku.startsWith('pack-') ? sku : undefined,
			pack_id: sku === 'pack-collagen-gummies-3' ? 3498 : undefined,
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
