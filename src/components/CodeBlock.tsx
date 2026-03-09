import { useState, useRef } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "../lib/utils";

export default function CodeBlock({ children, className, ...props }: any) {
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
    <div className="group relative my-6 rounded-xl border border-border bg-muted/30 p-0.5">
      <div className="mb-2 flex items-center justify-between pl-4 pr-2 pt-1">
        <div className="flex items-center space-x-1.5">
          <div className="h-3 w-3 rounded-full bg-border/80"></div>
          <div className="h-3 w-3 rounded-full bg-border/80"></div>
          <div className="h-3 w-3 rounded-full bg-border/80"></div>
        </div>

        <button
          onClick={onCopy}
          className=" text-muted-foreground hover:bg-muted hover:text-foreground inline-flex h-8 w-8 items-center justify-center rounded-md transition-all duration-200 active:scale-90"
          aria-label="Copy code"
        >
          {hasCopied ? (
            <Check className="text-green-500 animate-in zoom-in duration-200" size={16} />
          ) : (
            <Copy className="transition-transform hover:scale-110" size={16} />
          )}
        </button>
      </div>

      <div className="relative overflow-hidden rounded-lg border border-white/10 bg-[#0d1117] shadow-inner">
        <pre
          ref={preRef}
          className={cn(
            "mb-0 mt-0 overflow-x-auto py-0 text-sm text-gray-300 bg-transparent scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent",
            className,
          )}
          {...props}
        >
          {children}
        </pre>
      </div>
    </div>
  );
}
