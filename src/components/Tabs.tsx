import { useState } from "react";
import { cn } from "@/lib/utils";

interface Tab {
  label: string;
  value: string;
  content: React.ReactNode;
}

export default function Tabs({ items }: { items: Tab[] }) {
  const [activeTab, setActiveTab] = useState(items[0]?.value);

  return (
    <div className="my-6 flex flex-col rounded-xl border border-border bg-card shadow-sm">
      <div className="scrollbar-none flex items-center gap-4 overflow-x-auto rounded-t-xl border-b border-border bg-muted/40 px-3 py-1">
        {items.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              "relative px-1 pt-2 pb-2 text-sm font-medium transition-colors duration-200 outline-none",
              activeTab === tab.value
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
            {activeTab === tab.value && (
              <span className="absolute right-0 -bottom-px left-0 h-0.5 bg-primary" />
            )}
          </button>
        ))}
      </div>

      <div className="relative overflow-hidden rounded-b-xl bg-card p-4">
        {items.map((tab) => (
          <div
            key={tab.value}
            className={cn(
              "transition-opacity duration-300 outline-none",
              activeTab === tab.value ? "block animate-in fade-in" : "hidden",
            )}
            role="tabpanel"
          >
            {typeof tab.content === "string" ? (
              <div className="overflow-x-auto font-mono text-sm text-foreground">{tab.content}</div>
            ) : (
              <div className="[&>*:first-child]:mt-0 [&>*:last-child]:mb-0">{tab.content}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
