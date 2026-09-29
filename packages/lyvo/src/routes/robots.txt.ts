import type { APIRoute } from 'astro';
import config from 'virtual:lyvo-config';
import { withBase } from '@lyvo/lib/url';

export const GET: APIRoute = ({ site }) => {
	const lines = ['User-agent: *', 'Allow: /'];
	if (config.sitemap && site)
		lines.push('', `Sitemap: ${new URL(withBase('/sitemap-index.xml'), site).href}`);
	return new Response(`${lines.join('\n')}\n`, {
		headers: { 'Content-Type': 'text/plain; charset=utf-8' }
	});
};
