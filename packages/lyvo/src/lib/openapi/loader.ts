import path from 'node:path';
import SwaggerParser from '@apidevtools/swagger-parser';
import OpenAPISampler from 'openapi-sampler';
import type { Loader } from 'astro/loaders';
import type { SnippetLanguage } from '../../config';
import { buildSnippets } from './snippets';
import { slugify } from '../utils';
import { SCHEMA_NAME_KEY } from './schema';
import type {
	HttpMethod,
	OpenAPIMediaType,
	OpenAPIModel,
	OpenAPINavigationGroup,
	OpenAPIOperation,
	OpenAPIParameter,
	OpenAPISchemaEntry,
	OpenAPISecurityRequirement,
	OpenAPIServer,
	OpenAPITag
} from './types';

// Spec nodes are dynamic JSON. Everything leaving this file is typed.
type Node = Record<string, any>;

const HTTP_METHODS: HttpMethod[] = [
	'get',
	'post',
	'put',
	'patch',
	'delete',
	'head',
	'options',
	'trace'
];

export function toTitle(value: unknown): string {
	if (!value) return 'Untitled';

	let text = String(value);
	if (text.includes('.') && !text.includes(' ')) {
		const last = text.split('.').at(-1) ?? '';
		if (/^[a-zA-Z][a-zA-Z0-9]*$/.test(last)) text = last;
	}

	const normalized = text
		.replaceAll(/[{}]/g, '')
		.replaceAll(/([a-z0-9])([A-Z])/g, '$1 $2')
		.replaceAll(/[._-]+/g, ' ')
		.replaceAll(/\s+/g, ' ')
		.trim();

	if (!normalized) return 'Untitled';
	return normalized
		.split(' ')
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(' ');
}

export function normalizePathForSlug(value: string) {
	return value
		.replaceAll(/\{([^}]+)\}/g, '$1')
		.replaceAll(/[^a-zA-Z0-9/]+/g, '-')
		.replaceAll(/^\/+|\/+$/g, '')
		.replaceAll(/\/+/g, '/');
}

export function makeSlug(method: string, apiPath: string, operationId?: string) {
	if (operationId?.trim()) return slugify(operationId);
	const pathPart = normalizePathForSlug(apiPath).replaceAll('/', '-');
	return `${method}-${pathPart || 'root'}`;
}

function collectExamples(examples: unknown): unknown[] {
	if (examples === undefined || examples === null) return [];
	if (Array.isArray(examples)) return examples.filter((value) => value !== undefined);
	if (typeof examples !== 'object') return [examples];

	return Object.values(examples)
		.filter((item) => item !== undefined && item !== null)
		.map((item) => (typeof item === 'object' && 'value' in item ? item.value : item));
}

function schemaType(schema: Node | undefined): string | undefined {
	if (typeof schema?.type === 'string') return schema.type;
	if (Array.isArray(schema?.type)) return schema.type.join(' | ') || undefined;
	return undefined;
}

