import { z } from 'astro/zod';

export const docsSchema = z.object({
	title: z.string(),
	description: z.string().optional(),
	order: z.number().optional()
});

export { openapiLoader } from './lib/openapi/loader';
