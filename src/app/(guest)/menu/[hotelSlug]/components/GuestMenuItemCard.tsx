"use client";

import { cn } from "@/lib/utils";
import { MenuItem } from "@/lib/types";
import { Plus, Minus } from "lucide-react";
import { IndianVegMark, IndianNonVegMark } from "../GuestMenuDietIcons";
import { GuestMenuItemInsights } from "../GuestMenuItemInsights";
import { Egg } from "lucide-react";
import { useGuestMenuContext } from "./GuestMenuContext";

interface GuestMenuItemCardProps {
    item: MenuItem;
    itemIndex: number;
    catIndex: number;
    isPriorityImage: boolean;
    expandedDescId: string | null;
    setExpandedDescId: React.Dispatch<React.SetStateAction<string | null>>;
}

function formatPrice(price: number | string) {
    const n = typeof price === "number" ? price : parseFloat(String(price ?? 0)) || 0;
    const hasDecimals = n % 1 !== 0;
    return `₹${n.toLocaleString("en-IN", {
        minimumFractionDigits: hasDecimals ? 2 : 0,
        maximumFractionDigits: 2,
    })}`;
}

export function GuestMenuItemCard({
    item,
    itemIndex,
    catIndex,
    isPriorityImage,
    expandedDescId,
    setExpandedDescId,
}: GuestMenuItemCardProps) {
    const ctx = useGuestMenuContext();

    const qty = ctx.getCartQuantity(item.id);
    const itemIsAvailable = item.available !== false;
    const desc = item.description?.trim() ?? "";
    const descLong = desc.length > 72;
    const descOpen = expandedDescId === item.id;
    const imageSrc = item.imageUrl?.trim() ?? "";
    const hasImage = imageSrc.length > 0;

    let actionBlock: React.ReactNode = null;
    if (!ctx.digitalOrderingEnabled) {
        // Hidden
    } else if (qty === 0) {
        actionBlock = (
            <button
                type="button"
                onClick={() => ctx.addToCart(item)}
                disabled={!itemIsAvailable}
                className={cn(
                    "flex h-9 w-[100px] sm:w-28 items-center justify-center rounded-xl border-2 border-[var(--guest-accent-70)] bg-[var(--guest-surface)] text-center text-xs font-extrabold uppercase tracking-wider text-[var(--guest-accent)] shadow-md shadow-black/20 transition-all hover:bg-[var(--guest-accent-12)] hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40",
                )}
            >
                {itemIsAvailable ? (
                    <span className="flex items-center gap-1">
                        ADD <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
                    </span>
                ) : (
                    "Sold out"
                )}
            </button>
        );
    } else {
        actionBlock = (
            <div className="flex h-9 w-[100px] sm:w-28 items-center justify-between rounded-xl border border-[var(--guest-accent-40)] bg-[var(--guest-surface)] px-1 shadow-md shadow-black/20">
                <button
                    type="button"
                    onClick={() => ctx.removeFromCart(item.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--guest-surface-2)] text-[var(--guest-text)] hover:opacity-90 active:scale-90 transition"
                    aria-label="Decrease quantity"
                >
                    <Minus className="h-3.5 w-3.5 stroke-[2.5]" />
                </button>
                <span className="min-w-[1.25rem] text-center text-sm font-bold tabular-nums text-[var(--guest-text)]">{qty}</span>
                <button
                    type="button"
                    onClick={() => ctx.addToCart(item)}
                    disabled={!ctx.isOpen}
                    className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--guest-cta)] text-[var(--guest-on-cta)] hover:bg-[var(--guest-cta-hover)] active:scale-90 transition",
                        !ctx.isOpen && "opacity-40",
                    )}
                    aria-label="Increase quantity"
                >
                    <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
                </button>
            </div>
        );
    }

    return (
        <li
            className="relative z-0 flex items-center justify-between gap-3.5 py-4 first:pt-0 animate-fade-in-up"
            style={{ animationDelay: `${itemIndex * 40}ms` }}
        >
            <div className="min-w-0 flex-1">
                <div className="flex gap-2">
                    <div className="mt-0.5 shrink-0">
                        {item.dietaryPreference === "VEG" ? (
                            <IndianVegMark />
                        ) : item.dietaryPreference === "NON_VEG" ? (
                            <IndianNonVegMark />
                        ) : item.dietaryPreference === "EGGITARIAN" ? (
                            <span className="inline-flex h-[18px] w-[18px] items-center justify-center rounded border border-amber-500/60" title="Contains egg">
                                <Egg className="h-3 w-3 text-amber-400" />
                            </span>
                        ) : (
                            <span className="inline-block h-[18px] w-[18px]" aria-hidden />
                        )}
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="text-[15px] font-bold leading-snug text-[var(--guest-text)]" title={item.name}>
                            {item.name}
                        </h3>
                        <p className="mt-1 text-sm font-semibold text-[var(--guest-accent)]">{formatPrice(item.price)}</p>
                        <GuestMenuItemInsights hotel={ctx.hotel} item={item} />
                        {desc ? (
                            <div className="mt-1.5">
                                <p
                                    className={cn(
                                        "text-[13px] leading-relaxed text-[var(--guest-text-70)]",
                                        !descOpen && descLong && "line-clamp-2",
                                    )}
                                >
                                    {desc}
                                </p>
                                {descLong ? (
                                    <button
                                        type="button"
                                        className="mt-0.5 text-xs font-medium text-[var(--guest-accent-90)] hover:opacity-80"
                                        onClick={() => setExpandedDescId((id) => (id === item.id ? null : item.id))}
                                    >
                                        {descOpen ? "less" : "…more"}
                                    </button>
                                ) : null}
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
            {hasImage ? (
                <div className={cn(
                    "relative flex w-[114px] sm:w-[124px] shrink-0 flex-col items-center self-start",
                    ctx.digitalOrderingEnabled && "pb-3"
                )}>
                    <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-[var(--guest-surface)] ring-1 ring-[var(--guest-line)] shadow-sm">
                        {/* Menu images are arbitrary hotel URLs; <img> avoids next/image domain config. */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={imageSrc}
                            alt=""
                            width={240}
                            height={240}
                            loading={isPriorityImage ? "eager" : "lazy"}
                            decoding="async"
                            fetchPriority={isPriorityImage ? "high" : "auto"}
                            className="h-full w-full object-cover"
                        />
                    </div>
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 z-10">
                        {actionBlock}
                    </div>
                </div>
            ) : (
                <div className="flex w-[114px] sm:w-[124px] shrink-0 items-center justify-center self-center">
                    {actionBlock}
                </div>
            )}
        </li>
    );
}