// Circular refs survive dereferencing as {$ref}. Resolve the outermost one so
// the schema itself renders, nested ones stay refs and show up as links.
function resolveRef(schema: Node | undefined, document: Node): Node | undefined {
	let current = schema;
	for (let hops = 0; typeof current?.$ref === 'string' && hops < 10; hops++) {
		const pointer = current.$ref.replace(/^#\//, '').split('/');
		current = pointer.reduce<Node | undefined>(
			(node, key) => node?.[key.replaceAll('~1', '/').replaceAll('~0', '~')],
			document
		);
	}
	return current ?? schema;
}

type Direction = 'request' | 'response';

function sample(schema: Node | undefined, document: Node, direction: Direction): unknown {
	if (!schema) return undefined;
	try {
		const options = direction === 'request' ? { skipReadOnly: true } : { skipWriteOnly: true };
		return OpenAPISampler.sample(schema, options, document);
	} catch {
		return undefined;
	}
}

function pickExample(
	owner: Node | undefined,
	schema: Node | undefined,
	document: Node,
	direction: Direction = 'request'
) {
	const examples = [...collectExamples(owner?.examples), ...collectExamples(schema?.examples)];
	return {
		example:
			owner?.example ?? schema?.example ?? examples[0] ?? sample(schema, document, direction),
		examples: examples.length > 0 ? examples : undefined
	};
}

function mapMediaContent(
	content: Node | undefined,
	document: Node,
	direction: Direction
): OpenAPIMediaType[] {
	if (!content) return [];
	return Object.entries(content).map(([mediaType, entry]) => {
		const schema = resolveRef(entry?.schema, document);
		return { mediaType, schema, ...pickExample(entry, schema, document, direction) };
	});
}

function mapParameters(pathItem: Node, operation: Node, document: Node): OpenAPIParameter[] {
	const seen = new Map<string, Node>();
	// Operation-level parameters override path-level ones with the same name.
	for (const parameter of [...(pathItem.parameters ?? []), ...(operation.parameters ?? [])]) {
		if (parameter) seen.set(`${parameter.in}:${parameter.name}`, parameter);
	}

	return [...seen.values()].map((parameter) => {
		const schema = resolveRef(parameter.schema, document);
		return {
			name: parameter.name,
			in: parameter.in,
			required: Boolean(parameter.required),
			description: parameter.description,
			deprecated: Boolean(parameter.deprecated),
			schema,
			type: schemaType(schema),
			format: typeof schema?.format === 'string' ? schema.format : undefined,
			...pickExample(parameter, schema, document)
		};
	});
}

// Servers may template their URL, e.g. https://{region}.api.example.com.
function mapServer(server: Node): OpenAPIServer {
	const url = String(server.url ?? '').replaceAll(
		/\{([^}]+)\}/g,
		(match, name: string) => server.variables?.[name]?.default ?? match
	);
	return { url, description: server.description };
}

function mapScheme(name: string, scheme: Node | undefined, scopes: string[] = []) {
	if (!scheme?.type) return null;
	return {
		type: scheme.type,
		name,
		description: scheme.description,
		in: scheme.in,
		scheme: scheme.scheme?.toLowerCase(),
		bearerFormat: scheme.bearerFormat,
		flows: scheme.flows,
		openIdConnectUrl: scheme.openIdConnectUrl,
		// apiKey schemes are sent under their own parameter name, not the scheme key.
		paramName: scheme.type === 'apiKey' ? scheme.name : undefined,
		scopes
	} satisfies OpenAPISecurityRequirement;
}

function mapSecurity(requirements: unknown, document: Node): OpenAPISecurityRequirement[] {
	if (!Array.isArray(requirements)) return [];
	const schemes = document.components?.securitySchemes ?? {};
	return requirements
		.flatMap((requirement: Node) =>
			Object.entries(requirement ?? {}).map(([name, scopes]) =>
				mapScheme(name, schemes[name], Array.isArray(scopes) ? scopes : [])
			)
		)
		.filter((item) => item !== null);
}

function exampleHeaders(security: OpenAPISecurityRequirement[]): Record<string, string> {
	const headers: Record<string, string> = {};
	for (const item of security) {
		if (item.type === 'http' && item.scheme === 'bearer')
			headers.Authorization = 'Bearer <token>';
		else if (item.type === 'http' && item.scheme === 'basic') {
			headers.Authorization = 'Basic <base64-credentials>';
		} else if (item.type === 'oauth2' || item.type === 'openIdConnect') {
			headers.Authorization ??= 'Bearer <access-token>';
		} else if (item.type === 'apiKey' && item.in === 'header' && item.paramName) {
			headers[item.paramName] = `<${item.paramName}>`;
		}
	}
	return headers;
}

function exampleUrl(baseUrl: string, apiPath: string, parameters: OpenAPIParameter[]): string {
	const query = parameters
		.filter((parameter) => parameter.in === 'query' && parameter.required)
		.map((parameter) => `${encodeURIComponent(parameter.name)}=<${parameter.name}>`)
		.join('&');
	const url = `${baseUrl.replace(/\/$/, '')}${apiPath}`;
	return query ? `${url}?${query}` : url;
}

