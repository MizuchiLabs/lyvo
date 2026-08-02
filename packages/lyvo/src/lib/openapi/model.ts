import type { OpenAPIModel } from '@lyvo/lib/openapi/types';
import { getEntry } from 'astro:content';

let cached: OpenAPIModel | null | undefined;

export async function readOpenAPIModel(): Promise<OpenAPIModel> {
	if (cached) return cached;

	const entry = await getEntry('api', 'openapi-model');
	if (!entry) {
		throw new Error(
			'OpenAPI model not found. Ensure the API collection is configured correctly.'
		);
	}
	cached = entry.data as unknown as OpenAPIModel;
	return cached;
}

export async function tryReadOpenAPIModel(): Promise<OpenAPIModel | null> {
	try {
		return await readOpenAPIModel();
	} catch {
		return null;
	}
}

export function getOpenAPIOperationBySlug(model: OpenAPIModel, slug: string) {
	return model.operations.find((operation) => operation.slug === slug) ?? null;
}

export function getOpenAPIWebhookBySlug(model: OpenAPIModel, slug: string) {
	return model.webhooks.find((webhook) => webhook.slug === slug) ?? null;
}
