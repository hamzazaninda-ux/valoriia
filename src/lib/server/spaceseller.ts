/**
 * Space Seller Leads API Client for NOVAVITA
 * Specification: docs/04_Tech_Stack_and_API_Integration.md
 * 
 * Pack Configuration:
 * - Pack Name: Collagen gummies 3
 * - Pack ID: 3498
 * - Pack Slug / SKU: pack-collagen-gummies-3
 */

export const SPACESELLER_COLLAGEN_UPSELL_PACK = {
	name: 'Collagen gummies 3',
	id: 3498,
	slug: 'pack-collagen-gummies-3',
	sku: 'pack-collagen-gummies-3'
} as const;

export interface SpaceSellerProductItem {
	sku: string;
	quantity: number;
	price: number;
	name?: string;
	title?: string;
	pack_id?: number;
	pack_slug?: string;
	product_id?: number;
}

export interface SpaceSellerLeadPayload {
	name: string;
	phone: string;
	city?: string;
	address?: string;
	note?: string;
	sku?: string;
	pack_slug?: string;
	pack_id?: number;
	price?: number;
	total?: number;
	total_price?: number;
	products: SpaceSellerProductItem[];
	items?: SpaceSellerProductItem[];
}

export interface SpaceSellerResult {
	ok: boolean;
	status: number;
	error?: string;
	skipped?: boolean;
}

/**
 * Checks whether the order targets Collagen
 */
export function isCollagenOrder(options: {
	mainSku?: string;
	productLabel?: string;
	items?: any[];
}): boolean {
	const sku = String(options.mainSku || '').toLowerCase();
	if (sku.includes('collagen')) return true;

	const label = String(options.productLabel || '').toLowerCase();
	if (label.includes('collagen') || label.includes('كولاجين')) return true;

	if (Array.isArray(options.items)) {
		for (const it of options.items) {
			const itSku = String(it.sku || it.slug || '').toLowerCase();
			const itTitle = String(it.title || '').toLowerCase();
			if (itSku.includes('collagen') || itTitle.includes('collagen') || itTitle.includes('كولاجين')) {
				return true;
			}
		}
	}

	return false;
}

/**
 * Checks whether the order includes an upsell item/offer
 */
export function hasUpsellOrder(options: {
	hasUpsell?: boolean;
	items?: any[];
	productLabel?: string;
}): boolean {
	if (options.hasUpsell === true) return true;

	if (Array.isArray(options.items)) {
		if (
			options.items.some(
				(it: any) =>
					it.isUpsell === true ||
					(it.title &&
						(it.title.includes('عرض') ||
							it.title.includes('خاطف') ||
							it.title.includes('أبسيل') ||
							it.title.includes('سري')))
			)
		) {
			return true;
		}
	}

	const label = String(options.productLabel || '');
	if (label.includes('(العرض الخاطف)') || label.includes('+ أبسيل') || label.includes('+ علبة')) {
		return true;
	}

	return false;
}

/**
 * Accurately calculates baseOfferPrice, upsellPrice, and totalPrice
 * Formula: totalPrice = baseOfferPrice + upsellPrice (99 DH)
 * e.g., if base offer is 199 DH, total sent must be 298 DH
 */
export function calculateOrderTotals(options: {
	tier?: string;
	items?: any[];
	hasUpsell?: boolean;
	rawTotal?: number;
}): {
	baseOfferPrice: number;
	upsellPrice: number;
	totalPrice: number;
} {
	const hasUpsell = hasUpsellOrder(options);
	const upsellPrice = hasUpsell ? 99 : 0;

	let baseOfferPrice = 279; // Default tier_2

	if (options.tier === 'tier_1') {
		baseOfferPrice = 199;
	} else if (options.tier === 'tier_3') {
		baseOfferPrice = 349;
	} else if (options.tier === 'tier_2') {
		baseOfferPrice = 279;
	} else if (typeof options.rawTotal === 'number' && options.rawTotal > 0) {
		const r = options.rawTotal;
		if (r === 199 || r === 298) {
			baseOfferPrice = 199;
		} else if (r === 279 || r === 378) {
			baseOfferPrice = 279;
		} else if (r === 349 || r === 448) {
			baseOfferPrice = 349;
		} else if (hasUpsell && r > 99) {
			baseOfferPrice = r - 99;
		} else {
			baseOfferPrice = r;
		}
	} else if (Array.isArray(options.items) && options.items.length > 0) {
		const baseItems = options.items.filter((it: any) => !it.isUpsell);
		const sumBase = baseItems.reduce(
			(acc, it) => acc + Number(it.price || it.unitPrice || 0) * (it.quantity || it.qty || 1),
			0
		);
		if (sumBase > 0) {
			baseOfferPrice = sumBase;
		}
	}

	const totalPrice = baseOfferPrice + upsellPrice;

	return {
		baseOfferPrice,
		upsellPrice,
		totalPrice
	};
}

/**
 * Formats date strictly in Casablanca timezone as DD/MM/YYYY HH:mm:ss (SpaceSeller format)
 */
