import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { listProducts, readProduct } from '$lib/content/products';
import { readSettings } from '$lib/content/settings';
import { readTemplateTheme } from '$lib/content/templateTheme';

export const load: PageServerLoad = async ({ params }) => {
  const gummieSlugs = ['gummies_collagen', 'gummies_biotine', 'gumies_vitamine'];
  if (gummieSlugs.includes(params.slug)) {
    throw redirect(301, `/products/${params.slug}`);
  }

  const product = await readProduct(params.slug);

  if (!product || product.status !== 'published') {
    throw redirect(302, '/');
  }

  const settings = await readSettings();
  const theme = await readTemplateTheme(product.template || 'classic');

  // Other published products for cart cross-sell / post-purchase upsell:
  // Active upsell sequence strictly contains ONLY:
  // قفل أمان ذكي: تهنى من حلان التلاجة والبلاكارات 🔒 — 49 DH
  let others: Array<{ slug: string; title: string; subtitle?: string; heroImage?: string; startingPrice?: number }> = [];
	others = [
		{
			slug: 'qofl-al-aman',
			title: 'قفل أمان ذكي: تهنى من حلان التلاجة والبلاكارات 🔒',
			subtitle: 'قفل بسيط وفعّال للخزانات والأدراج',
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
