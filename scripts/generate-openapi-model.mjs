import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import SwaggerParser from '@apidevtools/swagger-parser';
import OpenAPISampler from 'openapi-sampler';

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'trace'];
const DEFAULT_CONFIG_PATH = 'src/content/api/openapi.config.json';

function loadConfig(configPath = DEFAULT_CONFIG_PATH) {
	const resolvedPath = path.resolve(configPath);
	if (!fsSync.existsSync(resolvedPath)) return {};

	const content = fsSync.readFileSync(resolvedPath, 'utf-8');
	const parsed = JSON.parse(content);

	if (!parsed || typeof parsed !== 'object') return {};

	const config = {};
	if (typeof parsed.input === 'string') config.input = parsed.input;
	if (typeof parsed.output === 'string') config.output = parsed.output;
	if (parsed.groupBy === 'tag' || parsed.groupBy === 'path') config.groupBy = parsed.groupBy;

	return config;
}

function parseArgs(argv, config = {}) {
	const options = {
		input: config.input ?? 'public/openapi.json',
		output: config.output ?? 'src/content/api/openapi-model.json',
		groupBy: config.groupBy ?? 'tag'
	};

	for (let i = 0; i < argv.length; i++) {
		const arg = argv[i];
		if (arg === '--input') {
			options.input = argv[i + 1] ?? options.input;
			i++;
			continue;
		}

		if (arg === '--output') {
			options.output = argv[i + 1] ?? options.output;
			i++;
			continue;
		}

		if (arg === '--group-by') {
			const value = argv[i + 1];
			if (value === 'tag' || value === 'path') {
				options.groupBy = value;
			}
			i++;
		}
	}

	return options;
}

function toTitle(value) {
	if (!value) return 'Untitled';
	const normalized = value
		.replaceAll(/[{}]/g, '')
		.replaceAll(/[._-]+/g, ' ')
		.replaceAll(/\s+/g, ' ')
		.trim();

	if (!normalized) return 'Untitled';

	return normalized
		.split(' ')
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(' ');
}

function normalizePathForSlug(value) {
	return value
		.replaceAll(/\{([^}]+)\}/g, '$1')
		.replaceAll(/[^a-zA-Z0-9/]+/g, '-')
		.replaceAll(/^\/+|\/+$/g, '')
		.replaceAll(/\/+/g, '/');
}

function makeSlug(method, apiPath, operationId) {
	if (operationId && operationId.trim().length > 0) {
		return operationId
			.trim()
			.toLowerCase()
			.replaceAll(/[^a-z0-9]+/g, '-')
			.replaceAll(/^-+|-+$/g, '');
	}

	const pathPart = normalizePathForSlug(apiPath).replaceAll('/', '-');
	return `${method}-${pathPart || 'root'}`;
}

function resolveRef(ref, document) {
	if (typeof ref !== 'string' || !ref.startsWith('#/')) return undefined;

	const parts = ref
		.slice(2)
		.split('/')
		.map((segment) => segment.replaceAll('~1', '/').replaceAll('~0', '~'));

	let current = document;
	for (const key of parts) {
		if (!current || typeof current !== 'object' || !(key in current)) {
			return undefined;
		}

		current = current[key];
	}

	return current;
}

function deepResolve(value, document, stack = new Set()) {
	if (Array.isArray(value)) {
		return value.map((item) => deepResolve(item, document, stack));
	}

	if (!value || typeof value !== 'object') {
		return value;
	}

	if (typeof value.$ref === 'string') {
		if (stack.has(value.$ref)) {
			return { $ref: value.$ref };
		}

		const resolved = resolveRef(value.$ref, document);
		if (!resolved) return value;

		const nextStack = new Set(stack);
		nextStack.add(value.$ref);

		const merged = {
			...resolved,
			...Object.fromEntries(Object.entries(value).filter(([k]) => k !== '$ref'))
		};

		return deepResolve(merged, document, nextStack);
	}

	return value;
}

function pickExampleFromExamples(examples) {
	if (!examples || typeof examples !== 'object') return undefined;
	for (const value of Object.values(examples)) {
		if (!value || typeof value !== 'object') continue;
		if ('value' in value) return value.value;
	}

	return undefined;
}

