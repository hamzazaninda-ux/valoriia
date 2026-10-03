import type { PageServerLoad } from './$types';
import { readCommerceSettings } from '$lib/content/settings';

export const load: PageServerLoad = async () => {
  try {
    const commerce = await readCommerceSettings();
    return {
      sheetsUrl: commerce?.googleSheetsUrl || ''
    };
  } catch {
    return {
      sheetsUrl: 'https://script.google.com/macros/s/AKfycbyQVUxZSp39uvD07JYBhuQLChWPwRRyyOhXT9iGoHvoJ1ge_SjPk0rqtIwPcF6_ksO7iQ/exec'
    };
  }
};
