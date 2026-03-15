"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Order, ServiceRequest } from "@/lib/types";
import { useActivityStreamAdmin } from "@/hooks/useActivityStream";
import { Bell, ClipboardList, Headset, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function NotificationsDropdown() {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [orders, setOrders] = useState<Order[]>([]);
    const [requests, setRequests] = useState<ServiceRequest[]>([]);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const loadNotifications = useCallback(async () => {
        try {
            const [ordersRes, requestsRes] = await Promise.all([
                api.getOrders("PLACED"),
                api.getServiceRequests(undefined, "SUBMITTED"),
            ]);
            setOrders(ordersRes);
            setRequests(requestsRes);
        } catch (err) {
            console.error("Failed to load notifications", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useActivityStreamAdmin({
        onOrderNew: useCallback((order: Order) => {
            if (order.status === "PLACED") {
                setOrders((prev) => (prev.some((o) => o.id === order.id) ? prev : [order, ...prev]));
            }
        }, []),
        onOrderUpdated: useCallback((order: Order) => {
            setOrders((prev) => (order.status === "PLACED" ? prev.map((o) => (o.id === order.id ? order : o)) : prev.filter((o) => o.id !== order.id)));
        }, []),
        onServiceRequestNew: useCallback((req: ServiceRequest) => {
            if (req.status === "SUBMITTED") {
                setRequests((prev) => (prev.some((r) => r.id === req.id) ? prev : [req, ...prev]));
            }
        }, []),
        onServiceRequestUpdated: useCallback((req: ServiceRequest) => {
            setRequests((prev) => (req.status === "SUBMITTED" ? prev.map((r) => (r.id === req.id ? req : r)) : prev.filter((r) => r.id !== req.id)));
        }, []),
    });

    useEffect(() => {
        loadNotifications();
    }, [loadNotifications]);

    useEffect(() => {
        if (open) {
            setLoading(true);
            loadNotifications();
        }
    }, [open, loadNotifications]);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const count = orders.length + requests.length;

    function formatTime(iso: string) {
        const ms = Date.now() - new Date(iso).getTime();
        if (ms < 60000) return "Just now";
        if (ms < 3600000) return `${Math.floor(ms / 60000)}m ago`;
        if (ms < 86400000) return `${Math.floor(ms / 3600000)}h ago`;
        return `${Math.floor(ms / 86400000)}d ago`;
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setOpen((o) => !o)}
                className="relative p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary"
                aria-label="Notifications"
            >
                <Bell className="w-5 h-5" />
                {count > 0 && (
                    <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-bold text-white bg-primary rounded-full ring-2 ring-background">
                        {count > 99 ? "99+" : count}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute top-full right-0 mt-2 w-[360px] max-h-[400px] overflow-hidden bg-card border border-border rounded-xl shadow-xl z-50 flex flex-col">
                    <div className="px-4 py-3 border-b border-border bg-secondary/30">
                        <h3 className="font-semibold text-foreground text-sm">Notifications</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            New orders and service requests
                        </p>
                    </div>

                    <div className="overflow-y-auto flex-1 max-h-[320px]">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : count === 0 ? (
                            <div className="py-12 text-center text-muted-foreground text-sm">
                                No new notifications
                            </div>
                        ) : (
                            <div className="divide-y divide-border">
                                {orders.map((order) => (
                                    <button
                                        key={order.id}
                                        onClick={() => {
                                            setOpen(false);
                                            router.push("/orders");
                                        }}
                                        className="w-full px-4 py-3 flex items-start gap-3 hover:bg-secondary/50 transition-colors text-left"
                                    >
                                        <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                                            <ClipboardList className="w-4 h-4 text-blue-500" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-foreground">
                                                New order #{order.orderNumber}
                                            </p>
                                            <p className="text-xs text-muted-foreground truncate">
                                                Room {order.room?.number || "—"} · ₹
                                                {order.totalAmount.toLocaleString()}
                                            </p>
                                            <p className="text-[11px] text-muted-foreground/80 mt-0.5">
                                                {formatTime(order.createdAt)}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                                {requests.map((req) => (
                                    <button
                                        key={req.id}
                                        onClick={() => {
                                            setOpen(false);
                                            router.push("/services");
                                        }}
                                        className="w-full px-4 py-3 flex items-start gap-3 hover:bg-secondary/50 transition-colors text-left"
                                    >
                                        <div
                                            className={cn(
                                                "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0",
                                                req.priority === "URGENT" || req.priority === "HIGH"
                                                    ? "bg-amber-500/10"
                                                    : "bg-indigo-500/10"
                                            )}
                                        >
                                            <Headset
                                                className={cn(
                                                    "w-4 h-4",
                                                    req.priority === "URGENT" || req.priority === "HIGH"
                                                        ? "text-amber-500"
                                                        : "text-indigo-500"
                                                )}
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-foreground">
                                                {req.type.replace("_", " ")} request
                                            </p>
                                            <p className="text-xs text-muted-foreground truncate">
                                                {req.category}
                                                {req.room ? ` · Room ${req.room.number}` : ""}
                                            </p>
                                            <p className="text-[11px] text-muted-foreground/80 mt-0.5">
                                                {formatTime(req.createdAt)}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {count > 0 && !loading && (
                        <div className="px-4 py-2 border-t border-border bg-secondary/20 flex gap-2">
                            <button
                                onClick={() => {
                                    setOpen(false);
                                    router.push("/orders");
                                }}
                                className="flex-1 text-xs font-medium text-primary hover:underline py-1.5"
                            >
                                View Orders
                            </button>
                            <button
                                onClick={() => {
                                    setOpen(false);
                                    router.push("/services");
                                }}
                                className="flex-1 text-xs font-medium text-primary hover:underline py-1.5"
                            >
                                View Services
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
