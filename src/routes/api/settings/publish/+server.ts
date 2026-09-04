import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { publishSettings } from '$lib/content/settings';

export const POST: RequestHandler = async () => {
  try {
    await publishSettings();
    return json({ success: true });
  } catch (err) {
    return json({ error: 'Failed to publish settings' }, { status: 500 });
  }
};
