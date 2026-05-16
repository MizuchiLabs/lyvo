import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { openapiLoader } from './lib/openapi/loader';

const docs = defineCollection({
	loader: glob({ pattern: '**/*.{md,mdx,mdoc}', base: './src/content/docs' }),
	schema: z.object({
		title: z.string(),
		description: z.string().optional(),
		order: z.number().optional()
	})
});

const api = defineCollection({
	loader: openapiLoader({ input: 'public/openapi.json', groupBy: 'tag' }),
});

export const collections = { docs, api };

