"use client";

import { useState } from "react";
import Link from "next/link";
import { BarChart3, Clock, Eye, Lock, QrCode, TrendingUp } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useMenuAnalytics } from "@/hooks/useSwrApi";
import { hotelHasFeature, type MenuAnalytics, type MenuAnalyticsRange } from "@/lib/types";
import { cn } from "@/lib/utils";
import { AdminPageSkeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { DailyViewsChart, HourlyViewsChart } from "./MenuViewsCharts";
import { describeChange, formatDayLabel, formatHourRange, sampleAnalytics } from "./analyticsFormat";

const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_LEGAL_CONTACT_EMAIL;
const RANGES: { value: MenuAnalyticsRange; label: string }[] = [
    { value: 7, label: "7 days" },
    { value: 30, label: "30 days" },
];

export default function AnalyticsPage() {
    const { hotel, loading: authLoading } = useAuth();
    const unlocked = hotelHasFeature(hotel, "MENU_ANALYTICS");
    const [range, setRange] = useState<MenuAnalyticsRange>(7);
    const { data, error, isLoading } = useMenuAnalytics(range, unlocked);

    if (authLoading || (unlocked && isLoading && !data)) return <AdminPageSkeleton cardCount={4} />;

    return (
        <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-[env(safe-area-inset-bottom,0px)]">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div className="min-w-0">
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[28px]">Analytics</h1>
                    <p className="mt-1 text-sm text-muted-foreground">How often guests open your menu, and when.</p>
                </div>
                {unlocked && (
                    <div role="tablist" aria-label="Date range" className="inline-flex w-full rounded-xl border border-border bg-panel p-1 sm:w-auto">
                        {RANGES.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                role="tab"
                                aria-selected={range === option.value}
                                onClick={() => setRange(option.value)}
                                className={cn(
                                    "h-9 flex-1 cursor-pointer rounded-lg px-4 text-sm font-medium transition-colors sm:flex-none",
                                    range === option.value ? "bg-secondary text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                                )}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {!unlocked ? (
                <LockedPreview hotelName={hotel?.name} />
            ) : error ? (
                <EmptyState
                    icon={BarChart3}
                    title="Couldn't load analytics"
                    description={error instanceof Error ? error.message : "Please try again in a moment."}
                />
            ) : data ? (
                <AnalyticsBody data={data} />
            ) : null}
        </div>
    );
}

function AnalyticsBody({ data }: { data: MenuAnalytics }) {
    const { totals } = data;
    const change = data.rangeDays === 7 ? describeChange(totals.views, totals.previousViews) : null;

    return (
        <>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <StatTile
                    icon={Eye}
                    label="Menu views"
                    value={totals.views.toLocaleString("en-IN")}
                    hint={
                        change ? (
                            <span className={cn(change.tone === "up" && "text-emerald-600 dark:text-emerald-400", change.tone === "down" && "text-red-500")}>
                                {change.text}
                            </span>
                        ) : (
                            `Last ${data.rangeDays} days`
                        )
                    }
                />
                <StatTile icon={TrendingUp} label="Per day" value={totals.dailyAverage.toLocaleString("en-IN")} hint="Average opens per day" />
                <StatTile
                    icon={Clock}
                    label="Busiest hour"
                    value={totals.peakHour === null ? "—" : formatHourRange(totals.peakHour)}
                    hint={totals.peakHour === null ? "No views yet" : "When guests open the menu most"}
                />
                <StatTile
                    icon={BarChart3}
                    label="Busiest day"
                    value={totals.peakDay ? formatDayLabel(totals.peakDay.date) : "—"}
                    hint={totals.peakDay ? `${totals.peakDay.views} view${totals.peakDay.views === 1 ? "" : "s"}` : "No views yet"}
                />
            </div>

            {totals.views === 0 ? (
                <EmptyState
                    icon={QrCode}
                    title={`No menu views in the last ${data.rangeDays} days`}
                    description="Views are counted each time a guest opens your menu from a QR card. Print the cards and place one in every room to start seeing numbers here."
                    action={
                        <Link href="/rooms" className="inline-flex">
                            <Button variant="outline" className="h-10">
                                <QrCode className="mr-2 h-4 w-4" /> Rooms & QR cards
                            </Button>
                        </Link>
                    }
                />
            ) : (
                <div className="grid gap-4 xl:grid-cols-2">
                    <ChartCard title="Views by day" subtitle={`Last ${data.rangeDays} days`}>
                        <DailyViewsChart data={data} />
                    </ChartCard>
                    <ChartCard title="Views by hour" subtitle="Adds up every day in the range">
                        <HourlyViewsChart data={data} />
                    </ChartCard>
                </div>
            )}

            <p className="text-xs leading-relaxed text-muted-foreground">
                One view is counted per guest per visit, not per page refresh. Times are in {data.timezone.replace(/_/g, " ")}. Data is kept for{" "}
                {data.retentionDays} days.
            </p>
        </>
    );
}

/** Blurred sample dashboard behind an upgrade card for FREE hotels. */
function LockedPreview({ hotelName }: { hotelName?: string }) {
    const sample = sampleAnalytics();
    const subject = encodeURIComponent(`Upgrade to Starter${hotelName ? ` — ${hotelName}` : ""}`);
    const upgradeHref = SUPPORT_EMAIL ? `mailto:${SUPPORT_EMAIL}?subject=${subject}` : "/settings";

    return (
        <div className="relative">
            <div aria-hidden className="pointer-events-none select-none blur-[3px] opacity-70 [&_*]:!transition-none">
                <AnalyticsBody data={sample} />
            </div>
            <div className="absolute inset-0 flex items-start justify-center px-4 pt-10 sm:items-center sm:pt-0">
                <div className="w-full max-w-md rounded-2xl border border-border bg-panel p-6 shadow-2xl shadow-black/30 sm:p-7">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand/10 ring-1 ring-brand/25">
                        <Lock className="h-5 w-5 text-brand" aria-hidden />
                    </span>
                    <h2 className="mt-4 text-xl font-semibold tracking-tight text-foreground">Menu analytics is part of Starter</h2>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        See how many guests open your menu each day and which hours are busiest, so you know when to staff the kitchen and
                        which promotions land. Starter is ₹499/month or ₹4,999/year and also unlocks dish photos, your own colours and logo,
                        and removes DreamCanvas branding.
                    </p>
                    <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                        <a href={upgradeHref} className="inline-flex flex-1">
                            <Button className="h-11 w-full">Upgrade to Starter</Button>
                        </a>
                        <Link href="/menu" className="inline-flex flex-1">
                            <Button variant="outline" className="h-11 w-full">
                                Back to menu
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatTile({
    icon: Icon,
    label,
    value,
    hint,
}: {
    icon: typeof Eye;
    label: string;
    value: string;
    hint: React.ReactNode;
}) {
    return (
        <div className="rounded-2xl border border-border bg-panel p-5">
            <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
                <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />
            </div>
            <p className="mt-2 truncate text-3xl font-semibold tabular-nums text-foreground">{value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        </div>
    );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
    return (
        <section className="rounded-2xl border border-border bg-panel p-5">
            <div className="mb-4">
                <h2 className="font-semibold text-foreground">{title}</h2>
                <p className="text-xs text-muted-foreground">{subtitle}</p>
            </div>
            {children}
        </section>
    );
}
