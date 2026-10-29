"use client";

import type { ReactNode } from "react";
import { GuestMenuBoardRow } from "../components/GuestMenuBoardRow";
import { planPhotoLoading } from "./photoLoading";
import { GuestMenuCategorySections } from "../components/GuestMenuCategorySections";
import type { GuestMenuDishListProps, GuestMenuSectionsProps, GuestMenuTemplateRuntime } from "./types";

function BoardState({ children }: { children: ReactNode }) {
    return children;
}

function BoardDishList({ items, prioritizeImages }: GuestMenuDishListProps) {
    // 56px thumbnails, 5 rows fit on a 390×844 phone.
    const photoLoading = planPhotoLoading(items, prioritizeImages, { priority: 1, eager: 5 });
    return (
        <div className="mb-7 rounded-lg border-2 border-dashed border-[var(--guest-text-25)] px-3.5 py-1">
            <ul className="relative z-0 divide-y divide-dashed divide-[var(--guest-text-18)]">
                {items.map((item, itemIndex) => (
                    <GuestMenuBoardRow
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

export const boardTemplate = {
    State: BoardState,
    DishList: BoardDishList,
} satisfies GuestMenuTemplateRuntime;

/**
 * Default export for `registry.tsx`'s `dynamic(() => import("./board"))`. Keeping the `import()` literal
 * inside the `dynamic()` call lets Next preload this chunk from the SSR HTML, so hydration never
 * swaps the server-rendered menu for the loading skeleton.
 */
export default function BoardSections(props: GuestMenuSectionsProps) {
    return <GuestMenuCategorySections template={boardTemplate} {...props} />;
}
