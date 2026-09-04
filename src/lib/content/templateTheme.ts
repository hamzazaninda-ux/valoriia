// src/lib/content/templateTheme.ts
// Read/write template theme settings from GitHub (or local fallback)

import { gitReadFile, gitWriteFile, gitEnsureBranch } from './git';
import { getDefaultTheme, type TemplateTheme } from '$lib/types/theme';

const THEMES_PATH = 'content/templates';

/**
 * Read the published theme for a template.
 * Falls back to default theme if not found.
 */
export async function readTemplateTheme(templateId: string): Promise<TemplateTheme> {
  try {
    const content = await gitReadFile('main', `${THEMES_PATH}/${templateId}/theme.json`);
    const saved = JSON.parse(content) as TemplateTheme;
    // Merge with defaults to handle missing fields from older saves
    const defaults = getDefaultTheme(templateId);
    return deepMerge(defaults as unknown as Record<string, unknown>, saved as unknown as Record<string, unknown>) as unknown as TemplateTheme;
  } catch {
    return getDefaultTheme(templateId);
  }
}

/**
 * Read the draft theme for a template.
 * Falls back to published theme, then default.
 */
export async function readTemplateThemeDraft(templateId: string): Promise<TemplateTheme> {
  try {
    const content = await gitReadFile('draft', `${THEMES_PATH}/${templateId}/theme.json`);
    const saved = JSON.parse(content) as TemplateTheme;
    const defaults = getDefaultTheme(templateId);
    return deepMerge(defaults as unknown as Record<string, unknown>, saved as unknown as Record<string, unknown>) as unknown as TemplateTheme;
  } catch {
    try {
      return await readTemplateTheme(templateId);
    } catch {
      return getDefaultTheme(templateId);
    }
  }
}

/**
 * Save draft theme settings for a template.
 */
export async function saveTemplateThemeDraft(templateId: string, theme: TemplateTheme): Promise<void> {
  await gitEnsureBranch('draft');
  const payload: TemplateTheme = {
    ...theme,
    id: templateId,
    baseTemplate: theme.baseTemplate || templateId,
    updatedAt: new Date().toISOString(),
  };
  await gitWriteFile(
    'draft',
    `${THEMES_PATH}/${templateId}/theme.json`,
    JSON.stringify(payload, null, 2),
    `chore(theme): update draft theme for "${templateId}"`
  );
}

/**
 * Publish the draft theme to main branch.
 */
export async function publishTemplateTheme(templateId: string): Promise<void> {
  const theme = await readTemplateThemeDraft(templateId);
  const payload: TemplateTheme = {
    ...theme,
    updatedAt: new Date().toISOString(),
  };
  await gitWriteFile(
    'main',
    `${THEMES_PATH}/${templateId}/theme.json`,
    JSON.stringify(payload, null, 2),
    `feat(theme): publish theme for template "${templateId}"`
  );
}

/**
 * Reset a template's theme to its defaults (saves as draft).
 */
export async function resetTemplateTheme(templateId: string): Promise<void> {
  await gitEnsureBranch('draft');
  const defaultTheme = getDefaultTheme(templateId);
  await gitWriteFile(
    'draft',
    `${THEMES_PATH}/${templateId}/theme.json`,
    JSON.stringify(defaultTheme, null, 2),
    `chore(theme): reset theme to defaults for "${templateId}"`
  );
}

/**
 * Read themes for all known templates.
 */
export async function readAllTemplateThemes(): Promise<Record<string, TemplateTheme>> {
  const ids = ['classic', 'modern', 'minimal', 'killers'];
  const themes = await Promise.all(ids.map((id) => readTemplateThemeDraft(id)));
  return Object.fromEntries(ids.map((id, i) => [id, themes[i]]));
}

// =============================================================================
// Utility: deep merge two objects (source overrides defaults)
// =============================================================================
function deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = { ...target };
  for (const key of Object.keys(source)) {
    if (
      source[key] !== null &&
      typeof source[key] === 'object' &&
      !Array.isArray(source[key]) &&
      typeof target[key] === 'object' &&
      target[key] !== null &&
      !Array.isArray(target[key])
    ) {
      result[key] = deepMerge(
        target[key] as Record<string, unknown>,
        source[key] as Record<string, unknown>
      );
    } else if (source[key] !== undefined) {
      result[key] = source[key];
    }
  }
  return result;
}
