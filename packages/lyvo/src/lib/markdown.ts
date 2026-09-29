import type { DocEntry } from './docs';
import type { LoadedApiSpec } from './openapi/model';
import type { OpenAPIOperation, OpenAPISchemaEntry } from './openapi/types';
import { baseType, objectShape, schemaName, typeLabel } from './openapi/schema';

type Schema = Record<string, any>;

const MAX_DEPTH = 6;

/** MDX body with module syntax dropped, components stay as readable tags. */
export function docToMarkdown(doc: DocEntry): string {
	const body = (doc.body ?? '')
		.split('\n')
		.filter((line: string) => !/^(import|export)\s/.test(line.trim()))
		.join('\n')
		.trim();
	const header = [
		`# ${doc.data.title}`,
		doc.data.description ? `\n> ${doc.data.description}` : ''
	];
	return `${header.join('\n')}\n\n${body}\n`;
}

function inlineCode(value: unknown): string {
	return `\`${typeof value === 'string' ? value : JSON.stringify(value)}\``;
}

function oneLine(text: string | undefined): string {
	return text ? text.replaceAll(/\s*\n\s*/g, ' ').trim() : '';
}

/**
 * Schema as a nested bullet list. Named component schemas are only expanded at
 * the top, elsewhere they're referenced by name to keep output small.
 */
export function schemaToMarkdown(schema: Schema | undefined, depth = 0): string[] {
	if (!schema || depth > MAX_DEPTH) return [];
	const indent = '  '.repeat(depth);
	const lines: string[] = [];

	if (depth > 0 && schemaName(schema)) return lines;

	const { properties, required } = objectShape(schema);
	for (const [name, property] of properties) {
		const details = [typeLabel(property), required.has(name) ? 'required' : ''].filter(Boolean);
		const extra = [
			oneLine(property.description),
			property.enum ? `One of: ${property.enum.map(inlineCode).join(', ')}.` : '',
			property.default !== undefined ? `Default: ${inlineCode(property.default)}.` : ''
		].filter(Boolean);
		lines.push(
			`${indent}- \`${name}\` (${details.join(', ')})${extra.length ? `: ${extra.join(' ')}` : ''}`
		);
		lines.push(...schemaToMarkdown(property, depth + 1));
	}

	if (baseType(schema) === 'array' && schema.items) {
		lines.push(...schemaToMarkdown(schema.items, depth));
	}

	const options = schema.oneOf ?? schema.anyOf;
	if (Array.isArray(options)) {
		lines.push(`${indent}- ${schema.oneOf ? 'One of' : 'Any of'}:`);
		for (const option of options) {
			lines.push(`${indent}  - ${typeLabel(option)}`);
			lines.push(...schemaToMarkdown(option, depth + 2));
		}
	}

	return lines;
}

function jsonBlock(value: unknown): string[] {
	return ['```json', JSON.stringify(value, null, 2), '```'];
}

