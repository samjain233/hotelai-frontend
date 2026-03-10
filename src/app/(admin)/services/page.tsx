"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { api, API_URL } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { ServiceRequest } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import {
    AlertTriangle,
    Bed,
    Sparkles,
    CheckCircle,
    Clock,
    Eye,
    Play,
    XCircle,
    MessageSquare,
    RefreshCw,
    Wifi,
    WifiOff,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const TYPE_TABS = [
    { key: "", label: "All", icon: MessageSquare },
    { key: "COMPLAINT", label: "Complaints", icon: AlertTriangle },
    { key: "ROOM_SERVICE", label: "Room Service", icon: Bed },
    { key: "HOUSEKEEPING", label: "Housekeeping", icon: Sparkles },
];

const STATUS_CONFIG: Record<string, { color: string; bg: string; border: string }> = {
    SUBMITTED: { color: "text-blue-400", bg: "bg-blue-500/10", border: "border-l-blue-500" },
    ACKNOWLEDGED: { color: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-l-indigo-500" },
    IN_PROGRESS: { color: "text-amber-400", bg: "bg-amber-500/10", border: "border-l-amber-500" },
    RESOLVED: { color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-l-emerald-500" },
    REJECTED: { color: "text-red-400", bg: "bg-red-500/10", border: "border-l-red-500" },
};

const PRIORITY_COLORS: Record<string, string> = {
    LOW: "text-muted-foreground bg-secondary",
    NORMAL: "text-blue-500 bg-blue-500/10",
    HIGH: "text-amber-500 bg-amber-500/10",
    URGENT: "text-red-500 bg-red-500/10",
};

const TYPE_ICONS: Record<string, typeof AlertTriangle> = {
    COMPLAINT: AlertTriangle,
    ROOM_SERVICE: Bed,
    HOUSEKEEPING: Sparkles,
};

// ─── Audio Alert ─────────────────────────────────────────
function playAlertSound(priority: string) {
    try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        // URGENT = two quick high beeps, HIGH = one medium beep
        const freq = priority === "URGENT" ? 880 : 660;
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(freq, ctx.currentTime);

        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.4);

        if (priority === "URGENT") {
            const o2 = ctx.createOscillator();
            const g2 = ctx.createGain();
            o2.connect(g2);
            g2.connect(ctx.destination);
            o2.type = "sine";
            o2.frequency.setValueAtTime(1046, ctx.currentTime + 0.5);
            g2.gain.setValueAtTime(0.3, ctx.currentTime + 0.5);
            g2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.9);
            o2.start(ctx.currentTime + 0.5);
            o2.stop(ctx.currentTime + 0.9);
        }
    } catch (e) {
        // Audio not supported — silently ignore
    }
}

