import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getProductBySlug } from '$lib/data/products';
import { readBrandSettings } from '$lib/content/settings';

export const load: PageServerLoad = async ({ params }) => {
	const slug = params.slug;
	const product = getProductBySlug(slug);

	if (!product) {
		throw error(404, 'المنتج المطلوب غير موجود');
	}

	const brand = await readBrandSettings().catch(() => ({
		name: 'NOVAVITA',
		tagline: 'العناية بالجمال والصحة من الداخل',
		whatsappNumber: '212600000000'
	}));

	return {
		product,
		brand
	};
};
