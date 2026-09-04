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
			description: 'A demo site exercising every lyvo feature: docs, API reference, i18n and OG images.',
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
				{ title: 'API', href: '/api' }
			],
			footer: {
				note: 'Built with lyvo, an open source documentation theme for Astro.',
				columns: [
					{
						title: 'Docs',
						links: [
							{ label: 'Introduction', href: '/docs/introduction' },
							{ label: 'Getting Started', href: '/docs/overview/getting-started' }
						]
					},
					{
						title: 'API',
						links: [
							{ label: 'API Reference', href: '/api' },
							{ label: 'API v2', href: '/api/v2' }
						]
					},
					{
						title: 'Community',
						links: [
							{ label: 'GitHub', href: 'https://github.com/mizuchilabs/lyvo' },
							{ label: 'Discord', href: 'https://discord.com' }
						]
					}
				]
			},
			docs: {
				edit: true,
				feedback: true,
				sidebar: {
					items: [
						'introduction',
						{
							title: 'Overview',
							items: ['overview/getting-started', 'overview/configuration', 'overview/writing-content']
						},
						{
							title: 'Components',
							items: ['components/components', 'components/markdown-reference']
						},
						'---',
						{ title: 'Changelog', items: ['changelog'] },
						{ title: 'GitHub', href: 'https://github.com/mizuchilabs/lyvo' }
					]
				}
			},
			openapi: [
				{
					input: 'public/openapi.json',
					prefix: '/api',
					groupBy: 'tag'
				},
				{
					input: 'public/openapi-v2.json',
					prefix: '/api/v2',
					title: 'API v2'
				}
			],
			i18n: {
				defaultLocale: 'en',
				locales: [{ code: 'de', label: 'Deutsch' }],
				ui: {
					de: {
						search: 'Suche',
						onThisPage: 'Auf dieser Seite',
						lastUpdated: 'Zuletzt aktualisiert am',
						helpful: 'War diese Seite hilfreich?',
						yes: 'Ja',
						no: 'Nein',
						thanks: 'Danke für dein Feedback!',
						guides: 'Anleitungen',
						reference: 'Referenz',
						overview: 'Übersicht',
						notFoundTitle: 'Seite nicht gefunden',
						notFoundText: 'Diese Seite existiert nicht oder wurde verschoben.',
						backHome: 'Zur Startseite'
					}
				}
			},
			og: {
				siteName: 'Demo Docs',
				generate: true
			},
			customCss: ['/src/styles/custom.css']
		})
	]
});
