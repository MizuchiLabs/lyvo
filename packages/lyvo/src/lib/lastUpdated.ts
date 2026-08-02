import fs from 'node:fs';
import child_process from 'node:child_process';
import util from 'node:util';

const execAsync = util.promisify(child_process.exec);

const cache = new Map<string, string>();

export async function getLastUpdated(filePath: string): Promise<string> {
	if (!filePath) return '';

	const cached = cache.get(filePath);
	if (cached !== undefined) return cached;

	let result = '';

	try {
		const { stdout } = await execAsync(`git log -1 --format="%ct" -- "${filePath}"`);
		const gitTime = stdout.toString().trim();
		if (gitTime) {
			result = formatTime(new Date(parseInt(gitTime) * 1000));
		}
	} catch {
		// Fall back to fs mtime below
	}

	if (!result) {
		try {
			const stats = fs.statSync(filePath);
			result = formatTime(stats.mtime);
		} catch {
			result = '';
		}
	}

	cache.set(filePath, result);
	return result;
}

function formatTime(date: Date): string {
	return new Intl.DateTimeFormat(undefined, {
		month: 'short',
		day: 'numeric',
		year: 'numeric'
	}).format(date);
}
