"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { api } from "@/lib/api";
import { Room, RoomQr } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { RoomsSkeleton } from "@/components/ui/Skeleton";
import { Input } from "@/components/ui/Input";
import { AnimatePresence, motion } from "framer-motion";
import {
    Plus,
    QrCode,
    Trash2,
    Download,
    X,
    Search,
    Printer,
    Link,
    Check,
    CircleHelp,
    Wifi,
    Hotel,
    Scissors,
    LayoutGrid,
    CheckSquare,
    Square,
    MinusSquare,
} from "lucide-react";
import { parseRoomNumbersInput } from "@/lib/parseRoomNumbersInput";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

type QrLayout = 4 | 6 | 8;

const LAYOUT_OPTIONS: { value: QrLayout; label: string; cols: string; desc: string }[] = [
    { value: 4, label: "Large", cols: "qr-print-cols-2", desc: "4 / page" },
    { value: 6, label: "Medium", cols: "qr-print-cols-3", desc: "6 / page" },
    { value: 8, label: "Compact", cols: "qr-print-cols-4", desc: "8 / page" },
];

export default function RoomsPage() {
    const { hotel } = useAuth();
    const [rooms, setRooms] = useState<Room[]>([]);
    const [qrs, setQrs] = useState<RoomQr[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showQrModal, setShowQrModal] = useState(false);
    const [form, setForm] = useState({ number: "", floor: "" });
    const [search, setSearch] = useState("");
    const [saving, setSaving] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [roomNumberHelpOpen, setRoomNumberHelpOpen] = useState(false);

    // QR print settings
    const [qrLayout, setQrLayout] = useState<QrLayout>(8);
    const [qrTagline, setQrTagline] = useState("Scan to order");
    const [qrWifiName, setQrWifiName] = useState("");
    const [qrWifiPass, setQrWifiPass] = useState("");
    const [qrShowBranding, setQrShowBranding] = useState(true);
    const [qrShowCutGuides, setQrShowCutGuides] = useState(false);
    const [qrSelectedIds, setQrSelectedIds] = useState<Set<string>>(new Set());

    // Single room QR
    const [singleQr, setSingleQr] = useState<RoomQr | null>(null);

    useEffect(() => { loadRooms(); }, []);

    useEffect(() => {
        if (!showModal) setRoomNumberHelpOpen(false);
    }, [showModal]);

    // When QR data arrives, select all rooms by default
    useEffect(() => {
        if (qrs.length > 0) setQrSelectedIds(new Set(qrs.map((q) => q.roomId)));
    }, [qrs]);

    // ─── CRUD ───
    async function loadRooms() {
        try { const r = await api.getRooms(); setRooms(r); }
        catch (err) { console.error(err); }
        finally { setLoading(false); }
    }

    async function handleCreateRoom(e: React.FormEvent) {
        e.preventDefault();
        const { numbers, error: parseError } = parseRoomNumbersInput(form.number);
        if (parseError) { alert(parseError); return; }
        setSaving(true);
        try {
            const floor = form.floor || undefined;
            if (numbers.length === 1) await api.createRoom({ number: numbers[0], floor });
            else await api.createBulkRooms(numbers.map((number) => ({ number, floor })));
            setShowModal(false);
            setForm({ number: "", floor: "" });
            await loadRooms();
        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : "Failed to create rooms");
        } finally { setSaving(false); }
    }

    async function deleteRoom(id: string) {
        if (!confirm("Delete this room?")) return;
        try { await api.deleteRoom(id); await loadRooms(); }
        catch (err: unknown) { alert(err instanceof Error ? err.message : "Failed"); }
    }

    async function showAllQrs() {
        setShowQrModal(true);
        try { const data = await api.getAllRoomQrs(); setQrs(data); }
        catch (err: unknown) { alert(err instanceof Error ? err.message : "Failed"); }
    }

    async function handleSinglePrint(roomId: string) {
        try {
            const qr = await api.getRoomQr(roomId);
            setSingleQr(qr);
        } catch (err: unknown) { alert(err instanceof Error ? err.message : "Failed"); }
    }

    function downloadQr(qr: RoomQr) {
        const a = document.createElement("a");
        a.download = `room-${qr.roomNumber}-qr.png`;
        a.href = qr.qrCode;
        a.click();
    }

    async function copyUrl(qr: RoomQr) {
        try {
            await navigator.clipboard.writeText(qr.menuUrl);
            setCopiedId(qr.roomId);
            setTimeout(() => setCopiedId(null), 2000);
        } catch { alert("Failed to copy URL"); }
    }

    // ─── Selection helpers ───
    const toggleRoom = useCallback((roomId: string) => {
        setQrSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(roomId)) next.delete(roomId); else next.add(roomId);
            return next;
        });
    }, []);

    const toggleFloor = useCallback((floor: string, floorQrs: RoomQr[]) => {
        setQrSelectedIds((prev) => {
            const next = new Set(prev);
            const ids = floorQrs.map((q) => q.roomId);
            const allSelected = ids.every((id) => prev.has(id));
            if (allSelected) ids.forEach((id) => next.delete(id));
            else ids.forEach((id) => next.add(id));
            return next;
        });
    }, []);

    const selectAll = useCallback(() => setQrSelectedIds(new Set(qrs.map((q) => q.roomId))), [qrs]);
    const deselectAll = useCallback(() => setQrSelectedIds(new Set()), []);

    // ─── Derived data ───
    const filteredRooms = rooms.filter((r) => r.number.toLowerCase().includes(search.toLowerCase()));

    const floorGroups = useMemo(() => {
        const groups = new Map<string, RoomQr[]>();
        for (const qr of qrs) {
            const floor = qr.floor?.trim() || "—";
            const list = groups.get(floor) ?? [];
            list.push(qr);
            groups.set(floor, list);
        }
        return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }));
    }, [qrs]);

    const selectedQrs = useMemo(() => qrs.filter((q) => qrSelectedIds.has(q.roomId)), [qrs, qrSelectedIds]);

    const printFloorGroups = useMemo(() => {
        const groups = new Map<string, RoomQr[]>();
        for (const qr of selectedQrs) {
            const floor = qr.floor?.trim() || "—";
            const list = groups.get(floor) ?? [];
            list.push(qr);
            groups.set(floor, list);
        }
        return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }));
    }, [selectedQrs]);

    const layoutCols = LAYOUT_OPTIONS.find((o) => o.value === qrLayout)!.cols;

    if (loading) return <RoomsSkeleton />;

    return (
        <>
        {/* ───── Normal page (hidden when printing) ───── */}
        <div className="space-y-8 animate-in fade-in duration-500 print:hidden">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Rooms & QR Codes</h1>
                    <p className="text-muted-foreground mt-1">Manage physical spaces and digital access points</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={showAllQrs}>
                        <QrCode className="w-4 h-4 mr-2" /> Batch QR
                    </Button>
                    <Button onClick={() => setShowModal(true)}>
                        <Plus className="w-4 h-4 mr-2" /> Add Room
                    </Button>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex justify-between items-center border-b border-border pb-6">
                <div className="relative w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search by room number..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-secondary/50 border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                </div>
                <div className="text-sm text-muted-foreground">
                    Total Rooms: <span className="font-semibold text-foreground">{rooms.length}</span>
                </div>
            </div>

            {/* Room Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-6">
                <AnimatePresence>
                    {filteredRooms.map((room) => (
                        <motion.div
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            key={room.id}
                            className="dashboard-card p-6 flex flex-col items-center text-center group relative hover:border-primary/50"
                        >
                            <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center text-2xl font-bold text-primary mb-3 shadow-inner">
                                {room.number}
                            </div>
                            <h3 className="font-semibold text-foreground">Room {room.number}</h3>
                            {room.type?.trim() ? (
                                <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">{room.type}</p>
                            ) : null}
                            {room.floor && (
                                <span className="mt-3 text-xs bg-secondary px-2 py-0.5 rounded text-muted-foreground">
                                    Floor {room.floor}
                                </span>
                            )}

                            {/* Hover actions */}
                            <button
                                onClick={() => handleSinglePrint(room.id)}
                                title="Print QR"
                                className="absolute top-3 left-3 p-1.5 text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <QrCode className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => deleteRoom(room.id)}
                                className="absolute top-3 right-3 p-1.5 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Add Room Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}>
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-sm bg-card border border-border rounded-xl shadow-2xl">
                            <div className="flex justify-between items-center p-5 border-b border-border bg-muted/20">
                                <h3 className="font-semibold text-foreground">Add Room</h3>
                                <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
                            </div>
                            <form onSubmit={handleCreateRoom} className="p-6 space-y-4">
                                <div className="space-y-1.5">
                                    <div
                                        className="relative"
                                        onMouseEnter={() => setRoomNumberHelpOpen(true)}
                                        onMouseLeave={() => setRoomNumberHelpOpen(false)}
                                    >
                                        <div className="flex items-center gap-1.5">
                                            <label htmlFor="add-room-numbers" className="text-xs font-medium text-muted-foreground">Room number(s)</label>
                                            <button type="button" className="rounded-full p-0.5 text-muted-foreground outline-none hover:text-foreground" aria-label="Room number format help" aria-expanded={roomNumberHelpOpen}>
                                                <CircleHelp className="w-4 h-4 shrink-0" aria-hidden />
                                            </button>
                                        </div>
                                        {roomNumberHelpOpen && (
                                            <div role="tooltip" className="absolute left-0 top-full z-[100] mt-1.5 w-full min-w-[16rem] max-w-[min(18rem,calc(100vw-3rem))] rounded-lg border border-border bg-popover px-3 py-2.5 text-left text-popover-foreground shadow-xl shadow-black/15">
                                                <p className="text-[11px] font-semibold text-foreground mb-2">Formats &amp; examples</p>
                                                <ul className="text-[11px] text-muted-foreground space-y-1.5 list-none">
                                                    <li><span className="font-medium text-foreground">One room:</span>{" "}<code className="rounded bg-secondary px-1 py-0.5 text-foreground">101</code></li>
                                                    <li><span className="font-medium text-foreground">List:</span>{" "}<code className="rounded bg-secondary px-1 py-0.5 text-foreground">101, 102, 105</code></li>
                                                    <li><span className="font-medium text-foreground">Range:</span>{" "}<code className="rounded bg-secondary px-1 py-0.5 text-foreground">101-105</code><span className="block pt-0.5 text-[10px]">→ creates 101, 102, … 105</span></li>
                                                    <li><span className="font-medium text-foreground">Combined:</span>{" "}<code className="rounded bg-secondary px-1 py-0.5 text-foreground">101-103, 201</code></li>
                                                </ul>
                                                <p className="mt-2 border-t border-border pt-2 text-[10px] leading-relaxed text-muted-foreground">
                                                    Optional <strong className="text-foreground">floor</strong> applies to every room in this batch. Max <strong className="text-foreground">100</strong> rooms per save.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                    <Input id="add-room-numbers" placeholder="101  or  101,102,105  or  101-105" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} required autoComplete="off" />
                                </div>
                                <Input placeholder="Floor (Optional) — applies to all" value={form.floor} onChange={(e) => setForm({ ...form, floor: e.target.value })} />
                                <div className="flex gap-3 pt-2">
                                    <Button type="button" variant="outline" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
                                    <Button type="submit" loading={saving} className="flex-1">
                                        {(() => { const { numbers } = parseRoomNumbersInput(form.number); return numbers.length > 1 ? `Add ${numbers.length} rooms` : "Add room"; })()}
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>

        {/* ───── Batch QR Modal (visible for print) ───── */}
        <AnimatePresence>
            {showQrModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm print:static print:inset-auto print:min-h-0 print:bg-transparent print:backdrop-blur-0" onClick={() => setShowQrModal(false)}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        onClick={(e) => e.stopPropagation()}
                        className="flex h-[92vh] w-full max-w-[1200px] mx-4 rounded-xl border border-border bg-card shadow-2xl overflow-hidden print:h-auto print:max-w-none print:mx-0 print:rounded-none print:border-0 print:bg-white print:shadow-none"
                    >
                        {/* ── Sidebar (screen only) ── */}
                        <aside className="w-[280px] shrink-0 border-r border-border bg-muted/30 flex flex-col overflow-hidden print:hidden">
                            <div className="p-4 border-b border-border">
                                <h3 className="text-base font-semibold text-foreground">QR Print Settings</h3>
                                <p className="text-xs text-muted-foreground mt-0.5">Customize before printing</p>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-5 text-sm">
                                {/* Layout */}
                                <div>
                                    <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-2">
                                        <LayoutGrid className="w-3.5 h-3.5" /> Layout
                                    </label>
                                    <div className="grid grid-cols-3 gap-1.5">
                                        {LAYOUT_OPTIONS.map((opt) => (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() => setQrLayout(opt.value)}
                                                className={cn(
                                                    "rounded-lg border px-2 py-2 text-center transition-all",
                                                    qrLayout === opt.value
                                                        ? "border-primary bg-primary/10 text-primary"
                                                        : "border-border bg-secondary/50 text-muted-foreground hover:border-primary/40",
                                                )}
                                            >
                                                <span className="block text-xs font-semibold">{opt.label}</span>
                                                <span className="block text-[10px] opacity-70">{opt.desc}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Tagline */}
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Tagline</label>
                                    <input
                                        type="text"
                                        value={qrTagline}
                                        onChange={(e) => setQrTagline(e.target.value)}
                                        placeholder="Scan to order"
                                        className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                    />
                                </div>

                                {/* WiFi */}
                                <div>
                                    <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1.5">
                                        <Wifi className="w-3.5 h-3.5" /> WiFi (optional)
                                    </label>
                                    <div className="space-y-1.5">
                                        <input
                                            type="text"
                                            value={qrWifiName}
                                            onChange={(e) => setQrWifiName(e.target.value)}
                                            placeholder="Network name"
                                            className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                        />
                                        <input
                                            type="text"
                                            value={qrWifiPass}
                                            onChange={(e) => setQrWifiPass(e.target.value)}
                                            placeholder="Password"
                                            className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                        />
                                    </div>
                                </div>

                                {/* Toggles */}
                                <div className="space-y-2">
                                    <button
                                        type="button"
                                        onClick={() => setQrShowBranding(!qrShowBranding)}
                                        className="flex w-full items-center gap-2.5 rounded-lg border border-border bg-secondary/30 px-3 py-2 text-xs transition-colors hover:bg-secondary/60"
                                    >
                                        <Hotel className="w-3.5 h-3.5 text-muted-foreground" />
                                        <span className="flex-1 text-left text-foreground">Hotel branding</span>
                                        <span className={cn("w-8 h-4.5 rounded-full transition-colors relative", qrShowBranding ? "bg-primary" : "bg-secondary")}>
                                            <span className={cn("absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow transition-all", qrShowBranding ? "left-[calc(100%-0.625rem)]" : "left-0.5")} />
                                        </span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setQrShowCutGuides(!qrShowCutGuides)}
                                        className="flex w-full items-center gap-2.5 rounded-lg border border-border bg-secondary/30 px-3 py-2 text-xs transition-colors hover:bg-secondary/60"
                                    >
                                        <Scissors className="w-3.5 h-3.5 text-muted-foreground" />
                                        <span className="flex-1 text-left text-foreground">Cut guides</span>
                                        <span className={cn("w-8 h-4.5 rounded-full transition-colors relative", qrShowCutGuides ? "bg-primary" : "bg-secondary")}>
                                            <span className={cn("absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow transition-all", qrShowCutGuides ? "left-[calc(100%-0.625rem)]" : "left-0.5")} />
                                        </span>
                                    </button>
                                </div>

                                {/* Room selection */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-xs font-medium text-muted-foreground">Rooms</label>
                                        <div className="flex gap-1">
                                            <button type="button" onClick={selectAll} className="text-[10px] text-primary hover:underline">All</button>
                                            <span className="text-[10px] text-muted-foreground">/</span>
                                            <button type="button" onClick={deselectAll} className="text-[10px] text-primary hover:underline">None</button>
                                        </div>
                                    </div>
                                    <div className="space-y-2 max-h-[200px] overflow-y-auto rounded-lg border border-border bg-secondary/20 p-2">
                                        {floorGroups.map(([floor, floorQrs]) => {
                                            const floorIds = floorQrs.map((q) => q.roomId);
                                            const allChecked = floorIds.every((id) => qrSelectedIds.has(id));
                                            const someChecked = !allChecked && floorIds.some((id) => qrSelectedIds.has(id));
                                            return (
                                                <div key={floor}>
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleFloor(floor, floorQrs)}
                                                        className="flex w-full items-center gap-1.5 py-1 text-xs font-semibold text-foreground hover:text-primary"
                                                    >
                                                        {allChecked ? <CheckSquare className="w-3.5 h-3.5 text-primary" /> : someChecked ? <MinusSquare className="w-3.5 h-3.5 text-primary/60" /> : <Square className="w-3.5 h-3.5 text-muted-foreground" />}
                                                        {floor === "—" ? "No floor" : `Floor ${floor}`}
                                                        <span className="text-[10px] font-normal text-muted-foreground ml-auto">{floorQrs.length}</span>
                                                    </button>
                                                    <div className="ml-5 flex flex-wrap gap-1 pb-1">
                                                        {floorQrs.map((qr) => (
                                                            <button
                                                                key={qr.roomId}
                                                                type="button"
                                                                onClick={() => toggleRoom(qr.roomId)}
                                                                className={cn(
                                                                    "rounded px-2 py-0.5 text-[11px] font-medium border transition-all",
                                                                    qrSelectedIds.has(qr.roomId)
                                                                        ? "bg-primary/10 border-primary/30 text-primary"
                                                                        : "bg-secondary/50 border-border text-muted-foreground hover:border-primary/30",
                                                                )}
                                                            >
                                                                {qr.roomNumber}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <p className="text-[10px] text-muted-foreground mt-1">{qrSelectedIds.size} of {qrs.length} selected</p>
                                </div>
                            </div>

                            {/* Print button */}
                            <div className="p-4 border-t border-border space-y-2">
                                <Button className="w-full" onClick={() => window.print()} disabled={qrSelectedIds.size === 0}>
                                    <Printer className="w-4 h-4 mr-2" /> Print {qrSelectedIds.size > 0 ? `${qrSelectedIds.size} QR${qrSelectedIds.size > 1 ? "s" : ""}` : ""}
                                </Button>
                                <button type="button" onClick={() => setShowQrModal(false)} className="w-full text-xs text-muted-foreground hover:text-foreground py-1.5 transition-colors">
                                    Close
                                </button>
                            </div>
                        </aside>

                        {/* ── Main QR grid (screen + print) ── */}
                        <div className="flex-1 flex flex-col min-w-0 overflow-hidden print:overflow-visible">
                            {/* Screen header */}
                            <div className="flex items-center justify-between border-b border-border p-4 print:hidden">
                                <div>
                                    <h3 className="text-lg font-semibold text-foreground">Room QR Codes</h3>
                                    <p className="text-xs text-muted-foreground">Preview — {selectedQrs.length} room{selectedQrs.length !== 1 ? "s" : ""}</p>
                                </div>
                                <button type="button" onClick={() => setShowQrModal(false)} aria-label="Close">
                                    <X className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
                                </button>
                            </div>

                            {/* Print-only header */}
                            <div className="hidden print:block px-4 pt-4 pb-2">
                                {qrShowBranding && hotel?.name && (
                                    <div className="flex items-center justify-center gap-3 mb-2">
                                        {hotel.logoUrl?.trim() && (
                                            <img src={hotel.logoUrl.trim()} alt="" className="w-8 h-8 rounded-lg object-cover" />
                                        )}
                                        <span className="text-lg font-bold text-black">{hotel.name}</span>
                                    </div>
                                )}
                                <p className="text-center text-sm text-neutral-500 mb-1">Room QR Codes</p>
                            </div>

                            {/* QR grid */}
                            <div className="flex-1 overflow-y-auto bg-secondary/20 p-6 print:overflow-visible print:bg-white print:p-2">
                                {printFloorGroups.map(([floor, floorQrs]) => (
                                    <div key={floor} className="mb-6 print:mb-2 last:mb-0">
                                        {floorGroups.length > 1 && (
                                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1 print:text-black print:text-sm print:mb-2 print:border-b print:border-neutral-200 print:pb-1">
                                                {floor === "—" ? "Other Rooms" : `Floor ${floor}`}
                                            </h4>
                                        )}
                                        <div className={cn(
                                            "grid gap-4",
                                            qrLayout === 4 && "grid-cols-2",
                                            qrLayout === 6 && "grid-cols-3",
                                            qrLayout === 8 && "grid-cols-2 md:grid-cols-4",
                                            layoutCols,
                                            qrShowCutGuides && "qr-cut-guides",
                                        )}>
                                            {floorQrs.map((qr) => (
                                                <QrCard
                                                    key={qr.roomId}
                                                    qr={qr}
                                                    layout={qrLayout}
                                                    tagline={qrTagline}
                                                    wifiName={qrWifiName}
                                                    wifiPass={qrWifiPass}
                                                    showBranding={qrShowBranding}
                                                    hotelName={hotel?.name}
                                                    hotelLogo={hotel?.logoUrl}
                                                    copiedId={copiedId}
                                                    onDownload={() => downloadQr(qr)}
                                                    onCopy={() => copyUrl(qr)}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ))}

                                {selectedQrs.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                                        <QrCode className="w-10 h-10 mb-3 opacity-30" />
                                        <p className="text-sm">No rooms selected</p>
                                        <p className="text-xs mt-1">Select rooms from the sidebar to preview</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>

        {/* ───── Single Room QR Print Modal ───── */}
        <AnimatePresence>
            {singleQr && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm print:static print:inset-auto print:bg-transparent print:backdrop-blur-0" onClick={() => setSingleQr(null)}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-md bg-card rounded-xl border border-border shadow-2xl overflow-hidden print:max-w-none print:rounded-none print:border-0 print:shadow-none print:bg-white"
                    >
                        <div className="flex items-center justify-between p-4 border-b border-border print:hidden">
                            <h3 className="font-semibold text-foreground">Room {singleQr.roomNumber}</h3>
                            <button type="button" onClick={() => setSingleQr(null)}><X className="w-5 h-5 text-muted-foreground" /></button>
                        </div>
                        <div className="p-8 flex flex-col items-center print:p-4">
                            {hotel?.name && (
                                <div className="flex items-center gap-2 mb-4 print:mb-3">
                                    {hotel.logoUrl?.trim() && (
                                        <img src={hotel.logoUrl.trim()} alt="" className="w-7 h-7 rounded-lg object-cover" />
                                    )}
                                    <span className="text-sm font-semibold text-foreground print:text-black">{hotel.name}</span>
                                </div>
                            )}
                            <div className="w-64 h-64 bg-white p-3 rounded-xl ring-1 ring-black/10 print:w-72 print:h-72 print:mx-auto">
                                <img src={singleQr.qrCode} alt={`Room ${singleQr.roomNumber}`} className="w-full h-full object-contain" />
                            </div>
                            <p className="mt-4 text-2xl font-bold text-foreground print:text-black">Room {singleQr.roomNumber}</p>
                            <p className="mt-1 text-sm text-muted-foreground print:text-neutral-600">Scan to order</p>
                        </div>
                        <div className="flex gap-2 p-4 border-t border-border print:hidden">
                            <Button variant="outline" className="flex-1" onClick={() => downloadQr(singleQr)}>
                                <Download className="w-4 h-4 mr-2" /> Download
                            </Button>
                            <Button className="flex-1" onClick={() => window.print()}>
                                <Printer className="w-4 h-4 mr-2" /> Print
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
        </>
    );
}

/* ─── QR Card Component ─── */
function QrCard({
    qr,
    layout,
    tagline,
    wifiName,
    wifiPass,
    showBranding,
    hotelName,
    hotelLogo,
    copiedId,
    onDownload,
    onCopy,
}: {
    qr: RoomQr;
    layout: QrLayout;
    tagline: string;
    wifiName: string;
    wifiPass: string;
    showBranding: boolean;
    hotelName?: string;
    hotelLogo?: string;
    copiedId: string | null;
    onDownload: () => void;
    onCopy: () => void;
}) {
    const isLarge = layout === 4;
    const hasWifi = wifiName.trim() || wifiPass.trim();

    return (
        <div className={cn(
            "qr-print-card flex flex-col items-center rounded-xl border border-border bg-card p-3 text-center text-foreground shadow-sm",
            "print:break-inside-avoid print:border print:border-neutral-300 print:bg-white print:shadow-none print:rounded-lg",
            isLarge && "p-5",
        )}>
            {/* Branding (print only by default, always visible for large) */}
            {showBranding && hotelName && (
                <div className={cn(
                    "flex items-center gap-1.5 mb-2",
                    !isLarge && "hidden print:flex",
                    "print:mb-1.5",
                )}>
                    {hotelLogo?.trim() && (
                        <img src={hotelLogo.trim()} alt="" className="w-4 h-4 rounded object-cover print:w-5 print:h-5" />
                    )}
                    <span className="text-[10px] font-semibold text-muted-foreground print:text-neutral-700 print:text-xs truncate max-w-[120px]">{hotelName}</span>
                </div>
            )}

            {/* QR Image */}
            <div className={cn(
                "aspect-square w-full rounded-lg bg-white p-1.5 ring-1 ring-black/10 dark:ring-white/20 print:ring-black/15",
                isLarge ? "mb-4 p-3" : "mb-2",
            )}>
                <img src={qr.qrCode} alt={`Room ${qr.roomNumber}`} className="h-full w-full object-contain" />
            </div>

            {/* Room number */}
            <p className={cn(
                "font-bold print:text-black",
                isLarge ? "text-2xl" : "text-lg",
            )}>
                Room {qr.roomNumber}
            </p>

            {/* Tagline */}
            <p className={cn(
                "text-muted-foreground print:text-neutral-600",
                isLarge ? "text-sm mt-1" : "text-[11px]",
                hasWifi ? "mb-1" : "mb-2 print:mb-0",
            )}>
                {tagline || "Scan to order"}
            </p>

            {/* WiFi */}
            {hasWifi && (
                <div className={cn(
                    "flex items-center gap-1 text-muted-foreground print:text-neutral-500 mb-2 print:mb-1",
                    isLarge ? "text-xs" : "text-[10px]",
                )}>
                    <Wifi className="w-3 h-3 shrink-0" />
                    <span className="truncate">
                        {wifiName.trim()}{wifiName.trim() && wifiPass.trim() ? " · " : ""}{wifiPass.trim()}
                    </span>
                </div>
            )}

            {/* Actions (screen only) */}
            <div className="flex w-full gap-1.5 print:hidden mt-auto">
                <Button variant="outline" size="sm" className="flex-1 px-0 text-[11px]" onClick={onDownload}>
                    <Download className="mr-1 h-3 w-3" /> PNG
                </Button>
                <Button variant="outline" size="sm" className="flex-1 px-0 text-[11px]" onClick={onCopy}>
                    {copiedId === qr.roomId ? (
                        <><Check className="mr-1 h-3 w-3 text-emerald-500" /> Copied</>
                    ) : (
                        <><Link className="mr-1 h-3 w-3" /> Link</>
                    )}
                </Button>
            </div>
        </div>
    );
}
