"use client";

import { MenuItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { GuestMenuItemInsights } from "../GuestMenuItemInsights";
import { useGuestMenuData } from "./GuestMenuContext";
import { GuestMenuDietMark, GuestMenuItemAction, formatPrice } from "./GuestMenuItemParts";
import type { GuestMenuPhotoLoading } from "../templates/photoLoading";
import { GuestMenuImage, GUEST_MENU_IMAGE_SIZES_FULL } from "./GuestMenuImage";
import { guestMenuImageSrc } from "@/lib/guestMenuImageHosts";

interface GuestMenuSereneEntryProps {
    item: MenuItem;
    itemIndex: number;
    imageLoading: GuestMenuPhotoLoading;
}

/**
 * Resort-calm entry: a wide soft-edged photo, a short accent rule, a light-weight name
 * and generous whitespace instead of dividers. Designed to feel unhurried.
 */
export function GuestMenuSereneEntry({ item, itemIndex, imageLoading }: GuestMenuSereneEntryProps) {
    const ctx = useGuestMenuData();
    const desc = item.description?.trim() ?? "";
    const imageSrc = guestMenuImageSrc(item.imageUrl);
    const hasImage = imageSrc.length > 0;
    const soldOut = item.available === false;

    return (
        <li
            className={cn("py-7 first:pt-2 animate-fade-in-up", soldOut && "opacity-60")}
            style={{ animationDelay: `${itemIndex * 50}ms` }}
        >
            {hasImage && (
                <div className="mb-5 overflow-hidden rounded-[1.5rem] bg-[var(--guest-surface)] shadow-[0_24px_48px_-24px_rgba(0,0,0,0.55)]">
                    <GuestMenuImage
                        src={imageSrc}
                        width={720}
                        height={480}
                        sizes={GUEST_MENU_IMAGE_SIZES_FULL}
                        loading={imageLoading}
                        className={cn("aspect-[3/2] w-full object-cover", soldOut && "grayscale")}
                    />
                </div>
            )}

            <span aria-hidden className="mb-3 block h-px w-8 bg-[var(--guest-accent)]" />

            {item.chefRecommended && (
                <p className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.28em] text-[var(--guest-accent)]">Chef&apos;s selection</p>
            )}

            <div className="flex items-baseline justify-between gap-4">
                <h3
                    className="min-w-0 text-[22px] font-light leading-[1.2] tracking-tight text-[var(--guest-text)]"
                    title={item.name}
                >
                    {item.dietaryPreference && (
                        <span className="mr-2 inline-flex translate-y-[-3px] align-middle empty:hidden">
                            <GuestMenuDietMark preference={item.dietaryPreference} />
                        </span>
                    )}
                    {item.name}
                </h3>
                <p className="shrink-0 text-[15px] font-normal tabular-nums text-[var(--guest-text)]">
                    {soldOut ? (
                        <span className="text-[11px] uppercase tracking-[0.2em] text-[var(--guest-muted)]">Sold out</span>
                    ) : (
                        formatPrice(item.price)
                    )}
                </p>
            </div>

            {desc ? (
                <p className="mt-2.5 max-w-[44ch] text-[14px] font-light leading-[1.7] text-[var(--guest-text-70)]">{desc}</p>
            ) : null}
            <GuestMenuItemInsights hotel={ctx.hotel} item={item} />

            {ctx.digitalOrderingEnabled && (
                <div className="mt-4 flex justify-end">
                    <GuestMenuItemAction item={item} widthClass="w-28" />
                </div>
            )}
        </li>
    );
}
