import { gitReadFile, gitWriteFile, gitDeleteFile, gitEnsureBranch, gitListFiles } from './git';
import type { Product, ProductIndex } from '$lib/types/product';

const CONTENT_PATH = 'content/products';

// =============================================================================
// Slug Safety Guard
// =============================================================================
function isSafeSlug(slug: string): boolean {
  return typeof slug === 'string' && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug);
}

// =============================================================================
// Rollback Helper
// =============================================================================
// Tracks sequential Git operations so that if later steps fail, earlier
// steps can be undone in reverse order.
// =============================================================================
interface RollbackEntry {
  branch: string;
  path: string;
  label: string;
  // Either restore previous content or re-create a deleted file
  rollback: () => Promise<void>;
}

class RollbackStack {
  private entries: RollbackEntry[] = [];

  push(entry: RollbackEntry): void {
    this.entries.push(entry);
  }

  async rollbackAll(): Promise<void> {
    const errors: string[] = [];
    for (let i = this.entries.length - 1; i >= 0; i--) {
      try {
        await this.entries[i].rollback();
        console.log(`[Rollback] Undid: ${this.entries[i].label}`);
      } catch (e) {
        errors.push(`${this.entries[i].label}: ${e}`);
      }
    }
    if (errors.length) {
      console.error('[Rollback] Some rollbacks failed:', errors.join(' | '));
    }
  }

  clear(): void {
    this.entries = [];
  }
}

export async function listProducts(): Promise<ProductIndex> {
  // MED-6: Wrap in try/catch so a missing _index.json or GitHub API error
  // returns an empty list instead of crashing the calling load() function.
  try {
    const content = await gitReadFile('main', `${CONTENT_PATH}/_index.json`);
    return JSON.parse(content) as ProductIndex;
  } catch {
    return [];
  }
}

export async function listProductsForAdmin(): Promise<ProductIndex> {
  const main = await listProducts();
  try {
    const draft = await listProductsFromBranch('draft');
    return [...new Map([...main, ...draft].map((product) => [product.slug, product])).values()];
  } catch {
    return main;
  }
}

export async function readProduct(slug: string): Promise<Product | null> {
  // HIGH-7: Reject slugs that could traverse outside the content directory.
  if (!isSafeSlug(slug)) return null;
  try {
    const content = await gitReadFile('main', `${CONTENT_PATH}/${slug}.json`);
    return JSON.parse(content) as Product;
  } catch {
    return null;
  }
}

export async function readProductDraft(slug: string): Promise<Product | null> {
  // HIGH-7: Reject unsafe slugs before building the file path.
  if (!isSafeSlug(slug)) return null;
  try {
    const content = await gitReadFile('draft', `${CONTENT_PATH}/${slug}.json`);
    return JSON.parse(content) as Product;
  } catch {
    return null;
  }
}

export async function readProductForAdmin(slug: string): Promise<Product | null> {
  const draft = await readProductDraft(slug);
  if (draft) return draft;
  return readProduct(slug);
}

export async function saveProductDraft(product: Product): Promise<void> {
  if (!isSafeSlug(product.slug)) throw new Error('Invalid slug');
  await gitEnsureBranch('draft');
  product.updatedAt = new Date().toISOString();
  product.draft = product.draft || product.published;

  await gitWriteFile(
    'draft',
    `${CONTENT_PATH}/${product.slug}.json`,
    JSON.stringify(product, null, 2),
    `Update ${product.slug} draft`
  );

  await updateIndex('draft');
}

export async function createProduct(product: Product): Promise<void> {
  if (!isSafeSlug(product.slug)) throw new Error('Invalid slug');
  // HIGH-5: Do NOT mutate the caller's object. Deep clone first.
  await gitEnsureBranch('draft');
  const now = new Date().toISOString();
  const storedProduct: Product = {
    ...structuredClone(product),
    createdAt: now,
    updatedAt: now,
    status: 'draft',
    // Set draft = published so the admin has an editable copy immediately.
    draft: product.published
  };

  await gitWriteFile(
    'draft',
    `${CONTENT_PATH}/${storedProduct.slug}.json`,
    JSON.stringify(storedProduct, null, 2),
    `Create ${storedProduct.slug}`
  );

  await updateIndex('draft');
}

