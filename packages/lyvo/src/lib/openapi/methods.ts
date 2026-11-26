import type { HttpMethod } from './types';

export const methodColor: Record<HttpMethod, string> = {
	get: 'text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/5',
	post: 'text-blue-600 dark:text-blue-400 border-blue-500/30 bg-blue-500/5',
	put: 'text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/5',
	patch: 'text-yellow-600 dark:text-yellow-300 border-yellow-500/30 bg-yellow-500/5',
	delete: 'text-rose-600 dark:text-rose-400 border-rose-500/30 bg-rose-500/5',
	head: 'text-violet-600 dark:text-violet-300 border-violet-500/30 bg-violet-500/5',
	options: 'text-cyan-600 dark:text-cyan-400 border-cyan-500/30 bg-cyan-500/5',
	trace: 'text-fuchsia-600 dark:text-fuchsia-400 border-fuchsia-500/30 bg-fuchsia-500/5'
};
