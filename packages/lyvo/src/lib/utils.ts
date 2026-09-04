import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function isExternal(href?: string): boolean {
	return !!href && (href.startsWith('http://') || href.startsWith('https://'));
}