function sampleSchema(schema, document) {
	if (!schema) return undefined;

	try {
		return OpenAPISampler.sample(schema, document, {
			skipNonRequired: false,
			xml: false
		});
	} catch {
		return undefined;
	}
}

function mapMediaContent(content, document) {
	if (!content || typeof content !== 'object') return [];

	return Object.entries(content).map(([mediaType, mediaEntry]) => {
		const resolved = deepResolve(mediaEntry, document);
		const schema = resolved?.schema;

		return {
			mediaType,
			schema,
			example:
				resolved?.example ??
				pickExampleFromExamples(resolved?.examples) ??
				sampleSchema(schema, document)
		};
	});
}

function mergeParameters(pathParameters, operationParameters) {
	const merged = [];
	const keys = new Set();

	for (const source of [pathParameters ?? [], operationParameters ?? []]) {
		for (const parameter of source) {
			const key = `${parameter?.in ?? ''}:${parameter?.name ?? ''}`;
			if (keys.has(key)) continue;
			keys.add(key);
			merged.push(parameter);
		}
	}

	return merged;
}

function mapSecurity(operationSecurity, rootSecurity, components, document) {
	const requirements = operationSecurity ?? rootSecurity ?? [];
	if (!Array.isArray(requirements)) return [];

	return requirements
		.flatMap((requirement) => {
			if (!requirement || typeof requirement !== 'object') return [];

			return Object.entries(requirement).map(([schemeName, scopes]) => {
				const raw = components?.securitySchemes?.[schemeName];
				const scheme = deepResolve(raw, document);

				return {
					type: scheme?.type ?? 'unknown',
					name: schemeName,
					description: scheme?.description,
					in: scheme?.in,
					scheme: scheme?.scheme,
					bearerFormat: scheme?.bearerFormat,
					flows: scheme?.flows,
					openIdConnectUrl: scheme?.openIdConnectUrl,
					scopes: Array.isArray(scopes) ? scopes : []
				};
			});
		})
		.filter((item) => item.type !== 'unknown');
}

function headerLine(headers) {
	if (Object.keys(headers).length === 0) return '';

	return Object.entries(headers)
		.map(([key, value]) => `  -H "${key}: ${value}"`)
		.join(' \\\n');
}

function buildUrl(baseUrl, apiPath, queryParameters) {
	const query = queryParameters
		.map(
			(parameter) =>
				`${encodeURIComponent(parameter.name)}=${encodeURIComponent(`<${parameter.name}>`)}`
		)
		.join('&');

	const normalizedBase = (baseUrl || 'https://api.example.com').replace(/\/$/, '');
	const url = `${normalizedBase}${apiPath}`;
	if (query.length === 0) return url;
	return `${url}?${query}`;
}

function toJsonBlock(value) {
	if (value === undefined) return undefined;
	return JSON.stringify(value, null, 2);
}

