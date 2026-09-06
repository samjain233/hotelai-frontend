"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X,
    Receipt,
    Calendar,
    Clock,
    User,
    Phone,
    Mail,
    KeyRound,
    Printer,
    ChevronDown,
    ChevronUp,
    ShoppingBag,
    Headset,
    AlertCircle,
    CheckCircle2,
    Loader2,
    CreditCard,
    Users,
    LogOut,
} from "lucide-react";
import { api } from "@/lib/api";
import { GuestStay, Room, Order, ServiceRequest } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface RoomStayHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    room: Room | null;
}

function formatPrice(amount: number | string) {
    const n = typeof amount === "number" ? amount : parseFloat(String(amount ?? 0)) || 0;
    return `₹${n.toLocaleString("en-IN")}`;
}

function formatDateTime(dateStr?: string | null) {
    if (!dateStr) return "—";
    try {
        const d = new Date(dateStr);
        return d.toLocaleString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    } catch {
        return dateStr;
    }
}

export function RoomStayHistoryModal({
    isOpen,
    onClose,
    room,
}: RoomStayHistoryModalProps) {
    const [stays, setStays] = useState<GuestStay[]>([]);
    const [groupStays, setGroupStays] = useState<GuestStay[]>([]);
    const [viewMode, setViewMode] = useState<"ROOM" | "GROUP">("ROOM");
    const [loading, setLoading] = useState(false);
    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const [expandedStayId, setExpandedStayId] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && room) {
            loadStays(room.id);
        } else {
            setStays([]);
            setGroupStays([]);
            setViewMode("ROOM");
            setExpandedStayId(null);
        }
    }, [isOpen, room]);

    async function loadStays(roomId: string) {
        setLoading(true);
        try {
            const data = await api.getRoomStays(roomId);
            setStays(data);
            if (data.length > 0) {
                // Auto-expand the active stay, or the most recent one
                const active = data.find((s) => s.status === "CHECKED_IN");
                setExpandedStayId(active ? active.id : data[0].id);

                const currentGroupStayId = active?.groupStayId || data.find((s) => s.groupStayId)?.groupStayId;
                if (currentGroupStayId) {
                    try {
                        const gData = await api.getGroupStays(currentGroupStayId);
                        setGroupStays(gData);
                    } catch (gErr) {
                        console.error("Failed to load group stays:", gErr);
                    }
                } else {
                    setGroupStays([]);
                }
            } else {
                setGroupStays([]);
            }
        } catch (err) {
            console.error("Failed to load room stays:", err);
            toast.error("Failed to load stay history");
        } finally {
            setLoading(false);
        }
    }

    const printFolio = (stay: GuestStay) => {
        const billOrders = (stay.orders || []).filter((o) => o.status !== "CANCELLED");
        const grandTotal = billOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

        const printWindow = window.open("", "_blank", "width=800,height=900");
        if (!printWindow) {
            toast.error("Popup blocked. Please allow popups to print folio.");
            return;
        }

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Guest Folio - Room ${room?.number || ""} - Stay #${stay.id.slice(-6).toUpperCase()}</title>
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 40px; color: #111; }
                    .header { border-bottom: 2px solid #000; padding-bottom: 16px; margin-bottom: 24px; }
                    .hotel-title { font-size: 24px; font-weight: bold; }
                    .folio-title { font-size: 16px; color: #555; text-transform: uppercase; letter-spacing: 1px; }
                    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px; font-size: 14px; }
                    .meta-item strong { color: #555; }
                    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
                    th { text-align: left; padding: 8px; border-bottom: 2px solid #ddd; font-size: 12px; text-transform: uppercase; color: #555; }
                    td { padding: 10px 8px; border-bottom: 1px solid #eee; font-size: 13px; }
                    .text-right { text-align: right; }
                    .total-row { font-size: 16px; font-weight: bold; border-top: 2px solid #000; }
                    .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #888; border-top: 1px solid #ddd; padding-top: 16px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="hotel-title">Room ${room?.number || ""} - Guest Stay Folio</div>
                    <div class="folio-title">Stay ID: ${stay.id}</div>
                </div>
                <div class="meta-grid">
                    <div class="meta-item"><strong>Guest Name:</strong> ${stay.guestName || "Guest"}</div>
                    <div class="meta-item"><strong>Status:</strong> ${stay.status}</div>
                    <div class="meta-item"><strong>Phone:</strong> ${stay.guestPhone || "—"}</div>
                    <div class="meta-item"><strong>Check-In:</strong> ${formatDateTime(stay.checkInAt)}</div>
                    <div class="meta-item"><strong>Email:</strong> ${stay.guestEmail || "—"}</div>
                    <div class="meta-item"><strong>Check-Out:</strong> ${formatDateTime(stay.checkOutAt)}</div>
                </div>
                <h3>Room Service & Dining Charges</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Order #</th>
                            <th>Time</th>
                            <th>Items</th>
                            <th>Status</th>
                            <th class="text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${
                            billOrders.length === 0
                                ? '<tr><td colspan="5" style="text-align: center; color: #777; padding: 20px;">No dining orders during this stay</td></tr>'
                                : billOrders
                                      .map(
                                          (o) => `
                            <tr>
                                <td><strong>#${o.orderNumber}</strong></td>
                                <td>${formatDateTime(o.createdAt)}</td>
                                <td>${o.items.map((i) => `${i.quantity}x ${i.itemName}`).join(", ")}</td>
                                <td>${o.status}</td>
                                <td class="text-right">${formatPrice(o.totalAmount)}</td>
                            </tr>
                        `,
                                      )
                                      .join("")
                        }
                        <tr class="total-row">
                            <td colspan="4">Total Room Service Bill</td>
                            <td class="text-right">${formatPrice(grandTotal)}</td>
                        </tr>
                    </tbody>
                </table>
                <div class="footer">
                    Thank you for staying with us!
                </div>
                <script>
                    window.onload = function() { window.print(); }
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    const printMasterFolio = () => {
        if (groupStays.length === 0) return;

        const printWindow = window.open("", "_blank", "width=850,height=950");
        if (!printWindow) {
            toast.error("Popup blocked. Please allow popups to print master folio.");
            return;
        }

        const primaryStay = groupStays.find((s) => s.isPrimaryRoom) || groupStays[0];
        const groupStayId = primaryStay.groupStayId || primaryStay.id;

        let grandTotal = 0;
        let roomSectionsHtml = "";

        for (const s of groupStays) {
            const validOrders = (s.orders || []).filter((o) => o.status !== "CANCELLED");
            const roomTotal = validOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
            grandTotal += roomTotal;

            const ordersRows =
                validOrders.length === 0
                    ? `<tr><td colspan="4" style="text-align: center; color: #888; padding: 12px;">No dining charges for this room</td></tr>`
                    : validOrders
                          .map(
                              (o) => `
                    <tr>
                        <td><strong>#${o.orderNumber}</strong> <span style="color: #666; font-size: 11px;">(${formatDateTime(o.createdAt)})</span></td>
                        <td>${(o.items || []).map((i) => `${i.quantity}x ${i.itemName}`).join(", ") || "—"}</td>
                        <td><span style="font-size: 11px; padding: 2px 6px; background: #eee; border-radius: 4px;">${o.status}</span></td>
                        <td style="text-align: right; font-weight: 600;">${formatPrice(o.totalAmount)}</td>
                    </tr>
                `,
                          )
                          .join("");

            roomSectionsHtml += `
                <div style="margin-top: 20px; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
                    <div style="background: #f8f9fa; padding: 10px 14px; border-bottom: 1px solid #ddd; display: flex; justify-content: space-between; align-items: center;">
                        <strong style="font-size: 14px;">Room ${s.room?.number || s.roomId} ${s.isPrimaryRoom ? "(Primary Lead)" : ""} — ${s.guestName || "Guest"}</strong>
                        <span style="font-size: 13px; font-weight: bold;">Subtotal: ${formatPrice(roomTotal)}</span>
                    </div>
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr>
                                <th style="width: 25%; text-align: left; padding: 8px; border-bottom: 2px solid #ddd; font-size: 11px; text-transform: uppercase; color: #555;">Order #</th>
                                <th style="width: 45%; text-align: left; padding: 8px; border-bottom: 2px solid #ddd; font-size: 11px; text-transform: uppercase; color: #555;">Items</th>
                                <th style="width: 15%; text-align: left; padding: 8px; border-bottom: 2px solid #ddd; font-size: 11px; text-transform: uppercase; color: #555;">Status</th>
                                <th style="width: 15%; text-align: right; padding: 8px; border-bottom: 2px solid #ddd; font-size: 11px; text-transform: uppercase; color: #555;">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${ordersRows}
                        </tbody>
                    </table>
                </div>
            `;
        }

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Master Folio - Group Booking #${groupStayId.slice(-6).toUpperCase()}</title>
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 40px; color: #111; }
                    .header { border-bottom: 2px solid #000; padding-bottom: 16px; margin-bottom: 20px; }
                    .hotel-title { font-size: 24px; font-weight: bold; }
                    .folio-title { font-size: 14px; color: #555; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px; }
                    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; font-size: 13px; background: #fafafa; padding: 14px; border-radius: 8px; border: 1px solid #eee; }
                    td { padding: 8px; border-bottom: 1px solid #eee; font-size: 12px; }
                    .grand-total-card { margin-top: 28px; background: #f0fdf4; border: 2px solid #16a34a; border-radius: 8px; padding: 16px; display: flex; justify-content: space-between; align-items: center; }
                    .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #888; border-top: 1px solid #ddd; padding-top: 16px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="hotel-title">Consolidated Master Group Folio</div>
                    <div class="folio-title">Group Booking Ref: ${groupStayId} · ${groupStays.length} Rooms</div>
                </div>
                <div class="meta-grid">
                    <div><strong>Primary Guest:</strong> ${primaryStay.guestName || "Guest"}</div>
                    <div><strong>Rooms:</strong> ${groupStays.map((s) => `Room ${s.room?.number || s.roomId}`).join(", ")}</div>
                    <div><strong>Phone:</strong> ${primaryStay.guestPhone || "—"}</div>
                    <div><strong>Check-In:</strong> ${formatDateTime(primaryStay.checkInAt)}</div>
                    <div><strong>Email:</strong> ${primaryStay.guestEmail || "—"}</div>
                    <div><strong>Printed At:</strong> ${new Date().toLocaleString("en-IN")}</div>
                </div>
                <h3 style="margin-bottom: 0;">Room-by-Room Itemized Breakdown</h3>
                ${roomSectionsHtml}
                <div class="grand-total-card">
                    <div style="font-size: 16px; font-weight: bold; color: #15803d;">Group Grand Total (${groupStays.length} Rooms):</div>
                    <div style="font-size: 22px; font-weight: bold; color: #15803d;">${formatPrice(grandTotal)}</div>
                </div>
                <div class="footer">
                    <p>Thank you for choosing our hotel. We look forward to welcoming you and your party again!</p>
                </div>
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => printWindow.print(), 250);
    };

    const handleCheckoutGroup = async () => {
        const activeGroupStay = groupStays.find((s) => s.status === "CHECKED_IN");
        if (!activeGroupStay?.groupStayId) return;

        if (
            !confirm(
                `Check out all ${groupStays.length} rooms in this group? This will invalidate all active guest PINs and archive active orders.`,
            )
        )
            return;

        setCheckoutLoading(true);
        try {
            const res = await api.checkoutGroup(activeGroupStay.groupStayId);
            toast.success(res.message || "Group checked out successfully");
            onClose();
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Failed to checkout group");
        } finally {
            setCheckoutLoading(false);
        }
    };

    if (!isOpen || !room) return null;

    return (
        <AnimatePresence>
            <div
                className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: 8 }}
                    transition={{ duration: 0.2 }}
                    onClick={(e) => e.stopPropagation()}
                    className="relative w-full max-w-3xl max-h-[88vh] flex flex-col bg-card border border-border rounded-2xl shadow-2xl overflow-hidden text-foreground"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                                <Receipt className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-lg font-bold tracking-tight">
                                        Room {room.number} Stay &amp; Billing History
                                    </h2>
                                    {room.isOccupied ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                            Occupied
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-secondary text-muted-foreground border border-border">
                                            Vacant
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Historical guest ledger, active PINs, and stay-by-stay itemized bills
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Segmented View Switcher when Group Stays exist */}
                    {groupStays.length > 1 && (
                        <div className="flex border-b border-border bg-muted/20 px-6 pt-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setViewMode("ROOM")}
                                className={cn(
                                    "px-3.5 py-2 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5",
                                    viewMode === "ROOM"
                                        ? "border-primary text-primary"
                                        : "border-transparent text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <Receipt className="w-3.5 h-3.5" />
                                Room {room.number} History ({stays.length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode("GROUP")}
                                className={cn(
                                    "px-3.5 py-2 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5",
                                    viewMode === "GROUP"
                                        ? "border-primary text-primary"
                                        : "border-transparent text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <Users className="w-3.5 h-3.5 text-blue-500" />
                                Group Master Folio ({groupStays.length} Rooms Linked)
                            </button>
                        </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                        {loading ? (
                            <div className="py-16 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                <p className="text-sm">Loading stay records...</p>
                            </div>
                        ) : viewMode === "GROUP" && groupStays.length > 0 ? (
                            /* ─── GROUP MASTER FOLIO VIEW ─── */
                            <div className="space-y-4">
                                <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-bold text-base text-foreground">
                                                Group Master Folio · {groupStays.length} Rooms
                                            </span>
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/20 text-primary border border-primary/30 font-mono">
                                                #{groupStays[0]?.groupStayId?.slice(-6).toUpperCase() || "GRP"}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            Primary Lead: <strong className="text-foreground">{groupStays.find((s) => s.isPrimaryRoom)?.guestName || groupStays[0]?.guestName || "Guest"}</strong>
                                            {groupStays.find((s) => s.isPrimaryRoom)?.guestPhone && ` · ${groupStays.find((s) => s.isPrimaryRoom)?.guestPhone}`}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={printMasterFolio}
                                            className="gap-1.5 h-9 text-xs"
                                        >
                                            <Printer className="w-3.5 h-3.5" />
                                            Print Master Folio
                                        </Button>
                                        {groupStays.some((s) => s.status === "CHECKED_IN") && (
                                            <Button
                                                size="sm"
                                                loading={checkoutLoading}
                                                onClick={handleCheckoutGroup}
                                                className="gap-1.5 h-9 text-xs bg-rose-600 hover:bg-rose-700 text-white"
                                            >
                                                <LogOut className="w-3.5 h-3.5" />
                                                Check Out Group
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    <div className="p-3 rounded-xl border border-border bg-card">
                                        <span className="text-[11px] text-muted-foreground block">Linked Rooms</span>
                                        <span className="text-base font-bold text-foreground">{groupStays.length} Rooms</span>
                                    </div>
                                    <div className="p-3 rounded-xl border border-border bg-card">
                                        <span className="text-[11px] text-muted-foreground block">Total Group Orders</span>
                                        <span className="text-base font-bold text-foreground">
                                            {groupStays.reduce((sum, s) => sum + (s.orders || []).filter((o) => o.status !== "CANCELLED").length, 0)} Orders
                                        </span>
                                    </div>
                                    <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 col-span-2 sm:col-span-1">
                                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold block">Master Folio Total</span>
                                        <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                                            {formatPrice(groupStays.reduce((sum, s) => {
                                                const valid = (s.orders || []).filter((o) => o.status !== "CANCELLED");
                                                return sum + valid.reduce((acc, o) => acc + Number(o.totalAmount || 0), 0);
                                            }, 0))}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-3 pt-1">
                                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                        Room-by-Room Itemized Charges
                                    </h3>
                                    {groupStays.map((s) => {
                                        const validOrders = (s.orders || []).filter((o) => o.status !== "CANCELLED");
                                        const roomTotal = validOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
                                        return (
                                            <div key={s.id} className="rounded-xl border border-border bg-card overflow-hidden">
                                                <div className="p-3 bg-secondary/30 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="font-bold text-sm text-foreground">
                                                            Room {s.room?.number || s.roomId}
                                                        </span>
                                                        {s.isPrimaryRoom && (
                                                            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                                                                Primary Lead
                                                            </span>
                                                        )}
                                                        <span className="text-xs text-muted-foreground">
                                                            ({s.guestName || "Guest"})
                                                        </span>
                                                        <span className="px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                                             PIN: {s.pin}
                                                        </span>
                                                    </div>
                                                    <div className="text-xs font-bold text-foreground">
                                                        Subtotal: <span className="text-primary">{formatPrice(roomTotal)}</span>
                                                    </div>
                                                </div>
                                                <div className="p-3">
                                                    {validOrders.length === 0 ? (
                                                        <p className="text-xs text-muted-foreground italic py-1.5 text-center">
                                                            No dining charges for this room
                                                        </p>
                                                    ) : (
                                                        <div className="space-y-2">
                                                            {validOrders.map((ord) => (
                                                                <div key={ord.id} className="p-2.5 rounded-lg border border-border/60 bg-secondary/10 flex justify-between items-center text-xs">
                                                                    <div>
                                                                        <div className="font-semibold text-foreground">
                                                                            Order #{ord.orderNumber}
                                                                            <span className="text-muted-foreground text-[11px] ml-2">
                                                                                {formatDateTime(ord.createdAt)}
                                                                            </span>
                                                                        </div>
                                                                        <div className="text-muted-foreground mt-0.5">
                                                                            {(ord.items || []).map((i) => `${i.quantity}x ${i.itemName}`).join(", ") || "—"}
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <div className="font-bold text-foreground">{formatPrice(ord.totalAmount)}</div>
                                                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                                                                            {ord.status}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : stays.length === 0 ? (
                            <div className="py-16 text-center">
                                <div className="w-14 h-14 rounded-2xl bg-secondary mx-auto flex items-center justify-center text-muted-foreground mb-3">
                                    <Receipt className="w-7 h-7" />
                                </div>
                                <h3 className="font-semibold text-base text-foreground">No stay records found</h3>
                                <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
                                    When guests check into Room {room.number}, their stay session and orders will be recorded here.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {stays.map((stay) => {
                                    const isExpanded = expandedStayId === stay.id;
                                    const orders = stay.orders || [];
                                    const validOrders = orders.filter((o) => o.status !== "CANCELLED");
                                    const stayTotal = validOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
                                    const services = stay.serviceRequests || [];
                                    const isActive = stay.status === "CHECKED_IN";

                                    return (
                                        <div
                                            key={stay.id}
                                            className={cn(
                                                "rounded-xl border transition-all overflow-hidden",
                                                isActive
                                                    ? "border-emerald-500/30 bg-emerald-500/5 shadow-sm"
                                                    : "border-border bg-secondary/20 hover:border-border/80",
                                            )}
                                        >
                                            {/* Stay Summary Bar */}
                                            <div
                                                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none"
                                                onClick={() =>
                                                    setExpandedStayId(isExpanded ? null : stay.id)
                                                }
                                            >
                                                <div className="flex items-start sm:items-center gap-3">
                                                    <div
                                                        className={cn(
                                                            "w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0",
                                                            isActive
                                                                ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                                                                : "bg-secondary text-muted-foreground",
                                                        )}
                                                    >
                                                        <User className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="font-semibold text-sm sm:text-base text-foreground">
                                                                {stay.guestName || "Guest"}
                                                            </span>
                                                            {isActive ? (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                                                    Active Stay
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground">
                                                                    Completed
                                                                </span>
                                                            )}
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                                                                <KeyRound className="w-3 h-3" /> PIN: {stay.pin}
                                                            </span>
                                                            {stay.groupStayId && (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                                                                    <Users className="w-3 h-3" />
                                                                    {stay.isPrimaryRoom ? "Primary Room (Group)" : "Linked Room (Group)"}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
                                                            <span className="flex items-center gap-1">
                                                                <Calendar className="w-3.5 h-3.5" />
                                                                In: {formatDateTime(stay.checkInAt)}
                                                            </span>
                                                            {stay.checkOutAt ? (
                                                                <span className="flex items-center gap-1">
                                                                    <Clock className="w-3.5 h-3.5" />
                                                                    Out: {formatDateTime(stay.checkOutAt)}
                                                                </span>
                                                            ) : null}
                                                            {stay.guestPhone ? (
                                                                <span className="flex items-center gap-1">
                                                                    <Phone className="w-3.5 h-3.5" /> {stay.guestPhone}
                                                                </span>
                                                            ) : null}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50">
                                                    <div className="text-left sm:text-right">
                                                        <p className="text-xs text-muted-foreground">Stay Bill Total</p>
                                                        <p className="text-base sm:text-lg font-bold text-foreground">
                                                            {formatPrice(stayTotal)}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-8 px-2.5 text-xs gap-1.5"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                printFolio(stay);
                                                            }}
                                                            title="Print Folio / Receipt"
                                                        >
                                                            <Printer className="w-3.5 h-3.5" />
                                                            <span className="hidden sm:inline">Folio</span>
                                                        </Button>
                                                        <div className="p-1 rounded text-muted-foreground">
                                                            {isExpanded ? (
                                                                <ChevronUp className="w-4 h-4" />
                                                            ) : (
                                                                <ChevronDown className="w-4 h-4" />
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Expanded Stay Details */}
                                            {isExpanded && (
                                                <div className="border-t border-border/70 p-4 sm:p-5 bg-card/60 space-y-4">
                                                    {/* Guest Contact Details */}
                                                    {(stay.guestName || stay.guestPhone || stay.guestEmail) && (
                                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-3 rounded-lg bg-secondary/40 text-xs">
                                                            <div>
                                                                <span className="text-muted-foreground block">Guest Name</span>
                                                                <span className="font-medium text-foreground">{stay.guestName || "—"}</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-muted-foreground block">Phone</span>
                                                                <span className="font-medium text-foreground">{stay.guestPhone || "—"}</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-muted-foreground block">Email</span>
                                                                <span className="font-medium text-foreground">{stay.guestEmail || "—"}</span>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Orders Section */}
                                                    <div>
                                                        <div className="flex items-center justify-between mb-2.5">
                                                            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                                                <ShoppingBag className="w-3.5 h-3.5 text-primary" />
                                                                Orders Placed ({orders.length})
                                                            </h4>
                                                            <span className="text-xs font-semibold text-foreground">
                                                                Charges: {formatPrice(stayTotal)}
                                                            </span>
                                                        </div>

                                                        {orders.length === 0 ? (
                                                            <p className="text-xs text-muted-foreground italic py-3 text-center bg-secondary/20 rounded-lg border border-border/40">
                                                                No food or beverage orders placed during this stay.
                                                            </p>
                                                        ) : (
                                                            <div className="space-y-2.5">
                                                                {orders.map((ord) => (
                                                                    <div
                                                                        key={ord.id}
                                                                        className="p-3 rounded-lg border border-border/60 bg-card text-xs space-y-2"
                                                                    >
                                                                        <div className="flex items-center justify-between flex-wrap gap-2">
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="font-bold text-foreground">
                                                                                    Order #{ord.orderNumber}
                                                                                </span>
                                                                                <Badge
                                                                                    variant={
                                                                                        ord.status === "DELIVERED"
                                                                                            ? "success"
                                                                                            : ord.status === "CANCELLED"
                                                                                            ? "danger"
                                                                                            : "warning"
                                                                                    }
                                                                                >
                                                                                    {ord.status}
                                                                                </Badge>
                                                                            </div>
                                                                            <div className="flex items-center gap-3">
                                                                                <span className="text-muted-foreground">
                                                                                    {formatDateTime(ord.createdAt)}
                                                                                </span>
                                                                                <span className="font-bold text-sm text-foreground">
                                                                                    {formatPrice(ord.totalAmount)}
                                                                                </span>
                                                                            </div>
                                                                        </div>

                                                                        {/* Items */}
                                                                        <div className="pt-1 border-t border-border/40 space-y-1">
                                                                            {ord.items.map((item) => (
                                                                                <div
                                                                                    key={item.id}
                                                                                    className="flex justify-between text-muted-foreground text-[11px]"
                                                                                >
                                                                                    <span>
                                                                                        <strong className="text-foreground font-semibold">
                                                                                            {item.quantity}x
                                                                                        </strong>{" "}
                                                                                        {item.itemName}
                                                                                    </span>
                                                                                    <span className="font-medium text-foreground">
                                                                                        {formatPrice(Number(item.price) * item.quantity)}
                                                                                    </span>
                                                                                </div>
                                                                            ))}
                                                                        </div>

                                                                        {ord.notes ? (
                                                                            <p className="text-[11px] text-muted-foreground italic bg-secondary/40 p-1.5 rounded">
                                                                                Note: {ord.notes}
                                                                            </p>
                                                                        ) : null}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Service Requests Section */}
                                                    {services.length > 0 ? (
                                                        <div className="pt-2">
                                                            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-2.5">
                                                                <Headset className="w-3.5 h-3.5 text-primary" />
                                                                Service Requests &amp; Complaints ({services.length})
                                                            </h4>
                                                            <div className="space-y-2">
                                                                {services.map((req) => (
                                                                    <div
                                                                        key={req.id}
                                                                        className="p-2.5 rounded-lg border border-border/60 bg-card text-xs flex items-start justify-between gap-2"
                                                                    >
                                                                        <div>
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="font-semibold text-foreground">
                                                                                    {req.category}
                                                                                </span>
                                                                                <Badge
                                                                                    variant={
                                                                                        req.status === "RESOLVED"
                                                                                            ? "success"
                                                                                            : req.status === "REJECTED"
                                                                                            ? "danger"
                                                                                            : "default"
                                                                                    }
                                                                                >
                                                                                    {req.status}
                                                                                </Badge>
                                                                            </div>
                                                                            {req.description ? (
                                                                                <p className="text-muted-foreground mt-1">
                                                                                    {req.description}
                                                                                </p>
                                                                            ) : null}
                                                                        </div>
                                                                        <span className="text-[11px] text-muted-foreground shrink-0">
                                                                            {formatDateTime(req.createdAt)}
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ) : null}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-border bg-card flex justify-between items-center">
                        <div className="text-xs text-muted-foreground">
                            Showing <strong className="text-foreground">{stays.length}</strong> stay record{stays.length === 1 ? "" : "s"}
                        </div>
                        <Button variant="secondary" onClick={onClose}>
                            Close
                        </Button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
