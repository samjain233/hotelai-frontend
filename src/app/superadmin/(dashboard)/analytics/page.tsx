"use client";

import { useEffect, useState } from "react";
import { platformApi, PlatformAnalytics } from "@/lib/platformApi";
import { BarChart3, TrendingUp, Award, ShoppingBag } from "lucide-react";

export default function AnalyticsPage() {
    const [data, setData] = useState<PlatformAnalytics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        platformApi
            .getAnalytics()
            .then(setData)
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <LoadingSkeleton />;
    if (!data) return <p className="text-muted-foreground">Failed to load analytics.</p>;

    const maxOrders = Math.max(...data.dailyOrders.map((d) => d.orders), 1);
    const maxRevenue = Math.max(...data.dailyOrders.map((d) => d.revenue), 1);

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
                <p className="text-sm text-muted-foreground mt-1">Last 30 days performance across the platform.</p>
            </div>

            {/* Daily Orders Chart */}
            <div className="dashboard-card p-5">
                <div className="flex items-center gap-2 mb-6">
                    <BarChart3 className="w-[18px] h-[18px] text-blue-500" />
                    <h2 className="font-semibold">Daily Orders (30 days)</h2>
                </div>
                {data.dailyOrders.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-8 text-center">No order data in the last 30 days.</p>
                ) : (
                    <div className="space-y-4">
                        {/* Bar chart */}
                        <div className="flex items-end gap-[2px] h-40">
                            {data.dailyOrders.map((d) => (
                                <div key={d.date} className="flex-1 flex flex-col items-center group relative">
                                    <div className="absolute -top-8 bg-card border border-border rounded-lg px-2 py-1 text-[10px] text-foreground shadow-lg opacity-0 group-hover:opacity-100 transition pointer-events-none z-10 whitespace-nowrap">
                                        {d.date}: {d.orders} orders, ₹{d.revenue.toLocaleString()}
                                    </div>
                                    <div
                                        className="w-full bg-blue-500/80 rounded-t-sm hover:bg-blue-500 transition-colors min-h-[2px]"
                                        style={{ height: `${(d.orders / maxOrders) * 100}%` }}
                                    />
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between text-[10px] text-muted-foreground">
                            <span>{data.dailyOrders[0]?.date}</span>
                            <span>{data.dailyOrders[data.dailyOrders.length - 1]?.date}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Daily Revenue Chart */}
            <div className="dashboard-card p-5">
                <div className="flex items-center gap-2 mb-6">
                    <TrendingUp className="w-[18px] h-[18px] text-emerald-500" />
                    <h2 className="font-semibold">Daily Revenue (30 days)</h2>
                </div>
                {data.dailyOrders.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-8 text-center">No revenue data yet.</p>
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-end gap-[2px] h-40">
                            {data.dailyOrders.map((d) => (
                                <div key={d.date} className="flex-1 flex flex-col items-center group relative">
                                    <div className="absolute -top-8 bg-card border border-border rounded-lg px-2 py-1 text-[10px] text-foreground shadow-lg opacity-0 group-hover:opacity-100 transition pointer-events-none z-10 whitespace-nowrap">
                                        {d.date}: ₹{d.revenue.toLocaleString()}
                                    </div>
                                    <div
                                        className="w-full bg-emerald-500/80 rounded-t-sm hover:bg-emerald-500 transition-colors min-h-[2px]"
                                        style={{ height: `${(d.revenue / maxRevenue) * 100}%` }}
                                    />
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between text-[10px] text-muted-foreground">
                            <span>{data.dailyOrders[0]?.date}</span>
                            <span>{data.dailyOrders[data.dailyOrders.length - 1]?.date}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Top Hotels + Top Items side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Hotels by Revenue */}
                <div className="dashboard-card p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <Award className="w-[18px] h-[18px] text-amber-500" />
                        <h2 className="font-semibold">Top Hotels by Revenue</h2>
                    </div>
                    {data.topHotels.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-6">No data yet.</p>
                    ) : (
                        <div className="space-y-3">
                            {data.topHotels.map((h, idx) => {
                                const maxR = data.topHotels[0]?.revenue || 1;
                                return (
                                    <div key={h.hotelId} className="flex items-center gap-3">
                                        <span className="text-xs font-bold text-muted-foreground w-5 text-right">
                                            {idx + 1}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-baseline mb-1">
                                                <span className="text-sm font-medium truncate">{h.hotelName}</span>
                                                <span className="text-xs text-muted-foreground shrink-0 ml-2">
                                                    {h.orders} orders
                                                </span>
                                            </div>
                                            <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                                                <div
                                                    className="h-full bg-amber-500 rounded-full transition-all"
                                                    style={{ width: `${(h.revenue / maxR) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                        <span className="text-sm font-semibold text-emerald-500 shrink-0">
                                            ₹{h.revenue.toLocaleString()}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Top Menu Items */}
                <div className="dashboard-card p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <ShoppingBag className="w-[18px] h-[18px] text-pink-500" />
                        <h2 className="font-semibold">Most Ordered Items</h2>
                    </div>
                    {data.topItems.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-6">No data yet.</p>
                    ) : (
                        <div className="space-y-3">
                            {data.topItems.map((item, idx) => {
                                const maxQ = data.topItems[0]?.totalQty || 1;
                                return (
                                    <div key={item.itemName} className="flex items-center gap-3">
                                        <span className="text-xs font-bold text-muted-foreground w-5 text-right">
                                            {idx + 1}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-baseline mb-1">
                                                <span className="text-sm font-medium truncate">{item.itemName}</span>
                                            </div>
                                            <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                                                <div
                                                    className="h-full bg-pink-500 rounded-full transition-all"
                                                    style={{ width: `${(item.totalQty / maxQ) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                        <span className="text-sm font-semibold shrink-0">
                                            {item.totalQty}x
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function LoadingSkeleton() {
    return (
        <div className="space-y-8">
            <div className="space-y-2">
                <div className="h-7 w-36 bg-secondary rounded-lg animate-pulse" />
                <div className="h-4 w-64 bg-secondary rounded-lg animate-pulse" />
            </div>
            {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="dashboard-card p-5 h-56 animate-pulse bg-secondary/20" />
            ))}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="dashboard-card p-5 h-64 animate-pulse bg-secondary/20" />
                <div className="dashboard-card p-5 h-64 animate-pulse bg-secondary/20" />
            </div>
        </div>
    );
}