export function formatCasablancaDisplayDateTime(date: Date = new Date()): string {
	try {
		const parts = new Intl.DateTimeFormat('fr-FR', {
			timeZone: 'Africa/Casablanca',
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
			hour12: false
		}).formatToParts(date);

		const getPart = (type: string) => parts.find((p) => p.type === type)?.value || '00';
		return `${getPart('day')}/${getPart('month')}/${getPart('year')} ${getPart('hour')}:${getPart('minute')}:${getPart('second')}`;
	} catch {
		return date.toLocaleString('fr-FR', { timeZone: 'Africa/Casablanca' });
	}
}

/**
 * Normalizes phone numbers (ensures leading 0 for Moroccan 9-digit numbers)
 */
export function normalizeMoroccanPhone(raw: string): string {
	let cleaned = String(raw || '').trim().replace(/[\s\-\(\)]/g, '');
	cleaned = cleaned.replace(/^\+212/, '0').replace(/^00212/, '0').replace(/^212/, '0');
	if (/^[67]\d{8}$/.test(cleaned)) {
		return '0' + cleaned;
	}
	return cleaned;
}

/**
 * Formats date strictly in Casablanca timezone as YYYY-MM-DD HH:mm:ss
 */
export function formatCasablancaDateTime(date: Date = new Date()): string {
	try {
		const parts = new Intl.DateTimeFormat('en-CA', {
			timeZone: 'Africa/Casablanca',
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
			hour12: false
		}).formatToParts(date);

		const getPart = (type: string) => parts.find((p) => p.type === type)?.value || '00';
		return `${getPart('year')}-${getPart('month')}-${getPart('day')} ${getPart('hour')}:${getPart('minute')}:${getPart('second')}`;
	} catch {
		return date.toISOString().replace('T', ' ').substring(0, 19);
	}
}

/**
 * Resolves the exact SpaceSeller 9-column schema SKU (Column E)
 * - If Collagen + Upsell: "pack-collagen-gummies-3"
 * - If Collagen base offer: "gummies_collagen"
 * - If Biotine base offer: "gummies_biotine"
 * - If Multivitamins base offer: "gumies_vitamine"
 */
export function resolveSpaceSellerSku(options: {
	mainSku?: string;
	productLabel?: string;
	items?: any[];
	hasUpsell?: boolean;
}): string {
	const hasUpsell = hasUpsellOrder(options);
	const isCollagen = isCollagenOrder(options);

	if (isCollagen && hasUpsell) {
		return SPACESELLER_COLLAGEN_UPSELL_PACK.sku; // "pack-collagen-gummies-3"
	}
	if (isCollagen) {
		return 'gummies_collagen';
	}

	const rawSku = String(options.mainSku || '').toLowerCase();
	const label = String(options.productLabel || '').toLowerCase();

	if (rawSku.includes('biotin') || label.includes('biotin') || label.includes('بيوتين')) {
		return 'gummies_biotine';
	}

	if (
		rawSku.includes('vitam') ||
		label.includes('vitam') ||
		label.includes('فيتامين') ||
		label.includes('multivit')
	) {
		return 'gumies_vitamine';
	}

	if (Array.isArray(options.items)) {
		for (const it of options.items) {
			const itSku = String(it.sku || it.slug || '').toLowerCase();
			const itTitle = String(it.title || '').toLowerCase();
			if (itSku.includes('biotin') || itTitle.includes('بيوتين')) return 'gummies_biotine';
			if (itSku.includes('vitam') || itTitle.includes('فيتامين')) return 'gumies_vitamine';
			if (itSku.includes('collagen') || itTitle.includes('كولاجين')) {
				return hasUpsell ? SPACESELLER_COLLAGEN_UPSELL_PACK.sku : 'gummies_collagen';
			}
		}
	}

	return 'gummies_collagen';
}

/**
 * Resolves confirmation note for SpaceSeller 9-column sheet (Column H)
 * e.g. "عرض كولاجين + أبسيل (99 DH)"
 */
export function resolveSpaceSellerNote(options: {
	mainSku?: string;
	productLabel?: string;
	items?: any[];
	hasUpsell?: boolean;
	tier?: string;
}): string {
	const hasUpsell = hasUpsellOrder(options);
	const isCollagen = isCollagenOrder(options);

	if (isCollagen && hasUpsell) {
		return 'عرض كولاجين + أبسيل (99 DH)';
	}

	const rawSku = String(options.mainSku || '').toLowerCase();
	const label = String(options.productLabel || '').toLowerCase();

	if (rawSku.includes('biotin') || label.includes('بيوتين')) {
		return hasUpsell ? 'عرض بيوتين + أبسيل (99 DH)' : 'باقة علكات البيوتين';
	}

	if (rawSku.includes('vitam') || label.includes('فيتامين')) {
		return hasUpsell ? 'عرض فيتامينات + أبسيل (99 DH)' : 'باقة علكات الفيتامينات';
	}

	if (isCollagen) {
		return 'باقة علكات الكولاجين البحري';
	}

	return options.productLabel || 'طلب NOVAVITA';
}

/**
 * Builds SpaceSeller lead payload with pack mapping, SKU, dynamic totals, and confirmation notes
 */
