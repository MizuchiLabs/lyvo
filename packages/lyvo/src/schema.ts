import { z } from 'astro/zod';

export const docsSchema = z.object({
	title: z.string(),
	description: z.string().optional(),
	order: z.number().optional(),
	/** Lucide icon name or an SVG in src/assets, shown in the sidebar. */
	icon: z.string().optional(),
	/** Short label next to the sidebar entry, e.g. "New" or "Beta". */
	badge: z.string().optional()
});

export { openapiLoader } from './lib/openapi/loader';
