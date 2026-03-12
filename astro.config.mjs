// @ts-check
import { defineConfig, fontProviders } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import react from "@astrojs/react";
import mdx from "@astrojs/mdx";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import svgr from "vite-plugin-svgr";

import favicons from "astro-favicons";

export default defineConfig({
  vite: {
    plugins: [tailwindcss(), svgr()],
    server: {
      watch: {
        awaitWriteFinish: {
          stabilityThreshold: 50,
          pollInterval: 10,
        },
      },
    },
  },

  markdown: {
    syntaxHighlight: false,
    gfm: true,
    smartypants: true,
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
      [
        rehypePrettyCode,
        {
          theme: "github-dark-dimmed",
          /** @param {any} node */
          onVisitLine(node) {
            // Prevent lines from collapsing in empty lines
            if (node.children.length === 0) {
              node.children = [{ type: "text", value: " " }];
            }
          },
          /** @param {any} node */
          onVisitHighlightedLine(node) {
            node.properties.className.push("line--highlighted");
          },
          /** @param {any} node */
          onVisitHighlightedWord(node) {
            node.properties.className = ["word--highlighted"];
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

  integrations: [react(), mdx(), favicons()],
});
