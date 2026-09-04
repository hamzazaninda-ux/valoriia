import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { readSettings, saveSettings } from '$lib/content/settings';
import { GlobalSettingsSchema, parseJsonBody, formatZodError } from '$lib/validation';

export const GET: RequestHandler = async () => {
  const settings = await readSettings();
  return json(settings);
};

export const PUT: RequestHandler = async ({ request }) => {
  const { body, error: parseError } = await parseJsonBody(request);
  if (parseError) {
    return json(parseError.response, { status: parseError.status });
  }

  const result = GlobalSettingsSchema.safeParse(body);
  if (!result.success) {
    return json(formatZodError(result.error), { status: 400 });
  }

  try {
    await saveSettings(result.data);
    return json({ success: true });
  } catch (err) {
    return json({ error: 'Failed to save settings' }, { status: 500 });
  }
};
