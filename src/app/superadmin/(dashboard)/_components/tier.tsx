"use client";

import type { SubscriptionTier } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Order used in filters and tier breakdowns. Mirrors backend `SubscriptionTier`. */
export const TIER_ORDER: SubscriptionTier[] = ["FREE", "STARTER", "CORE", "PRO", "ENTERPRISE"];

export const TIER_LABEL: Record<SubscriptionTier, string> = {
    FREE: "Free",
    STARTER: "Starter",
    CORE: "Core",
    PRO: "Plus",
    ENTERPRISE: "Enterprise",
};

/** List price per month, INR. Used for display only; the backend owns the MRR calculation. */
export const TIER_PRICE_INR: Record<SubscriptionTier, number> = {
    FREE: 0,
    STARTER: 499,
    CORE: 1999,
    PRO: 3999,
    ENTERPRISE: 7999,
};

const TIER_CLASS: Record<SubscriptionTier, string> = {
    FREE: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
    STARTER: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    CORE: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    PRO: "bg-violet-500/10 text-violet-400 border-violet-500/20",
    ENTERPRISE: "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

export function TierBadge({ tier, inactive, className }: { tier: SubscriptionTier; inactive?: boolean; className?: string }) {
    return (
        <span
            className={cn(
                "px-2 py-0.5 rounded-md text-xs font-medium border inline-flex items-center gap-1",
                TIER_CLASS[tier],
                className,
            )}
            title={inactive ? "Subscription row is inactive; hotel is treated as Free" : undefined}
        >
            {TIER_LABEL[tier]}
            {inactive && <span className="text-[10px] opacity-70">· inactive</span>}
        </span>
    );
}

// ─── Formatters ────────────────────────────────────────────

export function formatInr(amount: number, opts: { compact?: boolean } = {}): string {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
        notation: opts.compact ? "compact" : "standard",
    }).format(amount);
}

export function formatDate(iso: string | null | undefined): string {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

/** "2h ago", "3d ago", "never". Coarse on purpose; this is for scanning a list. */
export function formatRelative(iso: string | null | undefined, now = Date.now()): string {
    if (!iso) return "never";
    const diffMs = now - new Date(iso).getTime();
    const minutes = Math.round(diffMs / 60_000);
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.round(hours / 24);
    if (days < 30) return `${days}d ago`;
    const months = Math.round(days / 30);
    if (months < 12) return `${months}mo ago`;
    return `${Math.round(months / 12)}y ago`;
}

/** True when `iso` is missing or older than `days`. */
export function isOlderThan(iso: string | null | undefined, days: number, now = Date.now()): boolean {
    if (!iso) return true;
    return now - new Date(iso).getTime() > days * 86_400_000;
}

/** Days from now until `iso`; negative when already past. */
export function daysUntil(iso: string | null | undefined, now = Date.now()): number | null {
    if (!iso) return null;
    return Math.ceil((new Date(iso).getTime() - now) / 86_400_000);
}
