<p align="center">
<img src="./.github/logo.svg" width="80">
<br><br>
<img alt="npm Version" src="https://img.shields.io/npm/v/%40mizuchilabs%2Flyvo?link=https%3A%2F%2Fwww.npmjs.com%2Fpackage%2F%40mizuchilabs%2Flyvo">
<img alt="GitHub License" src="https://img.shields.io/github/license/MizuchiLabs/lyvo">
<img alt="GitHub Issues or Pull Requests" src="https://img.shields.io/github/issues/MizuchiLabs/lyvo">
</p>

# Lyvo

Lyvo is an [Astro](https://astro.build/) integration that gives your app a landing page, docs and an API reference in one site, with SEO and LLM-friendly output handled for you.

## Project Structure

This project is a monorepo managed with `pnpm` workspaces:

- `packages/lyvo/`: The core Astro integration and UI components. This is the main package.
- `apps/demo/`: A demo Astro application using the `lyvo` package. Use this for local testing and development.

## Development Setup

To get started with development:

1. **Install dependencies:**

    ```bash
    pnpm install
    ```

2. **Start the dev server:**
    ```bash
    pnpm dev
    ```
    This will spin up the `apps/demo` site where you can preview changes to the package.

## Features

- **One site for your app:** Landing page, MDX guides (`/docs`) and API reference (`/api`) share one theme and one config.
- **OpenAPI reference:** Two-column endpoint pages, linked model pages, code samples and a try-it playground. Multiple specs with nested prefixes (`/api`, `/api/v2`).
- **SEO on autopilot:** Canonicals, hreflang, JSON-LD, sitemap, robots.txt and a generated OG image per page.
- **LLM friendly:** `llms.txt`, `llms-full.txt`, a Markdown twin of every page and "open in ChatGPT/Claude" page actions.
- **Landing blocks:** Hero, FeatureGrid, FeatureSplit, CodeWindow, BrowserFrame, LogoCloud, InstallCommand and CTA.
- **Search and i18n:** Offline Pagefind search, locale folders and translated UI strings.

## Configuration

```javascript
lyvo({
	title: 'My App',
	logo: 'logo.svg', // src/assets/logo.svg
	repo: { url: 'https://github.com/...' },
	docs: { sidebar: ['introduction', { title: 'Guides', items: ['install'] }, '---'] },
	openapi: { input: 'public/openapi.json' },
	i18n: { locales: ['de'] }
});
```

All options are in the [package README](./packages/lyvo/README.md).

## Building the Demo

To build the demo application for production (which also runs the Pagefind indexer):

```bash
pnpm build
```

## License

Apache License 2.0 - See [LICENSE](LICENSE)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
