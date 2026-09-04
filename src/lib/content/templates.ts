import { gitReadFile } from './git';
import type { TemplateRegistry, TemplateRegistryItem } from '$lib/types/templates';

const TEMPLATES_PATH = 'content/templates';

export async function listTemplates(): Promise<TemplateRegistry> {
  const content = await gitReadFile('main', `${TEMPLATES_PATH}/registry.json`);
  return JSON.parse(content) as TemplateRegistry;
}

export async function getTemplate(id: string): Promise<TemplateRegistryItem | null> {
  const templates = await listTemplates();
  return templates.find(t => t.id === id) || null;
}

export async function getDefaultTemplate(): Promise<TemplateRegistryItem> {
  const templates = await listTemplates();
  return templates.find(t => t.isDefault) || templates[0];
}
