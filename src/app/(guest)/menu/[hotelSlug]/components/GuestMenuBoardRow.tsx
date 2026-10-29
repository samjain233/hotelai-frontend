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

interface GuestMenuBoardRowProps {
    item: MenuItem;
    itemIndex: number;
    imageLoading: GuestMenuPhotoLoading;
}

/**
 * Café-board row: condensed uppercase name, an oversized price in the accent colour,
 * dashed rules. Loud and quick to scan, the way a chalkboard behind a counter reads.
 */
export function GuestMenuBoardRow({ item, itemIndex, imageLoading }: GuestMenuBoardRowProps) {
    const ctx = useGuestMenuData();
    const desc = item.description?.trim() ?? "";
    const imageSrc = guestMenuImageSrc(item.imageUrl);
    const hasImage = imageSrc.length > 0;
    const soldOut = item.available === false;

    return (
        <li
            className={cn("flex items-start gap-3 py-3.5 animate-fade-in-up", soldOut && "opacity-60")}
            style={{ animationDelay: `${itemIndex * 40}ms` }}
        >
            {hasImage && (
                <div className="relative mt-0.5 h-14 w-14 shrink-0 overflow-hidden rounded-md bg-[var(--guest-surface)] ring-1 ring-[var(--guest-text-20)]">
                    <GuestMenuImage
                        src={imageSrc}
                        width={112}
                        height={112}
                        sizes="56px"
                        loading={imageLoading}
                        className={cn("h-full w-full object-cover", soldOut && "grayscale")}
                    />
                </div>
            )}

            <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <h3
                            className="font-condensed text-[19px] font-medium uppercase leading-[1.1] tracking-wide text-[var(--guest-text)]"
                            title={item.name}
                        >
                            {item.dietaryPreference && (
                                <span className="mr-1.5 inline-flex translate-y-[-3px] align-middle empty:hidden">
                                    <GuestMenuDietMark preference={item.dietaryPreference} />
                                </span>
                            )}
                            {item.name}
                        </h3>
                        {item.chefRecommended && (
                            <span className="mt-1 inline-flex items-center gap-1 rounded-sm bg-[var(--guest-accent)] px-1.5 py-0.5 font-condensed text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--guest-on-cta)]">
                                <Star className="h-2.5 w-2.5 fill-current" aria-hidden />
                                Chef&apos;s pick
                            </span>
                        )}
                    </div>
                    <div className="shrink-0 text-right">
                        {soldOut ? (
                            <span className="font-condensed text-[13px] font-medium uppercase tracking-wider text-[var(--guest-muted)] line-through decoration-2">
                                {formatPrice(item.price)}
                            </span>
                        ) : (
                            <span className="font-condensed text-[22px] font-semibold leading-none tabular-nums text-[var(--guest-accent)]">
                                {formatPrice(item.price)}
                            </span>
                        )}
                        {soldOut && (
                            <p className="font-condensed text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--guest-muted)]">Sold out</p>
                        )}
                    </div>
                </div>

                {desc ? (
                    <p className="mt-1 text-[12.5px] leading-snug text-[var(--guest-text-70)]">{desc}</p>
                ) : null}
                <GuestMenuItemInsights hotel={ctx.hotel} item={item} />

                {ctx.digitalOrderingEnabled && (
                    <div className="mt-2.5 flex justify-end">
                        <GuestMenuItemAction item={item} widthClass="w-[100px]" />
                    </div>
                )}
            </div>
        </li>
    );
}
