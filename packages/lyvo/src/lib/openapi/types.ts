import type { SnippetLanguage } from '../../config';

export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete' | 'head' | 'options' | 'trace';

export interface OpenAPIModel {
	source: string;
	openapi?: string;
	info: {
		title: string;
		version: string;
		description?: string;
		termsOfService?: string;
		contact?: {
			name?: string;
			url?: string;
			email?: string;
		};
		license?: {
			name: string;
			url?: string;
			identifier?: string;
		};
	};
	servers: OpenAPIServer[];
	securitySchemes: OpenAPISecurityRequirement[];
	externalDocs?: {
		description?: string;
		url: string;
	};
	tags: OpenAPITag[];
	navigation: OpenAPINavigationGroup[];
	operations: OpenAPIOperation[];
	webhooks: OpenAPIOperation[];
	schemas: OpenAPISchemaEntry[];
}

export interface OpenAPISchemaEntry {
	name: string;
	slug: string;
	description?: string;
	schema: Record<string, unknown>;
	example?: unknown;
}

export interface OpenAPIServer {
	url: string;
	description?: string;
}

export interface OpenAPITag {
	name: string;
	description?: string;
	operationCount: number;
}

export interface OpenAPINavigationGroup {
	id: string;
	title: string;
	items: OpenAPINavigationItem[];
}

export interface OpenAPINavigationItem {
	id: string;
	slug: string;
	label: string;
	method: HttpMethod;
	path: string;
	deprecated: boolean;
	isWebhook?: boolean;
}

export interface OpenAPIOperation {
	id: string;
	slug: string;
	method: HttpMethod;
	path: string;
	title: string;
	summary?: string;
	description?: string;
	deprecated: boolean;
	tags: string[];
	servers: OpenAPIServer[];
	parameters: OpenAPIParameter[];
	requestBody?: OpenAPIRequestBody;
	responses: OpenAPIResponse[];
	security: OpenAPISecurityRequirement[];
	snippets: OpenAPISnippet[];
	operationId?: string;
	externalDocsUrl?: string;
	/** Set for webhooks: the event name the webhook is registered under. */
	event?: string;
}

export interface OpenAPIParameter {
	name: string;
	in: 'path' | 'query' | 'header' | 'cookie';
	required: boolean;
	description?: string;
	deprecated: boolean;
	schema?: unknown;
	type?: string;
	format?: string;
	example?: unknown;
	examples?: unknown[];
}

export interface OpenAPIRequestBody {
	required: boolean;
	description?: string;
	content: OpenAPIMediaType[];
}

export interface OpenAPIResponse {
	status: string;
	description?: string;
	content: OpenAPIMediaType[];
}

export interface OpenAPIMediaType {
	mediaType: string;
	schema?: unknown;
	example?: unknown;
	examples?: unknown[];
}

export interface OpenAPISecurityRequirement {
	type: string;
	name: string;
	description?: string;
	in?: string;
	scheme?: string;
	bearerFormat?: string;
	flows?: unknown;
	openIdConnectUrl?: string;
	/** Header, query or cookie name an apiKey scheme is sent under. */
	paramName?: string;
	scopes: string[];
}

export interface OpenAPISnippet {
	id: SnippetLanguage;
	label: string;
	language: string;
	code: string;
}
