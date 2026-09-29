/// <reference types="astro/client" />

interface Window {
	__lyvoTheme?: {
		apply(): void;
		set(pref: 'light' | 'dark' | 'system'): void;
	};
}
