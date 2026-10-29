"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { GuestMenuCompactRow } from "../components/GuestMenuCompactRow";
import { planPhotoLoading } from "./photoLoading";
import { GuestMenuCategorySections } from "../components/GuestMenuCategorySections";
import type { GuestMenuDishListProps, GuestMenuSectionsProps, GuestMenuTemplateRuntime } from "./types";

/** Expanded rows are tracked across categories so a search re-render does not collapse them. */
const CompactExpandedContext = createContext<{
    isExpanded: (id: string) => boolean;
    toggle: (id: string) => void;
} | null>(null);

function CompactState({ children }: { children: ReactNode }) {
    const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
    const isExpanded = useCallback((id: string) => expanded.has(id), [expanded]);
    const toggle = useCallback((id: string) => {
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, []);
    return <CompactExpandedContext.Provider value={{ isExpanded, toggle }}>{children}</CompactExpandedContext.Provider>;
}

function CompactDishList({ items, prioritizeImages }: GuestMenuDishListProps) {
    // photos only render when a row is expanded.
    const photoLoading = planPhotoLoading(items, prioritizeImages, { priority: 0, eager: 0 });
    const state = useContext(CompactExpandedContext);
    return (
        <ul className="relative z-0 mb-5 space-y-0.5">
            {items.map((item, itemIndex) => (
                <GuestMenuCompactRow
                    key={item.id}
                    item={item}
                    itemIndex={itemIndex}
                    imageLoading={photoLoading[itemIndex]}
                    expanded={state?.isExpanded(item.id) ?? false}
                    onToggle={() => state?.toggle(item.id)}
                />
            ))}
        </ul>
    );
}

export const compactTemplate = {
    State: CompactState,
    DishList: CompactDishList,
} satisfies GuestMenuTemplateRuntime;

/**
 * Default export for `registry.tsx`'s `dynamic(() => import("./compact"))`. Keeping the `import()` literal
 * inside the `dynamic()` call lets Next preload this chunk from the SSR HTML, so hydration never
 * swaps the server-rendered menu for the loading skeleton.
 */
export default function CompactSections(props: GuestMenuSectionsProps) {
    return <GuestMenuCategorySections template={compactTemplate} {...props} />;
}
