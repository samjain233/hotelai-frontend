"use client";

import { useSyncExternalStore } from "react";
import { AdminPageSkeleton, OrdersSkeleton, RoomsSkeleton, Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

export const SIDEBAR_COLLAPSED_KEY = "admin-sidebar-collapsed";

/** Card counts each page passes to its own `AdminPageSkeleton`, so the hand-over does not jump. */
const PAGE_CARD_COUNTS: Record<string, number> = {
    "/dashboard": 4,
    "/analytics": 4,
    "/staff": 4,
    "/menu": 9,
    "/menu/availability": 6,
    "/menu-design": 2,
    "/settings": 1,
    "/service-catalogue": 6,
};

function PageSkeleton({ pathname }: { pathname: string }) {
    if (["/orders", "/kitchen", "/services"].includes(pathname)) return <OrdersSkeleton />;
    if (pathname === "/rooms" || pathname === "/front-desk") return <RoomsSkeleton />;
    return <AdminPageSkeleton cardCount={PAGE_CARD_COUNTS[pathname] ?? 6} />;
}

const noopSubscribe = () => () => {};

/**
 * The admin shell's outline while the session is checked. Mirrors `AdminShell`'s layout classes so
 * the sidebar, header and page skeleton stay in place when the real shell replaces it.
 */
export function AdminShellSkeleton({ pathname }: { pathname: string }) {
    // This renders on the server, which cannot read localStorage; hydrate expanded, then correct.
    const collapsed = useSyncExternalStore(
        noopSubscribe,
        () => localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true",
        () => false,
    );

    return (
        <div className="flex min-h-screen flex-col bg-canvas text-foreground" role="status" aria-busy="true">
            <span className="sr-only">Loading</span>
            <div className="flex flex-1 min-h-0">
                <aside
                    className={cn(
                        "fixed bottom-2 left-2 top-2 z-40 hidden flex-col rounded-2xl border border-border bg-panel print:hidden lg:flex",
                        collapsed ? "w-[68px]" : "w-[248px]",
                    )}
                    aria-hidden
                >
                    <div className={cn("flex h-14 shrink-0 items-center gap-2.5 border-b border-border", collapsed ? "justify-center px-2" : "px-3")}>
                        <Skeleton className="h-8 w-8 shrink-0 rounded-lg" />
                        {!collapsed && (
                            <div className="flex-1 space-y-1.5">
                                <Skeleton className="h-3.5 w-28" />
                                <Skeleton className="h-2.5 w-16" />
                            </div>
                        )}
                    </div>
                    <div className="flex-1 space-y-2 px-4 py-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="h-9 rounded-lg bg-secondary/60 animate-pulse" />
                        ))}
                    </div>
                    <div className="shrink-0 border-t border-border p-3">
                        <div className={cn("flex items-center gap-2.5 rounded-xl border border-border bg-canvas/60 p-2", collapsed && "justify-center border-0 bg-transparent p-0")}>
                            <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
                            {!collapsed && (
                                <div className="flex-1 space-y-1.5">
                                    <Skeleton className="h-3.5 w-24" />
                                    <Skeleton className="h-2.5 w-32" />
                                </div>
                            )}
                        </div>
                    </div>
                </aside>

                <div className={cn("flex min-w-0 flex-1 flex-col", collapsed ? "lg:pl-[84px]" : "lg:pl-[264px]")}>
                    <header className="sticky top-0 z-30 px-2 pt-2 print:hidden lg:pl-0" aria-hidden>
                        <div className="flex h-14 items-center justify-between gap-3 rounded-2xl border border-border bg-panel/90 px-3 backdrop-blur-md sm:px-4">
                            <div className="flex items-center gap-2">
                                <Skeleton className="h-9 w-9 rounded-lg lg:hidden" />
                                <Skeleton className="h-4 w-32" />
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Skeleton className="h-8 w-8 rounded-lg" />
                                <Skeleton className="h-8 w-8 rounded-full" />
                            </div>
                        </div>
                    </header>

                    <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                        <PageSkeleton pathname={pathname} />
                    </main>
                </div>
            </div>
        </div>
    );
}
