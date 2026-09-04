import { getCollection, type CollectionEntry } from 'astro:content';
import config from 'virtual:lyvo-config';
import {
	docsUrl,
	docPageId as splitPageId,
	splitDocId,
	localeFromPath,
	type RoutingInfo
} from './routing';

export type DocEntry = CollectionEntry<'docs'>;

export type NavItem =
	| { type: 'doc'; id: string; title: string; doc: DocEntry }
	| { type: 'category'; title: string; items: NavItem[] }
	| { type: 'separator' }
	| { type: 'link'; title: string; href: string };

export interface DocsHierarchy {
	nav: NavItem[];
	docs: DocEntry[];
	/** Locale docs merged with default-locale fallbacks for untranslated pages. */
	routed: DocEntry[];
}

export interface DocsSidebarConfig {
	items?: import('../config').SidebarInput[];
	order?: string[];
	labels?: Record<string, string>;
}

const routing: RoutingInfo = {
	docsPrefix: config.docs.prefix,
	apiRoot: config.api.root,
	defaultLocale: config.i18n.defaultLocale,
	locales: config.i18n.locales
};

const localeCodes = config.i18n.locales.map((locale) => locale.code);

export { localeCodes };

const hierarchyCache = new Map<string, DocsHierarchy>();

let warnedNoDocs = false;

function isDev(): boolean {
	return import.meta.env?.DEV === true;
}

export function docUrl(id: string, activeLocale?: string | null): string {
	return docsUrl(routing, id, activeLocale);
}

export function docPageId(id: string): string {
	return splitPageId(id, localeCodes);
}

export function getRouting(): RoutingInfo {
	return routing;
}

export function currentLocale(pathname: string): string | null {
	return localeFromPath(pathname, routing);
}

export function docsForLocale(all: DocEntry[], locale: string | null): DocEntry[] {
	return all.filter((doc) => splitDocId(doc.id, localeCodes).locale === locale);
}

function pageIdOf(doc: DocEntry): string {
	return splitDocId(doc.id, localeCodes).pageId;
}

function toTitleCase(value: string): string {
	return value
		.split('-')
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');
}

function buildItemsNav(
	items: NonNullable<DocsSidebarConfig['items']>,
	docs: DocEntry[],
	locale: string | null
): NavItem[] {
	const byPageId = new Map(docs.map((doc) => [pageIdOf(doc), doc]));
	const scope = locale ? ` (locale "${locale}")` : '';

	const resolve = (input: NonNullable<DocsSidebarConfig['items']>[number]): NavItem | null => {
		if (typeof input === 'string') {
			if (input.trim() === '---') return { type: 'separator' };
			const doc = byPageId.get(input.replace(/^\/+|\/+$/g, ''));
			if (!doc) {
				console.warn(`[lyvo] sidebar item "${input}" matches no doc${scope}. Skipping.`);
				return null;
			}
			return { type: 'doc', id: doc.id, title: doc.data.title, doc };
		}
		if (input.items) {
			return {
				type: 'category',
				title: input.title,
				items: input.items.map(resolve).filter((item): item is NavItem => item !== null)
			};
		}
		if (input.href) return { type: 'link', title: input.title, href: input.href };
		return null;
	};

	return items.map(resolve).filter((item): item is NavItem => item !== null);
}

interface LegacyMetaConfig {
	order?: string[];
	labels?: Record<string, string>;
}

