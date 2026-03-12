import { ChevronRight, PanelRightClose, PanelRightOpen, ExternalLink } from "lucide-react";
import { useState } from "react";
import { SITE } from "../config";
import { cn } from "../lib/utils";
import Search from "./Search";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTrigger } from "./ui/sheet";
import RepoIcon from "./RepoIcon";
import SocialIcon from "./SocialIcon";

interface SidebarProps {
  categories: Record<string, any[]>;
  currentPath: string;
  logoUrl?: string;
}

function SidebarNav({ categories, currentPath }: Omit<SidebarProps, "logoUrl">) {

  const topLevelItems = [
    ...(categories["root"] || []).map((doc) => ({
      type: "link" as const,
      id: doc.id.split("/")[0],
      title: doc.data.title,
      doc,
    })),
    ...Object.entries(categories)
      .filter(([category]) => category !== "root")
      .map(([category, items]) => ({
        type: "category" as const,
        id: category.toLowerCase().replace(/ /g, "-"),
        title: category,
        items,
      })),
  ];

  topLevelItems.sort((a, b) => {
    const orderA = SITE.categoryOrder?.indexOf(a.id) ?? -1;
    const orderB = SITE.categoryOrder?.indexOf(b.id) ?? -1;
    if (orderA !== -1 && orderB !== -1) return orderA - orderB;
    if (orderA !== -1) return -1;
    if (orderB !== -1) return 1;
    return a.title.localeCompare(b.title);
  });

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <div className="scrollbar-none flex-1 overflow-y-auto px-4">
        <div className="flex flex-col gap-1 pb-2">
          {topLevelItems.map((item) => {
            if (item.type === "link") {
              const href = `/docs/${item.doc.id}`;
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
                  {item.title}
                </a>
              );
            }

            const isCategoryActive = item.items.some((doc) => {
              const href = `/docs/${doc.id}`;
              return currentPath === href || currentPath === href + "/";
            });

            return (
              <div key={item.id} className="pb-1">
                <details className="group" open>
                  <summary
                    className={cn(
                      "flex cursor-pointer list-none items-center justify-between rounded-md px-2 py-1.5 text-sm font-semibold transition-colors [&::-webkit-details-marker]:hidden",
                      isCategoryActive
                        ? "text-foreground"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                    )}
                  >
                    {item.title}
                    <ChevronRight
                      className="opacity-50 transition-transform group-open:rotate-90"
                      size={16}
                    />
                  </summary>
                  <div className="mt-1 ml-4 flex flex-col gap-1 border-l border-border/70 pl-2 text-sm">
                    {item.items.map((doc) => {
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
      </div>

      <div className="mt-auto shrink-0 p-4">
        {SITE.extraLinks && SITE.extraLinks.length > 0 && (
          <div className="mb-4 flex flex-col gap-1">
            {SITE.extraLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
              >
                {link.title}
                <ExternalLink size={12} className="opacity-50" />
              </a>
            ))}
          </div>
        )}

        <div className="h-px w-full bg-border/40" />
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-1">
            {SITE.repo.url && (
              <a
                href={SITE.repo.url}
                target="_blank"
                rel="noreferrer"
                className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                title={`View on ${SITE.repo.type}`}
              >
                <RepoIcon className="size-5 dark:invert" />
                <span className="sr-only">{SITE.repo.type}</span>
              </a>
            )}

            {Object.entries(SITE.social).map(([platform, url]) => {
              if (!url) return null;
              return (
                <a
                  key={platform}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                  title={platform.charAt(0).toUpperCase() + platform.slice(1)}
                >
                  <SocialIcon platform={platform} className="size-5 dark:invert" />
                  <span className="sr-only">{platform}</span>
                </a>
              );
            })}
          </div>

          {SITE.version && (
            <div className="rounded-md bg-muted/50 px-2 py-1 text-[10px] font-medium tracking-tight text-muted-foreground">
              {SITE.version}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Sidebar({ categories, currentPath, logoUrl }: SidebarProps) {
  const [open, setOpen] = useState(false);

  const Logo = () => (
    <a href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
      {(SITE.logo.type === "logo" || SITE.logo.type === "both") && logoUrl && (
        <img
          src={logoUrl}
          alt={`${SITE.title} Logo`}
          width={SITE.logo.width}
          height={SITE.logo.height}
        />
      )}
      {(SITE.logo.type === "text" || SITE.logo.type === "both") && <span>{SITE.title}</span>}
    </a>
  );

  return (
    <>
      {/* Mobile Header */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border/40 px-4 md:hidden">
        <Logo />
        <div className="flex items-center gap-4">
          <Search />

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger className="opacity-50 hover:opacity-100">
              <PanelRightOpen size={20} />
            </SheetTrigger>
            <SheetContent
              side="right"
              className="flex w-72 flex-col rounded-none border-l border-border/40 p-0"
              showCloseButton={false}
            >
              <SheetHeader className="flex h-14 shrink-0 flex-row items-center justify-between border-b border-border/40 px-6 py-0 text-left">
                <Logo />
                <SheetClose className="opacity-50 hover:opacity-100">
                  <PanelRightClose size={20} />
                </SheetClose>
              </SheetHeader>
              <div className="flex flex-1 flex-col overflow-hidden">
                <SidebarNav categories={categories} currentPath={currentPath} />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden w-72 shrink-0 flex-col space-y-6 md:flex">
        <div className="flex shrink-0 items-center px-6 pt-6 pb-2">
          <Logo />
        </div>
        <div className="flex flex-1 flex-col overflow-hidden">
          <SidebarNav categories={categories} currentPath={currentPath} />
        </div>
      </aside>
    </>
  );
}
