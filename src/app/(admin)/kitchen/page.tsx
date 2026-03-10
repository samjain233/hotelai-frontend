"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { api } from "@/lib/api";
import { Order } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { motion, AnimatePresence } from "framer-motion";
import {
    ClipboardList,
    CheckCircle,
    ChefHat,
    Clock,
    RefreshCw,
    Maximize,
    Minimize,
    Volume2,
    VolumeX,
    AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { OrdersSkeleton } from "@/components/ui/Skeleton";

// ─── Config ───────────────────────────────────────────
const REFRESH_INTERVAL = 8000; // 8 seconds
const URGENCY_WARN_MINS = 10;  // Yellow after 10 min
const URGENCY_DANGER_MINS = 20; // Red after 20 min

const COLUMNS = [
    { status: "PLACED", title: "New Orders", icon: ClipboardList, color: "bg-blue-500", border: "border-l-blue-500", headerBg: "bg-blue-500/10", actionLabel: "Confirm", nextStatus: "CONFIRMED" },
    { status: "CONFIRMED", title: "Confirmed", icon: CheckCircle, color: "bg-indigo-500", border: "border-l-indigo-500", headerBg: "bg-indigo-500/10", actionLabel: "Start Cooking", nextStatus: "PREPARING" },
    { status: "PREPARING", title: "Cooking", icon: ChefHat, color: "bg-amber-500", border: "border-l-amber-500", headerBg: "bg-amber-500/10", actionLabel: "Mark Ready", nextStatus: "READY" },
    { status: "READY", title: "Ready to Serve", icon: Clock, color: "bg-emerald-500", border: "border-l-emerald-500", headerBg: "bg-emerald-500/10", actionLabel: "Complete", nextStatus: "DELIVERED" },
];

export default function KitchenPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [currentTime, setCurrentTime] = useState(Date.now());

    const prevPlacedIdsRef = useRef<Set<string>>(new Set());
    const containerRef = useRef<HTMLDivElement>(null);

    // ─── Live Clock (updates every second for live timers) ───
    useEffect(() => {
        const interval = setInterval(() => setCurrentTime(Date.now()), 1000);
        return () => clearInterval(interval);
    }, []);

    // ─── Notification Sound (double ding for urgency) ───
    const playNotificationSound = useCallback(() => {
        if (!soundEnabled) return;
        try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContext) return;
            const ctx = new AudioContext();

            // First ding
            const osc1 = ctx.createOscillator();
            const gain1 = ctx.createGain();
            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(880, ctx.currentTime);
            gain1.gain.setValueAtTime(0.6, ctx.currentTime);
            gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
            osc1.connect(gain1);
            gain1.connect(ctx.destination);
            osc1.start(ctx.currentTime);
            osc1.stop(ctx.currentTime + 0.5);

            // Second ding (slightly higher, 200ms later)
            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(1100, ctx.currentTime + 0.2);
            gain2.gain.setValueAtTime(0.6, ctx.currentTime + 0.2);
            gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.7);
            osc2.connect(gain2);
            gain2.connect(ctx.destination);
            osc2.start(ctx.currentTime + 0.2);
            osc2.stop(ctx.currentTime + 0.7);
        } catch (e) {
            console.error("Audio play failed:", e);
        }
    }, [soundEnabled]);

    // ─── Data Fetching ───
    const loadOrders = useCallback(async () => {
        try {
            const data = await api.getOrders();
            const active = data.filter((o) => ["PLACED", "CONFIRMED", "PREPARING", "READY"].includes(o.status));
            setOrders(active);

            // Detect new PLACED orders for sound alert
            const currentPlacedIds = new Set(active.filter(o => o.status === "PLACED").map(o => o.id));
            if (prevPlacedIdsRef.current.size > 0) {
                const hasNew = [...currentPlacedIds].some(id => !prevPlacedIdsRef.current.has(id));
                if (hasNew) playNotificationSound();
            }
            prevPlacedIdsRef.current = currentPlacedIds;
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    }, [playNotificationSound]);

    useEffect(() => {
        loadOrders();
        const interval = setInterval(loadOrders, REFRESH_INTERVAL);
        return () => clearInterval(interval);
    }, [loadOrders]);

    // ─── Status Transition ───
    async function moveForward(order: Order, nextStatus: string) {
        setUpdatingId(order.id);
        try {
            await api.updateOrderStatus(order.id, nextStatus);
            await loadOrders();
        }
        catch (err: any) { alert(err.message); }
        finally { setUpdatingId(null); }
    }

    // ─── Fullscreen Toggle ───
    function toggleFullscreen() {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    }

    useEffect(() => {
        function onFsChange() {
            setIsFullscreen(!!document.fullscreenElement);
        }
        document.addEventListener('fullscreenchange', onFsChange);
        return () => document.removeEventListener('fullscreenchange', onFsChange);
    }, []);

    // ─── Helpers ───
    function getElapsedMinutes(dateStr: string) {
        return Math.floor((currentTime - new Date(dateStr).getTime()) / 60000);
    }

    function formatElapsed(dateStr: string) {
        const mins = getElapsedMinutes(dateStr);
        if (mins < 1) return "Just now";
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        if (h > 0) return `${h}h ${m}m`;
        return `${m}m`;
    }

    function getUrgencyColor(dateStr: string) {
        const mins = getElapsedMinutes(dateStr);
        if (mins >= URGENCY_DANGER_MINS) return "text-red-400 bg-red-500/10";
        if (mins >= URGENCY_WARN_MINS) return "text-amber-400 bg-amber-500/10";
        return "text-emerald-400 bg-emerald-500/10";
    }

    function getUrgencyBorder(dateStr: string) {
        const mins = getElapsedMinutes(dateStr);
        if (mins >= URGENCY_DANGER_MINS) return "ring-2 ring-red-500/30";
        if (mins >= URGENCY_WARN_MINS) return "ring-1 ring-amber-500/20";
        return "";
    }

    if (loading) return <OrdersSkeleton />;

    const totalActive = orders.length;

    return (
        <div ref={containerRef} className={cn("flex flex-col gap-4", isFullscreen ? "h-screen bg-background p-6" : "h-[calc(100vh-6rem)]")}>
            {/* Header Bar */}
            <div className="flex justify-between items-center flex-shrink-0">
                <div className="flex items-center gap-4">
                    <div>
                        <h1 className={cn("font-bold tracking-tight text-foreground", isFullscreen ? "text-3xl" : "text-2xl")}>
                            🔥 Kitchen Display
                        </h1>
                        <p className="text-muted-foreground mt-0.5 text-sm">
                            {totalActive} active order{totalActive !== 1 ? "s" : ""} · Auto-refreshes every {REFRESH_INTERVAL / 1000}s
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Live Clock */}
                    <div className="hidden sm:flex items-center gap-2 bg-secondary/50 border border-border rounded-lg px-3 py-1.5 text-sm font-mono text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        {new Date(currentTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </div>

                    <Button variant="outline" size="sm" onClick={() => setSoundEnabled(!soundEnabled)} title={soundEnabled ? "Mute alerts" : "Enable alerts"}>
                        {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    </Button>

                    <Button variant="outline" size="sm" onClick={loadOrders}>
                        <RefreshCw className="w-4 h-4" />
                    </Button>

                    <Button variant="outline" size="sm" onClick={toggleFullscreen} title={isFullscreen ? "Exit fullscreen" : "TV Mode"}>
                        {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                    </Button>
                </div>
            </div>

            {/* Kanban Board */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-hidden">
                {COLUMNS.map((col) => {
                    const colOrders = orders.filter((o) => o.status === col.status);
                    const Icon = col.icon;

                    return (
                        <div key={col.status} className="flex flex-col h-full bg-secondary/20 rounded-xl border border-border overflow-hidden">
                            {/* Column Header */}
                            <div className={cn("px-4 py-3 border-b border-border flex justify-between items-center", col.headerBg)}>
                                <div className="flex items-center gap-2">
                                    <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", col.color)}>
                                        <Icon className="w-4 h-4 text-foreground" />
                                    </div>
                                    <span className={cn("font-bold text-foreground", isFullscreen ? "text-lg" : "text-sm")}>{col.title}</span>
                                </div>
                                <span className={cn(
                                    "font-bold rounded-full flex items-center justify-center",
                                    isFullscreen ? "text-base w-8 h-8" : "text-xs w-6 h-6",
                                    colOrders.length > 0 ? "bg-primary text-primary-foreground shadow-sm" : "bg-secondary text-muted-foreground border border-border"
                                )}>
                                    {colOrders.length}
                                </span>
                            </div>

                            {/* Orders List — Scrollable */}
                            <div className="flex-1 overflow-y-auto p-3 space-y-3">
                                <AnimatePresence>
                                    {colOrders.length === 0 && (
                                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground/30">
                                            <Icon className={cn(isFullscreen ? "w-12 h-12" : "w-8 h-8", "mb-2")} />
                                            <p className="text-xs">No orders</p>
                                        </div>
                                    )}
                                    {colOrders.map((order) => {
                                        const elapsed = getElapsedMinutes(order.createdAt);
                                        const urgencyColor = getUrgencyColor(order.createdAt);
                                        const urgencyBorder = getUrgencyBorder(order.createdAt);

                                        return (
                                            <motion.div
                                                layout
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, x: 50 }}
                                                key={order.id}
                                                className={cn(
                                                    "bg-card border-l-4 rounded-r-lg p-4 shadow-sm",
                                                    col.border,
                                                    urgencyBorder,
                                                    elapsed >= URGENCY_DANGER_MINS && "animate-pulse"
                                                )}
                                            >
                                                {/* Order Header */}
                                                <div className="flex justify-between items-center mb-3">
                                                    <span className={cn("font-bold text-foreground", isFullscreen ? "text-2xl" : "text-lg")}>
                                                        #{order.orderNumber}
                                                    </span>
                                                    <div className={cn("flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold", urgencyColor)}>
                                                        {elapsed >= URGENCY_DANGER_MINS && <AlertTriangle className="w-3 h-3" />}
                                                        <Clock className="w-3 h-3" />
                                                        {formatElapsed(order.createdAt)}
                                                    </div>
                                                </div>

                                                {/* Room Badge */}
                                                <div className="mb-3">
                                                    <span className={cn("inline-block bg-secondary/80 rounded-lg px-2.5 py-1 font-semibold text-foreground", isFullscreen ? "text-sm" : "text-xs")}>
                                                        🏨 Room {order.room?.number}
                                                    </span>
                                                </div>

                                                {/* Items */}
                                                <div className="space-y-1.5 mb-3">
                                                    {order.items.map((item) => (
                                                        <div key={item.id} className="flex justify-between items-center">
                                                            <span className={cn("text-muted-foreground", isFullscreen ? "text-base" : "text-sm")}>{item.itemName}</span>
                                                            <span className={cn("font-bold text-foreground bg-secondary rounded px-1.5 py-0.5", isFullscreen ? "text-base" : "text-sm")}>
                                                                ×{item.quantity}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Notes */}
                                                {order.notes && (
                                                    <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-2.5 mb-3 flex items-start gap-2">
                                                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                                                        <p className={cn("text-amber-400 italic", isFullscreen ? "text-sm" : "text-xs")}>
                                                            {order.notes}
                                                        </p>
                                                    </div>
                                                )}

                                                {/* Action Button */}
                                                <Button
                                                    className={cn("w-full font-bold", isFullscreen ? "h-12 text-base" : "h-9 text-sm")}
                                                    size="sm"
                                                    disabled={updatingId === order.id}
                                                    loading={updatingId === order.id}
                                                    onClick={() => moveForward(order, col.nextStatus)}
                                                    variant={col.status === 'READY' ? 'primary' : 'secondary'}
                                                >
                                                    {col.actionLabel} →
                                                </Button>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
