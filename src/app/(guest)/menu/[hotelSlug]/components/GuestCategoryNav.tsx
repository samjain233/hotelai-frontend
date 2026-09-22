"use client";

import { cn } from "@/lib/utils";
import { GuestPublicMenuCategory } from "@/lib/types";
import { X, Utensils } from "lucide-react";
import { CategoryIconDisplay } from "@/lib/categoryIcons";
import { useState } from "react";
import { useGuestMenuContext } from "./GuestMenuContext";

interface GuestCategoryNavProps {
    chipCategories: GuestPublicMenuCategory[];
    activeCategory: string;
    scrollToCategory: (categoryId: string) => void;
}

export function GuestCategoryNav({
    chipCategories,
    activeCategory,
    scrollToCategory,
}: GuestCategoryNavProps) {
    const ctx = useGuestMenuContext();
    const [showCategoryNav, setShowCategoryNav] = useState(false);

    const isVisible = ctx.digitalOrderingEnabled && !ctx.showCart && !ctx.showHistory && !ctx.showRoomModal && chipCategories.length > 0;

    return (
        <>
            {showCategoryNav && chipCategories.length > 0 ? (
                <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="guest-cat-nav-title">
                    <button type="button" className="absolute inset-0 bg-black/70 backdrop-blur-sm" aria-label="Close" onClick={() => setShowCategoryNav(false)} />
                    <div className="relative z-10 w-full max-w-md rounded-t-2xl border border-[var(--guest-line)] bg-[var(--guest-surface)] shadow-2xl sm:rounded-2xl">
                        <div className="flex items-center justify-between border-b border-[var(--guest-line)] px-5 py-4">
                            <h2 id="guest-cat-nav-title" className="text-base font-bold text-[var(--guest-text)]">
                                Jump to section
                            </h2>
                            <button
                                type="button"
                                onClick={() => setShowCategoryNav(false)}
                                className="rounded-full p-2 text-[var(--guest-muted)] hover:bg-[var(--guest-surface-2)] hover:text-[var(--guest-text)]"
                                aria-label="Close"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <ul className="max-h-[min(70vh,420px)] overflow-y-auto px-3 py-2">
                            {chipCategories.map((cat) => (
                                <li key={cat.id}>
                                    <button
                                        type="button"
                                        className={cn(
                                            "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition-colors",
                                            activeCategory === cat.id ? "bg-[var(--guest-accent-15)] text-[var(--guest-accent-70)]" : "text-[var(--guest-muted)] hover:bg-[var(--guest-shimmer)]/80",
                                        )}
                                        onClick={() => {
                                            scrollToCategory(cat.id);
                                            setShowCategoryNav(false);
                                        }}
                                    >
                                        <CategoryIconDisplay icon={cat.icon} size="sm" className={activeCategory === cat.id ? "text-[var(--guest-accent)]" : "text-[var(--guest-muted)]"} />
                                        {cat.name}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            ) : null}

            {isVisible ? (
                <button
                    type="button"
                    onClick={() => setShowCategoryNav(true)}
                    className={cn(
                        "fixed z-40 flex items-center gap-2 rounded-full border border-[var(--guest-line)] bg-[color-mix(in_srgb,var(--guest-surface-2)_92%,var(--guest-bg))] px-4 py-2.5 text-sm font-semibold text-[var(--guest-text)] shadow-lg shadow-black/40 backdrop-blur-md hover:opacity-90 active:scale-[0.98] transition-transform",
                        ctx.cartCount > 0 ? "bottom-[7.25rem] right-4" : "bottom-6 right-4",
                    )}
                >
                    <Utensils className="h-4 w-4 text-[var(--guest-accent)]" />
                    Menu
                </button>
            ) : null}
        </>
    );
}
