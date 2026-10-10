import type { APIRoute } from 'astro';
import config from 'virtual:lyvo-config';
import { joinPages, listPages } from '@lyvo/lib/pages';

// Docs only. Each API spec has its own file, see routes/api/llms-full.txt.
export const GET: APIRoute = async () => {
	const pages = (await listPages()).filter((page) => !page.spec);
	return new Response(joinPages(config.title, config.description, pages), {
		headers: { 'Content-Type': 'text/plain; charset=utf-8' }
	});
};
