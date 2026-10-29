"use client";

import { MenuItem } from "@/lib/types";
import { UtensilsCrossed } from "lucide-react";
import { GuestMenuItemInsights } from "../GuestMenuItemInsights";
import { useGuestMenuData } from "./GuestMenuContext";
import type { GuestMenuPhotoLoading } from "../templates/photoLoading";
import { GuestMenuImage, GUEST_MENU_IMAGE_SIZES_HALF } from "./GuestMenuImage";
import { guestMenuImageSrc } from "@/lib/guestMenuImageHosts";
import { GuestMenuDietMark, GuestMenuItemAction, formatPrice } from "./GuestMenuItemParts";

interface GuestMenuGalleryCardProps {
    item: MenuItem;
    itemIndex: number;
    imageLoading: GuestMenuPhotoLoading;
}

export function GuestMenuGalleryCard({ item, itemIndex, imageLoading }: GuestMenuGalleryCardProps) {
    const ctx = useGuestMenuData();
    const desc = item.description?.trim() ?? "";
    const imageSrc = guestMenuImageSrc(item.imageUrl);
    const soldOut = item.available === false;

    return (
        <li
            className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[var(--guest-line)] bg-[var(--guest-surface)] shadow-sm animate-fade-in-up"
            style={{ animationDelay: `${itemIndex * 40}ms` }}
        >
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-[var(--guest-surface-2)]">
                {imageSrc ? (
                    <GuestMenuImage src={imageSrc} width={320} height={240} sizes={GUEST_MENU_IMAGE_SIZES_HALF} loading={imageLoading} className="h-full w-full object-cover" />
                ) : (
                    <div className="flex h-full w-full items-center justify-center">
                        <UtensilsCrossed className="h-7 w-7 text-[var(--guest-accent)] opacity-40" aria-hidden />
                    </div>
                )}
                {item.dietaryPreference && (
                    <span className="absolute left-2 top-2 flex rounded-md bg-white/95 p-0.5 shadow-sm empty:hidden">
                        <GuestMenuDietMark preference={item.dietaryPreference} />
                    </span>
                )}
                {soldOut && (
                    <span className="absolute inset-x-0 bottom-0 bg-black/65 py-1 text-center text-[11px] font-semibold uppercase tracking-wider text-white">
                        Sold out
                    </span>
                )}
            </div>

            <div className="flex flex-1 flex-col p-3">
                <h3 className="line-clamp-2 text-sm font-bold leading-snug text-[var(--guest-text)]" title={item.name}>
                    {item.name}
                </h3>
                {desc ? (
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[var(--guest-text-70)]">{desc}</p>
                ) : null}
                <GuestMenuItemInsights hotel={ctx.hotel} item={item} />
                <div className="mt-auto pt-3">
                    <p className="text-sm font-semibold text-[var(--guest-accent)]">{formatPrice(item.price)}</p>
                    {ctx.digitalOrderingEnabled && (
                        <div className="mt-2">
                            <GuestMenuItemAction item={item} widthClass="w-full" />
                        </div>
                    )}
                </div>
            </div>
        </li>
    );
}