export async function publishProduct(slug: string): Promise<void> {
  if (!isSafeSlug(slug)) throw new Error('Invalid slug');
  const draft = await readProductDraft(slug);
  if (!draft) throw new Error('No draft found for this product');

  draft.published = draft.draft || draft.published;
  draft.draft = null;
  draft.status = 'published';
  draft.updatedAt = new Date().toISOString();
  draft.meta.changelog.push({
    action: 'published',
    timestamp: new Date().toISOString()
  });

  const rollback = new RollbackStack();
  const productPath = `${CONTENT_PATH}/${slug}.json`;
  const publishedContent = JSON.stringify(draft, null, 2);

  try {
    // --- Step 1: Capture current main file state (for rollback) ---
    const mainBefore = await captureFileState('main', productPath);
    // --- Step 2: Write published product to main ---
    await gitWriteFile('main', productPath, publishedContent, `Publish ${slug}`);
    rollback.push({
      branch: 'main', path: productPath, label: `restore main ${slug}`,
      rollback: async () => {
        if (mainBefore) {
          await gitWriteFile('main', productPath, mainBefore, `Rollback: restore ${slug} on main`);
        } else {
          await gitDeleteFile('main', productPath, `Rollback: remove ${slug} from main`);
        }
      }
    });

    // --- Step 3: Capture & update main index ---
    const mainIndexBefore = await captureFileState('main', `${CONTENT_PATH}/_index.json`);
    await updateIndex('main');
    rollback.push({
      branch: 'main', path: `${CONTENT_PATH}/_index.json`, label: 'restore main index',
      rollback: async () => {
        if (mainIndexBefore) {
          await gitWriteFile('main', `${CONTENT_PATH}/_index.json`, mainIndexBefore, 'Rollback: restore main index');
        }
      }
    });

    // --- Step 4: Capture & delete draft file ---
    const draftBefore = await captureFileState('draft', productPath);
    await gitDeleteFile('draft', productPath, `Clear published ${slug} draft`);
    rollback.push({
      branch: 'draft', path: productPath, label: `restore draft ${slug}`,
      rollback: async () => {
        if (draftBefore) {
          await gitWriteFile('draft', productPath, draftBefore, `Rollback: restore ${slug} draft`);
        }
      }
    });

    // --- Step 5: Capture & update draft index ---
    const draftIndexBefore = await captureFileState('draft', `${CONTENT_PATH}/_index.json`);
    await updateIndex('draft');
    rollback.push({
      branch: 'draft', path: `${CONTENT_PATH}/_index.json`, label: 'restore draft index',
      rollback: async () => {
        if (draftIndexBefore) {
          await gitWriteFile('draft', `${CONTENT_PATH}/_index.json`, draftIndexBefore, 'Rollback: restore draft index');
        }
      }
    });
  } catch (err) {
    console.error(`[publishProduct] Failed at step, initiating rollback for "${slug}":`, err);
    await rollback.rollbackAll();
    throw new Error(`Failed to publish "${slug}" — changes rolled back.`);
  }
}

async function captureFileState(branch: string, path: string): Promise<string | null> {
  try {
    return await gitReadFile(branch, path);
  } catch {
    return null;
  }
}

