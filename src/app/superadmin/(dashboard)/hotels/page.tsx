"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
    Building2,
    Search,
    Eye,
    UtensilsCrossed,
    QrCode,
    Clock,
    ChevronRight,
    ArrowUpDown,
} from "lucide-react";
import { platformApi, type PlatformHotel } from "@/lib/platformApi";
import type { SubscriptionTier } from "@/lib/types";
import { cn } from "@/lib/utils";
import { TIER_ORDER, TIER_LABEL, TierBadge, formatDate, formatRelative, daysUntil, isOlderThan } from "../_components/tier";

type QuickFilter = "all" | "paid" | "free" | "needs-setup" | "viewed-7d" | "quiet" | "renewals";
type SortKey = "newest" | "views7d" | "lastActive" | "name" | "items";

const QUICK_FILTERS: { id: QuickFilter; label: string; hint: string }[] = [
    { id: "all", label: "All", hint: "Every registered hotel" },
    { id: "paid", label: "Paying", hint: "Starter and above, active" },
    { id: "free", label: "Free", hint: "Free tier (including lapsed paid)" },
    { id: "needs-setup", label: "Needs setup", hint: "No menu items or QR never downloaded" },
    { id: "viewed-7d", label: "Viewed this week", hint: "At least one guest menu view in 7 days" },
    { id: "quiet", label: "Quiet", hint: "Set up, but no menu views in 30 days" },
    { id: "renewals", label: "Renewals", hint: "Paid plan expired or ending within 14 days" },
];

const SORTS: { id: SortKey; label: string }[] = [
    { id: "newest", label: "Newest" },
    { id: "views7d", label: "Most viewed (7d)" },
    { id: "lastActive", label: "Recently active" },
    { id: "items", label: "Most items" },
    { id: "name", label: "Name" },
];

function isSetUp(h: PlatformHotel): boolean {
    return h._count.menuItems > 0 && !!h.qrDownloadedAt;
}

function matchesFilter(h: PlatformHotel, f: QuickFilter): boolean {
    switch (f) {
        case "all":
            return true;
        case "paid":
            return h.tier !== "FREE";
        case "free":
            return h.tier === "FREE";
        case "needs-setup":
            return !isSetUp(h);
        case "viewed-7d":
            return h.menuViews7d > 0;
        case "quiet":
            return isSetUp(h) && h.menuViews30d === 0;
        case "renewals": {
            if (h.tier === "FREE") return false;
            const d = daysUntil(h.subscription?.expiresAt);
            return d !== null && d <= 14;
        }
    }
}

function sortHotels(list: PlatformHotel[], key: SortKey): PlatformHotel[] {
    const byTime = (a: string | null) => (a ? new Date(a).getTime() : 0);
    return [...list].sort((a, b) => {
        switch (key) {
            case "newest":
                return byTime(b.createdAt) - byTime(a.createdAt);
            case "views7d":
                return b.menuViews7d - a.menuViews7d || b.menuViews30d - a.menuViews30d;
            case "lastActive":
                return byTime(b.lastActiveAt) - byTime(a.lastActiveAt);
            case "items":
                return b._count.menuItems - a._count.menuItems;
            case "name":
                return a.name.localeCompare(b.name);
        }
    });
}

export default function HotelsPage() {
    return (
        <Suspense fallback={<HotelsSkeleton />}>
            <HotelsPageInner />
        </Suspense>
    );
}

