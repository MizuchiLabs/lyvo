import config from 'virtual:lyvo-config';
import { joinUrl } from './routing';
import { pageHref } from './url';
import { readAllApiSpecs, type LoadedApiSpec } from './openapi/model';
import { t } from './i18n';

/** A top-level area of the docs, switched with the section picker. */
export interface Section {
	id: string;
	title: string;
	description: string;
	icon: string;
	href: string;
	/** Set for API sections. */
	spec?: LoadedApiSpec;
}

export async function getSections(locale: string | null): Promise<Section[]> {
	const docsHome =
		locale && locale !== config.i18n.defaultLocale
			? pageHref(joinUrl(locale, config.docs.prefix))
			: pageHref(joinUrl(config.docs.prefix));

	const sections: Section[] = [
		{
			id: 'docs',
			title: t('guides', locale),
			description: t('guidesDescription', locale),
			icon: 'book-open',
			href: docsHome
		}
	];

	for (const spec of await readAllApiSpecs()) {
		const endpoints = spec.model.operations.length + spec.model.webhooks.length;
		if (endpoints === 0) continue;
		sections.push({
			id: `api-${spec.specId}`,
			title: spec.title,
			description: `v${spec.model.info.version} · ${t('endpointCount', locale).replace('{count}', String(endpoints))}`,
			icon: 'braces',
			href: pageHref(joinUrl(config.api.root, spec.sub)),
			spec
		});
	}

	return sections;
}

/** The section a path belongs to. Nested API prefixes like /api/v2 win over /api. */
export function activeSection(sections: Section[], pathname: string): Section {
	const path = pathname.replace(/\/+$/, '') || '/';
	const matches = sections
		.filter((section) => section.spec)
		.filter((section) => {
			const href = section.href.replace(/\/+$/, '');
			return path === href || path.startsWith(`${href}/`);
		})
		.sort((a, b) => b.href.length - a.href.length);
	return matches[0] ?? sections[0];
}
