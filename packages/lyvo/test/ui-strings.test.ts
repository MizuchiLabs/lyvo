import { describe, expect, it } from 'vitest';
import { createTranslator, UI_DEFAULTS, type UiStrings } from '../src/lib/ui-strings';

function translate(lang: string, overrides: Partial<UiStrings> = {}) {
	return createTranslator({ ...UI_DEFAULTS, ...overrides }, lang);
}

describe('createTranslator', () => {
	it('fills every placeholder occurrence', () => {
		const t = translate('en', { openIn: '{name} / {name}' });
		expect(t('openIn', { name: 'Claude' })).toBe('Claude / Claude');
	});

	it('keeps placeholders without a value', () => {
		expect(translate('en')('lastUpdated')).toBe('Last updated on {date}');
	});

	it('picks plural forms by count', () => {
		const t = translate('en');
		expect(t('endpointCount', { count: 1 })).toBe('1 endpoint');
		expect(t('endpointCount', { count: 3 })).toBe('3 endpoints');
	});

	it('uses the plural rules of the language', () => {
		const t = translate('pl', {
			endpointCount: {
				one: '{count} punkt',
				few: '{count} punkty',
				many: '{count} punktów',
				other: '{count} punktu'
			}
		});
		expect(t('endpointCount', { count: 1 })).toBe('1 punkt');
		expect(t('endpointCount', { count: 3 })).toBe('3 punkty');
		expect(t('endpointCount', { count: 5 })).toBe('5 punktów');
	});

	it('falls back to other when a form is missing', () => {
		const t = translate('en', { endpointCount: { other: '{count} Endpunkte' } });
		expect(t('endpointCount', { count: 1 })).toBe('1 Endpunkte');
	});
});
