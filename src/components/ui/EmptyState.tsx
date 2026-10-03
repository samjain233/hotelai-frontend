import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description?: string;
    action?: ReactNode;
    className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-panel/60 px-6 py-14 text-center",
                className,
            )}
        >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand/10 ring-1 ring-brand/25">
                <Icon className="h-5 w-5 text-brand" aria-hidden />
            </div>
            <h3 className="mt-4 text-base font-semibold text-foreground">{title}</h3>
            {description && <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">{description}</p>}
            {action && <div className="mt-5 flex flex-wrap items-center justify-center gap-2">{action}</div>}
        </div>
    );
}
