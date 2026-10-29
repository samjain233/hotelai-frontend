"use client";

import { MenuItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Sparkles, UtensilsCrossed } from "lucide-react";
import { GuestMenuItemInsights } from "../GuestMenuItemInsights";
import { useGuestMenuData } from "./GuestMenuContext";
import { GuestMenuDietMark, GuestMenuItemAction, formatPrice } from "./GuestMenuItemParts";
import type { GuestMenuPhotoLoading } from "../templates/photoLoading";
import { GuestMenuImage, GUEST_MENU_IMAGE_SIZES_FULL } from "./GuestMenuImage";
import { guestMenuImageSrc } from "@/lib/guestMenuImageHosts";

interface GuestMenuShowcaseCardProps {
    item: MenuItem;
    itemIndex: number;
    imageLoading: GuestMenuPhotoLoading;
}

/**
 * Full-width magazine card: the photo is the hero, with name and price set on a
 * dark gradient so they stay readable on any image. Items without a photo get a
 * slim accent band instead, so a mixed menu still reads as one design.
 */
export function GuestMenuShowcaseCard({ item, itemIndex, imageLoading }: GuestMenuShowcaseCardProps) {
    const ctx = useGuestMenuData();
    const desc = item.description?.trim() ?? "";
    const imageSrc = guestMenuImageSrc(item.imageUrl);
    const hasImage = imageSrc.length > 0;
    const soldOut = item.available === false;
    const price = formatPrice(item.price);

    return (
        <li
            className={cn(
                "overflow-hidden rounded-3xl border border-[var(--guest-line)] bg-[var(--guest-surface)] shadow-[0_8px_30px_-12px_rgba(0,0,0,0.35)] animate-fade-in-up",
                soldOut && "opacity-80",
            )}
            style={{ animationDelay: `${itemIndex * 40}ms` }}
        >
            {hasImage ? (
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-[var(--guest-surface-2)]">
                    <GuestMenuImage
                        src={imageSrc}
                        width={640}
                        height={400}
                        sizes={GUEST_MENU_IMAGE_SIZES_FULL}
                        loading={imageLoading}
                        className={cn("h-full w-full object-cover", soldOut && "grayscale")}
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/5" />

                    <div className="absolute left-3 top-3 flex items-center gap-1.5">
                        {item.dietaryPreference && (
                            <span className="flex rounded-md bg-white/95 p-0.5 shadow-sm empty:hidden">
                                <GuestMenuDietMark preference={item.dietaryPreference} />
                            </span>
                        )}
                        {item.chefRecommended && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-900 shadow-sm">
                                <Sparkles className="h-3 w-3 text-amber-500" aria-hidden />
                                Chef&apos;s pick
                            </span>
                        )}
                    </div>

                    {soldOut && (
                        <span className="absolute right-3 top-3 rounded-full bg-black/70 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
                            Sold out
                        </span>
                    )}

                    <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
                        <h3
                            className="line-clamp-2 text-lg font-bold leading-tight tracking-tight text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]"
                            title={item.name}
                        >
                            {item.name}
                        </h3>
                        <span className="shrink-0 rounded-full bg-white px-3 py-1 text-sm font-extrabold tabular-nums text-zinc-900 shadow-md">
                            {price}
                        </span>
                    </div>
                </div>
            ) : (
                <div className="relative">
                    <div className="h-1.5 w-full bg-gradient-to-r from-[var(--guest-accent)] via-[var(--guest-accent-55)] to-transparent" />
                    <div className="flex items-start justify-between gap-3 px-4 pt-4">
                        <div className="flex min-w-0 gap-2">
                            {item.dietaryPreference && (
                                <div className="mt-0.5 shrink-0">
                                    <GuestMenuDietMark preference={item.dietaryPreference} />
                                </div>
                            )}
                            <div className="min-w-0">
                                <h3 className="text-[17px] font-bold leading-tight tracking-tight text-[var(--guest-text)]" title={item.name}>
                                    {item.name}
                                </h3>
                                {item.chefRecommended && (
                                    <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[var(--guest-accent-90)]">
                                        <Sparkles className="h-3 w-3" aria-hidden />
                                        Chef&apos;s pick
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                            <span className="rounded-full border border-[var(--guest-accent-40)] bg-[var(--guest-accent-12)] px-3 py-1 text-sm font-extrabold tabular-nums text-[var(--guest-accent)]">
                                {price}
                            </span>
                            {soldOut && (
                                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--guest-muted)]">Sold out</span>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className={cn("px-4 pb-4", hasImage ? "pt-3" : "pt-2.5")}>
                {desc ? (
                    <p className="line-clamp-3 text-[13px] leading-relaxed text-[var(--guest-text-70)]">{desc}</p>
                ) : !hasImage ? (
                    <p className="flex items-center gap-1.5 text-xs text-[var(--guest-muted)]">
                        <UtensilsCrossed className="h-3.5 w-3.5 text-[var(--guest-accent)] opacity-60" aria-hidden />
                        Freshly prepared to order
                    </p>
                ) : null}
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
