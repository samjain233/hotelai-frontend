"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Order, OrderStatus } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { AnimatePresence, motion } from "framer-motion";
import {
    ClipboardList,
    CheckCircle,
    ChefHat,
    Clock,
    Truck,
    XCircle,
    Search,
    Filter
} from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_ICONS: Record<string, any> = {
    PLACED: ClipboardList,
    CONFIRMED: CheckCircle,
    PREPARING: ChefHat,
    READY: Clock,
    DELIVERED: Truck,
    CANCELLED: XCircle,
};

const nextAction: Record<string, { label: string; status: string }> = {
    PLACED: { label: "Confirm Order", status: "CONFIRMED" },
    CONFIRMED: { label: "Start Cooking", status: "PREPARING" },
    PREPARING: { label: "Mark Ready", status: "READY" },
    READY: { label: "Mark Delivered", status: "DELIVERED" },
};

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<OrderStatus | "ALL">("ALL");
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    useEffect(() => { loadOrders(); }, []);

    async function loadOrders() {
        try { const data = await api.getOrders(); setOrders(data); }
        catch (err) { console.error(err); }
        finally { setLoading(false); }
    }

    async function updateStatus(id: string, newStatus: string) {
        setUpdatingId(id);
        try { await api.updateOrderStatus(id, newStatus); await loadOrders(); }
        catch (err: any) { alert(err.message); }
        finally { setUpdatingId(null); }
    }

    const filteredOrders = filter === "ALL" ? orders : orders.filter((o) => o.status === filter);

    if (loading) return (
        <div className="flex items-center justify-center py-32">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Orders</h1>
                    <p className="text-muted-foreground mt-1">Manage guest orders and fulfillment pipeline</p>
                </div>

                {/* Search & Filter Bar */}
                <div className="flex gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search orders..."
                            className="bg-secondary/50 border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary w-64"
                        />
                    </div>
                    <Button variant="outline">
                        <Filter className="w-4 h-4 mr-2" /> Filter
                    </Button>
                </div>
            </div>

            {/* Filter Tabs - Scrollable Container */}
            <div className="border-b border-border overflow-x-auto pb-1">
                <div className="flex gap-6 min-w-max">
                    {["ALL", "PLACED", "CONFIRMED", "PREPARING", "READY", "DELIVERED", "CANCELLED"].map((s) => (
                        <button
                            key={s}
                            onClick={() => setFilter(s as any)}
                            className={cn(
                                "text-sm font-medium pb-3 border-b-2 transition-colors flex items-center gap-2",
                                filter === s
                                    ? "border-primary text-primary"
                                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                            )}
                        >
                            {s.charAt(0) + s.slice(1).toLowerCase()}
                            <span className={cn(
                                "text-[10px] px-1.5 py-0.5 rounded-full",
                                filter === s ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
                            )}>
                                {s === "ALL" ? orders.length : orders.filter(o => o.status === s).length}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Orders List */}
            <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                    {filteredOrders.length === 0 ? (
                        <div className="dashboard-card py-20 flex flex-col items-center text-center">
                            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
                                <ClipboardList className="w-8 h-8 text-muted-foreground/50" />
                            </div>
                            <h3 className="text-lg font-medium text-foreground">No orders found</h3>
                            <p className="text-muted-foreground mt-1 max-w-sm">
                                There are no orders matching the selected status currently.
                            </p>
                        </div>
                    ) : (
                        filteredOrders.map((order) => {
                            const StatusIcon = STATUS_ICONS[order.status] || ClipboardList;
                            return (
                                <motion.div
                                    key={order.id}
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.98 }}
                                    className="dashboard-card p-5 group cursor-pointer hover:border-primary/30 transition-colors"
                                    onClick={() => setSelectedOrder(order)}
                                >
                                    <div className="flex flex-col lg:flex-row gap-6 lg:items-center">

                                        {/* Left: ID & Time */}
                                        <div className="flex items-start gap-4 min-w-[200px]">
                                            <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 transition-colors">
                                                <span className="font-bold text-lg">#{order.orderNumber}</span>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-semibold text-foreground">Room {order.room?.number}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    {new Date(order.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}, {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Middle: Items */}
                                        <div className="flex-1 border-l border-border pl-6 py-1">
                                            <div className="flex flex-wrap gap-2 mb-2">
                                                {order.items.map((item) => (
                                                    <div key={item.id} className="inline-flex items-center px-2.5 py-1 rounded-md text-sm bg-secondary border border-border">
                                                        <span className="font-semibold text-primary mr-1.5">{item.quantity}×</span>
                                                        <span className="text-foreground">{item.itemName}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            {order.notes && (
                                                <p className="text-xs text-amber-500 flex items-center gap-1.5 mt-2">
                                                    <span className="uppercase font-bold tracking-wider text-[10px]">Note</span>
                                                    {order.notes}
                                                </p>
                                            )}
                                        </div>

                                        {/* Right: Actions & Total */}
                                        <div className="flex items-center gap-6 pl-6 lg:border-l border-border min-w-[240px] justify-end">
                                            <div className="text-right">
                                                <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">Total</div>
                                                <div className="text-xl font-bold text-foreground">₹{order.totalAmount}</div>
                                            </div>

                                            <div className="flex flex-col gap-2 min-w-[120px]">
                                                {nextAction[order.status] && (
                                                    <Button
                                                        size="sm"
                                                        loading={updatingId === order.id}
                                                        onClick={() => updateStatus(order.id, nextAction[order.status].status)}
                                                        className="w-full"
                                                    >
                                                        {nextAction[order.status].label}
                                                    </Button>
                                                )}
                                                {order.status === "PLACED" && (
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        loading={updatingId === order.id}
                                                        onClick={() => updateStatus(order.id, "CANCELLED")}
                                                        className="w-full"
                                                    >
                                                        Reject
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer / Status Bar */}
                                    <div className="mt-4 pt-4 border-t border-border flex justify-between items-center">
                                        <Badge status={order.status} />
                                        <span className="text-xs text-muted-foreground font-mono">ID: {order.id}</span>
                                    </div>
                                </motion.div>
                            );
                        })
                    )}
                </AnimatePresence>
            </div>

            {/* Order Detail Modal */}
            <AnimatePresence>
                {selectedOrder && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedOrder(null)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
                        >
                            {/* Modal Header */}
                            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-secondary/20">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                        <span className="font-bold text-primary">#{selectedOrder.orderNumber}</span>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-foreground">Order Details</h3>
                                        <p className="text-xs text-muted-foreground">
                                            {new Date(selectedOrder.createdAt).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} at {new Date(selectedOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedOrder(null)} className="p-2 rounded-full bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                                    <XCircle className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                                {/* Status & Room Row */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Badge status={selectedOrder.status} />
                                        {selectedOrder.updatedAt !== selectedOrder.createdAt && (
                                            <span className="text-xs text-muted-foreground">Updated {new Date(selectedOrder.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        )}
                                    </div>
                                    <div className="text-sm text-muted-foreground flex items-center gap-1.5">
                                        <span className="font-medium text-foreground">Room {selectedOrder.room?.number}</span>
                                        {selectedOrder.room?.floor && <span>· Floor {selectedOrder.room.floor}</span>}
                                    </div>
                                </div>

                                {/* Guest Info */}
                                {(selectedOrder.guestName || selectedOrder.guestPhone) && (
                                    <div className="bg-secondary/30 rounded-xl p-4 border border-border">
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Guest Information</p>
                                        {selectedOrder.guestName && <p className="text-sm text-foreground font-medium">{selectedOrder.guestName}</p>}
                                        {selectedOrder.guestPhone && <p className="text-xs text-muted-foreground mt-0.5">{selectedOrder.guestPhone}</p>}
                                    </div>
                                )}

                                {/* Items */}
                                <div>
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Items Ordered</p>
                                    <div className="space-y-3">
                                        {selectedOrder.items.map(item => (
                                            <div key={item.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                                                <div className="flex items-center gap-3">
                                                    <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">{item.quantity}×</span>
                                                    <div>
                                                        <p className="text-sm font-medium text-foreground">{item.itemName}</p>
                                                        <p className="text-xs text-muted-foreground">₹{item.price} each</p>
                                                    </div>
                                                </div>
                                                <span className="font-semibold text-foreground">₹{item.price * item.quantity}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Notes */}
                                {selectedOrder.notes && (
                                    <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
                                        <p className="text-xs font-semibold text-amber-500 uppercase tracking-wider mb-1">Special Notes</p>
                                        <p className="text-sm text-foreground">{selectedOrder.notes}</p>
                                    </div>
                                )}

                                {/* Order ID */}
                                <p className="text-xs text-muted-foreground font-mono">Order ID: {selectedOrder.id}</p>
                            </div>

                            {/* Modal Footer */}
                            <div className="px-6 py-4 border-t border-border bg-secondary/20">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-sm text-muted-foreground font-medium">Total Amount</span>
                                    <span className="text-2xl font-bold text-foreground">₹{selectedOrder.totalAmount}</span>
                                </div>
                                {nextAction[selectedOrder.status] && (
                                    <div className="flex gap-2">
                                        <Button
                                            loading={updatingId === selectedOrder.id}
                                            onClick={() => { updateStatus(selectedOrder.id, nextAction[selectedOrder.status].status); setSelectedOrder(null); }}
                                            className="flex-1"
                                        >
                                            {nextAction[selectedOrder.status].label}
                                        </Button>
                                        {selectedOrder.status === "PLACED" && (
                                            <Button
                                                variant="destructive"
                                                loading={updatingId === selectedOrder.id}
                                                onClick={() => { updateStatus(selectedOrder.id, "CANCELLED"); setSelectedOrder(null); }}
                                            >
                                                Reject
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

function Badge({ status }: { status: string }) {
    const styles = {
        PLACED: "bg-blue-500/10 text-blue-500 border-blue-500/20",
        CONFIRMED: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
        PREPARING: "bg-amber-500/10 text-amber-500 border-amber-500/20",
        READY: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
        DELIVERED: "bg-secondary text-muted-foreground border-border",
        CANCELLED: "bg-red-500/10 text-red-500 border-red-500/20",
    }[status] || "bg-secondary text-muted-foreground border-border";

    return (
        <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-medium border uppercase tracking-wide", styles)}>
            {status}
        </span>
    );
}
