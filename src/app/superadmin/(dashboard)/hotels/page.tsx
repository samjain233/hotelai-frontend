"use client";

import { useEffect, useState } from "react";
import { platformApi, PlatformHotel } from "@/lib/platformApi";
import { Building2, Search, Users, ShoppingCart, BedDouble, UtensilsCrossed, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function HotelsPage() {
    const [hotels, setHotels] = useState<PlatformHotel[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        platformApi
            .getHotels()
            .then(setHotels)
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const filtered = hotels.filter(
        (h) =>
            h.name.toLowerCase().includes(search.toLowerCase()) ||
            h.slug.toLowerCase().includes(search.toLowerCase()) ||
            (h.address || "").toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Hotels</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {hotels.length} hotel{hotels.length !== 1 ? "s" : ""} registered on the platform.
                    </p>
                </div>
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search hotels..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                    />
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="dashboard-card p-5 space-y-4">
                            <div className="h-5 w-40 bg-secondary rounded animate-pulse" />
                            <div className="h-3 w-56 bg-secondary rounded animate-pulse" />
                            <div className="grid grid-cols-4 gap-2">
                                {Array.from({ length: 4 }).map((_, j) => (
                                    <div key={j} className="h-10 bg-secondary rounded-lg animate-pulse" />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20">
                    <Building2 className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                    <p className="text-muted-foreground">
                        {search ? "No hotels match your search." : "No hotels registered yet."}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filtered.map((hotel) => (
                        <Link
                            key={hotel.id}
                            href={`/superadmin/hotels/${hotel.id}`}
                            className="dashboard-card p-5 group hover:border-primary/30 transition-all"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="min-w-0">
                                    <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                                        {hotel.name}
                                    </h3>
                                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                        {hotel.address || hotel.slug}
                                    </p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1 group-hover:text-primary transition-colors" />
                            </div>

                            <div className="grid grid-cols-4 gap-2 mt-4">
                                <MiniStat icon={Users} label="Staff" value={hotel._count.admins} />
                                <MiniStat icon={BedDouble} label="Rooms" value={hotel._count.rooms} />
                                <MiniStat icon={UtensilsCrossed} label="Items" value={hotel._count.menuItems} />
                                <MiniStat icon={ShoppingCart} label="Orders" value={hotel._count.orders} />
                            </div>

                            <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">Revenue</span>
                                <span className="text-sm font-semibold text-emerald-500">
                                    ₹{hotel.revenue.toLocaleString()}
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}

function MiniStat({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: number }) {
    return (
        <div className="text-center p-2 rounded-lg bg-secondary/40">
            <Icon className="w-3.5 h-3.5 mx-auto text-muted-foreground mb-1" />
            <p className="text-sm font-semibold">{value}</p>
            <p className="text-[10px] text-muted-foreground">{label}</p>
        </div>
    );
}
