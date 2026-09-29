import type { APIRoute, GetStaticPaths } from 'astro';
import type satoriFn from 'satori';
import type sharpFn from 'sharp';
import fs from 'node:fs';
import config from 'virtual:lyvo-config';
import { listPages } from '@lyvo/lib/pages';
import { ogSlug } from '@lyvo/lib/seo';

interface PageMeta {
	title: string;
	description?: string;
}

export const getStaticPaths: GetStaticPaths = async () => {
	const home = { title: config.title, description: config.description };
	const pages = (await listPages()).map((page) => ({ path: page.path, meta: page }));
	return [{ path: '/', meta: home }, ...pages].map(({ path, meta }) => ({
		params: { slug: ogSlug(path) },
		props: { meta: { title: meta.title, description: meta.description } }
	}));
};

type Font = { name: string; data: Buffer; weight: 400 | 700; style: 'normal' };

let fonts: Font[] | null = null;

function loadFonts(): Font[] {
	fonts ??= config.og.fontPaths.flatMap((file, index) => {
		try {
			return [
				{
					name: 'Inter',
					data: fs.readFileSync(file),
					weight: index === 0 ? 400 : 700,
					style: 'normal'
				} as Font
			];
		} catch {
			return [];
		}
	});
	return fonts;
}

// import() of a CommonJS module can wrap its exports in default, sometimes twice.
function unwrap<T>(mod: any): T {
	const value = mod?.default ?? mod;
	return typeof value?.default === 'function' ? value.default : value;
}

async function renderers() {
	const modules = config.og.modules;
	if (!modules)
		throw new Error('[lyvo] OG images need satori and sharp, reinstall dependencies.');
	const [satori, sharp] = await Promise.all([import(modules.satori), import(modules.sharp)]);
	return { satori: unwrap<typeof satoriFn>(satori), sharp: unwrap<typeof sharpFn>(sharp) };
}

function truncate(value: string, max: number): string {
	return value.length > max ? `${value.slice(0, max - 1).trimEnd()}…` : value;
}

export const GET: APIRoute = async ({ props }) => {
	const meta = props.meta as PageMeta;
	// Satori renders strings as text, no escaping needed.
	const title = truncate(meta.title, 80);
	const description = meta.description ? truncate(meta.description.split('\n')[0], 140) : null;
	const siteName = config.title;
	const { satori, sharp } = await renderers();

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
										children: config.title.charAt(0).toUpperCase()
									}
								},
								{
									type: 'div',
									props: {
										style: {
											fontSize: '28px',
											color: 'rgba(255,255,255,0.7)',
											fontWeight: 700
										},
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
		headers: {
			'Content-Type': 'image/png',
			'Cache-Control': 'public, max-age=31536000, immutable'
		}
	});
};
