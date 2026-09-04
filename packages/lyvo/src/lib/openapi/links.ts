import type { LoadedApiSpec } from './model';
import config from 'virtual:lyvo-config';

export function apiPageHref(spec: LoadedApiSpec, slug: string): string {
	const sub = spec.sub ? `${spec.sub}/` : '';
	return `${config.api.root}/${sub}${slug}`;
}
