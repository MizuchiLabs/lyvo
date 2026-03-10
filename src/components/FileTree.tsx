import React, { useState } from 'react';
import {
	Folder as FolderIcon,
	FolderOpen,
	File as FileIcon,
	ChevronRight,
	ChevronDown
} from 'lucide-react';
import { cn } from '../lib/utils';

export function FileTree({ children }: { children: React.ReactNode }) {
	return (
		<div className="my-6 rounded-lg border border-border bg-card p-4 font-mono text-sm text-card-foreground shadow-sm">
			<ul className="flex flex-col">{children}</ul>
		</div>
	);
}

export function Folder({
	name,
	defaultOpen = false,
	children
}: {
	name: string;
	defaultOpen?: boolean;
	children?: React.ReactNode;
}) {
	const [isOpen, setIsOpen] = useState(defaultOpen);

	return (
		<li className="flex flex-col">
			<div
				className="-ml-2 flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 transition-colors select-none hover:bg-muted/50 hover:text-foreground"
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
					<FolderOpen className="h-4 w-4 shrink-0 fill-muted-foreground/30 text-muted-foreground" />
				) : (
					<FolderIcon className="h-4 w-4 shrink-0 fill-muted-foreground/30 text-muted-foreground" />
				)}
				<span className="font-medium">{name}</span>
			</div>
			{isOpen && <ul className="ml-2 flex flex-col border-l border-border/50 pl-4">{children}</ul>}
		</li>
	);
}

export function File({ name }: { name: string }) {
	return (
		<li className="-ml-2 flex items-center gap-2 rounded-md px-2 py-1.5 text-muted-foreground transition-colors select-none hover:bg-muted/50 hover:text-foreground">
			<div className="h-4 w-4" /> {/* Spacer for alignment with folder chevron */}
			<FileIcon className="h-4 w-4 shrink-0" />
			<span>{name}</span>
		</li>
	);
}
