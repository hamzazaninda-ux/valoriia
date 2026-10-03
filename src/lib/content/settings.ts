import { gitEnsureBranch, gitReadFile, gitWriteFile } from './git';
import type { BrandSettings, CommerceSettings, TrackingSettings, GlobalSettings } from '$lib/types/settings';

const SETTINGS_PATH = 'content/settings';

async function captureFileState(branch: string, path: string): Promise<string | null> {
  try {
    return await gitReadFile(branch, path);
  } catch {
    return null;
  }
}

const SENSITIVE_KEYS = ['password', 'passwordHash', 'password_hash', 'adminPassword', 'admin_password'];

function checkBrandForSensitiveFields(data: Record<string, unknown>): void {
  for (const key of Object.keys(data)) {
    if (SENSITIVE_KEYS.includes(key.toLowerCase())) {
      console.warn(
        `[SECURITY] "${key}" found in brand.json! `
        + 'The admin password hash must only be stored in the ADMIN_PASSWORD_HASH environment variable. '
        + 'Remove this field from brand.json immediately.'
      );
    }
  }
}

export async function readBrandSettings(): Promise<BrandSettings> {
  const content = await gitReadFile('main', `${SETTINGS_PATH}/brand.json`);
  const data = JSON.parse(content);
  checkBrandForSensitiveFields(data);
  return data as BrandSettings;
}

export async function readCommerceSettings(): Promise<CommerceSettings> {
  const content = await gitReadFile('main', `${SETTINGS_PATH}/commerce.json`);
  const data = JSON.parse(content);
  return {
    currency: 'MAD',
    currencySymbol: 'د.م',
    freeShippingText: 'توصيل مجاني لجميع مدن المغرب',
    paymentMethod: 'الدفع عند الاستلام (COD)',
    googleSheetsUrl: '',
    postOrderUpsellImage: '',
    ...data
  } as CommerceSettings;
}

export async function readTrackingSettings(): Promise<TrackingSettings> {
  const content = await gitReadFile('main', `${SETTINGS_PATH}/tracking.json`);
  const data = JSON.parse(content);
  return {
    gtmContainerId: '',
    facebookPixelId: '',
    tiktokPixelId: '',
    snapchatPixelId: '',
    googleAnalyticsId: '',
    googleAdsId: '',
    defaultOgImage: '',
    siteUrl: '',
    customHeadScripts: '',
    customBodyScripts: '',
    ...data
  } as TrackingSettings;
}

export async function readSettings(): Promise<GlobalSettings> {
  const [brand, commerce, tracking] = await Promise.all([
    readBrandSettings(),
    readCommerceSettings(),
    readTrackingSettings()
  ]);

  return { brand, commerce, tracking };
}

export async function readSettingsForAdmin(): Promise<GlobalSettings> {
  try {
    const [brand, commerce, tracking] = await Promise.all([
      gitReadFile('draft', `${SETTINGS_PATH}/brand.json`),
      gitReadFile('draft', `${SETTINGS_PATH}/commerce.json`),
      gitReadFile('draft', `${SETTINGS_PATH}/tracking.json`)
    ]);
    const brandData = JSON.parse(brand);
    checkBrandForSensitiveFields(brandData);
    const commerceData = {
      currency: 'MAD',
      currencySymbol: 'د.م',
      freeShippingText: 'توصيل مجاني لجميع مدن المغرب',
      paymentMethod: 'الدفع عند الاستلام (COD)',
      googleSheetsUrl: '',
      postOrderUpsellImage: '',
      ...JSON.parse(commerce)
    };
    const trackingData = {
      gtmContainerId: '',
      facebookPixelId: '',
      tiktokPixelId: '',
      snapchatPixelId: '',
      googleAnalyticsId: '',
      googleAdsId: '',
      defaultOgImage: '',
      siteUrl: '',
      customHeadScripts: '',
      customBodyScripts: '',
      ...JSON.parse(tracking)
    };
    return { brand: brandData, commerce: commerceData, tracking: trackingData };
  } catch {
    return readSettings();
  }
}

