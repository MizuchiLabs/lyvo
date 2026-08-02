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
					order: ['introduction', 'components'],
					labels: {
						introduction: 'Introduction'
					}
				}
			},
			openapi: {
				input: 'public/openapi.json',
				groupBy: 'tag'
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

If you specified a `customCss` file to override the default theme, you MUST import the default styles inside it. Create `src/styles/custom.css`:

```css
@import 'tailwindcss';
@import '@mizuchilabs/lyvo/style.css';

/* Your custom theme overrides here */
@theme {
	--color-primary: oklch(0.5 0.2 250);
}
```

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

| Option            | Type                         | Description                                                                                               |
| :---------------- | :--------------------------- | :-------------------------------------------------------------------------------------------------------- |
| `title`           | `string`                     | The title of your documentation site. Set to `""` to hide the text.                                       |
| `lang`            | `string`                     | The language attribute for the HTML tag (e.g., `"en"`).                                                   |
| `logo`            | `string`                     | Filename of an SVG in your `src/assets/` folder (e.g., `"brand.svg"`).                                    |
| `nav`             | `Array<{title, href}>`       | Override the default top navigation bar links.                                                            |
| `repo.url`        | `string`                     | URL to your GitHub/GitLab repository.                                                                     |
| `repo.branch`     | `string`                     | The default branch (used for "Edit this page" links).                                                     |
| `socials`         | `Array<{label, href, icon}>` | Array of social links. `icon` should match a filename in `src/assets/`.                                   |
| `extraLinks`      | `Array<{title, href}>`       | Additional text links to show in the sidebar footer.                                                      |
| `docs.edit`       | `boolean`                    | Whether to show "Edit this page" links.                                                                   |
| `docs.feedback`   | `boolean`                    | Whether to show "Give feedback" links.                                                                    |
| `docs.sidebar`    | `object`                     | Sidebar structure defining `order` array and `labels` mapping.                                            |
| `openapi.input`   | `string`                     | Path to your OpenAPI JSON file.                                                                           |
| `openapi.groupBy` | `'tag' \| 'path'`            | How to group API endpoints.                                                                               |
| `head`            | `string`                     | Raw HTML/scripts injected into `<head>` on **every** page (landing + docs). Great for analytics snippets. |

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

When no `header` slot is provided, the generated navigation bar is used as a fallback. You can reuse the exported `Logo` and `ThemeToggle` components (`@mizuchilabs/lyvo/components/base/*`) inside your custom header if you want to keep those behaviors.

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
