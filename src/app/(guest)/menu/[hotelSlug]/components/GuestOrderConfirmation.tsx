"use client";

import type { CSSProperties } from "react";
import { CheckCircle2 } from "lucide-react";
import type { Order } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatPrice } from "./GuestMenuItemParts";

interface GuestOrderConfirmationProps {
    order: Order;
    themeStyle: CSSProperties;
    onBack: () => void;
}

/** Full-screen receipt shown right after an order is placed; status updates live via the order stream. */
export function GuestOrderConfirmation({ order, themeStyle, onBack }: GuestOrderConfirmationProps) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-[var(--guest-bg)] px-6 text-[var(--guest-text)]" style={themeStyle}>
            <div className="animate-scale-in w-full max-w-sm text-center">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400 ring-4 ring-emerald-500/10">
                    <CheckCircle2 className="h-10 w-10" />
                </div>
                <h1 className="mb-2 text-2xl font-bold text-[var(--guest-text)]">Order confirmed</h1>
                <p className="mb-8 text-[var(--guest-muted)]">
                    Order <span className="font-mono font-medium text-[var(--guest-text)]">#{order.orderNumber}</span> has been sent to the kitchen.
                </p>
                <div className="mb-6 overflow-hidden rounded-2xl border border-[var(--guest-line)] bg-[var(--guest-surface)] text-left">
                    <div className="flex items-center justify-between border-b border-[var(--guest-line)] bg-[var(--guest-text-12)] px-4 py-3">
                        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--guest-muted)]">Receipt</span>
                        <Badge variant={order.status === "DELIVERED" ? "success" : order.status === "CANCELLED" ? "danger" : "warning"}>{order.status}</Badge>
                    </div>
                    <div className="space-y-3 p-4">
                        {order.items.map((oi) => (
                            <div key={oi.id} className="flex justify-between text-sm">
                                <span className="text-[var(--guest-muted)]">
                                    <span className="mr-2 font-semibold text-[var(--guest-text)]">{oi.quantity}x</span>
                                    {oi.itemName}
                                </span>
                                <span className="font-medium text-[var(--guest-text)]">{formatPrice(Number(oi.price) * oi.quantity)}</span>
                            </div>
                        ))}
                    </div>
                    <div className="flex items-center justify-between border-t border-[var(--guest-line)] bg-[var(--guest-text-12)] px-4 py-4">
                        <span className="font-semibold text-[var(--guest-text)]">Total</span>
                        <span className="text-lg font-bold text-[var(--guest-accent)]">{formatPrice(order.totalAmount)}</span>
                    </div>
                </div>
                <Button className="w-full border-[var(--guest-line)] bg-[var(--guest-surface-2)] text-[var(--guest-text)] hover:opacity-90" variant="secondary" onClick={onBack}>
                    Back to menu
                </Button>
            </div>
        </div>
    );
}
