import type { LayoutServerLoad } from './$types';
import { readSettings } from '$lib/content/settings';

export const load: LayoutServerLoad = async () => {
  const settings = await readSettings();
  return {
    settings
  };
};
