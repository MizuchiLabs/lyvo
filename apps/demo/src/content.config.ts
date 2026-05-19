import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { docsSchema, openapiLoader } from "@mizuchilabs/lyvo/schema";

const docs = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx,mdoc}", base: "./src/content/docs" }),
  schema: docsSchema,
});

const api = defineCollection({
  loader: openapiLoader({ input: "public/openapi.json", groupBy: "tag" }),
});

export const collections = { docs, api };
