/**
 * Space Seller Leads API Client for NOVAVITA
 * Specification: docs/04_Tech_Stack_and_API_Integration.md
 */

export interface SpaceSellerProductItem {
	sku: string;
	quantity: number;
	price: number;
}

export interface SpaceSellerLeadPayload {
	name: string;
	phone: string;
	city?: string;
	address?: string;
	note?: string;
	products: SpaceSellerProductItem[];
}

export interface SpaceSellerResult {
	ok: boolean;
	status: number;
	error?: string;
	skipped?: boolean;
}

/**
 * Sends a lead order to Space Seller Leads API with retry and exponential backoff
 */
export async function sendOrderToSpaceSeller(
	payload: SpaceSellerLeadPayload,
	retries = 2,
	delayMs = 1000
): Promise<SpaceSellerResult> {
	const apiUrl = process.env.SPACE_SELLER_API_URL || 'https://drop.spaceseller.ma/api/v1/leads';
	const apiToken = process.env.SPACE_SELLER_API_TOKEN;

	if (!apiToken || apiToken === 'YOUR_SPACE_SELLER_TOKEN_HERE') {
		console.warn('⚠️ [Space Seller] Token not configured or placeholder. Skipping API dispatch.');
		return { ok: false, status: 0, skipped: true, error: 'Token not configured' };
	}

	for (let attempt = 1; attempt <= retries + 1; attempt++) {
		try {
			console.log(`📡 [Space Seller] Sending lead attempt ${attempt}/${retries + 1}...`, {
				url: apiUrl,
				name: payload.name,
				phone: payload.phone,
				itemCount: payload.products.length
			});

			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 6000);

			const response = await fetch(apiUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Accept: 'application/json',
					Authorization: `Bearer ${apiToken}`
				},
				body: JSON.stringify(payload),
				signal: controller.signal
			});

			clearTimeout(timeoutId);

			if (response.ok) {
				console.log(`✅ [Space Seller] Lead successfully created! Status: ${response.status}`);
				return { ok: true, status: response.status };
			}

			const errText = await response.text().catch(() => '');
			console.warn(`⚠️ [Space Seller] Attempt ${attempt} failed with status ${response.status}:`, errText);

			// Don't retry on client validation errors (4xx) except 429
			if (response.status >= 400 && response.status < 500 && response.status !== 429) {
				return { ok: false, status: response.status, error: errText };
			}
		} catch (err: any) {
			console.warn(`⚠️ [Space Seller] Network error on attempt ${attempt}:`, err?.message || err);
		}

		if (attempt <= retries) {
			await new Promise((r) => setTimeout(r, delayMs * attempt));
		}
	}

	return { ok: false, status: 500, error: 'Failed after retries' };
}
