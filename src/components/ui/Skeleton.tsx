import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
    return (
        <div
            className={cn("rounded bg-secondary/40 animate-shimmer", className)}
            aria-hidden
        />
    );
}

/** Admin page skeleton: header + grid of cards */
export function AdminPageSkeleton({ cardCount = 6 }: { cardCount?: number }) {
    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-2">
                    <Skeleton className="h-9 w-48" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <div className="flex gap-3">
                    <Skeleton className="h-10 w-28 rounded-lg" />
                    <Skeleton className="h-10 w-24 rounded-lg" />
                </div>
            </div>
            <div className="border-b border-border pb-4">
                <Skeleton className="h-10 w-72 rounded-lg" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {Array.from({ length: cardCount }).map((_, i) => (
                    <div key={i} className="dashboard-card p-6 space-y-4">
                        <Skeleton className="h-40 w-full rounded-lg" />
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-1/2" />
                        <div className="flex justify-between pt-2">
                            <Skeleton className="h-6 w-16" />
                            <Skeleton className="h-8 w-20 rounded-lg" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

/** Orders/Kitchen: table-style skeleton */
export function OrdersSkeleton() {
    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-2">
                    <Skeleton className="h-9 w-32" />
                    <Skeleton className="h-4 w-56" />
                </div>
                <div className="flex gap-3">
                    <Skeleton className="h-10 w-48 rounded-lg" />
                    <Skeleton className="h-10 w-20 rounded-lg" />
                </div>
            </div>
            <div className="border-b border-border pb-2">
                <div className="flex gap-6">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-8 w-16 rounded" />
                    ))}
                </div>
            </div>
            <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex gap-4 p-4 rounded-xl border border-border">
                        <Skeleton className="h-12 w-12 rounded-lg flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-full" />
                            <Skeleton className="h-3 w-1/3" />
                        </div>
                        <Skeleton className="h-8 w-20 rounded-lg" />
                    </div>
                ))}
            </div>
        </div>
    );
}

/** Rooms: grid of room cards */
export function RoomsSkeleton() {
    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-2">
                    <Skeleton className="h-9 w-44" />
                    <Skeleton className="h-4 w-52" />
                </div>
                <div className="flex gap-3">
                    <Skeleton className="h-10 w-24 rounded-lg" />
                    <Skeleton className="h-10 w-28 rounded-lg" />
                </div>
            </div>
            <div className="flex justify-between items-center border-b border-border pb-6">
                <Skeleton className="h-10 w-72 rounded-lg" />
                <Skeleton className="h-4 w-24" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-6">
                {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="dashboard-card p-6 space-y-3">
                        <Skeleton className="h-24 w-full rounded-lg" />
                        <Skeleton className="h-5 w-16" />
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-8 w-full rounded-lg" />
                    </div>
                ))}
            </div>
        </div>
    );
}

/** Guest services: simpler card list */
export function GuestServicesSkeleton({ style }: { style?: React.CSSProperties }) {
    return (
        <div className="min-h-screen bg-[var(--guest-bg)] text-[var(--guest-text)]" style={style}>
            <div className="sticky top-0 z-20 bg-[var(--guest-bg)]/90 backdrop-blur-md border-b border-[var(--guest-line)] px-4 py-3">
                <div className="max-w-lg mx-auto flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg animate-shimmer bg-[var(--guest-shimmer)]/80" />
                    <div className="space-y-1">
                        <div className="h-5 w-32 rounded animate-shimmer bg-[var(--guest-shimmer)]/80" />
                        <div className="h-3 w-40 rounded animate-shimmer bg-[var(--guest-shimmer)]/80" />
                    </div>
                </div>
            </div>
            <div className="max-w-lg mx-auto p-4 space-y-4">
                <div className="flex gap-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-10 flex-1 rounded-xl animate-shimmer bg-[var(--guest-shimmer)]/80" />
                    ))}
                </div>
                <div className="pt-4 space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="rounded-xl border border-[var(--guest-line)] bg-[var(--guest-surface)] p-4 space-y-2">
                            <div className="h-4 w-3/4 rounded animate-shimmer bg-[var(--guest-shimmer)]/80" />
                            <div className="h-3 w-full rounded animate-shimmer bg-[var(--guest-shimmer)]/80" />
                            <div className="h-3 w-1/2 rounded animate-shimmer bg-[var(--guest-shimmer)]/80" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