export function endpointToMarkdown(endpoint: OpenAPIOperation): string {
	const lines: string[] = [`# ${endpoint.title}`, ''];
	lines.push(`\`${endpoint.method.toUpperCase()} ${endpoint.path}\``, '');
	if (endpoint.deprecated) lines.push('**Deprecated.**', '');
	if (endpoint.description ?? endpoint.summary) {
		lines.push((endpoint.description ?? endpoint.summary)!.trim(), '');
	}
	if (endpoint.servers.length > 0) {
		lines.push(`Base URL: ${endpoint.servers.map((server) => server.url).join(', ')}`, '');
	}

	if (endpoint.security.length > 0) {
		lines.push('## Authorization', '');
		for (const item of endpoint.security) {
			const how =
				item.type === 'apiKey'
					? `API key in ${item.in} \`${item.paramName ?? item.name}\``
					: item.type === 'http'
						? `HTTP ${item.scheme}`
						: item.type;
			const scopes = item.scopes.length > 0 ? ` (scopes: ${item.scopes.join(', ')})` : '';
			lines.push(`- ${item.name}: ${how}${scopes}`);
		}
		lines.push('');
	}

	if (endpoint.parameters.length > 0) {
		lines.push('## Parameters', '', '| Name | In | Type | Required | Description |');
		lines.push('| --- | --- | --- | --- | --- |');
		for (const parameter of endpoint.parameters) {
			const cells = [
				`\`${parameter.name}\``,
				parameter.in,
				parameter.type ?? typeLabel(parameter.schema),
				parameter.required ? 'yes' : 'no',
				oneLine(parameter.description).replaceAll('|', '\\|')
			];
			lines.push(`| ${cells.join(' | ')} |`);
		}
		lines.push('');
	}

	const body = endpoint.requestBody;
	const bodyContent =
		body?.content.find((item) => item.mediaType.includes('json')) ?? body?.content[0];
	if (body && bodyContent) {
		lines.push(
			`## Request body (${bodyContent.mediaType}${body.required ? ', required' : ''})`,
			''
		);
		const others = body.content
			.filter((item) => item !== bodyContent)
			.map((item) => item.mediaType);
		if (others.length > 0) lines.push(`Also accepts: ${others.join(', ')}.`, '');
		if (body.description) lines.push(body.description, '');
		lines.push(...schemaToMarkdown(bodyContent.schema as Schema), '');
		if (bodyContent.example !== undefined) {
			lines.push('Example:', '', ...jsonBlock(bodyContent.example), '');
		}
	}

	if (endpoint.responses.length > 0) {
		lines.push('## Responses', '');
		for (const response of endpoint.responses) {
			lines.push(
				`### ${response.status}${response.description ? `: ${oneLine(response.description)}` : ''}`,
				''
			);
			const content =
				response.content.find((item) => item.mediaType.includes('json')) ??
				response.content[0];
			if (!content) continue;
			const name = schemaName(content.schema);
			if (name) lines.push(`Returns \`${name}\`.`, '');
			lines.push(...schemaToMarkdown(content.schema as Schema), '');
			if (content.example !== undefined) lines.push(...jsonBlock(content.example), '');
		}
	}

	const curl = endpoint.snippets.find((snippet) => snippet.id === 'curl');
	if (curl) lines.push('## Example request', '', '```bash', curl.code, '```', '');

	return `${lines.join('\n').trim()}\n`;
}

export function schemaPageToMarkdown(entry: OpenAPISchemaEntry): string {
	const lines = [`# ${entry.name}`, ''];
	if (entry.description) lines.push(entry.description, '');
	lines.push(`Type: \`${baseType(entry.schema)}\``, '');
	lines.push(...schemaToMarkdown(entry.schema as Schema));
	return `${lines.join('\n').trim()}\n`;
}

export function apiOverviewToMarkdown(spec: LoadedApiSpec, href: (slug: string) => string): string {
	const { info, servers, operations, webhooks, schemas } = spec.model;
	const lines = [`# ${info.title}`, '', `Version: ${info.version}`, ''];
	if (info.description) lines.push(info.description.trim(), '');
	if (servers.length > 0) {
		lines.push(
			'## Servers',
			'',
			...servers.map(
				(server) => `- ${server.url}${server.description ? `: ${server.description}` : ''}`
			),
			''
		);
	}

	const list = (items: OpenAPIOperation[]) =>
		items.map(
			(item) =>
				`- [${item.method.toUpperCase()} ${item.path}](${href(item.slug)}.md)${item.summary ? `: ${item.summary}` : ''}`
		);
	if (operations.length > 0) lines.push('## Endpoints', '', ...list(operations), '');
	if (webhooks.length > 0) lines.push('## Webhooks', '', ...list(webhooks), '');
	if (schemas.length > 0) {
		lines.push(
			'## Models',
			'',
			...schemas.map((schema) => `- [${schema.name}](${href(`schemas/${schema.slug}`)}.md)`),
			''
		);
	}
	return `${lines.join('\n').trim()}\n`;
}
