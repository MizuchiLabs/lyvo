export interface RoutingInfo {
	docsPrefix: string;
	apiRoot: string;
	defaultLocale: string;
	locales: Array<{ code: string }>;
}

export function joinUrl(...parts: Array<string | undefined>): string {
	const joined = parts
		.filter((part): part is string => Boolean(part && part.length > 0))
		.map((part) => part.replace(/^\/+|\/+$/g, ''))
		.join('/');
	return `/${joined}`;
}

export function splitDocId(
	id: string,
	localeCodes: string[]
): { locale: string | null; pageId: string } {
	for (const code of localeCodes) {
		if (id === code) return { locale: code, pageId: '' };
		if (id.startsWith(`${code}/`)) return { locale: code, pageId: id.slice(code.length + 1) };
	}
	return { locale: null, pageId: id };
}

export function docPageId(id: string, localeCodes: string[]): string {
	return splitDocId(id, localeCodes).pageId;
}

export function docsUrl(routing: RoutingInfo, id: string, activeLocale?: string | null): string {
	const { locale, pageId } = splitDocId(
		id,
		routing.locales.map((locale) => locale.code)
	);
	// Untranslated docs live in the default locale but are routed under the
	// active locale too, so keep browsing sessions in the chosen language.
	const prefix =
		locale ?? (activeLocale && activeLocale !== routing.defaultLocale ? activeLocale : null);
	return joinUrl(prefix ? `/${prefix}` : '', routing.docsPrefix, pageId);
}

export function apiPageUrl(routing: RoutingInfo, specSub: string, slug: string): string {
	return joinUrl(routing.apiRoot, specSub, slug);
}

export function localeFromPath(pathname: string, routing: RoutingInfo): string | null {
	const first = pathname.split('/').filter(Boolean)[0];
	if (!first) return null;
	return routing.locales.some((locale) => locale.code === first) ? first : null;
}

export function stripLocaleFromPath(pathname: string, routing: RoutingInfo): string {
	const locale = localeFromPath(pathname, routing);
	if (!locale) return pathname;
	const rest = pathname.slice(locale.length + 1);
	return rest.startsWith('/') ? rest : `/${rest}`;
}
