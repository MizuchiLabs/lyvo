import { z } from 'astro/zod';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { applyBase, withTrailingSlash } from './lib/routing';

const linkSchema = z.strictObject({
	title: z.string(),
	href: z.string()
});

export type SidebarInput =
	string | { title: string; href?: string; icon?: string; items?: SidebarInput[] };

const sidebarItemSchema: z.ZodType<SidebarInput, SidebarInput> = z.lazy(() =>
	z.union([
		z.string(),
		z.strictObject({
			title: z.string(),
			href: z.string().optional(),
			icon: z.string().optional(),
			items: z.array(sidebarItemSchema).optional()
		})
	])
);

export const SNIPPET_LANGUAGES = ['curl', 'javascript', 'python', 'go', 'csharp', 'java'] as const;
export type SnippetLanguage = (typeof SNIPPET_LANGUAGES)[number];

const specSchema = z.strictObject({
	input: z.string(),
	prefix: z.string().optional(),
	groupBy: z.enum(['tag', 'path']).optional(),
	title: z.string().optional(),
	snippets: z.array(z.enum(SNIPPET_LANGUAGES)).optional(),
	playground: z.boolean().optional()
});

// Self-hosted only: every provider needs the URL of your own instance.
const analyticsSchema = z.strictObject({
	umami: z
		.strictObject({
			websiteId: z.string(),
			src: z.url(),
			domains: z.string().optional()
		})
		.optional(),
	plausible: z.strictObject({ domain: z.string(), src: z.url() }).optional(),
	posthog: z
		.strictObject({ apiKey: z.string(), host: z.url(), cookies: z.boolean().optional() })
		.optional(),
	matomo: z
		.strictObject({ url: z.url(), siteId: z.string(), cookies: z.boolean().optional() })
		.optional()
});

export const LyvoOptionsSchema = z.strictObject({
	title: z.string().optional(),
	description: z.string().optional(),
	lang: z.string().optional(),
	logo: z.union([z.string(), z.strictObject({ light: z.string(), dark: z.string() })]).optional(),
	favicon: z.strictObject({ svg: z.string().optional(), ico: z.string().optional() }).optional(),
	repo: z.strictObject({ url: z.string(), branch: z.string().optional() }).optional(),
	socials: z
		.array(z.strictObject({ label: z.string(), href: z.string(), icon: z.string() }))
		.optional(),
	nav: z.array(linkSchema).optional(),
	footer: z
		.strictObject({
			note: z.string().optional(),
			columns: z
				.array(
					z.strictObject({
						title: z.string(),
						links: z.array(z.strictObject({ label: z.string(), href: z.string() }))
					})
				)
				.optional()
		})
		.optional(),
	docs: z
		.strictObject({
			prefix: z.string().optional(),
			edit: z.boolean().optional(),
			feedback: z.boolean().optional(),
			sidebar: z.array(sidebarItemSchema).optional()
		})
		.optional(),
	openapi: z.union([specSchema, z.array(specSchema)]).optional(),
	i18n: z
		.strictObject({
			locales: z
				.array(
					z.union([z.string(), z.strictObject({ code: z.string(), label: z.string() })])
				)
				.optional(),
			ui: z.record(z.string(), z.record(z.string(), z.string())).optional()
		})
		.optional(),
	og: z
		.strictObject({
			generate: z.boolean().optional(),
			image: z.string().optional()
		})
		.optional(),
	llms: z.boolean().optional(),
	mermaid: z.boolean().optional(),
	search: z.boolean().optional(),
	sitemap: z.boolean().optional(),
	robots: z.boolean().optional(),
	analytics: analyticsSchema.optional(),
	head: z.string().optional(),
	customCss: z.array(z.string()).optional()
});

export type AnalyticsConfig = z.infer<typeof analyticsSchema>;

export type LyvoOptions = z.input<typeof LyvoOptionsSchema>;

export interface LocaleConfig {
	code: string;
	label: string;
}

export interface ApiSpecConfig {
	id: string;
	input: string;
	root: string;
	sub: string;
	groupBy: 'tag' | 'path';
	title: string;
	snippets: SnippetLanguage[];
	playground: boolean;
}

