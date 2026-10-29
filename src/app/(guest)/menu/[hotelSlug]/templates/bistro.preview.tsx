"use client";

import type { GuestMenuTemplatePreview } from "./types";

const THUMB_ROWS = [
    ["01", "Aloo Paratha", "₹90"],
    ["02", "Poha", "₹60"],
    ["03", "Filter Coffee", "₹40"],
] as const;

function BistroThumbnail() {
    return (
        <div aria-hidden className="flex h-full flex-col justify-center gap-[5px] px-1 font-ticket">
            {THUMB_ROWS.map(([n, name, price], i) => (
                <div
                    key={n}
                    className={i === 0 ? "flex items-center gap-2" : "flex items-center gap-2 border-t border-zinc-700 pt-[5px]"}
                >
                    <span className="text-[10px] font-medium text-rose-400">{n}</span>
                    <span className="flex-1 truncate font-sans text-[11px] font-medium text-zinc-200">{name}</span>
                    <span className="text-[10px] font-medium text-zinc-300">{price}</span>
                </div>
            ))}
        </div>
    );
}

function BistroPreviewDishes() {
    return (
        <div>
            <div className="flex items-start gap-2 pb-3">
                <span className="mt-[2px] font-ticket text-[10px] font-medium text-[var(--guest-accent)]">01</span>
                <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                        <p className="text-[12px] font-medium text-[var(--guest-text)]">Sample dish name</p>
                        <p className="font-ticket text-[10px] font-medium tabular-nums text-[var(--guest-text)]">₹499</p>
                    </div>
                    <p className="mt-0.5 text-[10px] leading-relaxed text-[var(--guest-muted)]">
                        Description uses the muted tone so longer copy stays readable.
                    </p>
                </div>
                <div className="h-9 w-9 shrink-0 rounded bg-[var(--guest-shimmer)]/50" />
            </div>
            <div className="flex items-start gap-2 border-t border-[var(--guest-line)] pt-3">
                <span className="mt-[2px] font-ticket text-[10px] font-medium text-[var(--guest-accent)]">02</span>
                <div className="flex min-w-0 flex-1 items-baseline justify-between gap-2">
                    <p className="text-[12px] font-medium text-[var(--guest-text)]">Second item</p>
                    <p className="font-ticket text-[10px] font-medium tabular-nums text-[var(--guest-text)]">₹350</p>
                </div>
            </div>
        </div>
    );
}

export const bistroPreview = {
    Thumbnail: BistroThumbnail,
    PreviewDishes: BistroPreviewDishes,
} satisfies GuestMenuTemplatePreview;
