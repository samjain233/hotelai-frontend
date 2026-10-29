"use client";

import type { ReactNode } from "react";
import { GuestMenuGalleryCard } from "../components/GuestMenuGalleryCard";
import { planPhotoLoading } from "./photoLoading";
import { GuestMenuCategorySections } from "../components/GuestMenuCategorySections";
import type { GuestMenuDishListProps, GuestMenuSectionsProps, GuestMenuTemplateRuntime } from "./types";

function GalleryState({ children }: { children: ReactNode }) {
    return children;
}

function GalleryDishList({ items, prioritizeImages }: GuestMenuDishListProps) {
    // 2-col grid, first row is the LCP pair; 5 photos fit on a 390×844 phone.
    const photoLoading = planPhotoLoading(items, prioritizeImages, { priority: 2, eager: 5 });
    return (
        <ul className="relative z-0 mb-6 grid grid-cols-2 gap-3">
            {items.map((item, itemIndex) => (
                <GuestMenuGalleryCard
                    key={item.id}
                    item={item}
                    itemIndex={itemIndex}
                    imageLoading={photoLoading[itemIndex]}
                />
            ))}
        </ul>
    );
}

export const galleryTemplate = {
    State: GalleryState,
    DishList: GalleryDishList,
} satisfies GuestMenuTemplateRuntime;

/**
 * Default export for `registry.tsx`'s `dynamic(() => import("./gallery"))`. Keeping the `import()` literal
 * inside the `dynamic()` call lets Next preload this chunk from the SSR HTML, so hydration never
 * swaps the server-rendered menu for the loading skeleton.
 */
export default function GallerySections(props: GuestMenuSectionsProps) {
    return <GuestMenuCategorySections template={galleryTemplate} {...props} />;
}
