<p align="center">
<img src="./.github/logo.svg" width="80">
<br><br>
<img alt="GitHub Tag" src="https://img.shields.io/github/v/tag/MizuchiLabs/lyvo?label=Version">
<img alt="GitHub License" src="https://img.shields.io/github/license/MizuchiLabs/lyvo">
</p>

# Lyvo

Lyvo is a highly polished, minimalistic, and modern documentation generator package for [Astro](https://astro.build/). It provides a solid foundation to build custom documentation sites and rich API references quickly.

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

- **Unified Layout:** Seamlessly switch between Markdown guides (`/docs`) and API references (`/api`) with a smooth, morphing transition.
- **Scalar-like API Docs:** A dedicated, fully responsive two-column grid layout for OpenAPI references with sticky code snippets.
- **MDX Support:** Write content using MDX with rich built-in components (`Tabs`, `Callout`, `Steps`, etc.).
- **Built-in Search:** Lightning-fast offline search powered by Pagefind.
- **Dark Mode:** Native dark mode with a toggle.

## Building the Demo

To build the demo application for production (which also runs the Pagefind indexer):

```bash
pnpm build
```

## License

Apache License 2.0 - See [LICENSE](LICENSE)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
