"use client";

import type { ReactNode } from "react";
import { GuestMenuBoldRow } from "../components/GuestMenuBoldRow";
import { planPhotoLoading } from "./photoLoading";
import { GuestMenuCategorySections } from "../components/GuestMenuCategorySections";
import type { GuestMenuDishListProps, GuestMenuSectionsProps, GuestMenuTemplateRuntime } from "./types";

function BoldState({ children }: { children: ReactNode }) {
    return children;
}

function BoldDishList({ items, prioritizeImages }: GuestMenuDishListProps) {
    // 84px circles, 3 rows fit on a 390×844 phone.
    const photoLoading = planPhotoLoading(items, prioritizeImages, { priority: 1, eager: 3 });
    return (
        <ul className="relative z-0 mb-4">
            {items.map((item, itemIndex) => (
                <GuestMenuBoldRow
                    key={item.id}
                    item={item}
                    itemIndex={itemIndex}
                    imageLoading={photoLoading[itemIndex]}
                />
            ))}
        </ul>
    );
}

export const boldTemplate = {
    State: BoldState,
    DishList: BoldDishList,
} satisfies GuestMenuTemplateRuntime;

/**
 * Default export for `registry.tsx`'s `dynamic(() => import("./bold"))`. Keeping the `import()` literal
 * inside the `dynamic()` call lets Next preload this chunk from the SSR HTML, so hydration never
 * swaps the server-rendered menu for the loading skeleton.
 */
export default function BoldSections(props: GuestMenuSectionsProps) {
    return <GuestMenuCategorySections template={boldTemplate} {...props} />;
}
