import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import config from 'virtual:lyvo-config';
import { docsForLocale, docUrl } from '@lyvo/lib/docs';
import { readAllApiSpecs } from '@lyvo/lib/openapi/model';
import { apiPageHref } from '@lyvo/lib/openapi/links';

function stripMdx(body: string | undefined): string {
	if (!body) return '';
	return body
		.split('\n')
		.filter((line) => !line.trim().startsWith('import '))
		.join('\n')
		.trim();
}

export const GET: APIRoute = async () => {
	const lines: string[] = [];

	lines.push(`# ${config.title ?? 'Documentation'}`);
	if (config.description) {
		lines.push('', `> ${config.description}`);
	}

	const all = await getCollection('docs');
	type DocEntry = Awaited<ReturnType<typeof getCollection>>[number];
	const sections: Array<{ title: string; docs: DocEntry[] }> = [
		{ title: 'Docs', docs: docsForLocale(all, null) }
	];

	for (const locale of config.i18n.locales) {
		const localeDocs = docsForLocale(all, locale.code);
		if (localeDocs.length > 0) {
			sections.push({ title: `Docs (${locale.label})`, docs: localeDocs });
		}
	}

	for (const section of sections) {
		if (section.docs.length === 0) continue;
		lines.push('', `## ${section.title}`, '');
		for (const doc of section.docs) {
			lines.push(`---`, '', `# ${doc.data.title}`, '');
			if (doc.data.description) {
				lines.push(`${doc.data.description}`, '');
			}
			lines.push(`Source: ${docUrl(doc.id)}`, '', stripMdx(doc.body), '');
		}
	}

	const specs = await readAllApiSpecs();
	for (const spec of specs) {
		lines.push('', `## API: ${spec.model.info?.title ?? spec.title}`, '');
		if (spec.model.info?.description) {
			lines.push(stripMdx(spec.model.info.description), '');
		}
		for (const operation of spec.model.operations) {
			lines.push(
				'---',
				'',
				`# ${operation.method.toUpperCase()} ${operation.path}`,
				'',
				`Source: ${apiPageHref(spec, operation.slug)}`,
				''
			);
			if (operation.description) {
				lines.push(stripMdx(operation.description), '');
			}
			if (operation.requestBody?.content[0]?.example !== undefined) {
				lines.push(
					'Request body example:',
					'',
					'```json',
					JSON.stringify(operation.requestBody.content[0].example, null, 2),
					'```',
					''
				);
			}
		}
	}

	return new Response(`${lines.join('\n')}\n`, {
		headers: { 'Content-Type': 'text/plain; charset=utf-8' }
	});
};
