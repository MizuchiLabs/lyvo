import { describe, expect, it } from 'vitest';
import { buildSnippets } from '../src/lib/openapi/snippets';

const request = {
	method: 'post',
	url: 'https://api.example.com/items',
	headers: { 'X-Key': `it's "quoted"` },
	body: { name: "O'Brien", active: true, parent: null, tags: ['a'] }
};

const code = (id: Parameters<typeof buildSnippets>[1][number]) =>
	buildSnippets(request, [id])[0].code;

describe('buildSnippets', () => {
	it('only builds the requested languages, in order', () => {
		expect(buildSnippets(request, ['go', 'curl']).map((snippet) => snippet.id)).toEqual([
			'go',
			'curl'
		]);
	});

	it('shell-quotes curl arguments', () => {
		const curl = code('curl');
		expect(curl).toContain(`-H 'X-Key: it'\\''s "quoted"'`);
		expect(curl).toContain(`"name": "O'\\''Brien"`);
	});

	it('writes Python literals, not JSON', () => {
		const python = code('python');
		expect(python).toContain('"active": True');
		expect(python).toContain('"parent": None');
		expect(python).not.toContain('true');
	});

	it('escapes header values in string literals', () => {
		expect(code('go')).toContain(`req.Header.Set("X-Key", "it's \\"quoted\\"")`);
		expect(code('java')).toContain(`.header("X-Key", "it's \\"quoted\\"")`);
	});

	it('omits the body when there is none', () => {
		const get = buildSnippets({ ...request, method: 'get', body: undefined }, ['curl', 'go']);
		expect(get[0].code).not.toContain('-d');
		expect(get[1].code).toContain('var body io.Reader');
	});
});
