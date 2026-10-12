import type { PageServerLoad } from './$types';
import { PRODUCTS, getProductBySlug } from '$lib/data/products';
import { readBrandSettings } from '$lib/content/settings';

export const load: PageServerLoad = async ({ url }) => {
	const productSlug = url.searchParams.get('product') || 'gummies_collagen';
	const product = getProductBySlug(productSlug) || PRODUCTS[0];

	const brand = await readBrandSettings().catch(() => ({
		name: 'NOVAVITA',
		tagline: 'العناية بالجمال والصحة من الداخل',
		whatsappNumber: '212600000000'
	}));

	return {
		product,
		products: PRODUCTS,
		brand
	};
};
