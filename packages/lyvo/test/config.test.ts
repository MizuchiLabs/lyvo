import { describe, expect, it } from 'vitest';
import {
	LyvoOptionsSchema,
	normalizeOptions,
	LyvoConfigError,
	type LyvoOptions
} from '../src/config';

function normalize(raw: LyvoOptions, astroConfig: Parameters<typeof normalizeOptions>[1] = {}) {
	return normalizeOptions(LyvoOptionsSchema.parse(raw), astroConfig);
}

describe('normalizeOptions', () => {
	it('applies defaults', () => {
		const config = normalize({});
		expect(config.title).toBe('Docs');
		expect(config.docs.prefix).toBe('/docs');
		expect(config.api.root).toBe('/api');
		expect(config.search).toBe(true);
		expect(config.sitemap).toBe(true);
		expect(config.robots).toBe(true);
		expect(config.llms).toBe(true);
		expect(config.og.generate).toBe(true);
		expect(config.nav).toEqual([]);
		expect(config.trailingSlash).toBe(true);
	});

	it('uses lang as the default locale', () => {
		const config = normalize({ lang: 'de' });
		expect(config.i18n.defaultLocale).toBe('de');
	});

	it('filters the default locale out of the locales list', () => {
		const config = normalize({
			lang: 'en',
			i18n: { locales: ['en', 'de', { code: 'fr', label: 'Français' }] }
		});
		expect(config.i18n.locales.map((locale) => locale.code)).toEqual(['de', 'fr']);
		expect(config.i18n.locales[1].label).toBe('Français');
	});

	it('falls back to native locale names when no label is declared', () => {
		const config = normalize({ i18n: { locales: ['de', 'xx'] } });
		expect(config.i18n.labels).toEqual({ en: 'English', de: 'Deutsch', xx: 'xx' });
	});

	it('fills missing UI strings from defaults and keeps overrides', () => {
		const config = normalize({
			i18n: { locales: ['de'], ui: { de: { onThisPage: 'Auf dieser Seite' } } }
		});
		expect(config.i18n.ui.de.onThisPage).toBe('Auf dieser Seite');
		expect(config.i18n.ui.de.yes).toBe('Yes');
		expect(config.i18n.ui.en.yes).toBe('Yes');
	});

	it('ignores UI strings for undeclared locales', () => {
		const config = normalize({ i18n: { ui: { fr: { yes: 'Oui' } } } });
		expect(config.i18n.ui.fr).toBeUndefined();
	});

	it('normalizes a single OpenAPI spec into an array with defaults', () => {
		const config = normalize({ openapi: { input: 'spec.json' } });
		expect(config.api.specs).toHaveLength(1);
		expect(config.api.specs[0]).toMatchObject({
			id: 'default',
			root: '/api',
			sub: '',
			playground: true,
			snippets: ['curl', 'javascript', 'python', 'go']
		});
	});

	it('normalizes multiple specs sharing a root', () => {
		const config = normalize({
			openapi: [
				{ input: 'v1.json', prefix: '/api' },
				{ input: 'v2.json', prefix: '/api/v2', title: 'V2', snippets: ['curl'] }
			]
		});
		expect(config.api.specs[0].id).toBe('default');
		expect(config.api.specs[1]).toMatchObject({
			id: 'v2',
			sub: 'v2',
			title: 'V2',
			snippets: ['curl']
		});
	});

	it('rejects specs with mismatched roots', () => {
		expect(() =>
			normalize({
				openapi: [
					{ input: 'a.json', prefix: '/api' },
					{ input: 'b.json', prefix: '/other' }
				]
			})
		).toThrow(LyvoConfigError);
	});

	it('normalizes prefixes without leading slashes', () => {
		expect(normalize({ docs: { prefix: 'reference/' } }).docs.prefix).toBe('/reference');
	});

	it('keeps the sidebar as given', () => {
		const config = normalize({
			docs: { sidebar: ['intro', { title: 'Guides', items: ['x'] }, '---'] }
		});
		expect(config.docs.sidebar).toHaveLength(3);
	});

	it('defaults the repo branch', () => {
		expect(normalize({ repo: { url: 'https://github.com/a/b' } }).repo?.branch).toBe('main');
	});

	it('picks up site, trailingSlash and font variables from the astro config', () => {
		const config = normalize(
			{},
			{
				site: 'https://example.com',
				trailingSlash: 'always',
				fonts: [{ cssVariable: '--font-sans-default' }, { cssVariable: undefined }]
			}
		);
		expect(config.site).toBe('https://example.com');
		expect(config.trailingSlash).toBe(true);
		expect(normalize({}, { trailingSlash: 'never' }).trailingSlash).toBe(false);
		expect(normalize({}, { build: { format: 'file' } }).trailingSlash).toBe(false);
		expect(config.fonts).toEqual(['--font-sans-default']);
	});
});

describe('LyvoOptionsSchema', () => {
	it('rejects unknown options, top level and nested', () => {
		expect(LyvoOptionsSchema.safeParse({ bogus: 1 }).success).toBe(false);
		expect(LyvoOptionsSchema.safeParse({ docs: { order: [] } }).success).toBe(false);
	});

	it('rejects unknown snippet languages', () => {
		const result = LyvoOptionsSchema.safeParse({
			openapi: { input: 'a', snippets: ['cobol'] }
		});
		expect(result.success).toBe(false);
	});

	it('requires self-hosted URLs for analytics providers', () => {
		expect(
			LyvoOptionsSchema.safeParse({ analytics: { umami: { websiteId: 'x' } } }).success
		).toBe(false);
		expect(
			LyvoOptionsSchema.safeParse({
				analytics: { umami: { websiteId: 'x', src: 'https://stats.example.eu/script.js' } }
			}).success
		).toBe(true);
		expect(
			LyvoOptionsSchema.safeParse({ analytics: { posthog: { apiKey: 'x' } } }).success
		).toBe(false);
	});
});
