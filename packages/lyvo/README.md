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
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import lyvo from "@mizuchilabs/lyvo";

export default defineConfig({
  integrations: [
    lyvo({
      title: "My Docs",
      logo: "brand-logo.svg", // Resolves from src/assets/brand-logo.svg
      repo: {
        url: "https://github.com/your-org/your-repo",
        branch: "main",
      },
      nav: [
        { title: "Home", href: "/" },
        { title: "Docs", href: "/docs" },
        { title: "API", href: "/api" },
      ],
      socials: [
        {
          label: "GitHub",
          href: "https://github.com/your-org/your-repo",
          icon: "github.svg", // Resolves from src/assets/github.svg
        },
      ],
      openapi: {
        input: "public/openapi.json",
        groupBy: "tag",
      },
      customCss: ["./src/styles/custom.css"],
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
```

### 2. Configure Custom Theme (Optional)

If you specified a `customCss` file to override the default theme, you MUST import the default styles inside it. Create `src/styles/custom.css`:

```css
@import "tailwindcss";
@import "@mizuchilabs/lyvo/style.css";

/* Your custom theme overrides here */
@theme {
  --color-primary: oklch(0.5 0.2 250);
}
```

### 3. Set up Content Collections

Create `src/content.config.ts` to define your documentation and API collections:

```typescript
import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { docsSchema, openapiLoader } from "@mizuchilabs/lyvo/schema";

const docs = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/docs" }),
  schema: docsSchema,
});

const api = defineCollection({
  loader: openapiLoader({ input: "public/openapi.json", groupBy: "tag" }),
});

export const collections = { docs, api };
```

## Configuration Options

The `lyvo()` integration accepts the following options:

| Option            | Type                         | Description                                                             |
| :---------------- | :--------------------------- | :---------------------------------------------------------------------- |
| `title`           | `string`                     | The title of your documentation site. Set to `""` to hide the text.     |
| `logo`            | `string`                     | Filename of an SVG in your `src/assets/` folder (e.g., `"brand.svg"`).  |
| `nav`             | `Array<{title, href}>`       | Override the default top navigation bar links.                          |
| `repo.url`        | `string`                     | URL to your GitHub/GitLab repository.                                   |
| `repo.branch`     | `string`                     | The default branch (used for "Edit this page" links).                   |
| `socials`         | `Array<{label, href, icon}>` | Array of social links. `icon` should match a filename in `src/assets/`. |
| `extraLinks`      | `Array<{title, href}>`       | Additional text links to show in the sidebar footer.                    |
| `docs.edit`       | `boolean`                    | Whether to show "Edit this page" links.                                 |
| `docs.feedback`   | `boolean`                    | Whether to show "Give feedback" links.                                  |
| `openapi.input`   | `string`                     | Path to your OpenAPI JSON file.                                         |
| `openapi.groupBy` | `'tag' \| 'path'`            | How to group API endpoints.                                             |

## Built-in MDX Components

Lyvo includes several components to help you write better documentation:

- `<Tabs>` and `<TabItem>`: For switching between different code languages or contexts.
- `<Callout>`: For highlighting important information (info, warning, error, etc.).
- `<Steps>` and `<Step>`: For step-by-step tutorials.
- `<Accordion>`: For collapsible content.
- `<FileTree>`: For illustrating project structures.

## License

Apache-2.0 © [MizuchiLabs](https://github.com/MizuchiLabs)
