export const SITE = {
  title: "Lyvo Docs",
  description: "A modern, minimalistic documentation theme for Astro.",
  repo: {
    url: "https://github.com/mizuchilabs/lyvo",
    type: "github", // github, gitlab, gitea
  },
  openapi: {
    url: "", // path to the file in public folder or external URL (e.g. /openapi.json)
  },
  social: {
    discord: "",
    x: "",
  },
  nav: [{ title: "Docs", href: "/docs/introduction" }],
  logo: {
    type: "both", // "text", "logo", or "both"
    src: "logo.svg", // Name of the file inside src/assets/
    width: 28,
    height: 28,
  },
  enableEdit: true, // Enable edit page button
  categoryOrder: ["Overview", "Components"], // Sort order for sidebar categories
};
