import type { OpenAPIModel, OpenAPIOperation, OpenAPISchemaEntry } from './types';
import { getEntry } from 'astro:content';
import config from 'virtual:lyvo-config';
import { joinUrl } from '../routing';
import { slugify } from '../utils';
import { withBase } from '../url';

const cache = new Map<string, OpenAPIModel>();

export async function readApiModel(specId: string): Promise<OpenAPIModel | null> {
	if (!import.meta.env.DEV && cache.has(specId)) return cache.get(specId)!;

	const entry = await getEntry('api', `openapi:${specId}`);
	if (!entry) return null;

	const model = entry.data as unknown as OpenAPIModel;
	cache.set(specId, model);
	return model;
}

export async function tryReadDefaultApiModel(): Promise<OpenAPIModel | null> {
	const first = config.api.specs[0];
	return first ? readApiModel(first.id) : null;
}

export interface LoadedApiSpec {
	specId: string;
	sub: string;
	title: string;
	playground: boolean;
	model: OpenAPIModel;
}

export async function readAllApiSpecs(): Promise<LoadedApiSpec[]> {
	const loaded: LoadedApiSpec[] = [];
	for (const spec of config.api.specs) {
		const model = await readApiModel(spec.id);
		if (!model) continue;
		loaded.push({
			specId: spec.id,
			sub: spec.sub,
			title: spec.title,
			playground: spec.playground,
			model
		});
	}
	return loaded;
}

export function findEndpoint(model: OpenAPIModel, slug: string): OpenAPIOperation | null {
	return (
		model.operations.find((operation) => operation.slug === slug) ??
		model.webhooks.find((webhook) => webhook.slug === slug) ??
		null
	);
}

export function findSchema(model: OpenAPIModel, slug: string): OpenAPISchemaEntry | null {
	return model.schemas.find((schema) => schema.slug === slug) ?? null;
}

export function apiIndexHref(spec: LoadedApiSpec): string {
	return withBase(joinUrl(config.api.root, spec.sub));
}

export function apiPageHref(spec: LoadedApiSpec, slug: string): string {
	return withBase(joinUrl(config.api.root, spec.sub, slug));
}

export function schemaHref(spec: LoadedApiSpec, name: string): string {
	return apiPageHref(spec, `schemas/${slugify(name)}`);
}
