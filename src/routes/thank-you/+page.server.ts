import type { PageServerLoad } from './$types';
import { readBrandSettings } from '$lib/content/settings';

export const load: PageServerLoad = async () => {
  try {
    const brand = await readBrandSettings().catch(() => null);
    return {
      whatsappNumber: brand?.whatsappNumber || '212600000000'
    };
  } catch {
    return {
      whatsappNumber: '212600000000'
    };
  }
};
