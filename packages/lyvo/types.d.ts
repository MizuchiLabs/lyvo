/// <reference types="vite-plugin-svgr/client" />

declare module 'virtual:lyvo-config' {
	interface Config {
		title?: string;
		repo?: {
			url?: string;
			branch?: string;
			provider?: string;
		};
		socials: Record<string, string>;
		extraLinks: Array<{ title: string; href: string }>;
		docs: {
			edit: boolean;
			feedback: boolean;
		};
		openapi: {
			input?: string;
			groupBy?: 'tag' | 'path';
		};
	}

	const config: Config;
	export default config;
}
