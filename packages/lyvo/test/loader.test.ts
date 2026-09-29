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

	it('fails loudly on a broken spec', async () => {
		await expect(
			loadSpec({ id: 'x', input: 'does-not-exist.json', groupBy: 'tag', snippets: [] })
		).rejects.toThrow(/failed to load/);
	});
});
