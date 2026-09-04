import { describe, expect, it } from 'vitest';
import { makeSlug, normalizePathForSlug, toTitle } from '../src/lib/openapi/loader';

describe('makeSlug', () => {
	it('prefers the operationId', () => {
		expect(makeSlug('get', '/planets/{planetId}', 'getPlanetById')).toBe('getplanetbyid');
	});

	it('falls back to method + path', () => {
		expect(makeSlug('get', '/planets/{planetId}', undefined)).toBe('get-planets-planetId');
	});

	it('handles root paths', () => {
		expect(makeSlug('post', '/', undefined)).toBe('post-root');
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
