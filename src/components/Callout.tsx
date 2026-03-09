import { cn } from "../lib/utils";
import { Info, AlertTriangle, XCircle, CheckCircle2 } from "lucide-react";

interface CalloutProps {
  type?: "default" | "warning" | "danger" | "success";
  title?: string;
  children: React.ReactNode;
}

export default function Callout({ type = "default", title, children }: CalloutProps) {
  const types = {
    default: {
      icon: Info,
      classes: "border-blue-500/50 bg-blue-500/10 text-blue-900 dark:text-blue-200",
      iconClass: "text-blue-500",
    },
    warning: {
      icon: AlertTriangle,
      classes: "border-yellow-500/50 bg-yellow-500/10 text-yellow-900 dark:text-yellow-200",
      iconClass: "text-yellow-500",
    },
    danger: {
      icon: XCircle,
      classes: "border-red-500/50 bg-red-500/10 text-red-900 dark:text-red-200",
      iconClass: "text-red-500",
    },
    success: {
      icon: CheckCircle2,
      classes: "border-green-500/50 bg-green-500/10 text-green-900 dark:text-green-200",
      iconClass: "text-green-500",
    },
  };

  const Icon = types[type].icon;

  return (
    <div className={cn("my-6 flex items-start rounded-lg border p-4", types[type].classes)}>
      <Icon className={cn("mt-0.5 h-5 w-5 flex-shrink-0 mr-3", types[type].iconClass)} />
      <div className="w-full min-w-0">
        {title && <h5 className="mb-1 font-medium leading-none tracking-tight">{title}</h5>}
        <div className="text-sm [&>p]:leading-relaxed [&>p:first-child]:mt-0 [&>p:last-child]:mb-0">
          {children}
        </div>
      </div>
    </div>
  );
}
