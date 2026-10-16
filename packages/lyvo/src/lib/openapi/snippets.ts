import type { SnippetLanguage } from '../../config';
import type { OpenAPISnippet } from './types';

export interface SnippetRequest {
	method: string;
	url: string;
	headers: Record<string, string>;
	body?: unknown;
	/** Media type of the body. Defaults to application/json. */
	mediaType?: string;
}

type Body =
	| { kind: 'json'; mediaType: string; text: string }
	| { kind: 'text'; mediaType: string; text: string }
	| { kind: 'form'; mediaType: string; fields: Array<[string, string]> }
	| { kind: 'multipart'; mediaType: string; fields: Array<[string, string]> };

const BOUNDARY = 'lyvo-boundary';

// Double-quoted string literal, valid in JS, Go, C#, Java and Python.
const quote = (value: string) => JSON.stringify(value);
const shellQuote = (value: string) => `'${value.replaceAll("'", "'\\''")}'`;

function encodeBody(request: SnippetRequest): Body | undefined {
	const { body } = request;
	if (body === undefined) return undefined;
	const mediaType = request.mediaType ?? 'application/json';
	const base = mediaType.split(';')[0].trim().toLowerCase();

	const isRecord = typeof body === 'object' && body !== null && !Array.isArray(body);
	if (
		isRecord &&
		(base === 'application/x-www-form-urlencoded' || base === 'multipart/form-data')
	) {
		const fields = Object.entries(body).map(([key, value]): [string, string] => [
			key,
			typeof value === 'string' ? value : JSON.stringify(value)
		]);
		return {
			kind: base === 'multipart/form-data' ? 'multipart' : 'form',
			mediaType: base,
			fields
		};
	}
	if (base.includes('json'))
		return { kind: 'json', mediaType, text: JSON.stringify(body, null, 2) };
	return {
		kind: 'text',
		mediaType,
		text: typeof body === 'string' ? body : JSON.stringify(body)
	};
}

/** The body as one string, for clients that send raw bytes. */
function bodyText(body: Body): string {
	if (body.kind === 'json' || body.kind === 'text') return body.text;
	if (body.kind === 'form') return new URLSearchParams(body.fields).toString();
	const parts = body.fields.map(
		([key, value]) =>
			`--${BOUNDARY}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${value}\r\n`
	);
	return `${parts.join('')}--${BOUNDARY}--\r\n`;
}

function contentType(body: Body): string {
	return body.kind === 'multipart' ? `${body.mediaType}; boundary=${BOUNDARY}` : body.mediaType;
}

