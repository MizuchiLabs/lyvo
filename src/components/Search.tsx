import { useState, useEffect } from 'react';
import { Command } from 'cmdk';
import { Search as SearchIcon } from 'lucide-react';

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
        const pagefind = await import(window.location.origin + '/pagefind/pagefind.js');
        const searchRes = await pagefind.search(query);
        const data = await Promise.all(searchRes.results.slice(0, 5).map((r: any) => r.data()));
        setResults(data);
      } catch (e) {
        console.error('Pagefind not found. Search only works after building with `pnpm build`.', e);
      }
    }
    search();
  }, [query]);

  return (
    <>
      <button 
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-between whitespace-nowrap rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 relative w-full justify-start text-sm text-muted-foreground sm:pr-12 md:w-40 lg:w-64"
      >
        <span className="hidden lg:inline-flex">Search documentation...</span>
        <span className="inline-flex lg:hidden">Search...</span>
        <kbd className="pointer-events-none absolute right-[0.3rem] top-[0.3rem] hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      {open && <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm" />}
      <Command.Dialog 
        open={open} 
        onOpenChange={setOpen} 
        label="Search Docs"
        className="fixed left-1/2 top-1/2 z-50 w-[90vw] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-xl border border-border bg-background text-foreground shadow-2xl sm:w-full outline-none"
      >
        <div className="flex items-center border-b border-border px-3">
          <SearchIcon className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <Command.Input 
            value={query} 
            onValueChange={setQuery}
            placeholder="Search documentation..." 
            className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
        
        <Command.List className="max-h-[300px] overflow-y-auto overflow-x-hidden p-2">
          <Command.Empty className="py-6 text-center text-sm">
            {query ? 'No results found.' : 'Type to search...'}
          </Command.Empty>
          
          {results.length > 0 && (
            <Command.Group heading="Results" className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
              {results.map((res) => (
                <Command.Item 
                  key={res.url} 
                  value={res.meta.title}
                  onSelect={() => {
                    window.location.href = res.url;
                    setOpen(false);
                  }}
                  className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-[selected=true]:bg-accent aria-[selected=true]:text-accent-foreground data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50"
                >
                  <div className="flex flex-col gap-1 w-full text-foreground">
                    <span className="font-medium text-sm">{res.meta.title}</span>
                    <span className="text-xs text-muted-foreground line-clamp-1" dangerouslySetInnerHTML={{ __html: res.excerpt }} />
                  </div>
                </Command.Item>
              ))}
            </Command.Group>
          )}
        </Command.List>
      </Command.Dialog>
    </>
  );
}