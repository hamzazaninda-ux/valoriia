// Shared cart store (Svelte 5 runes) — NOVAVITA DTC Conversion Engine.
// Single source of truth for cart drawer, 99 MAD AOV upsell toggles, and COD checkout.

export interface CartLine {
	key: string;
	slug: string;
	sku: string;
	title: string;
	image: string;
	price: number;
	tier?: 'tier_1' | 'tier_2' | 'tier_3';
	tierTitle?: string;
	isUpsell?: boolean;
	qty: number;
}

export interface CompletedOrder {
	orderId: string;
	fullName: string;
	phone: string;
	lines: CartLine[];
	subtotal: number;
	shipping: number;
	total: number;
	hasUpsell: boolean;
	createdAt: string;
}

const STORAGE_KEY = 'novavita-cart-v3';

function load(): CartLine[] {
	if (typeof localStorage === 'undefined') return [];
	try {
		const raw = JSON.parse(
			localStorage.getItem(STORAGE_KEY) ||
			localStorage.getItem('novavita-cart') ||
			'[]'
		);
		if (!Array.isArray(raw)) return [];
		return raw
			.filter(
				(l) =>
					l &&
					typeof (l.sku || l.slug) === 'string' &&
					typeof l.title === 'string' &&
					Number(l.price) >= 0
			)
			.map((l) => ({
				key: l.key || `${l.sku || l.slug}_${l.isUpsell ? 'up' : 'main'}`,
				slug: l.slug || l.sku || 'gummies_biotine',
				sku: l.sku || l.slug || 'gummies_biotine',
				title: l.title,
				image: l.image || '/images/products/gummies_biotine.svg',
				price: Number(l.price) || 199,
				tier: l.tier,
				tierTitle: l.tierTitle,
				isUpsell: Boolean(l.isUpsell),
				qty: Number(l.qty) || 1
			}));
	} catch {
		return [];
	}
}

let lines = $state<CartLine[]>(load());

function persist() {
	if (typeof localStorage === 'undefined') return;
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
	} catch {
		// Private browsing or storage limit
	}
}

export const cart = {
	get lines() {
		return lines;
	},
	get count() {
		return lines.reduce((a, l) => a + (l.qty || 1), 0);
	},
	get subtotal() {
		return lines.reduce((a, l) => a + (l.qty || 1) * l.price, 0);
	},
	getMainItem(): CartLine | undefined {
		return lines.find((l) => !l.isUpsell);
	},
	getUpsellItems(): CartLine[] {
		return lines.filter((l) => l.isUpsell);
	},
	hasSku(sku: string): boolean {
		return lines.some((l) => l.sku === sku);
	},
	isUpsellActive(sku: string): boolean {
		return lines.some((l) => l.sku === sku && l.isUpsell);
	},
	setMainItem(entry: {
		slug: string;
		sku: string;
		title: string;
		image: string;
		price: number;
		tier?: 'tier_1' | 'tier_2' | 'tier_3';
		tierTitle?: string;
	}) {
		const existingUpsells = lines.filter((l) => l.isUpsell && l.sku !== entry.sku);
		const mainLine: CartLine = {
			key: `main_${entry.sku}`,
			slug: entry.slug,
			sku: entry.sku,
			title: entry.title,
			image: entry.image,
			price: entry.price,
			tier: entry.tier,
			tierTitle: entry.tierTitle,
			isUpsell: false,
			qty: 1
		};
		lines = [mainLine, ...existingUpsells];
		persist();
	},
	toggleUpsell(product: {
		slug: string;
		sku: string;
		name: string;
		image: string;
		headline?: string;
	}) {
		const upsellKey = `upsell_${product.sku}`;
		if (lines.some((l) => l.key === upsellKey || (l.sku === product.sku && l.isUpsell))) {
			// Remove upsell
			lines = lines.filter((l) => l.key !== upsellKey && !(l.sku === product.sku && l.isUpsell));
		} else {
			// Add 99 MAD upsell item
			const newUpsell: CartLine = {
				key: upsellKey,
				slug: product.slug,
				sku: product.sku,
				title: `${product.name} (عرض سري حصري)`,
				image: product.image,
				price: 99,
				isUpsell: true,
				qty: 1
			};
			lines = [...lines, newUpsell];
		}
		persist();
	},
	remove(key: string) {
		lines = lines.filter((l) => l.key !== key);
		persist();
	},
	clear() {
		lines = [];
		persist();
	}
};

// UI Drawer Control
let drawerOpen = $state(false);

function lockScroll() {
	if (typeof document !== 'undefined') document.body.style.overflow = 'hidden';
}
function unlockScroll() {
	if (typeof document !== 'undefined') document.body.style.overflow = '';
}

export const cartUi = {
	get drawer() {
		return drawerOpen;
	},
	set drawer(val: boolean) {
		drawerOpen = val;
		if (val) lockScroll();
		else unlockScroll();
	},
	openDrawer() {
		drawerOpen = true;
		lockScroll();
	},
	closeDrawer() {
		drawerOpen = false;
		unlockScroll();
	}
};

