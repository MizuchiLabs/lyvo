import { SITE } from '@/config';
import { execSync } from 'node:child_process';

export async function getRepoVersion(): Promise<string> {
	// GitHub API
	if (SITE.repo.type === 'github') {
		try {
			const url = new URL(SITE.repo.url);
			// Filter out empty strings in case of trailing slashes
			const pathParts = url.pathname.split('/').filter(Boolean);
			const owner = pathParts[0];
			const name = pathParts[1];

			const res = await fetch(
				`https://api.github.com/repos/${owner}/${name}/releases/latest`
			);

			if (res.ok) {
				const data = await res.json();
				return data.tag_name;
			} else {
				console.warn(`[GitHub API] Failed with status: ${res.status} ${res.statusText}`);
			}
		} catch (err) {
			console.error('[GitHub API Error]:', err);
		}
	}

	// Universal Git Command (for Gitea, Forgejo, GitLab, or GitHub API fallback)
	try {
		const output = execSync(`git ls-remote --tags --sort="v:refname" ${SITE.repo.url}`)
			.toString()
			.trim();

		// If output is completely empty, the repo has no tags
		if (!output) {
			console.log(`[Git] No tags found for ${SITE.repo.url}`);
			return '';
		}

		const lines = output.split('\n');
		const lastLine = lines[lines.length - 1];
		const tag = lastLine.split('refs/tags/')[1]?.replace(/\^\{\}$/, '');

		return tag || '';
	} catch (err) {
		console.error('[Git CLI Error]:', err);
	}

	return '';
}
