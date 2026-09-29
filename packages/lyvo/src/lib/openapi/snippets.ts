import type { SnippetLanguage } from '../../config';
import type { OpenAPISnippet } from './types';

export interface SnippetRequest {
	method: string;
	url: string;
	headers: Record<string, string>;
	body?: unknown;
}

// Double-quoted string literal, valid in JS, Go, C#, Java and Python.
const quote = (value: string) => JSON.stringify(value);
const shellQuote = (value: string) => `'${value.replaceAll("'", "'\\''")}'`;

function withJsonHeader(request: SnippetRequest): Record<string, string> {
	return request.body === undefined
		? request.headers
		: { ...request.headers, 'Content-Type': 'application/json' };
}

function jsonBody(request: SnippetRequest): string | undefined {
	return request.body === undefined ? undefined : JSON.stringify(request.body, null, 2);
}

function toPython(value: unknown, indent = ''): string {
	if (value === null || value === undefined) return 'None';
	if (value === true) return 'True';
	if (value === false) return 'False';
	if (typeof value !== 'object') return JSON.stringify(value);

	const inner = `${indent}    `;
	if (Array.isArray(value)) {
		if (value.length === 0) return '[]';
		return `[\n${value.map((item) => inner + toPython(item, inner)).join(',\n')}\n${indent}]`;
	}
	const entries = Object.entries(value);
	if (entries.length === 0) return '{}';
	const lines = entries.map(([key, item]) => `${inner}${quote(key)}: ${toPython(item, inner)}`);
	return `{\n${lines.join(',\n')}\n${indent}}`;
}

// Raw multi-line literal so pretty JSON isn't shown with escaped newlines.
// Falls back to a normal string when the delimiter appears in the payload.
function rawLiteral(body: string, delimiter: string): string {
	return body.includes(delimiter) ? quote(body) : `${delimiter}${body}${delimiter}`;
}

const generators: Record<
	SnippetLanguage,
	{ label: string; language: string; build: (r: SnippetRequest) => string }
> = {
	curl: {
		label: 'cURL',
		language: 'bash',
		build(request) {
			const body = jsonBody(request);
			const lines = [`curl -X ${request.method.toUpperCase()} ${shellQuote(request.url)}`];
			for (const [key, value] of Object.entries(withJsonHeader(request))) {
				lines.push(`  -H ${shellQuote(`${key}: ${value}`)}`);
			}
			if (body) lines.push(`  -d ${shellQuote(body)}`);
			return lines.join(' \\\n');
		}
	},
	javascript: {
		label: 'JavaScript',
		language: 'javascript',
		build(request) {
			const body = jsonBody(request);
			return [
				`const response = await fetch(${quote(request.url)}, {`,
				`  method: ${quote(request.method.toUpperCase())},`,
				`  headers: ${JSON.stringify(withJsonHeader(request), null, 2).replaceAll('\n', '\n  ')},`,
				...(body ? [`  body: JSON.stringify(${body.replaceAll('\n', '\n  ')}),`] : []),
				'});',
				'',
				'const data = await response.json();',
				'console.log(data);'
			].join('\n');
		}
	},
	python: {
		label: 'Python',
		language: 'python',
		build(request) {
			return [
				'import requests',
				'',
				`response = requests.request(`,
				`    ${quote(request.method.toUpperCase())},`,
				`    ${quote(request.url)},`,
				`    headers=${toPython(request.headers, '    ')},`,
				...(request.body !== undefined
					? [`    json=${toPython(request.body, '    ')},`]
					: []),
				')',
				'print(response.json())'
			].join('\n');
		}
	},
	go: {
		label: 'Go',
		language: 'go',
		build(request) {
			const body = jsonBody(request);
			return [
				'package main',
				'',
				'import (',
				'\t"fmt"',
				'\t"io"',
				'\t"net/http"',
				...(body ? ['\t"strings"'] : []),
				')',
				'',
				'func main() {',
				body
					? `\tbody := strings.NewReader(${rawLiteral(body, '`')})`
					: '\tvar body io.Reader',
				`\treq, err := http.NewRequest(${quote(request.method.toUpperCase())}, ${quote(request.url)}, body)`,
				'\tif err != nil {',
				'\t\tpanic(err)',
				'\t}',
				...Object.entries(withJsonHeader(request)).map(
					([key, value]) => `\treq.Header.Set(${quote(key)}, ${quote(value)})`
				),
				'',
				'\tres, err := http.DefaultClient.Do(req)',
				'\tif err != nil {',
				'\t\tpanic(err)',
				'\t}',
				'\tdefer res.Body.Close()',
				'',
				'\tdata, _ := io.ReadAll(res.Body)',
				'\tfmt.Println(string(data))',
				'}'
			].join('\n');
		}
	},
	csharp: {
		label: 'C#',
		language: 'csharp',
		build(request) {
			const body = jsonBody(request);
			return [
				'using var client = new HttpClient();',
				`using var request = new HttpRequestMessage(new HttpMethod(${quote(request.method.toUpperCase())}), ${quote(request.url)});`,
				...Object.entries(request.headers).map(
					([key, value]) =>
						`request.Headers.TryAddWithoutValidation(${quote(key)}, ${quote(value)});`
				),
				...(body
					? [
							`request.Content = new StringContent(${rawLiteral(body, '"""')}, System.Text.Encoding.UTF8, "application/json");`
						]
					: []),
				'',
				'using var response = await client.SendAsync(request);',
				'Console.WriteLine(await response.Content.ReadAsStringAsync());'
			].join('\n');
		}
	},
	java: {
		label: 'Java',
		language: 'java',
		build(request) {
			const body = jsonBody(request);
			const publisher = body
				? `HttpRequest.BodyPublishers.ofString(${rawLiteral(body, '"""')})`
				: 'HttpRequest.BodyPublishers.noBody()';
			return [
				'var client = HttpClient.newHttpClient();',
				'var request = HttpRequest.newBuilder()',
				`    .uri(URI.create(${quote(request.url)}))`,
				...Object.entries(withJsonHeader(request)).map(
					([key, value]) => `    .header(${quote(key)}, ${quote(value)})`
				),
				`    .method(${quote(request.method.toUpperCase())}, ${publisher})`,
				'    .build();',
				'',
				'var response = client.send(request, HttpResponse.BodyHandlers.ofString());',
				'System.out.println(response.body());'
			].join('\n');
		}
	}
};

export function buildSnippets(
	request: SnippetRequest,
	languages: SnippetLanguage[]
): OpenAPISnippet[] {
	return languages.map((id) => {
		const generator = generators[id];
		return {
			id,
			label: generator.label,
			language: generator.language,
			code: generator.build(request)
		};
	});
}
