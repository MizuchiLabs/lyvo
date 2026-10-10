import type { APIRoute, GetStaticPaths } from 'astro';
import { listPages, type SitePage } from '@lyvo/lib/pages';
import { stripBase } from '@lyvo/lib/url';

export const getStaticPaths: GetStaticPaths = async () =>
	(await listPages()).map((page) => ({
		params: { path: stripBase(page.path).replace(/^\/|\/$/g, '') },
		props: { page }
	}));

export const GET: APIRoute = ({ props }) =>
	new Response((props.page as SitePage).markdown(), {
		headers: { 'Content-Type': 'text/markdown; charset=utf-8' }
	});
