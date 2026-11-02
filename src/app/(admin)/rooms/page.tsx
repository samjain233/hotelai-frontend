"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { ArrowRight, BedDouble, ConciergeBell, Plus, Printer, QrCode, Search, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useAdminNavigation, useAdminRooms } from "@/hooks/useSwrApi";
import type { Room } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { RoomsSkeleton } from "@/components/ui/Skeleton";
import { filterVisibleNavItems } from "@/lib/adminNavConfig";
import { cn } from "@/lib/utils";
import { AddRoomsModal } from "./AddRoomsModal";
import { DeleteRoomModal } from "./DeleteRoomModal";
import { QrPrintModal } from "./QrPrintModal";
import { RoomQrModal } from "./RoomQrModal";
import { PropertyQrModal } from "./PropertyQrModal";
import { NO_FLOOR, floorLabel, groupByFloor, resolveQrPrintFrameBackground } from "./qrPrint";

const ALL_FLOORS = "__all__";

export default function RoomsPage() {
    const { data: rooms = [], isLoading, mutate: mutateRooms } = useAdminRooms();
    const { data: navItems } = useAdminNavigation();
    const visibleNav = filterVisibleNavItems(navItems ?? []).filter((item) => !item.isLocked);
    const hasFrontDesk = visibleNav.some((item) => item.href === "/front-desk");
    const canOrder = visibleNav.some((item) => item.href === "/orders");

    const [search, setSearch] = useState("");
    const [floorFilter, setFloorFilter] = useState(ALL_FLOORS);
    const [addRooms, setAddRooms] = useState<{ floor?: string } | null>(null);
    const [printPreselect, setPrintPreselect] = useState<string[] | null | undefined>(undefined);
    const [qrRoom, setQrRoom] = useState<Room | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Room | null>(null);
    const [propertyQrOpen, setPropertyQrOpen] = useState(false);

    const floors = useMemo(() => groupByFloor(rooms, (r) => r.floor), [rooms]);
    const query = search.trim().toLowerCase();
    const visibleFloors = useMemo(
        () =>
            floors
                .filter(([floor]) => floorFilter === ALL_FLOORS || floor === floorFilter)
                .map(([floor, list]) => [floor, list.filter((r) => !query || r.number.toLowerCase().includes(query))] as const)
                .filter(([, list]) => list.length > 0),
        [floors, floorFilter, query],
    );
    const namedFloorCount = floors.filter(([f]) => f !== NO_FLOOR).length;

    async function handleDelete(room: Room) {
        await api.deleteRoom(room.id);
        await mutateRooms();
        toast.success(`Room ${room.number} deleted`);
        setDeleteTarget(null);
    }

    if (isLoading) return <RoomsSkeleton />;

    return (
        <>
            <div className="space-y-6 animate-in fade-in duration-500 print:hidden pb-[env(safe-area-inset-bottom,0px)]">
                {/* Header */}
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div className="min-w-0">
                        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[28px]">Rooms &amp; QR codes</h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {rooms.length === 0
                                ? "Print one QR code for the whole hotel, or add rooms to give each room its own."
                                : `${rooms.length} room${rooms.length === 1 ? "" : "s"}${
                                      namedFloorCount > 0 ? ` across ${namedFloorCount} floor${namedFloorCount === 1 ? "" : "s"}` : ""
                                  } · guests scan a room's card to open your menu`}
                        </p>
                    </div>
                    {rooms.length > 0 && (
                        <div className="flex gap-2 sm:gap-3 shrink-0">
                            <Button variant="secondary" className="flex-1 sm:flex-none min-h-11" onClick={() => setPrintPreselect(null)}>
                                <Printer className="w-4 h-4 mr-2 shrink-0" /> Print QR cards
                            </Button>
                            <Button className="flex-1 sm:flex-none min-h-11" onClick={() => setAddRooms({})}>
                                <Plus className="w-4 h-4 mr-2 shrink-0" /> Add rooms
                            </Button>
                        </div>
                    )}
                </div>

                {hasFrontDesk && rooms.length > 0 && (
                    <Link
                        href="/front-desk"
                        className="group flex items-center gap-3 rounded-xl border border-border bg-panel px-4 py-3 text-sm transition-colors hover:border-brand/40"
                    >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                            <ConciergeBell className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1 text-muted-foreground">
                            <span className="font-medium text-foreground">Checking a guest in or out?</span> Guest PINs, check-ins and stay bills are on
                            Front desk.
                        </span>
                        <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                    </Link>
                )}

                <PropertyQrCard canOrder={canOrder} onOpen={() => setPropertyQrOpen(true)} />

                {rooms.length === 0 ? (
                    <GettingStarted onAdd={() => setAddRooms({})} />
                ) : (
                    <>
                        {/* Toolbar */}
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            {floors.length > 1 ? (
                                <div role="group" aria-label="Floor" className="no-scrollbar -mx-1 overflow-x-auto px-1">
                                    <div className="inline-flex rounded-xl border border-border bg-panel p-1">
                                        {[[ALL_FLOORS, rooms] as const, ...floors].map(([floor, list]) => (
                                            <button
                                                key={floor}
                                                type="button"
                                                aria-pressed={floorFilter === floor}
                                                onClick={() => setFloorFilter(floor)}
                                                className={cn(
                                                    "flex h-9 shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap rounded-lg px-3.5 text-sm font-medium transition-colors",
                                                    floorFilter === floor ? "bg-secondary text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                                                )}
                                            >
                                                {floor === ALL_FLOORS ? "All" : floorLabel(floor)}
                                                <span
                                                    className={cn(
                                                        "rounded-md px-1.5 py-0.5 text-[11px] tabular-nums",
                                                        floorFilter === floor ? "bg-background text-foreground" : "bg-secondary/60 text-muted-foreground",
                                                    )}
                                                >
                                                    {list.length}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <span />
                            )}
                            <div className="relative w-full sm:w-64 shrink-0">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    type="search"
                                    enterKeyHint="search"
                                    placeholder="Find a room"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="h-10 w-full rounded-xl border border-border bg-panel pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/40"
                                />
                            </div>
                        </div>

                        {visibleFloors.length === 0 ? (
                            <EmptyState
                                icon={Search}
                                title="No rooms match"
                                description={`Nothing found for "${search.trim()}"${floorFilter !== ALL_FLOORS ? ` on ${floorLabel(floorFilter).toLowerCase()}` : ""}.`}
                                action={
                                    <Button
                                        variant="outline"
                                        className="h-10"
                                        onClick={() => {
                                            setSearch("");
                                            setFloorFilter(ALL_FLOORS);
                                        }}
                                    >
                                        Show all rooms
                                    </Button>
                                }
                            />
                        ) : (
                            <div className="space-y-5">
                                {visibleFloors.map(([floor, list]) => {
                                    const floorTotal = floors.find(([f]) => f === floor)?.[1].length ?? list.length;
                                    return (
                                        <section key={floor} aria-labelledby={`floor-${floor}`} className="overflow-hidden rounded-2xl border border-border bg-panel">
                                            <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-border px-4 py-3 sm:px-5">
                                                <div className="min-w-0">
                                                    <h2 id={`floor-${floor}`} className="text-sm font-semibold text-foreground">
                                                        {floorLabel(floor)}
                                                    </h2>
                                                    <p className="text-xs tabular-nums text-muted-foreground">
                                                        {floorTotal} room{floorTotal === 1 ? "" : "s"}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 text-xs"
                                                        onClick={() => setPrintPreselect(list.map((r) => r.id))}
                                                    >
                                                        <Printer className="mr-1.5 h-3.5 w-3.5" /> Print {list.length === floorTotal ? "floor" : `${list.length}`}
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 text-xs"
                                                        onClick={() => setAddRooms({ floor: floor === NO_FLOOR ? undefined : floor })}
                                                    >
                                                        <Plus className="mr-1.5 h-3.5 w-3.5" /> Add
                                                    </Button>
                                                </div>
                                            </header>
                                            <ul className="grid grid-cols-3 gap-2 p-3 sm:grid-cols-4 sm:gap-3 sm:p-4 md:grid-cols-6 xl:grid-cols-8">
                                                {list.map((room) => (
                                                    <RoomTile key={room.id} room={room} onOpenQr={() => setQrRoom(room)} onDelete={() => setDeleteTarget(room)} />
                                                ))}
                                            </ul>
                                        </section>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}
            </div>

            <AddRoomsModal
                open={addRooms !== null}
                onClose={() => setAddRooms(null)}
                rooms={rooms}
                defaultFloor={addRooms?.floor}
                onCreated={() => mutateRooms()}
            />
            <DeleteRoomModal room={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} />
            <QrPrintModal open={printPreselect !== undefined} preselectRoomIds={printPreselect ?? null} onClose={() => setPrintPreselect(undefined)} />
            <RoomQrModal room={qrRoom} onClose={() => setQrRoom(null)} />
            <PropertyQrModal open={propertyQrOpen} onClose={() => setPropertyQrOpen(false)} canOrder={canOrder} />
        </>
    );
}

function PropertyQrCard({ canOrder, onOpen }: { canOrder: boolean; onOpen: () => void }) {
    const { hotel } = useAuth();
    // Screen thumbnail only; the printable PNG comes from the server with the same link and colours.
    const previewUrl = hotel?.slug && typeof window !== "undefined" ? `${window.location.origin}/menu/${hotel.slug}` : null;
    const bg = resolveQrPrintFrameBackground(hotel?.qrCodeBackgroundHex);
    const fg = resolveQrPrintFrameBackground(hotel?.qrCodeForegroundHex || "#000000");

    return (
        <section aria-labelledby="property-qr-title" className="flex flex-col gap-4 rounded-2xl border border-border bg-panel p-4 sm:flex-row sm:items-center sm:p-5">
            <button
                type="button"
                onClick={onOpen}
                aria-label="Open hotel QR code"
                className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl p-1.5 ring-1 ring-border transition-shadow hover:ring-brand/50"
                style={{ backgroundColor: bg }}
            >
                {previewUrl ? <QRCodeSVG value={previewUrl} size={68} level="M" bgColor={bg} fgColor={fg} /> : <QrCode className="h-8 w-8 text-zinc-500" />}
            </button>
            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                    <h2 id="property-qr-title" className="text-sm font-semibold text-foreground">
                        Hotel QR code
                    </h2>
                    <span className="rounded-md bg-secondary px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">No room needed</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                    One code for reception, the restaurant, the lobby or your website. It opens your menu without a room attached
                    {canOrder ? "; guests pick their room if they order." : "."}
                </p>
            </div>
            <Button variant="secondary" className="min-h-11 shrink-0" onClick={onOpen}>
                <QrCode className="mr-2 h-4 w-4" /> Get hotel QR
            </Button>
        </section>
    );
}

function RoomTile({ room, onOpenQr, onDelete }: { room: Room; onOpenQr: () => void; onDelete: () => void }) {
    return (
        <li className="group relative">
            <button
                type="button"
                onClick={onOpenQr}
                aria-label={`Room ${room.number}: show QR code`}
                className="flex w-full flex-col items-center gap-1 rounded-xl border border-border bg-canvas/50 px-2 pb-3 pt-4 text-center transition-colors hover:border-brand/40 hover:bg-secondary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
            >
                <span className="text-xl font-semibold tabular-nums text-foreground sm:text-2xl">{room.number}</span>
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground transition-colors group-hover:text-foreground">
                    <QrCode className="h-3 w-3" />
                    {room.type?.trim() ? <span className="uppercase tracking-wide">{room.type}</span> : "QR card"}
                </span>
            </button>
            <button
                type="button"
                onClick={onDelete}
                aria-label={`Delete room ${room.number}`}
                title="Delete room"
                className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground/70 transition-all hover:bg-destructive/10 hover:text-destructive focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
            >
                <Trash2 className="h-3.5 w-3.5" />
            </button>
        </li>
    );
}

function GettingStarted({ onAdd }: { onAdd: () => void }) {
    const steps = [
        { icon: BedDouble, title: "Add your rooms", text: "Type a range like 101-120. Add a floor to keep things tidy." },
        { icon: Printer, title: "Print the QR cards", text: "A4 sheets or A6 table stands, with your hotel name and Wi-Fi." },
        { icon: QrCode, title: "Place one in each room", text: "Guests scan it to open your menu on their phone." },
    ];
    return (
        <div className="rounded-2xl border border-dashed border-border bg-panel/60 px-6 py-10 sm:py-14">
            <div className="mx-auto max-w-2xl text-center">
                <h2 className="text-lg font-semibold text-foreground">Set up your rooms in a few minutes</h2>
                <p className="mt-1.5 text-sm text-muted-foreground">Every room gets its own QR code, so you always know which room a guest is in.</p>
            </div>
            <ol className="mx-auto mt-8 grid max-w-3xl gap-3 sm:grid-cols-3">
                {steps.map((step, i) => (
                    <li key={step.title} className="rounded-xl border border-border bg-canvas/50 p-4">
                        <div className="flex items-center gap-2.5">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10 ring-1 ring-brand/25">
                                <step.icon className="h-4 w-4 text-brand" aria-hidden />
                            </span>
                            <span className="text-xs font-medium tabular-nums text-muted-foreground">Step {i + 1}</span>
                        </div>
                        <p className="mt-3 text-sm font-medium text-foreground">{step.title}</p>
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{step.text}</p>
                    </li>
                ))}
            </ol>
            <div className="mt-8 flex justify-center">
                <Button className="min-h-11" onClick={onAdd}>
                    <Plus className="mr-2 h-4 w-4" /> Add rooms
                </Button>
            </div>
        </div>
    );
}
