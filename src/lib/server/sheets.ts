import { readSettings } from '$lib/content/settings';

export const DEFAULT_SHEETS_WEBHOOK_URL =
	'https://script.google.com/macros/s/AKfycbyQVUxZSp39uvD07JYBhuQLChWPwRRyyOhXT9iGoHvoJ1ge_SjPk0rqtIwPcF6_ksO7iQ/exec';

/**
 * Resolves the active Google Sheets webhook URL in priority order:
 * 1. Explicit customUrl parameter
 * 2. Environment variable GOOGLE_SHEET_WEBHOOK_URL / GOOGLE_SHEETS_URL
 * 3. Settings commerce.googleSheetsUrl
 * 4. Production fallback default constant
 */
export async function getSheetsWebhookUrl(customUrl?: string): Promise<string> {
	if (customUrl && typeof customUrl === 'string' && customUrl.trim().startsWith('http')) {
		return customUrl.trim();
	}

	const envUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL || process.env.GOOGLE_SHEETS_URL;
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
			order.id || order.orderId || 'ORD-' + Math.floor(100000 + Math.random() * 900000)
		).trim();

		const nowIso = new Date().toISOString();
		const dateStr = order.createdAt || order.date || nowIso;

		const fullName = String(order.fullName || order.name || 'زبون').trim();
		const phone = String(order.phone || order.phoneNumber || '').trim();
		const city = String(order.city || 'يُحدد عند التأكيد').trim();
		const address = String(order.address || order.city || 'يُحدد عند التأكيد').trim();
		const product = String(order.product || order.productTitle || order.offer || 'منتج المتجر').trim();

		const quantity = Number(order.quantity ?? order.qte ?? 1) || 1;
		const total = Number(order.totalPrice ?? order.price ?? order.total ?? 229) || 229;
		const status = String(order.status || 'جديد').trim();

		const payload = {
			orderId,
			date: dateStr,
			name: fullName,
			phone,
			city,
			address,
			product,
			quantity,
			total,
			status,
			// Aliases for maximum Google Apps Script compatibility
			fullName,
			phoneNumber: phone,
			totalPrice: total,
			price: total,
			qte: quantity,
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

		console.log('📊 Google Sheets Sync Response:', sheetsRes.status);

		return { ok: sheetsRes.ok, status: sheetsRes.status };
	} catch (err: any) {
		console.error('❌ Failed to sync order to Google Sheets:', err);
		return { ok: false, status: 500, error: err?.message || String(err) };
	}
}