function HotelsPageInner() {
    const router = useRouter();
    const params = useSearchParams();
    const [hotels, setHotels] = useState<PlatformHotel[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [tier, setTier] = useState<SubscriptionTier | "ALL">("ALL");
    const [sort, setSort] = useState<SortKey>("newest");

    const filterParam = params.get("filter");
    const filter: QuickFilter = QUICK_FILTERS.some((f) => f.id === filterParam) ? (filterParam as QuickFilter) : "all";

    useEffect(() => {
        platformApi
            .getHotels()
            .then(setHotels)
            .catch((e: Error) => setError(e.message))
            .finally(() => setLoading(false));
    }, []);

    const counts = useMemo(() => {
        const c = {} as Record<QuickFilter, number>;
        for (const f of QUICK_FILTERS) c[f.id] = hotels.filter((h) => matchesFilter(h, f.id)).length;
        return c;
    }, [hotels]);

    const visible = useMemo(() => {
        const q = search.trim().toLowerCase();
        const list = hotels.filter(
            (h) =>
                matchesFilter(h, filter) &&
                (tier === "ALL" || h.tier === tier) &&
                (!q || h.name.toLowerCase().includes(q) || h.slug.toLowerCase().includes(q) || (h.address || "").toLowerCase().includes(q)),
        );
        return sortHotels(list, sort);
    }, [hotels, filter, tier, search, sort]);

    function setFilter(next: QuickFilter) {
        const sp = new URLSearchParams(params.toString());
        if (next === "all") sp.delete("filter");
        else sp.set("filter", next);
        router.replace(`/superadmin/hotels${sp.size ? `?${sp}` : ""}`);
    }

    if (loading) return <HotelsSkeleton />;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Hotels</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {hotels.length} registered · {counts.paid} paying · {counts["needs-setup"]} still setting up
                    </p>
                </div>
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search name, slug, address"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                    />
                </div>
            </div>

            {/* Quick filters */}
            <div className="flex flex-wrap gap-2">
                {QUICK_FILTERS.map((f) => (
                    <button
                        key={f.id}
                        type="button"
                        onClick={() => setFilter(f.id)}
                        title={f.hint}
                        className={cn(
                            "px-3 py-1.5 rounded-full text-xs font-medium border transition",
                            filter === f.id
                                ? "bg-primary/10 text-primary border-primary/30"
                                : "bg-card text-muted-foreground border-border hover:text-foreground hover:bg-secondary",
                        )}
                    >
                        {f.label} <span className="opacity-60 tabular-nums">{counts[f.id]}</span>
                    </button>
                ))}
            </div>

            {/* Tier + sort */}
            <div className="flex flex-wrap items-center gap-3 text-sm">
                <label className="flex items-center gap-2 text-muted-foreground">
                    Tier
                    <select
                        value={tier}
                        onChange={(e) => setTier(e.target.value as SubscriptionTier | "ALL")}
                        className="px-2.5 py-1.5 rounded-lg border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    >
                        <option value="ALL">All tiers</option>
                        {TIER_ORDER.map((t) => (
                            <option key={t} value={t}>
                                {TIER_LABEL[t]}
                            </option>
                        ))}
                    </select>
                </label>
                <label className="flex items-center gap-2 text-muted-foreground">
                    <ArrowUpDown className="w-3.5 h-3.5" />
                    <select
                        value={sort}
                        onChange={(e) => setSort(e.target.value as SortKey)}
                        className="px-2.5 py-1.5 rounded-lg border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    >
                        {SORTS.map((s) => (
                            <option key={s.id} value={s.id}>
                                {s.label}
                            </option>
                        ))}
                    </select>
                </label>
                <span className="text-xs text-muted-foreground ml-auto">
                    {visible.length} shown
                </span>
            </div>

            {error ? (
                <p className="text-sm text-destructive">Could not load hotels: {error}</p>
            ) : visible.length === 0 ? (
                <div className="text-center py-20">
                    <Building2 className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                    <p className="text-muted-foreground">
                        {hotels.length === 0 ? "No hotels registered yet." : "No hotels match these filters."}
                    </p>
                </div>
            ) : (
                <div className="dashboard-card overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-secondary/40 text-[11px] uppercase tracking-wide text-muted-foreground">
                            <tr>
                                <th className="text-left font-medium px-4 py-3">Hotel</th>
                                <th className="text-left font-medium px-4 py-3">Tier</th>
                                <th className="text-right font-medium px-4 py-3">Views 7d / 30d</th>
                                <th className="text-right font-medium px-4 py-3">Items</th>
                                <th className="text-left font-medium px-4 py-3">Setup</th>
                                <th className="text-left font-medium px-4 py-3">Last active</th>
                                <th className="text-left font-medium px-4 py-3">Joined</th>
                                <th className="px-2 py-3" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                            {visible.map((h) => (
                                <HotelRow key={h.id} hotel={h} />
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

function HotelRow({ hotel: h }: { hotel: PlatformHotel }) {
    const href = `/superadmin/hotels/${h.id}`;
    const expiresIn = h.tier !== "FREE" ? daysUntil(h.subscription?.expiresAt) : null;
    const overCap = h.maxMenuItems !== null && h._count.menuItems > h.maxMenuItems;
    const stale = isOlderThan(h.lastActiveAt, 14);

    return (
        <tr className="hover:bg-secondary/30 transition">
            <td className="px-4 py-3">
                <Link href={href} className="block min-w-0">
                    <p className="font-medium text-foreground truncate hover:text-primary transition-colors">{h.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                        /{h.slug}
                        {h.address ? ` · ${h.address}` : ""}
                    </p>
                </Link>
            </td>
            <td className="px-4 py-3">
                <div className="flex flex-col items-start gap-1">
                    <TierBadge tier={h.tier} inactive={!!h.subscription && !h.subscription.isActive && h.subscription.tier !== "FREE"} />
                    {expiresIn !== null && (
                        <span className={cn("text-[11px]", expiresIn < 0 ? "text-red-400" : expiresIn <= 14 ? "text-amber-400" : "text-muted-foreground")}>
                            {expiresIn < 0 ? `expired ${formatDate(h.subscription?.expiresAt)}` : `ends ${formatDate(h.subscription?.expiresAt)}`}
                        </span>
                    )}
                </div>
            </td>
            <td className="px-4 py-3 text-right tabular-nums">
                <span className={cn("inline-flex items-center gap-1", h.menuViews7d === 0 && "text-muted-foreground")}>
                    <Eye className="w-3.5 h-3.5 opacity-60" />
                    {h.menuViews7d.toLocaleString("en-IN")}
                    <span className="text-muted-foreground"> / {h.menuViews30d.toLocaleString("en-IN")}</span>
                </span>
            </td>
            <td className="px-4 py-3 text-right tabular-nums">
                <span className={cn(overCap && "text-amber-400 font-medium")} title={overCap ? "Over the Free-tier cap" : undefined}>
                    {h._count.menuItems}
                    {h.maxMenuItems !== null && <span className="text-muted-foreground"> / {h.maxMenuItems}</span>}
                </span>
                <p className="text-[11px] text-muted-foreground">{h._count.categories} cat · {h._count.rooms} rooms</p>
            </td>
            <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                    <SetupFlag ok={h._count.menuItems > 0} icon={UtensilsCrossed} label={h._count.menuItems > 0 ? "Menu added" : "No menu yet"} />
                    <SetupFlag ok={!!h.qrDownloadedAt} icon={QrCode} label={h.qrDownloadedAt ? `QR downloaded ${formatDate(h.qrDownloadedAt)}` : "QR not downloaded"} />
                </div>
            </td>
            <td className="px-4 py-3">
                <span className={cn("inline-flex items-center gap-1.5 text-xs", stale ? "text-muted-foreground" : "text-foreground")} title={h.lastActiveAt ? new Date(h.lastActiveAt).toLocaleString("en-IN") : "No admin sign-in recorded"}>
                    <Clock className="w-3.5 h-3.5 opacity-60" />
                    {formatRelative(h.lastActiveAt)}
                </span>
            </td>
            <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{formatDate(h.createdAt)}</td>
            <td className="px-2 py-3">
                <Link href={href} aria-label={`Open ${h.name}`} className="text-muted-foreground hover:text-primary transition">
                    <ChevronRight className="w-4 h-4" />
                </Link>
            </td>
        </tr>
    );
}

function SetupFlag({ ok, icon: Icon, label }: { ok: boolean; icon: typeof QrCode; label: string }) {
    return (
        <span
            title={label}
            className={cn(
                "inline-flex items-center justify-center w-7 h-7 rounded-md border",
                ok ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-amber-500/10 border-amber-500/20 text-amber-400",
            )}
        >
            <Icon className="w-3.5 h-3.5" />
            <span className="sr-only">{label}</span>
        </span>
    );
}

function HotelsSkeleton() {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <div className="h-7 w-32 bg-secondary rounded-lg animate-pulse" />
                <div className="h-4 w-72 bg-secondary rounded-lg animate-pulse" />
            </div>
            <div className="flex gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-7 w-24 bg-secondary rounded-full animate-pulse" />
                ))}
            </div>
            <div className="dashboard-card p-4 space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-12 bg-secondary rounded-lg animate-pulse" />
                ))}
            </div>
        </div>
    );
}
