export const SITE = {
  title: "Lyvo Docs",
  description: "A modern, minimalistic documentation theme for Astro.",
  repo: {
    url: "https://github.com/mizuchilabs/lyvo",
    type: "github", // github, gitlab, gitea
  },
  social: {
    discord: "",
    x: "",
  },
  nav: [
    { title: "Docs", href: "/docs/introduction" },
    { title: "Components", href: "/docs/components/components" },
  ],
  logo: {
    type: "both", // "text", "logo", or "both"
    src: "logo.svg", // Name of the file inside src/assets/
    width: 28,
    height: 28,
  },
  enableEdit: true, // Enable edit page button
  categoryOrder: ["Overview", "Components"], // Sort order for sidebar categories
  theme: {
    accentColor: "#6366f1", // Used for primary accents in UI
    radius: "0.75rem", // Global border radius for cards, buttons, etc.
  },
};
