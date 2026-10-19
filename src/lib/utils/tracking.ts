/**
 * Snapchat Pixel & Ad Conversion Tracking Engine
 * Solves:
 *   1. Correct 'price' (numeric) and 'currency' parameter mapping (Snap uses 'price', not 'value')
 *   2. Deduplicated 'transaction_id' across checkout and thank-you screens
 *   3. Permanent preservation of Snap Click ID (ScCid) across SPA navigation, redirects, and storage
 *   4. Advanced Matching for Moroccan COD (E.164 phone normalization + SHA-256 hashing)
 */

export const SNAP_PIXEL_ID = '0f0bf0bb-3983-47ea-9a39-90f43b1cf3ce';

/**
 * Standard pure-JS SHA-256 hash (lowercase hex string)
 */
export function sha256(ascii: string): string {
	if (!ascii) return '';
	ascii = String(ascii).trim().toLowerCase();

	function rightRotate(value: number, amount: number) {
		return (value >>> amount) | (value << (32 - amount));
	}
	const mathPow = Math.pow;
	const maxWord = mathPow(2, 32);
	const lengthProperty = 'length';
	let i: number, j: number;
	let result = '';
	const words: number[] = [];
	const asciiBitLength = ascii[lengthProperty] * 8;
	let hash: number[] = [];
	const k: number[] = [];
	let primeCounter = 0;
	const isComposite: Record<number, number> = {};

	for (let candidate = 2; primeCounter < 64; candidate++) {
		if (!isComposite[candidate]) {
			for (i = 0; i < 313; i += candidate) {
				isComposite[i] = candidate;
			}
			hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
			k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
		}
	}

	ascii += '\x80';
	while ((ascii[lengthProperty] % 64) - 56) ascii += '\x00';
	for (i = 0; i < ascii[lengthProperty]; i++) {
		j = ascii.charCodeAt(i);
		if (j >> 8) return '';
		words[i >> 2] |= j << (((3 - i) % 4) * 8);
	}
	words[words[lengthProperty]] = (asciiBitLength / maxWord) | 0;
	words[words[lengthProperty]] = asciiBitLength;

	for (j = 0; j < words[lengthProperty]; ) {
		const w = words.slice(j, (j += 16));
		const oldHash = hash;
		hash = hash.slice(0, 8);
		for (i = 0; i < 64; i++) {
			const w15 = w[i - 15],
				w2 = w[i - 2];
			const s0 = rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3);
			const s1 = rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10);
			const ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
			const maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
			const temp1 =
				(hash[7] +
					(rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25)) +
					ch +
					k[i] +
					(w[i] =
						i < 16
							? w[i]
							: (w[i - 16] + s0 + w[i - 7] + s1) | 0)) |
				0;
			const temp2 =
				((rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22)) +
					maj) |
				0;
			hash = [(temp1 + temp2) | 0].concat(hash);
			hash[4] = (hash[4] + temp1) | 0;
		}
		for (i = 0; i < 8; i++) {
			hash[i] = (hash[i] + oldHash[i]) | 0;
		}
	}
	for (i = 0; i < 8; i++) {
		for (j = 3; j >= 0; j--) {
			const b = (hash[i] >> (j * 8)) & 255;
			result += (b < 16 ? '0' : '') + b.toString(16);
		}
	}
	return result;
}

/**
 * Normalizes phone numbers for Moroccan COD (06/07/05, Eastern Arabic digits, spaces, dashes)
 * Produces clean digits only with country code (e.g. "212626558375") as required by Snap Advanced Matching.
 */
export function normalizePhone(input: string | undefined | null): { digits: string; e164WithPlus: string } {
	if (!input) return { digits: '', e164WithPlus: '' };
	const eastern = '٠١٢٣٤٥٦٧٨٩';
	let cleaned = String(input)
		.trim()
		.replace(/[٠-٩]/g, (d) => eastern.indexOf(d).toString());
	cleaned = cleaned.replace(/\D/g, '');
	if (!cleaned) return { digits: '', e164WithPlus: '' };

	if (cleaned.startsWith('00212')) cleaned = cleaned.slice(2);
	else if (cleaned.startsWith('00')) cleaned = cleaned.slice(2);

	if (cleaned.startsWith('0') && cleaned.length === 10) {
		cleaned = '212' + cleaned.slice(1);
	} else if (
		!cleaned.startsWith('212') &&
		(cleaned.startsWith('6') || cleaned.startsWith('7') || cleaned.startsWith('5')) &&
		cleaned.length === 9
	) {
		cleaned = '212' + cleaned;
	}

	return {
		digits: cleaned,
		e164WithPlus: '+' + cleaned
	};
}

/**
 * Capture and persist Snap Click ID (ScCid) and other ad click parameters
 */
export function captureAdClickIds(): void {
	if (typeof window === 'undefined') return;
	try {
		const params = new URLSearchParams(window.location.search);
		const sccid =
			params.get('ScCid') ||
			params.get('sccid') ||
			params.get('sc_cid') ||
			params.get('sc_clid');

		if (sccid && sccid.trim()) {
			const val = sccid.trim();
			localStorage.setItem('snap_sccid', val);
			sessionStorage.setItem('snap_sccid', val);
			const d = new Date();
			d.setTime(d.getTime() + 30 * 24 * 60 * 60 * 1000);
			document.cookie = `_sccid=${encodeURIComponent(val)}; expires=${d.toUTCString()}; path=/; SameSite=Lax`;
			document.cookie = `_scid=${encodeURIComponent(val)}; expires=${d.toUTCString()}; path=/; SameSite=Lax`;
		}

		// Also capture Meta (fbclid) and TikTok (ttclid)
		const fbclid = params.get('fbclid');
		if (fbclid && fbclid.trim()) {
			localStorage.setItem('meta_fbclid', fbclid.trim());
			sessionStorage.setItem('meta_fbclid', fbclid.trim());
		}
		const ttclid = params.get('ttclid');
		if (ttclid && ttclid.trim()) {
			localStorage.setItem('tiktok_ttclid', ttclid.trim());
			sessionStorage.setItem('tiktok_ttclid', ttclid.trim());
		}
	} catch (e) {
		console.warn('[Tracking] Error capturing click IDs:', e);
	}
}

