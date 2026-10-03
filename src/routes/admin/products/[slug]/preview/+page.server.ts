import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { listProducts, readProduct, readProductDraft } from '$lib/content/products';
import { readSettingsForAdmin } from '$lib/content/settings';
import { readTemplateThemeDraft } from '$lib/content/templateTheme';

export const load: PageServerLoad = async ({ params }) => {
  const draft = await readProductDraft(params.slug);
  const published = await readProduct(params.slug);

  if (!draft && !published) {
    throw redirect(302, '/admin/products');
  }

  const product = draft || published!;
  const settings = await readSettingsForAdmin();
  const theme = await readTemplateThemeDraft(product.template || 'classic');

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
      title: p.slug === 'hamil-jidari-makanis' ? 'حامل جداري للمكانس والممسحات - منظم حمام متعدد الاستخدامات' : p.slug === 'qofl-al-aman' ? 'حمي صغارك من الحوادث اليومية 🔒' : p.title,
      subtitle: p.subtitle,
      heroImage: p.slug === 'hamil-jidari-makanis' ? '' : p.slug === 'qofl-al-aman' ? 'https://raw.githubusercontent.com/hamzazaninda-ux/valoriia/main/static/images/child-safety-lock.webp' : (p.heroImage || ''),
      startingPrice: p.slug === 'hamil-jidari-makanis' ? 99 : p.slug === 'qofl-al-aman' ? 49 : p.startingPrice
    }));
  } catch {
    others = [];
  }

  return {
    product,
    settings,
    theme,
    others,
    isDraft: !!draft
  };
};
