import type { PageServerLoad } from './$types';
import { readCommerceSettings, readBrandSettings } from '$lib/content/settings';

export const load: PageServerLoad = async () => {
  try {
    const [commerce, brand] = await Promise.all([
      readCommerceSettings().catch(() => null),
      readBrandSettings().catch(() => null)
    ]);
    return {
      sheetsUrl: commerce?.googleSheetsUrl || 'https://script.google.com/macros/s/AKfycbyQVUxZSp39uvD07JYBhuQLChWPwRRyyOhXT9iGoHvoJ1ge_SjPk0rqtIwPcF6_ksO7iQ/exec',
      whatsappNumber: brand?.whatsappNumber || ''
    };
  } catch {
    return {
      sheetsUrl: 'https://script.google.com/macros/s/AKfycbyQVUxZSp39uvD07JYBhuQLChWPwRRyyOhXT9iGoHvoJ1ge_SjPk0rqtIwPcF6_ksO7iQ/exec',
      whatsappNumber: ''
    };
  }
};
