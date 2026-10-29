"use client";

import { Sparkles } from "lucide-react";
import type { GuestMenuTemplatePreview } from "./types";

function SpotlightThumbnail() {
    return (
        <div className="flex h-full flex-col justify-center gap-1.5 px-1">
            <div className="relative h-9 overflow-hidden rounded-md bg-gradient-to-br from-zinc-500 to-zinc-800 ring-1 ring-rose-400/40">
                <div className="absolute left-1.5 top-1.5 h-2 w-9 rounded-full bg-white/90" />
                <div className="absolute bottom-1.5 left-1.5 h-1.5 w-1/2 rounded-full bg-white" />
                <div className="absolute bottom-1.5 right-1.5 h-2.5 w-6 rounded-full bg-white" />
            </div>
            {[0, 1].map((i) => (
                <div key={i} className="flex items-center gap-1.5">
                    <div className="h-3.5 w-3.5 rounded bg-zinc-600" />
                    <div className="h-1 flex-1 rounded-full bg-zinc-400" />
                    <div className="h-1 w-5 rounded-full bg-zinc-300" />
                </div>
            ))}
        </div>
    );
}

function SpotlightPreviewDishes() {
    return (
        <div>
            <div className="overflow-hidden rounded-xl bg-[var(--guest-surface)] ring-1 ring-[var(--guest-accent-30)]">
                <div className="relative aspect-[16/9] bg-[var(--guest-shimmer)]/50">
                    <span className="absolute left-2 top-2 inline-flex items-center gap-0.5 rounded-full bg-white/95 px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-wider text-zinc-900">
                        <Sparkles className="h-2 w-2 text-amber-500" aria-hidden />
                        Chef&apos;s pick
                    </span>
                    <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-black/80 to-transparent p-2">
                        <p className="text-[12px] font-bold leading-tight text-white">Sample dish name</p>
                        <span className="rounded-full bg-white px-1.5 py-0.5 text-[9px] font-extrabold text-zinc-900">₹499</span>
                    </div>
                </div>
                <p className="px-2 py-1.5 text-[10px] leading-relaxed text-[var(--guest-muted)]">
                    Description uses the muted tone so longer copy stays readable.
                </p>
            </div>
            <div className="mt-1.5 divide-y divide-[var(--guest-line)]">
                {[
                    { name: "Second item", price: "₹350" },
                    { name: "House salad", price: "₹280" },
                ].map((dish) => (
                    <div key={dish.name} className="flex items-center gap-2 py-2">
                        <div className="h-6 w-6 shrink-0 rounded bg-[var(--guest-shimmer)]/50" />
                        <p className="flex-1 truncate text-[11px] font-semibold text-[var(--guest-text)]">{dish.name}</p>
                        <p className="text-[10px] font-bold tabular-nums text-[var(--guest-text)]">{dish.price}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

export const spotlightPreview = {
    Thumbnail: SpotlightThumbnail,
    PreviewDishes: SpotlightPreviewDishes,
} satisfies GuestMenuTemplatePreview;
