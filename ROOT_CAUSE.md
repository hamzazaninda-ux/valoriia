ROOT CAUSE INVESTIGATION

Scope
- Find why the deployed application still behaves like the old version despite multiple commits and successful Vercel deployments.
- Compare: local repository, GitHub, Vercel deployment, running application.

Actions performed (commands / reads)
- git branch -v
  * local branch: main c7813bbcbe57473ef85904db12c2fb78ddfe1b73
- git branch -a / git ls-remote origin
  * remotes: origin/main (c7813bb...), origin/draft (d1328f9...)
- Opened vercel.json (repo root)
- Inspected server content layer: src/lib/content/* (settings.ts, products.ts) and src/lib/content/git.ts
- Inspected admin UI save/publish flows: src/routes/admin/settings/+page.svelte
- Inspected templates that submit orders: src/lib/components/templates/*/Template.svelte
- Reviewed production notes: reports/PRODUCTION_REVIEW.md and reports/BUTTON_AUDIT.md

Concrete evidence (repo excerpts)
- Local vs remote branch heads (git):
  - local HEAD: main c7813bbcbe57473ef85904db12c2fb78ddfe1b73
  - origin/main: c7813bbcbe57473ef85904db12c2fb78ddfe1b73 (matches local)
  - origin/draft: d1328f945df86903aedcbee98dd2bb8434bbdc6e (different)

- Vercel configuration (vercel.json):
  {
    "$schema": "https://openapi.vercel.sh/vercel.json",
    "git": {
      "deploymentEnabled": {
        "**": false,
        "main": true
      }
    }
  }
  -> Vercel is configured (repo) to deploy only the main branch.

- Runtime content layer (server) reads and writes GitHub files at runtime via Octokit:
  - src/lib/content/git.ts
    - getOctokit() requires process.env.GITHUB_TOKEN; throws if not present
    - Functions use ok.rest.repos.getContent and ok.rest.repos.createOrUpdateFileContents
  - src/lib/content/settings.ts and products.ts
    - read operations use gitReadFile('main', ...)
    - Admin reads use gitReadFile('draft', ...) falling back to main
    - save operations write to branch 'draft' (gitWriteFile('draft', ...))
    - publish operations write to branch 'main' (gitWriteFile('main', ...))
  -> The application uses GitHub itself as the source-of-truth at runtime (reads/writes via GitHub REST API). The running server depends on GitHub API access and on environment variables (GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO).

