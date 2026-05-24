const EDIT_PATH_PREFIX: Record<string, string> = {
  github: "/edit/",
  gitlab: "/-/edit/",
  gitea: "/_edit/",
  forgejo: "/_edit/",
  bitbucket: "/src/",
  git: "/edit/",
};

export function getEditURL(
  repoUrl: string,
  branch: string,
  filePath: string,
  provider?: string,
): string {
  const base = repoUrl.replace(/\/$/, "");
  const path = filePath.replace(/^\//, "");
  const resolved = provider ?? getProvider(repoUrl);
  const prefix = EDIT_PATH_PREFIX[resolved];
  if (resolved === "bitbucket") {
    return `${base}${prefix}${branch}/${path}?mode=edit`;
  }
  return `${base}${prefix}${branch}/${path}`;
}

export function getProvider(url?: string, override?: string): string {
  if (override) return override;
  if (!url) return "git";
  const lowercaseUrl = url.toLowerCase();
  if (lowercaseUrl.includes("github.com")) return "github";
  if (lowercaseUrl.includes("gitlab.com")) return "gitlab";
  if (lowercaseUrl.includes("gitea")) return "gitea";
  if (lowercaseUrl.includes("forgejo")) return "forgejo";
  if (lowercaseUrl.includes("bitbucket.org")) return "bitbucket";
  return "git"; // Fallback
}