export function buildSpaceSellerLeadPayload(options: {
	fullName: string;
	phone: string;
	city?: string;
	address?: string;
	orderId?: string;
	tier?: string;
	mainSku?: string;
	productLabel?: string;
	items?: any[];
	hasUpsell?: boolean;
	total?: number;
	customerNote?: string;
}): SpaceSellerLeadPayload {
	const cleanPhone = String(options.phone || '').trim().replace(/[\s\-\(\)]/g, '');
	const cleanName = String(options.fullName || '').trim();
	const city = String(options.city || 'تحدد عند التأكيد').trim();
	const address = String(options.address || '').trim();

	const isCollagen = isCollagenOrder(options);
	const hasUpsell = hasUpsellOrder(options);

	const { baseOfferPrice, upsellPrice, totalPrice } = calculateOrderTotals({
		tier: options.tier,
		items: options.items,
		hasUpsell,
		rawTotal: options.total
	});

	const isCollagenUpsell = isCollagen && hasUpsell;

	let sku: string;
	let packSlug: string | undefined;
	let packId: number | undefined;
	let noteText: string;
	let products: SpaceSellerProductItem[];

	if (isCollagenUpsell) {
		// Specific Collagen + Upsell Pack Mapping (ID: 3498, SKU: pack-collagen-gummies-3)
		sku = SPACESELLER_COLLAGEN_UPSELL_PACK.sku;
		packSlug = SPACESELLER_COLLAGEN_UPSELL_PACK.slug;
		packId = SPACESELLER_COLLAGEN_UPSELL_PACK.id;

		// Exact Arabic text detailing package, upsell, and total for confirmation team:
		// "عرض كولاجين + أبسيل (99 DH) | باقة: pack-collagen-gummies-3 | المجموع: [TOTAL] DH"
		noteText = `عرض كولاجين + أبسيل (99 DH) | باقة: ${SPACESELLER_COLLAGEN_UPSELL_PACK.slug} | المجموع: ${totalPrice} DH`;
		if (options.orderId) {
			noteText += ` [طلب: ${options.orderId}]`;
		}

		products = [
			{
				sku: SPACESELLER_COLLAGEN_UPSELL_PACK.sku,
				pack_slug: SPACESELLER_COLLAGEN_UPSELL_PACK.slug,
				pack_id: SPACESELLER_COLLAGEN_UPSELL_PACK.id,
				product_id: SPACESELLER_COLLAGEN_UPSELL_PACK.id,
				name: SPACESELLER_COLLAGEN_UPSELL_PACK.name,
				title: SPACESELLER_COLLAGEN_UPSELL_PACK.name,
				quantity: 1,
				price: totalPrice
			}
		];
	} else {
		// Dynamic fallback for regular offers without upsell
		sku =
			options.mainSku ||
			(Array.isArray(options.items) && options.items[0]?.sku) ||
			(isCollagen ? 'gummies_collagen' : 'gummies_biotine');

		noteText = `طلب ${options.productLabel || 'NOVAVITA'} | المجموع: ${totalPrice} DH`;
		if (options.orderId) {
			noteText += ` [طلب: ${options.orderId}]`;
		}

		if (Array.isArray(options.items) && options.items.length > 0) {
			products = options.items.map((it: any) => ({
				sku: it.sku || it.slug || sku,
				quantity: Number(it.quantity || it.qty || 1),
				price: Number(it.price || it.unitPrice || totalPrice / options.items!.length),
				name: it.title || it.name,
				title: it.title || it.name
			}));
		} else {
			products = [
				{
					sku,
					quantity: options.tier === 'tier_3' ? 3 : options.tier === 'tier_2' ? 2 : 1,
					price: totalPrice,
					name: options.productLabel || 'NOVAVITA علكات',
					title: options.productLabel || 'NOVAVITA علكات'
				}
			];
		}
	}

	if (options.customerNote && options.customerNote.trim()) {
		noteText += ` - ${options.customerNote.trim()}`;
	}

	return {
		name: cleanName,
		phone: cleanPhone,
		city,
		address,
		note: noteText,
		sku,
		pack_slug: packSlug,
		pack_id: packId,
		price: totalPrice,
		total: totalPrice,
		total_price: totalPrice,
		products,
		items: products
	};
}

/**
 * Sends a lead order to Space Seller Leads API with retry, exponential backoff, and robust try/catch
 */
export async function sendOrderToSpaceSeller(
	payload: SpaceSellerLeadPayload,
	retries = 2,
	delayMs = 1000
): Promise<SpaceSellerResult> {
	try {
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
					sku: payload.sku,
					pack_slug: payload.pack_slug,
					pack_id: payload.pack_id,
					total: payload.total
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
				console.warn(
					`⚠️ [Space Seller] Attempt ${attempt} failed with status ${response.status}:`,
					errText
				);

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
	} catch (fatalErr: any) {
		console.error('❌ [Space Seller] Fatal exception in sendOrderToSpaceSeller:', fatalErr);
		return { ok: false, status: 500, error: fatalErr?.message || String(fatalErr) };
	}
}