function buildSnippets({ method, url, headers, bodyExample }) {
	const methodUpper = method.toUpperCase();
	const headerString = headerLine(headers);
	const jsonBody = toJsonBlock(bodyExample);

	const curlLines = [`curl -X ${methodUpper} '${url}'`];
	if (headerString) curlLines.push(headerString);
	if (jsonBody) {
		curlLines.push("  -H 'Content-Type: application/json'");
		curlLines.push(`  -d '${jsonBody.replaceAll("'", "'\\''")}'`);
	}

	const jsHeaders = Object.keys(headers).length > 0 ? { ...headers } : {};
	if (jsonBody) jsHeaders['Content-Type'] = 'application/json';

	const jsSnippet = [
		`const response = await fetch('${url}', {`,
		`  method: '${methodUpper}',`,
		`  headers: ${JSON.stringify(jsHeaders, null, 2)},`,
		...(jsonBody ? [`  body: JSON.stringify(${jsonBody}),`] : []),
		'});',
		'',
		'const data = await response.json();',
		'console.log(data);'
	].join('\n');

	const pythonHeaders = Object.keys(headers).length > 0 ? { ...headers } : {};
	if (jsonBody) pythonHeaders['Content-Type'] = 'application/json';

	const pythonSnippet = [
		'import requests',
		'',
		`url = '${url}'`,
		`headers = ${JSON.stringify(pythonHeaders, null, 2)}`,
		...(jsonBody ? [`payload = ${jsonBody}`] : []),
		'',
		`response = requests.${method}(url, headers=headers${jsonBody ? ', json=payload' : ''})`,
		'print(response.json())'
	].join('\n');

	const goSnippet = [
		'package main',
		'',
		'import (',
		'  "bytes"',
		'  "fmt"',
		'  "io"',
		'  "net/http"',
		')',
		'',
		'func main() {',
		...(jsonBody
			? [`  body := bytes.NewBuffer([]byte(${JSON.stringify(jsonBody)}))`]
			: ['  var body io.Reader = nil']),
		`  req, err := http.NewRequest("${methodUpper}", "${url}", body)`,
		'  if err != nil { panic(err) }',
		...Object.entries(headers).map(([key, value]) => `  req.Header.Set("${key}", "${value}")`),
		...(jsonBody ? ['  req.Header.Set("Content-Type", "application/json")'] : []),
		'',
		'  res, err := http.DefaultClient.Do(req)',
		'  if err != nil { panic(err) }',
		'  defer res.Body.Close()',
		'',
		'  payload, err := io.ReadAll(res.Body)',
		'  if err != nil { panic(err) }',
		'  fmt.Println(string(payload))',
		'}'
	].join('\n');

	const csharpMethod =
		methodUpper === 'PATCH'
			? 'Patch'
			: methodUpper.charAt(0) + methodUpper.slice(1).toLowerCase();
	const csharpSnippet = [
		'using System.Net.Http;',
		'using System.Net.Http.Headers;',
		'',
		'using var client = new HttpClient();',
		`using var request = new HttpRequestMessage(HttpMethod.${csharpMethod}, "${url}");`,
		...Object.entries(headers).map(([k, v]) => `request.Headers.Add("${k}", "${v}");`),
		...(jsonBody
			? [
					`request.Content = new StringContent(`,
					`    ${JSON.stringify(jsonBody)},`,
					`    System.Text.Encoding.UTF8,`,
					`    "application/json"`,
					`);`
				]
			: []),
		'',
		'using var response = await client.SendAsync(request);',
		'response.EnsureSuccessStatusCode();',
		'Console.WriteLine(await response.Content.ReadAsStringAsync());'
	].join('\n');

	const javaSnippet = [
		'import java.net.URI;',
		'import java.net.http.HttpClient;',
		'import java.net.http.HttpRequest;',
		'import java.net.http.HttpResponse;',
		'',
		'public class Main {',
		'  public static void main(String[] args) throws Exception {',
		'    HttpClient client = HttpClient.newHttpClient();',
		'    HttpRequest request = HttpRequest.newBuilder()',
		`      .uri(URI.create("${url}"))`,
		...Object.entries(headers).map(([k, v]) => `      .header("${k}", "${v}")`),
		...(jsonBody ? ['      .header("Content-Type", "application/json")'] : []),
		`      .method("${methodUpper}", ${jsonBody ? `HttpRequest.BodyPublishers.ofString(${JSON.stringify(jsonBody)})` : 'HttpRequest.BodyPublishers.noBody()'})`,
		'      .build();',
		'',
		'    HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());',
		'    System.out.println(response.body());',
		'  }',
		'}'
	].join('\n');

	return [
		{ id: 'curl', label: 'cURL', language: 'bash', code: curlLines.join(' \\\n') },
		{ id: 'javascript', label: 'JavaScript', language: 'javascript', code: jsSnippet },
		{ id: 'python', label: 'Python', language: 'python', code: pythonSnippet },
		{ id: 'go', label: 'Go', language: 'go', code: goSnippet },
		{ id: 'csharp', label: 'C#', language: 'csharp', code: csharpSnippet },
		{ id: 'java', label: 'Java', language: 'java', code: javaSnippet }
	];
}

function defaultHeadersFromSecurity(security) {
	const headers = {};

	for (const item of security) {
		if (item.type === 'http' && item.scheme === 'bearer') {
			headers.Authorization = 'Bearer <token>';
			continue;
		}

		if (item.type === 'http' && item.scheme === 'basic') {
			headers.Authorization = 'Basic <base64-credentials>';
			continue;
		}

		if (item.type === 'apiKey' && item.in === 'header') {
			headers[item.name] = `<${item.name}>`;
		}
	}

	return headers;
}

