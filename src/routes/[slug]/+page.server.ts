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
  // 1. حامل جداري للمكانس والممسحات — 99 DH
  // 2. قفل الأمان للأطفال — 50 DH
  let others: Array<{ slug: string; title: string; subtitle?: string; heroImage?: string; startingPrice?: number }> = [];
  try {
    const all = await listProducts();
    const excludedSlugs = new Set(['mimsahat-asyr', 'monazzim-daki', 'filter-baloua']);
    const allowed = all.filter(
      (p) => p.status === 'published' && p.slug !== product.slug && !excludedSlugs.has(p.slug)
    );
    const orderMap: Record<string, number> = {
      'hamil-jidari-makanis': 1,
      'qofl-al-aman': 2
    };
    allowed.sort((a, b) => (orderMap[a.slug] || 99) - (orderMap[b.slug] || 99));

    others = allowed.slice(0, 2).map((p) => ({
      slug: p.slug,
      title: p.slug === 'hamil-jidari-makanis' ? 'حامل جداري للمكانس والممسحات' : p.slug === 'qofl-al-aman' ? 'قفل الأمان للأطفال' : p.title,
      subtitle: p.subtitle,
      heroImage: p.slug === 'hamil-jidari-makanis' ? '' : p.slug === 'qofl-al-aman' ? '/images/child-safety-lock.webp' : (p.heroImage || ''),
      startingPrice: p.slug === 'hamil-jidari-makanis' ? 99 : p.slug === 'qofl-al-aman' ? 50 : p.startingPrice
    }));
  } catch {
    others = [];
  }

  return {
    product,
    settings,
    theme,
    others
  };
};
