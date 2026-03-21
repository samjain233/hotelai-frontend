"use client";

import { useEffect, useState } from "react";
import { platformApi, PlatformOverview } from "@/lib/platformApi";
import {
    Building2,
    Users,
    ShoppingCart,
    DollarSign,
    AlertTriangle,
    Headset,
    TrendingUp,
    Package,
} from "lucide-react";

export default function OverviewPage() {
    const [data, setData] = useState<PlatformOverview | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        platformApi
            .getOverview()
            .then(setData)
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <LoadingSkeleton />;
    if (!data) return <p className="text-muted-foreground">Failed to load overview.</p>;

    const stats = [
        { label: "Total Hotels", value: data.hotels, icon: Building2, color: "text-blue-500", bg: "bg-blue-500/10" },
        { label: "Total Admins", value: data.admins, icon: Users, color: "text-violet-500", bg: "bg-violet-500/10" },
        { label: "Total Orders", value: data.totalOrders.toLocaleString(), icon: ShoppingCart, color: "text-emerald-500", bg: "bg-emerald-500/10" },
        { label: "Total Revenue", value: `₹${data.totalRevenue.toLocaleString()}`, icon: DollarSign, color: "text-amber-500", bg: "bg-amber-500/10" },
        { label: "Orders Today", value: data.ordersToday.toLocaleString(), icon: TrendingUp, color: "text-cyan-500", bg: "bg-cyan-500/10" },
        { label: "Revenue Today", value: `₹${data.revenueToday.toLocaleString()}`, icon: Package, color: "text-pink-500", bg: "bg-pink-500/10" },
        { label: "Service Requests", value: data.serviceRequests, icon: Headset, color: "text-orange-500", bg: "bg-orange-500/10" },
        { label: "Unresolved Issues", value: data.unresolvedComplaints, icon: AlertTriangle, color: "text-red-500", bg: "bg-red-500/10" },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Platform Overview</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    All-time metrics across every hotel on the platform.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((s) => (
                    <div key={s.label} className="dashboard-card p-5">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                {s.label}
                            </span>
                            <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center`}>
                                <s.icon className={`w-[18px] h-[18px] ${s.color}`} />
                            </div>
                        </div>
                        <p className="text-2xl font-bold tracking-tight">{s.value}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

function LoadingSkeleton() {
    return (
        <div className="space-y-8">
            <div className="space-y-2">
                <div className="h-7 w-48 bg-secondary rounded-lg animate-pulse" />
                <div className="h-4 w-72 bg-secondary rounded-lg animate-pulse" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="dashboard-card p-5 space-y-3">
                        <div className="flex justify-between">
                            <div className="h-3 w-24 bg-secondary rounded animate-pulse" />
                            <div className="h-9 w-9 bg-secondary rounded-xl animate-pulse" />
                        </div>
                        <div className="h-7 w-20 bg-secondary rounded animate-pulse" />
                    </div>
                ))}
            </div>
        </div>
    );
}
