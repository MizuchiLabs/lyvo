/// <reference types="vite-plugin-svgr/client" />

declare module 'virtual:lyvo-config' {
	const config: import('./src/config').LyvoConfig;
	export default config;
}