export async function unpublishProduct(slug: string): Promise<void> {
  if (!isSafeSlug(slug)) throw new Error('Invalid slug');
  const product = await readProduct(slug);
  if (!product) throw new Error('Product not found');

  product.status = 'draft';
  product.draft = product.published;
  product.updatedAt = new Date().toISOString();
  product.meta.changelog.push({
    action: 'unpublished',
    timestamp: new Date().toISOString()
  });

  const rollback = new RollbackStack();
  const productPath = `${CONTENT_PATH}/${slug}.json`;
  const updatedContent = JSON.stringify(product, null, 2);

  try {
    // --- Step 1: Write updated product to main ---
    const mainBefore = await captureFileState('main', productPath);
    await gitWriteFile('main', productPath, updatedContent, `Unpublish ${slug}`);
    rollback.push({
      branch: 'main', path: productPath, label: `restore main ${slug}`,
      rollback: async () => {
        if (mainBefore) {
          await gitWriteFile('main', productPath, mainBefore, `Rollback: restore ${slug} on main`);
        } else {
          await gitDeleteFile('main', productPath, `Rollback: remove ${slug} from main`);
        }
      }
    });

    // --- Step 2: Ensure draft branch exists ---
    await gitEnsureBranch('draft');

    // --- Step 3: Write draft file ---
    const draftBefore = await captureFileState('draft', productPath);
    await gitWriteFile('draft', productPath, updatedContent, `Create ${slug} draft`);
    rollback.push({
      branch: 'draft', path: productPath, label: `restore draft ${slug}`,
      rollback: async () => {
        if (draftBefore) {
          await gitWriteFile('draft', productPath, draftBefore, `Rollback: restore ${slug} draft`);
        } else {
          await gitDeleteFile('draft', productPath, `Rollback: remove ${slug} from draft`);
        }
      }
    });

    // --- Step 4: Update main index ---
    const mainIndexBefore = await captureFileState('main', `${CONTENT_PATH}/_index.json`);
    await updateIndex('main');
    rollback.push({
      branch: 'main', path: `${CONTENT_PATH}/_index.json`, label: 'restore main index',
      rollback: async () => {
        if (mainIndexBefore) {
          await gitWriteFile('main', `${CONTENT_PATH}/_index.json`, mainIndexBefore, 'Rollback: restore main index');
        }
      }
    });

    // --- Step 5: Update draft index ---
    const draftIndexBefore = await captureFileState('draft', `${CONTENT_PATH}/_index.json`);
    await updateIndex('draft');
    rollback.push({
      branch: 'draft', path: `${CONTENT_PATH}/_index.json`, label: 'restore draft index',
      rollback: async () => {
        if (draftIndexBefore) {
          await gitWriteFile('draft', `${CONTENT_PATH}/_index.json`, draftIndexBefore, 'Rollback: restore draft index');
        }
      }
    });
  } catch (err) {
    console.error(`[unpublishProduct] Failed at step, initiating rollback for "${slug}":`, err);
    await rollback.rollbackAll();
    throw new Error(`Failed to unpublish "${slug}" — changes rolled back.`);
  }
}

export async function deleteProduct(slug: string): Promise<void> {
  if (!isSafeSlug(slug)) throw new Error('Invalid slug');

  const rollback = new RollbackStack();
  const productPath = `${CONTENT_PATH}/${slug}.json`;

  try {
    // --- Step 1: Delete from main ---
    const mainBefore = await captureFileState('main', productPath);
    await gitDeleteFile('main', productPath, `Delete ${slug} from main`);
    rollback.push({
      branch: 'main', path: productPath, label: `restore main ${slug}`,
      rollback: async () => {
        if (mainBefore) {
          await gitWriteFile('main', productPath, mainBefore, `Rollback: restore ${slug} on main`);
        }
      }
    });

    // --- Step 2: Update main index ---
    const mainIndexBefore = await captureFileState('main', `${CONTENT_PATH}/_index.json`);
    await updateIndex('main');
    rollback.push({
      branch: 'main', path: `${CONTENT_PATH}/_index.json`, label: 'restore main index',
      rollback: async () => {
        if (mainIndexBefore) {
          await gitWriteFile('main', `${CONTENT_PATH}/_index.json`, mainIndexBefore, 'Rollback: restore main index');
        }
      }
    });

    // --- Step 3: Delete from draft ---
    const draftBefore = await captureFileState('draft', productPath);
    await gitDeleteFile('draft', productPath, `Delete ${slug} from draft`);
    rollback.push({
      branch: 'draft', path: productPath, label: `restore draft ${slug}`,
      rollback: async () => {
        if (draftBefore) {
          await gitWriteFile('draft', productPath, draftBefore, `Rollback: restore ${slug} draft`);
        }
      }
    });

    // --- Step 4: Update draft index ---
    const draftIndexBefore = await captureFileState('draft', `${CONTENT_PATH}/_index.json`);
    await updateIndex('draft');
    rollback.push({
      branch: 'draft', path: `${CONTENT_PATH}/_index.json`, label: 'restore draft index',
      rollback: async () => {
        if (draftIndexBefore) {
          await gitWriteFile('draft', `${CONTENT_PATH}/_index.json`, draftIndexBefore, 'Rollback: restore draft index');
        }
      }
    });
  } catch (err) {
    console.error(`[deleteProduct] Failed at step, initiating rollback for "${slug}":`, err);
    await rollback.rollbackAll();
    throw new Error(`Failed to delete "${slug}" — changes rolled back.`);
  }
}

