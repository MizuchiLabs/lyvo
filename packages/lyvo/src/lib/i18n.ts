import config from 'virtual:lyvo-config';

export function t(key: string, locale: string | null = null): string {
	const dict = locale ? config.i18n.ui[locale] : undefined;
	return dict?.[key] ?? config.i18n.ui[config.i18n.defaultLocale]?.[key] ?? key;
}
