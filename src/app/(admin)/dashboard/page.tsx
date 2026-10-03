"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import type { Order, OrderStatus, Room, ServiceRequest } from "@/lib/types";
import { useEffect, useState } from "react";
import {
    ArrowRight,
    BedDouble,
    ChefHat,
    ClipboardList,
    Headset,
    Utensils,
    Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AdminPageSkeleton } from "@/components/ui/Skeleton";

const OPEN_ORDER_STATUSES: OrderStatus[] = ["PLACED", "CONFIRMED", "PREPARING", "READY"];
const OPEN_REQUEST_STATUSES = ["SUBMITTED", "ACKNOWLEDGED", "IN_PROGRESS"];

const PIPELINE: { status: OrderStatus; label: string; bar: string }[] = [
    { status: "PLACED", label: "New", bar: "bg-blue-500" },
    { status: "CONFIRMED", label: "Confirmed", bar: "bg-indigo-500" },
    { status: "PREPARING", label: "Preparing", bar: "bg-amber-500" },
    { status: "READY", label: "Ready", bar: "bg-emerald-500" },
    { status: "DELIVERED", label: "Delivered", bar: "bg-zinc-400" },
];

function money(amount: number): string {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(amount);
}

function dayKey(date: Date, timeZone?: string): string {
    try {
        return new Intl.DateTimeFormat("en-CA", {
            timeZone: timeZone || undefined,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        }).format(date);
    } catch {
        return new Intl.DateTimeFormat("en-CA", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        }).format(date);
    }
}

function shiftDay(key: string, days: number): string {
    const [year, month, day] = key.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().slice(0, 10);
}

function hourInZone(timeZone?: string): number {
    try {
        const hour = new Intl.DateTimeFormat("en-GB", {
            hour: "numeric",
            hourCycle: "h23",
            timeZone: timeZone || undefined,
        })
            .formatToParts(new Date())
            .find((part) => part.type === "hour")?.value;
        return Number(hour ?? new Date().getHours());
    } catch {
        return new Date().getHours();
    }
}

function greeting(timeZone?: string): string {
    const hour = hourInZone(timeZone);
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
}

function longDate(timeZone?: string): string {
    try {
        return new Intl.DateTimeFormat("en-IN", {
            timeZone: timeZone || undefined,
            weekday: "long",
            day: "numeric",
            month: "long",
        }).format(new Date());
    } catch {
        return new Intl.DateTimeFormat("en-IN", {
            weekday: "long",
            day: "numeric",
            month: "long",
        }).format(new Date());
    }
}

function clockTime(iso: string, timeZone?: string): string {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "";
    try {
        return new Intl.DateTimeFormat("en-IN", {
            timeZone: timeZone || undefined,
            hour: "2-digit",
            minute: "2-digit",
        }).format(date);
    } catch {
        return new Intl.DateTimeFormat("en-IN", { hour: "2-digit", minute: "2-digit" }).format(date);
    }
}

function orderTotal(order: Order): number {
    return Number(order.totalAmount || 0);
}

function itemSummary(order: Order): string {
    const items = order.items ?? [];
    if (items.length === 0) return "No items";
    const first = items[0].itemName;
    return items.length > 1 ? `${first} +${items.length - 1}` : first;
}

function revenueChange(today: number, yesterday: number): { text: string; tone: "up" | "down" | "flat" } {
    if (yesterday <= 0) {
        return today > 0
            ? { text: "No revenue yesterday", tone: "up" }
            : { text: "Nothing in yet today", tone: "flat" };
    }
    const pct = Math.round(((today - yesterday) / yesterday) * 100);
    if (pct === 0) return { text: "Same as yesterday", tone: "flat" };
    const arrow = pct > 0 ? "↑" : "↓";
    return { text: `${arrow} ${Math.abs(pct)}% vs yesterday`, tone: pct > 0 ? "up" : "down" };
}

