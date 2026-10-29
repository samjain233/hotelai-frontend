"use client";

import { MenuItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";
import { GuestMenuItemInsights } from "../GuestMenuItemInsights";
import { useGuestMenuData } from "./GuestMenuContext";
import { GuestMenuDietMark, GuestMenuItemAction, formatPrice } from "./GuestMenuItemParts";
import type { GuestMenuPhotoLoading } from "../templates/photoLoading";
import { GuestMenuImage, GUEST_MENU_IMAGE_SIZES_FULL } from "./GuestMenuImage";
import { guestMenuImageSrc } from "@/lib/guestMenuImageHosts";

interface SpotlightItemProps {
    item: MenuItem;
    itemIndex: number;
    imageLoading: GuestMenuPhotoLoading;
}

function dishImage(item: MenuItem, imageLoading: GuestMenuPhotoLoading, soldOut: boolean, size: number, className: string) {
    return (
        <GuestMenuImage
            src={guestMenuImageSrc(item.imageUrl)}
            width={size}
            height={size}
            sizes={size >= 400 ? GUEST_MENU_IMAGE_SIZES_FULL : "48px"}
            loading={imageLoading}
            className={cn("h-full w-full object-cover", soldOut && "grayscale", className)}
        />
    );
}

/**
 * Spotlight hero: a wide card for the dishes the kitchen wants to sell. With a photo the
 * name sits on a gradient over the image; without one the accent colour carries the card.
 */
export function GuestMenuSpotlightHero({ item, itemIndex, imageLoading }: SpotlightItemProps) {
    const ctx = useGuestMenuData();
    const desc = item.description?.trim() ?? "";
    const hasImage = guestMenuImageSrc(item.imageUrl).length > 0;
    const soldOut = item.available === false;

    return (
        <li
            className={cn(
                "overflow-hidden rounded-2xl ring-1 ring-[var(--guest-accent-30)] bg-[var(--guest-surface)] shadow-[0_16px_40px_-20px_rgba(0,0,0,0.5)] animate-fade-in-up",
                soldOut && "opacity-75",
            )}
            style={{ animationDelay: `${itemIndex * 40}ms` }}
        >
            <div className={cn("relative w-full", hasImage ? "aspect-[16/9]" : "bg-[var(--guest-accent-15)]", !hasImage && item.chefRecommended && "pt-4")}>
                {hasImage && (
                    <>
                        {dishImage(item, imageLoading, soldOut, 720, "")}
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
                    </>
                )}
                {/* Only a real flag earns the badge; the first-dish fallback is just given the large layout. */}
                {item.chefRecommended && (
                    <span
                        className={cn(
                            "absolute left-3 top-3 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow-sm",
                            hasImage ? "bg-white/95 text-zinc-900" : "bg-[var(--guest-accent)] text-[var(--guest-on-cta)]",
                        )}
                    >
                        <Sparkles className={cn("h-3 w-3", hasImage && "text-amber-500")} aria-hidden />
                        Chef&apos;s pick
                    </span>
                )}
                {soldOut && (
                    <span className="absolute right-3 top-3 rounded-full bg-black/70 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                        Sold out
                    </span>
                )}
                <div className={cn("flex items-end justify-between gap-3 p-4", hasImage ? "absolute inset-x-0 bottom-0" : item.chefRecommended ? "pt-8" : "pt-5")}>
                    <h3
                        className={cn(
                            "line-clamp-2 text-[19px] font-bold leading-tight tracking-tight",
                            hasImage ? "text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]" : "text-[var(--guest-text)]",
                        )}
                        title={item.name}
                    >
                        {item.dietaryPreference && (
                            <span className={cn("mr-1.5 inline-flex translate-y-[-2px] rounded align-middle empty:hidden", hasImage && "bg-white/95 p-px")}>
                                <GuestMenuDietMark preference={item.dietaryPreference} />
                            </span>
                        )}
                        {item.name}
                    </h3>
                    <span
                        className={cn(
                            "shrink-0 rounded-full px-3 py-1 text-sm font-extrabold tabular-nums shadow-md",
                            hasImage ? "bg-white text-zinc-900" : "bg-[var(--guest-accent)] text-[var(--guest-on-cta)]",
                        )}
                    >
                        {formatPrice(item.price)}
                    </span>
                </div>
            </div>

            <div className="px-4 pb-4 pt-3">
                {desc ? <p className="line-clamp-3 text-[13px] leading-relaxed text-[var(--guest-text-70)]">{desc}</p> : null}
                <GuestMenuItemInsights hotel={ctx.hotel} item={item} />
                {ctx.digitalOrderingEnabled && (
                    <div className="mt-3 flex justify-end">
                        <GuestMenuItemAction item={item} widthClass="w-full sm:w-36" />
                    </div>
                )}
            </div>
        </li>
    );
}

/** Spotlight row: the quiet list under the heroes. Small thumbnail, one-line description. */
export function GuestMenuSpotlightRow({ item, itemIndex, imageLoading }: SpotlightItemProps) {
    const ctx = useGuestMenuData();
    const desc = item.description?.trim() ?? "";
    const hasImage = guestMenuImageSrc(item.imageUrl).length > 0;
    const soldOut = item.available === false;

    return (
        <li
            className={cn("flex items-center gap-3 py-3 animate-fade-in-up", soldOut && "opacity-60")}
            style={{ animationDelay: `${Math.min(itemIndex, 8) * 30}ms` }}
        >
            {hasImage && (
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-[var(--guest-surface)] ring-1 ring-[var(--guest-line)]">
                    {dishImage(item, imageLoading, soldOut, 96, "")}
                </div>
            )}
            <div className="min-w-0 flex-1">
                <h3 className="truncate text-[15px] font-semibold leading-snug text-[var(--guest-text)]" title={item.name}>
                    {item.dietaryPreference && (
                        <span className="mr-1.5 inline-flex translate-y-[-2px] align-middle empty:hidden">
                            <GuestMenuDietMark preference={item.dietaryPreference} />
                        </span>
                    )}
                    {item.name}
                </h3>
                {desc ? (
                    <p className="truncate text-[12.5px] text-[var(--guest-text-70)]" title={desc}>
                        {desc}
                    </p>
                ) : null}
                <GuestMenuItemInsights hotel={ctx.hotel} item={item} />
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1.5">
                {soldOut ? (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--guest-muted)]">Sold out</span>
                ) : (
                    <span className="text-[14px] font-bold tabular-nums text-[var(--guest-text)]">{formatPrice(item.price)}</span>
                )}
                {ctx.digitalOrderingEnabled && <GuestMenuItemAction item={item} widthClass="w-[88px]" />}
            </div>
        </li>
    );
}
