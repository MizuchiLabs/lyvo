/// <reference types="vite-plugin-svgr/client" />

declare module "virtual:lyvo-config" {
  interface Config {
    title?: string;
    logo?: string;
    repo?: {
      url?: string;
      branch?: string;
    };
    socials: Array<{ label: string; href: string; icon: string }>;
    nav?: Array<{ title: string; href: string }>;
    extraLinks: Array<{ title: string; href: string }>;
    docs: {
      edit: boolean;
      feedback: boolean;
    };
    openapi: {
      input?: string;
      groupBy?: "tag" | "path";
    };
  }

  const config: Config;
  export default config;
}
