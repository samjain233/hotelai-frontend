"use client";

import type { GuestMenuTemplatePreview } from "./types";

function BoardThumbnail() {
    return (
        // Decorative sample text; keep it out of the picker radio's accessible name.
        <div aria-hidden className="flex h-full flex-col justify-center rounded-md border-2 border-dashed border-zinc-600 px-2">
            {[
                ["Masala Dosa", "₹120"],
                ["Chole Bhature", "₹140"],
                ["Filter Coffee", "₹60"],
            ].map(([name, price], i) => (
                <div
                    key={name}
                    className={`flex items-center justify-between gap-2 py-1 ${i > 0 ? "border-t border-dashed border-zinc-700" : ""}`}
                >
                    <span className="font-condensed text-[11px] font-medium uppercase leading-none tracking-wide text-zinc-100">{name}</span>
                    <span className="font-condensed text-[12px] font-semibold leading-none tabular-nums text-rose-400">{price}</span>
                </div>
            ))}
        </div>
    );
}

function BoardPreviewDishes() {
    const dishes = [
        { name: "Sample dish name", price: "₹499", desc: "Description uses the muted tone so longer copy stays readable." },
        { name: "Second item", price: "₹350", desc: "" },
        { name: "Chef's special", price: "₹620", desc: "A shorter line of copy." },
    ];
    return (
        <div className="rounded-md border-2 border-dashed border-[var(--guest-text-25)] px-2.5">
            <ul className="divide-y divide-dashed divide-[var(--guest-text-18)]">
                {dishes.map((d) => (
                    <li key={d.name} className="py-2">
                        <div className="flex items-start justify-between gap-2">
                            <span className="font-condensed text-[13px] font-medium uppercase leading-tight tracking-wide text-[var(--guest-text)]">{d.name}</span>
                            <span className="font-condensed text-[15px] font-semibold leading-none tabular-nums text-[var(--guest-accent)]">{d.price}</span>
                        </div>
                        {d.desc ? (
                            <p className="mt-0.5 text-[10px] leading-snug text-[var(--guest-muted)]">{d.desc}</p>
                        ) : null}
                    </li>
                ))}
            </ul>
        </div>
    );
}

export const boardPreview = {
    Thumbnail: BoardThumbnail,
    PreviewDishes: BoardPreviewDishes,
} satisfies GuestMenuTemplatePreview;
