import { describe, expect, it } from 'vitest';
import { mdxToMarkdown } from '../src/lib/mdx-markdown';

describe('mdxToMarkdown', () => {
	it('drops module syntax but keeps it inside code fences', () => {
		const out = mdxToMarkdown(
			[
				"import Thing from './Thing.astro';",
				'',
				'Hello',
				'',
				'```js',
				"import { a } from 'a';",
				'export default a;',
				'```'
			].join('\n')
		);
		expect(out).not.toContain('Thing');
		expect(out).toContain("import { a } from 'a';\nexport default a;");
	});

	it('turns a callout into a labelled blockquote', () => {
		const out = mdxToMarkdown(
			'<Callout type="warning" title="Careful">\n\tHot `stuff`.\n</Callout>'
		);
		expect(out).toBe('> **Warning: Careful**\n>\n> Hot `stuff`.');
	});

	it('turns steps into an ordered list', () => {
		const out = mdxToMarkdown(
			[
				'<Steps>',
				'  <Step title="Install">',
				'',
				'```bash',
				'pnpm add x',
				'```',
				'',
				'  </Step>',
				'  <Step title="Run">Start it.</Step>',
				'</Steps>'
			].join('\n')
		);
		expect(out).toBe(
			'1. **Install**\n\n   ```bash\n   pnpm add x\n   ```\n\n2. **Run**\n\n   Start it.'
		);
	});

	it('labels tabs and expands Code', () => {
		const out = mdxToMarkdown(
			[
				'<Tabs>',
				'\t<TabItem value="pnpm">',
				'\t\t<Code code="pnpm add x" lang="bash" />',
				'\t</TabItem>',
				'\t<TabItem value="npm" label="NPM">',
				'\t\t<Code code={`npm install x`} lang="bash" />',
				'\t</TabItem>',
				'</Tabs>'
			].join('\n')
		);
		expect(out).toBe(
			'**pnpm**\n\n```bash\npnpm add x\n```\n\n**NPM**\n\n```bash\nnpm install x\n```'
		);
	});

	it('draws a file tree', () => {
		const out = mdxToMarkdown(
			[
				'<FileTree>',
				'\t<Folder name="src" defaultOpen>',
				'\t\t<File name="index.astro" />',
				'\t</Folder>',
				'\t<File name="package.json" />',
				'</FileTree>'
			].join('\n')
		);
		expect(out).toBe('```\nsrc/\n  index.astro\npackage.json\n```');
	});

	it('lists accordion items', () => {
		const out = mdxToMarkdown("<Accordion items={[{ title: 'Why?', content: 'Because.' }]} />");
		expect(out).toBe('**Why?**\n\nBecause.');
	});

	it('unwraps unknown components and keeps html', () => {
		const out = mdxToMarkdown('<Fancy>\n\nSome *text*{curly} with a <kbd>K</kbd>.\n\n</Fancy>');
		expect(out).toBe('Some *text* with a <kbd>K</kbd>.');
	});
});
