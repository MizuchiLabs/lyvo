// Helpers for reading JSON Schema nodes, shared by the HTML and Markdown views.

type Schema = Record<string, any>;

/** Extension key naming a component schema, kept through dereferencing. */
export const SCHEMA_NAME_KEY = 'x-lyvo-schema';

/** Component name of a schema: tagged by the loader, or a leftover circular $ref. */
export function schemaName(schema: unknown): string | undefined {
	if (!schema || typeof schema !== 'object') return undefined;
	const node = schema as Schema;
	if (typeof node[SCHEMA_NAME_KEY] === 'string') return node[SCHEMA_NAME_KEY];
	if (typeof node.$ref === 'string') return node.$ref.split('/').at(-1) || undefined;
	return undefined;
}

export function baseType(schema: unknown): string {
	if (!schema || typeof schema !== 'object') return 'any';
	const node = schema as Schema;
	if (Array.isArray(node.type) && typeof node.type[0] === 'string') return node.type[0];
	if (typeof node.type === 'string') return node.type;
	if (node.items) return 'array';
	if (node.properties || node.allOf || typeof node.additionalProperties === 'object') {
		return 'object';
	}
	if (node.oneOf || node.anyOf) return 'union';
	if (node.$ref) return 'object';
	return 'any';
}

export function typeLabel(schema: unknown): string {
	if (!schema || typeof schema !== 'object') return 'any';
	const node = schema as Schema;

	const name = schemaName(node);
	if (name) return name;
	if (Array.isArray(node.type)) return node.type.join(' | ');
	if (node.items) return `array<${typeLabel(node.items)}>`;
	if (typeof node.type === 'string') return node.type;
	if (node.properties || node.allOf) return 'object';
	if (typeof node.additionalProperties === 'object') {
		return `Record<string, ${typeLabel(node.additionalProperties)}>`;
	}
	const options = node.oneOf ?? node.anyOf;
	if (Array.isArray(options)) return options.map(typeLabel).join(' | ');
	return 'any';
}

/** Properties of an object schema with allOf parts merged in. */
export function objectShape(schema: Schema): {
	properties: [string, Schema][];
	required: Set<string>;
} {
	const properties = new Map<string, Schema>();
	const required = new Set<string>();

	for (const node of [schema, ...(Array.isArray(schema.allOf) ? schema.allOf : [])]) {
		if (!node || typeof node !== 'object') continue;
		for (const [name, value] of Object.entries(node.properties ?? {})) {
			properties.set(name, value as Schema);
		}
		for (const name of node.required ?? []) {
			if (typeof name === 'string') required.add(name);
		}
	}

	return { properties: [...properties.entries()], required };
}