interface OperationContext {
	document: Node;
	apiPath: string;
	method: HttpMethod;
	pathItem: Node;
	operation: Node;
	servers: OpenAPIServer[];
	snippets: SnippetLanguage[];
}

function mapOperation(ctx: OperationContext): OpenAPIOperation {
	const { document, apiPath, method, pathItem, operation } = ctx;

	const parameters = mapParameters(pathItem, operation, document);
	const requestBody = operation.requestBody
		? {
				required: Boolean(operation.requestBody.required),
				description: operation.requestBody.description,
				content: mapMediaContent(operation.requestBody.content, document, 'request')
			}
		: undefined;
	const responses = Object.entries(operation.responses ?? {}).map(([status, response]) => ({
		status,
		description: (response as Node)?.description,
		content: mapMediaContent((response as Node)?.content, document, 'response')
	}));
	const security = mapSecurity(operation.security ?? document.security, document);
	const servers: OpenAPIServer[] =
		(operation.servers ?? pathItem.servers)
			? (operation.servers ?? pathItem.servers).map(mapServer)
			: ctx.servers;

	const body =
		requestBody?.content.find((item) => item.mediaType.includes('json'))?.example ??
		requestBody?.content[0]?.example;

	return {
		id: `${method.toUpperCase()} ${apiPath}`,
		slug: makeSlug(method, apiPath, operation.operationId),
		method,
		path: apiPath,
		title: operation.summary ?? operation.operationId ?? `${method.toUpperCase()} ${apiPath}`,
		summary: operation.summary,
		description: operation.description,
		deprecated: Boolean(operation.deprecated),
		tags:
			Array.isArray(operation.tags) && operation.tags.length > 0
				? operation.tags
				: ['General'],
		servers,
		parameters,
		requestBody,
		responses,
		security,
		snippets: buildSnippets(
			{
				method,
				url: exampleUrl(servers[0]?.url ?? 'https://api.example.com', apiPath, parameters),
				headers: exampleHeaders(security),
				body
			},
			ctx.snippets
		),
		operationId: operation.operationId,
		externalDocsUrl: operation.externalDocs?.url
	};
}

function sortOperations(a: OpenAPIOperation, b: OpenAPIOperation) {
	return (
		HTTP_METHODS.indexOf(a.method) - HTTP_METHODS.indexOf(b.method) ||
		a.path.localeCompare(b.path)
	);
}

function buildNavigation(
	operations: OpenAPIOperation[],
	webhooks: OpenAPIOperation[],
	groupBy: 'tag' | 'path'
): OpenAPINavigationGroup[] {
	const groups = new Map<string, OpenAPIOperation[]>();
	const add = (key: string, operation: OpenAPIOperation) =>
		groups.set(key, [...(groups.get(key) ?? []), operation]);

	for (const operation of operations) {
		if (groupBy === 'path')
			add(operation.path.split('/').filter(Boolean)[0] ?? 'General', operation);
		else for (const tag of operation.tags) add(tag, operation);
	}
	for (const webhook of webhooks) add('Webhooks', webhook);

	return [...groups.entries()]
		.sort(([a], [b]) => (a === 'Webhooks' ? 1 : b === 'Webhooks' ? -1 : a.localeCompare(b)))
		.map(([title, items]) => ({
			id: slugify(title),
			title: toTitle(title),
			items: items.sort(sortOperations).map((operation) => ({
				id: operation.id,
				slug: operation.slug,
				label: operation.summary ?? operation.title,
				method: operation.method,
				path: operation.path,
				deprecated: operation.deprecated,
				isWebhook: operation.event !== undefined
			}))
		}));
}

