"use client";

import { Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SubscriptionTier } from "@/lib/types";

const TIER_META: Record<SubscriptionTier, { label: string; className: string; paid: boolean }> = {
    FREE: {
        label: "Free",
        className: "border-border bg-secondary text-muted-foreground",
        paid: false,
    },
    STARTER: {
        label: "Starter",
        className: "border-sky-500/40 bg-sky-500/15 text-sky-300",
        paid: true,
    },
    CORE: {
        label: "Core",
        className: "border-[#e8b931]/40 bg-[#e8b931]/15 text-[#e8b931]",
        paid: true,
    },
    PRO: {
        label: "Pro",
        className: "border-indigo-500/40 bg-indigo-500/15 text-indigo-300",
        paid: true,
    },
    ENTERPRISE: {
        label: "Enterprise",
        className: "border-emerald-500/40 bg-emerald-500/15 text-emerald-300",
        paid: true,
    },
};

/**
 * Shows the hotel's effective subscription tier (from `/auth/me` → `hotel.tier`).
 * Renders nothing until the profile has loaded.
 */
export function TierBadge({ tier, className }: { tier?: SubscriptionTier | string; className?: string }) {
    const meta = tier && tier in TIER_META ? TIER_META[tier as SubscriptionTier] : null;
    if (!meta) return null;
    return (
        <span
            className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em]",
                meta.className,
                className,
            )}
            title={`${meta.label} plan`}
        >
            {meta.paid ? <Crown className="h-3 w-3" aria-hidden /> : null}
            {meta.label}
        </span>
    );
}
