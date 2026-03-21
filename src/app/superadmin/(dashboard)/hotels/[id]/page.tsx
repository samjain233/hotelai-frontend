"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { platformApi, PlatformHotelDetail } from "@/lib/platformApi";
import {
    ArrowLeft,
    Building2,
    Users,
    BedDouble,
    ShoppingCart,
    UtensilsCrossed,
    Tag,
    Headset,
    DollarSign,
    Clock,
    MapPin,
    Phone,
} from "lucide-react";

export default function HotelDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const [hotel, setHotel] = useState<PlatformHotelDetail | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        platformApi
            .getHotelDetail(id)
            .then(setHotel)
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-6 w-24 bg-secondary rounded animate-pulse" />
                <div className="h-8 w-64 bg-secondary rounded animate-pulse" />
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="dashboard-card p-4 h-20 animate-pulse bg-secondary/30" />
                    ))}
                </div>
            </div>
        );
    }

    if (!hotel) {
        return (
            <div className="text-center py-20">
                <Building2 className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-muted-foreground">Hotel not found.</p>
            </div>
        );
    }

    const counts = [
        { label: "Staff", value: hotel._count.admins, icon: Users, color: "text-violet-500", bg: "bg-violet-500/10" },
        { label: "Rooms", value: hotel._count.rooms, icon: BedDouble, color: "text-blue-500", bg: "bg-blue-500/10" },
        { label: "Menu Items", value: hotel._count.menuItems, icon: UtensilsCrossed, color: "text-orange-500", bg: "bg-orange-500/10" },
        { label: "Categories", value: hotel._count.categories, icon: Tag, color: "text-pink-500", bg: "bg-pink-500/10" },
        { label: "Orders", value: hotel._count.orders, icon: ShoppingCart, color: "text-emerald-500", bg: "bg-emerald-500/10" },
        { label: "Service Reqs", value: hotel._count.serviceRequests, icon: Headset, color: "text-cyan-500", bg: "bg-cyan-500/10" },
        { label: "Revenue", value: `₹${hotel.revenue.toLocaleString()}`, icon: DollarSign, color: "text-amber-500", bg: "bg-amber-500/10" },
    ];

    return (
        <div className="space-y-8">
            {/* Back */}
            <button
                onClick={() => router.push("/superadmin/hotels")}
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                All Hotels
            </button>

            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight">{hotel.name}</h1>
                <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
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
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {counts.map((s) => (
                    <div key={s.label} className="dashboard-card p-4">
                        <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>
                                <s.icon className={`w-4 h-4 ${s.color}`} />
                            </div>
                            <div>
                                <p className="text-lg font-bold">{s.value}</p>
                                <p className="text-[11px] text-muted-foreground">{s.label}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Staff */}
            <Section title="Staff">
                {hotel.admins.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No staff yet.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border text-left text-muted-foreground">
                                    <th className="pb-2 font-medium">Name</th>
                                    <th className="pb-2 font-medium">Email</th>
                                    <th className="pb-2 font-medium">Role</th>
                                </tr>
                            </thead>
                            <tbody>
                                {hotel.admins.map((a) => (
                                    <tr key={a.id} className="border-b border-border/50 table-row-hover">
                                        <td className="py-2.5">{a.name}</td>
                                        <td className="py-2.5 text-muted-foreground">{a.email}</td>
                                        <td className="py-2.5">
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-secondary border border-border">
                                                {a.role}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Section>

            {/* Recent Orders */}
            <Section title="Recent Orders">
                {hotel.recentOrders.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No orders yet.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border text-left text-muted-foreground">
                                    <th className="pb-2 font-medium">#</th>
                                    <th className="pb-2 font-medium">Room</th>
                                    <th className="pb-2 font-medium">Status</th>
                                    <th className="pb-2 font-medium text-right">Amount</th>
                                    <th className="pb-2 font-medium text-right">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {hotel.recentOrders.map((o) => (
                                    <tr key={o.id} className="border-b border-border/50 table-row-hover">
                                        <td className="py-2.5 font-medium">#{o.orderNumber}</td>
                                        <td className="py-2.5 text-muted-foreground">{o.room?.number ?? "—"}</td>
                                        <td className="py-2.5">
                                            <StatusBadge status={o.status} />
                                        </td>
                                        <td className="py-2.5 text-right">₹{o.totalAmount}</td>
                                        <td className="py-2.5 text-right text-muted-foreground text-xs">
                                            {new Date(o.createdAt).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Section>

            {/* Recent Complaints */}
            <Section title="Recent Service Requests">
                {hotel.recentComplaints.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No service requests yet.</p>
                ) : (
                    <div className="space-y-3">
                        {hotel.recentComplaints.map((c) => (
                            <div key={c.id} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 border border-border/50">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <StatusBadge status={c.status} />
                                        <PriorityBadge priority={c.priority} />
                                        <span className="text-xs text-muted-foreground">{c.type}</span>
                                        {c.room && <span className="text-xs text-muted-foreground">Room {c.room.number}</span>}
                                    </div>
                                    <p className="text-sm mt-1 text-foreground line-clamp-2">{c.description}</p>
                                </div>
                                <span className="text-[10px] text-muted-foreground shrink-0">
                                    {new Date(c.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </Section>
        </div>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="dashboard-card p-5">
            <h2 className="text-base font-semibold mb-4">{title}</h2>
            {children}
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const colors: Record<string, string> = {
        PLACED: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
        CONFIRMED: "bg-blue-500/10 text-blue-600 border-blue-500/20",
        PREPARING: "bg-orange-500/10 text-orange-600 border-orange-500/20",
        READY: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
        DELIVERED: "bg-green-500/10 text-green-600 border-green-500/20",
        CANCELLED: "bg-red-500/10 text-red-600 border-red-500/20",
        SUBMITTED: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
        ACKNOWLEDGED: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
        IN_PROGRESS: "bg-blue-500/10 text-blue-600 border-blue-500/20",
        RESOLVED: "bg-green-500/10 text-green-600 border-green-500/20",
        REJECTED: "bg-red-500/10 text-red-600 border-red-500/20",
    };
    return (
        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${colors[status] || "bg-secondary text-muted-foreground border-border"}`}>
            {status}
        </span>
    );
}

function PriorityBadge({ priority }: { priority: string }) {
    const colors: Record<string, string> = {
        LOW: "text-muted-foreground",
        NORMAL: "text-yellow-600",
        HIGH: "text-orange-600",
        URGENT: "text-red-600",
    };
    return (
        <span className={`text-[10px] font-medium ${colors[priority] || "text-muted-foreground"}`}>
            {priority}
        </span>
    );
}