function buildLegacyNav(docs: DocEntry[], meta: LegacyMetaConfig | undefined): NavItem[] {
	const orderArr = meta?.order ?? [];
	const labelsObj = meta?.labels ?? {};

	const categorized = new Map<string, DocEntry[]>();
	for (const doc of docs) {
		const pageId = pageIdOf(doc);
		const category = pageId.includes('/') ? pageId.split('/')[0] : 'root';
		if (!categorized.has(category)) categorized.set(category, []);
		categorized.get(category)!.push(doc);
	}

	for (const entries of categorized.values()) {
		entries.sort((a, b) => (a.data.order ?? 0) - (b.data.order ?? 0));
	}

	const items: NavItem[] = [];

	for (const doc of categorized.get('root') ?? []) {
		items.push({ type: 'doc', id: doc.id, title: doc.data.title, doc });
	}

	const categories = [...categorized.keys()].filter((id) => id !== 'root');
	categories.sort((a, b) => {
		const idxA = orderArr.indexOf(a);
		const idxB = orderArr.indexOf(b);
		const rankA = idxA === -1 ? 9999 : idxA;
		const rankB = idxB === -1 ? 9999 : idxB;
		if (rankA !== rankB) return rankA - rankB;
		return (labelsObj[a] ?? a).localeCompare(labelsObj[b] ?? b);
	});

	for (const categoryId of categories) {
		items.push({
			type: 'category',
			title: labelsObj[categoryId] ?? toTitleCase(categoryId),
			items: (categorized.get(categoryId) ?? []).map((doc) => ({
				type: 'doc' as const,
				id: doc.id,
				title: doc.data.title,
				doc
			}))
		});
	}

	return items;
}

export function buildNav(docs: DocEntry[], locale: string | null): NavItem[] {
	const sidebar = config.docs.sidebar as DocsSidebarConfig | undefined;
	if (sidebar?.items) return buildItemsNav(sidebar.items, docs, locale);
	return buildLegacyNav(docs, sidebar);
}

export function flattenNav(nav: NavItem[]): DocEntry[] {
	const docs: DocEntry[] = [];
	for (const item of nav) {
		if (item.type === 'doc') docs.push(item.doc);
		if (item.type === 'category') docs.push(...flattenNav(item.items));
	}
	return docs;
}

export async function getDocsHierarchy(locale: string | null = null): Promise<DocsHierarchy> {
	const key = locale ?? '__default__';
	const cached = hierarchyCache.get(key);
	if (cached && !isDev()) return cached;

	const all = await getCollection('docs');
	const docs = docsForLocale(all, locale);

	if (locale === null && docs.length === 0 && !warnedNoDocs) {
		warnedNoDocs = true;
		console.warn(
			'[lyvo] No docs found in src/content/docs. Add markdown files there or the docs section will be empty.'
		);
	}

	// The nav and localized routes fall back to the default locale for
	// untranslated pages so the sidebar stays complete and nothing 404s.
	// `docs` stays locale-only: it is the set of actually translated pages.
	const localeDocs = docs;
	let routed = docs;
	if (locale) {
		const byPageId = new Map<string, DocEntry>();
		for (const doc of docs) byPageId.set(pageIdOf(doc), doc);
		for (const doc of docsForLocale(all, null)) {
			const pageId = pageIdOf(doc);
			if (!byPageId.has(pageId)) byPageId.set(pageId, doc);
		}
		routed = Array.from(byPageId.values());
	}

	const navDocs = routed;
	const hierarchy: DocsHierarchy = { nav: buildNav(navDocs, locale), docs: localeDocs, routed };
	hierarchyCache.set(key, hierarchy);
	return hierarchy;
}

export async function getFirstDoc(locale: string | null = null): Promise<DocEntry | null> {
	const { nav } = await getDocsHierarchy(locale);
	return flattenNav(nav)[0] ?? null;
}

export async function getPrevNextDocs(
	currentId: string,
	locale: string | null = null
): Promise<{ prevDoc: DocEntry | null; nextDoc: DocEntry | null }> {
	const { nav } = await getDocsHierarchy(locale);
	const sorted = flattenNav(nav);
	const index = sorted.findIndex((doc) => doc.id === currentId);
	if (index === -1) return { prevDoc: null, nextDoc: null };
	return {
		prevDoc: index > 0 ? sorted[index - 1] : null,
		nextDoc: index < sorted.length - 1 ? sorted[index + 1] : null
	};
}
