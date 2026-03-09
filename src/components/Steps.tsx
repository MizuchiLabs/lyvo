export function Steps({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-6 ml-4 border-l border-border pl-6 relative steps-container">{children}</div>
  );
}

export function Step({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="mb-8 relative">
      <div className="absolute -left-[35px] mt-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-muted border border-border text-xs font-medium step-counter">
        {/* CSS counter handles the numbers */}
      </div>
      {title && <h3 className="mt-0 mb-2 text-lg font-semibold">{title}</h3>}
      <div className="prose-sm text-muted-foreground [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
        {children}
      </div>
    </div>
  );
}

