import type { AstroIntegration } from 'astro';
import { z } from 'astro/zod';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const LyvoOptionsSchema = z.object({
	title: z.string().optional(),
	repo: z
		.object({
			url: z.string().optional(),
			branch: z.string().optional(),
			provider: z.string().optional()
		})
		.optional(),
	socials: z.record(z.string(), z.string().optional()).optional(),
	extraLinks: z
		.array(
			z.object({
				title: z.string(),
				href: z.string()
			})
		)
		.optional(),
	docs: z
		.object({
			edit: z.boolean().optional(),
			feedback: z.boolean().optional()
		})
		.optional(),
	openapi: z
		.object({
			input: z.string().optional(),
			groupBy: z.enum(['tag', 'path']).optional()
		})
		.optional()
});

export type LyvoOptions = z.infer<typeof LyvoOptionsSchema>;

export default function lyvo(userOptions: LyvoOptions = {}): AstroIntegration {
	const options = LyvoOptionsSchema.parse(userOptions);

	return {
		name: 'lyvo',
		hooks: {
			'astro:config:setup': ({ updateConfig, injectRoute }) => {
				updateConfig({
					vite: {
						plugins: [
							{
								name: 'vite-plugin-lyvo-config',
								resolveId(id) {
									if (id === 'virtual:lyvo-config') {
										return '\0virtual:lyvo-config';
									}
								},
								load(id) {
									if (id === '\0virtual:lyvo-config') {
										const config = {
											title: options.title,
											repo: options.repo,
											socials: options.socials || {},
											extraLinks: options.extraLinks || [],
											docs: {
												edit: true,
												feedback: true,
												...options.docs
											},
											openapi: {
												...options.openapi
											}
										};
										return `export default ${JSON.stringify(config)};`;
									}
								}
							}
						]
					}
				});

				injectRoute({
					pattern: '/docs/[...slug]',
					entrypoint: 'lyvo/routes/docs/[...slug].astro'
				});
				injectRoute({
					pattern: '/docs',
					entrypoint: 'lyvo/routes/docs/index.astro'
				});

				if (options.openapi?.input) {
					injectRoute({
						pattern: '/api/[slug]',
						entrypoint: 'lyvo/routes/api/[slug].astro'
					});
					injectRoute({
						pattern: '/api',
						entrypoint: 'lyvo/routes/api/index.astro'
					});
				}
			},
			'astro:build:done': ({ dir, logger }) => {
				logger.info('[lyvo] Running Pagefind indexer...');
				try {
					execSync(`npx pagefind --site "${fileURLToPath(dir)}"`, { stdio: 'inherit' });
				} catch (error) {
					logger.error(`[lyvo] Pagefind indexing failed: ${error}`);
				}
			}
		}
	};
}
