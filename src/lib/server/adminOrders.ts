import type { StoredOrder } from '$lib/types/order';

export type CanonicalSku = 'gummies_collagen' | 'gumies-vitamine' | 'gummies_melato' | 'gummies_biotine';

/**
 * Checks if a given timestamp occurred today in Africa/Casablanca timezone
 */
export function isTodayCasablanca(dateString?: string): boolean {
	if (!dateString) return false;
	try {
		const d = new Date(dateString);
		if (isNaN(d.getTime())) return false;
		const now = new Date();
		const formatter = new Intl.DateTimeFormat('en-CA', {
			timeZone: 'Africa/Casablanca',
			year: 'numeric',
			month: '2-digit',
			day: '2-digit'
		});
		return formatter.format(d) === formatter.format(now);
	} catch {
		return false;
	}
}

/**
 * Formats date cleanly for Casablanca timezone display
 */
export function formatOrderDate(dateString?: string): string {
	if (!dateString) return '—';
	try {
		const d = new Date(dateString);
		if (isNaN(d.getTime())) return String(dateString).substring(0, 16);
		return new Intl.DateTimeFormat('ar-MA', {
			timeZone: 'Africa/Casablanca',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
			hour12: false
		}).format(d);
	} catch {
		return String(dateString).substring(0, 16);
	}
}

/**
 * Normalizes any text/SKU into one of the 4 canonical NOVAVITA SKUs
 */
export function normalizeToCanonicalSku(raw?: string): CanonicalSku {
	const t = String(raw || '').toLowerCase();
	if (t.includes('melato') || t.includes('ميلاتونين') || t.includes('نوم')) {
		return 'gummies_melato';
	}
	if (t.includes('vitam') || t.includes('فيتامين') || t.includes('gumies')) {
		return 'gumies-vitamine';
	}
	if (t.includes('biotin') || t.includes('بيوتين')) {
		return 'gummies_biotine';
	}
	return 'gummies_collagen';
}

/**
 * Resolves the primary main product ordered
 */
export function resolveMainProduct(order: StoredOrder): {
	sku: CanonicalSku;
	name: string;
	tag: string;
	badgeClass: string;
} {
	const text = `${order.sku || ''} ${order.product || ''}`.toLowerCase();

	if (text.includes('melato') || text.includes('ميلاتونين') || text.includes('نوم')) {
		return {
			sku: 'gummies_melato',
			name: 'علكات الميلاتونين (نوم عميق)',
			tag: 'ميلاتونين للنوم',
			badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200'
		};
	}
	if (text.includes('vitam') || text.includes('فيتامين') || text.includes('gumies')) {
		return {
			sku: 'gumies-vitamine',
			name: 'علكات الفيتامينات المتعددة',
			tag: 'مالتي فيتامين',
			badgeClass: 'bg-amber-50 text-amber-700 border-amber-200'
		};
	}
	if (text.includes('biotin') || text.includes('بيوتين')) {
		return {
			sku: 'gummies_biotine',
			name: 'علكات البيوتين والزنك',
			tag: 'بيوتين وزنك',
			badgeClass: 'bg-pink-50 text-pink-700 border-pink-200'
		};
	}
	return {
		sku: 'gummies_collagen',
		name: 'علكات الكولاجين البحري',
		tag: 'كولاجين بحري',
		badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200'
	};
}

/**
 * Resolves exact bundle tier, base bottles, upsell bottles, and total physical bottles (`qte`)
 */
