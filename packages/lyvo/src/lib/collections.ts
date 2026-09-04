import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { docsSchema, openapiLoader } from '@mizuchilabs/lyvo/schema';
// @ts-ignore
import lyvoConfig from 'virtual:lyvo-config';

export function defineLyvoCollections() {
	const collections: Record<string, any> = {
		docs: defineCollection({
			loader: glob({ pattern: '**/*.{md,mdx,mdoc}', base: './src/content/docs' }),
			schema: docsSchema
		})
	};

	if (lyvoConfig.api.specs.length > 0) {
		collections.api = defineCollection({
			loader: openapiLoader({
				specs: lyvoConfig.api.specs.map((spec: { id: string; input: string; groupBy: 'tag' | 'path' }) => ({
					id: spec.id,
					input: spec.input,
					groupBy: spec.groupBy
				}))
			})
		});
	}

	return collections;
}
