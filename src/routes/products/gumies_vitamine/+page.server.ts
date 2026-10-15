import type { PageServerLoad } from './$types';
import { getProductBySlug, PRODUCTS } from '$lib/data/products';
import { readBrandSettings } from '$lib/content/settings';

export const load: PageServerLoad = async ({ setHeaders }) => {
	setHeaders({
		'Cache-Control': 'public, max-age=60, s-maxage=86400, stale-while-revalidate=86400'
	});
	const product =
		getProductBySlug('gumies_vitamine') ||
		PRODUCTS.find((p) => p.sku === 'gumies_vitamine') ||
		PRODUCTS[2] ||
		PRODUCTS[0];

	let brand = {
		name: 'NOVAVITA',
		tagline: 'العناية بالجمال والصحة من الداخل',
		whatsappNumber: '212600000000'
	};
	try {
		const b = await readBrandSettings();
		if (b) brand = { ...brand, ...b };
	} catch {
		// safe fallback
	}

	return {
		product,
		brand
	};
};
