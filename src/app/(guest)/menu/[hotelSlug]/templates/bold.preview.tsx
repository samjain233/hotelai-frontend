"use client";

import type { GuestMenuTemplatePreview } from "./types";

function BoldThumbnail() {
    return (
        <div className="flex h-full flex-col justify-center gap-2.5 px-1">
            <div className="flex items-center gap-3">
                <div className="flex-1 space-y-1.5">
                    <div className="h-2.5 w-4/5 rounded-sm bg-zinc-100" />
                    <div className="h-1 w-3/5 rounded-full bg-zinc-500" />
                    <div className="mt-1 h-3 w-9 rounded-full bg-rose-400" />
                </div>
                <div className="h-9 w-9 shrink-0 rounded-full bg-gradient-to-br from-zinc-400 to-zinc-600 ring-2 ring-rose-400/40" />
            </div>
            <div className="h-0.5 w-full rounded-full bg-zinc-700" />
            <div className="flex items-center gap-3">
                <div className="flex-1 space-y-1.5">
                    <div className="h-2.5 w-2/3 rounded-sm bg-zinc-100" />
                    <div className="h-3 w-9 rounded-full bg-rose-400" />
                </div>
            </div>
        </div>
    );
}

function BoldPreviewDishes() {
    return (
        <div>
            <div className="flex items-start gap-3 border-b-2 border-[var(--guest-text-12)] pb-3.5">
                <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-extrabold leading-tight tracking-tight text-[var(--guest-text)]">Sample dish name</p>
                    <p className="mt-1 text-[10px] leading-relaxed text-[var(--guest-muted)]">
                        Description uses the muted tone so longer copy stays readable.
                    </p>
                    <span className="mt-2 inline-flex h-5 items-center rounded-full bg-[var(--guest-accent)] px-2 text-[10px] font-extrabold tabular-nums text-[var(--guest-on-cta)]">
                        ₹499
                    </span>
                </div>
                <div className="h-12 w-12 shrink-0 rounded-full bg-[var(--guest-shimmer)]/50 ring-2 ring-[var(--guest-accent-20)]" />
            </div>
            <div className="pt-3.5">
                <p className="text-[15px] font-extrabold leading-tight tracking-tight text-[var(--guest-text)]">Second item</p>
                <span className="mt-2 inline-flex h-5 items-center rounded-full bg-[var(--guest-accent)] px-2 text-[10px] font-extrabold tabular-nums text-[var(--guest-on-cta)]">
                    ₹350
                </span>
            </div>
        </div>
    );
}

export const boldPreview = {
    Thumbnail: BoldThumbnail,
    PreviewDishes: BoldPreviewDishes,
} satisfies GuestMenuTemplatePreview;
