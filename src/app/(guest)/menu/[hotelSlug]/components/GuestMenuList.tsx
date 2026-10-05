"use client";

import { GuestPublicMenuCategory } from "@/lib/types";
import { CategoryIconDisplay } from "@/lib/categoryIcons";
import { resolveGuestMenuTemplate } from "@/lib/guestMenuTemplates";
import { GUEST_MENU_TEMPLATE_REGISTRY } from "../templates/registry";
import { useGuestMenuContext } from "./GuestMenuContext";

interface GuestMenuListProps {
    displayCategories: GuestPublicMenuCategory[];
    searchNormalized: string;
}

export function GuestMenuList({ displayCategories, searchNormalized }: GuestMenuListProps) {
    const { hotel } = useGuestMenuContext();
    const { DishList, State } = GUEST_MENU_TEMPLATE_REGISTRY[resolveGuestMenuTemplate(hotel?.guestMenuTemplate)];

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
