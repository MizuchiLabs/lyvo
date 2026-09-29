import type { APIRoute } from 'astro';
import config from 'virtual:lyvo-config';
import { listPages } from '@lyvo/lib/pages';
import { absoluteUrl } from '@lyvo/lib/seo';

export const GET: APIRoute = async () => {
	const parts = [`# ${config.title}`];
	if (config.description) parts.push(`> ${config.description}`);

	for (const page of await listPages()) {
		parts.push(
			`---\nSource: ${absoluteUrl(page.path) ?? page.path}\n\n${page.markdown().trim()}`
		);
	}

	return new Response(`${parts.join('\n\n')}\n`, {
		headers: { 'Content-Type': 'text/plain; charset=utf-8' }
	});
};
