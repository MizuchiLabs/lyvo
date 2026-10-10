import type { AstroIntegration, AstroIntegrationLogger } from 'astro';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import pagefind from 'astro-pagefind';
import tailwindcss from '@tailwindcss/vite';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeExternalLinks from './lib/rehype-external-links';
import remarkMermaid from './lib/remark-mermaid';
import { unified } from '@astrojs/markdown-remark';
import { LyvoOptionsSchema, normalizeOptions, type LyvoConfig, type LyvoOptions } from './config';

const PKG = '@mizuchilabs/lyvo';
const VIRTUAL_CONFIG_ID = 'virtual:lyvo-config';
const VIRTUAL_STYLES_ID = 'lyvo:styles';

function lyvoVitePlugin(config: LyvoConfig, srcDir: string, root: string) {
	const stylePath = path.join(srcDir, 'styles', 'global.css');
	// A .css path keeps the module on Vite's CSS pipeline so Tailwind processes it.
	const stylesModule = `${stylePath}?lyvo-styles`;

	return {
		name: 'vite-plugin-lyvo',
		resolveId(id: string) {
			if (id === VIRTUAL_CONFIG_ID) return `\0${id}`;
			if (id === VIRTUAL_STYLES_ID) return stylesModule;
			return null;
		},
		load(id: string) {
			if (id === `\0${VIRTUAL_CONFIG_ID}`) return `export default ${JSON.stringify(config)};`;
			if (id !== stylesModule) return null;

			// One Tailwind root: user CSS is pulled in through @import so utilities
			// aren't emitted twice (a second root's .hidden would beat md:flex).
			const imports = [
				stylePath,
				...config.customCss.map((file) => resolveUserPath(root, file))
			];
			return imports.map((file) => `@import ${JSON.stringify(file)};`).join('\n');
		}
	};
}

