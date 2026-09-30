type Mermaid = typeof import('mermaid').default;

let mermaid: Promise<Mermaid> | undefined;
let renderCount = 0;

// Mermaid's color math (khroma) can't parse oklch, so resolve tokens to rgb.
function tokenColors(names: string[]): Record<string, string> {
	const canvas = document.createElement('canvas');
	canvas.width = canvas.height = 1;
	const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
	const styles = getComputedStyle(document.documentElement);
	const colors: Record<string, string> = {};
	for (const name of names) {
		ctx.clearRect(0, 0, 1, 1);
		ctx.fillStyle = styles.getPropertyValue(`--${name}`).trim() || '#888';
		ctx.fillRect(0, 0, 1, 1);
		const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
		colors[name] = `rgb(${r}, ${g}, ${b})`;
	}
	return colors;
}

function themeVariables() {
	const c = tokenColors([
		'background',
		'foreground',
		'card',
		'muted',
		'muted-foreground',
		'accent',
		'accent-foreground',
		'primary',
		'border'
	]);
	return {
		darkMode: document.documentElement.classList.contains('dark'),
		fontFamily: getComputedStyle(document.body).fontFamily,
		background: c.background,
		textColor: c.foreground,
		primaryColor: c.muted,
		primaryTextColor: c.foreground,
		primaryBorderColor: c.primary,
		secondaryColor: c.accent,
		secondaryTextColor: c['accent-foreground'],
		secondaryBorderColor: c.border,
		tertiaryColor: c.card,
		tertiaryTextColor: c.foreground,
		tertiaryBorderColor: c.border,
		lineColor: c['muted-foreground'],
		clusterBkg: c.card,
		clusterBorder: c.border,
		edgeLabelBackground: c.background,
		noteBkgColor: c.accent,
		noteTextColor: c['accent-foreground'],
		noteBorderColor: c.border
	};
}

async function render(blocks: HTMLElement[]) {
	mermaid ??= import('mermaid').then((mod) => mod.default);
	const api = await mermaid;
	api.initialize({
		startOnLoad: false,
		securityLevel: 'strict',
		suppressErrorRendering: true,
		theme: 'base',
		themeVariables: themeVariables()
	});

	for (const block of blocks) {
		const source = block.querySelector('.lyvo-mermaid-source')?.textContent ?? '';
		try {
			const { svg } = await api.render(`lyvo-mermaid-${renderCount++}`, source);
			let output = block.querySelector<HTMLElement>('.lyvo-mermaid-diagram');
			if (!output) {
				output = document.createElement('div');
				output.className = 'lyvo-mermaid-diagram';
				block.append(output);
			}
			output.innerHTML = svg;
			block.dataset.state = 'rendered';
		} catch (error) {
			console.error('[lyvo] mermaid diagram failed to render', error);
			block.querySelector('.lyvo-mermaid-diagram')?.remove();
			block.dataset.state = 'error';
		}
	}
}

function blocksOnPage() {
	return [...document.querySelectorAll<HTMLElement>('.lyvo-mermaid')];
}

document.addEventListener('astro:page-load', () => {
	const blocks = blocksOnPage();
	if (blocks.length > 0) render(blocks);
});

let dark = document.documentElement.classList.contains('dark');
new MutationObserver(() => {
	const now = document.documentElement.classList.contains('dark');
	if (now === dark) return;
	dark = now;
	const blocks = blocksOnPage().filter((block) => block.dataset.state === 'rendered');
	if (blocks.length > 0) render(blocks);
}).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
