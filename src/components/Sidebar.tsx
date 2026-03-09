import { ChevronRight, Menu } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import { GitHubIcon } from "./GitHubIcon";
import { cn } from "../lib/utils";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from "./ui/sheet";
import { useState } from "react";
import { SITE } from "../config";

interface SidebarProps {
  categories: Record<string, any[]>;
  currentPath: string;
}

export function SidebarNav({ categories, currentPath }: SidebarProps) {
  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <div className="scrollbar-none flex-1 overflow-y-auto px-4 py-4">
        {Object.entries(categories).map(([category, items]) => {
          const isCategoryActive = items.some((doc) => {
            const href = `/docs/${doc.id}`;
            return currentPath === href || currentPath === href + "/";
          });
          return (
            <div key={category} className="pb-4">
              <details className="group" open>
                <summary
                  className={cn(
                    "flex cursor-pointer items-center justify-between rounded-md px-2 py-1.5 text-sm font-semibold transition-colors",
                    isCategoryActive
                      ? "text-foreground"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                  )}
                >
                  {category}
                  <ChevronRight
                    className="opacity-50 transition-transform group-open:rotate-90"
                    size={16}
                  />
                </summary>
                <div className="mt-1 ml-4 flex flex-col gap-1 border-l border-border/70 pl-2 text-sm">
                  {items.map((doc) => {
                    const href = `/docs/${doc.id}`;
                    const isActive = currentPath === href || currentPath === href + "/";
                    return (
                      <a
                        key={href}
                        href={href}
                        className={cn(
                          "group flex w-full items-center rounded-md border border-transparent px-2 py-1.5 text-sm transition-colors",
                          isActive
                            ? "bg-accent/50 font-medium text-foreground"
                            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                        )}
                      >
                        {doc.data.title}
                      </a>
                    );
                  })}
                </div>
              </details>
            </div>
          );
        })}
      </div>
      <div className="mt-auto shrink-0 border-t border-border/40 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <a
              href={SITE.github}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              title="GitHub"
            >
              <GitHubIcon className="text-foreground" />
              <span className="sr-only">GitHub</span>
            </a>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}

export function MobileSidebar({ categories, currentPath }: SidebarProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <button
            className="mr-2 inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground md:hidden"
            aria-label="Toggle Menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        }
      />
      <SheetContent
        side="left"
        className="flex w-72 flex-col rounded-none! border-r border-border/40 p-0"
      >
        <SheetHeader className="flex h-14 shrink-0 flex-row items-center border-b border-border/40 px-6 py-0 text-left">
          <SheetTitle className="flex items-center gap-2 text-lg font-bold tracking-tight">
            {(SITE.logo.type === "logo" || SITE.logo.type === "both") && (
              <img
                src={`/src/assets/${SITE.logo.src}`}
                alt={`${SITE.title} Logo`}
                width={SITE.logo.width}
                height={SITE.logo.height}
              />
            )}
            {(SITE.logo.type === "text" || SITE.logo.type === "both") && <span>{SITE.title}</span>}
          </SheetTitle>
        </SheetHeader>
        <div className="flex flex-1 flex-col overflow-hidden">
          <SidebarNav categories={categories} currentPath={currentPath} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
