import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
	docs: [] as Array<{ id: string; data: { title: string; order?: number } }>,
	config: {
		base: '',
		trailingSlash: false,
		docs: { prefix: '/docs', sidebar: undefined as unknown },
		api: { root: '/api' },
		i18n: { defaultLocale: 'en', locales: [{ code: 'de' }] }
	}
}));

vi.mock('astro:content', () => ({ getCollection: async () => mocks.docs }));
vi.mock('virtual:lyvo-config', () => ({ default: mocks.config }));

import { buildNav, flattenNav, getDocsHierarchy, getPrevNextDocs, navTrail } from '../src/lib/docs';
import type { DocEntry, NavItem } from '../src/lib/docs';

const doc = (id: string, title: string, order?: number) => ({ id, data: { title, order } });
const ids = (docs: Array<{ id: string }>) => docs.map((entry) => entry.id);
const names = (nav: NavItem[]) => nav.map((item) => ('title' in item ? item.title : item.type));

beforeEach(() => {
	vi.stubEnv('DEV', true);
	mocks.config.docs.sidebar = undefined;
	mocks.docs = [
		doc('intro', 'Intro', 1),
		doc('about', 'About'),
		doc('guides/b', 'B', 5),
		doc('guides/a', 'A', 5),
		doc('api/setup', 'Setup', 9),
		doc('de/intro', 'Einführung', 1)
	];
});

describe('auto nav', () => {
	it('puts root pages first and orders groups by their lowest page order', async () => {
		const { nav } = await getDocsHierarchy();
		expect(names(nav)).toEqual(['Intro', 'About', 'Guides', 'Api']);
		expect(ids(flattenNav(nav))).toEqual([
			'intro',
			'about',
			'guides/a',
			'guides/b',
			'api/setup'
		]);
	});

	it('falls back to default-locale pages for untranslated locale pages', async () => {
		const { docs, routed, nav } = await getDocsHierarchy('de');
		expect(ids(docs)).toEqual(['de/intro']);
		expect(ids(routed)).toEqual(['de/intro', 'about', 'guides/b', 'guides/a', 'api/setup']);
		expect(names(nav)).toEqual(['Einführung', 'About', 'Guides', 'Api']);
	});

	it('links prev and next across category boundaries', async () => {
		const { prevDoc, nextDoc } = await getPrevNextDocs('guides/b');
		expect(prevDoc?.id).toBe('guides/a');
		expect(nextDoc?.id).toBe('api/setup');
		expect(await getPrevNextDocs('missing')).toEqual({ prevDoc: null, nextDoc: null });
	});
});

describe('configured sidebar', () => {
	it('resolves strings, separators, categories and links, skipping unmatched entries', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		mocks.config.docs.sidebar = [
			'/intro/',
			'---',
			'nope',
			{ title: 'Guides', icon: 'book', items: ['guides/b', 'gone'] },
			{ title: 'GitHub', href: 'https://github.com' }
		];
		const nav = buildNav(mocks.docs.slice(0, 5) as unknown as DocEntry[], null);
		expect(nav).toEqual([
			{ type: 'doc', id: 'intro', title: 'Intro', doc: mocks.docs[0] },
			{ type: 'separator' },
			{
				type: 'category',
				title: 'Guides',
				icon: 'book',
				items: [{ type: 'doc', id: 'guides/b', title: 'B', doc: mocks.docs[2] }]
			},
			{ type: 'link', title: 'GitHub', href: 'https://github.com', icon: undefined }
		]);
		expect(warn).toHaveBeenCalledTimes(2);
		warn.mockRestore();
	});
});

describe('navTrail', () => {
	it('links each group to its first page', async () => {
		const { nav } = await getDocsHierarchy('de');
		const crumb = { title: 'Guides', href: '/de/docs/guides/a' };
		expect(navTrail(nav, 'guides/b', 'de')).toEqual([crumb]);
		expect(navTrail(nav, 'de/intro', 'de')).toEqual([]);
		expect(navTrail(nav, 'missing', 'de')).toBeNull();
	});
});
