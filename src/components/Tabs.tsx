import { useState } from "react";
import { cn } from "../lib/utils";

interface Tab {
  label: string;
  value: string;
  content: React.ReactNode;
}

export default function Tabs({ items }: { items: Tab[] }) {
  const [activeTab, setActiveTab] = useState(items[0]?.value);

  return (
    <div className="my-6 flex flex-col rounded-xl border border-border bg-muted/30 p-0.5">
      <div className="flex items-center gap-5 overflow-x-auto px-2 py-1 scrollbar-none">
        {items.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              "relative pb-2 pt-1 text-sm font-medium outline-none transition-colors duration-200",
              activeTab === tab.value
                ? "text-foreground" // Highlighted active text
                : "text-muted-foreground hover:text-foreground", // Faded inactive text
            )}
          >
            {tab.label}

            {/* The Active Underline Indicator */}
            {activeTab === tab.value && (
              <span className="absolute bottom-[-1px] left-0 right-0 h-[2px] rounded-t-full bg-foreground" />
            )}
          </button>
        ))}
      </div>

      <div className="relative overflow-hidden rounded-lg border border-white/10 bg-[#0d1117] shadow-inner">
        {items.map((tab) => (
          <div
            key={tab.value}
            className={cn(
              "outline-none transition-opacity duration-300",
              activeTab === tab.value ? "block animate-in fade-in" : "hidden",
            )}
            role="tabpanel"
          >
            {typeof tab.content === "string" ? (
              <div className="overflow-x-auto p-4 text-sm font-mono text-gray-300">
                {tab.content}
              </div>
            ) : (
              <div className="p-4">{tab.content}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
