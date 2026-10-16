import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { makeSlug, normalizePathForSlug, toTitle } from '../src/lib/openapi/loader';

describe('makeSlug', () => {
	it('prefers the operationId', () => {
		expect(makeSlug('get', '/planets/{planetId}', 'getPlanetById')).toBe('getplanetbyid');
	});

	it('falls back to method + path', () => {
		expect(makeSlug('get', '/planets/{planetId}', '')).toBe('get-planets-planetId');
	});

	it('handles root paths', () => {
		expect(makeSlug('post', '/', '')).toBe('post-root');
	});
});

describe('normalizePathForSlug', () => {
	it('strips path params and separators', () => {
		expect(normalizePathForSlug('/planets/{planetId}/moons/')).toBe('planets/planetId/moons');
	});
});

describe('toTitle', () => {
	it('splits camel case and separators', () => {
		expect(toTitle('getPlanetById')).toBe('Get Planet By Id');
		expect(toTitle('user_profile-name')).toBe('User Profile Name');
	});

	it('uses the last segment of dotted names', () => {
		expect(toTitle('com.example.getUser')).toBe('Get User');
	});

	it('falls back to Untitled', () => {
		expect(toTitle(null)).toBe('Untitled');
		expect(toTitle('---')).toBe('Untitled');
	});
});

describe('loadSpec', async () => {
	const { loadSpec } = await import('../src/lib/openapi/loader');
	const { schemaName } = await import('../src/lib/openapi/schema');
	const model = await loadSpec({
		id: 'default',
		input: new URL('../../../apps/demo/public/openapi.json', import.meta.url).pathname,
		groupBy: 'tag',
		snippets: ['curl']
	});

	it('names component schemas so references can link to them', () => {
		const planet = model.schemas.find((schema) => schema.name === 'Planet');
		expect(planet?.slug).toBe('planet');
		expect(schemaName(planet?.schema)).toBe('Planet');
	});

	it('resolves circular top-level refs in request bodies', () => {
		const create = model.operations.find((operation) => operation.slug === 'createplanet');
		const schema = create?.requestBody?.content[0].schema as Record<string, unknown>;
		expect(schema.$ref).toBeUndefined();
		expect(schema.properties).toBeDefined();
	});

	it('sends apiKey headers under their real name', () => {
		const scheme = model.securitySchemes.find((item) => item.name === 'apiKeyHeader');
		expect(scheme?.paramName).toBe('X-API-Key');
	});

	it('groups webhooks last', () => {
		expect(model.navigation.at(-1)?.title).toBe('Webhooks');
	});

	it('resolves the input against the given root', async () => {
		const root = new URL('../../../apps/demo/', import.meta.url).pathname;
		const fromRoot = await loadSpec(
			{ id: 'x', input: 'public/openapi.json', groupBy: 'tag', snippets: [] },
			root
		);
		expect(fromRoot.source).toBe('public/openapi.json');
	});

	it('renames colliding slugs instead of dropping pages', async () => {
		const dir = mkdtempSync(path.join(tmpdir(), 'lyvo-'));
		const input = path.join(dir, 'spec.json');
		const ok = { responses: { '200': { description: 'ok' } } };
		writeFileSync(
			input,
			JSON.stringify({
				openapi: '3.1.0',
				info: { title: 'T', version: '1' },
				paths: {
					'/a': { get: { ...ok, operationId: 'getThing' } },
					'/b': { get: { ...ok, operationId: 'GetThing' } }
				},
				components: { schemas: { User: { type: 'object' }, user: { type: 'object' } } }
			})
		);
		const warnings: string[] = [];
		const spec = await loadSpec(
			{ id: 'x', input, groupBy: 'tag', snippets: [] },
			dir,
			(message) => warnings.push(message)
		);
		expect(spec.operations.map((operation) => operation.slug)).toEqual([
			'getthing',
			'getthing-2'
		]);
		expect(spec.schemas.map((schema) => schema.slug).sort()).toEqual(['user', 'user-2']);
		expect(warnings).toHaveLength(2);
	});

	it('fails loudly on a broken spec', async () => {
		await expect(
			loadSpec({ id: 'x', input: 'does-not-exist.json', groupBy: 'tag', snippets: [] })
		).rejects.toThrow(/failed to load/);
	});
});
