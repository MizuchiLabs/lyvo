export const SITE = {
	title: 'Lyvo Docs',
	description: 'A modern, minimalistic documentation theme for Astro.',
	repo: {
		url: 'https://github.com/mizuchilabs/lyvo',
		type: 'github' // github, gitlab, gitea, forgejo, git
	},
	openapi: {
		url: '/openapi.json' // path to the file in public folder or external URL (e.g. /openapi.json)
	},
	social: {
		discord: '', // e.g. "https://discord.gg/..."
		x: '', // e.g. "https://x.com/..."
		youtube: '',
		bluesky: ''
	},
	extraLinks: [
		{ title: 'Support', href: 'https://example.com/support' },
		{ title: 'Status', href: 'https://status.example.com' }
	],
	nav: [{ title: 'Documentation', href: '/docs/introduction' }],
	logo: {
		type: 'both', // "text", "logo", or "both"
		src: 'logo.svg', // Name of the file inside src/assets/
		width: 28,
		height: 28
	},
	enableEdit: true, // Enable edit page button
	feedback: {
		enabled: true, // Enable feedback button at the bottom of pages
		provider: 'umami' // "umami" or "plausible"
	},
	showVersion: false, // Show project version in sidebar
	categoryOrder: ['introduction', 'overview', 'components', 'changelog'] // Sort order for sidebar categories
};
