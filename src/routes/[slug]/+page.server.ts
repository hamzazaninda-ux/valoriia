import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { listProducts, readProduct } from '$lib/content/products';
import { readSettings } from '$lib/content/settings';
import { readTemplateTheme } from '$lib/content/templateTheme';

export const load: PageServerLoad = async ({ params }) => {
  const product = await readProduct(params.slug);

  if (!product || product.status !== 'published') {
    throw redirect(302, '/');
  }

  const settings = await readSettings();
  const theme = await readTemplateTheme(product.template || 'classic');

  // Other published products for cart cross-sell / post-purchase upsell:
  // Active upsell sequence strictly contains EXACTLY 2 products:
  // 1. صمام تصريف ذكي مضاد للروائح والحشرات — 49 DH
  // 2. قفل الأمان للأطفال — 49 DH
  let others: Array<{ slug: string; title: string; subtitle?: string; heroImage?: string; startingPrice?: number }> = [];
	others = [
		{
			slug: 'samam-tasrif',
			title: 'تهنى نهائياً من ريحة المجاري والصراصير 🪳',
			subtitle: 'صمام تصريف ذكي مضاد للروائح والحشرات',
			heroImage: 'https://res.cloudinary.com/xqjngk8y/image/upload/v1791060860/%D9%85%D9%82%D8%A7%D8%B1%D9%86%D8%A9_%D9%82%D8%A8%D9%84_%D9%88%D8%A8%D8%B9%D8%AF_%D9%84%D8%B3%D8%AF%D8%A9_%D9%85%D8%B5%D8%B1%D9%81_%D8%A7%D9%84%D8%A3%D8%B1%D8%B6%D9%8A%D8%A9.png',
			startingPrice: 35
		},
		{
			slug: 'qofl-al-aman',
			title: 'قفل أمان ذكي: تهنى من حلان التلاجة والبلاكارات 🔒',
			subtitle: 'حماية متكاملة للأطفال',
			heroImage: 'https://raw.githubusercontent.com/hamzazaninda-ux/valoriia/main/static/images/child-safety-lock.webp',
			startingPrice: 49
		}
	].filter(p => p.slug !== product.slug);

  return {
    product,
    settings,
    theme,
    others
  };
};
