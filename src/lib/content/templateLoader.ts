import type { Component } from 'svelte';
import type { TemplateProps, TemplateRegistryItem } from '$lib/types/templates';

const templateModules = import.meta.glob<{
  default: Component<TemplateProps>;
}>('/src/lib/components/templates/*/Template.svelte', { eager: true });

function resolveModulePath(templateId: string): string {
  return `/src/lib/components/templates/${templateId}/Template.svelte`;
}

export function loadTemplateComponent(templateId: string): Component<TemplateProps> | null {
  const path = resolveModulePath(templateId);
  const mod = templateModules[path];
  if (!mod) return null;
  return mod.default;
}

export function loadTemplateComponentSync(templateId: string): Component<TemplateProps> {
  const component = loadTemplateComponent(templateId);
  if (component) return component;

  if (templateId !== 'classic') {
    console.warn(`[TemplateLoader] Template "${templateId}" not found, falling back to classic`);
    const classic = loadTemplateComponent('classic');
    if (classic) return classic;
  }

  throw new Error(`[TemplateLoader] No template component found for "${templateId}"`);
}

export async function loadTemplateComponentAsync(templateId: string): Promise<Component<TemplateProps>> {
  const component = loadTemplateComponent(templateId);
  if (component) return component;

  if (templateId !== 'classic') {
    console.warn(`[TemplateLoader] Template "${templateId}" not found, falling back to classic`);
    const classic = loadTemplateComponent('classic');
    if (classic) return classic;
  }

  throw new Error(`[TemplateLoader] No template component found for "${templateId}"`);
}

export function getAvailableTemplateIds(): string[] {
  return Object.keys(templateModules).map((path) => {
    const match = path.match(/\/templates\/([^/]+)\/Template\.svelte$/);
    return match ? match[1] : '';
  }).filter(Boolean);
}

export function resolveTemplate(
  templateId: string | undefined,
  registry: TemplateRegistryItem[]
): { id: string; metadata: TemplateRegistryItem } {
  const availableIds = getAvailableTemplateIds();

  if (templateId) {
    const metadata = registry.find((t) => t.id === templateId);
    if (metadata && availableIds.includes(templateId)) {
      return { id: templateId, metadata };
    }
    console.warn(`[TemplateLoader] Template "${templateId}" not available, attempting fallback`);
  }

  if (templateId && !availableIds.includes(templateId)) {
    const defaultInRegistry = registry.find((t) => t.isDefault);
    if (defaultInRegistry && availableIds.includes(defaultInRegistry.id)) {
      return { id: defaultInRegistry.id, metadata: defaultInRegistry };
    }
  }

  const fallbackId = availableIds.includes('classic') ? 'classic' : availableIds[0];
  if (!fallbackId) {
    throw new Error('[TemplateLoader] No template components found');
  }

  const metadata = registry.find((t) => t.id === fallbackId) || {
    id: fallbackId,
    name: fallbackId,
    description: `Template: ${fallbackId}`,
    thumbnail: '',
    isDefault: true,
  };

  return { id: fallbackId, metadata };
}
