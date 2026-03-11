import GitHub from "@/assets/github.svg?react";
import Gitlab from "@/assets/gitlab.svg?react";
import Gitea from "@/assets/gitea.svg?react";
import Discord from "@/assets/discord.svg?react";
import Twitter from "@/assets/x.svg?react";
import { ChevronRight, Menu } from "lucide-react";
import { useState } from "react";
import { SITE } from "../config";
import { cn } from "../lib/utils";
import ThemeToggle from "./ThemeToggle";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet";
import { Image } from "astro:assets";

interface SidebarProps {
  categories: Record<string, any[]>;
  currentPath: string;
}

const repoIcons: Record<string, any> = {
  github: GitHub,
  gitlab: Gitlab,
  gitea: Gitea,
};

const socialLinks = [
  { name: "Discord", url: SITE.social.discord, Icon: Discord, iconSize: "size-5" },
  { name: "Twitter / X", url: SITE.social.x, Icon: Twitter, iconSize: "size-4" },
];

export function SidebarNav({ categories, currentPath }: SidebarProps) {
  const RepoIcon = repoIcons[SITE.repo.type];

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <div className="scrollbar-none flex-1 overflow-y-auto px-4">
        {categories["root"] && (
          <div className="pb-2 flex flex-col gap-1 text-sm">
            {categories["root"].map((doc) => {
              const href = `/docs/${doc.id}`;
              const isActive = currentPath === href || currentPath === href + "/";
              return (
                <a
                  key={href}
                  href={href}
                  className={cn(
                    "group flex w-full items-center rounded-md border border-transparent px-2 py-1.5 text-sm font-semibold transition-colors",
                    isActive
                      ? "text-foreground"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                  )}
                >
                  {doc.data.title}
                </a>
              );
            })}
          </div>
        )}
        {Object.entries(categories)
          .filter(([category]) => category !== "root")
          .sort(([a], [b]) => {
            const orderA = SITE.categoryOrder?.indexOf(a) ?? -1;
            const orderB = SITE.categoryOrder?.indexOf(b) ?? -1;
            if (orderA !== -1 && orderB !== -1) return orderA - orderB;
            if (orderA !== -1) return -1;
            if (orderB !== -1) return 1;
            return a.localeCompare(b);
          })
          .map(([category, items]) => {
            const isCategoryActive = items.some((doc) => {
              const href = `/docs/${doc.id}`;
              return currentPath === href || currentPath === href + "/";
            });
            return (
              <div key={category} className="pb-2">
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

      <div className="mt-auto shrink-0 p-4">
        <div className="h-px w-full bg-border/40" />
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">
            {SITE.repo.url && SITE.repo.type && (
              <a
                href={SITE.repo.url}
                target="_blank"
                rel="noreferrer"
                className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                title={`View on ${SITE.repo.type.charAt(0).toUpperCase() + SITE.repo.type.slice(1)}`}
              >
                <RepoIcon className="size-5 dark:invert" />
                <span className="sr-only">{SITE.repo.type}</span>
              </a>
            )}

            {socialLinks.map(({ name, url, Icon, iconSize }) => {
              if (!url) return null;
              return (
                <a
                  key={name} // Always include a unique key when mapping in React
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                  title={name}
                >
                  <Icon className={`${iconSize} dark:invert`} />
                  <span className="sr-only">{name}</span>
                </a>
              );
            })}
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
              <Image
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
