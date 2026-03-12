import Discord from "@/assets/discord.svg?react";
import Youtube from "@/assets/youtube.svg?react";
import Bluesky from "@/assets/bluesky.svg?react";
import X from "@/assets/x.svg?react";
import { Globe } from "lucide-react";

interface SocialIconProps extends React.SVGProps<SVGSVGElement> {
  platform: string;
}

export default function SocialIcon({ platform, ...props }: SocialIconProps) {
  switch (platform.toLowerCase()) {
    case "discord":
      return <Discord {...props} />;
    case "x":
    case "twitter":
      return <X {...props} />;
    case "youtube":
      return <Youtube {...props} />;
    case "linkedin":
      return <Bluesky {...props} />;
    default:
      return <Globe {...props} />;
  }
}
