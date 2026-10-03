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
    ClipboardList,
    Headset,
    Sparkles,
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

    const occupancyPct = rooms.length === 0 ? 0 : Math.round((occupied / rooms.length) * 100);
    const highlight = attention[0];

    return (
        <div className="pb-[env(safe-area-inset-bottom,0px)] text-zinc-100 animate-in fade-in duration-500">
            <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
                <div className="min-w-0 space-y-8">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                            <p className="text-sm text-zinc-500">Dashboard</p>
                            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                                {hotel?.name || "Your hotel"}
                            </h1>
                            <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-400">
                                {greeting(timeZone)}
                                {firstName ? `, ${firstName}` : ""}. {longDate(timeZone)}. Rooms, orders and the menu, in one place.
                            </p>
                            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-zinc-400">
                                {isOrderingEnabled && (
                                    <span className="inline-flex items-center gap-2">
                                        <ClipboardList className="h-4 w-4" />
                                        {openOrders.length} open orders
                                    </span>
                                )}
                                <span className="inline-flex items-center gap-2">
                                    <BedDouble className="h-4 w-4" />
                                    {occupied}/{rooms.length} rooms occupied
                                </span>
                                <span className="inline-flex items-center gap-2">
                                    <Utensils className="h-4 w-4" />
                                    {menuItems} menu items
                                </span>
                            </div>
                        </div>

                        <div className="w-full shrink-0 rounded-2xl border border-white/[0.08] bg-[#16161a] p-5 lg:w-[280px]">
                            <p className="text-[11px] font-medium tracking-[0.18em] text-zinc-500">OCCUPANCY</p>
                            <p className="mt-2 text-4xl font-semibold tabular-nums text-white">{occupancyPct}%</p>
                            <p className="mt-1 text-xs text-zinc-500">
                                {occupied} of {rooms.length} rooms occupied
                            </p>
                            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
                                <div className="h-full rounded-full bg-zinc-100" style={{ width: `${occupancyPct}%` }} />
                            </div>
                            <div className="mt-4 grid grid-cols-2 gap-2">
                                {isOrderingEnabled ? (
                                    <>
                                        <RailLink href="/kitchen">Kitchen</RailLink>
                                        <RailLink href="/orders" emphasis>Orders</RailLink>
                                    </>
                                ) : (
                                    <>
                                        <RailLink href="/menu">Menu</RailLink>
                                        <RailLink href="/rooms" emphasis>Rooms</RailLink>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {isOrderingEnabled && (
                        <section>
                            <h2 className="text-lg font-semibold text-white">Today</h2>
                            <div className="mt-3 rounded-2xl border border-white/[0.08] bg-[#141416] p-5 sm:p-6">
                                <p className="text-sm leading-relaxed text-zinc-400">
                                    {pipelineTotal === 0
                                        ? "No orders yet today. They show up here as soon as a guest scans the QR card in their room."
                                        : `${pipelineTotal} orders so far, ${money(todayRevenue)} in. ${change.text}.`}
                                    {cancelledToday > 0 ? ` ${cancelledToday} cancelled.` : ""}
                                </p>
                                {pipelineTotal > 0 && (
                                    <>
                                        <div className="mt-5 flex h-1.5 overflow-hidden rounded-full bg-white/10">
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
                                                    <li key={step.status} className="flex items-center gap-2 text-xs text-zinc-400">
                                                        <span className={cn("h-2 w-2 rounded-full", step.bar)} />
                                                        <span className="font-medium tabular-nums text-zinc-100">{count}</span>
                                                        {step.label}
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </>
                                )}
                                <div className="mt-5 text-center">
                                    <Link href="/orders" className="inline-flex cursor-pointer items-center gap-1 text-sm text-zinc-300 hover:text-white">
                                        View orders <ArrowRight className="h-3.5 w-3.5" />
                                    </Link>
                                </div>
                            </div>
                        </section>
                    )}

                    {isOrderingEnabled && (
                        <section>
                            <div className="mb-3 flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-white">Recent orders</h2>
                                <Link href="/orders" className="cursor-pointer text-sm text-zinc-400 hover:text-white">
                                    View all
                                </Link>
                            </div>
                            <div className="space-y-2 md:hidden">
                                {recent.map((order) => (
                                    <Link
                                        key={order.id}
                                        href="/orders"
                                        className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-white/[0.08] bg-[#141416] p-4"
                                    >
                                        <div className="min-w-0">
                                            <p className="font-medium text-white">
                                                #{order.orderNumber}
                                                <span className="font-normal text-zinc-400"> · Room {order.room?.number ?? "—"}</span>
                                            </p>
                                            <p className="mt-0.5 truncate text-xs text-zinc-500">
                                                {itemSummary(order)} · {clockTime(order.createdAt, timeZone)}
                                            </p>
                                        </div>
                                        <div className="shrink-0 text-right">
                                            <p className="text-sm font-medium tabular-nums text-white">{money(orderTotal(order))}</p>
                                            <StatusBadge status={order.status} />
                                        </div>
                                    </Link>
                                ))}
                                {recent.length === 0 && <EmptyOrders />}
                            </div>
                            <div className="hidden overflow-hidden rounded-2xl border border-white/[0.08] bg-[#141416] md:block">
                                <table className="w-full text-left text-sm">
                                    <thead className="border-b border-white/[0.06] text-zinc-500">
                                        <tr>
                                            <th className="px-5 py-3 font-medium">Order</th>
                                            <th className="px-5 py-3 font-medium">Room</th>
                                            <th className="px-5 py-3 font-medium">Items</th>
                                            <th className="px-5 py-3 font-medium">Time</th>
                                            <th className="px-5 py-3 font-medium">Status</th>
                                            <th className="px-5 py-3 text-right font-medium">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/[0.06]">
                                        {recent.map((order) => (
                                            <tr key={order.id} className="transition-colors hover:bg-white/[0.03]">
                                                <td className="px-5 py-3.5 font-medium tabular-nums text-white">#{order.orderNumber}</td>
                                                <td className="px-5 py-3.5 text-zinc-400">{order.room?.number ?? "—"}</td>
                                                <td className="max-w-[16rem] truncate px-5 py-3.5 text-zinc-400">{itemSummary(order)}</td>
                                                <td className="px-5 py-3.5 tabular-nums text-zinc-400">{clockTime(order.createdAt, timeZone)}</td>
                                                <td className="px-5 py-3.5">
                                                    <StatusBadge status={order.status} />
                                                </td>
                                                <td className="px-5 py-3.5 text-right font-medium tabular-nums text-white">{money(orderTotal(order))}</td>
                                            </tr>
                                        ))}
                                        {recent.length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="px-5 py-12 text-center text-sm text-zinc-500">
                                                    No orders yet. They will appear here as guests order from their rooms.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    )}

                    {!isOrderingEnabled && (
                        <section>
                            <h2 className="text-lg font-semibold text-white">Menu</h2>
                            <div className="mt-3 rounded-2xl border border-white/[0.08] bg-[#141416] p-5 sm:p-6">
                                <p className="text-sm leading-relaxed text-zinc-400">
                                    Digital ordering is off. Guests can still browse {menuItems} items
                                    {categoryCount > 0 ? ` across ${categoryCount} categories` : ""} from the QR card in their room.
                                </p>
                                <div className="mt-5 text-center">
                                    <Link href="/menu" className="inline-flex cursor-pointer items-center gap-1 text-sm text-zinc-300 hover:text-white">
                                        Update menu <ArrowRight className="h-3.5 w-3.5" />
                                    </Link>
                                </div>
                            </div>
                        </section>
                    )}
                </div>

                <aside className="space-y-4 xl:sticky xl:top-6">
                    <div className="rounded-2xl bg-gradient-to-b from-[#e8b931] via-[#e8b931]/25 to-white/10 p-px">
                        <div className="rounded-[15px] bg-[#14110c] p-5">
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-zinc-300">
                                <Sparkles className="h-3 w-3 text-[#e8b931]" />
                                {highlight ? "Needs a look" : "Today"}
                            </span>
                            <h2 className="mt-4 text-xl font-semibold leading-snug text-white">
                                {highlight
                                    ? highlight.text
                                    : isOrderingEnabled
                                      ? `${money(todayRevenue)} in today`
                                      : "Your menu is live for guests"}
                            </h2>
                            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                                {highlight
                                    ? "Open the queue and clear it before the next one lands."
                                    : isOrderingEnabled
                                      ? change.text
                                      : `${menuItems} dishes ready to scan from any room.`}
                            </p>
                            {attention.length > 1 && (
                                <ul className="mt-3 space-y-1.5">
                                    {attention.slice(1).map((item) => (
                                        <li key={item.text}>
                                            <Link href={item.href} className="cursor-pointer text-sm text-zinc-300 hover:text-white">
                                                {item.text}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            <Link
                                href={highlight?.href ?? (isOrderingEnabled ? "/orders" : "/menu")}
                                className="mt-5 flex h-11 cursor-pointer items-center justify-center rounded-lg bg-[#e8b931] text-sm font-semibold text-black transition-colors hover:bg-[#f0c64a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e8b931]"
                            >
                                {highlight ? "Open queue" : isOrderingEnabled ? "View orders" : "Update menu"}
                            </Link>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-white/[0.08] bg-[#141416] p-5">
                        <h2 className="font-semibold text-white">Shortcuts</h2>
                        <div className="mt-3 space-y-1">
                            <Shortcut href="/menu" icon={Utensils} label="Update menu" />
                            <Shortcut href="/rooms" icon={BedDouble} label="Rooms and QR cards" />
                            {isOrderingEnabled && <Shortcut href="/orders" icon={ClipboardList} label="Orders" />}
                            {isRequestsEnabled && <Shortcut href="/services" icon={Headset} label="Guest requests" />}
                            {isStaffEnabled && (
                                <Shortcut
                                    href="/staff"
                                    icon={Users}
                                    label="Staff"
                                    disabled={admin?.role !== "OWNER" && admin?.role !== "GENERAL_MANAGER"}
                                />
                            )}
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}

function RailLink({ href, children, emphasis }: { href: string; children: React.ReactNode; emphasis?: boolean }) {
    return (
        <Link
            href={href}
            className={cn(
                "flex h-9 cursor-pointer items-center justify-center rounded-lg text-sm font-medium text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40",
                emphasis ? "bg-[#3a3a42] hover:bg-[#46464f]" : "bg-[#2a2a30] hover:bg-[#34343b]",
            )}
        >
            {children}
        </Link>
    );
}

function Shortcut({
    href,
    icon: Icon,
    label,
    disabled,
}: {
    href: string;
    icon: ComponentType<{ className?: string }>;
    label: string;
    disabled?: boolean;
}) {
    const className = cn(
        "flex items-center gap-3 rounded-lg px-2 py-2.5 text-sm",
        disabled ? "cursor-not-allowed text-zinc-600" : "cursor-pointer text-zinc-300 hover:bg-white/[0.04] hover:text-white",
    );
    const inner = (
        <>
            <Icon className="h-4 w-4 shrink-0" />
            <span>{disabled ? `${label} · owner only` : label}</span>
        </>
    );
    if (disabled) return <div className={className}>{inner}</div>;
    return (
        <Link href={href} className={className}>
            {inner}
        </Link>
    );
}

function EmptyOrders() {
    return (
        <div className="rounded-2xl border border-white/[0.08] bg-[#141416] p-8 text-center text-sm text-zinc-500">
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
        PLACED: "bg-blue-500/15 text-blue-300",
        CONFIRMED: "bg-indigo-500/15 text-indigo-300",
        PREPARING: "bg-amber-500/15 text-amber-300",
        READY: "bg-emerald-500/15 text-emerald-300",
        DELIVERED: "bg-white/10 text-zinc-300",
        CANCELLED: "bg-red-500/15 text-red-300",
    };
    return (
        <span className={cn("mt-1 inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium", styles[status])}>
            {STATUS_LABEL[status]}
        </span>
    );
}