export function resolveOrderEconomics(order: StoredOrder) {
	const main = resolveMainProduct(order);
	const totalPrice = Number(order.totalPrice) || 199;
	const prodText = `${order.product || ''} ${order.address || ''} ${order.notes || ''}`;

	let upsellCount = 0;
	const upsellNames: string[] = [];
	const skuBreakdown: Record<CanonicalSku, number> = {
		gummies_collagen: 0,
		'gumies-vitamine': 0,
		gummies_melato: 0,
		gummies_biotine: 0
	};

	// 1. Inspect structured items JSON if available
	let parsedItems: any[] = [];
	if (order.items) {
		try {
			const parsed = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
			if (Array.isArray(parsed)) {
				parsedItems = parsed;
			}
		} catch {}
	}

	const upsellLines = parsedItems.filter(
		(it) =>
			it &&
			(it.isUpsell === true ||
				Number(it.price) === 98 ||
				Number(it.unitPrice) === 98 ||
				Number(it.price) === 99 ||
				Number(it.unitPrice) === 99)
	);
	if (upsellLines.length > 0) {
		for (const up of upsellLines) {
			const qty = Math.max(1, Number(up.quantity ?? up.qty ?? 1));
			const unitUpPrice = Number(up.price || up.unitPrice || 98);
			upsellCount += qty;
			const upSku = normalizeToCanonicalSku(`${up.sku || ''} ${up.slug || ''} ${up.title || ''}`);
			skuBreakdown[upSku] += qty;

			if (upSku === 'gummies_biotine')
				upsellNames.push(qty > 1 ? `${qty}x بيوتين (+${qty * unitUpPrice} DH)` : `بيوتين وزنك (+${unitUpPrice} DH)`);
			else if (upSku === 'gumies-vitamine')
				upsellNames.push(qty > 1 ? `${qty}x مالتي فيتامين (+${qty * unitUpPrice} DH)` : `مالتي فيتامين (+${unitUpPrice} DH)`);
			else if (upSku === 'gummies_melato')
				upsellNames.push(qty > 1 ? `${qty}x ميلاتونين (+${qty * unitUpPrice} DH)` : `ميلاتونين للنوم (+${unitUpPrice} DH)`);
			else upsellNames.push(qty > 1 ? `${qty}x كولاجين (+${qty * unitUpPrice} DH)` : `كولاجين بحري (+${unitUpPrice} DH)`);
		}
	}

	// 2. Determine Base Tier (1, 2, or 3 bottles) and infer upsells if not in items JSON
	let baseBottles: 1 | 2 | 3 = 1;

	// Price-based exact matching first (199, 279, 349 + n * 98)
	const priceWithoutKnownUpsells = totalPrice - upsellCount * 98;
	const priceWithoutLegacyUpsells = totalPrice - upsellCount * 99;

	if (
		prodText.includes('3 علب') ||
		prodText.includes('ثلاث') ||
		prodText.includes('التحول الشامل') ||
		priceWithoutKnownUpsells === 349 ||
		priceWithoutLegacyUpsells === 349 ||
		totalPrice === 349 ||
		totalPrice === 447 ||
		totalPrice === 448 ||
		totalPrice === 545 ||
		totalPrice === 547
	) {
		baseBottles = 3;
	} else if (
		prodText.includes('2 علب') ||
		prodText.includes('علبتان') ||
		prodText.includes('علبتين') ||
		prodText.includes('الثنائي') ||
		priceWithoutKnownUpsells === 279 ||
		priceWithoutLegacyUpsells === 279 ||
		priceWithoutKnownUpsells === 249 ||
		totalPrice === 279 ||
		totalPrice === 249 ||
		totalPrice === 377 ||
		totalPrice === 378 ||
		totalPrice === 475 ||
		totalPrice === 477
	) {
		baseBottles = 2;
	} else {
		baseBottles = 1;
	}

	const baseOfferPrice = baseBottles === 3 ? 349 : baseBottles === 2 ? 279 : 199;

	// If upsellLines was empty but totalPrice or product text indicates upsells:
	if (upsellCount === 0) {
		const priceDiff = totalPrice - baseOfferPrice;
		if (priceDiff >= 90 && Math.round(priceDiff / 98) >= 1) {
			upsellCount = Math.round(priceDiff / 98);
		} else if (order.orderType === 'upsell' || prodText.includes('أبسيل') || prodText.includes('العرض الخاطف')) {
			upsellCount = 1;
		}

		if (upsellCount > 0) {
			const inferredUpPrice = priceDiff === 99 ? 99 : 98;
			const lower = prodText.toLowerCase();
			if (lower.includes('biotin') || lower.includes('بيوتين')) {
				skuBreakdown.gummies_biotine += upsellCount;
				upsellNames.push(
					upsellCount > 1 ? `${upsellCount}x بيوتين (+${upsellCount * inferredUpPrice} DH)` : `بيوتين وزنك (+${inferredUpPrice} DH)`
				);
			} else if (lower.includes('vitam') || lower.includes('فيتامين')) {
				skuBreakdown['gumies-vitamine'] += upsellCount;
				upsellNames.push(
					upsellCount > 1
						? `${upsellCount}x مالتي فيتامين (+${upsellCount * inferredUpPrice} DH)`
						: `مالتي فيتامين (+${inferredUpPrice} DH)`
				);
			} else if (lower.includes('melato') || lower.includes('ميلاتونين')) {
				skuBreakdown.gummies_melato += upsellCount;
				upsellNames.push(
					upsellCount > 1
						? `${upsellCount}x ميلاتونين (+${upsellCount * inferredUpPrice} DH)`
						: `ميلاتونين للنوم (+${inferredUpPrice} DH)`
				);
			} else {
				skuBreakdown.gummies_biotine += upsellCount;
				upsellNames.push(
					upsellCount > 1 ? `${upsellCount}x بيوتين (+${upsellCount * inferredUpPrice} DH)` : `بيوتين وزنك (+${inferredUpPrice} DH)`
				);
			}
		}
	}

	// Add base bottles to main SKU
	skuBreakdown[main.sku] += baseBottles;

	const physicalBottles = Math.max(Number(order.quantity) || 1, baseBottles + upsellCount);
	// Ensure skuBreakdown sum matches physicalBottles if order.quantity was higher
	const sumBreakdown =
		skuBreakdown.gummies_collagen +
		skuBreakdown['gumies-vitamine'] +
		skuBreakdown.gummies_melato +
		skuBreakdown.gummies_biotine;
	if (physicalBottles > sumBreakdown) {
		skuBreakdown[main.sku] += physicalBottles - sumBreakdown;
	}

	const baseOfferLabel =
		baseBottles === 3
			? 'باقة 3 علب (349 MAD)'
			: baseBottles === 2
				? 'باقة علبتين (279 MAD)'
				: 'باقة 1 علبة (199 MAD)';

	const baseOfferBadge =
		baseBottles === 3
			? 'bg-amber-50 text-amber-900 border-amber-300'
			: baseBottles === 2
				? 'bg-emerald-50 text-emerald-900 border-emerald-300'
				: 'bg-neutral-100 text-neutral-800 border-neutral-300';

	const hasUpsell = upsellCount > 0;
	const upsellName = hasUpsell ? upsellNames.join(' + ') : 'بدون أبسيل';
	const upsellBadge = hasUpsell
		? 'bg-purple-50 text-purple-800 border-purple-200 font-bold'
		: 'bg-neutral-100 text-neutral-500 border-neutral-200';

	// Default Delivered Net Profit = Revenue - 65 MAD (SpaceSeller) - (physicalBottles * 45 MAD COGS)
	const defaultNetProfitIfDelivered = totalPrice - 65 - physicalBottles * 45;

	return {
		main,
		baseBottles,
		baseOfferPrice,
		baseOfferLabel,
		baseOfferBadge,
		upsellCount,
		hasUpsell,
		upsellName,
		upsellBadge,
		physicalBottles,
		totalPrice,
		skuBreakdown,
		defaultNetProfitIfDelivered
	};
}

