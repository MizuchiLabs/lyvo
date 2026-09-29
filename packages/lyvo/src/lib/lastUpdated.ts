import fs from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const cache = new Map<string, Date | null>();

export async function getLastUpdated(filePath: string | undefined): Promise<Date | null> {
	if (!filePath) return null;
	if (cache.has(filePath)) return cache.get(filePath)!;

	let result: Date | null = null;
	try {
		const { stdout } = await execFileAsync('git', [
			'log',
			'-1',
			'--format=%ct',
			'--',
			filePath
		]);
		const seconds = Number.parseInt(stdout.trim(), 10);
		if (seconds) result = new Date(seconds * 1000);
	} catch {
		// not a git checkout, fall back to mtime
	}

	if (!result) {
		try {
			result = fs.statSync(filePath).mtime;
		} catch {
			result = null;
		}
	}

	cache.set(filePath, result);
	return result;
}
