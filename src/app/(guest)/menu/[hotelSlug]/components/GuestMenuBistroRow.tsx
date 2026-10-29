"use client";

import { MenuItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { GuestMenuItemInsights } from "../GuestMenuItemInsights";
import { useGuestMenuData } from "./GuestMenuContext";
import { GuestMenuDietMark, GuestMenuItemAction, formatPrice } from "./GuestMenuItemParts";
import type { GuestMenuPhotoLoading } from "../templates/photoLoading";
import { GuestMenuImage } from "./GuestMenuImage";
import { guestMenuImageSrc } from "@/lib/guestMenuImageHosts";

interface GuestMenuBistroRowProps {
    item: MenuItem;
    itemIndex: number;
    imageLoading: GuestMenuPhotoLoading;
}

/**
 * Bistro row: a two-digit dish number in the accent colour, monospace prices, a thin rule
 * above each row. Numbers restart per category so guests can say "number 4" at the counter.
 */
export function GuestMenuBistroRow({ item, itemIndex, imageLoading }: GuestMenuBistroRowProps) {
    const ctx = useGuestMenuData();
    const desc = item.description?.trim() ?? "";
    const imageSrc = guestMenuImageSrc(item.imageUrl);
    const hasImage = imageSrc.length > 0;
    const soldOut = item.available === false;
    const number = String(itemIndex + 1).padStart(2, "0");

    return (
        <li
            className={cn(
                "flex items-start gap-3 border-t border-[var(--guest-line)] py-4 first:border-t-0 first:pt-1 animate-fade-in-up",
                soldOut && "opacity-60",
            )}
            style={{ animationDelay: `${itemIndex * 40}ms` }}
        >
            <span
                aria-hidden
                className="mt-[3px] w-[2.4ch] shrink-0 font-ticket text-[13px] font-medium leading-none tabular-nums text-[var(--guest-accent)]"
            >
                {number}
            </span>

            <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                    <h3 className="min-w-0 text-[16px] font-medium leading-snug text-[var(--guest-text)]" title={item.name}>
                        <span className="sr-only">{number}. </span>
                        {item.dietaryPreference && (
                            <span className="mr-1.5 inline-flex translate-y-[-2px] align-middle empty:hidden">
                                <GuestMenuDietMark preference={item.dietaryPreference} />
                            </span>
                        )}
                        {item.name}
                    </h3>
                    <p className="shrink-0 font-ticket text-[14px] font-medium leading-snug tabular-nums text-[var(--guest-text)]">
                        {soldOut ? (
                            <span className="text-[11px] uppercase tracking-[0.12em] text-[var(--guest-muted)]">sold out</span>
                        ) : (
                            formatPrice(item.price)
                        )}
                    </p>
                </div>

                {item.chefRecommended && (
                    <p className="mt-0.5 font-ticket text-[10.5px] uppercase tracking-[0.14em] text-[var(--guest-accent)]">* chef&apos;s pick</p>
                )}
                {desc ? (
                    <p className="mt-1 text-[13px] leading-relaxed text-[var(--guest-text-70)]">{desc}</p>
                ) : null}
                <GuestMenuItemInsights hotel={ctx.hotel} item={item} />

                {ctx.digitalOrderingEnabled && (
                    <div className="mt-2.5 flex justify-end">
                        <GuestMenuItemAction item={item} widthClass="w-[100px]" />
                    </div>
                )}
            </div>

            {hasImage && (
                <div className="mt-0.5 h-[60px] w-[60px] shrink-0 overflow-hidden rounded-md bg-[var(--guest-surface)] ring-1 ring-[var(--guest-line)]">
                    <GuestMenuImage
                        src={imageSrc}
                        width={120}
                        height={120}
                        sizes="60px"
                        loading={imageLoading}
                        className={cn("h-full w-full object-cover", soldOut && "grayscale")}
                    />
                </div>
            )}
        </li>
    );
}
