interface Node {
	type: string;
	lang?: string | null;
	value?: string;
	data?: Record<string, unknown>;
	children?: Node[];
}

function walk(node: Node, visit: (node: Node) => void) {
	visit(node);
	for (const child of node.children ?? []) walk(child, visit);
}

/**
 * Turns ```mermaid fences into a placeholder the client script renders.
 * Runs before Shiki, so the source never gets highlighted.
 */
export default function remarkMermaid() {
	return (tree: Node) => {
		walk(tree, (node) => {
			if (node.type !== 'code' || node.lang !== 'mermaid') return;
			// The code handler always wraps output in <pre>, a custom type skips it.
			node.type = 'mermaid';
			node.data = {
				hName: 'div',
				hProperties: {
					className: ['lyvo-mermaid', 'not-prose'],
					dataState: 'loading',
					dataPagefindIgnore: true
				},
				hChildren: [
					{
						type: 'element',
						tagName: 'pre',
						properties: { className: ['lyvo-mermaid-source'], dataNoCopy: true },
						children: [{ type: 'text', value: node.value ?? '' }]
					}
				]
			};
		});
	};
}
