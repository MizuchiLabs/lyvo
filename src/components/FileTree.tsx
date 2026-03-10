import React, { useState } from "react";
import { FolderIcon, FolderOpen, FileIcon, ChevronRight, ChevronDown } from "lucide-react";

export function FileTree({ children }: { children: React.ReactNode }) {
  return (
    <div className="not-prose rounded-lg border border-border bg-card px-2 py-4 font-mono text-sm text-card-foreground shadow-sm">
      <ul className="flex flex-col m-0 p-0">{children}</ul>
    </div>
  );
}

export function Folder({
  name,
  defaultOpen = false,
  children,
}: {
  name: string;
  defaultOpen?: boolean;
  children?: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <li className="flex flex-col m-0 p-0">
      <div
        className="group flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 transition-colors select-none hover:bg-muted"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex h-4 w-4 items-center justify-center text-muted-foreground">
          {isOpen ? (
            <ChevronDown className="h-4 w-4 shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0" />
          )}
        </div>
        {isOpen ? (
          <FolderOpen className="h-4 w-4 shrink-0 fill-muted-foreground/30 text-foreground" />
        ) : (
          <FolderIcon className="h-4 w-4 shrink-0 fill-muted-foreground/30 text-muted-foreground group-hover:text-foreground" />
        )}
        <span className="font-medium text-foreground">{name}</span>
      </div>

      {/* Tweaked the left border and padding for cleaner nesting lines */}
      {isOpen && <ul className="ml-3 flex flex-col border-l border-border pl-3 m-0">{children}</ul>}
    </li>
  );
}

export function File({ name }: { name: string }) {
  return (
    <li className="flex items-center gap-2 rounded-md px-2 py-1 text-muted-foreground transition-colors select-none hover:bg-muted hover:text-foreground m-0 p-0">
      <div className="h-4 w-4 shrink-0" /> {/* Spacer for alignment */}
      <FileIcon className="h-4 w-4 shrink-0" />
      {/* Added truncate so long file names don't break your layout */}
      <span className="truncate">{name}</span>
    </li>
  );
}
