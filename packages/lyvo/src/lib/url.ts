import config from 'virtual:lyvo-config';
import { applyBase, removeBase } from './routing';

/** Site path with Astro's `base` prepended, safe to call on any href. */
export function withBase(path: string): string {
	return applyBase(config.base, path);
}

/** Current pathname without Astro's `base`, for route matching. */
export function stripBase(pathname: string): string {
	return removeBase(config.base, pathname);
}