function resolveUserPath(root: string, file: string): string {
	return path.resolve(root, file.replace(/^\//, ''));
}

function hasUserFile(dir: string, pattern: RegExp): boolean {
	try {
		return fs.readdirSync(dir).some((file) => pattern.test(file));
	} catch {
		return false;
	}
}

function hasTailwindPlugin(plugins: unknown[] = []): boolean {
	return plugins.flat(Infinity).some((plugin) => {
		const name = (plugin as { name?: string } | null)?.name;
		return typeof name === 'string' && name.includes('tailwindcss');
	});
}

function checkCustomCss(root: string, files: string[], logger: AstroIntegrationLogger) {
	for (const file of files) {
		const resolved = resolveUserPath(root, file);
		if (!fs.existsSync(resolved)) {
			throw new Error(`[lyvo] customCss file "${file}" not found at ${resolved}.`);
		}
		const css = fs.readFileSync(resolved, 'utf-8');
		if (/@import\s+['"]tailwindcss['"]/.test(css)) {
			logger.warn(
				`"${file}" imports tailwindcss. lyvo already does that, remove the import or utilities get emitted twice.`
			);
		}
	}
}

export default function lyvo(userOptions: LyvoOptions = {}): AstroIntegration {
	return {
		name: 'lyvo',
		hooks: {
			'astro:config:setup': ({
				config: astroConfig,
				updateConfig,
				injectRoute,
				injectScript,
				logger
			}) => {
				const parsed = LyvoOptionsSchema.safeParse(userOptions);
				if (!parsed.success) {
					const issues = parsed.error.issues
						.map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
						.join('\n');
					throw new Error(`[lyvo] Invalid options:\n${issues}`);
				}

				const options = normalizeOptions(parsed.data, astroConfig);
				const root = fileURLToPath(astroConfig.root);
				const srcDir = fileURLToPath(new URL('./', import.meta.url)).replace(/\/$/, '');
				const pagesDir = fileURLToPath(new URL('./pages/', astroConfig.srcDir));
				const publicDir = fileURLToPath(astroConfig.publicDir);

				if (!options.site) {
					logger.warn(
						'No `site` set in astro.config. Canonical URLs, OG images, the sitemap and robots.txt need it.'
					);
				}
				checkCustomCss(root, options.customCss, logger);

				const userMarkdown = astroConfig.markdown ?? {};
				const vitePlugins: unknown[] = [lyvoVitePlugin(options, srcDir, root)];
				if (!hasTailwindPlugin(astroConfig.vite?.plugins as unknown[])) {
					vitePlugins.push(tailwindcss());
				}

				updateConfig({
					// Astro 7 routes markdown through a processor. rehypePlugins passed
					// on their own are ignored, so merge the user's into unified().
					markdown: {
						processor: unified({
							remarkPlugins: [
								...(userMarkdown.remarkPlugins ?? []),
								...(options.mermaid ? [remarkMermaid] : [])
							],
							rehypePlugins: [
								...(userMarkdown.rehypePlugins ?? []),
								rehypeSlug,
								[rehypeExternalLinks, { site: options.site, base: options.base }],
								[
									rehypeAutolinkHeadings,
									{
										behavior: 'append',
										properties: {
											class: 'heading-link',
											'aria-hidden': 'true',
											tabIndex: -1
										}
									}
								]
							],
							remarkRehype: userMarkdown.remarkRehype,
							gfm: userMarkdown.gfm,
							smartypants: userMarkdown.smartypants
						})
					},
					integrations: buildIntegrations(astroConfig, options),
					vite: {
						resolve: { alias: [{ find: '@lyvo', replacement: srcDir }] },
						plugins: vitePlugins as never
					}
				});

				const route = (pattern: string, entrypoint: string) =>
					injectRoute({ pattern, entrypoint: `${PKG}/routes/${entrypoint}` });

				route(`${options.docs.prefix}/[...slug]`, 'docs/[...slug].astro');
				if (options.i18n.locales.length > 0) {
					route(
						`/[locale]${options.docs.prefix}/[...slug]`,
						'docs/localized/[...slug].astro'
					);
				}
				if (options.api.specs.length > 0) {
					route(`${options.api.root}/[...slug]`, 'api/[...slug].astro');
				}
				if (options.og.generate) {
					route('/og/[...slug]', 'og/[...slug].ts');
				}
				if (options.llms) {
					route('/llms.txt', 'llms.txt.ts');
					route('/llms-full.txt', 'llms-full.txt.ts');
					route('/[...path].md', 'markdown.ts');
					if (options.api.specs.length > 0) {
						route(
							`${options.api.root}/[...spec]/llms-full.txt`,
							'api/llms-full.txt.ts'
						);
					}
				}
				if (
					options.robots &&
					!hasUserFile(pagesDir, /^robots\.txt\./) &&
					!hasUserFile(publicDir, /^robots\.txt$/)
				) {
					route('/robots.txt', 'robots.txt.ts');
				}
				if (!hasUserFile(pagesDir, /^404\./)) {
					route('/404', '404.astro');
				}

				injectScript('page-ssr', `import "${VIRTUAL_STYLES_ID}";`);
				if (options.mermaid) injectScript('page', `import "@lyvo/lib/mermaid-client";`);
			}
		}
	};
}

function buildIntegrations(
	astroConfig: { integrations?: Array<{ name: string }> },
	options: LyvoConfig
) {
	const existing = new Set(astroConfig.integrations?.map((integration) => integration.name));
	const extra = [];

	if (!existing.has('@astrojs/mdx')) extra.push(mdx());

	if (options.sitemap && !existing.has('@astrojs/sitemap')) {
		const { defaultLocale, locales } = options.i18n;
		extra.push(
			sitemap({
				filter: (page) => !/\/404\/?$/.test(page),
				i18n:
					locales.length > 0
						? {
								defaultLocale,
								locales: Object.fromEntries(
									[defaultLocale, ...locales.map((locale) => locale.code)].map(
										(code) => [code, code]
									)
								)
							}
						: undefined
			})
		);
	}

	if (options.search && !existing.has('astro-pagefind')) extra.push(pagefind());

	return extra;
}
