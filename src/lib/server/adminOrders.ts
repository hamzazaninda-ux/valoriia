import type { StoredOrder } from '$lib/types/order';

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
 * Resolves the primary main product ordered
 */
export function resolveMainProduct(order: StoredOrder): { name: string; tag: string; badgeClass: string } {
	const text = `${order.sku || ''} ${order.product || ''} ${order.items || ''}`.toLowerCase();

	if (text.includes('melato') || text.includes('ميلاتونين') || text.includes('نوم')) {
		return {
			name: 'علكات الميلاتونين (نوم عميق)',
			tag: 'ميلاتونين للنوم',
			badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200'
		};
	}
	if (text.includes('vitam') || text.includes('فيتامين') || text.includes('gumies')) {
		return {
			name: 'علكات الفيتامينات المتعددة',
			tag: 'مالتي فيتامين',
			badgeClass: 'bg-amber-50 text-amber-700 border-amber-200'
		};
	}
	if (text.includes('biotin') || text.includes('بيوتين')) {
		return {
			name: 'علكات البيوتين والزنك',
			tag: 'بيوتين وزنك',
			badgeClass: 'bg-pink-50 text-pink-700 border-pink-200'
		};
	}
	return {
		name: 'علكات الكولاجين البحري',
		tag: 'كولاجين بحري',
		badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200'
	};
}

/**
 * Resolves the upsell product added to the order
 */
export function resolveUpsellProduct(order: StoredOrder): { name: string; hasUpsell: boolean; badgeClass: string } {
	let hasUpsell = order.orderType === 'upsell';
	let upsellItemTitle = '';

	if (order.items) {
		try {
			const parsed = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
			if (Array.isArray(parsed)) {
				const up = parsed.find((it: any) => it.isUpsell === true);
				if (up) {
					hasUpsell = true;
					upsellItemTitle = String(up.title || up.sku || up.slug || '');
				}
			}
		} catch {}
	}

	const prod = String(order.product || '').toLowerCase();
	if (prod.includes('أبسيل') || prod.includes('العرض الخاطف') || prod.includes('+ علبة')) {
		hasUpsell = true;
		if (!upsellItemTitle) upsellItemTitle = prod;
	}

	if (!hasUpsell) {
		return {
			name: 'بدون أبسيل',
			hasUpsell: false,
			badgeClass: 'bg-neutral-100 text-neutral-500 border-neutral-200'
		};
	}

	const t = upsellItemTitle.toLowerCase();
	if (t.includes('melato') || t.includes('ميلاتونين') || t.includes('نوم')) {
		return {
			name: 'ميلاتونين للنوم (+99 DH)',
			hasUpsell: true,
			badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200 font-bold'
		};
	}
	if (t.includes('biotin') || t.includes('بيوتين')) {
		return {
			name: 'بيوتين وزنك (+99 DH)',
			hasUpsell: true,
			badgeClass: 'bg-pink-50 text-pink-700 border-pink-200 font-bold'
		};
	}
	if (t.includes('vitam') || t.includes('فيتامين')) {
		return {
			name: 'مالتي فيتامين (+99 DH)',
			hasUpsell: true,
			badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 font-bold'
		};
	}
	if (t.includes('collagen') || t.includes('كولاجين')) {
		return {
			name: 'كولاجين بحري (+99 DH)',
			hasUpsell: true,
			badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200 font-bold'
		};
	}

	return {
		name: 'عرض خاطف (+99 DH)',
		hasUpsell: true,
		badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200 font-bold'
	};
}

/**
 * Enriches a single stored order for dashboard presentation
 */
export function enrichOrderForDashboard(order: StoredOrder) {
	const main = resolveMainProduct(order);
	const upsell = resolveUpsellProduct(order);
	const cleanPhone = String(order.phone || '').trim();
	const formattedPhone = cleanPhone.startsWith('+') ? cleanPhone : cleanPhone.startsWith('0') ? '+212' + cleanPhone.slice(1) : '+212' + cleanPhone;

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
		mainProduct: main.name,
		mainProductTag: main.tag,
		mainProductBadge: main.badgeClass,
		upsellName: upsell.name,
		hasUpsell: upsell.hasUpsell,
		upsellBadge: upsell.badgeClass,
		quantity: order.quantity || 1,
		totalPrice: Number(order.totalPrice) || 0,
		status: order.status || 'جديد',
		sku: order.sku || 'gummies_collagen',
		orderType: order.orderType || (upsell.hasUpsell ? 'upsell' : 'direct'),
		sheetsSynced: true, // Synced via webhook / fallback cache
		spacesellerSynced: true // Ready/Synced in SpaceSeller schema
	};
}

/**
 * Computes top-level KPI metrics
 */
export function computeDashboardStats(orders: StoredOrder[]) {
	let todayOrdersCount = 0;
	let todayRevenue = 0;
	let totalRevenue = 0;
	let upsellOrdersCount = 0;
	let pendingOrders = 0;
	let confirmedOrders = 0;

	for (const o of orders) {
		const price = Number(o.totalPrice) || 0;
		totalRevenue += price;

		const isToday = isTodayCasablanca(o.createdAt);
		if (isToday) {
			todayOrdersCount++;
			todayRevenue += price;
		}

		const { hasUpsell } = resolveUpsellProduct(o);
		if (hasUpsell) {
			upsellOrdersCount++;
		}

		if (o.status === 'جديد' || !o.status) {
			pendingOrders++;
		} else if (o.status === 'مؤكد' || o.status === 'جاري الشحن' || o.status === 'تم التسليم') {
			confirmedOrders++;
		}
	}

	const totalOrdersCount = orders.length;
	const upsellConversionRate = totalOrdersCount > 0 ? (upsellOrdersCount / totalOrdersCount) * 100 : 0;
	const averageOrderValue = totalOrdersCount > 0 ? Math.round(totalRevenue / totalOrdersCount) : 0;

	return {
		todayOrdersCount,
		todayRevenue,
		totalRevenue,
		totalOrdersCount,
		upsellOrdersCount,
		upsellConversionRate: Number(upsellConversionRate.toFixed(1)),
		averageOrderValue,
		pendingOrders,
		confirmedOrders
	};
}
