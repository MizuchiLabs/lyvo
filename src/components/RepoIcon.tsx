import GitHub from "@/assets/github.svg?react";
import Gitlab from "@/assets/gitlab.svg?react";
import Gitea from "@/assets/gitea.svg?react";
import Forgejo from "@/assets/forgejo.svg?react";
import Git from "@/assets/git.svg?react";
import { SITE } from "@/config";

interface RepoIconProps extends React.SVGProps<SVGSVGElement> {
  type?: string;
}

export default function RepoIcon({ type, ...props }: RepoIconProps) {
  const repoType = type?.toLowerCase() || SITE.repo.type?.toLowerCase() || "git";

  switch (repoType) {
    case "github":
      return <GitHub {...props} />;
    case "gitlab":
      return <Gitlab {...props} />;
    case "gitea":
      return <Gitea {...props} />;
    case "forgejo":
      return <Forgejo {...props} />;
    default:
      return <Git {...props} />;
  }
}
