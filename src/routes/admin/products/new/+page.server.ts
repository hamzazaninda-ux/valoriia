import type { PageServerLoad } from './$types';
import { listTemplates } from '$lib/content/templates';

export const load: PageServerLoad = async () => {
	const templates = await listTemplates();
	return { templates };
};
