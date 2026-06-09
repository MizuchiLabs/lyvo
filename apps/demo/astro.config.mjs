// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import lyvo from '@mizuchilabs/lyvo';

export default defineConfig({
	site: 'https://example.com',
	vite: {
		plugins: [tailwindcss()]
	},

	markdown: {
		syntaxHighlight: 'shiki',
		shikiConfig: {
			themes: {
				light: 'github-light',
				dark: 'github-dark'
			},
			wrap: true
		}
	},

	fonts: [
		{
			name: 'Manrope',
			cssVariable: '--font-sans-default',
			provider: fontProviders.fontsource()
		},
		{
			name: 'Space Grotesk',
			cssVariable: '--font-serif-default',
			provider: fontProviders.fontsource()
		},
		{
			name: 'Victor Mono',
			cssVariable: '--font-mono-default',
			provider: fontProviders.fontsource()
		}
	],

	integrations: [
		lyvo({
			title: 'Demo Docs',
			lang: 'en',
			repo: {
				url: 'https://github.com/mizuchilabs/lyvo',
				branch: 'main'
			},
			socials: [
				{
					label: 'GitHub',
					href: 'https://github.com/mizuchilabs/lyvo',
					icon: 'github'
				},
				{
					label: 'Discord',
					href: 'https://discord.com',
					icon: 'discord.svg'
				}
			],
			nav: [
				{ title: 'Home', href: '/' },
				{ title: 'Docs', href: '/docs' },
				{ title: 'API', href: '/api' },
				{ title: 'Blog', href: '/blog' }
			],
			extraLinks: [
				{ title: 'Support', href: 'https://example.com/support' },
				{ title: 'Status', href: 'https://status.example.com' }
			],
			docs: {
				edit: true,
				feedback: true,
				sidebar: {
					order: ['introduction', 'overview', 'components', 'changelog'],
					labels: {
						introduction: 'Introduction',
						overview: 'Overview',
						components: 'Components',
						changelog: 'Changelog'
					}
				}
			},
			openapi: {
				input: 'public/openapi.json',
				groupBy: 'tag'
			},
			customCss: ['/src/styles/custom.css']
		})
	]
});
