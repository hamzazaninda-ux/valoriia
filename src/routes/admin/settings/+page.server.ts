import type { PageServerLoad } from './$types';
import { readSettingsForAdmin } from '$lib/content/settings';

export const load: PageServerLoad = async () => {
  const settings = await readSettingsForAdmin();
  return {
    settings
  };
};