/**
 * Retrieve saved Snap Click ID
 */
export function getSavedSnapClickId(): string | null {
	if (typeof window === 'undefined') return null;
	try {
		const params = new URLSearchParams(window.location.search);
		const urlId =
			params.get('ScCid') ||
			params.get('sccid') ||
			params.get('sc_cid') ||
			params.get('sc_clid');
		if (urlId && urlId.trim()) return urlId.trim();

		const sessionVal = sessionStorage.getItem('snap_sccid');
		if (sessionVal && sessionVal.trim()) return sessionVal.trim();

		const localVal = localStorage.getItem('snap_sccid');
		if (localVal && localVal.trim()) return localVal.trim();

		const match = document.cookie.match(new RegExp('(^| )(_sccid|_scid)=([^;]+)'));
		if (match && match[3]) return decodeURIComponent(match[3]).trim();
	} catch (e) {}
	return null;
}

/**
 * Appends saved tracking parameters (ScCid, fbclid, ttclid) to any navigation URL
 */
export function preserveTrackingParams(targetUrl: string): string {
	if (typeof window === 'undefined') return targetUrl;
	try {
		const scCid = getSavedSnapClickId();
		const fbclid = sessionStorage.getItem('meta_fbclid') || localStorage.getItem('meta_fbclid');
		const ttclid = sessionStorage.getItem('tiktok_ttclid') || localStorage.getItem('tiktok_ttclid');

		const [base, hash] = targetUrl.split('#');
		const [path, search] = base.split('?');
		const params = new URLSearchParams(search || '');

		if (scCid && !params.has('ScCid') && !params.has('sccid')) {
			params.set('ScCid', scCid);
		}
		if (fbclid && !params.has('fbclid')) {
			params.set('fbclid', fbclid);
		}
		if (ttclid && !params.has('ttclid')) {
			params.set('ttclid', ttclid);
		}

		const queryString = params.toString();
		const finalBase = queryString ? `${path}?${queryString}` : path;
		return hash ? `${finalBase}#${hash}` : finalBase;
	} catch (e) {
		return targetUrl;
	}
}

/**
 * Ensures the current URL in window.history has ScCid if available in storage,
 * so Snap Pixel's script directly matches the click ID from window.location.search.
 */
export function ensureCurrentUrlHasSnapClickId(): void {
	if (typeof window === 'undefined' || !window.history || !window.history.replaceState) return;
	try {
		const params = new URLSearchParams(window.location.search);
		if (!params.has('ScCid') && !params.has('sccid')) {
			const scCid = getSavedSnapClickId();
			if (scCid) {
				params.set('ScCid', scCid);
				const newSearch = params.toString();
				const newUrl =
					window.location.pathname + (newSearch ? '?' + newSearch : '') + window.location.hash;
				window.history.replaceState(null, '', newUrl);
			}
		}
	} catch (e) {}
}

/**
 * Tracks a Snapchat Purchase with full Advanced Matching (Hashed + E.164 phone)
 * and strict parameter typing (price, currency, transaction_id).
 */
export function trackSnapPurchase(data: {
	orderId: string;
	price: number;
	currency?: string;
	phone?: string;
	title?: string;
	sku?: string;
	quantity?: number;
}): void {
	if (typeof window === 'undefined' || !(window as any).snaptr) return;

	try {
		ensureCurrentUrlHasSnapClickId();

		const orderId = String(data.orderId || ('ORD-' + Date.now())).trim();
		const numPrice = Number(data.price) || 229;
		const currency = data.currency || 'MAD';
		const sku = String(data.sku || 'kit-tandim').trim();
		const title = String(data.title || 'منتج').trim();
		const quantity = Number(data.quantity) || 1;

		// 1. Advanced Matching: Format and hash phone number
		const { digits } = normalizePhone(data.phone);
		if (digits && digits.length >= 9) {
			const hashedPhone = sha256(digits);
			const matchingData: Record<string, string> = {
				user_phone_number: digits,
				user_hashed_phone_number: hashedPhone,
				user_hashed_phone: hashedPhone
			};

			console.log('⚡ [Snap Advanced Matching] Initializing with phone:', {
				phoneDigits: digits,
				phoneHashPrefix: hashedPhone.slice(0, 8) + '...'
			});

			(window as any).snaptr('init', SNAP_PIXEL_ID, matchingData);
		}

		// 2. Track PURCHASE with strict Snap parameters (price is required by Snap, not value)
		const payload = {
			currency,
			price: numPrice,
			transaction_id: orderId,
			item_ids: [sku],
			item_category: title,
			number_items: quantity,
			description: title
		};

		(window as any).snaptr('track', 'PURCHASE', payload);
		console.log('🎯 [Snap Pixel] PURCHASE event fired:', payload);
	} catch (err) {
		console.warn('[Snap Pixel] Error firing PURCHASE:', err);
	}
}
