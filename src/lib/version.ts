import { execSync } from 'node:child_process';

interface RepoOptions {
	url?: string;
	type?: string;
}

export async function getRepoVersion(
	options: RepoOptions = { url: 'https://github.com/mizuchilabs/lyvo', type: 'github' }
): Promise<string> {
	const { url, type } = options;
	if (!url) return '';

	// GitHub API
	if (type === 'github') {
		try {
			const parsedUrl = new URL(url);
			// Filter out empty strings in case of trailing slashes
			const pathParts = parsedUrl.pathname.split('/').filter(Boolean);
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
		const output = execSync(`git ls-remote --tags --sort="v:refname" ${url}`).toString().trim();

		// If output is completely empty, the repo has no tags
		if (!output) {
			console.log(`[Git] No tags found for ${url}`);
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
