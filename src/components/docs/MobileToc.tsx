import { useState, useEffect, useRef } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Heading {
	depth: number;
	slug: string;
	text: string;
}

export default function MobileToc({ headings, title }: { headings: Heading[]; title: string }) {
	const [activeId, setActiveId] = useState<string>('');
	const [progress, setProgress] = useState(0);
	const [open, setOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const mainScrollArea = document.querySelector('#main-scroll-area');
		if (!mainScrollArea) return;

		const handleScroll = () => {
			const scrollTop = mainScrollArea.scrollTop;
			const scrollHeight = mainScrollArea.scrollHeight - mainScrollArea.clientHeight;
			if (scrollHeight > 0) {
				setProgress((scrollTop / scrollHeight) * 100);
			} else {
				setProgress(0);
			}
		};

		mainScrollArea.addEventListener('scroll', handleScroll, { passive: true });
		handleScroll(); // Initial check

		const headingElements = document.querySelectorAll('article h2, article h3');
		if (headingElements.length > 0) {
			const observer = new IntersectionObserver(
				(entries) => {
					entries.forEach((entry) => {
						if (entry.isIntersecting) {
							setActiveId(entry.target.getAttribute('id') || '');
						}
					});
				},
				{ root: mainScrollArea, rootMargin: '-20% 0px -60% 0px' }
			);

			headingElements.forEach((el) => observer.observe(el));

			return () => {
				mainScrollArea.removeEventListener('scroll', handleScroll);
				observer.disconnect();
			};
		}

		return () => mainScrollArea.removeEventListener('scroll', handleScroll);
	}, []);

	// Close dropdown on outside click
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				setOpen(false);
			}
		};
		if (open) {
			document.addEventListener('mousedown', handleClickOutside);
		}
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, [open]);

	const activeHeading = headings.find((h) => h.slug === activeId) || headings[0];
	const displayTitle = activeHeading && progress > 5 ? activeHeading.text : title;

	const radius = 9;
	const circumference = 2 * Math.PI * radius;
	const strokeDashoffset = circumference - (progress / 100) * circumference;

	return (
		<div className="flex w-full items-center xl:hidden" ref={dropdownRef}>
			<button
				onClick={() => headings.length > 0 && setOpen(!open)}
				aria-expanded={open}
				aria-controls="mobile-toc-menu"
				className={cn(
					'flex w-full items-center space-x-2 text-sm transition-colors',
					headings.length > 0
						? 'cursor-pointer text-muted-foreground hover:text-foreground'
						: 'cursor-default text-foreground'
				)}
			>
				<div className="relative -ml-1 flex h-6 w-6 shrink-0 items-center justify-center">
					<svg
						className="h-full w-full -rotate-90 transform text-muted-foreground/30"
						viewBox="0 0 24 24"
					>
						<circle
							cx="12"
							cy="12"
							r={radius}
							stroke="currentColor"
							strokeWidth="2"
							fill="none"
						/>
					</svg>
					<svg
						className="absolute h-full w-full -rotate-90 transform text-foreground transition-all duration-150 ease-out"
						viewBox="0 0 24 24"
					>
						<circle
							cx="12"
							cy="12"
							r={radius}
							stroke="currentColor"
							strokeWidth="2"
							fill="none"
							strokeDasharray={circumference}
							strokeDashoffset={strokeDashoffset}
							strokeLinecap="round"
						/>
					</svg>
				</div>
				<div className="flex flex-1 items-center gap-1 font-medium">
					<span className="truncate text-left">{displayTitle}</span>
					{headings.length > 0 && (
						<ChevronRight
							size={14}
							className={cn(
								'shrink-0 text-muted-foreground transition-transform',
								open && 'rotate-90'
							)}
						/>
					)}
				</div>
			</button>

			{open && headings.length > 0 && (
				<div
					id="mobile-toc-menu"
					className="absolute top-14 right-0 left-0 z-50 w-full rounded-b-xl border-b border-border/40 p-4 shadow-lg backdrop-blur-md"
				>
					<div className="no-scrollbar max-h-[60vh] overflow-y-auto">
						<div className="flex flex-col space-y-1">
							{headings.length > 0 ? (
								headings.map((heading) => (
									<a
										key={heading.slug}
										href={`#${heading.slug}`}
										onClick={(e) => {
											setOpen(false);
											const el = document.getElementById(heading.slug);
											if (el) {
												e.preventDefault();
												el.scrollIntoView({ behavior: 'smooth' });
												window.history.pushState(
													null,
													'',
													`#${heading.slug}`
												);
											}
										}}
										className={cn(
											'block truncate py-1.5 text-sm transition-colors hover:text-foreground',
											activeId === heading.slug
												? 'font-medium text-foreground'
												: 'text-muted-foreground',
											heading.depth >= 3 ? 'pl-4' : ''
										)}
									>
										{heading.text}
									</a>
								))
							) : (
								<span className="text-sm text-muted-foreground">
									No headings found.
								</span>
							)}
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
