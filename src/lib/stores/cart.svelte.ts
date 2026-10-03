// Shared cart store (Svelte 5 runes) — used by product-page templates.
// Persisted in localStorage under its own key (homepage mini-cart uses another one).
// All UI state (drawer / checkout / upsell) lives here so any component can open it.

export interface CartLine {
	key: string;
	slug: string;
	title: string;
	image: string;
	price: number;
	offerId: number;
	offerTitle: string;
	qty: number;
}

export interface CompletedOrder {
	orderId: string;
	fullName: string;
	phoneNumber: string;
	lines: CartLine[];
	subtotal: number;
	currency: string;
}

const STORAGE_KEY = 'valoriia-cart-v2';

function load(): CartLine[] {
	if (typeof localStorage === 'undefined') return [];
	try {
		const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
		if (!Array.isArray(raw)) return [];
		// No quantities in this store: every line counts once.
		return raw
			.filter(
				(l) =>
					l && typeof l.slug === 'string' && typeof l.title === 'string' && Number(l.price) >= 0
			)
			.map((l) => ({ ...l, qty: 1 }));
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
		// storage full / private mode — cart simply won't persist
	}
}

export const cart = {
	get lines() {
		return lines;
	},
	get count() {
		return lines.reduce((a, l) => a + l.qty, 0);
	},
	get subtotal() {
		return lines.reduce((a, l) => a + l.qty * l.price, 0);
	},
	add(entry: Omit<CartLine, 'key' | 'qty'>) {
		const key = `${entry.slug}#${entry.offerId}`;
		if (lines.some((l) => l.key === key)) return;
		lines = [...lines, { ...entry, key, qty: 1 }];
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

// --- Single purchase-flow state -------------------------------------------
// Exactly ONE flow surface is active at a time: null | 'cart' | 'checkout' |
// 'upsell'. Combinations like cart+checkout are structurally impossible —
// every transition closes the previous surface before opening the next one.
export type FlowStep = null | 'cart' | 'checkout' | 'upsell';

let flow = $state<FlowStep>(null);
let upsellOrder = $state<CompletedOrder | null>(null);

// Lock body scroll while any flow surface is open; released on close/reset.
// (Managed explicitly in the transitions below — a module-level $effect
// is not allowed here and throws effect_orphan at runtime.)
function lockScroll() {
	if (typeof document !== 'undefined') document.body.style.overflow = 'hidden';
}
function unlockScroll() {
	if (typeof document !== 'undefined') document.body.style.overflow = '';
}

export const cartUi = {
	/** Current active surface (single source of truth). */
	get flow(): FlowStep {
		return flow;
	},
	get drawer() {
		return flow === 'cart';
	},
	get checkout() {
		return flow === 'checkout';
	},
	get upsell() {
		return flow === 'upsell' ? upsellOrder : null;
	},
	openDrawer() {
		upsellOrder = null;
		flow = 'cart';
		lockScroll();
	},
	closeDrawer() {
		if (flow === 'cart') flow = null;
		unlockScroll();
	},
	openCheckout() {
		if (lines.length === 0) return;
		flow = 'checkout';
		lockScroll();
	},
	closeCheckout() {
		if (flow === 'checkout') flow = null;
		unlockScroll();
	},
	/** Called after a successful order: checkout closes, upsell opens alone. */
	beginUpsell(order: CompletedOrder) {
		flow = 'upsell';
		upsellOrder = order;
		lockScroll();
	},
	endUpsell() {
		flow = null;
		upsellOrder = null;
		unlockScroll();
	},
	/** Full reset (e.g. before leaving to the Thank You page). */
	resetAll() {
		flow = null;
		upsellOrder = null;
		unlockScroll();
	}
};
