"use client";

import type { GuestMenuTemplatePreview } from "./types";

function CarouselThumbnail() {
    return (
        <div className="flex h-full items-center gap-1.5 overflow-hidden pl-1">
            {[0, 1, 2].map((i) => (
                <div key={i} className="w-[46%] shrink-0 overflow-hidden rounded-md bg-zinc-800 ring-1 ring-white/5">
                    <div className="h-7 bg-gradient-to-br from-zinc-500 to-zinc-700" />
                    <div className="space-y-1 p-1.5">
                        <div className="h-1 w-4/5 rounded-full bg-zinc-300" />
                        <div className="h-1 w-1/2 rounded-full bg-zinc-600" />
                        <div className="flex items-center justify-between pt-0.5">
                            <div className="h-1.5 w-5 rounded-full bg-rose-400" />
                            <div className="h-2.5 w-7 rounded border border-rose-400/70" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

function CarouselPreviewDishes() {
    return (
        <div className="-mx-3 flex gap-2 overflow-hidden px-3">
            {[
                { name: "Sample dish name", price: "₹499", desc: "Description uses the muted tone." },
                { name: "Second item", price: "₹350", desc: "Short note." },
                { name: "Chef's special", price: "₹620", desc: "" },
            ].map((dish) => (
                <div
                    key={dish.name}
                    className="flex w-[118px] shrink-0 flex-col overflow-hidden rounded-xl border border-[var(--guest-line)] bg-[var(--guest-surface)]"
                >
                    <div className="aspect-[4/3] bg-[var(--guest-shimmer)]/50" />
                    <div className="flex flex-1 flex-col p-2">
                        <p className="truncate text-[10px] font-semibold text-[var(--guest-text)]">{dish.name}</p>
                        {dish.desc ? <p className="mt-0.5 truncate text-[9px] text-[var(--guest-muted)]">{dish.desc}</p> : null}
                        <div className="mt-auto flex items-center justify-between pt-1.5">
                            <p className="text-[10px] font-bold text-[var(--guest-accent)]">{dish.price}</p>
                            <div className="flex h-5 w-10 items-center justify-center rounded-md border border-[var(--guest-accent-70)] text-[8px] font-extrabold tracking-wider text-[var(--guest-accent)]">
                                ADD
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

export const carouselPreview = {
    Thumbnail: CarouselThumbnail,
    PreviewDishes: CarouselPreviewDishes,
} satisfies GuestMenuTemplatePreview;