export async function saveSettings(settings: GlobalSettings): Promise<void> {
  await gitEnsureBranch('draft');

  // Defense-in-depth: strip any sensitive fields before writing
  const safeBrand = { ...settings.brand };
  for (const key of Object.keys(safeBrand as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.includes(key.toLowerCase())) {
      delete (safeBrand as Record<string, unknown>)[key];
      console.warn(`[SECURITY] Stripped sensitive field "${key}" from brand settings before saving.`);
    }
  }

  // Capture previous state of all 3 files before writing
  const before = {
    brand: await captureFileState('draft', `${SETTINGS_PATH}/brand.json`),
    commerce: await captureFileState('draft', `${SETTINGS_PATH}/commerce.json`),
    tracking: await captureFileState('draft', `${SETTINGS_PATH}/tracking.json`)
  };

  const writeOpts = (path: string, content: string, msg: string) => ({
    path, content, msg
  });

  const writes = [
    writeOpts(`${SETTINGS_PATH}/brand.json`, JSON.stringify(safeBrand, null, 2), 'Update brand settings'),
    writeOpts(`${SETTINGS_PATH}/commerce.json`, JSON.stringify(settings.commerce, null, 2), 'Update commerce settings'),
    writeOpts(`${SETTINGS_PATH}/tracking.json`, JSON.stringify(settings.tracking, null, 2), 'Update tracking settings')
  ];

  const written: number[] = [];

  try {
    for (let i = 0; i < writes.length; i++) {
      await gitWriteFile('draft', writes[i].path, writes[i].content, writes[i].msg);
      written.push(i);
    }
  } catch (err) {
    console.error('[saveSettings] Write failed, rolling back...', err);
    // Rollback in reverse order
    for (let i = written.length - 1; i >= 0; i--) {
      const idx = written[i];
      const prev = idx === 0 ? before.brand : idx === 1 ? before.commerce : before.tracking;
      const path = writes[idx].path;
      try {
        if (prev !== null) {
          await gitWriteFile('draft', path, prev, `Rollback: restore ${path}`);
        }
      } catch (rbErr) {
        console.error(`[saveSettings] Rollback failed for ${path}:`, rbErr);
      }
    }
    throw new Error('Failed to save settings — changes rolled back.');
  }
}

export async function publishSettings(): Promise<void> {
  const settings = await readSettingsForAdmin();

  const safeBrand = { ...settings.brand };
  for (const key of Object.keys(safeBrand as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.includes(key.toLowerCase())) {
      delete (safeBrand as Record<string, unknown>)[key];
      console.warn(`[SECURITY] Stripped sensitive field "${key}" from brand settings before publishing.`);
    }
  }

  const before = {
    brand: await captureFileState('main', `${SETTINGS_PATH}/brand.json`),
    commerce: await captureFileState('main', `${SETTINGS_PATH}/commerce.json`),
    tracking: await captureFileState('main', `${SETTINGS_PATH}/tracking.json`)
  };

  const writes = [
    { path: `${SETTINGS_PATH}/brand.json`, content: JSON.stringify(safeBrand, null, 2), msg: 'Publish brand settings' },
    { path: `${SETTINGS_PATH}/commerce.json`, content: JSON.stringify(settings.commerce, null, 2), msg: 'Publish commerce settings' },
    { path: `${SETTINGS_PATH}/tracking.json`, content: JSON.stringify(settings.tracking, null, 2), msg: 'Publish tracking settings' }
  ];

  const written: number[] = [];

  try {
    for (let i = 0; i < writes.length; i++) {
      await gitWriteFile('main', writes[i].path, writes[i].content, writes[i].msg);
      written.push(i);
    }
  } catch (err) {
    console.error('[publishSettings] Write failed, rolling back...', err);
    for (let i = written.length - 1; i >= 0; i--) {
      const idx = written[i];
      const prev = idx === 0 ? before.brand : idx === 1 ? before.commerce : before.tracking;
      const path = writes[idx].path;
      try {
        if (prev !== null) {
          await gitWriteFile('main', path, prev, `Rollback: restore ${path}`);
        }
      } catch (rbErr) {
        console.error(`[publishSettings] Rollback failed for ${path}:`, rbErr);
      }
    }
    throw new Error('Failed to publish settings — changes rolled back.');
  }
}
