import type { PageServerLoad } from './$types';
import { readProduct } from '$lib/content/products';
import { readSettings } from '$lib/content/settings';
import fallbackProduct from '../../../content/products/inox-organizer.json';

export const load: PageServerLoad = async () => {
	const [liveProduct, liveSettings] = await Promise.all([
		readProduct('inox-organizer').catch(() => null),
		readSettings().catch(() => null)
	]);

	const product = (liveProduct && liveProduct.status === 'published' ? liveProduct : fallbackProduct) as any;

	const settings = liveSettings || {
		brand: {
			name: 'Lhamza Shop',
			tagline: 'Lhamza Shop',
			logo: 'https://lhamza.shop/favicon.svg',
			favicon: '/favicon.svg',
			heroImage: '',
			whatsappNumber: '212626558375',
			supportHours: '9:00 - 22:00'
		},
		commerce: {
			currency: 'MAD',
			currencySymbol: 'درهم',
			freeShippingText: 'توصيل مجاني لجميع مدن المغرب',
			paymentMethod: 'الدفع عند الاستلام (COD)',
			googleSheetsUrl: '',
			postOrderUpsellImage: ''
		},
		tracking: {
			gtmContainerId: '',
			facebookPixelId: '',
			tiktokPixelId: '',
			snapchatPixelId: '0f0bf0bb-3983-47ea-9a39-90f43b1cf3ce',
			googleAnalyticsId: '',
			googleAdsId: 'AW-18405009405',
			defaultOgImage: '',
			siteUrl: 'https://lhamza.shop',
			customHeadScripts: '',
			customBodyScripts: ''
		}
	};

	return {
		product,
		settings
	};
};
