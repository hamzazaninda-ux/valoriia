import type { PageServerLoad } from './$types';
import { getProductBySlug, PRODUCTS } from '$lib/data/products';
import { readBrandSettings } from '$lib/content/settings';

export const load: PageServerLoad = async ({ params, setHeaders }) => {
	setHeaders({
		'Cache-Control': 'public, max-age=60, s-maxage=86400, stale-while-revalidate=86400'
	});
	const rawSlug = params.slug || '';
	const slug = rawSlug.trim().replace(/\/+$/, '');
	
	let product = getProductBySlug(slug);
	if (!product) {
		const norm = slug.toLowerCase().replace(/-/g, '_');
		if (norm.includes('biotin') || norm.includes('بيوتين')) {
			product = PRODUCTS.find((p) => p.sku === 'gummies_biotine');
		} else if (norm.includes('vitam') || norm.includes('فيتامين') || norm.includes('multivit')) {
			product = PRODUCTS.find((p) => p.sku === 'gumies_vitamine');
		} else {
			product = PRODUCTS.find((p) => p.sku === 'gummies_collagen') || PRODUCTS[0];
		}
	}
	if (!product) {
		product = PRODUCTS[0];
	}

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
