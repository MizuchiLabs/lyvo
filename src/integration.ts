import type { AstroIntegration } from 'astro';
import { z } from 'astro/zod';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

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
			'astro:config:setup': ({ updateConfig, logger }) => {
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

				if (options.openapi?.input) {
					logger.info('[openapi] Generating model...');
					const scriptPath = path.resolve('scripts/generate-openapi-model.mjs');

					const args = [scriptPath, '--input', options.openapi.input];

					if (options.openapi.groupBy) {
						args.push('--group-by', options.openapi.groupBy);
					}

					const result = spawnSync('node', args, {
						stdio: 'inherit'
					});

					if (result.error) {
						logger.error(
							'[openapi] Failed to start generator: ' + result.error.message
						);
					} else if (result.status !== 0) {
						logger.error(
							'[openapi] Generator script exited with status ' + result.status
						);
					} else {
						logger.info('[openapi] Model generated successfully.');
					}
				}
			}
		}
	};
}
