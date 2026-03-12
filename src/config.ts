export const SITE = {
  title: "Lyvo Docs",
  description: "A modern, minimalistic documentation theme for Astro.",
  version: "v0.0.1", // Optionally display the version number
  repo: {
    url: "https://github.com/mizuchilabs/lyvo",
    type: "github", // github, gitlab, gitea, forgejo, git
  },
  openapi: {
    url: "/openapi.json", // path to the file in public folder or external URL (e.g. /openapi.json)
  },
  social: {
    discord: "", // e.g. "https://discord.gg/..."
    x: "", // e.g. "https://x.com/..."
    youtube: "",
    bluesky: "",
  },
  extraLinks: [
    { title: "Support", href: "https://example.com/support" },
    { title: "Status", href: "https://status.example.com" },
  ],
  nav: [{ title: "Documentation", href: "/docs/introduction" }],
  logo: {
    type: "both", // "text", "logo", or "both"
    src: "logo.svg", // Name of the file inside src/assets/
    width: 28,
    height: 28,
  },
  enableEdit: true, // Enable edit page button
  categoryOrder: ["introduction", "overview", "components", "changelog"], // Sort order for sidebar categories
};
