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

	let baseOfferPrice = 279; // Default tier_1 (2 bottles @ 279 MAD)
	const r = typeof options.rawTotal === 'number' && options.rawTotal > 0 ? options.rawTotal : 0;

	if (r === 199 || r === 298 || r === 297) {
		baseOfferPrice = 199;
	} else if (r === 279 || r === 378 || r === 377) {
		baseOfferPrice = 279;
	} else if (r === 349 || r === 448 || r === 447) {
		baseOfferPrice = 349;
	} else if (options.tier === 'tier_2' || options.tier === 'tier-3-tubs') {
		baseOfferPrice = 349;
	} else if (options.tier === 'tier_1' || options.tier === 'tier-2-tubs') {
		baseOfferPrice = 279;
	} else if (r > 0) {
		baseOfferPrice = hasUpsell && r > 99 ? r - 99 : r;
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
 * Always returns direct base catalog SKU to prevent SpaceSeller bundle price overrides:
 * - Collagen Gummies: "gummies_collagen"
 * - Multivitamine Gummies: "gumies-vitamine" (Note the hyphen and single 'm')
 * - Melatonin Sleep Gummies: "gummies_melato"
 * - Biotine Gummies: "gummies_biotine"
 */
export function resolveSpaceSellerSku(options: {
	mainSku?: string;
	productLabel?: string;
	items?: any[];
	hasUpsell?: boolean;
}): string {
	const rawSku = String(options.mainSku || '').toLowerCase();
	const label = String(options.productLabel || '').toLowerCase();

	if (
		rawSku.includes('melato') ||
		rawSku.includes('sleep') ||
		label.includes('melato') ||
		label.includes('ميلاتونين') ||
		label.includes('نوم')
	) {
		return 'gummies_melato';
	}

	if (
		rawSku.includes('vitam') ||
		rawSku.includes('gumies') ||
		label.includes('vitam') ||
		label.includes('فيتامين') ||
		label.includes('multivit')
	) {
		return 'gumies-vitamine';
	}

	if (rawSku.includes('biotin') || label.includes('biotin') || label.includes('بيوتين')) {
		return 'gummies_biotine';
	}

	if (rawSku.includes('collagen') || label.includes('collagen') || label.includes('كولاجين')) {
		return 'gummies_collagen';
	}

	if (Array.isArray(options.items)) {
		for (const it of options.items) {
			if (it.isUpsell) continue;
			const itSku = String(it.sku || it.slug || '').toLowerCase();
			const itTitle = String(it.title || '').toLowerCase();
			if (
				itSku.includes('melato') ||
				itSku.includes('sleep') ||
				itTitle.includes('melato') ||
				itTitle.includes('ميلاتونين') ||
				itTitle.includes('نوم')
			) {
				return 'gummies_melato';
			}
			if (
				itSku.includes('vitam') ||
				itSku.includes('gumies') ||
				itTitle.includes('vitam') ||
				itTitle.includes('فيتامين') ||
				itTitle.includes('multivit')
			) {
				return 'gumies-vitamine';
			}
			if (itSku.includes('biotin') || itTitle.includes('بيوتين')) {
				return 'gummies_biotine';
			}
			if (itSku.includes('collagen') || itTitle.includes('كولاجين')) {
				return 'gummies_collagen';
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
 * Resolves the clean Arabic name for a product:
 * - 'كولاجين'
 * - 'بيوتين'
 * - 'مالتي فيتامين'
 */
export function resolveProductArabicName(skuOrSlugOrTitle?: string): string {
	const norm = String(skuOrSlugOrTitle || '').toLowerCase().trim();
	if (norm.includes('melato') || norm.includes('ميلاتونين') || norm.includes('نوم')) return 'ميلاتونين';
	if (norm.includes('biotin') || norm.includes('بيوتين')) return 'بيوتين';
	if (norm.includes('vitam') || norm.includes('فيتامين') || norm.includes('multivit')) return 'مالتي فيتامين';
	if (norm.includes('collagen') || norm.includes('كولاجين')) return 'كولاجين';
	return 'كولاجين';
}

/**
 * Resolves the exact upsell product name for display:
 * - 'بيوتين وزنك'
 * - 'مالتي فيتامين'
 * - 'كولاجين'
 */
export function resolveUpsellArabicName(options: {
	upsellProduct?: string;
	upsellName?: string;
	upsellSku?: string;
	mainSku?: string;
	items?: any[];
	hasUpsell?: boolean;
}): string {
	const formatUpsellLabel = (raw?: string) => {
		const p = resolveProductArabicName(raw);
		return p === 'بيوتين' ? 'بيوتين وزنك' : p;
	};

	if (options.upsellProduct) {
		return formatUpsellLabel(options.upsellProduct);
	}
	if (options.upsellName) {
		return formatUpsellLabel(options.upsellName);
	}
	if (options.upsellSku) {
		return formatUpsellLabel(options.upsellSku);
	}
	if (Array.isArray(options.items)) {
		const upItem = options.items.find(
			(it: any) =>
				it.isUpsell === true ||
				(it.title &&
					(it.title.includes('عرض') ||
						it.title.includes('خاطف') ||
						it.title.includes('أبسيل') ||
						it.title.includes('سري')))
		);
		if (upItem) {
			return formatUpsellLabel(upItem.sku || upItem.slug || upItem.title);
		}
	}
	// Default upsell is Biotin & Zinc (بيوتين وزنك)
	return 'بيوتين وزنك';
}

/**
 * Calculates the TRUE total number of physical bottles in the order:
 * - 2 bottles offer (279 DH) + Upsell (99 DH) -> qte = 3
 * - 3 bottles offer (349 DH) + Upsell (99 DH) -> qte = 4
 * - Without upsell -> qte = 2 or 3 according to selected tier
 */
export function calculatePhysicalBottleCount(options: {
	tier?: string;
	items?: any[];
	hasUpsell?: boolean;
	rawTotal?: number;
	price?: number;
}): number {
	let baseBottles = 2; // Default tier_1 (2 bottles @ 279 MAD)
	const rawTier = String(options.tier || '').toLowerCase();
	const hasUpsell = hasUpsellOrder(options);
	const total = Number(options.rawTotal ?? options.price ?? 0);

	if (total === 199 || total === 298 || total === 297 || rawTier.includes('التجربة') || rawTier.includes('واحدة')) {
		baseBottles = 1;
	} else if (
		total === 349 ||
		total === 448 ||
		total === 447 ||
		rawTier === 'tier_2' ||
		rawTier === 'tier-3-tubs' ||
		rawTier.includes('3') ||
		rawTier.includes('التحول') ||
		rawTier.includes('علاجي')
	) {
		baseBottles = 3;
	} else if (
		total === 279 ||
		total === 378 ||
		total === 377 ||
		rawTier === 'tier_1' ||
		rawTier === 'tier-2-tubs' ||
		rawTier.includes('2') ||
		rawTier.includes('الثنائي') ||
		rawTier.includes('علبتان')
	) {
		baseBottles = 2;
	} else if (Array.isArray(options.items) && options.items.length > 0) {
		const baseItems = options.items.filter((it: any) => !it.isUpsell);
		const sumBaseQty = baseItems.reduce((acc: number, it: any) => acc + (Number(it.quantity || it.qty) || 1), 0);
		if (sumBaseQty > 0) baseBottles = sumBaseQty;
	}

	let upsellBottles = 0;
	if (Array.isArray(options.items)) {
		const upsellItems = options.items.filter(
			(it: any) =>
				it.isUpsell === true ||
				(it.title &&
					(it.title.includes('عرض') ||
						it.title.includes('خاطف') ||
						it.title.includes('أبسيل') ||
						it.title.includes('سري')))
		);
		if (upsellItems.length > 0) {
			upsellBottles = upsellItems.reduce((acc: number, it: any) => acc + (Number(it.quantity || it.qty) || 1), 0);
		} else if (hasUpsell) {
			upsellBottles = 1;
		}
	} else if (hasUpsell) {
		upsellBottles = 1;
	}

	return baseBottles + upsellBottles;
}

/**
 * Builds the exact confirmation breakdown for Column D (address) and notes:
 * Format when Upsell is added:
 * "العرض: [X] علب [Base Product] + أبسيل: علبة بيوتين وزنك (+99 DH) | المجموع: [Total] DH (تأكيد عبر الهاتف)"
 * Format without Upsell:
 * "العرض: [X] علب [Base Product] (بدون أبسيل) | المجموع: [Total] DH (تأكيد عبر الهاتف)"
 */
export function buildConfirmationBreakdown(options: {
	orderId?: string;
	tier?: string;
	mainSku?: string;
	productLabel?: string;
	items?: any[];
	hasUpsell?: boolean;
	upsellProduct?: string;
	upsellName?: string;
	upsellSku?: string;
	totalPrice: number;
	customerNote?: string;
}): string {
	const hasUpsell = hasUpsellOrder(options);
	const baseName = resolveProductArabicName(options.mainSku || options.productLabel);

	// Resolve tier bottle text: "2 علب" or "3 علب" (or legacy "1 علبة")
	const rawTier = String(options.tier || '').toLowerCase();
	let tierUnitText = '2 علب';
	if (
		options.totalPrice === 199 ||
		options.totalPrice === 298 ||
		options.totalPrice === 297 ||
		rawTier.includes('التجربة') ||
		rawTier.includes('واحدة')
	) {
		tierUnitText = '1 علبة';
	} else if (
		options.totalPrice === 349 ||
		options.totalPrice === 448 ||
		options.totalPrice === 447 ||
		rawTier === 'tier_2' ||
		rawTier === 'tier-3-tubs' ||
		rawTier.includes('3') ||
		rawTier.includes('التحول') ||
		rawTier.includes('علاجي')
	) {
		tierUnitText = '3 علب';
	} else {
		tierUnitText = '2 علب';
	}

	if (hasUpsell) {
		const upsellName = resolveUpsellArabicName({
			upsellProduct: options.upsellProduct,
			upsellName: options.upsellName,
			upsellSku: options.upsellSku,
			mainSku: options.mainSku || options.productLabel,
			items: options.items,
			hasUpsell
		});
		return `العرض: ${tierUnitText} ${baseName} + أبسيل: علبة ${upsellName} (+99 DH) | المجموع: ${options.totalPrice} DH (تأكيد عبر الهاتف)`;
	}

	return `العرض: ${tierUnitText} ${baseName} (بدون أبسيل) | المجموع: ${options.totalPrice} DH (تأكيد عبر الهاتف)`;
}

/**
 * Builds the exact SpaceSeller confirmation note for Column H
 * Format: "العرض: [X] علب [Base Product] + أبسيل: علبة [Exact Upsell Name] (+99 DH) | المجموع: [Total] DH (تأكيد عبر الهاتف)"
 */
export function buildSpaceSellerConfirmationNote(options: {
	orderId?: string;
	tier?: string;
	mainSku?: string;
	productLabel?: string;
	items?: any[];
	hasUpsell?: boolean;
	upsellProduct?: string;
	upsellName?: string;
	upsellSku?: string;
	totalPrice: number;
	customerNote?: string;
}): string {
	const breakdown = buildConfirmationBreakdown(options);
	const orderPart = options.orderId ? ` [${options.orderId}]` : '';
	const custNote = options.customerNote && String(options.customerNote).trim() ? ` | ملاحظة: ${String(options.customerNote).trim()}` : '';
	return `${breakdown}${orderPart}${custNote}`;
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

	const breakdown = buildConfirmationBreakdown({
		orderId: options.orderId,
		tier: options.tier,
		mainSku: options.mainSku,
		productLabel: options.productLabel,
		items: options.items,
		hasUpsell,
		upsellProduct: (options as any).upsellProduct,
		upsellName: (options as any).upsellName,
		upsellSku: (options as any).upsellSku,
		totalPrice,
		customerNote: options.customerNote
	});

	sku = resolveSpaceSellerSku({
		mainSku: options.mainSku,
		productLabel: options.productLabel,
		items: options.items,
		hasUpsell
	});

	noteText = breakdown;
	if (options.orderId && !noteText.includes(options.orderId)) {
		noteText += ` [طلب: ${options.orderId}]`;
	}

	const qte = calculatePhysicalBottleCount({
		tier: options.tier,
		items: options.items,
		hasUpsell,
		rawTotal: totalPrice,
		price: totalPrice
	});

	if (Array.isArray(options.items) && options.items.length > 0) {
		products = options.items.map((it: any) => ({
			sku: resolveSpaceSellerSku({ mainSku: it.sku || it.slug, productLabel: it.title, hasUpsell: Boolean(it.isUpsell) }),
			quantity: Number(it.quantity || it.qty || 1),
			price: Number(it.price || it.unitPrice || Math.round(totalPrice / options.items!.length)),
			name: it.title || it.name,
			title: it.title || it.name
		}));
	} else {
		products = [
			{
				sku,
				quantity: qte,
				price: totalPrice,
				name: options.productLabel || 'NOVAVITA علكات',
				title: options.productLabel || 'NOVAVITA علكات'
			}
		];
	}

	if (options.customerNote && options.customerNote.trim() && !noteText.includes(options.customerNote.trim())) {
		noteText += ` - ${options.customerNote.trim()}`;
	}

	const displayAddress =
		!address || address === 'تحدد عند التأكيد' || address === 'سيتم التأكيد عبر الهاتف' || address === 'يُحدد عند التأكيد'
			? breakdown
			: `${breakdown} | ${address}`;

	return {
		name: cleanName,
		phone: cleanPhone,
		city,
		address: displayAddress,
		note: noteText,
		sku,
		price: totalPrice,
		total: totalPrice,
		total_price: totalPrice,
		override_price: true,
		is_price_overridden: true,
		custom_price: totalPrice,
		final_price: totalPrice,
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
