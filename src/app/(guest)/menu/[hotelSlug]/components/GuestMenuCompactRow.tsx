"use client";

import { MenuItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ChevronDown, Sparkles } from "lucide-react";
import { GuestMenuItemInsights } from "../GuestMenuItemInsights";
import { useGuestMenuData } from "./GuestMenuContext";
import { GuestMenuDietMark, GuestMenuItemAction, formatPrice } from "./GuestMenuItemParts";
import type { GuestMenuPhotoLoading } from "../templates/photoLoading";
import { GuestMenuImage, GUEST_MENU_IMAGE_SIZES_FULL } from "./GuestMenuImage";
import { guestMenuImageSrc } from "@/lib/guestMenuImageHosts";

interface GuestMenuCompactRowProps {
    item: MenuItem;
    itemIndex: number;
    imageLoading: GuestMenuPhotoLoading;
    expanded: boolean;
    onToggle: () => void;
}

/**
 * Dense row for long menus: one line of name + price, tap to reveal photo, description
 * and details. The ADD control stays on the collapsed row so ordering never needs two taps.
 */
export function GuestMenuCompactRow({ item, itemIndex, imageLoading, expanded, onToggle }: GuestMenuCompactRowProps) {
    const ctx = useGuestMenuData();
    const desc = item.description?.trim() ?? "";
    const imageSrc = guestMenuImageSrc(item.imageUrl);
    const hasImage = imageSrc.length > 0;
    const soldOut = item.available === false;
    const hasDetails = Boolean(desc || hasImage || item.chefRecommended || ctx.hotel?.guestMenuShowItemInsights);
    const panelId = `compact-details-${item.id}`;

    return (
        <li
            className={cn(
                "rounded-lg transition-colors odd:bg-[var(--guest-surface)]/70 animate-fade-in-up",
                expanded && "bg-[var(--guest-surface)] odd:bg-[var(--guest-surface)] ring-1 ring-[var(--guest-line)]",
                soldOut && "opacity-60",
            )}
            style={{ animationDelay: `${Math.min(itemIndex, 12) * 25}ms` }}
        >
            <div className="flex items-center gap-2 py-2 pl-2.5 pr-2">
                <button
                    type="button"
                    onClick={hasDetails ? onToggle : undefined}
                    aria-expanded={hasDetails ? expanded : undefined}
                    aria-controls={hasDetails ? panelId : undefined}
                    disabled={!hasDetails}
                    className={cn(
                        "flex min-w-0 flex-1 items-center gap-2 rounded-md text-left",
                        hasDetails && "cursor-pointer",
                    )}
                >
                    <span className="shrink-0">
                        <GuestMenuDietMark preference={item.dietaryPreference} placeholder />
                    </span>
                    <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5">
                            <span className="truncate text-[15px] font-semibold leading-tight text-[var(--guest-text)]" title={item.name}>
                                {item.name}
                            </span>
                            {item.chefRecommended && (
                                <Sparkles className="h-3.5 w-3.5 shrink-0 text-[var(--guest-accent)]" aria-label="Chef's pick" />
                            )}
                        </span>
                        {!expanded && desc ? (
                            <span className="mt-0.5 block truncate text-[12px] leading-tight text-[var(--guest-muted)]">{desc}</span>
                        ) : null}
                    </span>
                    <span className="shrink-0 pl-1 text-[14px] font-bold tabular-nums text-[var(--guest-accent)]">
                        {formatPrice(item.price)}
                    </span>
                    {hasDetails && (
                        <ChevronDown
                            className={cn(
                                "h-4 w-4 shrink-0 text-[var(--guest-muted)] transition-transform duration-200",
                                expanded && "rotate-180",
                            )}
                            aria-hidden
                        />
                    )}
                </button>
                {ctx.digitalOrderingEnabled && (
                    <div className="shrink-0">
                        <GuestMenuItemAction item={item} widthClass="w-[88px]" />
                    </div>
                )}
            </div>

            {expanded && hasDetails && (
                <div id={panelId} className="px-3 pb-3 pt-0.5">
                    {hasImage && (
                        <div className="mb-2.5 overflow-hidden rounded-lg bg-[var(--guest-surface-2)]">
                            <GuestMenuImage
                                src={imageSrc}
                                width={640}
                                height={360}
                                sizes={GUEST_MENU_IMAGE_SIZES_FULL}
                                loading={imageLoading}
                                className={cn("aspect-[16/9] w-full object-cover", soldOut && "grayscale")}
                            />
                        </div>
                    )}
                    {soldOut && (
                        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--guest-muted)]">Sold out</p>
                    )}
                    {desc ? <p className="text-[13px] leading-relaxed text-[var(--guest-text-70)]">{desc}</p> : null}
                    <GuestMenuItemInsights hotel={ctx.hotel} item={item} />
                </div>
            )}
        </li>
    );
}
