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

	if (lyvoConfig.openapi?.input) {
		collections.api = defineCollection({
			loader: openapiLoader({
				input: lyvoConfig.openapi.input,
				groupBy: lyvoConfig.openapi.groupBy || 'tag'
			})
		});
	}

	return collections;
}
