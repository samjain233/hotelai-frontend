"use client";

import type { GuestMenuTemplatePreview } from "./types";

function HeritageThumbnail() {
    return (
        // Decorative sample text; keep it out of the picker radio's accessible name.
        <div aria-hidden className="h-full border border-zinc-600 p-[3px]">
            <div className="flex h-full flex-col items-center justify-center gap-[3px] border border-zinc-700 text-center">
                <span className="font-garamond text-[12px] font-semibold leading-none text-zinc-100">Murgh Musallam</span>
                <span className="font-garamond text-[10px] font-semibold tracking-[0.1em] leading-none text-rose-400">₹640</span>
                <span className="flex items-center gap-1">
                    <span className="h-px w-4 bg-zinc-600" />
                    <span className="h-1 w-1 rotate-45 bg-rose-400/80" />
                    <span className="h-px w-4 bg-zinc-600" />
                </span>
                <span className="font-garamond text-[12px] font-semibold leading-none text-zinc-100">Kesari Phirni</span>
                <span className="font-garamond text-[10px] font-semibold tracking-[0.1em] leading-none text-rose-400">₹220</span>
            </div>
        </div>
    );
}

function HeritagePreviewDishes() {
    const dishes = [
        { name: "Sample dish name", price: "₹499", desc: "Description uses the muted tone so longer copy stays readable." },
        { name: "Second item", price: "₹350", desc: "" },
        { name: "Chef's special", price: "₹620", desc: "A shorter line of copy." },
    ];
    return (
        <div className="border border-[var(--guest-accent-40)] p-[3px]">
            <ul className="border border-[var(--guest-accent-25)] px-2 py-1.5 text-center">
                {dishes.map((d, i) => (
                    <li key={d.name}>
                        {i > 0 && (
                            <div aria-hidden className="flex items-center justify-center gap-1 py-0.5">
                                <span className="h-px w-5 bg-[var(--guest-accent-40)]" />
                                <span className="h-0.5 w-0.5 rotate-45 bg-[var(--guest-accent-55)]" />
                                <span className="h-px w-5 bg-[var(--guest-accent-40)]" />
                            </div>
                        )}
                        <div className="py-1.5">
                            <p className="font-garamond text-[14px] font-semibold leading-tight text-[var(--guest-text)]">{d.name}</p>
                            <p className="font-garamond text-[11px] font-semibold tracking-[0.1em] text-[var(--guest-accent)]">{d.price}</p>
                            {d.desc ? (
                                <p className="mx-auto mt-0.5 max-w-[26ch] font-garamond text-[11px] italic leading-snug text-[var(--guest-muted)]">{d.desc}</p>
                            ) : null}
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export const heritagePreview = {
    Thumbnail: HeritageThumbnail,
    PreviewDishes: HeritagePreviewDishes,
} satisfies GuestMenuTemplatePreview;