function buildTags(document: Node, operations: OpenAPIOperation[]): OpenAPITag[] {
	const tags = new Map<string, OpenAPITag>();
	for (const tag of document.tags ?? []) {
		tags.set(tag.name, { name: tag.name, description: tag.description, operationCount: 0 });
	}
	for (const operation of operations) {
		for (const name of operation.tags) {
			const tag = tags.get(name) ?? { name, operationCount: 0 };
			tag.operationCount += 1;
			tags.set(name, tag);
		}
	}
	return [...tags.values()].sort((a, b) => a.name.localeCompare(b.name));
}

// Dereferencing shares one object per component schema, so tagging it here
// labels every place the schema is used.
function nameSchemas(document: Node): OpenAPISchemaEntry[] {
	const schemas = document.components?.schemas ?? {};
	return Object.entries(schemas)
		.filter(([, schema]) => schema && typeof schema === 'object')
		.map(([name, schema]) => {
			(schema as Node)[SCHEMA_NAME_KEY] = name;
			return {
				name,
				slug: slugify(name),
				description: (schema as Node).description,
				schema: schema as Record<string, unknown>,
				example: sample(schema as Node, document, 'response')
			};
		})
		.sort((a, b) => a.name.localeCompare(b.name));
}

export interface OpenAPILoaderSpec {
	id: string;
	input: string;
	groupBy: 'tag' | 'path';
	snippets: SnippetLanguage[];
}

export async function loadSpec(spec: OpenAPILoaderSpec): Promise<OpenAPIModel> {
	const inputPath = path.resolve(spec.input);
	let document: Node;
	try {
		document = (await SwaggerParser.validate(inputPath, {
			dereference: { circular: 'ignore' }
		})) as Node;
	} catch (error) {
		const reason = error instanceof Error ? error.message : String(error);
		throw new Error(`[lyvo] OpenAPI spec "${spec.input}" failed to load: ${reason}`);
	}

	const schemas = nameSchemas(document);
	const servers: OpenAPIServer[] = (document.servers ?? []).map(mapServer);

	const collect = (paths: Node | undefined, isWebhook: boolean) => {
		const operations: OpenAPIOperation[] = [];
		for (const [key, pathItem] of Object.entries(paths ?? {})) {
			for (const method of HTTP_METHODS) {
				const operation = pathItem?.[method];
				if (!operation) continue;
				const mapped = mapOperation({
					document,
					apiPath: isWebhook ? `/${key}` : key,
					method,
					pathItem,
					operation,
					servers,
					snippets: isWebhook ? [] : spec.snippets
				});
				if (isWebhook) {
					mapped.event = key;
					mapped.title = operation.summary ?? operation.operationId ?? toTitle(key);
				}
				operations.push(mapped);
			}
		}
		return operations.sort(sortOperations);
	};

	const operations = collect(document.paths, false);
	const webhooks = collect(document.webhooks, true);

	return {
		source: path.relative(process.cwd(), inputPath),
		openapi: document.openapi,
		info: {
			title: document.info?.title ?? 'API',
			version: document.info?.version ?? '0.0.0',
			description: document.info?.description,
			contact: document.info?.contact,
			license: document.info?.license,
			termsOfService: document.info?.termsOfService
		},
		servers,
		securitySchemes: Object.entries(document.components?.securitySchemes ?? {})
			.map(([name, scheme]) => mapScheme(name, scheme as Node))
			.filter((item) => item !== null),
		externalDocs: document.externalDocs
			? { description: document.externalDocs.description, url: document.externalDocs.url }
			: undefined,
		tags: buildTags(document, operations),
		navigation: buildNavigation(operations, webhooks, spec.groupBy),
		operations,
		webhooks,
		schemas
	};
}

export function openapiLoader(options: { specs: OpenAPILoaderSpec[] }): Loader {
	return {
		name: 'openapi-loader',
		load: async ({ store, logger }) => {
			store.clear();
			for (const spec of options.specs) {
				const model = await loadSpec(spec);
				store.set({
					id: `openapi:${spec.id}`,
					data: model as unknown as Record<string, unknown>
				});
				logger.info(
					`Loaded "${spec.input}": ${model.operations.length} operations, ${model.webhooks.length} webhooks, ${model.schemas.length} schemas.`
				);
			}
		}
	};
}
