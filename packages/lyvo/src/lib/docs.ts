import { getCollection, type CollectionEntry } from 'astro:content';
import config from 'virtual:lyvo-config';
import type { SidebarInput } from '../config';
import { stripBase, withBase } from './url';
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
	| { type: 'category'; title: string; icon?: string; items: NavItem[] }
	| { type: 'separator' }
	| { type: 'link'; title: string; href: string; icon?: string };

export interface DocsHierarchy {
	nav: NavItem[];
	docs: DocEntry[];
	/** Locale docs merged with default-locale fallbacks for untranslated pages. */
	routed: DocEntry[];
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
	return withBase(docsUrl(routing, id, activeLocale));
}

export function docPageId(id: string): string {
	return splitPageId(id, localeCodes);
}

export function getRouting(): RoutingInfo {
	return routing;
}

export function currentLocale(pathname: string): string | null {
	return localeFromPath(stripBase(pathname), routing);
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

function buildItemsNav(items: SidebarInput[], docs: DocEntry[], locale: string | null): NavItem[] {
	const byPageId = new Map(docs.map((doc) => [pageIdOf(doc), doc]));
	const scope = locale ? ` (locale "${locale}")` : '';

	const resolve = (input: SidebarInput): NavItem | null => {
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
				icon: input.icon,
				items: input.items.map(resolve).filter((item): item is NavItem => item !== null)
			};
		}
		if (input.href)
			return { type: 'link', title: input.title, href: input.href, icon: input.icon };
		return null;
	};

	return items.map(resolve).filter((item): item is NavItem => item !== null);
}

// Without a configured sidebar: root pages first, then one group per folder.
// Pages sort by frontmatter `order`, groups by their lowest page order.
function buildAutoNav(docs: DocEntry[]): NavItem[] {
	const byOrder = (a: DocEntry, b: DocEntry) =>
		(a.data.order ?? Infinity) - (b.data.order ?? Infinity) ||
		a.data.title.localeCompare(b.data.title);
	const toItem = (doc: DocEntry): NavItem => ({
		type: 'doc',
		id: doc.id,
		title: doc.data.title,
		doc
	});

	const root: DocEntry[] = [];
	const folders = new Map<string, DocEntry[]>();
	for (const doc of docs) {
		const pageId = pageIdOf(doc);
		if (!pageId.includes('/')) {
			root.push(doc);
			continue;
		}
		const folder = pageId.split('/')[0];
		folders.set(folder, [...(folders.get(folder) ?? []), doc]);
	}

	const groups = [...folders.entries()].map(([folder, entries]) => ({
		folder,
		entries: entries.sort(byOrder),
		order: Math.min(...entries.map((doc) => doc.data.order ?? Infinity))
	}));
	groups.sort((a, b) => a.order - b.order || a.folder.localeCompare(b.folder));

	return [
		...root.sort(byOrder).map(toItem),
		...groups.map((group): NavItem => ({
			type: 'category',
			title: toTitleCase(group.folder),
			items: group.entries.map(toItem)
		}))
	];
}

export function buildNav(docs: DocEntry[], locale: string | null): NavItem[] {
	const sidebar = config.docs.sidebar;
	return sidebar ? buildItemsNav(sidebar, docs, locale) : buildAutoNav(docs);
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

	const hierarchy: DocsHierarchy = { nav: buildNav(routed, locale), docs, routed };
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

/** Locales (default included) that have an actual translation of a page. */
export async function getTranslations(pageId: string): Promise<string[]> {
	const all = await getCollection('docs');
	const found = new Set<string>();
	for (const doc of all) {
		const split = splitDocId(doc.id, localeCodes);
		if (split.pageId === pageId) found.add(split.locale ?? config.i18n.defaultLocale);
	}
	return [config.i18n.defaultLocale, ...localeCodes].filter((code) => found.has(code));
}

export interface Crumb {
	title: string;
	href: string;
}

/** Sidebar groups leading to a doc, each linked to its first page. */
export function navTrail(nav: NavItem[], docId: string, locale: string | null): Crumb[] | null {
	for (const item of nav) {
		if (item.type === 'doc' && item.id === docId) return [];
		if (item.type !== 'category') continue;
		const inner = navTrail(item.items, docId, locale);
		if (!inner) continue;
		const first = flattenNav(item.items)[0];
		return [{ title: item.title, href: first ? docUrl(first.id, locale) : '#' }, ...inner];
	}
	return null;
}
