// Shared behavior for <details data-popover> menus: close on outside click,
// Escape and page navigation. Imported by component scripts, bundled once.

function closeAll(except?: Element | null) {
	for (const open of document.querySelectorAll<HTMLDetailsElement>(
		'details[data-popover][open]'
	)) {
		if (!except || !open.contains(except)) open.open = false;
	}
}

document.addEventListener('click', (event) => closeAll(event.target as Element));
document.addEventListener('keydown', (event) => {
	if (event.key !== 'Escape') return;
	const open = document.querySelector<HTMLDetailsElement>('details[data-popover][open]');
	if (!open) return;
	closeAll();
	open.querySelector('summary')?.focus();
});
document.addEventListener('astro:before-preparation', () => closeAll());

export {};
