/// <reference types="vite-plugin-svgr/client" />

declare module 'virtual:lyvo-config' {
	interface RepoOptions {
		url?: string;
		branch?: string;
	}

	interface Config {
		repo?: RepoOptions;
		socials: Record<string, string>;
		extraLinks: Array<{ title: string; href: string }>;
		docs: {
			editDoc: boolean;
			showFeedback: boolean;
		};
		openapi: {
			input?: string;
			groupBy?: 'tag' | 'path';
		}
	}

	const config: Config;
	export default config;
}
