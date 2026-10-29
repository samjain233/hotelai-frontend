"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { GuestMenuItemCard } from "../components/GuestMenuItemCard";
import { planPhotoLoading } from "./photoLoading";
import { GuestMenuCategorySections } from "../components/GuestMenuCategorySections";
import type { GuestMenuDishListProps, GuestMenuSectionsProps, GuestMenuTemplateRuntime } from "./types";

const ClassicDescContext = createContext<{
    expandedDescId: string | null;
    setExpandedDescId: React.Dispatch<React.SetStateAction<string | null>>;
} | null>(null);

function ClassicState({ children }: { children: ReactNode }) {
    const [expandedDescId, setExpandedDescId] = useState<string | null>(null);
    return <ClassicDescContext.Provider value={{ expandedDescId, setExpandedDescId }}>{children}</ClassicDescContext.Provider>;
}

function ClassicDishList({ items, prioritizeImages }: GuestMenuDishListProps) {
    // ~3 photo rows fit under the header on a 390×844 phone.
    const photoLoading = planPhotoLoading(items, prioritizeImages, { priority: 1, eager: 3 });
    const desc = useContext(ClassicDescContext);
    const expandedDescId = desc?.expandedDescId ?? null;
    const setExpandedDescId = desc?.setExpandedDescId ?? (() => {});

    return (
        <ul className="relative z-0 divide-y divide-[var(--guest-line)]/80">
            {items.map((item, itemIndex) => (
                <GuestMenuItemCard
                    key={item.id}
                    item={item}
                    itemIndex={itemIndex}
                    imageLoading={photoLoading[itemIndex]}
                    expandedDescId={expandedDescId}
                    setExpandedDescId={setExpandedDescId}
                />
            ))}
        </ul>
    );
}

export const classicTemplate = {
    State: ClassicState,
    DishList: ClassicDishList,
} satisfies GuestMenuTemplateRuntime;

/**
 * Default export for `registry.tsx`'s `dynamic(() => import("./classic"))`. Keeping the `import()` literal
 * inside the `dynamic()` call lets Next preload this chunk from the SSR HTML, so hydration never
 * swaps the server-rendered menu for the loading skeleton.
 */
export default function ClassicSections(props: GuestMenuSectionsProps) {
    return <GuestMenuCategorySections template={classicTemplate} {...props} />;
}
