"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { BedDouble, Check, Copy, History, KeyRound, LogIn, LogOut, Phone, Receipt, Search, Users } from "lucide-react";
import { api } from "@/lib/api";
import { useAdminRooms } from "@/hooks/useSwrApi";
import type { Room } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { RoomsSkeleton } from "@/components/ui/Skeleton";
import { FeatureGuard } from "@/components/admin/FeatureGuard";
import { RoomStayHistoryModal } from "@/components/admin/RoomStayHistoryModal";
import { cn } from "@/lib/utils";
import { CheckinModal } from "./CheckinModal";
import { ChangePinModal } from "./ChangePinModal";
import { formatCheckIn, nightsSince } from "./frontDesk";

type Filter = "all" | "occupied" | "vacant";

export default function FrontDeskPage() {
    return (
        <FeatureGuard>
            <FrontDesk />
        </FeatureGuard>
    );
}

function FrontDesk() {
    const { data: rooms = [], isLoading, mutate: mutateRooms } = useAdminRooms();
    const [filter, setFilter] = useState<Filter>("all");
    const [search, setSearch] = useState("");
    const [checkinRoom, setCheckinRoom] = useState<Room | null>(null);
    const [checkoutRoom, setCheckoutRoom] = useState<Room | null>(null);
    const [pinRoom, setPinRoom] = useState<Room | null>(null);
    const [billRoom, setBillRoom] = useState<Room | null>(null);

    const occupied = rooms.filter((r) => r.isOccupied).length;
    const vacant = rooms.length - occupied;
    const groupCount = new Set(rooms.map((r) => r.activeStay?.groupStayId).filter(Boolean)).size;
    const query = search.trim().toLowerCase();

    const visible = useMemo(
        () =>
            rooms
                .filter((r) => filter === "all" || (filter === "occupied" ? r.isOccupied : !r.isOccupied))
                .filter(
                    (r) =>
                        !query ||
                        r.number.toLowerCase().includes(query) ||
                        r.activeStay?.guestName?.toLowerCase().includes(query) ||
                        r.activeStay?.guestPhone?.includes(query),
                )
                .sort((a, b) => a.number.localeCompare(b.number, undefined, { numeric: true })),
        [rooms, filter, query],
    );

    if (isLoading) return <RoomsSkeleton />;

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-[env(safe-area-inset-bottom,0px)]">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div className="min-w-0">
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[28px]">Front desk</h1>
                    <p className="mt-1 text-sm text-muted-foreground">Check guests in and out, hand out PINs and print stay bills.</p>
                </div>
            </div>

            {rooms.length === 0 ? (
                <EmptyState
                    icon={BedDouble}
                    title="No rooms yet"
                    description="Add your rooms first. Once they exist you can check guests in from here."
                    action={
                        <Link
                            href="/rooms"
                            className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                        >
                            Go to Rooms &amp; QR
                        </Link>
                    }
                />
            ) : (
                <>
                    <div className="grid grid-cols-3 gap-3">
                        <Stat label="In house" value={occupied} hint={`of ${rooms.length} rooms`} tone="emerald" />
                        <Stat label="Vacant" value={vacant} hint="ready to check in" />
                        <Stat label="Group bookings" value={groupCount} hint="checked in now" />
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div role="group" aria-label="Filter" className="inline-flex w-full rounded-xl border border-border bg-panel p-1 sm:w-auto">
                            {(
                                [
                                    { id: "all", label: "All", count: rooms.length },
                                    { id: "occupied", label: "In house", count: occupied },
                                    { id: "vacant", label: "Vacant", count: vacant },
                                ] as const
                            ).map((chip) => (
                                <button
                                    key={chip.id}
                                    type="button"
                                    aria-pressed={filter === chip.id}
                                    onClick={() => setFilter(chip.id)}
                                    className={cn(
                                        "flex h-9 flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors sm:flex-none",
                                        filter === chip.id ? "bg-secondary text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                                    )}
                                >
                                    {chip.label}
                                    <span
                                        className={cn(
                                            "rounded-md px-1.5 py-0.5 text-[11px] tabular-nums",
                                            filter === chip.id ? "bg-background text-foreground" : "bg-secondary/60 text-muted-foreground",
                                        )}
                                    >
                                        {chip.count}
                                    </span>
                                </button>
                            ))}
                        </div>
                        <div className="relative w-full sm:w-72">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="search"
                                enterKeyHint="search"
                                placeholder="Room, guest name or phone"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="h-10 w-full rounded-xl border border-border bg-panel pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/40"
                            />
                        </div>
                    </div>

                    {visible.length === 0 ? (
                        <EmptyState
                            icon={Search}
                            title={query ? "No rooms match" : filter === "occupied" ? "No guests in house" : "Every room is occupied"}
                            description={query ? `Nothing found for "${search.trim()}".` : undefined}
                            action={
                                <Button
                                    variant="outline"
                                    className="h-10"
                                    onClick={() => {
                                        setSearch("");
                                        setFilter("all");
                                    }}
                                >
                                    Show all rooms
                                </Button>
                            }
                        />
                    ) : (
                        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                            {visible.map((room) =>
                                room.isOccupied ? (
                                    <OccupiedCard
                                        key={room.id}
                                        room={room}
                                        onBill={() => setBillRoom(room)}
                                        onCheckout={() => setCheckoutRoom(room)}
                                        onChangePin={() => setPinRoom(room)}
                                    />
                                ) : (
                                    <VacantCard key={room.id} room={room} onCheckin={() => setCheckinRoom(room)} onHistory={() => setBillRoom(room)} />
                                ),
                            )}
                        </ul>
                    )}
                </>
            )}

            <CheckinModal room={checkinRoom} rooms={rooms} onClose={() => setCheckinRoom(null)} onCheckedIn={() => mutateRooms()} />
            <ChangePinModal room={pinRoom} onClose={() => setPinRoom(null)} onChanged={() => mutateRooms()} />
            <CheckoutModal room={checkoutRoom} onClose={() => setCheckoutRoom(null)} onCheckedOut={() => mutateRooms()} onOpenBill={(r) => setBillRoom(r)} />
            <RoomStayHistoryModal
                isOpen={!!billRoom}
                onClose={() => {
                    setBillRoom(null);
                    // The bill can check out a whole group, so occupancy may have changed.
                    void mutateRooms();
                }}
                room={billRoom}
            />
        </div>
    );
}

function Stat({ label, value, hint, tone }: { label: string; value: number; hint: string; tone?: "emerald" }) {
    return (
        <div className="rounded-2xl border border-border bg-panel px-4 py-3">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className={cn("mt-1 text-2xl font-semibold tabular-nums", tone === "emerald" ? "text-emerald-600 dark:text-emerald-400" : "text-foreground")}>
                {value}
            </p>
            <p className="truncate text-[11px] text-muted-foreground">{hint}</p>
        </div>
    );
}

function RoomHeading({ room, badge }: { room: Room; badge: React.ReactNode }) {
    return (
        <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
                <p className="text-xl font-semibold tabular-nums text-foreground">Room {room.number}</p>
                {room.floor && <p className="text-xs text-muted-foreground">Floor {room.floor}</p>}
            </div>
            {badge}
        </div>
    );
}

function OccupiedCard({
    room,
    onBill,
    onCheckout,
    onChangePin,
}: {
    room: Room;
    onBill: () => void;
    onCheckout: () => void;
    onChangePin: () => void;
}) {
    const [copied, setCopied] = useState(false);
    const stay = room.activeStay;
    const since = formatCheckIn(stay?.checkInAt ?? room.checkedInAt);
    const nights = nightsSince(stay?.checkInAt ?? room.checkedInAt);

    async function copyPin() {
        if (!room.currentPin) return;
        try {
            await navigator.clipboard.writeText(room.currentPin);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error("Could not copy the PIN");
        }
    }

    return (
        <li className="flex flex-col rounded-2xl border border-emerald-500/25 bg-panel p-4">
            <RoomHeading
                room={room}
                badge={
                    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        In house
                    </span>
                }
            />

            <div className="mt-3 min-w-0 space-y-1">
                <p className="truncate text-sm font-medium text-foreground">{stay?.guestName?.trim() || "Guest"}</p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    {since && (
                        <span>
                            In {since}
                            {nights > 0 ? ` · ${nights} night${nights === 1 ? "" : "s"}` : ""}
                        </span>
                    )}
                    {stay?.guestPhone && (
                        <a href={`tel:${stay.guestPhone}`} className="inline-flex items-center gap-1 hover:text-foreground">
                            <Phone className="h-3 w-3" />
                            {stay.guestPhone}
                        </a>
                    )}
                </div>
                {stay?.groupStayId && (
                    <span className="inline-flex items-center gap-1 rounded-md border border-blue-500/20 bg-blue-500/10 px-1.5 py-0.5 text-[11px] font-medium text-blue-600 dark:text-blue-400">
                        <Users className="h-3 w-3" />
                        {stay.isPrimaryRoom ? "Group booking · lead room" : "Group booking"}
                    </span>
                )}
            </div>

            <div className="mt-3 flex items-center justify-between gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2">
                <div className="flex items-center gap-2">
                    <KeyRound className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <span className="text-[11px] text-muted-foreground">PIN</span>
                    <span className="font-mono text-lg font-bold tracking-[0.2em] text-foreground">{room.currentPin || "—"}</span>
                </div>
                <div className="flex items-center gap-0.5">
                    {room.currentPin && (
                        <button
                            type="button"
                            onClick={() => void copyPin()}
                            aria-label="Copy PIN"
                            title="Copy PIN"
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-amber-500/10 hover:text-foreground"
                        >
                            {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={onChangePin}
                        className="h-8 rounded-lg px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-amber-500/10 hover:text-foreground"
                    >
                        Change
                    </button>
                </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 pt-1">
                <Button variant="outline" className="h-10 text-sm" onClick={onBill}>
                    <Receipt className="mr-1.5 h-4 w-4" /> Bill
                </Button>
                <Button variant="destructive" className="h-10 text-sm" onClick={onCheckout}>
                    <LogOut className="mr-1.5 h-4 w-4" /> Check out
                </Button>
            </div>
        </li>
    );
}

function VacantCard({ room, onCheckin, onHistory }: { room: Room; onCheckin: () => void; onHistory: () => void }) {
    return (
        <li className="flex flex-col rounded-2xl border border-border bg-panel p-4">
            <RoomHeading
                room={room}
                badge={
                    <span className="inline-flex shrink-0 items-center rounded-full border border-border bg-secondary px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                        Vacant
                    </span>
                }
            />
            <p className="mt-3 flex-1 text-xs text-muted-foreground">Ready for the next guest.</p>
            <div className="mt-4 flex gap-2">
                <Button className="h-10 flex-1 bg-emerald-600 text-sm text-white hover:bg-emerald-700" onClick={onCheckin}>
                    <LogIn className="mr-1.5 h-4 w-4" /> Check in
                </Button>
                <Button variant="outline" className="h-10 px-3" onClick={onHistory} aria-label={`Past stays in room ${room.number}`} title="Past stays and bills">
                    <History className="h-4 w-4" />
                </Button>
            </div>
        </li>
    );
}

function CheckoutModal({
    room,
    onClose,
    onCheckedOut,
    onOpenBill,
}: {
    room: Room | null;
    onClose: () => void;
    onCheckedOut: () => Promise<unknown>;
    onOpenBill: (room: Room) => void;
}) {
    const [saving, setSaving] = useState(false);

    async function confirm() {
        if (!room) return;
        setSaving(true);
        try {
            await api.checkoutRoom(room.id);
            await onCheckedOut();
            toast.success(`Room ${room.number} checked out`);
            onClose();
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Could not check out");
        } finally {
            setSaving(false);
        }
    }

    const inGroup = Boolean(room?.activeStay?.groupStayId);

    return (
        <AnimatePresence>
            {room && (
                <div
                    className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm pb-[env(safe-area-inset-bottom,0px)]"
                    onClick={() => !saving && onClose()}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 8 }}
                        transition={{ duration: 0.18 }}
                        onClick={(e) => e.stopPropagation()}
                        role="alertdialog"
                        aria-modal="true"
                        aria-labelledby="checkout-title"
                        className="w-full max-w-sm bg-card border border-border rounded-t-2xl sm:rounded-2xl shadow-2xl"
                    >
                        <div className="flex items-start gap-3 p-5">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                                <LogOut className="h-5 w-5" />
                            </span>
                            <div className="min-w-0">
                                <h3 id="checkout-title" className="font-semibold text-foreground">
                                    Check out room {room.number}?
                                </h3>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    The guest&apos;s PIN stops working and the stay is closed. Print the bill first if the guest needs one.
                                </p>
                                {inGroup && (
                                    <p className="mt-2 text-xs text-muted-foreground">
                                        This room is part of a group booking. Only this room is checked out; to check out the whole group, use the bill.
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 gap-2 border-t border-border p-4 sm:grid-cols-3">
                            <Button variant="outline" className="min-h-11" onClick={onClose} disabled={saving}>
                                Cancel
                            </Button>
                            <Button
                                variant="outline"
                                className="min-h-11"
                                disabled={saving}
                                onClick={() => {
                                    onClose();
                                    onOpenBill(room);
                                }}
                            >
                                <Receipt className="mr-1.5 h-4 w-4" /> Bill
                            </Button>
                            <Button className="min-h-11 bg-rose-600 text-white hover:bg-rose-700" loading={saving} onClick={() => void confirm()}>
                                Check out
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
