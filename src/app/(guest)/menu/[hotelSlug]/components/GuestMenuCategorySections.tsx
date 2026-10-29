"use client";

import { CategoryIconDisplay } from "@/lib/categoryIcons";
import type { GuestMenuSectionsProps, GuestMenuTemplateRuntime } from "../templates/types";

interface GuestMenuCategorySectionsProps extends GuestMenuSectionsProps {
    template: GuestMenuTemplateRuntime;
}

/** Renders every category as a section with a sticky header, delegating the dishes to the template. */
export function GuestMenuCategorySections({ template, displayCategories, searchNormalized }: GuestMenuCategorySectionsProps) {
    const { DishList, State } = template;

    return (
        <State>
            {displayCategories.map((cat, catIndex) => {
                const count = (cat.items ?? []).length;
                return (
                    <section
                        key={cat.id}
                        id={`cat-${cat.id}`}
                        data-category-id={cat.id}
                        aria-labelledby={`cat-title-${cat.id}`}
                        className="relative isolate motion-reduce:transition-none"
                        style={{
                            scrollMarginTop: "calc(var(--guest-menu-sticky-top, 7rem) - 1px)",
                            minHeight:
                                catIndex === displayCategories.length - 1 && displayCategories.length > 1
                                    ? "calc(100dvh - var(--guest-menu-sticky-top, 7rem) - 6rem)"
                                    : undefined,
                        }}
                    >
                        <div
                            className="sticky z-[41] -mx-4 mb-3 flex items-center justify-between gap-3 border-b border-[var(--guest-line)] bg-[var(--guest-bg)] px-4 py-3"
                            style={{ top: "var(--guest-menu-sticky-top, 7rem)" }}
                        >
                            <h2
                                id={`cat-title-${cat.id}`}
                                className="flex min-w-0 items-center gap-2 text-[17px] font-bold tracking-tight text-[var(--guest-text)]"
                            >
                                <CategoryIconDisplay icon={cat.icon} size="md" className="shrink-0 text-[var(--guest-accent)]" />
                                <span className="truncate">{cat.name}</span>
                            </h2>
                            <span className="shrink-0 text-xs tabular-nums text-[var(--guest-muted)]">
                                {count} {count === 1 ? "dish" : "dishes"}
                            </span>
                        </div>
                        <DishList items={cat.items ?? []} prioritizeImages={!searchNormalized && catIndex === 0} />
                    </section>
                );
            })}
        </State>
    );
}

/** Shown for the moment between the hotel data arriving and its template chunk loading. */
export function GuestMenuSectionsSkeleton() {
    return (
        <div aria-busy="true" aria-label="Loading menu" className="animate-pulse space-y-3 pt-1">
            {[0, 1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3 rounded-xl border border-[var(--guest-line)] bg-[var(--guest-surface)] p-3">
                    <div className="h-16 w-16 shrink-0 rounded-lg bg-[var(--guest-shimmer)]/50" />
                    <div className="min-w-0 flex-1 space-y-2 py-1">
                        <div className="h-3 w-2/3 rounded-full bg-[var(--guest-shimmer)]/60" />
                        <div className="h-2.5 w-full rounded-full bg-[var(--guest-shimmer)]/35" />
                        <div className="h-3 w-1/4 rounded-full bg-[var(--guest-shimmer)]/60" />
                    </div>
                </div>
            ))}
        </div>
    );
}
