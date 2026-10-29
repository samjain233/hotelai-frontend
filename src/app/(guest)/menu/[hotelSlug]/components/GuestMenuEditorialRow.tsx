"use client";

import { MenuItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";
import { GuestMenuItemInsights } from "../GuestMenuItemInsights";
import { useGuestMenuData } from "./GuestMenuContext";
import { GuestMenuDietMark, GuestMenuItemAction, formatPrice } from "./GuestMenuItemParts";
import type { GuestMenuPhotoLoading } from "../templates/photoLoading";
import { GuestMenuImage } from "./GuestMenuImage";
import { guestMenuImageSrc } from "@/lib/guestMenuImageHosts";

interface GuestMenuEditorialRowProps {
    item: MenuItem;
    itemIndex: number;
    imageLoading: GuestMenuPhotoLoading;
}

/**
 * Print-menu row: serif dish name, dotted leader to a tabular price, hairline rules
 * instead of cards. Typography carries the design, so it reads well with or without photos.
 */
export function GuestMenuEditorialRow({ item, itemIndex, imageLoading }: GuestMenuEditorialRowProps) {
    const ctx = useGuestMenuData();
    const desc = item.description?.trim() ?? "";
    const imageSrc = guestMenuImageSrc(item.imageUrl);
    const hasImage = imageSrc.length > 0;
    const soldOut = item.available === false;

    return (
        <li
            className={cn("flex gap-4 py-5 first:pt-1 animate-fade-in-up", soldOut && "opacity-60")}
            style={{ animationDelay: `${itemIndex * 40}ms` }}
        >
            {hasImage && (
                <div className="relative mt-0.5 h-16 w-16 shrink-0 overflow-hidden rounded-full bg-[var(--guest-surface)] ring-1 ring-[var(--guest-line)] shadow-sm">
                    <GuestMenuImage
                        src={imageSrc}
                        width={128}
                        height={128}
                        sizes="64px"
                        loading={imageLoading}
                        className={cn("h-full w-full object-cover", soldOut && "grayscale")}
                    />
                </div>
            )}

            <div className="min-w-0 flex-1">
                {item.chefRecommended && (
                    <p className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--guest-accent)]">
                        <Sparkles className="h-3 w-3" aria-hidden />
                        Chef&apos;s recommendation
                    </p>
                )}

                {/* Name, then a dotted leader running to the price. If the name is too long to share
                    the line, the leader + price group wraps to its own full-width line beneath it. */}
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <h3
                        className="min-w-0 font-serif text-[19px] font-semibold leading-[1.2] tracking-tight text-[var(--guest-text)]"
                        title={item.name}
                    >
                        {item.dietaryPreference && (
                            <span className="mr-1.5 inline-flex translate-y-[-2px] align-middle empty:hidden">
                                <GuestMenuDietMark preference={item.dietaryPreference} />
                            </span>
                        )}
                        {item.name}
                    </h3>
                    <span className="flex min-w-[7rem] flex-1 items-baseline gap-2">
                        <span
                            aria-hidden
                            className="mb-[5px] flex-1 self-end border-b border-dotted border-[var(--guest-text-30)]"
                        />
                        <span className="shrink-0 text-[15px] font-semibold tabular-nums text-[var(--guest-text)]">
                            {soldOut ? (
                                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--guest-muted)]">Sold out</span>
                            ) : (
                                formatPrice(item.price)
                            )}
                        </span>
                    </span>
                </div>

                {desc ? (
                    <p className="mt-1.5 max-w-[46ch] text-[13px] font-light leading-relaxed text-[var(--guest-text-70)]">{desc}</p>
                ) : null}
                <GuestMenuItemInsights hotel={ctx.hotel} item={item} />

                {ctx.digitalOrderingEnabled && (
                    <div className="mt-3 flex justify-end">
                        <GuestMenuItemAction item={item} widthClass="w-[100px]" />
                    </div>
                )}
            </div>
        </li>
    );
}
