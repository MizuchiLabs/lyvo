import { useState, useRef } from 'react';
import { Check, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CodeBlock({ children, className, tabindex, ...props }: any) {
	const [hasCopied, setHasCopied] = useState(false);
	const preRef = useRef<HTMLPreElement>(null);

	const onCopy = () => {
		if (!preRef.current) return;
		const text = preRef.current.innerText;
		navigator.clipboard.writeText(text);
		setHasCopied(true);
		setTimeout(() => {
			setHasCopied(false);
		}, 2000);
	};

	return (
		<div className="group not-prose relative my-6 flex flex-col overflow-hidden rounded-xl border border-border bg-zinc-950 shadow-sm dark:bg-zinc-900/50">
			<div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900 px-4 py-2 dark:bg-zinc-950/50">
				<div className="flex items-center space-x-2">
					<div className="h-3 w-3 rounded-full bg-zinc-700"></div>
					<div className="h-3 w-3 rounded-full bg-zinc-700"></div>
					<div className="h-3 w-3 rounded-full bg-zinc-700"></div>
				</div>

				<button
					onClick={onCopy}
					className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 transition-all duration-200 hover:bg-zinc-800 hover:text-zinc-100 active:scale-90"
					aria-label="Copy code"
				>
					{hasCopied ? (
						<Check className="animate-in text-green-500 duration-200 zoom-in" size={16} />
					) : (
						<Copy className="transition-transform hover:scale-110" size={16} />
					)}
				</button>
			</div>

			<div className="relative w-full overflow-hidden">
				<pre
					ref={preRef}
					className={cn(
						'scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent mt-0 mb-0 overflow-x-auto bg-transparent px-4 py-0 text-sm text-zinc-50',
						className
					)}
					tabIndex={tabindex}
					{...props}
				>
					{children}
				</pre>
			</div>
		</div>
	);
}
