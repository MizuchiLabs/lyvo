import type { APIRoute, GetStaticPaths } from 'astro';
import { joinPages, listPages } from '@lyvo/lib/pages';
import { summarize } from '@lyvo/lib/markdown';
import { readAllApiSpecs, type LoadedApiSpec } from '@lyvo/lib/openapi/model';

export const getStaticPaths: GetStaticPaths = async () =>
	(await readAllApiSpecs()).map((spec) => ({
		params: { spec: spec.sub || undefined },
		props: { spec }
	}));

export const GET: APIRoute = async ({ props }) => {
	const { specId, model } = props.spec as LoadedApiSpec;
	const pages = (await listPages()).filter((page) => page.spec === specId);
	return new Response(joinPages(model.info.title, summarize(model.info.description), pages), {
		headers: { 'Content-Type': 'text/plain; charset=utf-8' }
	});
};
