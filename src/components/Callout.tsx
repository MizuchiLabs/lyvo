import { cn } from '@/lib/utils';
import { Info, AlertTriangle, XCircle, CheckCircle2 } from 'lucide-react';

interface CalloutProps {
	type?: 'default' | 'warning' | 'danger' | 'success';
	title?: string;
	children: React.ReactNode;
}

export default function Callout({ type = 'default', title, children }: CalloutProps) {
	const types = {
		default: {
			icon: Info,
			classes:
				'border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200',
			iconClass: 'text-blue-600 dark:text-blue-400'
		},
		warning: {
			icon: AlertTriangle,
			classes:
				'border-orange-200 bg-orange-50 text-orange-900 dark:border-orange-500/30 dark:bg-orange-500/10 dark:text-orange-200',
			iconClass: 'text-orange-600 dark:text-orange-400'
		},
		danger: {
			icon: XCircle,
			classes:
				'border-red-200 bg-red-50 text-red-900 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200',
			iconClass: 'text-red-600 dark:text-red-400'
		},
		success: {
			icon: CheckCircle2,
			classes:
				'border-green-200 bg-green-50 text-green-900 dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-200',
			iconClass: 'text-green-600 dark:text-green-400'
		}
	};

	const Icon = types[type].icon;

	return (
		<div
			className={cn('my-6 flex items-start rounded-xl border p-4 shadow-sm', types[type].classes)}
		>
			<Icon className={cn('mt-[2px] mr-3 h-5 w-5 flex-shrink-0', types[type].iconClass)} />
			<div className="w-full min-w-0">
				{title && <h5 className="mb-1 leading-none font-semibold tracking-tight">{title}</h5>}
				<div className="text-sm leading-relaxed opacity-90 [&>p]:my-0 [&>p+p]:mt-2">{children}</div>
			</div>
		</div>
	);
}
