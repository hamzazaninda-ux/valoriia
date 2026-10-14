import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getProductBySlug } from '$lib/data/products';
import { readBrandSettings } from '$lib/content/settings';

export const load: PageServerLoad = async ({ params }) => {
	const rawSlug = params.slug || '';
	const slug = rawSlug.trim().replace(/\/+$/, '');
	const product = getProductBySlug(slug) || getProductBySlug('gummies_collagen');

	if (!product) {
		throw error(404, 'المنتج المطلوب غير موجود');
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
