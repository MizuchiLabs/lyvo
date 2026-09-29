import type { APIRoute } from 'astro';
import config from 'virtual:lyvo-config';
import { listPages } from '@lyvo/lib/pages';
import { absoluteUrl } from '@lyvo/lib/seo';
import { withBase } from '@lyvo/lib/url';

// Follows https://llmstxt.org: a title, a summary, then linked sections.
export const GET: APIRoute = async () => {
	const lines = [`# ${config.title}`, ''];
	if (config.description) lines.push(`> ${config.description}`, '');
	lines.push(
		'Every page below is plain Markdown. Append `.md` to any docs or API URL to get its source.',
		`The full content in one file is at ${absoluteUrl(withBase('/llms-full.txt')) ?? withBase('/llms-full.txt')}.`
	);

	const sections = new Map<string, string[]>();
	for (const page of await listPages()) {
		const url = absoluteUrl(`${page.path}.md`) ?? `${page.path}.md`;
		const summary = page.description ? `: ${page.description.split('\n')[0]}` : '';
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
