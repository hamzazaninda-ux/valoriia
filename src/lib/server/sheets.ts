import { readSettings } from '$lib/content/settings';

export const DEFAULT_SHEETS_WEBHOOK_URL =
	'https://script.google.com/macros/s/AKfycbzc4gOxOF95fqO9f0X0iEPhA_MRkqvF9hOV_xNI9W_B5TLFn6H89GY0l8_mks6nTIIYZg/exec';

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

/**
 * Sends an order to Google Sheets via the Apps Script Webhook.
 * Guaranteed follow-redirects, zero crashing, with structured dual-contract payload.
 */
export async function sendOrderToGoogleSheets(
	order: Record<string, any>,
	customUrl?: string
): Promise<{ ok: boolean; status: number; error?: string }> {
	try {
		const webhookUrl = await getSheetsWebhookUrl(customUrl);
		if (!webhookUrl) {
			console.warn('⚠️ Google Sheets Sync Skipped: No webhook URL configured');
			return { ok: false, status: 0, error: 'No webhook URL' };
		}

		const orderId = String(
			order.id || order.orderId || ('ORD-' + Math.floor(100000 + Math.random() * 900000))
		).trim();

		const casablancaDate = new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Casablanca' });
		const dateStr = order.date || casablancaDate;

		const fullName = String(order.fullName || order.name || '').trim();
		const phone = String(order.phoneNumber || order.phone || '').trim();
		const city = String(order.city || '').trim();
		const address = String(order.address || '').trim();
		const productTitle = String(
			order.productTitle || order.product || order.offer || 'طقم التنظيم المنزلي'
		).trim();

		const quantity = Number(order.quantity ?? order.qte ?? 1) || 1;
		const price = order.totalPrice ?? order.total ?? order.price ?? 229;
		const status = String(order.status || 'جديد').trim();

		const payload = {
			orderId,
			date: dateStr,
			fullName,
			phoneNumber: phone,
			city,
			address,
			productTitle,
			quantity,
			price,
			// Aliases for 100% Google Apps Script compatibility
			name: fullName,
			phone,
			product: productTitle,
			totalPrice: price,
			total: price,
			qte: quantity,
			status,
			sku: order.sku || '',
			pageUrl: order.pageUrl || '',
			items: typeof order.items === 'string' ? order.items : JSON.stringify(order.items || []),
			notes: order.notes || ''
		};

		const sheetsRes = await fetch(webhookUrl, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload),
			redirect: 'follow'
		});

		console.log('✅ Google Sheets Sync Response:', sheetsRes.status);

		return { ok: sheetsRes.ok, status: sheetsRes.status };
	} catch (err: any) {
		console.error('❌ Google Sheets sync failed:', err);
		return { ok: false, status: 500, error: err?.message || String(err) };
	}
}
