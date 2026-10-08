import { Octokit } from 'octokit';
import { env } from '$env/dynamic/private';

// NOTE: read env lazily (inside functions, never at module top level).
// Module-level snapshots can evaluate before SvelteKit finishes loading
// .env.local in dev, leaving stale empty values. Owner/repo intentionally
// have NO fallback to the previous owner's repository.
let octokit: Octokit | null = null;

function getOctokit(): Octokit {
  if (!octokit) {
    const token = env.GITHUB_TOKEN;
    if (!token) throw new Error('GITHUB_TOKEN environment variable is required');
    octokit = new Octokit({ auth: token });
  }
  return octokit;
}

// =============================================================================
// Retry Configuration
// =============================================================================
const MAX_RETRIES = 4;
const BASE_DELAY_MS = 1000;

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isRetryableError(error: unknown): boolean {
  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as { status: number }).status;
    // 429 = rate limited, 403 = secondary rate limit or forbidden
    return status === 429 || status === 403;
  }
  return false;
}

function logRateLimitInfo(error: unknown): void {
  if (error && typeof error === 'object' && 'headers' in error) {
    const headers = (error as { headers: Record<string, string> }).headers;
    const remaining = headers['x-ratelimit-remaining'];
    const reset = headers['x-ratelimit-reset'];
    if (remaining !== undefined) {
      console.warn(`[GitHub API] Rate limit remaining: ${remaining}, resets at: ${reset || 'unknown'}`);
    }
  }
}

async function withRetry<T>(fn: () => Promise<T>, operation: string): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (!isRetryableError(error)) {
        throw error;
      }

      logRateLimitInfo(error);

      if (attempt < MAX_RETRIES) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt);
        console.warn(`[GitHub API] ${operation} rate limited (attempt ${attempt + 1}/${MAX_RETRIES + 1}), retrying in ${delay}ms`);
        await sleep(delay);
      }
    }
  }

  console.error(`[GitHub API] ${operation} failed after ${MAX_RETRIES + 1} retries`);
  throw lastError;
}

// =============================================================================
// Git Operations
// =============================================================================

async function readLocalFile(path: string): Promise<string> {
  const fs = await import('node:fs/promises');
  const nodePath = await import('node:path');
  const localFilePath = nodePath.resolve(process.cwd(), path);
  return await fs.readFile(localFilePath, 'utf-8');
}

async function listLocalFiles(path: string): Promise<string[]> {
  const fs = await import('node:fs/promises');
  const nodePath = await import('node:path');
  const localDirPath = nodePath.resolve(process.cwd(), path);
  return await fs.readdir(localDirPath);
}

export async function gitReadFile(branch: string, path: string): Promise<string> {
  if (!env.GITHUB_TOKEN) {
    try {
      return await readLocalFile(path);
    } catch {
      throw new Error(`GITHUB_TOKEN is not configured and local file missing: ${path}`);
    }
  }

  try {
    return await withRetry(async () => {
      const ok = getOctokit();
      const { data } = await ok.rest.repos.getContent({
        owner: env.GITHUB_OWNER,
        repo: env.GITHUB_REPO,
        path,
        ref: branch
      });

      if ('content' in data && typeof data.content === 'string') {
        return Buffer.from(data.content, 'base64').toString('utf8');
      }
      throw new Error(`File not found: ${path} on branch ${branch}`);
    }, `gitReadFile(${branch}, ${path})`);
  } catch (err) {
    try {
      return await readLocalFile(path);
    } catch {
      throw err;
    }
  }
}

async function writeLocalFile(path: string, content: string): Promise<void> {
  const fs = await import('node:fs/promises');
  const nodePath = await import('node:path');
  const localFilePath = nodePath.resolve(process.cwd(), path);
  await fs.mkdir(nodePath.dirname(localFilePath), { recursive: true });
  await fs.writeFile(localFilePath, content, 'utf-8');
}

export async function gitWriteFile(
  branch: string,
  path: string,
  content: string,
  message: string
): Promise<void> {
  try {
    await writeLocalFile(path, content);
  } catch {
    // Read-only filesystem in serverless, ignore
  }

  if (!env.GITHUB_TOKEN) {
    return;
  }

  return withRetry(async () => {
    const ok = getOctokit();

    let sha: string | undefined;
    try {
      const { data } = await ok.rest.repos.getContent({
        owner: env.GITHUB_OWNER,
        repo: env.GITHUB_REPO,
        path,
        ref: branch
      });
      if ('sha' in data) {
        sha = data.sha;
      }
    } catch {
      // File doesn't exist yet
    }

    await ok.rest.repos.createOrUpdateFileContents({
      owner: env.GITHUB_OWNER,
      repo: env.GITHUB_REPO,
      path,
      message,
      content: Buffer.from(content, 'utf8').toString('base64'),
      branch,
      sha
    });
  }, `gitWriteFile(${branch}, ${path})`);
}

export async function gitEnsureBranch(branch: string, sourceBranch = 'main'): Promise<void> {
  return withRetry(async () => {
    const ok = getOctokit();
    try {
      await ok.rest.git.getRef({ owner: env.GITHUB_OWNER, repo: env.GITHUB_REPO, ref: `heads/${branch}` });
      return;
    } catch (error) {
      if ((error as { status?: number }).status !== 404) throw error;
    }

    const { data: source } = await ok.rest.git.getRef({
      owner: env.GITHUB_OWNER,
      repo: env.GITHUB_REPO,
      ref: `heads/${sourceBranch}`
    });

    try {
      await ok.rest.git.createRef({
        owner: env.GITHUB_OWNER,
        repo: env.GITHUB_REPO,
        ref: `refs/heads/${branch}`,
        sha: source.object.sha
      });
    } catch (error) {
      // A concurrent request may have created the branch first.
      if ((error as { status?: number }).status !== 422) throw error;
    }
  }, `gitEnsureBranch(${branch})`);
}

export async function gitDeleteFile(
  branch: string,
  path: string,
  message: string
): Promise<boolean> {
  return withRetry(async () => {
    const ok = getOctokit();
    let data;
    try {
      ({ data } = await ok.rest.repos.getContent({
        owner: env.GITHUB_OWNER,
        repo: env.GITHUB_REPO,
        path,
        ref: branch
      }));
    } catch (error) {
      if ((error as { status?: number }).status === 404) return false;
      throw error;
    }

    if ('sha' in data) {
      await ok.rest.repos.deleteFile({
        owner: env.GITHUB_OWNER,
        repo: env.GITHUB_REPO,
        path,
        message,
        sha: data.sha,
        branch
      });
      return true;
    }
    return false;
  }, `gitDeleteFile(${branch}, ${path})`);
}

export async function gitListFiles(branch: string, path: string): Promise<string[]> {
  if (!env.GITHUB_TOKEN) {
    try {
      return await listLocalFiles(path);
    } catch {
      return [];
    }
  }

  try {
    return await withRetry(async () => {
      const ok = getOctokit();
      const { data } = await ok.rest.repos.getContent({
        owner: env.GITHUB_OWNER,
        repo: env.GITHUB_REPO,
        path,
        ref: branch
      });

      if (Array.isArray(data)) {
        return data.map(f => f.name);
      }
      return [];
    }, `gitListFiles(${branch}, ${path})`);
  } catch (err) {
    try {
      return await listLocalFiles(path);
    } catch {
      return [];
    }
  }
}
