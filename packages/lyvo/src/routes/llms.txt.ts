import type { APIRoute } from 'astro';
import config from 'virtual:lyvo-config';
import { listPages } from '@lyvo/lib/pages';
import { summarize } from '@lyvo/lib/markdown';
import { absoluteUrl } from '@lyvo/lib/seo';
import { withBase } from '@lyvo/lib/url';

// Follows https://llmstxt.org: a title, a summary, then linked sections.
export const GET: APIRoute = async () => {
	const lines = [`# ${config.title}`, ''];
	if (config.description) lines.push(`> ${config.description}`, '');
	const pages = await listPages();
	lines.push(
		'Every page below is plain Markdown. Append `.md` to any docs or API URL to get its source.',
		`All docs in one file are at ${absoluteUrl(withBase('/llms-full.txt')) ?? withBase('/llms-full.txt')}.`
	);
	if (pages.some((page) => page.spec)) {
		lines.push(
			'Each API page links to its endpoints and models, and to one file with the full reference.'
		);
	}

	const sections = new Map<string, string[]>();
	for (const page of pages) {
		if (page.nested) continue;
		const url = absoluteUrl(`${page.path}.md`) ?? `${page.path}.md`;
		const description = summarize(page.description);
		const summary = description ? `: ${description}` : '';
		sections.set(page.section, [
			...(sections.get(page.section) ?? []),
			`- [${page.title}](${url})${summary}`
		]);
	}
	for (const [section, entries] of sections) lines.push('', `## ${section}`, '', ...entries);

	return new Response(`${lines.join('\n')}\n`, {
		headers: { 'Content-Type': 'text/plain; charset=utf-8' }
	});
};