export interface LyvoConfig {
	title: string;
	description?: string;
	site?: string;
	/** Astro's `base` without trailing slash, empty when served from the root. */
	base: string;
	/** Whether page URLs end in a slash, matching how Astro builds and the sitemap lists them. */
	trailingSlash: boolean;
	logo?: string | { light: string; dark: string };
	favicon?: { svg?: string; ico?: string };
	repo?: { url: string; branch: string };
	socials: Array<{ label: string; href: string; icon: string }>;
	nav: Array<{ title: string; href: string }>;
	footer?: {
		note?: string;
		columns?: Array<{ title: string; links: Array<{ label: string; href: string }> }>;
	};
	docs: {
		prefix: string;
		edit: boolean;
		feedback: boolean;
		sidebar?: SidebarInput[];
	};
	api: {
		root: string;
		specs: ApiSpecConfig[];
	};
	i18n: {
		defaultLocale: string;
		locales: LocaleConfig[];
		labels: Record<string, string>;
		ui: Record<string, Record<string, string>>;
	};
	og: {
		generate: boolean;
		image?: string;
		/** Absolute paths to the woff fonts used for generated images. */
		fontPaths: string[];
		/**
		 * File URLs of satori and sharp. The prerender bundle runs from the
		 * user's project, where pnpm hides lyvo's own dependencies.
		 */
		modules: { satori: string; sharp: string } | null;
	};
	llms: boolean;
	mermaid: boolean;
	search: boolean;
	sitemap: boolean;
	robots: boolean;
	analytics?: AnalyticsConfig;
	fonts: string[];
	head?: string;
	customCss: string[];
}

// Native name for a locale code via the platform's CLDR data, e.g.
// en -> English, de -> Deutsch. Works for any valid code, no map to maintain.
function localeLabel(code: string, configured?: string): string {
	if (configured) return configured;
	try {
		const name = new Intl.DisplayNames([code], { type: 'language' }).of(code) ?? code;
		// of() echoes unknown codes back unchanged, keep those as-is.
		if (name.toLowerCase() === code.toLowerCase()) return code;
		return name.charAt(0).toUpperCase() + name.slice(1);
	} catch {
		return code;
	}
}

const UI_DEFAULTS: Record<string, string> = {
	search: 'Search',
	onThisPage: 'On this page',
	lastUpdated: 'Last updated on',
	helpful: 'Was this page helpful?',
	yes: 'Yes',
	no: 'No',
	thanks: 'Thank you for your feedback!',
	feedbackQuestion: 'What was missing or unclear?',
	feedbackPlaceholder: 'Optional. Please leave out personal data.',
	skip: 'Skip',
	openIssue: 'Open an issue',
	orOpenIssue: 'Or open an issue',
	editPage: 'Edit page',
	previous: 'Previous',
	next: 'Next',
	guides: 'Guides',
	guidesDescription: 'Learn the concepts',
	endpointCount: '{count} endpoints',
	fallbackNotice: 'This page is not available in {language} yet. Showing the {original} version.',
	notTranslated: 'Not translated',
	theme: 'Theme',
	themeLight: 'Light',
	themeDark: 'Dark',
	themeSystem: 'System',
	menu: 'Menu',
	skipToContent: 'Skip to content',
	close: 'Close',
	reference: 'Reference',
	overview: 'Overview',
	notFoundTitle: 'Page not found',
	notFoundText: 'This page does not exist or has been moved.',
	backHome: 'Back to home',
	language: 'Language',
	externalDocs: 'Read external documentation',
	codeSamples: 'Code Samples',
	exampleResponses: 'Example Responses',
	copyPage: 'Copy page',
	copied: 'Copied',
	viewMarkdown: 'View as Markdown',
	openIn: 'Open in {name}',
	schemas: 'Models',
	tryIt: 'Try it',
	send: 'Send',
	sending: 'Sending...',
	response: 'Response',
	requestFailed: 'Request failed. The API may not allow cross-origin requests from this site.'
};

function resolveOgFontPaths(): string[] {
	try {
		const require = createRequire(fileURLToPath(new URL('../package.json', import.meta.url)));
		const pkgRoot = path.dirname(require.resolve('@fontsource/inter/package.json'));
		return [
			path.join(pkgRoot, 'files/inter-latin-400-normal.woff'),
			path.join(pkgRoot, 'files/inter-latin-700-normal.woff')
		];
	} catch {
		return [];
	}
}

function resolveOgModules(): LyvoConfig['og']['modules'] {
	try {
		return { satori: import.meta.resolve('satori'), sharp: import.meta.resolve('sharp') };
	} catch {
		return null;
	}
}

