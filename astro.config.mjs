// @ts-check
import { defineConfig, fontProviders } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import react from "@astrojs/react";
import mdx from "@astrojs/mdx";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import svgr from "vite-plugin-svgr";

export default defineConfig({
  vite: {
    plugins: [tailwindcss(), svgr()],
  },

  markdown: {
    syntaxHighlight: "shiki",
    shikiConfig: {
      theme: "github-dark",
      wrap: true,
    },
    rehypePlugins: [
      rehypeSlug,
      [
        rehypeAutolinkHeadings,
        {
          behavior: "append",
          properties: {
            className: ["subheading-anchor"],
            ariaLabel: "Link to section",
          },
          content: {
            type: "element",
            tagName: "span",
            properties: { className: ["anchor-icon"] },
            children: [],
          },
        },
      ],
    ],
  },

  fonts: [
    {
      name: "Manrope",
      cssVariable: "--font-sans-default",
      provider: fontProviders.fontsource(),
    },
    {
      name: "Space Grotesk",
      cssVariable: "--font-serif-default",
      provider: fontProviders.fontsource(),
    },
    {
      name: "Victor Mono",
      cssVariable: "--font-mono-default",
      provider: fontProviders.fontsource(),
    },
  ],

  integrations: [react(), mdx()],
});
