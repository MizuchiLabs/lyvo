<p align="center">
<img src="https://raw.githubusercontent.com/MizuchiLabs/lyvo/main/.github/logo.svg" width="80">
<br><br>
<img alt="npm version" src="https://img.shields.io/npm/v/@mizuchilabs/lyvo?color=brightgreen">
<img alt="GitHub License" src="https://img.shields.io/github/license/MizuchiLabs/lyvo">
</p>

# Lyvo

**Lyvo** is a highly polished, minimalistic, and modern documentation generator for [Astro](https://astro.build/). It provides a seamless experience for building both technical guides and rich API references.

## Key Features

- **Modern UI**: Polished, responsive design with native dark mode.
- **MDX Guides**: First-class support for MDX with built-in components like Tabs, Callouts, and Steps.
- **OpenAPI Support**: Automatic API reference generation from OpenAPI/Swagger definitions.
- **Fast Search**: Lightning-fast offline search powered by [Pagefind](https://pagefind.app/).
- **Integrated Navigation**: Automatic sidebar, breadcrumbs, and Table of Contents.
- **Developer Experience**: Built with TypeScript and Tailwind CSS for easy customization.

## Installation

Setup astro:

```bash
pnpm create astro@latest
```

Install lyvo:

```bash
pnpm add @mizuchilabs/lyvo
```

You will also need to install its peer dependencies if they aren't already in your project:

```bash
pnpm add @tailwindcss/vite tailwindcss
```

## Quick Start

Lyvo works with an empty `lyvo()` call. Out of the box you get: a `/docs` section with an auto-generated sidebar from your folder structure, dark mode, offline search, sitemap, `llms.txt`, and native locale labels (English, Deutsch, ...) via `Intl.DisplayNames`. Everything below is customization.

### 1. Configure Astro

Add the `lyvo` integration to your `astro.config.mjs`:

```javascript
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import lyvo from '@mizuchilabs/lyvo';

export default defineConfig({
	integrations: [
		lyvo({
			title: 'My Docs',
			description: 'Documentation for my project',
			lang: 'en',
			logo: 'brand-logo.svg', // Resolves from src/assets/brand-logo.svg
			repo: {
				url: 'https://github.com/your-org/your-repo',
				branch: 'main'
			},
			nav: [
				{ title: 'Home', href: '/' },
				{ title: 'Docs', href: '/docs' },
				{ title: 'API', href: '/api' }
			],
			socials: [
				{
					label: 'GitHub',
					href: 'https://github.com/your-org/your-repo',
					icon: 'github.svg' // Resolves from src/assets/github.svg
				}
			],
			docs: {
				sidebar: {
					items: [
						'introduction',
						{ title: 'Guides', items: ['guides/install', 'guides/deploy'] },
						'---', // separator
						{ title: 'Community', href: 'https://discord.gg/...' }
					]
				}
			},
			openapi: [
				{ input: 'public/openapi.json', prefix: '/api', groupBy: 'tag' }
				// add more specs with nested prefixes: { input: 'public/v2.json', prefix: '/api/v2' }
			],
			i18n: {
				defaultLocale: 'en',
				locales: [{ code: 'de', label: 'Deutsch' }],
				ui: { de: { onThisPage: 'Auf dieser Seite' } }
			},
			og: {
				siteName: 'My Docs',
				generate: true // auto-generates per-page OG images with satori
			},
			customCss: ['/src/styles/custom.css']
		})
	],
	vite: {
		plugins: [tailwindcss()]
	}
});
```

### 2. Configure Custom Theme (Optional)

The default theme stylesheet is always loaded, and files listed in `customCss` are appended into the same Tailwind root, so `@theme` overrides work directly:

```css
/* Your custom theme overrides here */
@theme {
	--color-primary: oklch(0.5 0.2 250);
}
```

An `@import 'tailwindcss'` or `@import '@mizuchilabs/lyvo/style.css'` in a custom file is stripped automatically, so configs written for earlier versions keep working. Custom CSS must live inside the project (absolute paths work too); relative `@import`/`url()` targets are rebased automatically.

### 3. Set up Content Collections

Create `src/content.config.ts` to define your documentation and API collections:

```typescript
import { defineLyvoCollections } from '@mizuchilabs/lyvo/collections';
import { defineCollection } from 'astro:content';

export const collections = {
	...defineLyvoCollections(),
	blog: defineCollection({/* custom stuff */})
};
```

## Configuration Options

The `lyvo()` integration accepts the following options:

| Option                     | Type                                          | Description                                                                                                                                                                                                                            |
| :------------------------- | :-------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `title`                    | `string`                                      | The title of your documentation site. Set to `""` to hide the text.                                                                                                                                                                    |
| `description`              | `string`                                      | Site description, used as the meta/OG description fallback.                                                                                                                                                                            |
| `lang`                     | `string`                                      | Default locale code. Shorthand for `i18n.defaultLocale`.                                                                                                                                                                               |
| `logo`                     | `string \| {light, dark}`                     | Filename of an image in your `src/assets/` folder.                                                                                                                                                                                     |
| `favicon`                  | `{svg?, ico?}`                                | Override the default favicon paths.                                                                                                                                                                                                    |
| `nav`                      | `Array<{title, href}>`                        | Override the default top navigation bar links.                                                                                                                                                                                         |
| `repo.url` / `repo.branch` | `string`                                      | Repository URL and branch for "Edit this page" links.                                                                                                                                                                                  |
| `socials`                  | `Array<{label, href, icon}>`                  | Social links shown in the header and footer. `icon` resolves from `src/assets/`.                                                                                                                                                       |
| `extraLinks`               | `Array<{title, href}>`                        | Additional text links shown in the sidebar footer.                                                                                                                                                                                     |
| `footer`                   | `{note?, columns?}`                           | Landing page footer with link columns.                                                                                                                                                                                                 |
| `docs.prefix`              | `string`                                      | Route prefix for guides. Default `'/docs'`.                                                                                                                                                                                            |
| `docs.edit`                | `boolean`                                     | Whether to show "Edit this page" links. Default `true`.                                                                                                                                                                                |
| `docs.feedback`            | `boolean`                                     | Whether to show the feedback widget. Default `true`. Feedback is emitted as a `lyvo:feedback` CustomEvent on `window` with `{ helpful, path, title, locale }`.                                                                         |
| `docs.sidebar`             | `{items?}` or `{order?, labels?}`             | Sidebar structure. `items` supports strings (doc slugs or `'---'` separators), nested categories and external links. The legacy `order`/`labels` shape still works.                                                                    |
| `openapi`                  | `{input, prefix?, groupBy?, title?}` or array | OpenAPI spec(s). Multiple specs need nested prefixes sharing a root (`/api`, `/api/v2`).                                                                                                                                               |
| `i18n`                     | `{defaultLocale?, locales?, ui?}`             | Locale subfolder-based i18n. Default locale content lives at the content root, other locales in subfolders (`src/content/docs/de/`). `ui` maps locale codes to translated UI strings.                                                  |
| `og`                       | `boolean \| {siteName?, image?, generate?}`   | Open Graph meta tags are always on. `og: true` or `og.generate: true` also generates a per-page OG image at build time. Requires `sharp` (Astro already depends on it, but pnpm users may need `pnpm add sharp` for image generation). |
| `llms`                     | `boolean`                                     | Generate `/llms.txt` and `/llms-full.txt` endpoints. Default `true`.                                                                                                                                                                   |
| `search`                   | `boolean`                                     | Enable Pagefind search. Default `true`.                                                                                                                                                                                                |
| `sitemap`                  | `boolean`                                     | Inject the sitemap integration (skipped if you already use one). Default `true`.                                                                                                                                                       |
| `cacheHeaders`             | `boolean`                                     | Append Cloudflare `_headers` rules with `no-cache` for the docs prefix. Default `false`.                                                                                                                                               |
| `analytics`                | `{umami?, plausible?, posthog?, matomo?}`     | Load an analytics provider and forward built-in events to it. See [Analytics](#analytics).                                                                                                                                             |
| `head`                     | `string`                                      | Raw HTML injected into `<head>` on every page. Great for analytics snippets.                                                                                                                                                           |
| `customCss`                | `string[]`                                    | CSS files appended after the default theme stylesheet.                                                                                                                                                                                 |

Unknown options are reported as build warnings, so typos don't fail silently.

## Analytics

Set the `analytics` option to load a supported provider and forward the docs feedback event to it. Providers included: Umami, Plausible, PostHog and Matomo.

```js
lyvo({
	analytics: {
		umami: {
			websiteId: 'your-website-id',
			// optional, defaults to the Umami Cloud script
			src: 'https://eu.umami.is/script.js',
			// optional, comma-separated list of domains
			domains: 'docs.example.com'
		}
	}
});
```

```js
lyvo({
	analytics: {
		plausible: {
			domain: 'docs.example.com',
			// optional, defaults to https://plausible.io/js/script.js
			src: 'https://plausible.example.com/js/script.js'
		}
	}
});
```

```js
lyvo({
	analytics: {
		posthog: {
			apiKey: 'phc_your_project_token',
			// optional, defaults to https://us.i.posthog.com
			host: 'https://eu.i.posthog.com'
		}
	}
});
```

```js
lyvo({
	analytics: {
		matomo: {
			url: 'https://analytics.example.com',
			siteId: '1'
		}
	}
});
```

When a provider is configured, clicking Yes or No on the feedback widget sends a `docs_feedback` event with the properties `helpful`, `path`, `title` and `locale`. Umami and Plausible only accept string event properties, so `helpful` arrives as `"true"`/`"false"` there. Matomo uses its native `trackEvent` API with category `docs` and action `feedback`.

Pageview tracking for client-side navigation works out of the box for Umami, Plausible and PostHog. Matomo gets replayed pageviews via Astro's view transitions router.

To use a different provider or send custom events, listen for the `lyvo:feedback` event yourself through the `head` option:

```js
lyvo({
	head: `
		<script>
			window.addEventListener('lyvo:feedback', (e) => {
				const { helpful, path, title, locale } = e.detail;
				// send to your tracker of choice
			});
		</script>
	`
});
```

## Customizing the Landing Header

The default top navigation bar (logo, nav links, socials, theme toggle) is generated by Lyvo. If you're building your own landing page and want full control over the header, you can replace it by passing a `header` slot to the `<Layout>` component. The docs and OpenAPI pages keep their own generated chrome — only the landing layout is overridable.

```astro
---
import Layout from '@mizuchilabs/lyvo/layouts/Layout.astro';
---

<Layout>
	<header
		slot="header"
		class="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur"
	>
		<div class="container mx-auto flex h-14 items-center justify-between">
			<a href="/" class="font-bold">My Brand</a>
			<nav class="flex items-center gap-4">
				<a href="/pricing">Pricing</a>
				<a href="/docs">Docs</a>
			</nav>
		</div>
	</header>

	<main>Your landing content</main>
</Layout>
```

When no `header` slot is provided, the generated navigation bar is used as a fallback. A `<slot name="header-actions">` lets you add items (e.g. search) to the generated header without replacing it, and `<slot name="footer">` replaces the generated footer.

### Landing Building Blocks

Lyvo ships a few props-driven blocks for landing pages under `@mizuchilabs/lyvo/components/landing/*`:

```astro
---
import Layout from '@mizuchilabs/lyvo/layouts/Layout.astro';
import Hero from '@mizuchilabs/lyvo/components/landing/Hero.astro';
import FeatureGrid from '@mizuchilabs/lyvo/components/landing/FeatureGrid.astro';
import CTA from '@mizuchilabs/lyvo/components/landing/CTA.astro';
---

<Layout>
	<Hero
		badge="Open Source"
		title="Docs that feel"
		highlight="effortless."
		description="Guides, API reference and landing page in one setup."
		primary={{ label: 'Get Started', href: '/docs' }}
		secondary={{ label: 'GitHub', href: 'https://github.com/...' }}
	/>
	<FeatureGrid
		title="Everything included"
		features={[
			{ title: 'Search', description: 'Offline search via Pagefind.', icon: 'search.svg' }
		]}
	>
		<!-- optional: extra content below the grid -->
	</FeatureGrid>
	<CTA
		title="Ready to build?"
		description="Clone and ship."
		primary={{ label: 'Get Started', href: '/docs' }}
	/>
</Layout>
```

`Footer` (`@mizuchilabs/lyvo/components/base/Footer.astro`) renders automatically from the `footer` config option; a footer config is optional, and the footer is omitted when empty.

## Internationalization

Lyvo uses locale subfolders. The default locale lives at the content root, other locales in subfolders:

```
src/content/docs/
├── introduction.mdx        ← English (default), served at /docs/introduction
└── de/
    └── introduction.mdx    ← German, served at /de/docs/introduction
```

UI strings ("On this page", "Was this page helpful?", etc.) come from the `i18n.ui` config. A language switcher appears in the sidebar footer when locales are configured. API reference pages are language-neutral.

Note: editing the OpenAPI spec requires a dev server restart in dev; the sidebar and docs content hot-reload as usual.

## Built-in MDX Components

Lyvo includes several components to help you write better documentation:

- `<Tabs>` and `<TabItem>`: For switching between different code languages or contexts. Example:
    ```mdx
    <Tabs>
    	<TabItem value="npm">
    		<Code code="npm install" lang="bash" />
    	</TabItem>
    	<TabItem value="yarn">
    		<Code code="yarn add" lang="bash" />
    	</TabItem>
    </Tabs>
    ```
- `<Callout>`: For highlighting important information (info, warning, error, etc.).
- `<Steps>` and `<Step>`: For step-by-step tutorials.
- `<Accordion>`: For collapsible content.
- `<FileTree>`: For illustrating project structures.

## License

Apache-2.0 © [MizuchiLabs](https://github.com/MizuchiLabs)