export default function AdminServicesPage() {
    const { hotel } = useAuth();
    const [requests, setRequests] = useState<ServiceRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [typeFilter, setTypeFilter] = useState("");
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [isLive, setIsLive] = useState(false);
    const socketRef = useRef<Socket | null>(null);

    const loadRequests = useCallback(async () => {
        try {
            const data = await api.getServiceRequests(typeFilter || undefined);
            setRequests(data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    }, [typeFilter]);

    useEffect(() => {
        loadRequests();
    }, [loadRequests]);

    // ─── WebSocket: live new requests & status updates ─────
    // Auth cookie is sent automatically with withCredentials; server validates JWT and derives hotelId
    useEffect(() => {
        if (!hotel?.id) return;
        const socket = io(`${API_URL}/service-requests`, { withCredentials: true });
        socketRef.current = socket;

        socket.on("connect", () => setIsLive(true));
        socket.on("disconnect", () => setIsLive(false));

        socket.on("service-request:new", (req: ServiceRequest) => {
            setRequests(prev => {
                if (typeFilter && req.type !== typeFilter) return prev;
                return [req, ...prev];
            });
            if (req.priority === "URGENT" || req.priority === "HIGH") {
                playAlertSound(req.priority);
            }
        });
        socket.on("service-request:updated", (updated: ServiceRequest) => {
            setRequests(prev => prev.map(r => r.id === updated.id ? updated : r));
        });

        return () => {
            socketRef.current?.disconnect();
            socketRef.current = null;
        };
    }, [hotel?.id, typeFilter]);

    async function updateStatus(id: string, status: string) {
        setUpdatingId(id);
        try {
            await api.updateServiceRequestStatus(id, status);
            // Optimistic update — WS will also push the change
            setRequests(prev => prev.map(r => r.id === id ? { ...r, status: status as any } : r));
        } catch (err: any) {
            alert(err.message);
            await loadRequests(); // revert on error
        } finally {
            setUpdatingId(null);
        }
    }

    function getNextAction(status: string): { label: string; next: string; icon: typeof CheckCircle; variant: "primary" | "secondary" | "outline" } | null {
        switch (status) {
            case "SUBMITTED": return { label: "Acknowledge", next: "ACKNOWLEDGED", icon: Eye, variant: "secondary" };
            case "ACKNOWLEDGED": return { label: "Start Working", next: "IN_PROGRESS", icon: Play, variant: "secondary" };
            case "IN_PROGRESS": return { label: "Mark Resolved", next: "RESOLVED", icon: CheckCircle, variant: "primary" };
            default: return null;
        }
    }

    function timeSince(date: string) {
        const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
        if (mins < 1) return "Just now";
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return `${Math.floor(hrs / 24)}d ago`;
    }

    const activeRequests = requests.filter(r => !["RESOLVED", "REJECTED"].includes(r.status));
    // Fix #5: resolved capped to 50 in backend, but also show max 50 in UI
    const resolvedRequests = requests
        .filter(r => ["RESOLVED", "REJECTED"].includes(r.status))
        .slice(0, 50);

    if (loading) return (
        <div className="flex items-center justify-center py-32">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-3">
                        Guest Services
                        {/* Live indicator */}
                        <span className={cn(
                            "flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full border",
                            isLive
                                ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                                : "text-muted-foreground bg-secondary border-border"
                        )}>
                            {isLive ? (
                                <><Wifi className="w-3 h-3" /> Live</>
                            ) : (
                                <><WifiOff className="w-3 h-3" /> Offline</>
                            )}
                        </span>
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {activeRequests.length} active | {resolvedRequests.length} resolved (last 50)
                    </p>
                </div>
                <Button variant="outline" onClick={loadRequests}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                </Button>
            </div>

            {/* Type Filter Tabs */}
            <div className="flex gap-2 flex-wrap">
                {TYPE_TABS.map(tab => {
                    const Icon = tab.icon;
                    const count = tab.key
                        ? requests.filter(r => r.type === tab.key).length
                        : requests.length;
                    return (
                        <button
                            key={tab.key}
                            onClick={() => { setTypeFilter(tab.key); setLoading(true); }}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border",
                                typeFilter === tab.key
                                    ? "bg-primary/10 text-primary border-primary/20"
                                    : "text-muted-foreground border-border hover:bg-secondary"
                            )}
                        >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                            <span className={cn(
                                "text-xs px-1.5 py-0.5 rounded-full",
                                typeFilter === tab.key ? "bg-primary text-primary-foreground" : "bg-secondary"
                            )}>
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Empty State */}
            {activeRequests.length === 0 && resolvedRequests.length === 0 && (
                <div className="text-center py-16 text-muted-foreground">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="text-lg font-medium">No service requests</p>
                    <p className="text-sm">Requests from guests will appear here in real-time</p>
                </div>
            )}

            {/* Active Requests */}
            {activeRequests.length > 0 && (
                <div className="space-y-3">
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                        Active ({activeRequests.length})
                    </h2>
                    <AnimatePresence>
                        {activeRequests.map(req => {
                            const statusConfig = STATUS_CONFIG[req.status] || STATUS_CONFIG.SUBMITTED;
                            const TypeIcon = TYPE_ICONS[req.type] || MessageSquare;
                            const action = getNextAction(req.status);
                            const ActionIcon = action?.icon || CheckCircle;

                            return (
                                <motion.div
                                    key={req.id}
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: 50 }}
                                    className={cn("bg-card rounded-xl border border-border p-4 border-l-4", statusConfig.border)}
                                >
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                <TypeIcon className="w-4 h-4 text-muted-foreground" />
                                                <span className="text-sm font-bold text-foreground">{req.category}</span>
                                                <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", statusConfig.bg, statusConfig.color)}>
                                                    {req.status.replace("_", " ")}
                                                </span>
                                                {req.priority !== "NORMAL" && (
                                                    <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", PRIORITY_COLORS[req.priority])}>
                                                        {req.priority}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                                                <span>Room {req.room?.number}</span>
                                                {req.guestName && <span>{req.guestName}</span>}
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {timeSince(req.createdAt)}
                                                </span>
                                            </div>

                                            {req.description && (
                                                <p className="text-sm text-muted-foreground mt-2 bg-secondary/50 rounded-lg px-3 py-2 italic">
                                                    &ldquo;{req.description}&rdquo;
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex gap-2 flex-shrink-0">
                                            {action && (
                                                <Button
                                                    size="sm"
                                                    variant={action.variant}
                                                    disabled={updatingId === req.id}
                                                    onClick={() => updateStatus(req.id, action.next)}
                                                >
                                                    <ActionIcon className="w-3.5 h-3.5 mr-1.5" />
                                                    {action.label}
                                                </Button>
                                            )}
                                            {req.status !== "RESOLVED" && req.status !== "REJECTED" && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    disabled={updatingId === req.id}
                                                    onClick={() => updateStatus(req.id, "REJECTED")}
                                                    className="text-destructive hover:bg-destructive/10"
                                                >
                                                    <XCircle className="w-3.5 h-3.5" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}

            {/* Resolved Requests — capped at 50 */}
            {resolvedRequests.length > 0 && (
                <div className="space-y-3">
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                        Resolved / Rejected (last {resolvedRequests.length})
                    </h2>
                    {resolvedRequests.map(req => {
                        const statusConfig = STATUS_CONFIG[req.status] || STATUS_CONFIG.RESOLVED;
                        const TypeIcon = TYPE_ICONS[req.type] || MessageSquare;
                        return (
                            <div key={req.id} className={cn("bg-card/50 rounded-xl border border-border p-3 border-l-4 opacity-60", statusConfig.border)}>
                                <div className="flex items-center gap-2">
                                    <TypeIcon className="w-3.5 h-3.5 text-muted-foreground" />
                                    <span className="text-sm font-medium text-foreground">{req.category}</span>
                                    <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", statusConfig.bg, statusConfig.color)}>
                                        {req.status}
                                    </span>
                                    <span className="text-xs text-muted-foreground ml-auto">Room {req.room?.number}</span>
                                    <span className="text-xs text-muted-foreground">{timeSince(req.createdAt)}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
