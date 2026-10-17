import fs from 'node:fs';
import path from 'node:path';

const EXPECTED_STORE = 'Lhamza Shop';
const FORBIDDEN_STORE = 'NOVAVITA';
const EXPECTED_PROJECT_ID = 'prj_X30nyNZNnNBapei6zVCohM0lsuv1';
const EXPECTED_PROJECT_NAME = 'valoriia';
const EXPECTED_BRANCH = 'main';

function fail(reason) {
	console.error(`\n❌ [STORE IDENTITY GUARDRAIL FAILED - ${EXPECTED_STORE}]`);
	console.error(`   Reason: ${reason}\n`);
	process.exit(1);
}

// 1. Check Vercel environment variables (when building on Vercel Cloud)
if (process.env.VERCEL_PROJECT_ID && process.env.VERCEL_PROJECT_ID !== EXPECTED_PROJECT_ID) {
	fail(
		`VERCEL_PROJECT_ID mismatch! Expected "${EXPECTED_PROJECT_ID}" (${EXPECTED_PROJECT_NAME}), got "${process.env.VERCEL_PROJECT_ID}". Blocking cross-store deployment.`
	);
}

if (process.env.VERCEL_GIT_COMMIT_REF && process.env.VERCEL_GIT_COMMIT_REF !== EXPECTED_BRANCH) {
	fail(
		`VERCEL_GIT_COMMIT_REF mismatch! Expected branch "${EXPECTED_BRANCH}", got "${process.env.VERCEL_GIT_COMMIT_REF}". Blocking cross-branch deployment.`
	);
}

// 2. Check local .vercel/project.json (when deploying from local CLI)
const vercelProjectFile = path.resolve(process.cwd(), '.vercel', 'project.json');
if (fs.existsSync(vercelProjectFile)) {
	try {
		const projectData = JSON.parse(fs.readFileSync(vercelProjectFile, 'utf8'));
		if (projectData.projectId !== EXPECTED_PROJECT_ID) {
			fail(
				`.vercel/project.json points to projectId "${projectData.projectId}" (${projectData.projectName}), expected "${EXPECTED_PROJECT_ID}" (${EXPECTED_PROJECT_NAME}).`
			);
		}
	} catch (err) {
		fail(`Failed to parse .vercel/project.json: ${err.message}`);
	}
}

// 3. Check src/ branding files for store identity and zero cross-contamination
const filesToVerify = [
	path.resolve(process.cwd(), 'src', 'app.html'),
	path.resolve(process.cwd(), 'src', 'routes', '+page.svelte')
];

for (const filePath of filesToVerify) {
	if (!fs.existsSync(filePath)) {
		fail(`Required source file missing: ${filePath}`);
	}
	const content = fs.readFileSync(filePath, 'utf8');
	if (!content.includes(EXPECTED_STORE)) {
		fail(`File "${path.relative(process.cwd(), filePath)}" is missing required "${EXPECTED_STORE}" branding!`);
	}
	if (content.includes(FORBIDDEN_STORE)) {
		fail(
			`Cross-contamination detected! File "${path.relative(process.cwd(), filePath)}" contains forbidden "${FORBIDDEN_STORE}" branding!`
		);
	}
}

console.log(`✅ [STORE IDENTITY VERIFIED] Store: ${EXPECTED_STORE} | Project: ${EXPECTED_PROJECT_NAME} (${EXPECTED_PROJECT_ID})`);
