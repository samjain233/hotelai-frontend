"use client";

import type { MenuItem } from "@/lib/types";
import type { Hotel } from "@/lib/types";
import { ALLERGEN_LABELS, DIETARY_TAG_LABELS, SPICE_LABELS } from "@/lib/menuItemInsights";
import { cn } from "@/lib/utils";
import { Flame, Sparkles, Wine } from "lucide-react";

function chipClass(accent = false) {
    return cn(
        "inline-flex max-w-full items-center gap-0.5 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold leading-tight",
        accent
            ? "border-[color-mix(in_srgb,var(--guest-accent)_45%,var(--guest-line))] bg-[var(--guest-accent-12)] text-[var(--guest-accent-90)]"
            : "border-[var(--guest-line)] bg-[color-mix(in_srgb,var(--guest-surface)_88%,var(--guest-bg))] text-[var(--guest-muted)]",
    );
}

export function GuestMenuItemInsights({
    hotel,
    item,
}: {
    hotel: Pick<Hotel, "guestMenuShowItemInsights"> | null;
    item: MenuItem;
}) {
    if (!hotel?.guestMenuShowItemInsights) return null;

    const spice = item.spiceLevel && item.spiceLevel !== "NONE" ? SPICE_LABELS[item.spiceLevel] : "";
    const allergens = (item.allergenCodes ?? []).map((c) => ALLERGEN_LABELS[c] ?? c);
    const tags = (item.dietaryTags ?? []).map((c) => DIETARY_TAG_LABELS[c] ?? c);
    const portion = item.portionLabel?.trim();
    const cal = item.calories != null && item.calories > 0 ? `${item.calories} kcal` : "";

    if (
        !spice &&
        allergens.length === 0 &&
        tags.length === 0 &&
        !portion &&
        !cal &&
        !item.chefRecommended &&
        !item.containsAlcohol
    ) {
        return null;
    }

    return (
        <div className="mt-1.5 flex flex-wrap gap-1">
            {item.chefRecommended ? (
                <span className={chipClass(true)} title="Chef's pick">
                    <Sparkles className="h-2.5 w-2.5 shrink-0 opacity-90" aria-hidden />
                    Chef&apos;s pick
                </span>
            ) : null}
            {spice ? (
                <span className={chipClass(true)} title={`Spice: ${spice}`}>
                    <Flame className="h-2.5 w-2.5 shrink-0" aria-hidden />
                    {spice}
                </span>
            ) : null}
            {item.containsAlcohol ? (
                <span className={chipClass()} title="Contains alcohol">
                    <Wine className="h-2.5 w-2.5 shrink-0 opacity-80" aria-hidden />
                    Alcohol
                </span>
            ) : null}
            {portion ? (
                <span className={chipClass()} title="Portion">
                    {portion}
                </span>
            ) : null}
            {cal ? <span className={chipClass()}>{cal}</span> : null}
            {allergens.map((label) => (
                <span key={label} className={chipClass()}>
                    {label}
                </span>
            ))}
            {tags.map((label) => (
                <span key={label} className={chipClass(true)}>
                    {label}
                </span>
            ))}
        </div>
    );
}
