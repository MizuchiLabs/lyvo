import type { AstroIntegration } from 'astro';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

export interface RepoOptions {
	url?: string;
	branch?: string;
}

export interface LinkOptions {
	title: string;
	href: string;
}

export interface LyvoOptions {
	repo?: RepoOptions;
	socials?: {
		discord?: string;
		x?: string;
		youtube?: string;
		bluesky?: string;
		[key: string]: string | undefined;
	};
	extraLinks?: LinkOptions[];
	docs?: {
		editDoc?: boolean;
		showFeedback?: boolean;
	};
	openapi?: {
		input?: string;
		groupBy?: 'tag' | 'path';
	};
}

export default function lyvoTheme(options: LyvoOptions = {}): AstroIntegration {
	return {
		name: 'lyvo-theme',
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
											repo: options.repo,
											socials: options.socials || {},
											extraLinks: options.extraLinks || [],
											docs: {
												editDoc: true,
												showFeedback: true,
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
						logger.error('[openapi] Failed to start generator: ' + result.error.message);
					} else if (result.status !== 0) {
						logger.error('[openapi] Generator script exited with status ' + result.status);
					} else {
						logger.info('[openapi] Model generated successfully.');
					}
				}
			}
		}
	};
}
