// src/routes/admin/templates/+page.server.ts
import type { PageServerLoad } from './$types';
import { listTemplates } from '$lib/content/templates';
import { readAllTemplateThemes } from '$lib/content/templateTheme';

export const load: PageServerLoad = async () => {
  const [registry, themes] = await Promise.all([
    listTemplates(),
    readAllTemplateThemes(),
  ]);

  return {
    templates: registry,
    themes,
  };
};
