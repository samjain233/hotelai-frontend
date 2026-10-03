"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { GuestMenuItemCard } from "../components/GuestMenuItemCard";
import type { GuestMenuDishListProps, GuestMenuTemplateModule } from "./types";

const ClassicDescContext = createContext<{
    expandedDescId: string | null;
    setExpandedDescId: React.Dispatch<React.SetStateAction<string | null>>;
} | null>(null);

function ClassicState({ children }: { children: ReactNode }) {
    const [expandedDescId, setExpandedDescId] = useState<string | null>(null);
    return <ClassicDescContext.Provider value={{ expandedDescId, setExpandedDescId }}>{children}</ClassicDescContext.Provider>;
}

function ClassicDishList({ items, prioritizeImages }: GuestMenuDishListProps) {
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
                    isPriorityImage={prioritizeImages && itemIndex < 4}
                    expandedDescId={expandedDescId}
                    setExpandedDescId={setExpandedDescId}
                />
            ))}
        </ul>
    );
}

function ClassicThumbnail() {
    return (
        <div className="space-y-1.5">
            {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-1.5 rounded-md bg-zinc-800 p-1.5 ring-1 ring-white/5">
                    <div className="min-w-0 flex-1 space-y-1">
                        <div className="h-1 w-3/4 rounded-full bg-zinc-500" />
                        <div className="h-1 w-1/3 rounded-full bg-rose-400/80" />
                    </div>
                    <div className="h-5 w-5 shrink-0 rounded bg-zinc-600" />
                </div>
            ))}
        </div>
    );
}

function ClassicPreviewDishes() {
    return (
        <div className="space-y-2.5">
            <div className="flex gap-2.5 rounded-xl border border-[var(--guest-line)] bg-[var(--guest-surface)] p-2.5">
                <div className="h-14 w-14 shrink-0 rounded-lg bg-[var(--guest-shimmer)]/50 ring-1 ring-[var(--guest-line)]" />
                <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-[var(--guest-text)]">Sample dish name</p>
                    <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-[var(--guest-muted)]">
                        Description uses the muted tone so longer copy stays readable.
                    </p>
                    <p className="mt-1 text-xs font-bold text-[var(--guest-accent)]">₹499</p>
                </div>
            </div>
            <div className="flex gap-2.5 rounded-xl border border-[var(--guest-line)] bg-[var(--guest-surface)] p-2.5">
                <div className="h-14 w-14 shrink-0 rounded-lg bg-[var(--guest-shimmer)]/50 ring-1 ring-[var(--guest-line)]" />
                <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-[var(--guest-text)]">Second item</p>
                    <p className="mt-1 text-xs font-bold text-[var(--guest-accent)]">₹350</p>
                </div>
            </div>
        </div>
    );
}

export const classicTemplate = {
    State: ClassicState,
    DishList: ClassicDishList,
    Thumbnail: ClassicThumbnail,
    PreviewDishes: ClassicPreviewDishes,
} satisfies GuestMenuTemplateModule;
