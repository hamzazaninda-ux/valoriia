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
    const excludedSlugs = new Set(['mimsahat-asyr', 'monazzim-daki', 'hamil-jidari-makanis']);
    const allowed = all.filter(
      (p) => p.status === 'published' && p.slug !== product.slug && !excludedSlugs.has(p.slug)
    );
    const orderMap: Record<string, number> = {
      'samam-tasrif': 1,
      'filter-baloua': 1,
      'qofl-al-aman': 2
    };
    allowed.sort((a, b) => (orderMap[a.slug] || 99) - (orderMap[b.slug] || 99));

    others = allowed.slice(0, 2).map((p) => ({
      slug: p.slug === 'filter-baloua' ? 'samam-tasrif' : p.slug,
      title:
        p.slug === 'samam-tasrif' || p.slug === 'filter-baloua'
          ? 'تهنى نهائياً من ريحة المجاري والصراصير 🪳'
          : p.slug === 'qofl-al-aman'
            ? 'حمي صغارك من الحوادث اليومية 🔒'
            : p.title,
      subtitle:
        p.slug === 'samam-tasrif' || p.slug === 'filter-baloua'
          ? 'صمام تصريف ذكي مضاد للروائح والحشرات'
          : p.subtitle,
      heroImage:
        p.slug === 'samam-tasrif' || p.slug === 'filter-baloua'
          ? 'https://res.cloudinary.com/xqjngk8y/image/upload/v1791060860/%D9%85%D9%82%D8%A7%D8%B1%D9%86%D8%A9_%D9%82%D8%A8%D9%84_%D9%88%D8%A8%D8%B9%D8%AF_%D9%84%D8%B3%D8%AF%D8%A7%D8%AF%D8%A9_%D9%85%D8%B5%D8%B1%D9%81_%D8%A7%D9%84%D8%A3%D8%B1%D8%B6%D9%8A%D8%A9.png'
          : p.slug === 'qofl-al-aman'
            ? 'https://raw.githubusercontent.com/hamzazaninda-ux/valoriia/main/static/images/child-safety-lock.webp'
            : (p.heroImage || ''),
      startingPrice:
        p.slug === 'samam-tasrif' || p.slug === 'filter-baloua'
          ? 35
          : p.slug === 'qofl-al-aman'
            ? 49
            : p.startingPrice
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
