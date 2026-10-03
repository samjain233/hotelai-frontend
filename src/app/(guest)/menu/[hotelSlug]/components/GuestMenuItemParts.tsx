"use client";

import { cn } from "@/lib/utils";
import { MenuItem } from "@/lib/types";
import { Plus, Minus, Egg } from "lucide-react";
import { IndianVegMark, IndianNonVegMark } from "../GuestMenuDietIcons";
import { useGuestMenuContext } from "./GuestMenuContext";

export function formatPrice(price: number | string) {
    const n = typeof price === "number" ? price : parseFloat(String(price ?? 0)) || 0;
    const hasDecimals = n % 1 !== 0;
    return `₹${n.toLocaleString("en-IN", {
        minimumFractionDigits: hasDecimals ? 2 : 0,
        maximumFractionDigits: 2,
    })}`;
}

export function GuestMenuDietMark({
    preference,
    placeholder = false,
}: {
    preference: MenuItem["dietaryPreference"];
    /** Reserve the mark's space when there is no diet mark, so names stay aligned. */
    placeholder?: boolean;
}) {
    if (preference === "VEG") return <IndianVegMark />;
    if (preference === "NON_VEG") return <IndianNonVegMark />;
    if (preference === "EGGITARIAN") {
        return (
            <span className="inline-flex h-[18px] w-[18px] items-center justify-center rounded border border-amber-500/60" title="Contains egg">
                <Egg className="h-3 w-3 text-amber-400" />
            </span>
        );
    }
    return placeholder ? <span className="inline-block h-[18px] w-[18px]" aria-hidden /> : null;
}

/** ADD button / quantity stepper; renders nothing when digital ordering is off. */
export function GuestMenuItemAction({ item, widthClass = "w-[100px] sm:w-28" }: { item: MenuItem; widthClass?: string }) {
    const ctx = useGuestMenuContext();
    const qty = ctx.getCartQuantity(item.id);
    const itemIsAvailable = item.available !== false;

    if (!ctx.digitalOrderingEnabled) return null;

    if (qty === 0) {
        return (
            <button
                type="button"
                onClick={() => ctx.addToCart(item)}
                disabled={!itemIsAvailable}
                className={cn(
                    "flex h-9 items-center justify-center rounded-xl border-2 border-[var(--guest-accent-70)] bg-[var(--guest-surface)] text-center text-xs font-extrabold uppercase tracking-wider text-[var(--guest-accent)] shadow-md shadow-black/20 transition-all hover:bg-[var(--guest-accent-12)] hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40",
                    widthClass,
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
    }

    return (
        <div
            className={cn(
                "flex h-9 items-center justify-between rounded-xl border border-[var(--guest-accent-40)] bg-[var(--guest-surface)] px-1 shadow-md shadow-black/20",
                widthClass,
            )}
        >
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
