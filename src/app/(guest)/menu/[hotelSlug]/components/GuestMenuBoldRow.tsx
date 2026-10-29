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

interface GuestMenuBoldRowProps {
    item: MenuItem;
    itemIndex: number;
    imageLoading: GuestMenuPhotoLoading;
}

/**
 * Bold row: extra-heavy dish names set large, the price in a filled accent pill, and the
 * photo cropped to a circle. Energetic and youthful; suits cafés, hostels and rooftop bars.
 */
export function GuestMenuBoldRow({ item, itemIndex, imageLoading }: GuestMenuBoldRowProps) {
    const ctx = useGuestMenuData();
    const desc = item.description?.trim() ?? "";
    const imageSrc = guestMenuImageSrc(item.imageUrl);
    const hasImage = imageSrc.length > 0;
    const soldOut = item.available === false;

    return (
        <li
            className={cn(
                "flex items-start gap-4 border-b-2 border-[var(--guest-text-12)] py-5 last:border-b-0 animate-fade-in-up",
                soldOut && "opacity-60",
            )}
            style={{ animationDelay: `${itemIndex * 40}ms` }}
        >
            <div className="min-w-0 flex-1">
                {item.chefRecommended && (
                    <p className="mb-1 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--guest-accent)]">
                        <Sparkles className="h-3 w-3" aria-hidden />
                        Chef&apos;s pick
                    </p>
                )}
                <h3
                    className="text-[21px] font-extrabold leading-[1.08] tracking-[-0.02em] text-[var(--guest-text)]"
                    title={item.name}
                >
                    {item.dietaryPreference && (
                        <span className="mr-1.5 inline-flex translate-y-[-3px] align-middle empty:hidden">
                            <GuestMenuDietMark preference={item.dietaryPreference} />
                        </span>
                    )}
                    {item.name}
                </h3>
                {desc ? (
                    <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--guest-text-70)]">{desc}</p>
                ) : null}
                <GuestMenuItemInsights hotel={ctx.hotel} item={item} />

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    {soldOut ? (
                        <span className="inline-flex h-8 items-center rounded-full bg-[var(--guest-text-12)] px-3 text-[12px] font-bold uppercase tracking-wider text-[var(--guest-muted)]">
                            Sold out
                        </span>
                    ) : (
                        <span className="inline-flex h-8 items-center rounded-full bg-[var(--guest-accent)] px-3.5 text-[14px] font-extrabold tabular-nums text-[var(--guest-on-cta)]">
                            {formatPrice(item.price)}
                        </span>
                    )}
                    {ctx.digitalOrderingEnabled && <GuestMenuItemAction item={item} widthClass="w-[100px]" />}
                </div>
            </div>

            {hasImage && (
                <div className="relative h-[84px] w-[84px] shrink-0 overflow-hidden rounded-full bg-[var(--guest-surface)] ring-4 ring-[var(--guest-accent-20)]">
                    <GuestMenuImage
                        src={imageSrc}
                        width={168}
                        height={168}
                        sizes="84px"
                        loading={imageLoading}
                        className={cn("h-full w-full object-cover", soldOut && "grayscale")}
                    />
                </div>
            )}
        </li>
    );
}
