"use client";

import type { ComponentType } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { Order } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { useEffect, useState } from "react";
import {
    DollarSign,
    ShoppingBag,
    Utensils,
    Users,
    ArrowRight,
    BedDouble
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AdminPageSkeleton } from "@/components/ui/Skeleton";
import { ENABLE_ORDERING_ADMIN_NAV } from "@/lib/adminNavConfig";

export default function DashboardPage() {
    const { hotel } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [stats, setStats] = useState({ revenue: 0, activeOrders: 0, totalItems: 0, occupancy: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                if (ENABLE_ORDERING_ADMIN_NAV) {
                    const [o, c, r] = await Promise.all([api.getOrders(), api.getCategories(), api.getRooms()]);
                    setOrders(o);
                    const revenue = o.filter(x => x.status !== 'CANCELLED').reduce((acc, curr) => acc + curr.totalAmount, 0);
                    const active = o.filter(x => ['PLACED', 'CONFIRMED', 'PREPARING'].includes(x.status)).length;
                    const items = c.reduce((acc, curr) => acc + (curr._count?.items || 0), 0);
                    setStats({ revenue, activeOrders: active, totalItems: items, occupancy: r.length });
                } else {
                    const [c, r] = await Promise.all([api.getCategories(), api.getRooms()]);
                    setOrders([]);
                    const items = c.reduce((acc, curr) => acc + (curr._count?.items || 0), 0);
                    setStats({ revenue: 0, activeOrders: 0, totalItems: items, occupancy: r.length });
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    if (loading) return <AdminPageSkeleton cardCount={4} />;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header / Title Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
                    <p className="text-muted-foreground mt-1">
                        Overview of {hotel?.name || "your hotel"}&apos;s performance today.
                    </p>
                </div>
                {ENABLE_ORDERING_ADMIN_NAV && (
                    <div className="flex gap-3">
                        <Button variant="outline">View Reports</Button>
                        <Button>
                            <ShoppingBag className="w-4 h-4 mr-2" />
                            New Order
                        </Button>
                    </div>
                )}
            </div>

            {/* 
               STAT CARDS
               Clean, solid cards with subtle borders. 
               Icon on left, Value big, Label muted.
               Similar to the "Linear" / Reference style.
            */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Revenue"
                    value={`₹${stats.revenue.toLocaleString()}`}
                    icon={DollarSign}
                    trend="+12.5%"
                    disabled={!ENABLE_ORDERING_ADMIN_NAV}
                />
                <StatCard
                    title="Active Orders"
                    value={stats.activeOrders.toString()}
                    icon={ShoppingBag}
                    trend="+2"
                    active
                    disabled={!ENABLE_ORDERING_ADMIN_NAV}
                />
                <StatCard
                    title="Menu Items"
                    value={stats.totalItems.toString()}
                    icon={Utensils}
                />
                <StatCard
                    title="Total Rooms"
                    value={stats.occupancy.toString()}
                    icon={Users}
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* RECENT ORDERS (Takes up 2 columns) */}
                <div
                    className={cn(
                        "lg:col-span-2 space-y-4",
                        !ENABLE_ORDERING_ADMIN_NAV && "opacity-45 pointer-events-none select-none",
                    )}
                    aria-disabled={!ENABLE_ORDERING_ADMIN_NAV}
                >
                    <div className="flex items-center justify-between gap-2">
                        <div>
                            <h2 className="text-lg font-semibold text-foreground">Recent Orders</h2>
                            {!ENABLE_ORDERING_ADMIN_NAV && (
                                <p className="text-xs text-muted-foreground mt-0.5">Available when ordering is enabled</p>
                            )}
                        </div>
                        {ENABLE_ORDERING_ADMIN_NAV && (
                            <Button variant="ghost" size="sm" className="text-primary hover:text-primary shrink-0">
                                View All <ArrowRight className="w-4 h-4 ml-1" />
                            </Button>
                        )}
                    </div>

                    <div className="dashboard-card overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-muted-foreground uppercase tracking-wider bg-secondary border-b border-border">
                                    <tr>
                                        <th className="px-6 py-4 font-medium">Order ID</th>
                                        <th className="px-6 py-4 font-medium">Room</th>
                                        <th className="px-6 py-4 font-medium">Status</th>
                                        <th className="px-6 py-4 font-medium text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {orders.slice(0, 5).map((order) => (
                                        <tr key={order.id} className="table-row-hover group cursor-pointer transition-colors">
                                            <td className="px-6 py-4 font-medium text-foreground">
                                                #{order.orderNumber}
                                            </td>
                                            <td className="px-6 py-4 text-muted-foreground">
                                                Room {order.room?.number || "N/A"}
                                            </td>
                                            <td className="px-6 py-4">
                                                <StatusBadge status={order.status} />
                                            </td>
                                            <td className="px-6 py-4 text-right font-medium text-foreground">
                                                ₹{order.totalAmount}
                                            </td>
                                        </tr>
                                    ))}
                                    {orders.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                                                No recent orders found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* QUICK ACTIONS / SIDE PANEL */}
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-foreground">Quick Actions</h2>
                    <div className="dashboard-card p-4 space-y-2">
                        <ActionRow
                            icon={Utensils}
                            title="Update Menu"
                            subtitle="Add items or change prices"
                            href="/menu"
                        />
                        <ActionRow
                            icon={BedDouble}
                            title="Manage Rooms"
                            subtitle="Print QR codes"
                            href="/rooms"
                        />
                        <ActionRow
                            icon={Users}
                            title="Staff & Access"
                            subtitle="Manage permissions"
                            href="/staff"
                            disabled={!ENABLE_ORDERING_ADMIN_NAV}
                        />
                    </div>

                    <div className="dashboard-card p-6 bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20">
                        <h3 className="font-semibold text-emerald-600 dark:text-emerald-400 mb-1">System Status</h3>
                        <div className="flex items-center gap-2 text-sm text-emerald-600/80 dark:text-emerald-400/80">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                            </span>
                            All systems operational
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ----------------------------------------------------------------------
// Sub-components for cleaner file
// ----------------------------------------------------------------------

function StatCard({
    title,
    value,
    icon: Icon,
    trend,
    active,
    disabled,
}: {
    title: string;
    value: string;
    icon: ComponentType<{ className?: string }>;
    trend?: string;
    active?: boolean;
    disabled?: boolean;
}) {
    return (
        <div
            className={cn(
                "dashboard-card p-6 flex flex-col justify-between h-32 relative overflow-hidden group",
                active && !disabled && "border-primary/30 bg-primary/5 shadow-[inset_0_0_20px_rgba(99,102,241,0.05)]",
                disabled && "opacity-45 pointer-events-none select-none",
            )}
            aria-disabled={disabled}
        >
            <div className="flex justify-between items-start">
                <div className="p-2.5 rounded-lg bg-secondary border border-border text-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    <Icon className="w-4 h-4" />
                </div>
                {trend && !disabled && (
                    <span className="text-xs font-semibold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                        {trend}
                    </span>
                )}
            </div>
            <div>
                <p className="text-sm font-medium text-muted-foreground">{title}</p>
                <div className="text-2xl font-bold text-foreground mt-1 tracking-tight">{value}</div>
                {disabled && (
                    <p className="text-[11px] text-muted-foreground mt-1">Ordering not active</p>
                )}
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const styles = {
        PLACED: "bg-blue-500/10 text-blue-500",
        CONFIRMED: "bg-indigo-500/10 text-indigo-500",
        PREPARING: "bg-amber-500/10 text-amber-500",
        READY: "bg-emerald-500/10 text-emerald-500",
        CANCELLED: "bg-red-500/10 text-red-500",
    }[status] || "bg-zinc-500/10 text-zinc-500";

    return (
        <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", styles)}>
            {status}
        </span>
    );
}

function ActionRow({
    icon: Icon,
    title,
    subtitle,
    href,
    disabled,
}: {
    icon: ComponentType<{ className?: string }>;
    title: string;
    subtitle: string;
    href: string;
    disabled?: boolean;
}) {
    const className = cn(
        "flex items-center gap-4 p-3 rounded-xl transition-colors group",
        disabled
            ? "opacity-45 cursor-not-allowed pointer-events-none select-none"
            : "hover:bg-secondary",
    );
    const inner = (
        <>
            <div
                className={cn(
                    "w-10 h-10 rounded-full bg-secondary border border-border flex items-center justify-center text-muted-foreground transition-all",
                    !disabled && "group-hover:text-primary group-hover:bg-primary/10 group-hover:border-primary/20",
                )}
            >
                <Icon className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">{title}</p>
                <p className="text-xs text-muted-foreground">{subtitle}</p>
                {disabled && (
                    <p className="text-[11px] text-muted-foreground/80 mt-0.5">Available when ordering is enabled</p>
                )}
            </div>
            {!disabled && (
                <ArrowRight className="w-4 h-4 ml-auto text-muted-foreground group-hover:text-foreground opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1 shrink-0" />
            )}
        </>
    );
    if (disabled) {
        return (
            <div className={className} aria-disabled="true">
                {inner}
            </div>
        );
    }
    return (
        <a href={href} className={className}>
            {inner}
        </a>
    );
}
