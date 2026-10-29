"use client";

import type { ReactNode } from "react";
import { GuestMenuEditorialRow } from "../components/GuestMenuEditorialRow";
import { planPhotoLoading } from "./photoLoading";
import { GuestMenuCategorySections } from "../components/GuestMenuCategorySections";
import type { GuestMenuDishListProps, GuestMenuSectionsProps, GuestMenuTemplateRuntime } from "./types";

function EditorialState({ children }: { children: ReactNode }) {
    return children;
}

/** Thin rule with a small accent diamond, the kind of ornament a printed menu puts under a section title. */
function EditorialOrnament() {
    return (
        <div aria-hidden className="mb-1 flex items-center gap-3">
            <span className="h-px flex-1 bg-[var(--guest-line)]" />
            <span className="h-1.5 w-1.5 rotate-45 bg-[var(--guest-accent)] opacity-80" />
            <span className="h-px flex-1 bg-[var(--guest-line)]" />
        </div>
    );
}

function EditorialDishList({ items, prioritizeImages }: GuestMenuDishListProps) {
    // 64px thumbnails, ~5 rows visible.
    const photoLoading = planPhotoLoading(items, prioritizeImages, { priority: 1, eager: 4 });
    return (
        <div className="mb-8">
            <EditorialOrnament />
            <ul className="relative z-0 divide-y divide-[var(--guest-line)]">
                {items.map((item, itemIndex) => (
                    <GuestMenuEditorialRow
                        key={item.id}
                        item={item}
                        itemIndex={itemIndex}
                        imageLoading={photoLoading[itemIndex]}
                    />
                ))}
            </ul>
        </div>
    );
}

export const editorialTemplate = {
    State: EditorialState,
    DishList: EditorialDishList,
} satisfies GuestMenuTemplateRuntime;

/**
 * Default export for `registry.tsx`'s `dynamic(() => import("./editorial"))`. Keeping the `import()` literal
 * inside the `dynamic()` call lets Next preload this chunk from the SSR HTML, so hydration never
 * swaps the server-rendered menu for the loading skeleton.
 */
export default function EditorialSections(props: GuestMenuSectionsProps) {
    return <GuestMenuCategorySections template={editorialTemplate} {...props} />;
}