/**
 * Resolves the upsell product added to the order (backward-compatible helper)
 */
export function resolveUpsellProduct(order: StoredOrder): { name: string; hasUpsell: boolean; badgeClass: string; upsellCount: number } {
	const econ = resolveOrderEconomics(order);
	return {
		name: econ.upsellName,
		hasUpsell: econ.hasUpsell,
		badgeClass: econ.upsellBadge,
		upsellCount: econ.upsellCount
	};
}

/**
 * Enriches a single stored order for dashboard presentation
 */
export function enrichOrderForDashboard(order: StoredOrder) {
	const econ = resolveOrderEconomics(order);
	const cleanPhone = String(order.phone || '').trim();
	const formattedPhone = cleanPhone.startsWith('+')
		? cleanPhone
		: cleanPhone.startsWith('0')
			? '+212' + cleanPhone.slice(1)
			: '+212' + cleanPhone;

	return {
		id: order.id,
		orderId: order.id,
		createdAt: order.createdAt,
		formattedDate: formatOrderDate(order.createdAt),
		isToday: isTodayCasablanca(order.createdAt),
		fullName: order.fullName || 'عميلة NOVAVITA',
		phone: cleanPhone,
		formattedPhone,
		city: order.city || 'تحدد عند التأكيد',
		product: order.product,
		mainProduct: econ.main.name,
		mainProductTag: econ.main.tag,
		mainProductBadge: econ.main.badgeClass,
		baseBottles: econ.baseBottles,
		baseOfferPrice: econ.baseOfferPrice,
		baseOfferLabel: econ.baseOfferLabel,
		baseOfferBadge: econ.baseOfferBadge,
		upsellCount: econ.upsellCount,
		upsellName: econ.upsellName,
		hasUpsell: econ.hasUpsell,
		upsellBadge: econ.upsellBadge,
		quantity: econ.physicalBottles,
		physicalBottles: econ.physicalBottles,
		totalPrice: econ.totalPrice,
		skuBreakdown: econ.skuBreakdown,
		defaultNetProfitIfDelivered: econ.defaultNetProfitIfDelivered,
		status: order.status || 'جديد',
		sku: econ.main.sku,
		orderType: order.orderType || (econ.hasUpsell ? 'upsell' : 'direct'),
		sheetsSynced: true,
		spacesellerSynced: true
	};
}

