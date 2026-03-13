import { useState } from 'react';
import { ThumbsUp, ThumbsDown, CheckCircle2 } from 'lucide-react';
import { SITE } from '@/config';

export default function Feedback() {
	const [submitted, setSubmitted] = useState(false);

	if (!SITE.feedback?.enabled) return null;

	const handleFeedback = (isHelpful: boolean) => {
		setSubmitted(true);
		
		const path = typeof window !== 'undefined' ? window.location.pathname : '';
		
		try {
			if (SITE.feedback.provider === 'umami') {
				// @ts-ignore
				if (window.umami) {
					// @ts-ignore
					window.umami.track('feedback', { helpful: isHelpful, path });
				}
			} else if (SITE.feedback.provider === 'plausible') {
				// @ts-ignore
				if (window.plausible) {
					// @ts-ignore
					window.plausible('Feedback', { props: { helpful: isHelpful, path } });
				}
			}
		} catch (e) {
			console.error('Failed to send feedback event', e);
		}
	};

	if (submitted) {
		return (
			<div className="mt-12 flex items-center justify-center gap-2 rounded-lg border border-border bg-muted/50 p-4 text-sm text-muted-foreground transition-all duration-300 animate-in fade-in zoom-in-95">
				<CheckCircle2 size={16} className="text-green-500" />
				Thank you for your feedback!
			</div>
		);
	}

	return (
		<div className="mt-12 flex flex-col items-center justify-between gap-4 rounded-lg border border-border bg-card p-4 sm:flex-row sm:px-6 transition-all duration-300">
			<span className="text-sm font-medium text-card-foreground">
				Was this page helpful?
			</span>
			<div className="flex items-center gap-2">
				<button
					onClick={() => handleFeedback(true)}
					className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
					aria-label="Yes, this page was helpful"
				>
					<ThumbsUp size={14} /> Yes
				</button>
				<button
					onClick={() => handleFeedback(false)}
					className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
					aria-label="No, this page was not helpful"
				>
					<ThumbsDown size={14} /> No
				</button>
			</div>
		</div>
	);
}
