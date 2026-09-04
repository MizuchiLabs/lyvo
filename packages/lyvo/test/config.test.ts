import { describe, expect, it, vi } from 'vitest';
import { LyvoOptionsSchema, normalizeOptions, warnUnknownOptions, LyvoConfigError } from '../src/config';

function normalize(raw: Parameters<typeof normalizeOptions>[0], astroConfig: Parameters<typeof normalizeOptions>[1] = {}) {
	return normalizeOptions(LyvoOptionsSchema.parse(raw), astroConfig);
}

describe('normalizeOptions', () => {
	it('applies defaults', () => {
		const config = normalize({});
		expect(config.title).toBe('Docs');
		expect(config.docs.prefix).toBe('/docs');
		expect(config.api.root).toBe('/api');
		expect(config.features.search).toBe(true);
		expect(config.features.sitemap).toBe(true);
		expect(config.features.cacheHeaders).toBe(false);
		expect(config.llms).toBe(true);
		expect(config.og.generate).toBe(false);
	});

	it('maps lang to the default locale', () => {
		const config = normalize({ lang: 'de' });
		expect(config.lang).toBe('de');
		expect(config.i18n.defaultLocale).toBe('de');
	});

	it('filters the default locale out of the locales list', () => {
		const config = normalize({
			i18n: {
				defaultLocale: 'en',
				locales: ['en', 'de', { code: 'fr', label: 'Français' }]
			}
		});
		expect(config.i18n.locales.map((locale) => locale.code)).toEqual(['de', 'fr']);
		expect(config.i18n.locales[1].label).toBe('Français');
	});

	it('fills missing UI strings from defaults and keeps overrides', () => {
		const config = normalize({
			i18n: {
				locales: ['de'],
				ui: { de: { onThisPage: 'Auf dieser Seite' } }
			}
		});
		expect(config.i18n.ui.de.onThisPage).toBe('Auf dieser Seite');
		expect(config.i18n.ui.de.yes).toBe('Yes');
		expect(config.i18n.ui.en.yes).toBe('Yes');
	});

	it('normalizes a single OpenAPI spec into an array with defaults', () => {
		const config = normalize({ openapi: { input: 'spec.json' } });
		expect(config.api.specs).toHaveLength(1);
		expect(config.api.specs[0]).toMatchObject({ id: 'default', root: '/api', sub: '' });
	});

	it('normalizes multiple specs sharing a root', () => {
		const config = normalize({
			openapi: [
				{ input: 'v1.json', prefix: '/api' },
				{ input: 'v2.json', prefix: '/api/v2', title: 'V2' }
			]
		});
		expect(config.api.specs[0].id).toBe('default');
		expect(config.api.specs[1]).toMatchObject({ id: 'v2', sub: 'v2', title: 'V2' });
		expect(config.api.root).toBe('/api');
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
		const config = normalize({ docs: { prefix: 'reference' } });
		expect(config.docs.prefix).toBe('/reference');
	});

	it('keeps legacy sidebar config and new sidebar config', () => {
		const legacy = normalize({ docs: { sidebar: { order: ['a'], labels: { a: 'A' } } } });
		expect(legacy.docs.sidebar).toEqual({ order: ['a'], labels: { a: 'A' } });

		const items = normalize({
			docs: { sidebar: { items: ['intro', { title: 'Guides', items: ['x'] }, '---'] } }
		});
		expect(items.docs.sidebar?.items).toHaveLength(3);
	});

	it('warns on unknown options', () => {
		const warn = vi.fn();
		warnUnknownOptions({ bogus: 1, title: 'x' }, warn);
		expect(warn).toHaveBeenCalledWith(expect.stringContaining('bogus'));
		expect(warn).not.toHaveBeenCalledWith(expect.stringContaining('title'));
	});

	it('collects configured font variables from the astro config', () => {
		const config = normalize(
			{},
			{
				fonts: [
					{ cssVariable: '--font-sans-default' },
					{ cssVariable: '--font-mono-default' },
					{ cssVariable: undefined }
				]
			}
		);
		expect(config.fonts).toEqual(['--font-sans-default', '--font-mono-default']);
	});
});
