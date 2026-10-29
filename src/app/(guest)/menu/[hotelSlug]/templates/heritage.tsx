"use client";

import { Fragment, type ReactNode } from "react";
import { GuestMenuHeritageEntry } from "../components/GuestMenuHeritageEntry";
import { planPhotoLoading } from "./photoLoading";
import { GuestMenuCategorySections } from "../components/GuestMenuCategorySections";
import type { GuestMenuDishListProps, GuestMenuSectionsProps, GuestMenuTemplateRuntime } from "./types";

function HeritageState({ children }: { children: ReactNode }) {
    return children;
}

/** Short centred rule between dishes, printed-menu style, instead of a full-width line. */
function HeritageDivider() {
    return (
        <li aria-hidden className="flex items-center justify-center gap-2 py-0.5">
            <span className="h-px w-8 bg-[var(--guest-accent-40)]" />
            <span className="h-1 w-1 rotate-45 bg-[var(--guest-accent-55)]" />
            <span className="h-px w-8 bg-[var(--guest-accent-40)]" />
        </li>
    );
}

function HeritageDishList({ items, prioritizeImages }: GuestMenuDishListProps) {
    // tall centred entries, ~3 visible.
    const photoLoading = planPhotoLoading(items, prioritizeImages, { priority: 1, eager: 3 });
    return (
        // Double-rule frame: an outer hairline with a thin gap to an inner hairline.
        <div className="mb-8 border border-[var(--guest-accent-40)] p-1">
            <ul className="relative z-0 border border-[var(--guest-accent-25)] px-2 py-2">
                {items.map((item, itemIndex) => (
                    <Fragment key={item.id}>
                        <GuestMenuHeritageEntry
                            item={item}
                            itemIndex={itemIndex}
                            imageLoading={photoLoading[itemIndex]}
                        />
                        {itemIndex < items.length - 1 && <HeritageDivider />}
                    </Fragment>
                ))}
            </ul>
        </div>
    );
}

export const heritageTemplate = {
    State: HeritageState,
    DishList: HeritageDishList,
} satisfies GuestMenuTemplateRuntime;

/**
 * Default export for `registry.tsx`'s `dynamic(() => import("./heritage"))`. Keeping the `import()` literal
 * inside the `dynamic()` call lets Next preload this chunk from the SSR HTML, so hydration never
 * swaps the server-rendered menu for the loading skeleton.
 */
export default function HeritageSections(props: GuestMenuSectionsProps) {
    return <GuestMenuCategorySections template={heritageTemplate} {...props} />;
}
