"use client";

import type { GuestMenuTemplatePreview } from "./types";

function EditorialThumbnail() {
    return (
        // Decorative sample text; keep it out of the picker radio's accessible name.
        <div aria-hidden className="flex h-full flex-col justify-center gap-2 px-1">
            <div className="flex items-center gap-2">
                <span className="h-px flex-1 bg-zinc-700" />
                <span className="h-1 w-1 rotate-45 bg-rose-400" />
                <span className="h-px flex-1 bg-zinc-700" />
            </div>
            {[
                ["Tandoori Paneer", "₹320"],
                ["Dal Makhani", "₹260"],
                ["Kesar Kulfi", "₹180"],
            ].map(([name, price]) => (
                <div key={name} className="flex items-baseline gap-1.5">
                    <span className="font-serif text-[11px] font-semibold leading-none text-zinc-100">{name}</span>
                    <span className="mb-[2px] flex-1 self-end border-b border-dotted border-zinc-600" />
                    <span className="text-[10px] font-semibold tabular-nums leading-none text-zinc-300">{price}</span>
                </div>
            ))}
        </div>
    );
}

function EditorialPreviewDishes() {
    const dishes = [
        { name: "Sample dish name", price: "₹499", desc: "Description uses the muted tone so longer copy stays readable." },
        { name: "Second item", price: "₹350", desc: "" },
        { name: "Chef's special", price: "₹620", desc: "A shorter line of copy." },
    ];
    return (
        <div>
            <div aria-hidden className="mb-1 flex items-center gap-2">
                <span className="h-px flex-1 bg-[var(--guest-line)]" />
                <span className="h-1 w-1 rotate-45 bg-[var(--guest-accent)]" />
                <span className="h-px flex-1 bg-[var(--guest-line)]" />
            </div>
            <ul className="divide-y divide-[var(--guest-line)]">
                {dishes.map((d) => (
                    <li key={d.name} className="py-2.5 first:pt-1">
                        <div className="flex items-baseline gap-1.5">
                            <span className="font-serif text-[13px] font-semibold leading-tight text-[var(--guest-text)]">{d.name}</span>
                            <span className="mb-[3px] flex-1 self-end border-b border-dotted border-[var(--guest-text-30)]" />
                            <span className="text-[11px] font-semibold tabular-nums text-[var(--guest-text)]">{d.price}</span>
                        </div>
                        {d.desc ? (
                            <p className="mt-1 text-[10px] font-light leading-snug text-[var(--guest-muted)]">{d.desc}</p>
                        ) : null}
                    </li>
                ))}
            </ul>
        </div>
    );
}

export const editorialPreview = {
    Thumbnail: EditorialThumbnail,
    PreviewDishes: EditorialPreviewDishes,
} satisfies GuestMenuTemplatePreview;
