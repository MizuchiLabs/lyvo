<p align="center">
<img src="https://raw.githubusercontent.com/MizuchiLabs/lyvo/main/.github/logo.svg" width="80">
<br><br>
<img alt="npm version" src="https://img.shields.io/npm/v/@mizuchilabs/lyvo?color=brightgreen">
<img alt="GitHub License" src="https://img.shields.io/github/license/MizuchiLabs/lyvo">
</p>

# Lyvo

**Lyvo** turns an Astro project into a product site for your app: a landing page, MDX guides and an OpenAPI reference, from one integration. SEO, social images, search and LLM-friendly output are handled for you.

**Live demo:** [lyvo.mizuchi.dev](https://lyvo.mizuchi.dev)

## Key Features

- **Landing blocks**: Hero, feature grid, split showcase, code and browser windows, logo cloud, install command and CTA.
- **MDX guides**: Tabs, Callouts, Steps, FileTree, Accordion and more, with an auto-generated or hand-written sidebar.
- **OpenAPI reference**: Two-column endpoint pages, linked model pages, code samples in six languages and a try-it playground.
- **SEO by default**: Canonical URLs, hreflang, JSON-LD, sitemap, robots.txt and a generated OG image for every page.
- **LLM friendly**: `llms.txt`, `llms-full.txt`, a Markdown twin of every page (`/docs/intro.md`) and "open in ChatGPT/Claude" buttons.
- **Search and i18n**: Offline search with Pagefind, locale folders with translated UI strings.

## Installation

```bash
pnpm create astro@latest
pnpm add @mizuchilabs/lyvo @pagefind/component-ui sharp
```

Tailwind, MDX, the sitemap and Pagefind are wired up by the integration. You don't need to install or configure them yourself. `sharp` is Astro's image optimizer and has to live in your project, pnpm won't let Astro reach lyvo's copy.

## Quick Start

### 1. Configure Astro

```javascript
import { defineConfig } from 'astro/config';
import lyvo from '@mizuchilabs/lyvo';

export default defineConfig({
	site: 'https://my-app.dev', // needed for canonical URLs, OG images and the sitemap
	integrations: [
		lyvo({
			title: 'My App',
			description: 'Docs for My App',
			openapi: { input: 'public/openapi.json' }
		})
	]
});
```

That's a complete setup. Everything else is optional. A bigger example:

```javascript
lyvo({
	title: 'My App',
	lang: 'en',
	logo: 'brand-logo.svg', // src/assets/brand-logo.svg
	repo: { url: 'https://github.com/your-org/your-repo' },
	nav: [
		{ title: 'Docs', href: '/docs' },
		{ title: 'API', href: '/api' },
		{ title: 'Blog', href: '/blog' }
	],
	socials: [{ label: 'GitHub', href: 'https://github.com/your-org/your-repo', icon: 'github' }],
	docs: {
		sidebar: [
			'introduction',
			{ title: 'Guides', items: ['guides/install', 'guides/deploy'] },
			'---',
			{ title: 'Community', href: 'https://discord.gg/...' }
		]
	},
	openapi: [
		{ input: 'public/openapi.json', prefix: '/api' },
		{ input: 'public/v2.json', prefix: '/api/v2', title: 'API v2', snippets: ['curl', 'go'] }
	],
	i18n: {
		locales: ['de'],
		ui: { de: { onThisPage: 'Auf dieser Seite' } }
	},
	customCss: ['./src/styles/custom.css']
});
```

Unknown or misspelled options fail the build with a clear message.

### 2. Set up content collections

```typescript
// src/content.config.ts
import { defineLyvoCollections } from '@mizuchilabs/lyvo/collections';

export const collections = defineLyvoCollections();
```

Spread it if you have collections of your own: `{ ...defineLyvoCollections(), blog }`.

### 3. Theme (optional)

Files in `customCss` join the theme's Tailwind root, so token overrides work directly. Don't import `tailwindcss` in them, lyvo already does.

```css
@theme {
	--color-primary: oklch(0.5 0.2 250);
}
```

## What you get automatically

| Output                            | Notes                                                                                                                                                       |
| :-------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/docs/...`, `/<locale>/docs/...` | Guides from `src/content/docs`. Untranslated pages fall back to the default locale.                                                                         |
| `/api/...`                        | Overview, one page per endpoint and webhook, and `/api/schemas/<model>` pages.                                                                              |
| `/og/*.png`                       | A 1200x630 social image per page. Pages without one use the site image.                                                                                     |
| `<page>.md`                       | Markdown twin of every docs and API page, linked from `<head>` and the "Copy page" menu. MDX components are converted to plain Markdown.                    |
| `/llms.txt`, `/llms-full.txt`     | Index and all docs in one file for LLMs, following [llmstxt.org](https://llmstxt.org). The index links one overview per API spec instead of every endpoint. |
| `<prefix>/llms-full.txt`          | Full reference of one API spec in one file, like `/api/llms-full.txt`.                                                                                      |
| `/sitemap-index.xml`              | With hreflang alternates when locales are configured.                                                                                                       |
| `/robots.txt`                     | Skipped when you ship your own in `public/` or `src/pages/`.                                                                                                |
| `/404`                            | Skipped when you have `src/pages/404.astro`.                                                                                                                |
| `<head>`                          | Canonical, hreflang, Open Graph, Twitter cards and JSON-LD (`WebSite`, `TechArticle`, `BreadcrumbList`).                                                    |

## Navigation

- **Section picker**: Guides and every API spec show up as sections in a picker at the top of the sidebar, each with its own sidebar.
- **Frontmatter**: `icon` (a Lucide name like `rocket` or an SVG in `src/assets`) and `badge` (like `New`) decorate a page's sidebar entry.
- **Languages**: the sidebar footer has a language menu that marks pages without a translation. Untranslated pages show a notice and fall back to the default language.
- **Theme**: light, dark or system, remembered per visitor.
- **External links**: links to other sites open in a new tab and get a small arrow, in content and in the sidebar.
- **Mobile**: one sticky bar with the menu, the current section and page, and search. The menu is a native `<dialog>` drawer.

## Configuration Options

| Option                 | Type                                                                      | Description                                                                                                                                                   |
| :--------------------- | :------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `title`                | `string`                                                                  | Site title. Default `'Docs'`.                                                                                                                                 |
| `description`          | `string`                                                                  | Fallback meta and OG description.                                                                                                                             |
| `lang`                 | `string`                                                                  | Default locale. Default `'en'`.                                                                                                                               |
| `logo`                 | `string \| {light, dark}`                                                 | File name in `src/assets/`.                                                                                                                                   |
| `favicon`              | `{svg?, ico?}`                                                            | Override the default favicon paths.                                                                                                                           |
| `nav`                  | `Array<{title, href}>`                                                    | Landing header links. Also listed in the docs sidebar footer. Defaults to Docs and API.                                                                       |
| `repo`                 | `{url, branch?}`                                                          | Enables "Edit page" links. `branch` defaults to `'main'`.                                                                                                     |
| `socials`              | `Array<{label, href, icon}>`                                              | Header and footer icons. `icon` is a file in `src/assets/` or a Lucide name.                                                                                  |
| `footer`               | `{note?, columns?}`                                                       | Landing footer with link columns.                                                                                                                             |
| `docs.prefix`          | `string`                                                                  | Route prefix for guides. Default `'/docs'`.                                                                                                                   |
| `docs.edit`            | `boolean`                                                                 | Show "Edit page" links. Default `true`.                                                                                                                       |
| `docs.feedback`        | `boolean`                                                                 | Show the feedback widget. Default `true`. Emits a `lyvo:feedback` event on `window`.                                                                          |
| `docs.sidebar`         | `SidebarItem[]`                                                           | Doc ids, `'---'` separators, `{title, items}` groups (nestable) and `{title, href}` links. Omit it to build the sidebar from folders and frontmatter `order`. |
| `openapi`              | `Spec \| Spec[]`                                                          | See below. Multiple specs need nested prefixes sharing a root (`/api`, `/api/v2`).                                                                            |
| `openapi[].input`      | `string`                                                                  | Path to the spec, relative to the project root. An invalid spec fails the build.                                                                              |
| `openapi[].prefix`     | `string`                                                                  | Route prefix. Default `'/api'`.                                                                                                                               |
| `openapi[].groupBy`    | `'tag' \| 'path'`                                                         | Sidebar grouping. Default `'tag'`.                                                                                                                            |
| `openapi[].snippets`   | `Array<'curl' \| 'javascript' \| 'python' \| 'go' \| 'csharp' \| 'java'>` | Code sample languages, in order. Default `curl`, `javascript`, `python`, `go`.                                                                                |
| `openapi[].playground` | `boolean`                                                                 | Show the "Try it" panel. Default `true`. Requests run in the browser, so the API must allow CORS from your docs origin.                                       |
| `i18n`                 | `{locales?, ui?}`                                                         | Extra locales (content in `src/content/docs/<code>/`) and translated UI strings per locale.                                                                   |
| `og`                   | `{generate?, image?}`                                                     | `generate` (default `true`) renders per-page images. `image` sets a static site image instead.                                                                |
| `llms`                 | `boolean`                                                                 | `llms.txt`, `llms-full.txt`, Markdown twins and page actions. Default `true`.                                                                                 |
| `mermaid`              | `boolean`                                                                 | Render ` ```mermaid ` code blocks as diagrams. Mermaid only loads on pages that have one. Default `true`.                                                     |
| `search`               | `boolean`                                                                 | Pagefind search. Default `true`.                                                                                                                              |
| `sitemap`              | `boolean`                                                                 | Add `@astrojs/sitemap` unless you already use it. Default `true`.                                                                                             |
| `robots`               | `boolean`                                                                 | Generate `robots.txt`. Default `true`.                                                                                                                        |
| `analytics`            | `{umami?, plausible?, posthog?, matomo?}`                                 | See [Analytics](#analytics).                                                                                                                                  |
| `head`                 | `string`                                                                  | Raw HTML added to every `<head>`.                                                                                                                             |
| `customCss`            | `string[]`                                                                | CSS files merged into the theme stylesheet.                                                                                                                   |

Canonical URLs follow Astro's `trailingSlash` and `build.format` settings, so they match the sitemap.

### Serving from a subpath

Astro's `base` option works out of the box, for example `base: '/my-app'` for GitHub Pages. Every generated link, the sitemap, `robots.txt`, `llms.txt` and OG images include it. Links in your config, in landing blocks and in Markdown content can be written as plain site paths (`/docs/intro`), lyvo adds the base for you. Links that already include it are left alone.

## Analytics

Analytics are self-hosted only and private by default, so the docs work for EU sites without a consent banner. Every provider needs the URL of your own instance. Nothing is sent to a vendor cloud, and scripts only load in production builds. In `astro dev`, events are logged to the browser console instead.

```js
lyvo({
	analytics: {
		umami: { websiteId: 'your-id', src: 'https://stats.example.eu/script.js' }
		// plausible: { domain: 'docs.example.eu', src: 'https://plausible.example.eu/js/script.js' }
		// posthog: { apiKey: 'phc_...', host: 'https://posthog.example.eu' }
		// matomo: { url: 'https://matomo.example.eu', siteId: '1' }
	}
});
```

| Provider  | Private defaults                                                                                                                                               |
| :-------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Umami     | Cookieless, honors Do Not Track, drops query strings and hashes.                                                                                               |
| Plausible | Cookieless by design.                                                                                                                                          |
| PostHog   | In-memory persistence (no cookies or storage), no autocapture, no session recording, honors Do Not Track. `cookies: true` opts back in to persistent visitors. |
| Matomo    | Cookies disabled, honors Do Not Track. `cookies: true` opts back in.                                                                                           |

### Events

Lyvo reports these interactions to the configured provider:

| Event                   | Properties                                         |
| :---------------------- | :------------------------------------------------- |
| `docs_feedback`         | `helpful`, `path`, `locale`                        |
| `docs_feedback_comment` | `helpful`, `path`, `locale`, `comment`             |
| `page_copy`             | `path`                                             |
| `page_action`           | `action` (`markdown`, `chatgpt`, `claude`), `path` |
| `code_copy`             | `path`                                             |
| `playground_request`    | `endpoint`, `status` (never the payload)           |
| `not_found`             | `path`                                             |

Umami and Plausible receive every property as a string. Plausible needs a goal per event name before it shows them. Matomo gets them as events with category `lyvo`, the event name as action and the path as label.

Every event is also dispatched on `window` as `lyvo:track` with `{ name, props }`, so you can forward it anywhere yourself:

```js
window.addEventListener('lyvo:track', (e) => {
	const { name, props } = e.detail;
});
```

### Feedback

The "Was this page helpful?" widget remembers the vote per page. After a "No", it asks what was missing when analytics are configured, and links to a prefilled issue when `repo` is set (GitHub, GitLab, Gitea and Forgejo). The `lyvo:feedback` event on `window` keeps firing with `{ helpful, path, title, locale, comment? }` for custom handlers.

## Customizing the Landing Header

The default top navigation bar (logo, nav links, socials, theme toggle) is generated by Lyvo. If you're building your own landing page and want full control over the header, you can replace it by passing a `header` slot to the `<Layout>` component. The docs and OpenAPI pages keep their own generated chrome. Only the landing layout is overridable.

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
			<a href="/" class="font-bold">
				My Brand
			</a>
			<nav class="flex items-center gap-4">
				<a href="/pricing">Pricing</a>
				<a href="/docs">Docs</a>
			</nav>
		</div>
	</header>

	<main>Your landing content</main>
</Layout>
```

When no `header` slot is provided, the generated navigation bar is used. A `<slot name="header-actions">` lets you add items (e.g. search) to the generated header without replacing it, and `<slot name="footer">` replaces the generated footer.

### Landing Building Blocks

Props-driven blocks live under `@mizuchilabs/lyvo/components/landing/*`. They only use theme tokens, so they follow your colors and dark mode.

| Block            | What it does                                                                                           |
| :--------------- | :----------------------------------------------------------------------------------------------------- |
| `Hero`           | Title with gradient highlight, badge (optionally a link), buttons, install command and a `media` slot. |
| `FeatureGrid`    | Cards with Lucide icons (`icon: 'zap'`) or your own SVGs.                                              |
| `FeatureSplit`   | Text with check points next to any media. `reverse` flips the sides.                                   |
| `CodeWindow`     | Highlighted code in a window frame with a file name.                                                   |
| `BrowserFrame`   | Screenshot (`src`) or any content in a browser window with a URL bar.                                  |
| `LogoCloud`      | Logos or names of users, sponsors or integrations.                                                     |
| `InstallCommand` | Copyable command, with tabs when you pass `{ pnpm, npm, bun }`.                                        |
| `CTA`            | Closing call to action.                                                                                |
| `LinkButton`     | The primary and secondary buttons used above.                                                          |

```astro
---
import Layout from '@mizuchilabs/lyvo/layouts/Layout.astro';
import Hero from '@mizuchilabs/lyvo/components/landing/Hero.astro';
import FeatureSplit from '@mizuchilabs/lyvo/components/landing/FeatureSplit.astro';
import BrowserFrame from '@mizuchilabs/lyvo/components/landing/BrowserFrame.astro';
import screenshot from '../assets/dashboard.png';
---

<Layout description="My App keeps your deploys boring.">
	<Hero
		badge={{ label: 'v2 is out', href: '/docs/changelog' }}
		title="Deploys,"
		highlight="without the drama."
		primary={{ label: 'Get started', href: '/docs' }}
		install={{ pnpm: 'pnpm add my-app', npm: 'npm i my-app' }}
	>
		<BrowserFrame slot="media" src={screenshot} alt="Dashboard" url="app.my-app.dev" />
	</Hero>
	<FeatureSplit title="Rollbacks in one click" points={['Instant', 'Audited']}>
		<BrowserFrame src={screenshot} alt="Rollbacks" />
	</FeatureSplit>
</Layout>
```

`Layout` takes `title`, `description`, `image` and `noindex` for SEO. `Footer` renders from the `footer` option and is left out when empty.

## Internationalization

Lyvo uses locale subfolders. The default locale lives at the content root, other locales in subfolders:

```
src/content/docs/
├── introduction.mdx        ← English (default), served at /docs/introduction
└── de/
    └── introduction.mdx    ← German, served at /de/docs/introduction
```

UI strings ("On this page", "Was this page helpful?", etc.) come from the `i18n.ui` config. A language switcher appears in the sidebar footer when locales are configured. API reference pages are language-neutral.

Editing the OpenAPI spec needs a dev server restart. Docs content hot-reloads as usual.

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
