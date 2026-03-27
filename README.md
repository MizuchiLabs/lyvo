<p align="center">
<img src="./.github/logo.svg" width="80">
<br><br>
<img alt="GitHub Tag" src="https://img.shields.io/github/v/tag/MizuchiLabs/lyvo?label=Version">
<img alt="GitHub License" src="https://img.shields.io/github/license/MizuchiLabs/lyvo">
<img alt="GitHub Issues or Pull Requests" src="https://img.shields.io/github/issues/MizuchiLabs/lyvo">
</p>

# Lyvo

Lyvo is a highly polished, minimalistic, and modern documentation generator built on top of [Astro](https://astro.build/). It draws inspiration from beautiful documentation tools like Fumadocs and Mintlify, providing a solid foundation to build your own custom documentation sites quickly.

## Features

- **Blazing Fast**: Powered by Astro and Vite for instant load times.
- **Modern Design**: Clean typography and UI inspired by modern developer tools.
- **Dark Mode**: Fully supported out of the box with a slick theme toggle.
- **Full Text Search**: Built-in blazing fast search powered by Pagefind.
- **Rich Components**: Includes `Tabs`, `Steps`, `Callout`, and `CodeBlock` components.
- **shadcn/ui**: Easy to extend and maintain, leveraging Tailwind CSS v4 and React.
- **MDX Support**: Write content using MDX for ultimate flexibility.

## Getting Started

The fastest way to start a new project with Lyvo is to use the `create astro` CLI with the template flag:

```bash
# npm
npm create astro@latest -- --template MizuchiLabs/lyvo

# pnpm
pnpm create astro@latest --template MizuchiLabs/lyvo

# yarn
yarn create astro --template MizuchiLabs/lyvo
```

Then, navigate into your new project, install dependencies, and start the development server:

```bash
cd my-lyvo-docs
pnpm install
pnpm dev
```

## Usage

### Folder Structure

- `src/content/docs/`: Your markdown/mdx content lives here. Create folders to organize.
- `src/components/`: Reusable UI components.
- `src/layouts/`: Base and Docs layouts.

### Adding New Pages

Simply create a new `.md` or `.mdx` file in `src/content/docs/`. The layout will automatically pick it up and add it to the sidebar based on its category frontmatter property.

**Example Frontmatter:**

```yaml
---
title: Introduction
description: Welcome to Lyvo.
category: Getting Started
order: 1
---
```

### OpenAPI Docs Mode

Lyvo can generate a normalized API model from an OpenAPI JSON/YAML file and render it in a dedicated API mode under `/api`.

1. Set your source spec in `src/content/api/openapi.config.json` (`input` supports `.json` and `.yaml`).
2. Run:

```bash
pnpm openapi:generate
```

This writes `src/content/api/openapi-model.json`. Once generated, a `Docs / API` toggle appears in the sidebar automatically.

OpenAPI generation also runs automatically before `pnpm build` when `src/content/api/openapi.config.json` exists and is enabled.

To disable automatic generation, set:

```json
{
	"enabled": false
}
```

## Components

Lyvo comes with a few essential components specifically tailored for documentation:

- `<Tabs />`: Great for code snippets or switchable content.
- `<Steps />`: To guide users through sequential instructions.
- `<Callout />`: Useful for warnings, info, or tips (success, danger, warning, default).
- `<CodeBlock />`: Beautiful code highlighting with a copy-to-clipboard button.

## Building for Production

```bash
pnpm build
```

This command builds your Astro project and subsequently indexes the static output with `pagefind` to enable search.

## License

MIT License - see [LICENSE](LICENSE) for details

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
