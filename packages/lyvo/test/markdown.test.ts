import { describe, expect, it } from 'vitest';
import { schemaToMarkdown } from '../src/lib/markdown';

describe('schemaToMarkdown', () => {
	const tag = { 'x-lyvo-schema': 'Tag', type: 'object', properties: { id: { type: 'string' } } };
	const schema = {
		type: 'object',
		required: ['name'],
		properties: {
			name: { type: 'string', description: 'Display\nname' },
			kind: { type: 'string', enum: ['a', 'b'] },
			tags: { type: 'array', items: tag },
			meta: { type: 'object', properties: { size: { type: 'integer' } } }
		}
	};

	it('lists properties with type and required flag', () => {
		const lines = schemaToMarkdown(schema);
		expect(lines[0]).toBe('- `name` (string, required): Display name');
		expect(lines).toContain('- `kind` (string): One of: `a`, `b`.');
	});

	it('references named schemas instead of expanding them', () => {
		const lines = schemaToMarkdown(schema);
		expect(lines).toContain('- `tags` (array<Tag>)');
		expect(lines.some((line) => line.includes('`id`'))).toBe(false);
	});

	it('nests inline objects', () => {
		expect(schemaToMarkdown(schema)).toContain('  - `size` (integer)');
	});
});
