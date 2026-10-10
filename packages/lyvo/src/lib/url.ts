import config from 'virtual:lyvo-config';
import { applyBase, removeBase, withTrailingSlash } from './routing';

/** Site path with Astro's `base` prepended, safe to call on any href. */
export function withBase(path: string): string {
	return applyBase(config.base, path);
}

/** Link to a page: `base` prepended, plus the trailing slash when Astro builds with one. */
export function pageHref(path: string): string {
	const href = withBase(path);
	return config.trailingSlash ? withTrailingSlash(href) : href;
}

/** Current pathname without Astro's `base`, for route matching. */
export function stripBase(pathname: string): string {
	return removeBase(config.base, pathname);
}
