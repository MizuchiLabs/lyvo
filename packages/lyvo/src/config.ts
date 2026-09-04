import { z } from 'astro/zod';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const linkSchema = z.object({
	title: z.string(),
	href: z.string()
});

export type SidebarInput = string | { title: string; href?: string; items?: SidebarInput[] };

const sidebarItemSchema: z.ZodType<SidebarInput> = z.lazy(() =>
	z.union([
		z.string(),
		z.object({
			title: z.string(),
			href: z.string().optional(),
			items: z.array(sidebarItemSchema).optional()
		})
	])
);

const legacySidebarSchema = z.object({
	order: z.array(z.string()).optional(),
	labels: z.record(z.string(), z.string()).optional()
});

const specSchema = z.object({
	input: z.string(),
	prefix: z.string().optional(),
	groupBy: z.enum(['tag', 'path']).optional(),
	title: z.string().optional()
});

const analyticsSchema = z
	.object({
		umami: z
			.object({
				websiteId: z.string(),
				src: z.string().optional(),
				domains: z.string().optional()
			})
			.optional(),
		plausible: z
			.object({
				domain: z.string(),
				src: z.string().optional()
			})
			.optional(),
		posthog: z
			.object({
				apiKey: z.string(),
				host: z.string().optional()
			})
			.optional(),
		matomo: z
			.object({
				url: z.string(),
				siteId: z.string()
			})
			.optional()
	})
	.optional();

export const LyvoOptionsSchema = z.object({
	title: z.string().optional(),
	description: z.string().optional(),
	lang: z.string().optional(),
	logo: z.union([z.string(), z.object({ light: z.string(), dark: z.string() })]).optional(),
	favicon: z
		.object({
			svg: z.string().optional(),
			ico: z.string().optional()
		})
		.optional(),
	repo: z
		.object({
			url: z.string().optional(),
			branch: z.string().optional()
		})
		.optional(),
	socials: z
		.array(z.object({ label: z.string(), href: z.string(), icon: z.string() }))
		.optional(),
	nav: z.array(linkSchema).optional(),
	extraLinks: z.array(linkSchema).optional(),
	footer: z
		.object({
			note: z.string().optional(),
			columns: z
				.array(
					z.object({
						title: z.string(),
						links: z.array(z.object({ label: z.string(), href: z.string() }))
					})
				)
				.optional()
		})
		.optional(),
	docs: z
		.object({
			prefix: z.string().optional(),
			edit: z.boolean().optional(),
			feedback: z.boolean().optional(),
			sidebar: z
				.union([z.object({ items: z.array(sidebarItemSchema) }), legacySidebarSchema])
				.optional()
		})
		.optional(),
	openapi: z.union([specSchema, z.array(specSchema)]).optional(),
	i18n: z
		.object({
			defaultLocale: z.string().optional(),
			locales: z
				.array(z.union([z.string(), z.object({ code: z.string(), label: z.string() })]))
				.optional(),
			ui: z.record(z.string(), z.record(z.string(), z.string())).optional()
		})
		.optional(),
	og: z
		.union([
			z.boolean(),
			z.object({
				siteName: z.string().optional(),
				image: z.string().optional(),
				generate: z.boolean().optional()
			})
		])
		.optional(),
	llms: z.boolean().optional(),
	search: z.boolean().optional(),
	sitemap: z.boolean().optional(),
	cacheHeaders: z.boolean().optional(),
	analytics: analyticsSchema,
	head: z.string().optional(),
	customCss: z.array(z.string()).optional()
});

export type AnalyticsConfig = NonNullable<z.infer<typeof analyticsSchema>>;

export type LyvoOptions = z.infer<typeof LyvoOptionsSchema>;

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
}

export interface LyvoConfig {
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
		sidebar?: { items?: SidebarInput[]; order?: string[]; labels?: Record<string, string> };
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
		siteName?: string;
		image?: string;
		generate: boolean;
		/** Absolute paths to woff fonts, resolved by the integration at config time. */
		fontPaths?: string[];
		satoriPath?: string | null;
		sharpPath?: string | null;
	};
	llms: boolean;
	analytics?: AnalyticsConfig;
	features: {
		search: boolean;
		sitemap: boolean;
		cacheHeaders: boolean;
	};
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
	editPage: 'Edit page',
	previous: 'Previous',
	next: 'Next',
	guides: 'Guides',
	reference: 'Reference',
	overview: 'Overview',
	notFoundTitle: 'Page not found',
	notFoundText: 'This page does not exist or has been moved.',
	backHome: 'Back to home',
	language: 'Language',
	externalDocs: 'Read external documentation',
	codeSamples: 'Code Samples',
	exampleResponses: 'Example Responses'
};

function resolveFromTheme(spec: string): string | null {
	const candidates = [
		path.dirname(fileURLToPath(new URL('../package.json', import.meta.url))),
		path.join(process.cwd(), 'package.json')
	];
	for (const candidate of candidates) {
		try {
			return createRequire(candidate).resolve(spec);
		} catch {
			// try next location
		}
	}
	return null;
}

