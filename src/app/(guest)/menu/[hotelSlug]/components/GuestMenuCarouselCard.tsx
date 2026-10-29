"use client";

import { MenuItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Star } from "lucide-react";
import { GuestMenuItemInsights } from "../GuestMenuItemInsights";
import { useGuestMenuData } from "./GuestMenuContext";
import { GuestMenuDietMark, GuestMenuItemAction, formatPrice } from "./GuestMenuItemParts";
import type { GuestMenuPhotoLoading } from "../templates/photoLoading";
import { GuestMenuImage } from "./GuestMenuImage";
import { guestMenuImageSrc } from "@/lib/guestMenuImageHosts";

interface GuestMenuCarouselCardProps {
    item: MenuItem;
    itemIndex: number;
    imageLoading: GuestMenuPhotoLoading;
}

/**
 * Carousel card: a fixed-width card inside a horizontally snapping row, one row per category.
 * Dishes without a photo get a short band with the dish initial so cards in a row stay aligned.
 */
export function GuestMenuCarouselCard({ item, itemIndex, imageLoading }: GuestMenuCarouselCardProps) {
    const ctx = useGuestMenuData();
    const desc = item.description?.trim() ?? "";
    const imageSrc = guestMenuImageSrc(item.imageUrl);
    const hasImage = imageSrc.length > 0;
    const soldOut = item.available === false;
    const initial = item.name.trim().charAt(0).toUpperCase() || "•";

    return (
        <li
            className={cn(
                "flex w-[210px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl bg-[var(--guest-surface)] ring-1 ring-[var(--guest-line)] animate-fade-in-up",
                soldOut && "opacity-60",
            )}
            style={{ animationDelay: `${Math.min(itemIndex, 6) * 50}ms` }}
        >
            {/* Without a photo the band grows instead of the body, so text sits at the bottom like neighbouring photo cards. */}
            <div className={cn("relative w-full overflow-hidden", hasImage ? "aspect-[4/3]" : "min-h-14 flex-1 bg-[var(--guest-accent-12)]")}>
                {hasImage ? (
                    <GuestMenuImage
                        src={imageSrc}
                        width={420}
                        height={315}
                        sizes="210px"
                        loading={imageLoading}
                        className={cn("h-full w-full object-cover", soldOut && "grayscale")}
                    />
                ) : (
                    <span
                        aria-hidden
                        className="absolute inset-0 flex items-center justify-center text-[28px] font-semibold text-[var(--guest-accent-55)]"
                    >
                        {initial}
                    </span>
                )}
                {item.chefRecommended && !soldOut && (
                    <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-[var(--guest-accent)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--guest-on-cta)] shadow-md shadow-black/20">
                        <Star className="h-2.5 w-2.5 fill-current" aria-hidden />
                        Chef&apos;s pick
                    </span>
                )}
                {soldOut && (
                    <span className="absolute left-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                        Sold out
                    </span>
                )}
            </div>

            <div className={cn("flex flex-col p-3", hasImage && "flex-1")}>
                <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-[var(--guest-text)]" title={item.name}>
                    {item.dietaryPreference && (
                        <span className="mr-1.5 inline-flex translate-y-[-2px] align-middle empty:hidden">
                            <GuestMenuDietMark preference={item.dietaryPreference} />
                        </span>
                    )}
                    {item.name}
                </h3>
                {desc ? (
                    <p className="mt-1 line-clamp-2 text-[12px] leading-snug text-[var(--guest-text-70)]" title={desc}>
                        {desc}
                    </p>
                ) : null}
                <GuestMenuItemInsights hotel={ctx.hotel} item={item} />

                <div className="mt-auto flex items-center justify-between gap-2 pt-3">
                    <p className="text-[15px] font-bold tabular-nums text-[var(--guest-accent)]">{formatPrice(item.price)}</p>
                    {ctx.digitalOrderingEnabled && <GuestMenuItemAction item={item} widthClass="w-[88px]" />}
                </div>
            </div>
        </li>
    );
}
