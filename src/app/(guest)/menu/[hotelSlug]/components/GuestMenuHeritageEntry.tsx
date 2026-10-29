"use client";

import { MenuItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { GuestMenuItemInsights } from "../GuestMenuItemInsights";
import { useGuestMenuData } from "./GuestMenuContext";
import { GuestMenuDietMark, GuestMenuItemAction, formatPrice } from "./GuestMenuItemParts";
import type { GuestMenuPhotoLoading } from "../templates/photoLoading";
import { GuestMenuImage } from "./GuestMenuImage";
import { guestMenuImageSrc } from "@/lib/guestMenuImageHosts";

interface GuestMenuHeritageEntryProps {
    item: MenuItem;
    itemIndex: number;
    imageLoading: GuestMenuPhotoLoading;
}

/**
 * Palace-menu entry: everything centred, Garamond name, small-caps labels, an italic
 * description and a short rule between dishes instead of full-width lines.
 */
export function GuestMenuHeritageEntry({ item, itemIndex, imageLoading }: GuestMenuHeritageEntryProps) {
    const ctx = useGuestMenuData();
    const desc = item.description?.trim() ?? "";
    const imageSrc = guestMenuImageSrc(item.imageUrl);
    const hasImage = imageSrc.length > 0;
    const soldOut = item.available === false;

    return (
        <li
            className={cn("flex flex-col items-center px-2 py-5 text-center animate-fade-in-up", soldOut && "opacity-60")}
            style={{ animationDelay: `${itemIndex * 40}ms` }}
        >
            {hasImage && (
                <div className="mb-3 h-[76px] w-[76px] overflow-hidden rounded-full bg-[var(--guest-surface)] p-[3px] ring-1 ring-[var(--guest-accent-55)]">
                    <GuestMenuImage
                        src={imageSrc}
                        width={152}
                        height={152}
                        sizes="70px"
                        loading={imageLoading}
                        className={cn("h-full w-full rounded-full object-cover", soldOut && "grayscale")}
                    />
                </div>
            )}

            {item.chefRecommended && (
                <p className="mb-1 font-garamond text-[12px] font-semibold uppercase tracking-[0.22em] text-[var(--guest-accent)]">
                    Chef&apos;s recommendation
                </p>
            )}

            <h3
                className="max-w-[26ch] font-garamond text-[23px] font-semibold leading-[1.15] text-[var(--guest-text)]"
                title={item.name}
            >
                {item.dietaryPreference && (
                    <span className="mr-1.5 inline-flex translate-y-[-3px] align-middle empty:hidden">
                        <GuestMenuDietMark preference={item.dietaryPreference} />
                    </span>
                )}
                {item.name}
            </h3>

            <p className="mt-1.5 font-garamond text-[17px] font-semibold tracking-[0.08em] text-[var(--guest-accent)]">
                {soldOut ? (
                    <span className="text-[12px] uppercase tracking-[0.2em] text-[var(--guest-muted)]">Sold out</span>
                ) : (
                    formatPrice(item.price)
                )}
            </p>

            {desc ? (
                <p className="mt-2 max-w-[38ch] font-garamond text-[16px] italic leading-snug text-[var(--guest-text-70)]">{desc}</p>
            ) : null}

            <div className="flex justify-center [&>div]:justify-center">
                <GuestMenuItemInsights hotel={ctx.hotel} item={item} />
            </div>

            {ctx.digitalOrderingEnabled && (
                <div className="mt-3">
                    <GuestMenuItemAction item={item} widthClass="w-[112px]" />
                </div>
            )}
        </li>
    );
}
