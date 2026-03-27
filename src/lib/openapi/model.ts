import fs from 'node:fs';
import path from 'node:path';
import type { OpenAPIModel } from './types';

const DEFAULT_MODEL_PATH = path.resolve('src/content/api/openapi-model.json');

export function readOpenAPIModel(modelPath: string = DEFAULT_MODEL_PATH): OpenAPIModel {
	const content = fs.readFileSync(modelPath, 'utf-8');
	return JSON.parse(content) as OpenAPIModel;
}

export function tryReadOpenAPIModel(modelPath: string = DEFAULT_MODEL_PATH): OpenAPIModel | null {
	try {
		return readOpenAPIModel(modelPath);
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