function mapOperation({
	document,
	apiPath,
	method,
	pathItem,
	operation,
	defaultServers,
	rootSecurity
}) {
	const slug = makeSlug(method, apiPath, operation.operationId);
	const id = `${method.toUpperCase()} ${apiPath}`;

	const mergedParameters = mergeParameters(pathItem.parameters, operation.parameters)
		.map((parameter) => deepResolve(parameter, document))
		.filter(Boolean);

	const mappedParameters = mergedParameters.map((parameter) => {
		const schema = parameter.schema;
		const example =
			parameter.example ??
			pickExampleFromExamples(parameter.examples) ??
			parameter.schema?.example ??
			sampleSchema(schema, document);

		return {
			name: parameter.name,
			in: parameter.in,
			required: Boolean(parameter.required),
			description: parameter.description,
			deprecated: Boolean(parameter.deprecated),
			schema,
			example
		};
	});

	const requestBodyResolved = operation.requestBody
		? deepResolve(operation.requestBody, document)
		: undefined;

	const requestBody = requestBodyResolved
		? {
				required: Boolean(requestBodyResolved.required),
				description: requestBodyResolved.description,
				content: mapMediaContent(requestBodyResolved.content, document)
			}
		: undefined;

	const responses = Object.entries(operation.responses ?? {}).map(([status, response]) => {
		const resolved = deepResolve(response, document);
		return {
			status,
			description: resolved?.description,
			content: mapMediaContent(resolved?.content, document)
		};
	});

	const security = mapSecurity(operation.security, rootSecurity, document.components, document);

	const servers = (operation.servers ?? pathItem.servers ?? defaultServers ?? []).map(
		(server) => ({
			url: server.url,
			description: server.description
		})
	);

	const primaryServer = servers[0]?.url ?? defaultServers?.[0]?.url ?? 'https://api.example.com';
	const queryParameters = mappedParameters.filter((parameter) => parameter.in === 'query');
	const snippetUrl = buildUrl(primaryServer, apiPath, queryParameters);
	const bodyExample =
		requestBody?.content.find((item) => item.mediaType === 'application/json')?.example ??
		requestBody?.content[0]?.example;
	const securityHeaders = defaultHeadersFromSecurity(security);

	const snippets = buildSnippets({
		method,
		url: snippetUrl,
		headers: securityHeaders,
		bodyExample
	});

	const fallbackTitle = `${method.toUpperCase()} ${apiPath}`;

	return {
		id,
		slug,
		method,
		path: apiPath,
		title: operation.summary ?? operation.operationId ?? fallbackTitle,
		summary: operation.summary,
		description: operation.description,
		deprecated: Boolean(operation.deprecated),
		tags: Array.isArray(operation.tags) ? operation.tags : ['General'],
		servers,
		parameters: mappedParameters,
		requestBody,
		responses,
		security,
		snippets,
		raw: {
			operationId: operation.operationId,
			externalDocsUrl: operation.externalDocs?.url
		}
	};
}

function mapWebhooks(document, defaultServers, rootSecurity) {
	if (!document.webhooks || typeof document.webhooks !== 'object') return [];

	const output = [];
	for (const [event, webhookPath] of Object.entries(document.webhooks)) {
		const resolvedPath = deepResolve(webhookPath, document);

		for (const method of HTTP_METHODS) {
			if (!resolvedPath?.[method]) continue;

			const operation = resolvedPath[method];
			const mapped = mapOperation({
				document,
				apiPath: `/${event}`,
				method,
				pathItem: resolvedPath,
				operation,
				defaultServers,
				rootSecurity
			});

			output.push({
				id: mapped.id,
				slug: mapped.slug,
				event,
				method,
				path: mapped.path,
				title: mapped.title,
				summary: mapped.summary,
				description: mapped.description,
				deprecated: mapped.deprecated,
				tags: mapped.tags.length > 0 ? mapped.tags : ['Webhooks'],
				servers: mapped.servers,
				parameters: mapped.parameters,
				requestBody: mapped.requestBody,
				responses: mapped.responses,
				security: mapped.security,
				snippets: mapped.snippets
			});
		}
	}

	return output;
}

