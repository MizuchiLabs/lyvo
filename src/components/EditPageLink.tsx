import { SITE } from "../config";
import { Pencil } from "lucide-react";

// Helper function to build the correct edit URL based on the platform
function getEditUrl(filePath: string, branch: string = "main") {
  // Strip trailing slashes to prevent double slashes in the final URL
  const base = SITE.repo.url.replace(/\/$/, "");
  const path = filePath.startsWith("/") ? filePath.slice(1) : filePath;

  switch (SITE.repo.type) {
    case "github":
      return `${base}/edit/${branch}/${path}`;
    case "gitlab":
      // GitLab uses /-/ in its tree/edit URLs
      return `${base}/-/edit/${branch}/${path}`;
    case "gitea":
      // Gitea uses /_edit/
      return `${base}/_edit/${branch}/${path}`;
    default:
      return `${base}/edit/${branch}/${path}`;
  }
}

interface EditPageLinkProps {
  filePath?: string;
  branch?: string; // Defaults to "main"
}

export default function EditPageLink({ filePath, branch = "main" }: EditPageLinkProps) {
  if (!filePath || !SITE.repo.url || !SITE.repo.type) return null;

  const editUrl = getEditUrl(filePath, branch);

  return (
    <a
      href={editUrl}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:underline border border-border/80 px-4 py-2 rounded-lg"
    >
      <Pencil size={16} className="mr-0.5" />
      <span>Edit page</span>
    </a>
  );
}
