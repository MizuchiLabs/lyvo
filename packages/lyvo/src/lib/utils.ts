import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function staticRedirect(target: string): Response {
	const html = `<!doctype html>
<html>
	<head>
		<meta charset="utf-8" />
		<meta http-equiv="refresh" content="0;url=${target}" />
		<script>window.location.replace("${target}");</script>
		<title>Redirecting...</title>
		<style>body { visibility: hidden; }</style>
	</head>
	<body></body>
</html>`;

	return new Response(html, {
		status: 200,
		headers: {
			'Content-Type': 'text/html'
		}
	});
}
