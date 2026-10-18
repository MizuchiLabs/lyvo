/** Plural forms of a string, picked with `Intl.PluralRules`. `other` is the fallback. */
export type PluralForms = Partial<Record<Intl.LDMLPluralRule, string>> & { other: string };
export type UiString = string | PluralForms;

export const UI_DEFAULTS = {
	search: 'Search',
	onThisPage: 'On this page',
	noHeadings: 'No headings found.',
	lastUpdated: 'Last updated on {date}',
	helpful: 'Was this page helpful?',
	yes: 'Yes',
	no: 'No',
	thanks: 'Thank you for your feedback!',
	feedbackQuestion: 'What was missing or unclear?',
	feedbackPlaceholder: 'Optional. Please leave out personal data.',
	skip: 'Skip',
	openIssue: 'Open an issue',
	orOpenIssue: 'Or open an issue',
	editPage: 'Edit page',
	previous: 'Previous',
	next: 'Next',
	docs: 'Docs',
	api: 'API',
	guides: 'Guides',
	guidesDescription: 'Learn the concepts',
	endpointCount: { one: '{count} endpoint', other: '{count} endpoints' },
	fallbackNotice: 'This page is not available in {language} yet. Showing the {original} version.',
	notTranslated: 'Not translated',
	theme: 'Theme',
	themeLight: 'Light',
	themeDark: 'Dark',
	themeSystem: 'System',
	toggleTheme: 'Toggle theme',
	menu: 'Menu',
	skipToContent: 'Skip to content',
	close: 'Close',
	breadcrumb: 'Breadcrumb',
	home: 'Home',
	overview: 'Overview',
	notFoundTitle: 'Page not found',
	notFoundText: 'This page does not exist or has been moved.',
	backHome: 'Back to home',
	redirecting: 'Redirecting...',
	language: 'Language',
	defaultDescription: 'Documentation for {title}.',
	allRightsReserved: 'All rights reserved.',
	noReleases: 'No releases found.',
	externalDocs: 'Read external documentation',
	codeSamples: 'Code Samples',
	exampleResponses: 'Example Responses',
	copyPage: 'Copy page',
	copyCode: 'Copy code to clipboard',
	copyCommand: 'Copy command',
	copyUrl: 'Copy endpoint URL',
	moreActions: 'More page actions',
	copied: 'Copied',
	viewMarkdown: 'View as Markdown',
	openIn: 'Open in {name}',
	apiDescription: 'API reference.',
	downloadSpec: 'Download OpenAPI',
	servers: 'Servers',
	about: 'About',
	contact: 'Contact',
	website: 'Website',
	license: 'License',
	termsOfService: 'Terms of Service',
	readTerms: 'Read terms',
	documentation: 'Documentation',
	authentication: 'Authentication',
	groups: 'Groups',
	schemas: 'Models',
	pathParameters: 'Path Parameters',
	queryParameters: 'Query Parameters',
	headerParameters: 'Header Parameters',
	cookieParameters: 'Cookie Parameters',
	requestBody: 'Request Body',
	responses: 'Responses',
	mediaType: 'Media Type',
	noSchema: 'No schema defined.',
	noContentSchema: 'No content schema provided.',
	required: 'Required',
	scopes: 'Scopes:',
	example: 'Example',
	exampleValue: 'Example {value}',
	exampleCount: { one: '{count} example', other: '{count} examples' },
	defaultValue: 'Default: {value}',
	enumValues: 'Enum:',
	constValue: 'Const:',
	oneOf: 'One of',
	anyOf: 'Any of',
	mapValue: 'Map value',
	option: 'Option {n}',
	tryIt: 'Try it',
	server: 'Server',
	authorization: 'Authorization',
	username: 'Username',
	password: 'Password',
	token: 'Token',
	body: 'Body',
	send: 'Send',
	sending: 'Sending...',
	response: 'Response',
	error: 'Error',
	emptyBody: '(empty body)',
	requestFailed: 'Request failed. The API may not allow cross-origin requests from this site.'
} satisfies Record<string, UiString>;

export type UiKey = keyof typeof UI_DEFAULTS;
export type UiStrings = Record<UiKey, UiString>;
export type Translate = (key: UiKey, vars?: Record<string, string | number>) => string;

/** Fills `{name}` placeholders from `vars`. A `count` var picks the plural form. */
export function createTranslator(strings: UiStrings, lang: string): Translate {
	const plurals = new Intl.PluralRules(lang);
	return (key, vars = {}) => {
		const value = strings[key];
		const template =
			typeof value === 'string'
				? value
				: (value[plurals.select(Number(vars.count))] ?? value.other);
		return template.replace(/\{(\w+)\}/g, (match, name: string) =>
			name in vars ? String(vars[name]) : match
		);
	};
}
