"use client";

import type { GuestMenuTemplatePreview } from "./types";

function ShowcaseThumbnail() {
    return (
        <div className="space-y-1.5">
            <div className="overflow-hidden rounded-md bg-zinc-800 ring-1 ring-white/5">
                <div className="relative h-10 bg-gradient-to-br from-zinc-500 to-zinc-700">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <div className="absolute inset-x-1.5 bottom-1.5 flex items-end justify-between gap-1">
                        <div className="h-1.5 w-1/2 rounded-full bg-white/90" />
                        <div className="h-2 w-5 rounded-full bg-white" />
                    </div>
                </div>
                <div className="space-y-1 p-1.5">
                    <div className="h-1 w-5/6 rounded-full bg-zinc-500" />
                    <div className="h-1 w-2/3 rounded-full bg-zinc-600" />
                </div>
            </div>
            <div className="overflow-hidden rounded-md bg-zinc-800 ring-1 ring-white/5">
                <div className="h-0.5 w-full bg-gradient-to-r from-rose-400 to-transparent" />
                <div className="flex items-center justify-between p-1.5">
                    <div className="h-1 w-1/2 rounded-full bg-zinc-500" />
                    <div className="h-2 w-5 rounded-full bg-rose-400/80" />
                </div>
            </div>
        </div>
    );
}

function ShowcasePreviewDishes() {
    return (
        <div className="space-y-2.5">
            <div className="overflow-hidden rounded-2xl border border-[var(--guest-line)] bg-[var(--guest-surface)]">
                <div className="relative aspect-[16/10] bg-[var(--guest-shimmer)]/50">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                    <span className="absolute left-2 top-2 rounded-full bg-white/95 px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-wider text-zinc-900">
                        Chef&apos;s pick
                    </span>
                    <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-2.5">
                        <p className="text-xs font-bold leading-tight text-white">Sample dish name</p>
                        <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[10px] font-extrabold text-zinc-900">₹499</span>
                    </div>
                </div>
                <div className="p-2.5">
                    <p className="line-clamp-2 text-[10px] leading-snug text-[var(--guest-muted)]">
                        Description uses the muted tone so longer copy stays readable.
                    </p>
                    <div className="mt-2 ml-auto flex h-5 w-20 items-center justify-center rounded-md border border-[var(--guest-accent-70)] text-[8px] font-extrabold tracking-wider text-[var(--guest-accent)]">
                        ADD +
                    </div>
                </div>
            </div>
            <div className="overflow-hidden rounded-2xl border border-[var(--guest-line)] bg-[var(--guest-surface)]">
                <div className="h-1 w-full bg-gradient-to-r from-[var(--guest-accent)] via-[var(--guest-accent-55)] to-transparent" />
                <div className="flex items-center justify-between gap-2 px-2.5 pb-2.5 pt-2">
                    <p className="text-xs font-semibold text-[var(--guest-text)]">Second item</p>
                    <span className="rounded-full border border-[var(--guest-accent-40)] bg-[var(--guest-accent-12)] px-2 py-0.5 text-[10px] font-extrabold text-[var(--guest-accent)]">
                        ₹350
                    </span>
                </div>
            </div>
        </div>
    );
}

export const showcasePreview = {
    Thumbnail: ShowcaseThumbnail,
    PreviewDishes: ShowcasePreviewDishes,
} satisfies GuestMenuTemplatePreview;
