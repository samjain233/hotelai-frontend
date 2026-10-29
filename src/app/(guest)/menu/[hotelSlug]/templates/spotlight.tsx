"use client";

import type { ReactNode } from "react";
import { GuestMenuSpotlightHero, GuestMenuSpotlightRow } from "../components/GuestMenuSpotlightItems";
import { planPhotoLoading } from "./photoLoading";
import { GuestMenuCategorySections } from "../components/GuestMenuCategorySections";
import type { GuestMenuDishListProps, GuestMenuSectionsProps, GuestMenuTemplateRuntime } from "./types";

function SpotlightState({ children }: { children: ReactNode }) {
    return children;
}

/**
 * Chef-recommended dishes lead the category as hero cards; the rest follow as a tight list.
 * When a category has no recommendation the first dish takes the spotlight, so every
 * category keeps the same rhythm and the hotel sees what flagging a dish will do.
 */
function SpotlightDishList({ items, prioritizeImages }: GuestMenuDishListProps) {
    const heroes = items.filter((i) => i.chefRecommended);
    const featured = heroes.length > 0 ? heroes : items.slice(0, 1);
    const featuredIds = new Set(featured.map((i) => i.id));
    const rest = items.filter((i) => !featuredIds.has(i.id));
    // The first hero photo is the LCP; one more hero plus ~4 list thumbnails (48px) fit in the first viewport.
    const heroLoading = planPhotoLoading(featured, prioritizeImages, { priority: 1, eager: 2 });
    const rowLoading = planPhotoLoading(rest, prioritizeImages && featured.length <= 1, { priority: 0, eager: 4 });

    return (
        <div className="mb-6">
            <ul className="relative z-0 flex flex-col gap-3">
                {featured.map((item, itemIndex) => (
                    <GuestMenuSpotlightHero
                        key={item.id}
                        item={item}
                        itemIndex={itemIndex}
                        imageLoading={heroLoading[itemIndex]}
                    />
                ))}
            </ul>
            {rest.length > 0 && (
                <ul className="relative z-0 mt-2 divide-y divide-[var(--guest-line)]">
                    {rest.map((item, itemIndex) => (
                        <GuestMenuSpotlightRow
                            key={item.id}
                            item={item}
                            itemIndex={itemIndex}
                            imageLoading={rowLoading[itemIndex]}
                        />
                    ))}
                </ul>
            )}
        </div>
    );
}

export const spotlightTemplate = {
    State: SpotlightState,
    DishList: SpotlightDishList,
} satisfies GuestMenuTemplateRuntime;

/**
 * Default export for `registry.tsx`'s `dynamic(() => import("./spotlight"))`. Keeping the `import()` literal
 * inside the `dynamic()` call lets Next preload this chunk from the SSR HTML, so hydration never
 * swaps the server-rendered menu for the loading skeleton.
 */
export default function SpotlightSections(props: GuestMenuSectionsProps) {
    return <GuestMenuCategorySections template={spotlightTemplate} {...props} />;
}
