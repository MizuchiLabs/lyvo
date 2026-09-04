import type { APIRoute, GetStaticPaths } from 'astro';
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { getCollection } from 'astro:content';
import config from 'virtual:lyvo-config';
import { readAllApiSpecs } from '@lyvo/lib/openapi/model';
import { splitDocId } from '@lyvo/lib/routing';

const localeCodes = config.i18n.locales.map((locale) => locale.code);

interface PageMeta {
	title: string;
	description?: string;
}

export const getStaticPaths: GetStaticPaths = async () => {
	const paths: Array<{ params: { slug: string } }> = [];
	const all = await getCollection('docs');

	paths.push({ params: { slug: 'index.png' } });

	for (const doc of all) {
		const { locale, pageId } = splitDocId(doc.id, localeCodes);
		const pagePath = [locale, config.docs.prefix.replace(/^\//, ''), pageId]
			.filter(Boolean)
			.join('/');
		paths.push({ params: { slug: `${pagePath}.png` } });
	}

	const specs = await readAllApiSpecs();
	for (const spec of specs) {
		const prefix = [config.api.root.replace(/^\//, ''), spec.sub].filter(Boolean).join('/');
		paths.push({ params: { slug: `${prefix}.png` } });
		for (const endpoint of [...spec.model.operations, ...spec.model.webhooks]) {
			paths.push({ params: { slug: `${prefix}/${endpoint.slug}.png` } });
		}
	}

	return paths;
};

async function resolvePageMeta(slugParam: string): Promise<PageMeta | null> {
	const all = await getCollection('docs');

	if (slugParam === 'index.png') {
		return {
			title: config.title ?? 'Documentation',
			description: config.description
		};
	}

	const pagePath = slugParam.replace(/\.png$/, '');
	const [first, ...rest] = pagePath.split('/');
	const isLocale = localeCodes.includes(first);
	const locale = isLocale ? first : null;
	const location = isLocale ? rest.join('/') : pagePath;

	const docsPrefix = config.docs.prefix.replace(/^\//, '');
	if (location.startsWith(`${docsPrefix}/`) || location === docsPrefix) {
		const pageId = location === docsPrefix ? '' : location.slice(docsPrefix.length + 1);
		const docId = locale ? `${locale}/${pageId}` : pageId;
		const doc = all.find((entry) => entry.id === docId);
		if (!doc) return null;
		return { title: doc.data.title, description: doc.data.description };
	}

	const apiRoot = config.api.root.replace(/^\//, '');
	if (location === apiRoot || location.startsWith(`${apiRoot}/`)) {
		const remainder = location === apiRoot ? '' : location.slice(apiRoot.length + 1);
		const specs = await readAllApiSpecs();
		for (const spec of specs) {
			const specPrefix = spec.sub ? `${spec.sub}/` : '';
			if (!remainder.startsWith(specPrefix)) continue;
			const slug = remainder.slice(specPrefix.length);

			if (!slug) {
				return {
					title: spec.model.info?.title ?? spec.title,
					description: spec.model.info?.description
				};
			}

			const endpoint =
				spec.model.operations.find((operation) => operation.slug === slug) ??
				spec.model.webhooks.find((webhook) => webhook.slug === slug);
			if (endpoint) {
				return { title: `${endpoint.method.toUpperCase()} ${endpoint.path}`, description: endpoint.summary };
			}
		}
		return null;
	}

	return null;
}

function loadFonts(): Array<{ name: string; data: Buffer; weight: 400 | 700; style: 'normal' }> {
	const files = config.og.fontPaths ?? [];
	const fonts: Array<{ name: string; data: Buffer; weight: 400 | 700; style: 'normal' }> = [];
	const weights: Array<400 | 700> = [400, 700];
	for (const [index, file] of files.entries()) {
		try {
			fonts.push({ name: 'Inter', data: fs.readFileSync(file), weight: weights[index] ?? 400, style: 'normal' });
		} catch {
			// skip missing font file
		}
	}
	return fonts;
}

function escapeXml(value: string): string {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&apos;');
}

function truncate(value: string, max: number): string {
	return value.length > max ? `${value.slice(0, max - 1).trimEnd()}…` : value;
}

export const GET: APIRoute = async ({ params }) => {
	const meta = await resolvePageMeta(params.slug ?? '');
	if (!meta) {
		return new Response('Not found', { status: 404 });
	}

	if (!config.og.satoriPath || !config.og.sharpPath) {
		return new Response('OG image generation is not configured', { status: 500 });
	}

	// CJS interop: import() of a .cjs module wraps exports, sometimes twice.
	const unwrap = (mod: any) => {
		let current = mod?.default ?? mod;
		if (typeof current === 'object' && typeof current.default === 'function') {
			current = current.default;
		}
		return current;
	};

	const satoriModule = await import(pathToFileURL(config.og.satoriPath).href);
	const satori = unwrap(satoriModule);
	const sharpModule = await import(pathToFileURL(config.og.sharpPath).href);
	const sharp = unwrap(sharpModule);

	const title = truncate(escapeXml(meta.title), 80);
	const description = meta.description ? truncate(escapeXml(meta.description), 140) : null;
	const siteName = escapeXml(config.og.siteName ?? config.title ?? '');

	const svg = await satori(
		{
			type: 'div',
			props: {
				style: {
					width: '1200px',
					height: '630px',
					display: 'flex',
					flexDirection: 'column',
					justifyContent: 'space-between',
					padding: '72px',
					backgroundColor: '#0d1117',
					backgroundImage:
						'radial-gradient(circle at 20% 0%, rgba(124, 140, 248, 0.18), transparent 55%), radial-gradient(circle at 90% 100%, rgba(253, 185, 155, 0.1), transparent 45%)',
					fontFamily: 'Inter',
					border: '1px solid rgba(255,255,255,0.08)'
				},
				children: [
					{
						type: 'div',
						props: {
							style: { display: 'flex', alignItems: 'center', gap: '16px' },
							children: [
								{
									type: 'div',
									props: {
										style: {
											width: '48px',
											height: '48px',
											borderRadius: '12px',
											backgroundColor: 'rgba(124, 140, 248, 0.2)',
											border: '1px solid rgba(124, 140, 248, 0.4)',
											color: '#a5b4fc',
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											fontSize: '26px',
											fontWeight: 700
										},
										children: (config.title ?? 'D').charAt(0).toUpperCase()
									}
								},
								{
									type: 'div',
									props: {
										style: { fontSize: '28px', color: 'rgba(255,255,255,0.7)', fontWeight: 700 },
										children: siteName
									}
								}
							]
						}
					},
					{
						type: 'div',
						props: {
							style: { display: 'flex', flexDirection: 'column', gap: '24px' },
							children: [
								{
									type: 'div',
									props: {
										style: {
											fontSize: description ? '68px' : '84px',
											fontWeight: 700,
											color: '#f8fafc',
											lineHeight: 1.1
										},
										children: title
									}
								},
								...(description
									? [
											{
												type: 'div',
												props: {
													style: {
														fontSize: '30px',
														color: 'rgba(255,255,255,0.6)',
														lineHeight: 1.4
													},
													children: description
												}
											}
										]
									: [])
							]
						}
					}
				]
			}
		},
		{ width: 1200, height: 630, fonts: loadFonts() }
	);

	const png = await sharp(Buffer.from(svg)).png().toBuffer();

	return new Response(png, {
		headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=31536000, immutable' }
	});
};
