import type { PageServerLoad } from './$types';
import { readProduct } from '$lib/content/products';
import { readSettings } from '$lib/content/settings';
import { readTemplateTheme } from '$lib/content/templateTheme';
import { getDefaultTheme } from '$lib/types/theme';
import fallbackProduct from '../../../content/products/kit-tandim.json';

export const load: PageServerLoad = async () => {
	const [liveProduct, liveSettings, liveTheme] = await Promise.all([
		readProduct('kit-tandim').catch(() => null),
		readSettings().catch(() => null),
		readTemplateTheme('stacked').catch(() => getDefaultTheme('stacked'))
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

	const others = [
		{
			slug: 'qofl-al-aman',
			title: 'قفل أمان ذكي: تهنى من حلان التلاجة والبلاكارات 🔒',
			subtitle: 'قفل بسيط وفعّال للخزانات والأدراج',
			heroImage:
				'https://raw.githubusercontent.com/hamzazaninda-ux/valoriia/main/static/images/child-safety-lock.webp',
			startingPrice: 49
		}
	];

	return {
		product,
		settings,
		theme: liveTheme,
		others
	};
};
