"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    Building2,
    IndianRupee,
    Eye,
    UserPlus,
    Sparkles,
    QrCode,
    UtensilsCrossed,
    CalendarClock,
    ShoppingCart,
    AlertTriangle,
    ArrowRight,
    type LucideIcon,
} from "lucide-react";
import { platformApi, type PlatformOverview, type ExpiringSubscription } from "@/lib/platformApi";
import { cn } from "@/lib/utils";
import { TIER_ORDER, TIER_LABEL, TierBadge, formatInr, formatDate, daysUntil } from "./_components/tier";

export default function OverviewPage() {
    const [data, setData] = useState<PlatformOverview | null>(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        platformApi
            .getOverview()
            .then(setData)
            .catch((e: Error) => setError(e.message))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <LoadingSkeleton />;
    if (!data) return <p className="text-muted-foreground">Failed to load overview{error ? `: ${error}` : "."}</p>;

    const paidShare = data.hotels ? Math.round((data.billing.paidHotels / data.hotels) * 100) : 0;
    const viewedShare = data.hotels ? Math.round((data.menuViews.hotelsViewed7d / data.hotels) * 100) : 0;
    const needsAttention = data.billing.expired.length + data.billing.expiringSoon.length;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Platform Overview</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Free + Starter phase: who is live, who is paying, and whose menus guests are actually opening.
                </p>
            </div>

            {/* Headline tiles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <Tile
                    label="Hotels"
                    value={data.hotels}
                    hint={`${data.admins} admin account${data.admins === 1 ? "" : "s"}`}
                    icon={Building2}
                    tone="blue"
                />
                <Tile
                    label="Starter MRR"
                    value={formatInr(data.billing.mrrInr)}
                    hint={`${data.billing.paidHotels} paying · ${paidShare}% of hotels`}
                    icon={IndianRupee}
                    tone="emerald"
                />
                <Tile
                    label="Menu views · 7d"
                    value={data.menuViews.last7d.toLocaleString("en-IN")}
                    hint={`${data.menuViews.last30d.toLocaleString("en-IN")} in 30d · ${data.menuViews.hotelsViewed7d} hotels viewed (${viewedShare}%)`}
                    icon={Eye}
                    tone="cyan"
                />
                <Tile
                    label="New hotels · 7d"
                    value={data.newHotels7d}
                    hint={`${data.newHotels30d} in the last 30 days`}
                    icon={UserPlus}
                    tone="violet"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Tier breakdown */}
                <Card title="Hotels by tier" className="lg:col-span-1">
                    <ul className="space-y-2.5">
                        {TIER_ORDER.map((tier) => {
                            const count = data.byTier[tier] ?? 0;
                            const pct = data.hotels ? Math.round((count / data.hotels) * 100) : 0;
                            return (
                                <li key={tier} className="flex items-center gap-3">
                                    <TierBadge tier={tier} className="w-20 justify-center" />
                                    <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                                        <div className="h-full bg-primary/60 rounded-full" style={{ width: `${pct}%` }} />
                                    </div>
                                    <span className="text-sm tabular-nums w-14 text-right">
                                        {count} <span className="text-muted-foreground text-xs">({pct}%)</span>
                                    </span>
                                </li>
                            );
                        })}
                    </ul>
                    <Link href="/superadmin/hotels" className="mt-4 inline-flex items-center gap-1 text-xs text-primary hover:underline">
                        Open hotels list <ArrowRight className="w-3 h-3" />
                    </Link>
                </Card>

                {/* Onboarding funnel */}
                <Card title="Onboarding gaps" subtitle="Hotels that signed up but have not finished setting up">
                    <div className="grid grid-cols-2 gap-3">
                        <MiniStat icon={UtensilsCrossed} label="No menu items" value={data.onboarding.withoutMenu} tone={data.onboarding.withoutMenu ? "amber" : "muted"} />
                        <MiniStat icon={QrCode} label="QR never downloaded" value={data.onboarding.withoutQr} tone={data.onboarding.withoutQr ? "amber" : "muted"} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-4">
                        Target: register → scan menu → colours → QR in under 10 minutes. Call anyone stuck here.
                    </p>
                    <Link href="/superadmin/hotels?filter=needs-setup" className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline">
                        Show these hotels <ArrowRight className="w-3 h-3" />
                    </Link>
                </Card>

                {/* Billing follow-ups */}
                <Card
                    title="Renewals"
                    subtitle={`Paid plans expired or ending within ${data.billing.expiringSoonDays} days`}
                    badge={needsAttention ? <span className="text-xs font-medium text-amber-400">{needsAttention} to follow up</span> : undefined}
                >
                    {needsAttention === 0 ? (
                        <p className="text-sm text-muted-foreground">Nothing due. Record payments from each hotel&apos;s page.</p>
                    ) : (
                        <ul className="space-y-2">
                            {data.billing.expired.map((s) => <RenewalRow key={s.hotelId} sub={s} />)}
                            {data.billing.expiringSoon.map((s) => <RenewalRow key={s.hotelId} sub={s} />)}
                        </ul>
                    )}
                </Card>
            </div>

            {/* Secondary row: AI spend + ordering (kept compact; zero for view-only hotels) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <Tile
                    label="Gemini spend · 30d"
                    value={`$${data.ai.estimatedCostUsd30d.toFixed(2)}`}
                    hint={`${data.ai.calls30d} menu scan${data.ai.calls30d === 1 ? "" : "s"} · estimated from tokens`}
                    icon={Sparkles}
                    tone="pink"
                    href="/superadmin/analytics"
                />
                <Tile
                    label="Orders · all time"
                    value={data.ordering.totalOrders.toLocaleString("en-IN")}
                    hint={`${data.ordering.ordersToday} today · ${formatInr(data.ordering.totalRevenue)} GMV`}
                    icon={ShoppingCart}
                    tone="muted"
                />
                <Tile
                    label="Unresolved requests"
                    value={data.ordering.unresolvedComplaints}
                    hint="Service requests not resolved or rejected"
                    icon={AlertTriangle}
                    tone={data.ordering.unresolvedComplaints ? "red" : "muted"}
                    href="/superadmin/complaints"
                />
                <Tile
                    label="Paid tiers"
                    value={TIER_ORDER.filter((t) => t !== "FREE").map((t) => `${TIER_LABEL[t]} ${data.byTier[t] ?? 0}`).join(" · ")}
                    hint="Ordering tiers open once ~30 hotels are live and order taps pass 10% of views"
                    icon={CalendarClock}
                    tone="muted"
                    small
                />
            </div>
        </div>
    );
}

// ─── Pieces ────────────────────────────────────────────────

type Tone = "blue" | "emerald" | "cyan" | "violet" | "pink" | "amber" | "red" | "muted";

const TONE: Record<Tone, { icon: string; bg: string }> = {
    blue: { icon: "text-blue-500", bg: "bg-blue-500/10" },
    emerald: { icon: "text-emerald-500", bg: "bg-emerald-500/10" },
    cyan: { icon: "text-cyan-500", bg: "bg-cyan-500/10" },
    violet: { icon: "text-violet-500", bg: "bg-violet-500/10" },
    pink: { icon: "text-pink-500", bg: "bg-pink-500/10" },
    amber: { icon: "text-amber-500", bg: "bg-amber-500/10" },
    red: { icon: "text-red-500", bg: "bg-red-500/10" },
    muted: { icon: "text-muted-foreground", bg: "bg-secondary" },
};

function Tile({
    label,
    value,
    hint,
    icon: Icon,
    tone,
    href,
    small,
}: {
    label: string;
    value: string | number;
    hint?: string;
    icon: LucideIcon;
    tone: Tone;
    href?: string;
    small?: boolean;
}) {
    const body = (
        <>
            <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", TONE[tone].bg)}>
                    <Icon className={cn("w-[18px] h-[18px]", TONE[tone].icon)} />
                </div>
            </div>
            <p className={cn("font-bold tracking-tight", small ? "text-sm leading-snug" : "text-2xl")}>{value}</p>
            {hint && <p className="text-xs text-muted-foreground mt-1.5 leading-snug">{hint}</p>}
        </>
    );
    return href ? (
        <Link href={href} className="dashboard-card p-5 block hover:border-primary/40 transition">
            {body}
        </Link>
    ) : (
        <div className="dashboard-card p-5">{body}</div>
    );
}

function Card({
    title,
    subtitle,
    badge,
    className,
    children,
}: {
    title: string;
    subtitle?: string;
    badge?: React.ReactNode;
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <section className={cn("dashboard-card p-5", className)}>
            <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                    <h2 className="font-semibold">{title}</h2>
                    {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
                </div>
                {badge}
            </div>
            {children}
        </section>
    );
}

function MiniStat({ icon: Icon, label, value, tone }: { icon: LucideIcon; label: string; value: number; tone: Tone }) {
    return (
        <div className="rounded-lg border border-border/60 bg-secondary/30 p-3">
            <div className="flex items-center gap-2 text-muted-foreground">
                <Icon className={cn("w-3.5 h-3.5", TONE[tone].icon)} />
                <span className="text-[11px] uppercase tracking-wide">{label}</span>
            </div>
            <p className="text-xl font-bold mt-1">{value}</p>
        </div>
    );
}

function RenewalRow({ sub }: { sub: ExpiringSubscription }) {
    const days = daysUntil(sub.expiresAt) ?? 0;
    const expired = days < 0;
    return (
        <li>
            <Link
                href={`/superadmin/hotels/${sub.hotelId}`}
                className="flex items-center justify-between gap-3 rounded-lg px-2.5 py-2 -mx-2.5 hover:bg-secondary/60 transition"
            >
                <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{sub.hotelName}</p>
                    <p className="text-xs text-muted-foreground">
                        {TIER_LABEL[sub.tier]} · {expired ? "expired" : "ends"} {formatDate(sub.expiresAt)}
                    </p>
                </div>
                <span className={cn("text-xs font-medium whitespace-nowrap", expired ? "text-red-400" : "text-amber-400")}>
                    {expired ? `${Math.abs(days)}d overdue` : days === 0 ? "today" : `in ${days}d`}
                </span>
            </Link>
        </li>
    );
}

function LoadingSkeleton() {
    return (
        <div className="space-y-8">
            <div className="space-y-2">
                <div className="h-7 w-48 bg-secondary rounded-lg animate-pulse" />
                <div className="h-4 w-96 bg-secondary rounded-lg animate-pulse" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="dashboard-card p-5 space-y-3">
                        <div className="flex justify-between">
                            <div className="h-3 w-24 bg-secondary rounded animate-pulse" />
                            <div className="h-9 w-9 bg-secondary rounded-xl animate-pulse" />
                        </div>
                        <div className="h-7 w-20 bg-secondary rounded animate-pulse" />
                        <div className="h-3 w-32 bg-secondary rounded animate-pulse" />
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="dashboard-card p-5 h-52 animate-pulse" />
                ))}
            </div>
        </div>
    );
}
