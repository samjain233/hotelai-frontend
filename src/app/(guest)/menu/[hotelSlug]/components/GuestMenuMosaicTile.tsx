"use client";

import { MenuItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Star } from "lucide-react";
import { GuestMenuItemInsights } from "../GuestMenuItemInsights";
import { useGuestMenuData } from "./GuestMenuContext";
import { GuestMenuDietMark, GuestMenuItemAction, formatPrice } from "./GuestMenuItemParts";
import type { GuestMenuPhotoLoading } from "../templates/photoLoading";
import { GuestMenuImage, GUEST_MENU_IMAGE_SIZES_FULL, GUEST_MENU_IMAGE_SIZES_HALF } from "./GuestMenuImage";
import { guestMenuImageSrc } from "@/lib/guestMenuImageHosts";

interface GuestMenuMosaicTileProps {
    item: MenuItem;
    itemIndex: number;
    imageLoading: GuestMenuPhotoLoading;
    /** Spans both grid columns with a wide hero crop; otherwise a square tile. */
    wide: boolean;
}

/**
 * Bento tile: the photo fills the tile and the name and price sit on a gradient at its foot.
 * Dishes without a photo become a colour tile with a large faded initial, so a mixed menu still
 * reads as one mosaic. Ordering controls and insight chips live in a slim strip under the image
 * (hidden when there is nothing to show), so view-only menus stay a pure grid of pictures.
 */
export function GuestMenuMosaicTile({ item, itemIndex, imageLoading, wide }: GuestMenuMosaicTileProps) {
    const ctx = useGuestMenuData();
    const desc = item.description?.trim() ?? "";
    const imageSrc = guestMenuImageSrc(item.imageUrl);
    const hasImage = imageSrc.length > 0;
    const soldOut = item.available === false;
    const initial = item.name.trim().charAt(0).toUpperCase() || "•";
    const price = formatPrice(item.price);

    return (
        <li
            className={cn(
                "group relative flex min-w-0 flex-col overflow-hidden rounded-2xl bg-[var(--guest-surface)] ring-1 ring-[var(--guest-line)] shadow-[0_6px_24px_-14px_rgba(0,0,0,0.45)] animate-fade-in-up",
                wide && "col-span-2",
                soldOut && "opacity-75",
            )}
            style={{ animationDelay: `${Math.min(itemIndex, 8) * 40}ms` }}
        >
            <div
                className={cn(
                    "relative w-full overflow-hidden",
                    // A wide colour tile has nothing to fill a 16:9 frame, so it takes a shorter banner crop.
                    wide ? (hasImage ? "aspect-[16/9]" : "aspect-[21/9]") : "aspect-square",
                    hasImage ? "bg-[var(--guest-surface-2)]" : "bg-[var(--guest-accent-12)]",
                )}
            >
                {hasImage ? (
                    <>
                        <GuestMenuImage
                            src={imageSrc}
                            width={wide ? 720 : 400}
                            height={wide ? 405 : 400}
                            sizes={wide ? GUEST_MENU_IMAGE_SIZES_FULL : GUEST_MENU_IMAGE_SIZES_HALF}
                            loading={imageLoading}
                            className={cn(
                                // GuestMenuImage already transitions opacity and transform.
                                "h-full w-full object-cover group-hover:scale-[1.03]",
                                soldOut && "grayscale",
                            )}
                        />
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
                    </>
                ) : (
                    <span
                        aria-hidden
                        className={cn(
                            "pointer-events-none absolute -right-2 -top-4 select-none font-black leading-none tracking-tighter text-[var(--guest-accent-18)]",
                            wide ? "text-[150px]" : "text-[120px]",
                        )}
                    >
                        {initial}
                    </span>
                )}

                {/* Top row: diet mark, chef's pick, sold out */}
                <div className="absolute inset-x-2.5 top-2.5 flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                        {item.dietaryPreference && (
                            <span className="flex rounded-md bg-white/95 p-0.5 shadow-sm empty:hidden">
                                <GuestMenuDietMark preference={item.dietaryPreference} />
                            </span>
                        )}
                        {item.chefRecommended && !soldOut && (
                            <span
                                className="inline-flex h-6 items-center gap-1 rounded-full bg-[var(--guest-accent)] px-2 text-[10px] font-bold uppercase tracking-wider text-[var(--guest-on-cta)] shadow-md shadow-black/20"
                                title="Chef's pick"
                            >
                                <Star className="h-3 w-3 fill-current" aria-hidden />
                                {wide ? "Chef's pick" : <span className="sr-only">Chef&apos;s pick</span>}
                            </span>
                        )}
                    </div>
                    {soldOut && (
                        <span className="rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
                            Sold out
                        </span>
                    )}
                </div>

                {/* Foot: name (+ description on wide tiles) and price */}
                <div className={cn("absolute inset-x-0 bottom-0 flex items-end justify-between gap-2", wide ? "p-4" : "p-3")}>
                    <div className="min-w-0 flex-1">
                        <h3
                            className={cn(
                                "font-bold leading-tight tracking-tight",
                                wide ? "line-clamp-2 text-xl" : "line-clamp-3 text-[15px]",
                                hasImage ? "text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]" : "text-[var(--guest-text)]",
                            )}
                            title={item.name}
                        >
                            {item.name}
                        </h3>
                        {wide && desc ? (
                            <p
                                className={cn(
                                    "mt-1 line-clamp-2 text-[13px] leading-snug",
                                    hasImage ? "text-white/85" : "text-[var(--guest-text-70)]",
                                )}
                                title={desc}
                            >
                                {desc}
                            </p>
                        ) : null}
                    </div>
                    <span
                        className={cn(
                            "shrink-0 rounded-full px-2.5 py-1 text-[13px] font-extrabold tabular-nums shadow-md",
                            hasImage
                                ? "bg-white text-zinc-900"
                                : "border border-[var(--guest-accent-40)] bg-[var(--guest-surface)] text-[var(--guest-accent)]",
                        )}
                    >
                        {price}
                    </span>
                </div>
            </div>

            {/* Strip under the image; collapses when there is nothing to show so view-only menus stay a pure mosaic.
                mt-auto keeps ADD buttons level across a row when only one tile has insight chips. */}
            <div className="mt-auto flex flex-col gap-2 px-3 pb-3 pt-2 empty:hidden">
                <GuestMenuItemInsights hotel={ctx.hotel} item={item} />
                {ctx.digitalOrderingEnabled && (
                    <div className={cn("flex", wide ? "justify-end" : "justify-stretch")}>
                        <GuestMenuItemAction item={item} widthClass={wide ? "w-36" : "w-full"} />
                    </div>
                )}
            </div>
        </li>
    );
}
