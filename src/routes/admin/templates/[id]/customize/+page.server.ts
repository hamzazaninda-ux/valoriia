// src/routes/admin/templates/[id]/customize/+page.server.ts
import type { PageServerLoad } from './$types';
import { getTemplate } from '$lib/content/templates';
import { readTemplateThemeDraft } from '$lib/content/templateTheme';
import { error } from '@sveltejs/kit';
import { getAvailableTemplateIds } from '$lib/content/templateLoader';

export const load: PageServerLoad = async ({ params }) => {
  const { id } = params;

  // Validate template exists
  const availableIds = getAvailableTemplateIds();
  if (!availableIds.includes(id)) {
    throw error(404, `Template "${id}" not found`);
  }

  const [metadata, theme] = await Promise.all([
    getTemplate(id),
    readTemplateThemeDraft(id),
  ]);

  return {
    templateId: id,
    metadata,
    theme,
  };
};