function buildNavigation(operations, webhooks, groupBy) {
	const groups = new Map();
	const allItems = [...operations, ...webhooks.map((w) => ({ ...w, isWebhook: true }))];

	for (const operation of allItems) {
		const keys =
			groupBy === 'path'
				? [operation.path.split('/').filter(Boolean)[0] ?? 'General']
				: operation.tags.length > 0
					? operation.tags
					: ['General'];

		for (const key of keys) {
			if (!groups.has(key)) groups.set(key, []);
			groups.get(key).push({
				id: operation.id,
				slug: operation.slug,
				label: operation.summary ?? operation.title,
				method: operation.method,
				path: operation.path,
				deprecated: operation.deprecated,
				isWebhook: operation.isWebhook
			});
		}
	}

	return Array.from(groups.entries())
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([title, items]) => ({
			id: title
				.toLowerCase()
				.replaceAll(/[^a-z0-9]+/g, '-')
				.replaceAll(/^-+|-+$/g, ''),
			title: toTitle(title),
			items: items.sort((a, b) => {
				if (a.path === b.path) return a.method.localeCompare(b.method);
				return a.path.localeCompare(b.path);
			})
		}));
}

function buildTags(document, operations) {
	const tagMap = new Map();

	for (const tag of document.tags ?? []) {
		tagMap.set(tag.name, {
			name: tag.name,
			description: tag.description,
			operationCount: 0
		});
	}

	for (const operation of operations) {
		for (const tag of operation.tags) {
			if (!tagMap.has(tag)) {
				tagMap.set(tag, {
					name: tag,
					description: undefined,
					operationCount: 0
				});
			}

			tagMap.get(tag).operationCount += 1;
		}
	}

	return Array.from(tagMap.values()).sort((a, b) => a.name.localeCompare(b.name));
}

async function generate() {
	const config = loadConfig();
	const options = parseArgs(process.argv.slice(2), config);
	const inputPath = path.resolve(options.input);
	const outputPath = path.resolve(options.output);

	const document = await SwaggerParser.validate(inputPath, {
		validate: {
			schema: true,
			spec: true
		}
	});

	const defaultServers = Array.isArray(document.servers)
		? document.servers.map((server) => ({ url: server.url, description: server.description }))
		: [];

	const rootSecurity = Array.isArray(document.security) ? document.security : [];

	const operations = [];
	for (const [apiPath, rawPathItem] of Object.entries(document.paths ?? {})) {
		const pathItem = deepResolve(rawPathItem, document);
		for (const method of HTTP_METHODS) {
			const operation = pathItem?.[method];
			if (!operation) continue;

			operations.push(
				mapOperation({
					document,
					apiPath,
					method,
					pathItem,
					operation,
					defaultServers,
					rootSecurity
				})
			);
		}
	}

	operations.sort((a, b) => {
		if (a.path === b.path) return a.method.localeCompare(b.method);
		return a.path.localeCompare(b.path);
	});

	const webhooks = mapWebhooks(document, defaultServers, rootSecurity);

	const model = {
		generatedAt: new Date().toISOString(),
		source: path.relative(process.cwd(), inputPath),
		info: {
			title: document.info?.title ?? 'API',
			version: document.info?.version ?? '0.0.0',
			description: document.info?.description
		},
		servers: defaultServers,
		tags: buildTags(document, operations),
		navigation: buildNavigation(operations, webhooks, options.groupBy),
		operations,
		webhooks
	};

	await fs.mkdir(path.dirname(outputPath), { recursive: true });
	await fs.writeFile(outputPath, JSON.stringify(model, null, 2));

	console.log(`OpenAPI source: ${path.relative(process.cwd(), inputPath)}`);
	console.log(`OpenAPI model generated: ${path.relative(process.cwd(), outputPath)}`);
	console.log(`Operations: ${operations.length}`);
	console.log(`Webhooks: ${model.webhooks.length}`);
}

generate().catch((error) => {
	console.error('Failed to generate OpenAPI model');
	console.error(error);
	process.exit(1);
});
