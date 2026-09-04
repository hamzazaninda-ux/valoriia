import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { cleanupStaleDrafts } from '$lib/content/products';

export const POST: RequestHandler = async ({ request }) => {
  let dryRun = true;
  let thresholdDays = 30;

  try {
    const body = await request.json();
    if (typeof body.dryRun === 'boolean') dryRun = body.dryRun;
    if (typeof body.thresholdDays === 'number' && body.thresholdDays >= 1 && body.thresholdDays <= 365) {
      thresholdDays = body.thresholdDays;
    }
  } catch {
    // Use defaults
  }

  try {
    const report = await cleanupStaleDrafts(dryRun, thresholdDays);
    return json({ success: true, report });
  } catch (err) {
    console.error('[cleanup-drafts] Failed:', err);
    return json({ error: 'Failed to clean up drafts' }, { status: 500 });
  }
};
