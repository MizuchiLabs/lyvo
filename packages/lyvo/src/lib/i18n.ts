import config from 'virtual:lyvo-config';
import { currentLocale } from './docs';
import { createTranslator, type Translate } from './ui-strings';

export function translator(lang: string): Translate {
	const strings = config.i18n.ui[lang] ?? config.i18n.ui[config.i18n.defaultLocale];
	return createTranslator(strings, lang);
}

/**
 * Language of the page at `url` and a `t` bound to it. `locale` is the URL's
 * locale prefix, null on default-locale pages, as the docs helpers expect.
 */
export function getI18n(url: URL) {
	const locale = currentLocale(url.pathname);
	const lang = locale ?? config.i18n.defaultLocale;
	return { lang, locale, t: translator(lang) };
}

/** Name of a language as it reads inside a sentence in `lang`, e.g. "Englisch" in German. */
export function languageName(code: string, lang: string): string {
	try {
		const name = new Intl.DisplayNames([lang], { type: 'language' }).of(code);
		if (name && name.toLowerCase() !== code.toLowerCase()) return name;
	} catch {
		// not a valid tag, use the configured label
	}
	return config.i18n.labels[code] ?? code;
}
