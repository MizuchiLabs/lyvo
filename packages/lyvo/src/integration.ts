import type { AstroIntegration } from 'astro';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import { writeFile, readFile, access } from 'node:fs/promises';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import pagefind from 'astro-pagefind';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import { unified } from '@astrojs/markdown-remark';
import {
	LyvoOptionsSchema,
	normalizeOptions,
	warnUnknownOptions,
	type LyvoConfig,
	type LyvoOptions
} from './config';

const PKG = '@mizuchilabs/lyvo';

function injectVirtualConfig(config: LyvoConfig) {
	return {
		name: 'vite-plugin-lyvo-config',
		resolveId(id: string) {
			if (id === 'virtual:lyvo-config') {
				return '\0' + id;
			}
			return null;
		},
		load(id: string) {
			if (id === '\0virtual:lyvo-config') {
				return `export default ${JSON.stringify(config)};`;
			}
			return null;
		}
	};
}

const VIRTUAL_STYLES_ID = 'lyvo:styles';

// Serves the theme stylesheet as ONE Tailwind root with the user's customCss
// appended inline. Two separate roots would cascade-break responsive
// utilities (a later root's .hidden beats the theme root's md:flex).
function injectLyvoStyles(
	options: LyvoConfig,
	srcDir: string,
	logger: { warn: (message: string) => void }
) {
	const stylePath = path.join(srcDir, 'styles', 'global.css');
	const virtualId = `${stylePath}?lyvo-styles`;

	function prepareUserCss(file: string): string {
		const resolved = path.resolve(process.cwd(), file.replace(/^\//, ''));
		let css = fs.readFileSync(resolved, 'utf-8');

		// Users following older docs import the theme (or tailwind) themselves.
		// Inline appending would create nested roots, so drop those imports.
		css = css.replace(
			/^@import\s+['"](tailwindcss|@mizuchilabs\/lyvo\/style\.css|tw-animate-css)['"];\s*$/gm,
			''
		);

		// Relative imports/urls must resolve from the user's file, but the
		// combined module lives next to the theme stylesheet.
		const userDir = path.dirname(resolved);
		const themeDir = path.dirname(stylePath);
		const rebase = (
			match: string,
			prefix: string,
			quote: string,
			target: string,
			suffix: string
		) => {
			if (!target.startsWith('.')) return match;
			const absolute = path.resolve(userDir, target);
			const rebased = path.relative(themeDir, absolute).split(path.sep).join('/');
			return `${prefix}${quote}${rebased}${suffix}`;
		};
		css = css.replace(/(@import\s+)(['"])([^'"]+)\2/g, rebase);
		css = css.replace(/(url\()(\s*)(['"])([^'"]+)\3(\s*\))/g, rebase);

		return `/* source: ${file} */\n${css}`;
	}

	return {
		name: 'vite-plugin-lyvo-styles',
		resolveId(id: string) {
			if (id === VIRTUAL_STYLES_ID) return virtualId;
			return null;
		},
		load(id: string) {
			if (id !== virtualId) return null;

			const parts = [fs.readFileSync(stylePath, 'utf-8')];
			for (const file of options.customCss) {
				try {
					parts.push(prepareUserCss(file));
				} catch {
					logger.warn(`customCss file "${file}" could not be read, skipping.`);
				}
			}
			return parts.join('\n');
		}
	};
}

function cacheHeadersEntry(prefix: string): string {
	return `/${prefix}\n  Cache-Control: no-cache, must-revalidate\n/${prefix}/\n  Cache-Control: no-cache, must-revalidate\n`;
}

export default function lyvo(userOptions: LyvoOptions = {}): AstroIntegration {
	let options: LyvoConfig | null = null;

	return {
		name: 'lyvo',
		hooks: {
			'astro:build:done': async ({ dir, logger }) => {
				if (!options?.features.cacheHeaders) return;

				const headersPath = new URL('./_headers', dir);
				const entry = cacheHeadersEntry(options.docs.prefix);
				try {
					await access(headersPath);
					const existing = await readFile(headersPath, 'utf-8');
					if (!existing.includes(cacheHeadersEntry(options.docs.prefix))) {
						await writeFile(headersPath, existing + '\n' + entry);
					}
				} catch {
					await writeFile(headersPath, entry);
				}
				logger.info('Wrote Cloudflare _headers for docs pages.');
			},
			'astro:config:setup': ({
				config: astroConfig,
				updateConfig,
				injectRoute,
				injectScript,
				logger
			}) => {
				warnUnknownOptions(userOptions as Record<string, unknown>, (message) =>
					logger.warn(message)
				);

				options = normalizeOptions(LyvoOptionsSchema.parse(userOptions), astroConfig);

				const srcDir = fileURLToPath(new URL('./', import.meta.url)).replace(/\/$/, '');

				const userMarkdown = astroConfig.markdown ?? {};

				updateConfig({
					// Astro 7 routes markdown through a processor; rehypePlugins in
					// updateConfig are ignored unless wrapped in unified(). User plugins
					// are merged so their own markdown config keeps working.
					markdown: {
						processor: unified({
							remarkPlugins: [...(userMarkdown.remarkPlugins ?? [])],
							rehypePlugins: [
								...(userMarkdown.rehypePlugins ?? []),
								rehypeSlug,
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
					integrations: buildIntegrations(astroConfig, options, logger),
					vite: {
						resolve: {
							alias: [
								{
									find: '@lyvo',
									replacement: srcDir
								}
							]
						},
						plugins: [
							injectVirtualConfig(options),
							injectLyvoStyles(options, srcDir, logger)
						]
					}
				});

				injectRoute({
					pattern: `${options.docs.prefix}/[...slug]`,
					entrypoint: `${PKG}/routes/docs/[...slug].astro`
				});

				if (options.i18n.locales.length > 0) {
					injectRoute({
						pattern: `/[locale]${options.docs.prefix}/[...slug]`,
						entrypoint: `${PKG}/routes/docs/localized/[...slug].astro`
					});
				}

				if (options.api.specs.length > 0) {
					injectRoute({
						pattern: `${options.api.root}/[...slug]`,
						entrypoint: `${PKG}/routes/api/[...slug].astro`
					});
				}

				if (options.og.generate) {
					injectRoute({
						pattern: '/og/[...slug]',
						entrypoint: `${PKG}/routes/og/[...slug].ts`
					});
				}

				if (options.llms) {
					injectRoute({
						pattern: '/llms.txt',
						entrypoint: `${PKG}/routes/llms.txt.ts`
					});
					injectRoute({
						pattern: '/llms-full.txt',
						entrypoint: `${PKG}/routes/llms-full.txt.ts`
					});
				}

				injectScript('page-ssr', 'import "lyvo:styles";');
			}
		}
	};
}

function buildIntegrations(
	astroConfig: { integrations?: Array<{ name: string }> },
	options: LyvoConfig,
	logger: { warn: (message: string) => void }
) {
	const existing = new Set(
		(astroConfig.integrations ?? []).map((integration) => integration.name)
	);
	const extra = [];

	if (!existing.has('@astrojs/mdx')) {
		extra.push(mdx());
	} else {
		logger.warn('MDX integration already configured, lyvo will use the existing one.');
	}

	if (options.features.sitemap && !existing.has('@astrojs/sitemap')) {
		extra.push(sitemap());
	}

	if (options.features.search && !existing.has('astro-pagefind')) {
		extra.push(pagefind());
	}

	return extra;
}
