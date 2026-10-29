"use client";

import type { ReactNode } from "react";
import { GuestMenuSereneEntry } from "../components/GuestMenuSereneEntry";
import { planPhotoLoading } from "./photoLoading";
import { GuestMenuCategorySections } from "../components/GuestMenuCategorySections";
import type { GuestMenuDishListProps, GuestMenuSectionsProps, GuestMenuTemplateRuntime } from "./types";

function SereneState({ children }: { children: ReactNode }) {
    return children;
}

function SereneDishList({ items, prioritizeImages }: GuestMenuDishListProps) {
    // full-width 3:2 photos, ~2 visible.
    const photoLoading = planPhotoLoading(items, prioritizeImages, { priority: 1, eager: 2 });
    return (
        <ul className="relative z-0 mb-4">
            {items.map((item, itemIndex) => (
                <GuestMenuSereneEntry
                    key={item.id}
                    item={item}
                    itemIndex={itemIndex}
                    imageLoading={photoLoading[itemIndex]}
                />
            ))}
        </ul>
    );
}

export const sereneTemplate = {
    State: SereneState,
    DishList: SereneDishList,
} satisfies GuestMenuTemplateRuntime;

/**
 * Default export for `registry.tsx`'s `dynamic(() => import("./serene"))`. Keeping the `import()` literal
 * inside the `dynamic()` call lets Next preload this chunk from the SSR HTML, so hydration never
 * swaps the server-rendered menu for the loading skeleton.
 */
export default function SereneSections(props: GuestMenuSectionsProps) {
    return <GuestMenuCategorySections template={sereneTemplate} {...props} />;
}