function normalizePrefix(prefix: string): string {
	const trimmed = prefix.trim().replace(/\/+$/, '');
	if (!trimmed) return '';
	return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

interface AstroConfigLike {
	site?: string;
	base?: string;
	trailingSlash?: 'always' | 'never' | 'ignore';
	build?: { format?: 'file' | 'directory' | 'preserve' };
	fonts?: Array<{ cssVariable?: string }>;
}

export class LyvoConfigError extends Error {}

function normalizeSpecs(raw: LyvoOptions['openapi']): ApiSpecConfig[] {
	const rawSpecs = Array.isArray(raw) ? raw : raw ? [raw] : [];
	if (rawSpecs.length === 0) return [];

	const root = normalizePrefix(rawSpecs[0].prefix ?? '/api');
	return rawSpecs.map((spec, index) => {
		const prefix = normalizePrefix(spec.prefix ?? '/api');
		if (!prefix.startsWith(root)) {
			throw new LyvoConfigError(
				`All OpenAPI spec prefixes must share the root "${root}", got "${prefix}". ` +
					`Use nested prefixes like "${root}" and "${root}/v2".`
			);
		}
		const sub = prefix.slice(root.length).replace(/^\/+|\/+$/g, '');
		return {
			id: sub || (index === 0 ? 'default' : `spec-${index}`),
			input: spec.input,
			root,
			sub,
			groupBy: spec.groupBy ?? 'tag',
			title: spec.title ?? 'API Reference',
			snippets: spec.snippets ?? ['curl', 'javascript', 'python', 'go'],
			playground: spec.playground ?? true
		};
	});
}

// Config links are written as site paths ("/blog"). Prefix them with `base` and
// add the trailing slash once here.
function linkSidebar(
	items: SidebarInput[] | undefined,
	link: (href: string) => string
): SidebarInput[] | undefined {
	return items?.map((item) =>
		typeof item === 'string'
			? item
			: {
					...item,
					href: item.href ? link(item.href) : undefined,
					items: linkSidebar(item.items, link)
				}
	);
}

export function normalizeOptions(raw: LyvoOptions, astroConfig: AstroConfigLike): LyvoConfig {
	const base = (astroConfig.base ?? '').replace(/\/+$/, '');
	const trailingSlash =
		astroConfig.trailingSlash === 'always' ||
		(astroConfig.trailingSlash !== 'never' &&
			(astroConfig.build?.format ?? 'directory') === 'directory');
	const link = (href: string) =>
		trailingSlash ? withTrailingSlash(applyBase(base, href)) : applyBase(base, href);
	const defaultLocale = raw.lang ?? 'en';
	const locales: LocaleConfig[] = (raw.i18n?.locales ?? [])
		.map((locale) =>
			typeof locale === 'string'
				? { code: locale, label: localeLabel(locale) }
				: { code: locale.code, label: localeLabel(locale.code, locale.label) }
		)
		.filter((locale) => locale.code !== defaultLocale);

	for (const locale of locales) {
		if (locale.code.includes('/')) {
			throw new LyvoConfigError(`Locale code "${locale.code}" must not contain slashes.`);
		}
	}

	const labels: Record<string, string> = { [defaultLocale]: localeLabel(defaultLocale) };
	for (const locale of locales) labels[locale.code] = locale.label;

	const ui: Record<string, Record<string, string>> = {};
	for (const code of [defaultLocale, ...locales.map((locale) => locale.code)]) {
		ui[code] = { ...UI_DEFAULTS, ...raw.i18n?.ui?.[code] };
	}

	const specs = normalizeSpecs(raw.openapi);
	const generateOg = raw.og?.generate ?? true;

	return {
		title: raw.title ?? 'Docs',
		description: raw.description,
		site: astroConfig.site,
		base,
		trailingSlash,
		logo: raw.logo,
		favicon: raw.favicon,
		repo: raw.repo ? { url: raw.repo.url, branch: raw.repo.branch ?? 'main' } : undefined,
		socials: raw.socials ?? [],
		nav: (raw.nav ?? []).map((item) => ({ ...item, href: link(item.href) })),
		footer: raw.footer && {
			...raw.footer,
			columns: raw.footer.columns?.map((column) => ({
				...column,
				links: column.links.map((item) => ({ ...item, href: link(item.href) }))
			}))
		},
		docs: {
			prefix: normalizePrefix(raw.docs?.prefix ?? '/docs'),
			edit: raw.docs?.edit ?? true,
			feedback: raw.docs?.feedback ?? true,
			sidebar: linkSidebar(raw.docs?.sidebar, link)
		},
		api: {
			root: specs[0]?.root ?? '/api',
			specs
		},
		i18n: { defaultLocale, locales, labels, ui },
		og: {
			generate: generateOg,
			image: raw.og?.image,
			fontPaths: generateOg ? resolveOgFontPaths() : [],
			modules: generateOg ? resolveOgModules() : null
		},
		llms: raw.llms ?? true,
		mermaid: raw.mermaid ?? true,
		search: raw.search ?? true,
		sitemap: raw.sitemap ?? true,
		robots: raw.robots ?? true,
		analytics: raw.analytics,
		fonts: (astroConfig.fonts ?? [])
			.map((font) => font.cssVariable)
			.filter((variable): variable is string => Boolean(variable?.startsWith('--font'))),
		head: raw.head,
		customCss: raw.customCss ?? []
	};
}
