"use client";

import { Utensils, X } from "lucide-react";
import type { MenuItem } from "@/lib/types";

interface GuestMenuSearchNoticesProps {
    searchQuery: string;
    isSearchUnmatched: boolean;
    isDietUnmatched: boolean;
    didYouMeanItem: MenuItem | null;
    onSearch: (query: string) => void;
    onClearDietFilters: () => void;
}

/** "Nothing matched" cards shown above the fallback list when search or diet filters find no dish. */
export function GuestMenuSearchNotices({
    searchQuery,
    isSearchUnmatched,
    isDietUnmatched,
    didYouMeanItem,
    onSearch,
    onClearDietFilters,
}: GuestMenuSearchNoticesProps) {
    if (isSearchUnmatched) {
        return (
            <Notice title="Item not available">
                <p className="mt-1 text-xs sm:text-sm text-[var(--guest-muted)] leading-relaxed">
                    The food item &ldquo;<span className="font-semibold text-[var(--guest-text)]">{searchQuery.trim()}</span>&rdquo; is not available. You can try exploring our other delicious dishes below!
                </p>
                {didYouMeanItem ? (
                    <div className="mt-2.5 flex items-center gap-2 text-xs">
                        <span className="text-[var(--guest-muted)]">Did you mean:</span>
                        <button type="button" onClick={() => onSearch(didYouMeanItem.name)} className="font-semibold text-[var(--guest-accent)] hover:underline">
                            {didYouMeanItem.name}
                        </button>
                    </div>
                ) : null}
                <ClearButton label="Clear search" onClick={() => onSearch("")} />
            </Notice>
        );
    }
    if (isDietUnmatched) {
        return (
            <Notice title="No matching dishes">
                <p className="mt-1 text-xs sm:text-sm text-[var(--guest-muted)] leading-relaxed">
                    No dishes match your selected diet filters. Exploring all other available menu options below!
                </p>
                <ClearButton label="Clear diet filters" onClick={onClearDietFilters} />
            </Notice>
        );
    }
    return null;
}

function Notice({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="rounded-2xl border border-[var(--guest-accent-25)] bg-[var(--guest-accent-12)] p-4 sm:p-5 transition-all animate-fade-in-up">
            <div className="flex items-start gap-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--guest-accent-20)] text-[var(--guest-accent)]">
                    <Utensils className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                    <h3 className="text-sm sm:text-base font-bold text-[var(--guest-text)]">{title}</h3>
                    {children}
                </div>
            </div>
        </div>
    );
}

function ClearButton({ label, onClick }: { label: string; onClick: () => void }) {
    return (
        <div className="mt-3 flex items-center gap-2">
            <button
                type="button"
                onClick={onClick}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--guest-line)] bg-[var(--guest-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--guest-text)] shadow-sm hover:bg-[var(--guest-surface-2)] transition-colors"
            >
                <X className="h-3.5 w-3.5 text-[var(--guest-muted)]" />
                {label}
            </button>
        </div>
    );
}
