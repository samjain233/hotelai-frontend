"use client";

import type { ReactNode } from "react";
import { GuestMenuCarouselCard } from "../components/GuestMenuCarouselCard";
import { planPhotoLoading } from "./photoLoading";
import { GuestMenuCategorySections } from "../components/GuestMenuCategorySections";
import type { GuestMenuDishListProps, GuestMenuSectionsProps, GuestMenuTemplateRuntime } from "./types";

function CarouselState({ children }: { children: ReactNode }) {
    return children;
}

function CarouselDishList({ items, prioritizeImages }: GuestMenuDishListProps) {
    // 210px cards, ~2 visible across; rest scroll in.
    const photoLoading = planPhotoLoading(items, prioritizeImages, { priority: 1, eager: 2 });
    return (
        // Bleeds to the screen edge (-mx-4 matches the page gutter) so the next card peeks in as a swipe hint.
        <ul className="relative z-0 -mx-4 mb-6 flex snap-x snap-mandatory items-stretch gap-3 overflow-x-auto px-4 pb-2 scroll-px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {items.map((item, itemIndex) => (
                <GuestMenuCarouselCard
                    key={item.id}
                    item={item}
                    itemIndex={itemIndex}
                    imageLoading={photoLoading[itemIndex]}
                />
            ))}
        </ul>
    );
}

export const carouselTemplate = {
    State: CarouselState,
    DishList: CarouselDishList,
} satisfies GuestMenuTemplateRuntime;

/**
 * Default export for `registry.tsx`'s `dynamic(() => import("./carousel"))`. Keeping the `import()` literal
 * inside the `dynamic()` call lets Next preload this chunk from the SSR HTML, so hydration never
 * swaps the server-rendered menu for the loading skeleton.
 */
export default function CarouselSections(props: GuestMenuSectionsProps) {
    return <GuestMenuCategorySections template={carouselTemplate} {...props} />;
}
