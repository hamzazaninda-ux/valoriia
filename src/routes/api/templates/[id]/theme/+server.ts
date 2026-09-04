// src/routes/api/templates/[id]/theme/+server.ts
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
  saveTemplateThemeDraft,
  publishTemplateTheme,
  resetTemplateTheme,
  readTemplateThemeDraft
} from '$lib/content/templateTheme';

export const GET: RequestHandler = async ({ params }) => {
  try {
    const theme = await readTemplateThemeDraft(params.id);
    return json(theme);
  } catch (err) {
    console.error('[GET /api/templates/theme]', err);
    return error(500, 'Failed to load theme');
  }
};

export const PUT: RequestHandler = async ({ params, request }) => {
  try {
    const body = await request.json();
    const { action, theme } = body as { action: string; theme?: unknown };

    switch (action) {
      case 'save-draft': {
        if (!theme) return error(400, 'Missing theme data');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await saveTemplateThemeDraft(params.id, theme as any);
        return json({ success: true, message: 'تم حفظ المسودة بنجاح ✅' });
      }
      case 'publish': {
        await publishTemplateTheme(params.id);
        return json({ success: true, message: 'تم نشر التغييرات بنجاح 🚀' });
      }
      case 'reset': {
        await resetTemplateTheme(params.id);
        const defaultTheme = await readTemplateThemeDraft(params.id);
        return json({ success: true, message: 'تم إعادة التعيين للإعدادات الافتراضية ↩️', theme: defaultTheme });
      }
      default:
        return error(400, `Unknown action: ${action}`);
    }
  } catch (err) {
    console.error('[PUT /api/templates/theme]', err);
    return error(500, 'Failed to process theme request');
  }
};
