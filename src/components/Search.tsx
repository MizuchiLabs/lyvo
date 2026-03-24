import { useState, useEffect } from 'react';
import { Search as SearchIcon } from 'lucide-react';
import {
	Command,
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList
} from './ui/command';

export default function Search() {
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState('');
	const [results, setResults] = useState<any[]>([]);

	useEffect(() => {
		const down = (e: KeyboardEvent) => {
			if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				setOpen((open) => !open);
			}
		};
		document.addEventListener('keydown', down);
		return () => document.removeEventListener('keydown', down);
	}, []);

	useEffect(() => {
		async function search() {
			if (!query) {
				setResults([]);
				return;
			}
			try {
				// @ts-ignore
				const pagefind = await import(
					/* @vite-ignore */ window.location.origin + '/pagefind/pagefind.js'
				);
				const searchRes = await pagefind.search(query);
				const data = await Promise.all(searchRes.results.slice(0, 5).map((r: any) => r.data()));
				setResults(data);
			} catch (e) {
				console.error('Pagefind not found. Search only works after building with `pnpm build`.', e);
			}
		}
		search();
	}, [query]);

	const prefetchPagefind = async () => {
		try {
			// @ts-ignore
			await import(/* @vite-ignore */ window.location.origin + '/pagefind/pagefind.js');
		} catch (_) {}
	};

	return (
		<>
			<button
				onClick={() => setOpen(true)}
				onFocus={prefetchPagefind}
				onMouseEnter={prefetchPagefind}
				aria-label="Search documentation"
				className="relative inline-flex h-11 w-11 items-center justify-center rounded-md border-0 border-input bg-transparent px-0 py-2 text-sm font-medium whitespace-nowrap text-muted-foreground shadow-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 md:h-9 md:w-full md:justify-between md:border md:px-4 md:pr-12 md:shadow-sm"
			>
				<span className="hidden md:inline-flex">Search...</span>
				<SearchIcon className="md:hidden" size={20} />
				<kbd className="pointer-events-none absolute top-1/2 right-1.5 hidden h-5 -translate-y-1/2 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 select-none md:flex">
					<span className="text-xs">⌘</span>K
				</kbd>
			</button>

			<CommandDialog open={open} onOpenChange={setOpen}>
				<Command>
					<CommandInput
						value={query}
						onValueChange={setQuery}
						placeholder="Search documentation..."
					/>
					<CommandList>
						<CommandEmpty>{query ? 'No results found.' : 'Type to search...'}</CommandEmpty>

						{results.length > 0 && (
							<CommandGroup heading="Results">
								{results.map((res) => (
									<CommandItem
										key={res.url}
										value={res.meta.title}
										onSelect={() => {
											window.location.href = res.url;
											setOpen(false);
										}}
									>
										<div className="flex w-full flex-col gap-1 text-foreground">
											<span className="text-sm font-medium">{res.meta.title}</span>
											<span
												className="line-clamp-1 text-xs text-muted-foreground"
												dangerouslySetInnerHTML={{ __html: res.excerpt }}
											/>
										</div>
									</CommandItem>
								))}
							</CommandGroup>
						)}
					</CommandList>
				</Command>
			</CommandDialog>
		</>
	);
}
