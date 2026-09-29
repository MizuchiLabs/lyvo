import config from 'virtual:lyvo-config';
import { stripBase, withBase } from './url';

export interface Alternate {
	lang: string;
	path: string;
}

export function normalizePath(pathname: string): string {
	const stripped = pathname.replace(/\/+$/, '') || '/';
	if (stripped === '/' || !config.trailingSlash) return stripped;
	return `${stripped}/`;
}

export function absoluteUrl(pathOrUrl: string): string | undefined {
	if (/^https?:\/\//.test(pathOrUrl)) return pathOrUrl;
	if (!config.site) return undefined;
	return new URL(pathOrUrl, config.site).href;
}

/** File name of a page's generated OG image under /og/, e.g. "docs/intro.png". */
export function ogSlug(pathname: string): string {
	return `${stripBase(pathname).replace(/^\/+|\/+$/g, '') || 'index'}.png`;
}

/** Path of the generated OG image for a page path, matching routes/og. */
export function ogImagePath(pathname: string): string {
	return withBase(`/og/${ogSlug(pathname)}`);
}

export function defaultOgImage(): string | undefined {
	if (config.og.image) return withBase(config.og.image);
	return config.og.generate ? ogImagePath('/') : undefined;
}

/** Markdown twin of a page, served by routes/markdown. */
export function markdownPath(pathname: string): string {
	return `${pathname.replace(/\/+$/, '')}.md`;
}

export function websiteJsonLd() {
	return {
		'@context': 'https://schema.org',
		'@type': 'WebSite',
		name: config.title,
		description: config.description,
		url: absoluteUrl(withBase('/')),
		inLanguage: config.i18n.defaultLocale
	};
}

export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
	return {
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: items.map((item, index) => ({
			'@type': 'ListItem',
			position: index + 1,
			name: item.name,
			item: absoluteUrl(item.path)
		}))
	};
}

export function articleJsonLd(options: {
	title: string;
	description?: string;
	path: string;
	lang: string;
	image?: string;
	modified?: Date | null;
}) {
	return {
		'@context': 'https://schema.org',
		'@type': 'TechArticle',
		headline: options.title,
		description: options.description,
		url: absoluteUrl(options.path),
		image: options.image ? absoluteUrl(options.image) : undefined,
		inLanguage: options.lang,
		dateModified: options.modified?.toISOString(),
		isPartOf: { '@type': 'WebSite', name: config.title, url: absoluteUrl(withBase('/')) }
	};
}