/**
 * Computes top-level KPI metrics & live unit economics
 */
export function computeDashboardStats(orders: StoredOrder[]) {
	let todayOrdersCount = 0;
	let todayRevenue = 0;
	let totalRevenue = 0;
	let totalPhysicalBottles = 0;
	let upsellOrdersCount = 0;
	let totalUpsellBottles = 0;
	let pendingOrders = 0;
	let confirmedOrders = 0;

	const skuBottleCounts: Record<CanonicalSku, number> = {
		gummies_collagen: 0,
		'gumies-vitamine': 0,
		gummies_melato: 0,
		gummies_biotine: 0
	};

	const tierDistribution = {
		tier1_only: 0,
		tier1_upsell: 0,
		tier2_only: 0,
		tier2_upsell: 0,
		tier3_only: 0,
		tier3_upsell: 0
	};

	for (const o of orders) {
		const econ = resolveOrderEconomics(o);
		totalRevenue += econ.totalPrice;
		totalPhysicalBottles += econ.physicalBottles;

		skuBottleCounts.gummies_collagen += econ.skuBreakdown.gummies_collagen;
		skuBottleCounts['gumies-vitamine'] += econ.skuBreakdown['gumies-vitamine'];
		skuBottleCounts.gummies_melato += econ.skuBreakdown.gummies_melato;
		skuBottleCounts.gummies_biotine += econ.skuBreakdown.gummies_biotine;

		if (econ.baseBottles === 1) {
			if (econ.hasUpsell) tierDistribution.tier1_upsell++;
			else tierDistribution.tier1_only++;
		} else if (econ.baseBottles === 2) {
			if (econ.hasUpsell) tierDistribution.tier2_upsell++;
			else tierDistribution.tier2_only++;
		} else {
			if (econ.hasUpsell) tierDistribution.tier3_upsell++;
			else tierDistribution.tier3_only++;
		}

		const isToday = isTodayCasablanca(o.createdAt);
		if (isToday) {
			todayOrdersCount++;
			todayRevenue += econ.totalPrice;
		}

		if (econ.hasUpsell) {
			upsellOrdersCount++;
			totalUpsellBottles += econ.upsellCount;
		}

		if (o.status === 'جديد' || !o.status) {
			pendingOrders++;
		} else if (o.status === 'مؤكد' || o.status === 'جاري الشحن' || o.status === 'تم التسليم') {
			confirmedOrders++;
		}
	}

	const totalOrdersCount = orders.length;
	const upsellConversionRate = totalOrdersCount > 0 ? (upsellOrdersCount / totalOrdersCount) * 100 : 0;
	const averageOrderValue = totalOrdersCount > 0 ? Number((totalRevenue / totalOrdersCount).toFixed(2)) : 0;
	const avgBottlesPerOrder = totalOrdersCount > 0 ? Number((totalPhysicalBottles / totalOrdersCount).toFixed(2)) : 0;

	return {
		todayOrdersCount,
		todayRevenue,
		totalRevenue,
		totalOrdersCount,
		totalPhysicalBottles,
		avgBottlesPerOrder,
		upsellOrdersCount,
		totalUpsellBottles,
		upsellConversionRate: Number(upsellConversionRate.toFixed(1)),
		averageOrderValue,
		pendingOrders,
		confirmedOrders,
		skuBottleCounts,
		tierDistribution
	};
}
