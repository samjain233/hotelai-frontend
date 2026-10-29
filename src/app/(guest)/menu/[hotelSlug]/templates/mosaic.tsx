"use client";

import type { ReactNode } from "react";
import { GuestMenuMosaicTile } from "../components/GuestMenuMosaicTile";
import { planPhotoLoading } from "./photoLoading";
import { GuestMenuCategorySections } from "../components/GuestMenuCategorySections";
import type { GuestMenuDishListProps, GuestMenuSectionsProps, GuestMenuTemplateRuntime } from "./types";

function MosaicState({ children }: { children: ReactNode }) {
    return children;
}

/** Tiles per cycle: one wide hero followed by four squares (two rows of two). */
const CYCLE = 5;

/**
 * Wide tiles open every cycle so each category starts with a hero and the rhythm repeats on long
 * categories. A last square that would sit alone in its row is widened too, so no row is left ragged.
 */
function isWideTile(index: number, count: number): boolean {
    const slot = index % CYCLE;
    if (slot === 0) return true;
    const isLast = index === count - 1;
    const startsRow = slot % 2 === 1;
    return isLast && startsRow;
}

function MosaicDishList({ items, prioritizeImages }: GuestMenuDishListProps) {
    // 2-col bento, same as gallery: 5 photos fit on a 390×844 phone.
    const photoLoading = planPhotoLoading(items, prioritizeImages, { priority: 2, eager: 5 });
    return (
        <ul className="relative z-0 mb-6 grid grid-cols-2 gap-3">
            {items.map((item, itemIndex) => (
                <GuestMenuMosaicTile
                    key={item.id}
                    item={item}
                    itemIndex={itemIndex}
                    imageLoading={photoLoading[itemIndex]}
                    wide={isWideTile(itemIndex, items.length)}
                />
            ))}
        </ul>
    );
}

export const mosaicTemplate = {
    State: MosaicState,
    DishList: MosaicDishList,
} satisfies GuestMenuTemplateRuntime;

/**
 * Default export for `registry.tsx`'s `dynamic(() => import("./mosaic"))`. Keeping the `import()` literal
 * inside the `dynamic()` call lets Next preload this chunk from the SSR HTML, so hydration never
 * swaps the server-rendered menu for the loading skeleton.
 */
export default function MosaicSections(props: GuestMenuSectionsProps) {
    return <GuestMenuCategorySections template={mosaicTemplate} {...props} />;
}
