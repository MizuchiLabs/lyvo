import { getCollection } from 'astro:content';
import config from 'virtual:lyvo-config';
import { docUrl, docsForLocale } from './docs';
import { absoluteUrl } from './seo';
import { apiIndexHref, apiPageHref, readAllApiSpecs } from './openapi/model';
import {
	apiOverviewToMarkdown,
	docToMarkdown,
	endpointToMarkdown,
	schemaPageToMarkdown
} from './markdown';

/** A generated page with a Markdown twin and an OG image. */
export interface SitePage {
	path: string;
	title: string;
	description?: string;
	section: string;
	/** Reached through a parent index page, so llms.txt leaves it out. */
	nested?: boolean;
	/** Id of the API spec the page belongs to. */
	spec?: string;
	markdown: () => string;
}

let cached: Promise<SitePage[]> | null = null;

export function listPages(): Promise<SitePage[]> {
	if (!cached || import.meta.env.DEV) cached = collectPages();
	return cached;
}

async function collectPages(): Promise<SitePage[]> {
	const pages: SitePage[] = [];
	const all = await getCollection('docs');

	const sections = [
		{ label: 'Docs', locale: null as string | null },
		...config.i18n.locales.map((locale) => ({
			label: `Docs (${locale.label})`,
			locale: locale.code
		}))
	];
	for (const { label, locale } of sections) {
		for (const doc of docsForLocale(all, locale)) {
			pages.push({
				path: docUrl(doc.id),
				title: doc.data.title,
				description: doc.data.description,
				section: label,
				markdown: () => docToMarkdown(doc)
			});
		}
	}

	for (const spec of await readAllApiSpecs()) {
		const section = 'API';
		const href = (slug: string) => apiPageHref(spec, slug);
		const link = (slug: string) => absoluteUrl(href(slug)) ?? href(slug);
		pages.push({
			path: apiIndexHref(spec),
			title: spec.model.info.title,
			description: spec.model.info.description,
			section,
			spec: spec.specId,
			markdown: () => apiOverviewToMarkdown(spec, link, link('llms-full.txt'))
		});
		for (const endpoint of [...spec.model.operations, ...spec.model.webhooks]) {
			pages.push({
				path: href(endpoint.slug),
				title: endpoint.title,
				description:
					endpoint.summary ?? `${endpoint.method.toUpperCase()} ${endpoint.path}`,
				section,
				nested: true,
				spec: spec.specId,
				markdown: () => endpointToMarkdown(endpoint)
			});
		}
		for (const schema of spec.model.schemas) {
			pages.push({
				path: href(`schemas/${schema.slug}`),
				title: schema.name,
				description: schema.description,
				section,
				nested: true,
				spec: spec.specId,
				markdown: () => schemaPageToMarkdown(schema)
			});
		}
	}

	return pages;
}

/** Pages joined into one text file, each under its source URL. */
export function joinPages(title: string, description: string | undefined, pages: SitePage[]) {
	const parts = [`# ${title}`];
	if (description) parts.push(`> ${description}`);
	for (const page of pages) {
		parts.push(
			`---\nSource: ${absoluteUrl(page.path) ?? page.path}\n\n${page.markdown().trim()}`
		);
	}
	return `${parts.join('\n\n')}\n`;
}
