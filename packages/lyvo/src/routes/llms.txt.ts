import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import config from 'virtual:lyvo-config';
import { docsForLocale, docUrl } from '@lyvo/lib/docs';
import { readAllApiSpecs } from '@lyvo/lib/openapi/model';
import { apiPageHref } from '@lyvo/lib/openapi/links';

export const GET: APIRoute = async () => {
	const lines: string[] = [];

	lines.push(`# ${config.title ?? 'Documentation'}`);
	if (config.description) {
		lines.push('', `> ${config.description}`);
	}

	const all = await getCollection('docs');

	const defaultDocs = docsForLocale(all, null);
	if (defaultDocs.length > 0) {
		lines.push('', '## Docs', '');
		for (const doc of defaultDocs) {
			lines.push(
				`- [${doc.data.title}](${docUrl(doc.id)}): ${doc.data.description ?? ''}`.trimEnd()
			);
		}
	}

	for (const locale of config.i18n.locales) {
		const localeDocs = docsForLocale(all, locale.code);
		if (localeDocs.length === 0) continue;
		lines.push('', `## Docs (${locale.label})`, '');
		for (const doc of localeDocs) {
			lines.push(
				`- [${doc.data.title}](${docUrl(doc.id)}): ${doc.data.description ?? ''}`.trimEnd()
			);
		}
	}

	const specs = await readAllApiSpecs();
	for (const spec of specs) {
		lines.push('', `## API: ${spec.model.info?.title ?? spec.title}`, '');
		for (const operation of spec.model.operations) {
			lines.push(
				`- [${operation.method.toUpperCase()} ${operation.path}](${apiPageHref(spec, operation.slug)}): ${operation.summary ?? ''}`.trimEnd()
			);
		}
	}

	return new Response(`${lines.join('\n')}\n`, {
		headers: { 'Content-Type': 'text/plain; charset=utf-8' }
	});
};
