import { getCollection } from 'astro:content';
import config from 'virtual:lyvo-config';
import { docUrl, docsForLocale } from './docs';
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
		const section = `API: ${spec.model.info.title}`;
		const href = (slug: string) => apiPageHref(spec, slug);
		pages.push({
			path: apiIndexHref(spec),
			title: spec.model.info.title,
			description: spec.model.info.description,
			section,
			markdown: () => apiOverviewToMarkdown(spec, href)
		});
		for (const endpoint of [...spec.model.operations, ...spec.model.webhooks]) {
			pages.push({
				path: href(endpoint.slug),
				title: endpoint.title,
				description:
					endpoint.summary ?? `${endpoint.method.toUpperCase()} ${endpoint.path}`,
				section,
				markdown: () => endpointToMarkdown(endpoint)
			});
		}
		for (const schema of spec.model.schemas) {
			pages.push({
				path: href(`schemas/${schema.slug}`),
				title: schema.name,
				description: schema.description,
				section,
				markdown: () => schemaPageToMarkdown(schema)
			});
		}
	}

	return pages;
}
