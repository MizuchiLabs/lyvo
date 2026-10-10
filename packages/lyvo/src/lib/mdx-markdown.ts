import fs from 'node:fs';
import path from 'node:path';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkMdx from 'remark-mdx';
import remarkStringify from 'remark-stringify';

type Node = { type: string; [key: string]: any };

const parser = unified().use(remarkParse).use(remarkGfm).use(remarkMdx);
// No remark-mdx here, it would escape every `{` and `<` in plain text.
const printer = unified().use(remarkGfm).use(remarkStringify, { bullet: '-', rule: '-' });

function isJsx(node: Node): boolean {
	return node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement';
}

function isComponent(node: Node): boolean {
	return isJsx(node) && /^[A-Z]/.test(node.name ?? '');
}

/** Static value of an expression, undefined when it needs evaluating. */
function literal(node: Node | undefined): unknown {
	switch (node?.type) {
		case 'Literal':
			return node.value;
		case 'TemplateLiteral':
			return node.expressions.length === 0 ? node.quasis[0].value.cooked : undefined;
		case 'ArrayExpression':
			return node.elements.map(literal);
		case 'ObjectExpression':
			return Object.fromEntries(
				node.properties
					.filter((property: Node) => property.type === 'Property')
					.map((property: Node) => [
						property.key.name ?? property.key.value,
						literal(property.value)
					])
			);
	}
	return undefined;
}

function expression(node: Node): unknown {
	return literal(node.data?.estree?.body[0]?.expression);
}

function attr(node: Node, name: string): unknown {
	const found = node.attributes.find(
		(attribute: Node) => attribute.type === 'mdxJsxAttribute' && attribute.name === name
	);
	if (!found) return undefined;
	if (found.value === null || found.value === undefined) return true;
	return typeof found.value === 'string' ? found.value : expression(found.value);
}

function text(node: Node, name: string): string {
	const value = attr(node, name);
	return typeof value === 'string' ? value : '';
}

function heading(label: string): Node[] {
	if (!label) return [];
	return [
		{
			type: 'paragraph',
			children: [{ type: 'strong', children: [{ type: 'text', value: label }] }]
		}
	];
}

// MDX parses `<Step>text</Step>` on one line as inline JSX inside a paragraph.
// Lift those to block level so they convert the same as the multi-line form.
function unravel(node: Node): Node[] {
	if (node.type === 'paragraph') {
		const kids = node.children.filter(
			(child: Node) => !(child.type === 'text' && !child.value.trim())
		);
		if (kids.length > 0 && kids.every(isComponent)) {
			return kids.flatMap((child: Node) =>
				unravel({
					...child,
					type: 'mdxJsxFlowElement',
					children:
						child.children.length > 0
							? [{ type: 'paragraph', children: child.children }]
							: []
				})
			);
		}
	}
	if (node.children) node.children = node.children.flatMap(unravel);
	return [node];
}

function treeLines(nodes: Node[], depth = 0): string[] {
	return nodes.filter(isJsx).flatMap((node) => {
		const name = `${'  '.repeat(depth)}${text(node, 'name')}`;
		return node.name === 'Folder'
			? [`${name}/`, ...treeLines(node.children, depth + 1)]
			: [name];
	});
}

function changelog(url: string): Node[] {
	if (/^https?:\/\//.test(url)) {
		const link = { type: 'link', url, children: [{ type: 'text', value: 'Changelog' }] };
		return [{ type: 'paragraph', children: [link] }];
	}
	try {
		const raw = fs.readFileSync(path.resolve(process.cwd(), url || 'CHANGELOG.md'), 'utf-8');
		return [{ type: 'html', value: raw.replace(/^#\s.*\n+/, '').trim() }];
	} catch {
		return [];
	}
}

function component(node: Node): Node[] {
	const flow = node.type === 'mdxJsxFlowElement';
	switch (node.name) {
		case 'Code': {
			const value = attr(node, 'code');
			if (typeof value !== 'string') return [];
			if (!flow) return [{ type: 'inlineCode', value }];
			if (attr(node, 'inline')) {
				return [{ type: 'paragraph', children: [{ type: 'inlineCode', value }] }];
			}
			const title = text(node, 'title');
			return [
				{
					type: 'code',
					lang: text(node, 'lang') || null,
					meta: title ? `title="${title}"` : null,
					value
				}
			];
		}
		case 'Callout': {
			const type = text(node, 'type');
			const kind = type && type !== 'default' ? type[0].toUpperCase() + type.slice(1) : '';
			const label = [kind, text(node, 'title')].filter(Boolean).join(': ');
			return [
				{ type: 'blockquote', children: [...heading(label), ...convert(node.children)] }
			];
		}
		case 'Steps':
			return [
				{
					type: 'list',
					ordered: true,
					spread: true,
					children: node.children
						.filter((child: Node) => child.name === 'Step')
						.map((step: Node) => ({
							type: 'listItem',
							spread: true,
							children: [...heading(text(step, 'title')), ...convert(step.children)]
						}))
				}
			];
		case 'TabItem':
			return [
				...heading(text(node, 'label') || text(node, 'value')),
				...convert(node.children)
			];
		case 'FileTree':
			return [{ type: 'code', lang: null, value: treeLines(node.children).join('\n') }];
		case 'Accordion': {
			const items = attr(node, 'items');
			if (!Array.isArray(items)) return [];
			return items.flatMap((item) => [
				...heading(String(item?.title ?? '')),
				{ type: 'html', value: String(item?.content ?? '') }
			]);
		}
		case 'Changelog':
			return changelog(text(node, 'url'));
	}
	// Tabs, Step outside Steps and the user's own components: keep the content.
	return convert(node.children);
}

function htmlElement(node: Node): Node[] {
	const children = convert(node.children);
	if (!node.name) return children;
	const attributes = node.attributes
		.filter((attribute: Node) => attribute.type === 'mdxJsxAttribute')
		.map((attribute: Node) =>
			typeof attribute.value === 'string'
				? ` ${attribute.name}="${attribute.value}"`
				: attribute.value
					? ''
					: ` ${attribute.name}`
		)
		.join('');
	const open = `<${node.name}${attributes}`;
	if (children.length === 0) return [{ type: 'html', value: `${open} />` }];
	return [
		{ type: 'html', value: `${open}>` },
		...children,
		{ type: 'html', value: `</${node.name}>` }
	];
}

function convert(nodes: Node[]): Node[] {
	return nodes.flatMap((node) => {
		if (node.type === 'mdxjsEsm' || node.type === 'mdxFlowExpression') return [];
		if (node.type === 'mdxTextExpression') {
			const value = expression(node);
			return typeof value === 'string' ? [{ type: 'text', value }] : [];
		}
		if (isComponent(node)) return component(node);
		if (isJsx(node)) return htmlElement(node);
		return node.children ? [{ ...node, children: convert(node.children) }] : [node];
	});
}

/**
 * MDX source as plain Markdown. Imports, exports and expressions are dropped,
 * built-in components turn into their closest Markdown shape and unknown
 * components are replaced by their content.
 */
export function mdxToMarkdown(source: string): string {
	let tree: Node;
	try {
		tree = parser.parse(source) as Node;
	} catch {
		// Syntax from a user remark plugin that plain MDX can't parse.
		return source;
	}
	const [root] = unravel(tree);
	root.children = convert(root.children);
	return printer.stringify(root as never).trim();
}
