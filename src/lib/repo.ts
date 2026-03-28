export type RepoProvider = 'github' | 'gitlab' | 'gitea' | 'forgejo' | 'git';

export function getProviderFromUrl(url: string | undefined): RepoProvider {
	if (!url) return 'git';
	const lowercaseUrl = url.toLowerCase();
	if (lowercaseUrl.includes('github.com')) return 'github';
	if (lowercaseUrl.includes('gitlab.com')) return 'gitlab';
	if (lowercaseUrl.includes('gitea')) return 'gitea';
	if (lowercaseUrl.includes('forgejo')) return 'forgejo';
	return 'git'; // Fallback
}
