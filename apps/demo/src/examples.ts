export const configExample = `import { defineConfig } from 'astro/config';
import lyvo from '@mizuchilabs/lyvo';

export default defineConfig({
  site: 'https://my-app.dev',
  integrations: [
    lyvo({
      title: 'My App',
      openapi: { input: 'openapi.json' }
    })
  ]
});`;

export const mdxExample = `---
title: Getting started
description: Install the CLI and ship your first app.
---

<Steps>
  <Step title="Install">Run \`pnpm add my-app\`.</Step>
  <Step title="Configure">Add your API key.</Step>
</Steps>

<Callout type="tip">Every page is also served as Markdown.</Callout>`;
