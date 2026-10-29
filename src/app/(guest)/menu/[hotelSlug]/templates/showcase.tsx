"use client";

import type { ReactNode } from "react";
import { GuestMenuShowcaseCard } from "../components/GuestMenuShowcaseCard";
import { planPhotoLoading } from "./photoLoading";
import { GuestMenuCategorySections } from "../components/GuestMenuCategorySections";
import type { GuestMenuDishListProps, GuestMenuSectionsProps, GuestMenuTemplateRuntime } from "./types";

function ShowcaseState({ children }: { children: ReactNode }) {
    return children;
}

function ShowcaseDishList({ items, prioritizeImages }: GuestMenuDishListProps) {
    // full-width cards, ~2 visible.
    const photoLoading = planPhotoLoading(items, prioritizeImages, { priority: 1, eager: 2 });
    return (
        <ul className="relative z-0 mb-6 flex flex-col gap-4">
            {items.map((item, itemIndex) => (
                <GuestMenuShowcaseCard
                    key={item.id}
                    item={item}
                    itemIndex={itemIndex}
                    imageLoading={photoLoading[itemIndex]}
                />
            ))}
        </ul>
    );
}

export const showcaseTemplate = {
    State: ShowcaseState,
    DishList: ShowcaseDishList,
} satisfies GuestMenuTemplateRuntime;

/**
 * Default export for `registry.tsx`'s `dynamic(() => import("./showcase"))`. Keeping the `import()` literal
 * inside the `dynamic()` call lets Next preload this chunk from the SSR HTML, so hydration never
 * swaps the server-rendered menu for the loading skeleton.
 */
export default function ShowcaseSections(props: GuestMenuSectionsProps) {
    return <GuestMenuCategorySections template={showcaseTemplate} {...props} />;
}
