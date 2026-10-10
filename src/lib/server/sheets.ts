import { readSettings } from '$lib/content/settings';

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

		const generatedOrderId = String(
			order.id || order.orderId || ('ORD-' + Math.floor(100000 + Math.random() * 900000))
		).trim();

		const casablancaTime = new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Casablanca' });
		const dateStr = order.date || order.orderDate || casablancaTime;

		const fullName = String(order.fullName || order.name || '').trim();
		const phone = String(order.phoneNumber || order.phone || '').trim();
		const product = String(
			order.productTitle || order.product || order.offer || 'طقم التنظيم المنزلي'
		).trim();

		const quantity = Number(order.quantity ?? order.qte ?? 1) || 1;
		const finalTotal = Number(order.totalPrice ?? order.total ?? order.price ?? 0);

		const sheetsPayload = {
			orderDate: dateStr,
			date: dateStr,
			orderId: generatedOrderId,
			id: generatedOrderId,
			name: fullName,
			fullName: fullName,
			phone: phone,
			phoneNumber: phone,
			product: product,
			productTitle: product,
			quantity: quantity,
			qte: quantity,
			total: finalTotal,
			totalPrice: finalTotal,
			price: finalTotal
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
