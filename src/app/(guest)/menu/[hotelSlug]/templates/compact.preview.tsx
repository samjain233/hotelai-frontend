"use client";

import type { GuestMenuTemplatePreview } from "./types";

function CompactThumbnail() {
    return (
        <div className="flex h-full flex-col justify-center gap-[3px]">
            {[0, 1, 2, 3, 4].map((i) => (
                <div
                    key={i}
                    className={`flex h-[11px] items-center gap-1.5 rounded px-1.5 ${i % 2 === 0 ? "bg-zinc-800" : ""}`}
                >
                    <div className="h-1.5 w-1.5 rounded-[2px] border border-zinc-500" />
                    <div className={`h-1 rounded-full bg-zinc-400 ${["w-1/2", "w-2/3", "w-2/5", "w-3/5", "w-1/2"][i]}`} />
                    <div className="ml-auto h-1 w-5 rounded-full bg-rose-400/80" />
                </div>
            ))}
        </div>
    );
}

function CompactPreviewDishes() {
    const dishes = [
        { name: "Sample dish name", price: "₹499", desc: "Description uses the muted tone so longer copy stays readable.", open: true },
        { name: "Second item", price: "₹350", desc: "", open: false },
        { name: "Chef's special", price: "₹620", desc: "A shorter line of copy.", open: false },
        { name: "House salad", price: "₹280", desc: "", open: false },
    ];
    return (
        <ul className="space-y-0.5">
            {dishes.map((d, i) => (
                <li
                    key={d.name}
                    className={`rounded-md ${i % 2 === 0 ? "bg-[var(--guest-surface)]/70" : ""} ${d.open ? "bg-[var(--guest-surface)] ring-1 ring-[var(--guest-line)]" : ""}`}
                >
                    <div className="flex items-center gap-1.5 px-2 py-1.5">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-[2px] border border-[var(--guest-muted)]" />
                        <span className="min-w-0 flex-1 truncate text-[11px] font-semibold text-[var(--guest-text)]">{d.name}</span>
                        <span className="text-[10px] font-bold tabular-nums text-[var(--guest-accent)]">{d.price}</span>
                        <span className={`text-[9px] text-[var(--guest-muted)] ${d.open ? "rotate-180" : ""}`}>⌄</span>
                    </div>
                    {d.open && (
                        <div className="px-2 pb-2">
                            <div className="mb-1.5 h-12 rounded-md bg-[var(--guest-shimmer)]/50" />
                            <p className="text-[10px] leading-snug text-[var(--guest-muted)]">{d.desc}</p>
                        </div>
                    )}
                </li>
            ))}
        </ul>
    );
}

export const compactPreview = {
    Thumbnail: CompactThumbnail,
    PreviewDishes: CompactPreviewDishes,
} satisfies GuestMenuTemplatePreview;
