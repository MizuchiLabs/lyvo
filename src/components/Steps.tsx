export function Steps({ children }: { children: React.ReactNode }) {
	return (
		<div className="steps-container not-prose relative my-6 ml-4 border-l-2 border-border/70 pl-6">
			{children}
		</div>
	);
}

export function Step({ title, children }: { title?: string; children: React.ReactNode }) {
	return (
		<div className="group relative mb-8">
			<div className="step-counter absolute -left-[39px] flex h-7 w-7 items-center justify-center rounded-full border-2 border-border bg-background text-xs font-semibold shadow-sm transition-colors group-hover:border-primary">
				{/* CSS counter handles the numbers */}
			</div>
			{title && <h3 className="mt-0 mb-2 text-lg font-semibold tracking-tight">{title}</h3>}
			<div className="prose-sm text-muted-foreground [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
				{children}
			</div>
		</div>
	);
}
