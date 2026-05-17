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

```bash
pnpm add @mizuchilabs/lyvo
```

You will also need to install its peer dependencies if they aren't already in your project:

```bash
pnpm add @astrojs/mdx @astrojs/react @tailwindcss/vite tailwindcss react react-dom
```

## Quick Start

### 1. Configure Astro

Add the `lyvo` integration to your `astro.config.mjs`:

```javascript
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import react from "@astrojs/react";
import mdx from "@astrojs/mdx";
import lyvo from "@mizuchilabs/lyvo";

export default defineConfig({
  integrations: [
    lyvo({
      title: "My Docs",
      repo: {
        url: "https://github.com/your-org/your-repo",
        branch: "main",
      },
      openapi: {
        input: "public/openapi.json",
        groupBy: "tag",
      },
    }),
    react(),
    mdx(),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
```

### 2. Set up Content Collections

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

| Option            | Type                     | Description                                           |
| :---------------- | :----------------------- | :---------------------------------------------------- |
| `title`           | `string`                 | The title of your documentation site.                 |
| `repo.url`        | `string`                 | URL to your GitHub/GitLab repository.                 |
| `repo.branch`     | `string`                 | The default branch (used for "Edit this page" links). |
| `socials`         | `Record<string, string>` | Map of social platform names to profile URLs.         |
| `extraLinks`      | `Array<{title, href}>`   | Additional links to show in the header.               |
| `docs.edit`       | `boolean`                | Whether to show "Edit this page" links.               |
| `docs.feedback`   | `boolean`                | Whether to show "Give feedback" links.                |
| `openapi.input`   | `string`                 | Path to your OpenAPI JSON file.                       |
| `openapi.groupBy` | `'tag' \| 'path'`        | How to group API endpoints.                           |

## Built-in MDX Components

Lyvo includes several components to help you write better documentation:

- `<Tabs>` and `<TabItem>`: For switching between different code languages or contexts.
- `<Callout>`: For highlighting important information (info, warning, error, etc.).
- `<Steps>` and `<Step>`: For step-by-step tutorials.
- `<Accordion>`: For collapsible content.
- `<FileTree>`: For illustrating project structures.

## License

Apache-2.0 © [MizuchiLabs](https://github.com/MizuchiLabs)