export default function DashboardPage() {
    const { hotel, admin } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [menuItems, setMenuItems] = useState(0);
    const [categoryCount, setCategoryCount] = useState(0);
    const [openRequests, setOpenRequests] = useState(0);
    const [loading, setLoading] = useState(true);

    const isOrderingEnabled = hotel?.features?.includes("DIGITAL_ORDERING") ?? false;
    const isStaffEnabled = hotel?.features?.includes("STAFF_MANAGEMENT") ?? false;
    const isRequestsEnabled = hotel?.features?.includes("SERVICE_REQUESTS") ?? false;
    const timeZone = hotel?.timezone;

    useEffect(() => {
        let cancelled = false;
        async function load() {
            try {
                const requestsPromise: Promise<ServiceRequest[]> = isRequestsEnabled
                    ? api.getServiceRequests().catch(() => [])
                    : Promise.resolve([]);
                const [orderList, categories, roomList, requests] = await Promise.all([
                    isOrderingEnabled ? api.getOrders() : Promise.resolve([] as Order[]),
                    api.getCategories(),
                    api.getRooms(),
                    requestsPromise,
                ]);
                if (cancelled) return;
                setOrders(orderList);
                setRooms(roomList);
                setCategoryCount(categories.length);
                setMenuItems(categories.reduce((sum, category) => sum + (category._count?.items || 0), 0));
                setOpenRequests(requests.filter((request) => OPEN_REQUEST_STATUSES.includes(request.status)).length);
            } catch (error) {
                console.error(error);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        load();
        return () => {
            cancelled = true;
        };
    }, [isOrderingEnabled, isRequestsEnabled]);

    if (loading) return <AdminPageSkeleton cardCount={4} />;

    const today = dayKey(new Date(), timeZone);
    const yesterday = shiftDay(today, -1);
    const counted = orders.filter((order) => order.status !== "CANCELLED");
    const todayRevenue = counted
        .filter((order) => dayKey(new Date(order.createdAt), timeZone) === today)
        .reduce((sum, order) => sum + orderTotal(order), 0);
    const yesterdayRevenue = counted
        .filter((order) => dayKey(new Date(order.createdAt), timeZone) === yesterday)
        .reduce((sum, order) => sum + orderTotal(order), 0);
    const todaysOrders = orders.filter((order) => dayKey(new Date(order.createdAt), timeZone) === today);
    const openOrders = orders.filter((order) => OPEN_ORDER_STATUSES.includes(order.status));
    const waiting = openOrders.filter((order) => order.status === "PLACED").length;
    const inKitchen = openOrders.filter((order) => order.status === "CONFIRMED" || order.status === "PREPARING").length;
    const ready = openOrders.filter((order) => order.status === "READY").length;
    const occupied = rooms.filter((room) => room.isOccupied).length;
    const change = revenueChange(todayRevenue, yesterdayRevenue);
    const recent = [...orders].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, 6);
    const pipelineTotal = PIPELINE.reduce(
        (sum, step) => sum + todaysOrders.filter((order) => order.status === step.status).length,
        0,
    );
    const cancelledToday = todaysOrders.filter((order) => order.status === "CANCELLED").length;

    const firstName = admin?.name?.trim().split(/\s+/)[0];
    const attention = [
        waiting > 0 && {
            href: "/orders",
            text: `${waiting} order${waiting === 1 ? "" : "s"} waiting for confirmation`,
        },
        ready > 0 && {
            href: "/orders",
            text: `${ready} order${ready === 1 ? "" : "s"} ready to deliver`,
        },
        openRequests > 0 && {
            href: "/services",
            text: `${openRequests} open service request${openRequests === 1 ? "" : "s"}`,
        },
    ].filter((item): item is { href: string; text: string } => Boolean(item));

    const kpis: KpiProps[] = [
        ...(isOrderingEnabled
            ? [
                  {
                      label: "Today's revenue",
                      value: money(todayRevenue),
                      detail: change.text,
                      tone: change.tone,
                      href: "/orders",
                  },
                  {
                      label: "Open orders",
                      value: String(openOrders.length),
                      detail:
                          openOrders.length === 0
                              ? "Nothing in progress"
                              : [waiting && `${waiting} new`, inKitchen && `${inKitchen} in kitchen`, ready && `${ready} ready`]
                                    .filter(Boolean)
                                    .join(" · "),
                      href: "/orders",
                  },
              ]
            : []),
        {
            label: "Rooms occupied",
            value: rooms.length === 0 ? "0" : `${occupied}/${rooms.length}`,
            detail: rooms.length === 0 ? "No rooms added yet" : `${rooms.length - occupied} available`,
            href: "/rooms",
        },
        ...(isRequestsEnabled
            ? [
                  {
                      label: "Open requests",
                      value: String(openRequests),
                      detail: openRequests === 0 ? "All requests handled" : "Needs a response",
                      href: "/services",
                  },
              ]
            : []),
        {
            label: "Menu items",
            value: String(menuItems),
            detail: categoryCount === 0 ? "No categories yet" : `Across ${categoryCount} categories`,
            href: "/menu",
        },
    ];

    return (
        <div className="space-y-8 pb-[env(safe-area-inset-bottom,0px)] animate-in fade-in duration-500">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0">
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                        {greeting(timeZone)}
                        {firstName ? `, ${firstName}` : ""}
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {longDate(timeZone)}
                        {hotel?.name ? ` · ${hotel.name}` : ""}
                    </p>
                </div>
                {isOrderingEnabled && (
                    <div className="flex gap-2">
                        <Link
                            href="/kitchen"
                            className="inline-flex h-10 flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 sm:flex-none"
                        >
                            <ChefHat className="h-4 w-4" />
                            Kitchen
                        </Link>
                        <Link
                            href="/orders"
                            className="inline-flex h-10 flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 sm:flex-none"
                        >
                            <ClipboardList className="h-4 w-4" />
                            Orders
                        </Link>
                    </div>
                )}
            </div>

            {attention.length > 0 && (
                <div className="flex flex-col gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6 sm:gap-y-2">
                    {attention.map((item) => (
                        <Link
                            key={item.text}
                            href={item.href}
                            className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-amber-800 hover:underline dark:text-amber-200"
                        >
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                            {item.text}
                            <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                    ))}
                </div>
            )}

            <div
                className={cn(
                    "grid grid-cols-2 gap-3 sm:gap-4",
                    kpis.length <= 2 && "sm:grid-cols-2",
                    kpis.length === 3 && "lg:grid-cols-3",
                    kpis.length === 4 && "xl:grid-cols-4",
                    kpis.length >= 5 && "xl:grid-cols-5",
                )}
            >
                {kpis.map((kpi) => (
                    <Kpi key={kpi.label} {...kpi} />
                ))}
            </div>

            <div className={cn("grid grid-cols-1 gap-6", isOrderingEnabled && "xl:grid-cols-3")}>
                {isOrderingEnabled && (
                    <div className="space-y-6 xl:col-span-2">
                        <section className="dashboard-card p-5 sm:p-6">
                            <div className="flex items-baseline justify-between gap-3">
                                <h2 className="text-sm font-semibold text-foreground">Today&apos;s orders</h2>
                                <p className="text-xs text-muted-foreground">
                                    {pipelineTotal} completed or in progress
                                    {cancelledToday > 0 ? ` · ${cancelledToday} cancelled` : ""}
                                </p>
                            </div>
                            {pipelineTotal === 0 ? (
                                <p className="mt-6 text-sm text-muted-foreground">No orders yet today.</p>
                            ) : (
                                <>
                                    <div className="mt-5 flex h-2.5 overflow-hidden rounded-full bg-secondary">
                                        {PIPELINE.map((step) => {
                                            const count = todaysOrders.filter((order) => order.status === step.status).length;
                                            if (count === 0) return null;
                                            return (
                                                <div
                                                    key={step.status}
                                                    className={cn("h-full", step.bar)}
                                                    style={{ width: `${(count / pipelineTotal) * 100}%` }}
                                                />
                                            );
                                        })}
                                    </div>
                                    <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
                                        {PIPELINE.map((step) => {
                                            const count = todaysOrders.filter((order) => order.status === step.status).length;
                                            return (
                                                <li key={step.status} className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <span className={cn("h-2 w-2 rounded-full", step.bar)} />
                                                    <span className="tabular-nums font-medium text-foreground">{count}</span>
                                                    {step.label}
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </>
                            )}
                        </section>

                        <section>
                            <div className="mb-3 flex items-center justify-between">
                                <h2 className="text-sm font-semibold text-foreground">Recent orders</h2>
                                <Link
                                    href="/orders"
                                    className="inline-flex cursor-pointer items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                                >
                                    View all <ArrowRight className="ml-1 h-4 w-4" />
                                </Link>
                            </div>

                            <div className="space-y-2 md:hidden">
                                {recent.map((order) => (
                                    <Link
                                        key={order.id}
                                        href="/orders"
                                        className="dashboard-card flex cursor-pointer items-center justify-between gap-3 p-4"
                                    >
                                        <div className="min-w-0">
                                            <p className="font-medium text-foreground">
                                                #{order.orderNumber}
                                                <span className="font-normal text-muted-foreground"> · Room {order.room?.number ?? "—"}</span>
                                            </p>
                                            <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                                {itemSummary(order)} · {clockTime(order.createdAt, timeZone)}
                                            </p>
                                        </div>
                                        <div className="shrink-0 text-right">
                                            <p className="text-sm font-medium tabular-nums">{money(orderTotal(order))}</p>
                                            <StatusBadge status={order.status} />
                                        </div>
                                    </Link>
                                ))}
                                {recent.length === 0 && <EmptyOrders />}
                            </div>

                            <div className="dashboard-card hidden overflow-hidden md:block">
                                <table className="w-full text-left text-sm">
                                    <thead className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                                        <tr>
                                            <th className="px-5 py-3 font-medium">Order</th>
                                            <th className="px-5 py-3 font-medium">Room</th>
                                            <th className="px-5 py-3 font-medium">Items</th>
                                            <th className="px-5 py-3 font-medium">Time</th>
                                            <th className="px-5 py-3 font-medium">Status</th>
                                            <th className="px-5 py-3 text-right font-medium">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {recent.map((order) => (
                                            <tr key={order.id} className="table-row-hover">
                                                <td className="px-5 py-3.5 font-medium tabular-nums">#{order.orderNumber}</td>
                                                <td className="px-5 py-3.5 text-muted-foreground">{order.room?.number ?? "—"}</td>
                                                <td className="max-w-[16rem] truncate px-5 py-3.5 text-muted-foreground">{itemSummary(order)}</td>
                                                <td className="px-5 py-3.5 tabular-nums text-muted-foreground">{clockTime(order.createdAt, timeZone)}</td>
                                                <td className="px-5 py-3.5">
                                                    <StatusBadge status={order.status} />
                                                </td>
                                                <td className="px-5 py-3.5 text-right font-medium tabular-nums">{money(orderTotal(order))}</td>
                                            </tr>
                                        ))}
                                        {recent.length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="px-5 py-12 text-center text-sm text-muted-foreground">
                                                    No orders yet. They will appear here as guests order from their rooms.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </div>
                )}

                <aside className={cn("space-y-4", !isOrderingEnabled && "grid gap-4 space-y-0 md:grid-cols-2 xl:grid-cols-2")}>
                    <div>
                        <h2 className="mb-3 text-sm font-semibold text-foreground">Shortcuts</h2>
                        <div className="dashboard-card p-2">
                            <ActionRow icon={Utensils} title="Update menu" subtitle="Items, prices and photos" href="/menu" />
                            <ActionRow icon={BedDouble} title="Rooms" subtitle="Occupancy and QR cards" href="/rooms" />
                            {isOrderingEnabled && (
                                <ActionRow icon={ClipboardList} title="Orders" subtitle="Confirm, prepare, deliver" href="/orders" />
                            )}
                            {isRequestsEnabled && (
                                <ActionRow icon={Headset} title="Guest requests" subtitle="Housekeeping and complaints" href="/services" />
                            )}
                            {isStaffEnabled && (
                                <ActionRow
                                    icon={Users}
                                    title="Staff"
                                    subtitle="Invite your team"
                                    href="/staff"
                                    disabled={admin?.role !== "OWNER" && admin?.role !== "GENERAL_MANAGER"}
                                    disabledHint="Only the owner or general manager can manage staff"
                                />
                            )}
                        </div>
                    </div>

                    {!isOrderingEnabled && (
                        <div className="dashboard-card flex flex-col justify-center p-5">
                            <h2 className="text-sm font-semibold text-foreground">Digital ordering is off</h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Guests can still browse the menu from the QR card in their room.
                            </p>
                        </div>
                    )}
                </aside>
            </div>
        </div>
    );
}

interface KpiProps {
    label: string;
    value: string;
    detail: string;
    href: string;
    tone?: "up" | "down" | "flat";
}

function Kpi({ label, value, detail, href, tone = "flat" }: KpiProps) {
    return (
        <Link
            href={href}
            className="dashboard-card flex min-h-[7.5rem] cursor-pointer flex-col justify-between p-4 transition-colors hover:border-primary/30 sm:p-5"
        >
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums text-foreground sm:text-3xl">{value}</p>
            <p
                className={cn(
                    "mt-2 text-xs",
                    tone === "up" && "text-emerald-600 dark:text-emerald-400",
                    tone === "down" && "text-red-600 dark:text-red-400",
                    tone === "flat" && "text-muted-foreground",
                )}
            >
                {detail}
            </p>
        </Link>
    );
}

function EmptyOrders() {
    return (
        <div className="dashboard-card p-8 text-center text-sm text-muted-foreground">
            No orders yet. They will appear here as guests order from their rooms.
        </div>
    );
}

const STATUS_LABEL: Record<OrderStatus, string> = {
    PLACED: "New",
    CONFIRMED: "Confirmed",
    PREPARING: "Preparing",
    READY: "Ready",
    DELIVERED: "Delivered",
    CANCELLED: "Cancelled",
};

function StatusBadge({ status }: { status: OrderStatus }) {
    const styles: Record<OrderStatus, string> = {
        PLACED: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
        CONFIRMED: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
        PREPARING: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
        READY: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
        DELIVERED: "bg-secondary text-muted-foreground",
        CANCELLED: "bg-red-500/10 text-red-600 dark:text-red-400",
    };
    return (
        <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium", styles[status])}>
            {STATUS_LABEL[status]}
        </span>
    );
}

function ActionRow({
    icon: Icon,
    title,
    subtitle,
    href,
    disabled,
    disabledHint,
}: {
    icon: ComponentType<{ className?: string }>;
    title: string;
    subtitle: string;
    href: string;
    disabled?: boolean;
    disabledHint?: string;
}) {
    const className = cn(
        "flex items-center gap-3 rounded-lg p-3 transition-colors",
        disabled ? "cursor-not-allowed opacity-45" : "cursor-pointer hover:bg-secondary",
    );
    const inner = (
        <>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-secondary text-muted-foreground">
                <Icon className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-foreground">{title}</span>
                <span className="block text-xs text-muted-foreground">{disabled && disabledHint ? disabledHint : subtitle}</span>
            </span>
            {!disabled && <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
        </>
    );
    if (disabled) {
        return (
            <div className={className} aria-disabled="true">
                {inner}
            </div>
        );
    }
    return (
        <Link href={href} className={className}>
            {inner}
        </Link>
    );
}