export interface CleanupReport {
  dryRun: boolean;
  deleted: string[];
  skipped: { slug: string; reason: string }[];
  errors: { slug: string; error: string }[];
  thresholdDays: number;
}

export async function cleanupStaleDrafts(dryRun: boolean = false, thresholdDays: number = 30): Promise<CleanupReport> {
  const report: CleanupReport = { dryRun, deleted: [], skipped: [], errors: [], thresholdDays };

  let draftFiles: string[];
  try {
    draftFiles = await gitListFiles('draft', CONTENT_PATH);
  } catch {
    return report;
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - thresholdDays);

  for (const file of draftFiles) {
    if (file === '_index.json' || !file.endsWith('.json')) continue;
    const slug = file.replace(/\.json$/, '');

    try {
      if (!isSafeSlug(slug)) {
        report.skipped.push({ slug, reason: 'Invalid slug format' });
        continue;
      }

      // Read the draft product to check its updatedAt
      const draftContent = await gitReadFile('draft', `${CONTENT_PATH}/${file}`);
      const draftProduct = JSON.parse(draftContent) as Product;
      const updatedAt = new Date(draftProduct.updatedAt);

      // Check if the product exists on main (is published)
      const mainProduct = await readProduct(slug);

      // Safety: never delete drafts for products not published on main
      if (!mainProduct || mainProduct.status !== 'published') {
        report.skipped.push({ slug, reason: 'Product not published on main — keeping draft' });
        continue;
      }

      // Only delete if the draft hasn't been updated in thresholdDays
      if (updatedAt > cutoff) {
        report.skipped.push({ slug, reason: `Draft updated recently (${draftProduct.updatedAt})` });
        continue;
      }

      // Also check that the draft doesn't have actual pending changes (draft !== null)
      if (draftProduct.draft !== null) {
        report.skipped.push({ slug, reason: 'Draft has pending unpublished changes' });
        continue;
      }

      if (!dryRun) {
        await gitDeleteFile('draft', `${CONTENT_PATH}/${file}`, `Cleanup stale draft: ${slug}`);
      }
      report.deleted.push(slug);
    } catch (err) {
      report.errors.push({ slug, error: String(err) });
    }
  }

  // Update draft index if not dry run and we actually deleted something
  if (!dryRun && report.deleted.length > 0) {
    try {
      await updateIndex('draft');
    } catch (err) {
      console.error('[cleanupStaleDrafts] Failed to update draft index:', err);
    }
  }

  return report;
}

async function updateIndex(branch: string): Promise<void> {
  try {
    const files = await gitListFiles(branch, CONTENT_PATH);
    const index: ProductIndex = [];

    for (const file of files) {
      if (file === '_index.json') continue;
      if (!file.endsWith('.json')) continue;

      try {
        const content = await gitReadFile(branch, `${CONTENT_PATH}/${file}`);
        const product = JSON.parse(content) as Product;
        const version = product.draft || product.published;
        index.push({
          id: product.id,
          slug: product.slug,
          title: version.content.title,
          subtitle: version.content.subtitle,
          heroImage: version.content.heroImage,
          startingPrice: version.pricing.offers.length ? Math.min(...version.pricing.offers.map(o => o.price)) : 0,
          status: product.status,
          template: product.template,
          updatedAt: product.updatedAt
        });
      } catch {
        // Skip invalid files
      }
    }

    await gitWriteFile(
      branch,
      `${CONTENT_PATH}/_index.json`,
      JSON.stringify(index, null, 2),
      `Update product index on ${branch}`
    );
  } catch (err) {
    console.error('Failed to update index:', err);
  }
}

async function listProductsFromBranch(branch: string): Promise<ProductIndex> {
  const content = await gitReadFile(branch, `${CONTENT_PATH}/_index.json`);
  return JSON.parse(content) as ProductIndex;
}
