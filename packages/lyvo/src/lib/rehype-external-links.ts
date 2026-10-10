import { applyBase, withTrailingSlash } from './routing';

interface Node {
	type: string;
	tagName?: string;
	properties?: Record<string, unknown>;
	children?: Node[];
}

function walk(node: Node, visit: (node: Node) => void) {
	visit(node);
	for (const child of node.children ?? []) walk(child, visit);
}

/**
 * Opens off-site links in a new tab and marks them for the ↗ indicator.
 * Site-absolute links ("/docs/x") get Astro's `base` so content works under a subpath,
 * and the trailing slash the site is served with.
 */
export default function rehypeExternalLinks(
	options: { site?: string; base?: string; trailingSlash?: boolean } = {}
) {
	const ownOrigin = options.site ? new URL(options.site).origin : null;
	const base = options.base ?? '';

	return (tree: Node) => {
		walk(tree, (node) => {
			if (node.type !== 'element' || node.tagName !== 'a' || !node.properties) return;
			const href = node.properties.href;
			if (typeof href !== 'string') return;
			if (href.startsWith('/')) {
				const based = applyBase(base, href);
				node.properties.href = options.trailingSlash ? withTrailingSlash(based) : based;
				return;
			}
			if (!/^https?:\/\//.test(href)) return;
			if (ownOrigin && new URL(href).origin === ownOrigin) return;

			const classes = node.properties.className;
			node.properties.className = [
				...(Array.isArray(classes) ? classes : classes ? [classes] : []),
				'external-link'
			];
			node.properties.target = '_blank';
			node.properties.rel = ['noopener', 'noreferrer'];
		});
	};
}
