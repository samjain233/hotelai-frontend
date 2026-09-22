"use client";

import { cn } from "@/lib/utils";
import { GuestPublicMenuCategory } from "@/lib/types";
import { CategoryIconDisplay } from "@/lib/categoryIcons";
import { GuestMenuItemCard } from "./GuestMenuItemCard";
import { useState } from "react";
import { useGuestMenuContext } from "./GuestMenuContext";

interface GuestMenuListProps {
    displayCategories: GuestPublicMenuCategory[];
    brandingBarHidden: boolean;
    menuFiltersActive: boolean;
    searchNormalized: string;
}

export function GuestMenuList({
    displayCategories,
    brandingBarHidden,
    menuFiltersActive,
    searchNormalized,
}: GuestMenuListProps) {
    const [expandedDescId, setExpandedDescId] = useState<string | null>(null);

    return (
        <>
            {displayCategories.map((cat, catIndex) => (
                <div
                    key={cat.id}
                    id={`cat-${cat.id}`}
                    data-category-id={cat.id}
                    className={cn(
                        "relative isolate motion-reduce:transition-none",
                        brandingBarHidden && menuFiltersActive && "scroll-mt-[9.75rem] sm:scroll-mt-[10.5rem]",
                        brandingBarHidden && !menuFiltersActive && "scroll-mt-[6.75rem] sm:scroll-mt-[7.25rem]",
                        !brandingBarHidden && menuFiltersActive && "scroll-mt-[13.25rem] sm:scroll-mt-[14rem]",
                        !brandingBarHidden && !menuFiltersActive && "scroll-mt-[10.25rem] sm:scroll-mt-[11rem]",
                    )}
                >
                    <div
                        className="sticky z-[41] -mx-4 mb-4 border-b border-[var(--guest-line)] bg-[var(--guest-bg)] px-4 py-2.5 shadow-[0_1px_0_rgba(0,0,0,0.4)] backdrop-blur-md supports-[backdrop-filter]:bg-[var(--guest-bg)]"
                        style={{ top: "var(--guest-menu-sticky-top, 7rem)" }}
                    >
                        <h2 className="flex items-center gap-2 text-base font-bold tracking-tight text-[var(--guest-text)]">
                            <CategoryIconDisplay icon={cat.icon} size="md" className="text-[var(--guest-accent)]" />
                            {cat.name}
                        </h2>
                    </div>
                    <ul className="relative z-0 divide-y divide-[var(--guest-line)]/80">
                        {(cat.items ?? []).map((item, itemIndex) => {
                            const isPriorityImage = !searchNormalized && catIndex === 0 && itemIndex < 4;
                            return (
                                <GuestMenuItemCard
                                    key={item.id}
                                    item={item}
                                    itemIndex={itemIndex}
                                    catIndex={catIndex}
                                    isPriorityImage={!!isPriorityImage}
                                    expandedDescId={expandedDescId}
                                    setExpandedDescId={setExpandedDescId}
                                />
                            );
                        })}
                    </ul>
                </div>
            ))}
        </>
    );
}
