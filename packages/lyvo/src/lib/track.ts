export type TrackProps = Record<string, string | number | boolean | undefined>;

/**
 * Report a UI interaction. The analytics bridge forwards it to the configured
 * provider, and anyone can listen for `lyvo:track` on window.
 */
export function track(name: string, props: TrackProps = {}) {
	const clean = Object.fromEntries(
		Object.entries(props).filter(([, value]) => value !== undefined)
	);
	if (import.meta.env.DEV) console.debug('[lyvo] track', name, clean);
	window.dispatchEvent(new CustomEvent('lyvo:track', { detail: { name, props: clean } }));
}