function withContentType(request: SnippetRequest, body: Body | undefined): Record<string, string> {
	return body ? { ...request.headers, 'Content-Type': contentType(body) } : request.headers;
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

// Raw multi-line literals where possible, so pretty JSON keeps its line breaks.
function goString(text: string): string {
	return text.includes('`') || text.includes('\r') ? quote(text) : `\`${text}\``;
}

function csharpString(text: string): string {
	const raw = text.includes('\n') && !text.includes('\r') && !text.includes('"""');
	return raw ? `"""\n${text}\n"""` : quote(text);
}

function javaString(text: string): string {
	// A trailing quote would run into the closing delimiter.
	const raw =
		text.includes('\n') && !text.includes('\r') && !text.includes('"""') && !text.endsWith('"');
	// Text blocks still process escapes, so backslashes need doubling.
	return raw ? `"""\n${text.replaceAll('\\', '\\\\')}"""` : quote(text);
}

const indentLines = (text: string, indent: string) => text.replaceAll('\n', `\n${indent}`);

const generators: Record<
	SnippetLanguage,
	{ label: string; language: string; build: (r: SnippetRequest, body?: Body) => string }
> = {
	curl: {
		label: 'cURL',
		language: 'bash',
		build(request, body) {
			const lines = [`curl -X ${request.method.toUpperCase()} ${shellQuote(request.url)}`];
			const raw = body?.kind === 'json' || body?.kind === 'text';
			const headers = raw ? withContentType(request, body) : request.headers;
			for (const [key, value] of Object.entries(headers)) {
				lines.push(`  -H ${shellQuote(`${key}: ${value}`)}`);
			}
			if (body?.kind === 'json' || body?.kind === 'text')
				lines.push(`  -d ${shellQuote(body.text)}`);
			if (body?.kind === 'form' || body?.kind === 'multipart') {
				const flag = body.kind === 'form' ? '--data-urlencode' : '-F';
				for (const [key, value] of body.fields) {
					lines.push(`  ${flag} ${shellQuote(`${key}=${value}`)}`);
				}
			}
			return lines.join(' \\\n');
		}
	},
	javascript: {
		label: 'JavaScript',
		language: 'javascript',
		build(request, body) {
			const lines: string[] = [];
			let headers = request.headers;
			let payload: string | undefined;
			if (body?.kind === 'json') {
				headers = withContentType(request, body);
				payload = `JSON.stringify(${indentLines(body.text, '  ')})`;
			} else if (body?.kind === 'text') {
				headers = withContentType(request, body);
				payload = quote(body.text);
			} else if (body?.kind === 'form') {
				const fields = JSON.stringify(Object.fromEntries(body.fields), null, 2);
				payload = `new URLSearchParams(${indentLines(fields, '  ')})`;
			} else if (body?.kind === 'multipart') {
				lines.push(
					'const form = new FormData();',
					...body.fields.map(
						([key, value]) => `form.append(${quote(key)}, ${quote(value)});`
					),
					''
				);
				payload = 'form';
			}
			return [
				...lines,
				`const response = await fetch(${quote(request.url)}, {`,
				`  method: ${quote(request.method.toUpperCase())},`,
				`  headers: ${indentLines(JSON.stringify(headers, null, 2), '  ')},`,
				...(payload ? [`  body: ${payload},`] : []),
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
		build(request, body) {
			const headers =
				body?.kind === 'text' ? withContentType(request, body) : request.headers;
			let payload: string[] = [];
			if (body?.kind === 'json') payload = [`    json=${toPython(request.body, '    ')},`];
			if (body?.kind === 'text') payload = [`    data=${quote(body.text)},`];
			if (body?.kind === 'form') {
				payload = [`    data=${toPython(Object.fromEntries(body.fields), '    ')},`];
			}
			if (body?.kind === 'multipart') {
				payload = [
					'    files={',
					...body.fields.map(
						([key, value]) => `        ${quote(key)}: (None, ${quote(value)}),`
					),
					'    },'
				];
			}
			return [
				'import requests',
				'',
				`response = requests.request(`,
				`    ${quote(request.method.toUpperCase())},`,
				`    ${quote(request.url)},`,
				`    headers=${toPython(headers, '    ')},`,
				...payload,
				')',
				'print(response.json())'
			].join('\n');
		}
	},
	go: {
		label: 'Go',
		language: 'go',
		build(request, body) {
			const multipart = body?.kind === 'multipart';
			const imports = [
				...(multipart ? ['bytes'] : []),
				'fmt',
				'io',
				...(multipart ? ['mime/multipart'] : []),
				'net/http',
				...(body && !multipart ? ['strings'] : [])
			];
			let setup = ['\tvar body io.Reader'];
			let headers = Object.entries(request.headers).map(
				([key, value]) => `\treq.Header.Set(${quote(key)}, ${quote(value)})`
			);
			if (body?.kind === 'multipart') {
				setup = [
					'\tvar body bytes.Buffer',
					'\tform := multipart.NewWriter(&body)',
					...body.fields.map(
						([key, value]) => `\tform.WriteField(${quote(key)}, ${quote(value)})`
					),
					'\tform.Close()'
				];
				headers = [
					...headers,
					'\treq.Header.Set("Content-Type", form.FormDataContentType())'
				];
			} else if (body) {
				setup = [`\tbody := strings.NewReader(${goString(bodyText(body))})`];
				headers = [
					...headers,
					`\treq.Header.Set("Content-Type", ${quote(contentType(body))})`
				];
			}
			return [
				'package main',
				'',
				'import (',
				...imports.map((name) => `\t"${name}"`),
				')',
				'',
				'func main() {',
				...setup,
				`\treq, err := http.NewRequest(${quote(request.method.toUpperCase())}, ${quote(request.url)}, ${multipart ? '&body' : 'body'})`,
				'\tif err != nil {',
				'\t\tpanic(err)',
				'\t}',
				...headers,
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
		build(request, body) {
			let content: string[] = [];
			if (body?.kind === 'multipart') {
				content = [
					'request.Content = new MultipartFormDataContent',
					'{',
					...body.fields.map(
						([key, value]) =>
							`    { new StringContent(${quote(value)}), ${quote(key)} },`
					),
					'};'
				];
			} else if (body) {
				content = [
					`request.Content = new StringContent(${csharpString(bodyText(body))}, System.Text.Encoding.UTF8, ${quote(body.mediaType.split(';')[0].trim())});`
				];
			}
			return [
				'using var client = new HttpClient();',
				`using var request = new HttpRequestMessage(new HttpMethod(${quote(request.method.toUpperCase())}), ${quote(request.url)});`,
				...Object.entries(request.headers).map(
					([key, value]) =>
						`request.Headers.TryAddWithoutValidation(${quote(key)}, ${quote(value)});`
				),
				...content,
				'',
				'using var response = await client.SendAsync(request);',
				'Console.WriteLine(await response.Content.ReadAsStringAsync());'
			].join('\n');
		}
	},
	java: {
		label: 'Java',
		language: 'java',
		build(request, body) {
			const publisher = body
				? `HttpRequest.BodyPublishers.ofString(${javaString(bodyText(body))})`
				: 'HttpRequest.BodyPublishers.noBody()';
			return [
				'var client = HttpClient.newHttpClient();',
				'var request = HttpRequest.newBuilder()',
				`    .uri(URI.create(${quote(request.url)}))`,
				...Object.entries(withContentType(request, body)).map(
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
	const body = encodeBody(request);
	return languages.map((id) => {
		const generator = generators[id];
		return {
			id,
			label: generator.label,
			language: generator.language,
			code: generator.build(request, body)
		};
	});
}
