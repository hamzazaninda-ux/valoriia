import type { PageServerLoad } from './$types';
import { getProductBySlug } from '$lib/data/products';
import { readBrandSettings } from '$lib/content/settings';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ setHeaders }) => {
	setHeaders({
		'Cache-Control': 'public, max-age=60, s-maxage=86400, stale-while-revalidate=86400'
	});
	const product = getProductBySlug('gummies_biotine');
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
	} catch {}

	return {
		product,
		brand
	};
};
