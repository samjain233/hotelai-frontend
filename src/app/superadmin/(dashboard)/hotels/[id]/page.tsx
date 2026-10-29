"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import {
    ArrowLeft,
    ExternalLink,
    Building2,
    Users,
    BedDouble,
    UtensilsCrossed,
    Tag,
    Eye,
    QrCode,
    Clock,
    MapPin,
    Phone,
    Globe,
    type LucideIcon,
} from "lucide-react";
import { platformApi, type PlatformHotelDetail } from "@/lib/platformApi";
import { cn } from "@/lib/utils";
import { TierBadge, formatDate, formatRelative } from "../../_components/tier";
import { SubscriptionCard } from "./SubscriptionCard";
import { AiUsageSection } from "./AiUsageSection";
import { Section, StaffTable, RecentOrdersTable, RecentRequestsList } from "./ActivitySections";

export default function HotelDetailPage() {
    const { id } = useParams<{ id: string }>();
    const [hotel, setHotel] = useState<PlatformHotelDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [enteringHotel, setEnteringHotel] = useState(false);

    useEffect(() => {
        if (!id) return;
        platformApi
            .getHotelDetail(id)
            .then(setHotel)
            .catch((e: Error) => setError(e.message))
            .finally(() => setLoading(false));
    }, [id]);

    async function openDashboard() {
        if (!hotel) return;
        setEnteringHotel(true);
        try {
            await platformApi.enterHotelAsAdmin(hotel.id);
            window.location.href = "/dashboard";
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Could not open hotel dashboard");
            setEnteringHotel(false);
        }
    }

    if (loading) return <DetailSkeleton />;

    if (!hotel) {
        return (
            <div className="text-center py-20">
                <Building2 className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-muted-foreground">{error ? `Could not load hotel: ${error}` : "Hotel not found."}</p>
                <Link href="/superadmin/hotels" className="mt-4 inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
                    <ArrowLeft className="w-4 h-4" /> All hotels
                </Link>
            </div>
        );
    }

    const overCap = hotel.maxMenuItems !== null && hotel._count.menuItems > hotel.maxMenuItems;
    const stats: { label: string; value: string; sub?: string; icon: LucideIcon; tone: string; warn?: boolean }[] = [
        {
            label: "Menu views",
            value: hotel.menuViews7d.toLocaleString("en-IN"),
            sub: `last 7d · ${hotel.menuViews30d.toLocaleString("en-IN")} in 30d`,
            icon: Eye,
            tone: "text-cyan-500 bg-cyan-500/10",
        },
        {
            label: "Menu items",
            value: hotel.maxMenuItems !== null ? `${hotel._count.menuItems} / ${hotel.maxMenuItems}` : String(hotel._count.menuItems),
            sub: `${hotel._count.categories} categor${hotel._count.categories === 1 ? "y" : "ies"} · ${hotel.guestMenuTemplate} template`,
            icon: UtensilsCrossed,
            tone: "text-orange-500 bg-orange-500/10",
            warn: overCap,
        },
        {
            label: "Room QR",
            value: hotel.qrDownloadedAt ? "Downloaded" : "Not yet",
            sub: hotel.qrDownloadedAt ? `first on ${formatDate(hotel.qrDownloadedAt)}` : `${hotel._count.rooms} room${hotel._count.rooms === 1 ? "" : "s"} created`,
            icon: QrCode,
            tone: hotel.qrDownloadedAt ? "text-emerald-500 bg-emerald-500/10" : "text-amber-500 bg-amber-500/10",
        },
        { label: "Rooms", value: String(hotel._count.rooms), icon: BedDouble, tone: "text-blue-500 bg-blue-500/10" },
        { label: "Staff", value: String(hotel._count.admins), icon: Users, tone: "text-violet-500 bg-violet-500/10" },
        {
            label: "Orders",
            value: hotel._count.orders.toLocaleString("en-IN"),
            sub: hotel.revenue ? `₹${hotel.revenue.toLocaleString("en-IN")} GMV` : "view-only tier",
            icon: Tag,
            tone: "text-muted-foreground bg-secondary",
        },
    ];

    return (
        <div className="space-y-8">
            <Link href="/superadmin/hotels" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-4 h-4" />
                All hotels
            </Link>

            {/* Header */}
            <div>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                            <h1 className="text-2xl font-bold tracking-tight">{hotel.name}</h1>
                            <TierBadge tier={hotel.tier} inactive={!!hotel.subscription && !hotel.subscription.isActive && hotel.subscription.tier !== "FREE"} />
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
                            <a href={`/menu/${hotel.slug}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-foreground transition">
                                <Globe className="w-3.5 h-3.5" />/menu/{hotel.slug}
                            </a>
                            {hotel.address && (
                                <span className="flex items-center gap-1">
                                    <MapPin className="w-3.5 h-3.5" />
                                    {hotel.address}
                                </span>
                            )}
                            {hotel.phone && (
                                <span className="flex items-center gap-1">
                                    <Phone className="w-3.5 h-3.5" />
                                    {hotel.phone}
                                </span>
                            )}
                            {(hotel.openTime || hotel.closeTime) && (
                                <span className="flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5" />
                                    {hotel.openTime || "?"} – {hotel.closeTime || "?"}
                                </span>
                            )}
                            <span>Joined {formatDate(hotel.createdAt)} ({formatRelative(hotel.createdAt)})</span>
                        </div>
                    </div>
                    <button
                        type="button"
                        disabled={enteringHotel}
                        onClick={openDashboard}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors shrink-0"
                    >
                        <ExternalLink className="w-4 h-4" />
                        {enteringHotel ? "Opening…" : "Open hotel dashboard"}
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
                {stats.map((s) => (
                    <div key={s.label} className="dashboard-card p-4">
                        <div className="flex items-start gap-3">
                            <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", s.tone)}>
                                <s.icon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                                <p className={cn("text-lg font-bold leading-tight", s.warn && "text-amber-400")} title={s.warn ? "Over the Free-tier item cap" : undefined}>
                                    {s.value}
                                </p>
                                <p className="text-[11px] text-muted-foreground">{s.label}</p>
                                {s.sub && <p className="text-[11px] text-muted-foreground/80 truncate">{s.sub}</p>}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <SubscriptionCard
                hotelId={hotel.id}
                hotelName={hotel.name}
                subscription={hotel.subscription}
                onSaved={(subscription) =>
                    setHotel((h) => (h ? { ...h, subscription, tier: subscription.isActive ? subscription.tier : "FREE" } : h))
                }
            />

            <Section title="AI usage (Gemini)" subtitle="Menu photo scans; cost estimated from token counts">
                <AiUsageSection usage={hotel.aiUsage} />
            </Section>

            <Section title="Staff">
                <StaffTable admins={hotel.admins} />
            </Section>

            <Section title="Recent orders">
                <RecentOrdersTable orders={hotel.recentOrders} />
            </Section>

            <Section title="Recent service requests">
                <RecentRequestsList requests={hotel.recentComplaints} />
            </Section>
        </div>
    );
}

function DetailSkeleton() {
    return (
        <div className="space-y-6">
            <div className="h-5 w-24 bg-secondary rounded animate-pulse" />
            <div className="h-8 w-64 bg-secondary rounded animate-pulse" />
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="dashboard-card p-4 h-20 animate-pulse bg-secondary/30" />
                ))}
            </div>
            <div className="dashboard-card p-5 h-40 animate-pulse bg-secondary/30" />
        </div>
    );
}
