"use client";

import type { ReactNode } from "react";
import { GuestMenuBistroRow } from "../components/GuestMenuBistroRow";
import { planPhotoLoading } from "./photoLoading";
import { GuestMenuCategorySections } from "../components/GuestMenuCategorySections";
import type { GuestMenuDishListProps, GuestMenuSectionsProps, GuestMenuTemplateRuntime } from "./types";

function BistroState({ children }: { children: ReactNode }) {
    return children;
}

function BistroDishList({ items, prioritizeImages }: GuestMenuDishListProps) {
    // 60px thumbnails, 5 rows fit on a 390×844 phone.
    const photoLoading = planPhotoLoading(items, prioritizeImages, { priority: 1, eager: 5 });
    return (
        <ul className="relative z-0 mb-4">
            {items.map((item, itemIndex) => (
                <GuestMenuBistroRow
                    key={item.id}
                    item={item}
                    itemIndex={itemIndex}
                    imageLoading={photoLoading[itemIndex]}
                />
            ))}
        </ul>
    );
}

export const bistroTemplate = {
    State: BistroState,
    DishList: BistroDishList,
} satisfies GuestMenuTemplateRuntime;

/**
 * Default export for `registry.tsx`'s `dynamic(() => import("./bistro"))`. Keeping the `import()` literal
 * inside the `dynamic()` call lets Next preload this chunk from the SSR HTML, so hydration never
 * swaps the server-rendered menu for the loading skeleton.
 */
export default function BistroSections(props: GuestMenuSectionsProps) {
    return <GuestMenuCategorySections template={bistroTemplate} {...props} />;
}
