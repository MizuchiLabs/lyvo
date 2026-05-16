// @ts-check
import { defineConfig, fontProviders } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import react from "@astrojs/react";
import mdx from "@astrojs/mdx";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import svgr from "vite-plugin-svgr";
import lyvo from "lyvo";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://example.com",
  vite: {
    plugins: [tailwindcss(), svgr()],
  },

  markdown: {
    syntaxHighlight: "shiki",
    shikiConfig: {
      themes: {
        light: "github-light",
        dark: "github-dark",
      },
      wrap: true,
    },
    rehypePlugins: [
      rehypeSlug,
      [
        rehypeAutolinkHeadings,
        {
          behavior: "append",
          properties: {
            class: "heading-link",
            "aria-hidden": "true",
            tabIndex: -1,
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

  integrations: [
    lyvo({
      title: "Lyvo",
      repo: {
        url: "https://github.com/mizuchilabs/lyvo",
        branch: "main",
      },
      socials: {
        discord: "",
        x: "",
        youtube: "",
        bluesky: "",
      },
      extraLinks: [
        { title: "Support", href: "https://example.com/support" },
        { title: "Status", href: "https://status.example.com" },
      ],
      docs: {
        edit: true,
        feedback: true,
      },
      openapi: {
        input: "public/openapi.json",
        groupBy: "tag",
      },
    }),
    sitemap(),
    react(),
    mdx(),
  ],
});
