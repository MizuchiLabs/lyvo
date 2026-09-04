import type { OpenAPIModel } from './types';
import { getEntry } from 'astro:content';
import config from 'virtual:lyvo-config';

const cache = new Map<string, OpenAPIModel>();

function isDev(): boolean {
	return import.meta.env?.DEV === true;
}

export async function readApiModel(specId: string): Promise<OpenAPIModel> {
	if (!isDev() && cache.has(specId)) return cache.get(specId)!;

	const entry = await getEntry('api', `openapi:${specId}`);
	if (!entry) {
		throw new Error(
			`OpenAPI model "${specId}" not found. Ensure the API collection is configured.`
		);
	}

	const model = entry.data as unknown as OpenAPIModel;
	cache.set(specId, model);
	return model;
}

export async function tryReadApiModel(specId: string): Promise<OpenAPIModel | null> {
	try {
		return await readApiModel(specId);
	} catch {
		return null;
	}
}

export async function tryReadDefaultApiModel(): Promise<OpenAPIModel | null> {
	return tryReadApiModel(config.api.specs[0]?.id ?? 'default');
}

export interface LoadedApiSpec {
	specId: string;
	sub: string;
	title: string;
	model: OpenAPIModel;
}

export async function readAllApiSpecs(): Promise<LoadedApiSpec[]> {
	const loaded: LoadedApiSpec[] = [];
	for (const spec of config.api.specs) {
		const model = await tryReadApiModel(spec.id);
		if (model) {
			loaded.push({ specId: spec.id, sub: spec.sub, title: spec.title, model });
		}
	}
	return loaded;
}

export function getOpenAPIOperationBySlug(model: OpenAPIModel, slug: string) {
	return model.operations.find((operation) => operation.slug === slug) ?? null;
}

export function getOpenAPIWebhookBySlug(model: OpenAPIModel, slug: string) {
	return model.webhooks.find((webhook) => webhook.slug === slug) ?? null;
}
