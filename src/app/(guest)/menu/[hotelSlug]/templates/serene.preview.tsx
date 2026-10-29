"use client";

import type { GuestMenuTemplatePreview } from "./types";

function SereneThumbnail() {
    return (
        <div className="flex h-full flex-col justify-center gap-2 px-1">
            <div className="h-7 rounded-lg bg-gradient-to-br from-zinc-500 to-zinc-700" />
            <div className="h-px w-4 bg-rose-400" />
            <div className="flex items-end justify-between gap-2">
                <div className="h-1.5 w-1/2 rounded-full bg-zinc-300" />
                <div className="h-1 w-5 rounded-full bg-zinc-400" />
            </div>
            <div className="h-1 w-3/4 rounded-full bg-zinc-600" />
        </div>
    );
}

function SerenePreviewDishes() {
    return (
        <div>
            <div className="pb-4">
                <div className="mb-2.5 aspect-[3/2] rounded-xl bg-[var(--guest-shimmer)]/50" />
                <span className="mb-1.5 block h-px w-4 bg-[var(--guest-accent)]" />
                <div className="flex items-baseline justify-between gap-2">
                    <p className="text-[13px] font-light tracking-tight text-[var(--guest-text)]">Sample dish name</p>
                    <p className="text-[10px] tabular-nums text-[var(--guest-text)]">₹499</p>
                </div>
                <p className="mt-1 text-[10px] font-light leading-relaxed text-[var(--guest-muted)]">
                    Description uses the muted tone so longer copy stays readable.
                </p>
            </div>
            <div className="pt-1">
                <span className="mb-1.5 block h-px w-4 bg-[var(--guest-accent)]" />
                <div className="flex items-baseline justify-between gap-2">
                    <p className="text-[13px] font-light tracking-tight text-[var(--guest-text)]">Second item</p>
                    <p className="text-[10px] tabular-nums text-[var(--guest-text)]">₹350</p>
                </div>
            </div>
        </div>
    );
}

export const serenePreview = {
    Thumbnail: SereneThumbnail,
    PreviewDishes: SerenePreviewDishes,
} satisfies GuestMenuTemplatePreview;
