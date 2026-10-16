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

	it('opens Java text blocks and C# raw strings on their own line', () => {
		expect(code('java')).toContain('ofString("""\n{\n');
		expect(code('csharp')).toContain('new StringContent("""\n{\n');
		expect(code('csharp')).toContain(
			'\n}\n""", System.Text.Encoding.UTF8, "application/json")'
		);
	});

	it('doubles backslashes inside Java text blocks', () => {
		const java = buildSnippets({ ...request, body: { path: 'C:\\tmp' } }, ['java'])[0].code;
		expect(java).toContain('"C:\\\\\\\\tmp"');
	});

	it('sends form bodies as form fields', () => {
		const form = { ...request, mediaType: 'application/x-www-form-urlencoded' };
		const [curl, js, python, go] = buildSnippets(form, ['curl', 'javascript', 'python', 'go']);
		expect(curl.code).toContain(`--data-urlencode 'active=true'`);
		expect(curl.code).not.toContain('application/json');
		expect(js.code).toContain('new URLSearchParams(');
		expect(python.code).toContain('data={');
		expect(go.code).toContain('name=O%27Brien&active=true');
		expect(go.code).toContain('"application/x-www-form-urlencoded"');
	});

	it('sends multipart bodies as form data', () => {
		const multipart = { ...request, mediaType: 'multipart/form-data' };
		const [curl, js, python, go, csharp, java] = buildSnippets(multipart, [
			'curl',
			'javascript',
			'python',
			'go',
			'csharp',
			'java'
		]);
		expect(curl.code).toContain(`-F 'name=O'\\''Brien'`);
		expect(js.code).toContain('form.append("name", "O\'Brien");');
		expect(python.code).toContain('"name": (None, "O\'Brien"),');
		expect(go.code).toContain('form.WriteField("name", "O\'Brien")');
		expect(csharp.code).toContain('new MultipartFormDataContent');
		expect(java.code).toContain('multipart/form-data; boundary=lyvo-boundary');
	});

	it('omits the body when there is none', () => {
		const get = buildSnippets({ ...request, method: 'get', body: undefined }, ['curl', 'go']);
		expect(get[0].code).not.toContain('-d');
		expect(get[1].code).toContain('var body io.Reader');
	});
});
