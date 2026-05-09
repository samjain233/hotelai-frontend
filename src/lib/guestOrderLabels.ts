import type { OrderStatus } from "@/lib/types";

/** Short phrases for guest-facing order status (not raw enums). */
export function guestOrderStatusLabel(status: OrderStatus): string {
    switch (status) {
        case "PLACED":
            return "Order received";
        case "CONFIRMED":
            return "Confirmed";
        case "PREPARING":
            return "Preparing";
        case "READY":
            return "Ready";
        case "DELIVERED":
            return "Delivered";
        case "CANCELLED":
            return "Cancelled";
        default:
            return status;
    }
}

export function guestOrderStatusBadgeVariant(
    status: OrderStatus,
): "default" | "success" | "warning" | "danger" {
    if (status === "DELIVERED") return "success";
    if (status === "CANCELLED") return "danger";
    return "warning";
}

function startOfLocalDay(d: Date): number {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** "Today", "Yesterday", or a short calendar date for section headers. */
export function guestOrderDayHeading(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const now = new Date();
    const dayDiff = Math.round((startOfLocalDay(now) - startOfLocalDay(d)) / (24 * 60 * 60 * 1000));
    if (dayDiff === 0) return "Today";
    if (dayDiff === 1) return "Yesterday";
    return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

/** Time only for the order card (heading shows the day). */
export function guestOrderTimeLabel(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}