- Frontend API handling
  - Admin settings page (src/routes/admin/settings/+page.svelte) checks response.ok and shows toasts on failure; write errors are surfaced to UI.
  - Order submission templates (src/lib/components/templates/*/Template.svelte) use fetch(..., { mode: 'no-cors' }) when posting to external Google Apps Script, so the browser cannot inspect the response (silent on success/failure).

- Production notes (reports/PRODUCTION_REVIEW.md)
  - Confirms: "GitHub `main` is deployed by Vercel" and that Vercel SSO gating prevents direct smoke tests.
  - Notes: "The Vercel runtime holds a repository write token." and that `GITHUB_TOKEN`, `ADMIN_PASSWORD_HASH`, `SESSION_SECRET` are expected to be configured in Vercel but were not available for runtime testing.

Synthesis — Why the site still looks like the old version
1. Code deployment vs runtime content are two separate concerns
   - Vercel builds and deploys the application source (SvelteKit code) from the repository main branch (vercel.json enforces main). The code commits therefore are being deployed.
   - The application, at runtime, dynamically reads its content (settings, product JSON, index) directly from GitHub using Octokit and environment variables (GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO). That means the visible site content and some behaviors depend on repository file contents in branches (main / draft) as read via the GitHub API at runtime — not on files baked into the build.

2. Mismatch candidates that explain "old behavior" despite successful code deploys
   - Content vs code: If the bug is in content-driven behavior (e.g., settings, templates, published product JSON), updating code alone will not change the content that the running server reads from GitHub main. If content remained on draft or was never published to main (or publish failed), production will continue to serve the older main content.
   - Publish/write failures: publish/save operations use Octokit and require a valid GITHUB_TOKEN. If Vercel's environment is missing or misconfigured for GITHUB_TOKEN (or the token lacks repo permissions), write/publish operations will fail. The admin UI generally surfaces such failures via toasts, but some flows (external order submissions using no-cors) are intentionally silent and can fail without visible errors.
   - Wrong GitHub target: If Vercel environment variables (GITHUB_OWNER or GITHUB_REPO) were set to a different repo (or left to default values in some contexts), the runtime would be reading/writing a different repository than the code that was just deployed, causing the deployed app to render content from the other repo (older). The code defaults point to abdelghafour1223/alpha-vital-lb, but Vercel can override those env vars.
   - Vercel project / deployment alias mismatch: The domain being visited may point to a different Vercel project or an older deployment alias. The repo shows vercel.json configured to deploy main, but the public URL could be routing to an unrelated project/environment. PRODUCTION_REVIEW mentions Vercel SSO gating, which can make verifying the actual production URL and its recent deployments harder.
   - Client-side caching is unlikely to explain a persistent “old-version” appearance for code changes because Vite/Vercel produce hashed asset filenames; CDN/browser caching would normally be invalidated by file name changes. Server-rendered content (fetched live from GitHub) is the more probable source of stale behavior.

3. Silent or ignored failures that make the problem harder to notice
   - Some external API submissions use mode: 'no-cors' (templates), so the browser cannot confirm success — these will look like the old behavior when they fail silently.
   - Some internal errors (Octokit missing token) will return 500; admin UI shows toasts when request fails, but if an operator bypasses UI checks or the failure occurs during background operations (index updates, gitDeleteFile errors), the UI might not clearly state the root cause to a casual tester.

Most likely root cause (concise)
- The deployed code is being built and deployed from main (vercel.json enforces main) and origin/main matches the local main commit. However the running application’s runtime content and persistence depend on GitHub API reads/writes (main/draft branches) using a GITHUB_TOKEN and optional GITHUB_OWNER/GITHUB_REPO environment variables. Misconfiguration or absence of those environment variables on the Vercel runtime (missing/insufficient GITHUB_TOKEN, wrong GITHUB_OWNER/GITHUB_REPO, or token without repo permissions), or failures during publish (writing draft -> main), lead the live app to continue serving the older content/behavior even though the application code was updated and Vercel deployment succeeded.

Supporting facts
- vercel.json: deployEnabled only for main (so Vercel deploys main)
- git: origin/main SHA == local HEAD (code is on main)
- src/lib/content/git.ts: getOctokit() throws when process.env.GITHUB_TOKEN is missing
- src/lib/content/*: application reads from main at runtime and writes use draft / publish to main
- reports/PRODUCTION_REVIEW.md notes GITHUB_TOKEN and other env vars are expected in Vercel and were not available during runtime testing
- Templates use mode: 'no-cors' making some external writes silently unverified

Immediate checks for the operator (what to verify on Vercel / GitHub)
1. In the Vercel project settings (Environment Variables) confirm:
   - GITHUB_TOKEN exists and has repo:contents write permissions (or appropriate GitHub App token)
   - GITHUB_OWNER and GITHUB_REPO are set to the expected values (or unset to use defaults in code)
2. Verify the Vercel deployment build logs show the actual commit SHA deployed (match to origin/main commit) and confirm which deployment is aliased to the public URL.
3. On the running server (Vercel), execute a runtime smoke-test (requires SSO/credentials):
   - Call GET /api/settings and verify the returned JSON matches the files in GitHub main (content/settings/*.json) for the same SHA.
   - If you can, call the admin save + publish sequence and observe whether the PUT /api/settings and POST /api/settings/publish return 200. If they fail, inspect server logs for Octokit / GITHUB_TOKEN errors.
4. Confirm whether published content is present on GitHub main (inspect files under content/ in the GitHub web UI) after a publish attempt.

Why this explains the symptom "multiple commits & successful Vercel deployments but app still old"
- Code deployments (SvelteKit app source) were successful and updated on Vercel, but the runtime app renders content fetched live from GitHub main/draft using the GitHub API. If the runtime is pointed at a different GitHub repo, or the publish flow is failing (due to missing token or permissions), the data driving the site remains unchanged (the old content) and the visible behaviour appears unchanged even though the code was updated. Without correct GITHUB_TOKEN and correct owner/repo, writes will fail and publishes won't update main; without correct owner/repo the runtime might read content from an unrelated/older repository.

Summary (one-line)
- Vercel is building/deploying the updated code from main, but the running app serves content read from GitHub at runtime; misconfigured or missing GitHub runtime environment variables (GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO) or failed publish operations are the most likely cause for the deployed app still showing the old behavior despite successful code deployments.

Appendix — Relevant file pointers
- Vercel config: vercel.json (repo root)
- Git runtime layer: src/lib/content/git.ts
- Content usage: src/lib/content/settings.ts, src/lib/content/products.ts
- Admin save/publish: src/routes/admin/settings/+page.svelte
- Silent external POSTs: src/lib/components/templates/*/Template.svelte
- Production review notes: reports/PRODUCTION_REVIEW.md

End of report.
