import { describe, expect, it } from 'vitest';
import {
	joinUrl,
	splitDocId,
	docPageId,
	docsUrl,
	apiPageUrl,
	localeFromPath,
	stripLocaleFromPath,
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
