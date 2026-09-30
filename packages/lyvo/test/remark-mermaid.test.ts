import { describe, expect, it } from 'vitest';
import remarkMermaid from '../src/lib/remark-mermaid';

describe('remarkMermaid', () => {
	it('turns mermaid fences into a placeholder with the source', () => {
		const code = { type: 'code', lang: 'mermaid', value: 'graph TD\n  A --> B' };
		remarkMermaid()({ type: 'root', children: [code] });
		expect(code).toMatchObject({
			type: 'mermaid',
			data: {
				hName: 'div',
				hProperties: { className: ['lyvo-mermaid', 'not-prose'], dataState: 'loading' },
				hChildren: [{ tagName: 'pre', children: [{ value: 'graph TD\n  A --> B' }] }]
			}
		});
	});

	it('leaves other code blocks alone', () => {
		const code = { type: 'code', lang: 'ts', value: 'const a = 1;' };
		remarkMermaid()({ type: 'root', children: [code] });
		expect(code).not.toHaveProperty('data');
	});
});
