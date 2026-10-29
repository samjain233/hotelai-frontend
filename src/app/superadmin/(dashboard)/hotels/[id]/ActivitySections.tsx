"use client";

import type { PlatformHotelDetail } from "@/lib/platformApi";
import { formatDate } from "../../_components/tier";

export function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
    return (
        <section className="dashboard-card p-5">
            <div className="mb-4">
                <h2 className="text-base font-semibold">{title}</h2>
                {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
            </div>
            {children}
        </section>
    );
}

export function StaffTable({ admins }: { admins: PlatformHotelDetail["admins"] }) {
    if (admins.length === 0) return <p className="text-sm text-muted-foreground">No staff yet.</p>;
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-border text-left text-muted-foreground">
                        <th className="pb-2 font-medium">Name</th>
                        <th className="pb-2 font-medium">Email</th>
                        <th className="pb-2 font-medium">Role</th>
                        <th className="pb-2 font-medium text-right">Added</th>
                    </tr>
                </thead>
                <tbody>
                    {admins.map((a) => (
                        <tr key={a.id} className="border-b border-border/50 table-row-hover">
                            <td className="py-2.5">{a.name}</td>
                            <td className="py-2.5 text-muted-foreground">{a.email}</td>
                            <td className="py-2.5">
                                <span className="text-xs px-2 py-0.5 rounded-full bg-secondary border border-border">{a.role}</span>
                            </td>
                            <td className="py-2.5 text-right text-xs text-muted-foreground">{formatDate(a.createdAt)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export function RecentOrdersTable({ orders }: { orders: PlatformHotelDetail["recentOrders"] }) {
    if (orders.length === 0) return <p className="text-sm text-muted-foreground">No orders. Expected for view-only tiers.</p>;
    return (
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
                    {orders.map((o) => (
                        <tr key={o.id} className="border-b border-border/50 table-row-hover">
                            <td className="py-2.5 font-medium">#{o.orderNumber}</td>
                            <td className="py-2.5 text-muted-foreground">{o.room?.number ?? "—"}</td>
                            <td className="py-2.5">
                                <StatusBadge status={o.status} />
                            </td>
                            <td className="py-2.5 text-right">₹{Number(o.totalAmount).toLocaleString("en-IN")}</td>
                            <td className="py-2.5 text-right text-muted-foreground text-xs">{formatDate(o.createdAt)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export function RecentRequestsList({ requests }: { requests: PlatformHotelDetail["recentComplaints"] }) {
    if (requests.length === 0) return <p className="text-sm text-muted-foreground">No service requests yet.</p>;
    return (
        <div className="space-y-3">
            {requests.map((c) => (
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
                    <span className="text-[10px] text-muted-foreground shrink-0">{formatDate(c.createdAt)}</span>
                </div>
            ))}
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
    return <span className={`text-[10px] font-medium ${colors[priority] || "text-muted-foreground"}`}>{priority}</span>;
}
