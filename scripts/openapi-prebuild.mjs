import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const CONFIG_PATH = path.resolve('src/content/api/openapi.config.json');

function isHttpUrl(value) {
	return /^https?:\/\//i.test(value);
}

function runGenerator() {
	const result = spawnSync(
		process.execPath,
		[path.resolve('scripts/generate-openapi-model.mjs')],
		{
			stdio: 'inherit'
		}
	);

	if (typeof result.status === 'number') {
		process.exit(result.status);
	}

	if (result.error) {
		console.error('[openapi] Failed to start generator');
		console.error(result.error);
	}

	process.exit(1);
}

if (!fs.existsSync(CONFIG_PATH)) {
	console.log('[openapi] No config found, skipping model generation');
	process.exit(0);
}

let config = {};
try {
	const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
	config = JSON.parse(raw);
} catch (error) {
	console.error('[openapi] Failed to read openapi config');
	console.error(error);
	process.exit(1);
}

if (config.enabled === false) {
	console.log('[openapi] openapi.config.json has enabled=false, skipping model generation');
	process.exit(0);
}

if (typeof config.input !== 'string' || config.input.trim().length === 0) {
	console.log('[openapi] No input configured, skipping model generation');
	process.exit(0);
}

if (!isHttpUrl(config.input)) {
	const absoluteInputPath = path.resolve(config.input);
	if (!fs.existsSync(absoluteInputPath)) {
		console.error(`[openapi] Configured input does not exist: ${config.input}`);
		process.exit(1);
	}
}

runGenerator();
