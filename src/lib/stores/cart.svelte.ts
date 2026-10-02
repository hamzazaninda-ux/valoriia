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
let loaded = $state(false);

if (typeof localStorage !== 'undefined') {
	loaded = true;
}

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

// --- Global cart UI state (drawer / checkout / post-purchase upsell) ---
let drawerOpen = $state(false);
let checkoutOpen = $state(false);
let upsell = $state<CompletedOrder | null>(null);

export const cartUi = {
	get drawer() {
		return drawerOpen;
	},
	get checkout() {
		return checkoutOpen;
	},
	get upsell() {
		return upsell;
	},
	openDrawer() {
		drawerOpen = true;
	},
	closeDrawer() {
		drawerOpen = false;
	},
	openCheckout() {
		if (lines.length === 0) return;
		drawerOpen = false;
		checkoutOpen = true;
	},
	closeCheckout() {
		checkoutOpen = false;
	},
	/** Called after a successful order: closes checkout, opens the timed upsell. */
	beginUpsell(order: CompletedOrder) {
		checkoutOpen = false;
		drawerOpen = false;
		upsell = order;
	},
	endUpsell() {
		upsell = null;
	}
};