function resolveOgFontPaths(): string[] {
	try {
		const themeDir = path.dirname(fileURLToPath(new URL('../package.json', import.meta.url)));
		const require = createRequire(path.join(themeDir, 'package.json'));
		const pkgRoot = path.dirname(require.resolve('@fontsource/inter'));
		return [
			path.join(pkgRoot, 'files/inter-latin-400-normal.woff'),
			path.join(pkgRoot, 'files/inter-latin-700-normal.woff')
		];
	} catch {
		return [];
	}
}

function normalizePrefix(prefix: string): string {
	const trimmed = prefix.trim();
	if (!trimmed) return '';
	return trimmed.startsWith('/')
		? trimmed.replace(/\/+$/, '')
		: `/${trimmed.replace(/\/+$/, '')}`;
}

interface AstroConfigLike {
	site?: string;
	fonts?: Array<{ cssVariable?: string }>;
	integrations?: Array<{ name: string }>;
}

export class LyvoConfigError extends Error {}

export function warnUnknownOptions(raw: Record<string, unknown>, warn: (message: string) => void) {
	const knownKeys = Object.keys(LyvoOptionsSchema.shape as Record<string, unknown>);
	for (const key of Object.keys(raw)) {
		if (!knownKeys.includes(key)) {
			warn(`Unknown lyvo() option "${key}" was ignored.`);
		}
	}
}

export function normalizeOptions(raw: LyvoOptions, astroConfig: AstroConfigLike): LyvoConfig {
	const localeEntries: LocaleConfig[] = (raw.i18n?.locales ?? []).map((locale) => {
		if (typeof locale === 'string') return { code: locale, label: localeLabel(locale) };
		return { code: locale.code, label: localeLabel(locale.code, locale.label) };
	});
	const defaultLocale = raw.i18n?.defaultLocale ?? raw.lang ?? 'en';
	// Display labels for every declared locale, the default included.
	const labels: Record<string, string> = { [defaultLocale]: localeLabel(defaultLocale) };
	for (const locale of localeEntries) {
		labels[locale.code] = locale.label;
	}
	const filteredLocales = localeEntries.filter((locale) => locale.code !== defaultLocale);
	for (const locale of filteredLocales) {
		if (locale.code.includes('/')) {
			throw new LyvoConfigError(`Locale code "${locale.code}" must not contain slashes.`);
		}
	}

	const ui: Record<string, Record<string, string>> = {
		[defaultLocale]: { ...UI_DEFAULTS, ...raw.i18n?.ui?.[defaultLocale] }
	};
	for (const locale of filteredLocales) {
		ui[locale.code] = { ...UI_DEFAULTS, ...raw.i18n?.ui?.[locale.code] };
	}
	for (const [code, strings] of Object.entries(raw.i18n?.ui ?? {})) {
		ui[code] = { ...(ui[code] ?? UI_DEFAULTS), ...strings };
	}

	let specs: ApiSpecConfig[] = [];
	const rawSpecs = Array.isArray(raw.openapi) ? raw.openapi : raw.openapi ? [raw.openapi] : [];
	if (rawSpecs.length > 0) {
		const root = normalizePrefix(rawSpecs[0].prefix ?? '/api');
		specs = rawSpecs.map((spec, index) => {
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
				title: spec.title ?? 'API Reference'
			};
		});
	}

	const docsPrefix = normalizePrefix(raw.docs?.prefix ?? '/docs');
	const sidebar = raw.docs?.sidebar;
	const sidebarConfig: LyvoConfig['docs']['sidebar'] = sidebar
		? 'items' in sidebar
			? { items: sidebar.items }
			: { order: sidebar.order, labels: sidebar.labels }
		: undefined;

	const ogRaw = raw.og;
	const generateOg = ogRaw === true || (typeof ogRaw === 'object' && ogRaw?.generate === true);
	const og = {
		siteName: typeof ogRaw === 'object' && ogRaw ? ogRaw.siteName : undefined,
		image: typeof ogRaw === 'object' && ogRaw ? ogRaw.image : undefined,
		generate: generateOg,
		fontPaths: generateOg ? resolveOgFontPaths() : [],
		satoriPath: generateOg ? resolveFromTheme('satori') : null,
		sharpPath: generateOg ? resolveFromTheme('sharp') : null
	};

	const fonts = (astroConfig.fonts ?? [])
		.map((font) => font.cssVariable)
		.filter((variable): variable is string =>
			Boolean(variable && variable.startsWith('--font'))
		);

	return {
		title: raw.title ?? 'Docs',
		description: raw.description,
		lang: defaultLocale,
		logo: raw.logo,
		favicon: raw.favicon,
		repo: raw.repo,
		socials: raw.socials ?? [],
		nav: raw.nav,
		extraLinks: raw.extraLinks ?? [],
		footer: raw.footer,
		docs: {
			prefix: docsPrefix,
			edit: raw.docs?.edit ?? true,
			feedback: raw.docs?.feedback ?? true,
			sidebar: sidebarConfig
		},
		api: {
			root: specs[0]?.root ?? '/api',
			specs
		},
		i18n: {
			defaultLocale,
			locales: filteredLocales,
			labels,
			ui
		},
		og,
		llms: raw.llms ?? true,
		analytics: raw.analytics,
		features: {
			search: raw.search ?? true,
			sitemap: raw.sitemap ?? true,
			cacheHeaders: raw.cacheHeaders ?? false
		},
		fonts,
		head: raw.head,
		customCss: raw.customCss ?? []
	};
}
