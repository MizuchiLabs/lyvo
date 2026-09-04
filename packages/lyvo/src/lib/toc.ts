let initialized = false;

const ACTIVE_OFFSET = 96;

function findActiveHeading(container: HTMLElement): string | null {
	const headings = Array.from(
		container.querySelectorAll<HTMLElement>('article h2[id], article h3[id]')
	);
	if (headings.length === 0) return null;

	if (container.scrollTop + container.clientHeight >= container.scrollHeight - 24) {
		return headings[headings.length - 1].id;
	}

	const containerTop = container.getBoundingClientRect().top;
	let active = headings[0].id;
	for (const heading of headings) {
		if (heading.getBoundingClientRect().top - containerTop > ACTIVE_OFFSET) break;
		active = heading.id;
	}
	return active;
}

function updateToc() {
	const container = document.querySelector<HTMLElement>('#main-scroll-area');
	if (!container) return;

	const activeId = findActiveHeading(container);

	document.querySelectorAll<HTMLElement>('[data-toc-link]').forEach((link) => {
		const isActive = Boolean(activeId) && link.dataset.id === activeId;
		link.classList.toggle('text-foreground', isActive);
		link.classList.toggle('font-medium', isActive);
		link.classList.toggle('text-muted-foreground', !isActive);
	});

	// Desktop indicator
	const indicator = document.querySelector<HTMLElement>('.toc-desktop .toc-indicator');
	const desktopLink = activeId
		? document.querySelector<HTMLElement>(
				`.toc-desktop [data-toc-link][data-id="${CSS.escape(activeId)}"]`
			)
		: null;
	if (indicator && desktopLink) {
		// Span the full row so the highlight covers exactly what the grey rail
		// shows there, with no grey peeking out above or below. The mask clips
		// it to the rail shape, so S-bend tails at depth changes stay on-path.
		const strokeWidth = 1.5;
		indicator.style.top = `${desktopLink.offsetTop + strokeWidth / 2}px`;
		indicator.style.height = `${desktopLink.offsetHeight - strokeWidth}px`;
	}

	// Mobile active label
	const mobileRoot = document.querySelector<HTMLElement>('.mobile-toc-root');
	const label = mobileRoot?.querySelector<HTMLElement>('[data-toc-active-text]');
	if (mobileRoot && label) {
		const defaultTitle = mobileRoot.dataset.title ?? '';
		if (container.scrollTop < 40) {
			label.textContent = defaultTitle;
		} else if (activeId) {
			const link = mobileRoot.querySelector<HTMLElement>(
				`[data-toc-link][data-id="${CSS.escape(activeId)}"]`
			);
			if (link) label.textContent = link.textContent?.trim() ?? defaultTitle;
		}
	}

	// Mobile progress ring
	const circle = mobileRoot?.querySelector<SVGCircleElement>('[data-toc-progress]');
	if (circle) {
		const scrollable = container.scrollHeight - container.clientHeight;
		const progress = scrollable > 0 ? container.scrollTop / scrollable : 0;
		const circumference = parseFloat(circle.dataset.circumference ?? '0');
		circle.style.strokeDashoffset = `${circumference * (1 - progress)}`;
	}
}

let ticking = false;

function onScroll() {
	if (ticking) return;
	ticking = true;
	requestAnimationFrame(() => {
		ticking = false;
		updateToc();
	});
}

function setupToc() {
	const container = document.querySelector<HTMLElement>('#main-scroll-area');
	if (!container) return;

	if (!container.dataset.tocBound) {
		container.dataset.tocBound = 'true';
		container.addEventListener('scroll', onScroll, { passive: true });
	}
	updateToc();
}

if (!initialized) {
	initialized = true;
	document.addEventListener('astro:page-load', setupToc);
}
