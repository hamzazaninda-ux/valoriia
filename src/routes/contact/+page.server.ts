import type { PageServerLoad } from './$types';
import { readBrandSettings } from '$lib/content/settings';

export const load: PageServerLoad = async () => {
  try {
    const brand = await readBrandSettings().catch(() => null);
    return {
      brand: {
        name: brand?.name || 'NOVAVITA',
        tagline: brand?.tagline || 'العناية بالجمال والصحة من الداخل',
        whatsappNumber: brand?.whatsappNumber || '212600000000',
        supportHours: brand?.supportHours || 'طيلة أيام الأسبوع من 9:00 صباحاً إلى 22:00 مساءً'
      }
    };
  } catch {
    return {
      brand: {
        name: 'NOVAVITA',
        tagline: 'العناية بالجمال والصحة من الداخل',
        whatsappNumber: '212600000000',
        supportHours: 'طيلة أيام الأسبوع من 9:00 صباحاً إلى 22:00 مساءً'
      }
    };
  }
};
