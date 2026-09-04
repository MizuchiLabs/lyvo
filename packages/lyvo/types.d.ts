/// <reference types="vite-plugin-svgr/client" />

declare module 'virtual:lyvo-config' {
	interface Config {
		title: string;
		description?: string;
		lang: string;
		logo?: string | { light: string; dark: string };
		favicon?: { svg?: string; ico?: string };
		repo?: { url?: string; branch?: string };
		socials: Array<{ label: string; href: string; icon: string }>;
		nav?: Array<{ title: string; href: string }>;
		extraLinks: Array<{ title: string; href: string }>;
		footer?: {
			note?: string;
			columns?: Array<{ title: string; links: Array<{ label: string; href: string }> }>;
		};
		docs: {
			prefix: string;
			edit: boolean;
			feedback: boolean;
			sidebar?: {
				items?: Array<
					string | { title: string; href?: string; items?: Array<string | { title: string; href?: string; items?: unknown[] }> }
				>;
				order?: string[];
				labels?: Record<string, string>;
			};
		};
		api: {
			root: string;
			specs: Array<{ id: string; input: string; root: string; sub: string; groupBy: 'tag' | 'path'; title: string }>;
		};
		i18n: {
			defaultLocale: string;
			locales: Array<{ code: string; label: string }>;
			ui: Record<string, Record<string, string>>;
		};
		og: { siteName?: string; image?: string; generate: boolean };
		llms: boolean;
		features: { search: boolean; sitemap: boolean; cacheHeaders: boolean };
		fonts: string[];
		head?: string;
		customCss: string[];
	}

	const config: Config;
	export default config;
}
