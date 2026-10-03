"use client";

import type { ReactNode } from "react";
import { GuestMenuGalleryCard } from "../components/GuestMenuGalleryCard";
import type { GuestMenuDishListProps, GuestMenuTemplateModule } from "./types";

function GalleryState({ children }: { children: ReactNode }) {
    return children;
}

function GalleryDishList({ items, prioritizeImages }: GuestMenuDishListProps) {
    return (
        <ul className="relative z-0 mb-6 grid grid-cols-2 gap-3">
            {items.map((item, itemIndex) => (
                <GuestMenuGalleryCard
                    key={item.id}
                    item={item}
                    itemIndex={itemIndex}
                    isPriorityImage={prioritizeImages && itemIndex < 4}
                />
            ))}
        </ul>
    );
}

function GalleryThumbnail() {
    return (
        <div className="grid grid-cols-2 gap-1.5">
            {[0, 1, 2, 3].map((i) => (
                <div key={i} className="overflow-hidden rounded-md bg-zinc-800 ring-1 ring-white/5">
                    <div className="h-5 bg-zinc-600" />
                    <div className="space-y-1 p-1">
                        <div className="h-1 w-3/4 rounded-full bg-zinc-500" />
                        <div className="h-1 w-1/3 rounded-full bg-rose-400/80" />
                    </div>
                </div>
            ))}
        </div>
    );
}

function GalleryPreviewDishes() {
    return (
        <div className="grid grid-cols-2 gap-2">
            {[
                { name: "Sample dish name", price: "₹499" },
                { name: "Second item", price: "₹350" },
                { name: "Chef's special", price: "₹620" },
                { name: "House salad", price: "₹280" },
            ].map((dish) => (
                <div key={dish.name} className="overflow-hidden rounded-xl border border-[var(--guest-line)] bg-[var(--guest-surface)]">
                    <div className="aspect-[4/3] bg-[var(--guest-shimmer)]/50" />
                    <div className="p-2">
                        <p className="truncate text-[10px] font-semibold text-[var(--guest-text)]">{dish.name}</p>
                        <p className="mt-0.5 text-[10px] font-bold text-[var(--guest-accent)]">{dish.price}</p>
                        <div className="mt-1.5 flex h-5 items-center justify-center rounded-md border border-[var(--guest-accent-70)] text-[8px] font-extrabold tracking-wider text-[var(--guest-accent)]">
                            ADD +
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

export const galleryTemplate = {
    State: GalleryState,
    DishList: GalleryDishList,
    Thumbnail: GalleryThumbnail,
    PreviewDishes: GalleryPreviewDishes,
} satisfies GuestMenuTemplateModule;
