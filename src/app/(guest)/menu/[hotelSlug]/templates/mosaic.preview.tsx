"use client";

import { Star } from "lucide-react";
import type { GuestMenuTemplatePreview } from "./types";

function MosaicThumbnail() {
    return (
        <div className="grid h-full grid-cols-2 gap-1.5">
            <div className="relative col-span-2 h-7 overflow-hidden rounded-md bg-gradient-to-br from-zinc-500 to-zinc-800 ring-1 ring-white/5">
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-1.5 left-1.5 h-1.5 w-1/2 rounded-full bg-white" />
                <div className="absolute bottom-1.5 right-1.5 h-2.5 w-6 rounded-full bg-white" />
            </div>
            <div className="relative h-6 overflow-hidden rounded-md bg-gradient-to-br from-zinc-600 to-zinc-800 ring-1 ring-white/5">
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-1 left-1 h-1 w-1/2 rounded-full bg-white" />
                <div className="absolute bottom-1 right-1 h-2 w-4 rounded-full bg-white" />
            </div>
            <div className="relative h-6 overflow-hidden rounded-md bg-rose-400/20 ring-1 ring-white/5">
                <span aria-hidden className="absolute -right-0.5 -top-1.5 text-[22px] font-black leading-none text-rose-400/30">
                    M
                </span>
                <div className="absolute bottom-1 left-1 h-1 w-1/2 rounded-full bg-zinc-300" />
                <div className="absolute bottom-1 right-1 h-2 w-4 rounded-full bg-rose-400/80" />
            </div>
        </div>
    );
}

function MosaicPreviewDishes() {
    return (
        <div className="grid grid-cols-2 gap-2">
            <div className="relative col-span-2 aspect-[16/9] overflow-hidden rounded-xl bg-[var(--guest-shimmer)]/50 ring-1 ring-[var(--guest-line)]">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <span className="absolute left-2 top-2 inline-flex items-center gap-0.5 rounded-full bg-[var(--guest-accent)] px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-wider text-[var(--guest-on-cta)]">
                    <Star className="h-2 w-2 fill-current" aria-hidden />
                    Chef&apos;s pick
                </span>
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-2.5">
                    <div className="min-w-0">
                        <p className="text-xs font-bold leading-tight text-white">Sample dish name</p>
                        <p className="mt-0.5 line-clamp-1 text-[9px] text-white/80">Description sits on the photo.</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-white px-1.5 py-0.5 text-[9px] font-extrabold text-zinc-900">₹499</span>
                </div>
            </div>

            <div className="relative aspect-square overflow-hidden rounded-xl bg-[var(--guest-shimmer)]/50 ring-1 ring-[var(--guest-line)]">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-1.5 p-2">
                    <p className="text-[10px] font-bold leading-tight text-white">Second item</p>
                    <span className="shrink-0 rounded-full bg-white px-1.5 py-0.5 text-[8px] font-extrabold text-zinc-900">₹350</span>
                </div>
            </div>

            <div className="relative aspect-square overflow-hidden rounded-xl bg-[var(--guest-accent-12)] ring-1 ring-[var(--guest-line)]">
                <span aria-hidden className="absolute -right-1 -top-3 select-none text-[64px] font-black leading-none text-[var(--guest-accent-18)]">
                    H
                </span>
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-1.5 p-2">
                    <p className="text-[10px] font-bold leading-tight text-[var(--guest-text)]">House salad</p>
                    <span className="shrink-0 rounded-full border border-[var(--guest-accent-40)] bg-[var(--guest-surface)] px-1.5 py-0.5 text-[8px] font-extrabold text-[var(--guest-accent)]">
                        ₹280
                    </span>
                </div>
            </div>
        </div>
    );
}

export const mosaicPreview = {
    Thumbnail: MosaicThumbnail,
    PreviewDishes: MosaicPreviewDishes,
} satisfies GuestMenuTemplatePreview;
