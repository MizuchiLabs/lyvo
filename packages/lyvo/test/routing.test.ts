import { describe, expect, it } from 'vitest';
import {
	joinUrl,
	splitDocId,
	docPageId,
	docsUrl,
	apiPageUrl,
	localeFromPath,
	stripLocaleFromPath,
	applyBase,
	withTrailingSlash,
	removeBase,
	type RoutingInfo
} from '../src/lib/routing';

const routing: RoutingInfo = {
	docsPrefix: '/docs',
	apiRoot: '/api',
	defaultLocale: 'en',
	locales: [{ code: 'de' }, { code: 'fr' }]
};

describe('joinUrl', () => {
	it('joins and normalizes slashes', () => {
		expect(joinUrl('de', '/docs/', 'guides/x')).toBe('/de/docs/guides/x');
	});

	it('skips empty segments', () => {
		expect(joinUrl('', '/docs', '')).toBe('/docs');
	});
});

describe('splitDocId', () => {
	it('splits declared locale prefixes', () => {
		expect(splitDocId('de/guides/x', ['de', 'fr'])).toEqual({
			locale: 'de',
			pageId: 'guides/x'
		});
	});

	it('treats undeclared prefixes as page ids', () => {
		expect(splitDocId('guides/x', ['de', 'fr'])).toEqual({ locale: null, pageId: 'guides/x' });
	});

	it('handles bare locale ids', () => {
		expect(splitDocId('de', ['de', 'fr'])).toEqual({ locale: 'de', pageId: '' });
	});
});

describe('docPageId', () => {
	it('strips the locale prefix', () => {
		expect(docPageId('de/introduction', ['de'])).toBe('introduction');
	});
});

describe('docsUrl', () => {
	it('builds default locale urls', () => {
		expect(docsUrl(routing, 'guides/x')).toBe('/docs/guides/x');
	});

	it('builds localized urls', () => {
		expect(docsUrl(routing, 'de/guides/x')).toBe('/de/docs/guides/x');
	});
});

describe('apiPageUrl', () => {
	it('builds urls for the default spec', () => {
		expect(apiPageUrl(routing, '', 'getme')).toBe('/api/getme');
	});

	it('builds urls for sub-prefixed specs', () => {
		expect(apiPageUrl(routing, 'v2', 'getme')).toBe('/api/v2/getme');
	});
});

describe('localeFromPath', () => {
	it('detects locale prefixes', () => {
		expect(localeFromPath('/de/docs/x', routing)).toBe('de');
		expect(localeFromPath('/docs/x', routing)).toBe(null);
	});
});

describe('stripLocaleFromPath', () => {
	it('removes the locale prefix', () => {
		expect(stripLocaleFromPath('/de/docs/x', routing)).toBe('/docs/x');
		expect(stripLocaleFromPath('/docs/x', routing)).toBe('/docs/x');
	});
});

describe('applyBase', () => {
	it('prefixes site paths', () => {
		expect(applyBase('/lyvo', '/docs/intro')).toBe('/lyvo/docs/intro');
		expect(applyBase('/lyvo', '/')).toBe('/lyvo/');
	});

	it('leaves already based, external, relative and hash links alone', () => {
		expect(applyBase('/lyvo', '/lyvo/docs')).toBe('/lyvo/docs');
		expect(applyBase('/lyvo', '/lyvo')).toBe('/lyvo');
		expect(applyBase('/lyvo', 'https://example.com/x')).toBe('https://example.com/x');
		expect(applyBase('/lyvo', '//cdn.example.com/x')).toBe('//cdn.example.com/x');
		expect(applyBase('/lyvo', '#intro')).toBe('#intro');
		expect(applyBase('/lyvo', 'guide')).toBe('guide');
	});

	it('does nothing without a base', () => {
		expect(applyBase('', '/docs')).toBe('/docs');
	});

	it('does not treat a shared name prefix as the base', () => {
		expect(applyBase('/lyvo', '/lyvox/docs')).toBe('/lyvo/lyvox/docs');
	});
});

describe('removeBase', () => {
	it('strips the base from the current path', () => {
		expect(removeBase('/lyvo', '/lyvo/de/docs/x')).toBe('/de/docs/x');
		expect(removeBase('/lyvo', '/lyvo')).toBe('/');
		expect(removeBase('/lyvo', '/lyvo/')).toBe('/');
		expect(removeBase('', '/docs')).toBe('/docs');
	});
});

describe('withTrailingSlash', () => {
	it('adds a slash to page paths', () => {
		expect(withTrailingSlash('/docs/intro')).toBe('/docs/intro/');
		expect(withTrailingSlash('/docs/intro/')).toBe('/docs/intro/');
		expect(withTrailingSlash('/')).toBe('/');
	});

	it('keeps hashes and queries after the slash', () => {
		expect(withTrailingSlash('/docs/intro#setup')).toBe('/docs/intro/#setup');
		expect(withTrailingSlash('/docs/intro?tab=a#setup')).toBe('/docs/intro/?tab=a#setup');
	});

	it('leaves files and other links alone', () => {
		expect(withTrailingSlash('/openapi.json')).toBe('/openapi.json');
		expect(withTrailingSlash('/docs/intro.md')).toBe('/docs/intro.md');
		expect(withTrailingSlash('https://example.com/x')).toBe('https://example.com/x');
		expect(withTrailingSlash('//cdn.example.com/x')).toBe('//cdn.example.com/x');
		expect(withTrailingSlash('#intro')).toBe('#intro');
	});
});
