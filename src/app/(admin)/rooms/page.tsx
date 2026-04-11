"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { api } from "@/lib/api";
import { Room, RoomQr } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { RoomsSkeleton } from "@/components/ui/Skeleton";
import { Input } from "@/components/ui/Input";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
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

/** A4 = multi-card sheet; A6 = ISO 105×148mm slot with small QR, 2 slots per A4 landscape sheet. */
type QrPaperSize = "a4" | "a6";

type A6PrintChunk = { floor: string; pair: RoomQr[]; showFloor: boolean };

/** Matches server QR `light` colour so the print frame has no white margin around the PNG. */
function resolveQrPrintFrameBackground(hex: string | null | undefined): string {
    const raw = hex?.trim();
    if (!raw) return "#ffffff";
    const s = raw.startsWith("#") ? raw : `#${raw}`;
    if (/^#[0-9A-Fa-f]{6}$/.test(s)) return s.toLowerCase();
    if (/^#[0-9A-Fa-f]{3}$/.test(s)) {
        const r = s[1];
        const g = s[2];
        const b = s[3];
        return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
    }
    return "#ffffff";
}

/** Dark text on light QR card bg; light text on dark bg (screen + print). */
function isQrPrintBackgroundLight(hex: string): boolean {
    const m = /^#([0-9a-f]{6})$/i.exec(hex.trim());
    if (!m) return true;
    const n = parseInt(m[1], 16);
    const r = (n >> 16) & 255;
    const g = (n >> 8) & 255;
    const b = n & 255;
    const lin = (c: number) => {
        const x = c / 255;
        return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
    };
    const L = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
    return L > 0.45;
}

const LAYOUT_OPTIONS: { value: QrLayout; label: string; cols: string; desc: string }[] = [
    { value: 4, label: "Large", cols: "qr-print-cols-2", desc: "4 / page" },
    { value: 6, label: "Medium", cols: "qr-print-cols-3", desc: "6 / page" },
    { value: 8, label: "Compact", cols: "qr-print-cols-4", desc: "8 / page" },
];

export default function RoomsPage() {
    const { hotel } = useAuth();
    const qrPrintFrameBg = useMemo(
        () => resolveQrPrintFrameBackground(hotel?.qrCodeBackgroundHex),
        [hotel?.qrCodeBackgroundHex],
    );
    const qrPrintCardLight = useMemo(() => isQrPrintBackgroundLight(qrPrintFrameBg), [qrPrintFrameBg]);
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
    const [qrPaperSize, setQrPaperSize] = useState<QrPaperSize>("a4");
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
            toast.success(numbers.length === 1 ? "Room added successfully" : "Rooms added successfully");
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

    /** Pairs of rooms per printed A4 landscape page (two A6 portrait cut areas). */
    const a6PrintChunks = useMemo((): A6PrintChunk[] => {
        const out: A6PrintChunk[] = [];
        for (const [floor, floorQrs] of printFloorGroups) {
            for (let i = 0; i < floorQrs.length; i += 2) {
                out.push({
                    floor,
                    pair: floorQrs.slice(i, i + 2),
                    showFloor: i === 0,
                });
            }
        }
        return out;
    }, [printFloorGroups]);

    const layoutCols = LAYOUT_OPTIONS.find((o) => o.value === qrLayout)!.cols;

    if (loading) return <RoomsSkeleton />;

    return (
        <>
            {/* ───── Normal page (hidden when printing) ───── */}
            <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 print:hidden pb-[env(safe-area-inset-bottom,0px)]">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div className="min-w-0">
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Rooms & QR Codes</h1>
                        <p className="text-sm sm:text-base text-muted-foreground mt-1">Manage physical spaces and digital access points</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full md:w-auto shrink-0">
                        <Button variant="secondary" className="w-full sm:w-auto min-h-11 justify-center bg-secondary/80 hover:bg-secondary/100" onClick={showAllQrs}>
                            <QrCode className="w-4 h-4 mr-2 shrink-0" /> Print QRs
                        </Button>
                        <Button className="w-full sm:w-auto min-h-11 justify-center" onClick={() => setShowModal(true)}>
                            <Plus className="w-4 h-4 mr-2 shrink-0" /> Add Room
                        </Button>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center border-b border-border pb-4 sm:pb-6">
                    <div className="relative w-full sm:w-72 sm:max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                        <input
                            type="search"
                            enterKeyHint="search"
                            placeholder="Search by room number..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full min-h-11 bg-secondary/50 border border-border rounded-lg pl-9 pr-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                        />
                    </div>
                    <div className="text-sm text-muted-foreground shrink-0">
                        Total rooms: <span className="font-semibold text-foreground tabular-nums">{rooms.length}</span>
                    </div>
                </div>

                {/* Room Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-6">
                    <AnimatePresence>
                        {filteredRooms.map((room) => (
                            <motion.div
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                key={room.id}
                                className="dashboard-card p-4 sm:p-6 flex flex-col items-center text-center group relative hover:border-primary/50"
                            >
                                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-secondary flex items-center justify-center text-xl sm:text-2xl font-bold text-primary mb-2 sm:mb-3 shadow-inner tabular-nums">
                                    {room.number}
                                </div>
                                <h3 className="font-semibold text-foreground text-sm sm:text-base">Room {room.number}</h3>
                                {room.type?.trim() ? (
                                    <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">{room.type}</p>
                                ) : null}
                                {room.floor && (
                                    <span className="mt-3 text-xs bg-secondary px-2 py-0.5 rounded text-muted-foreground">
                                        Floor {room.floor}
                                    </span>
                                )}

                                {/* Actions area - inline flex on bottom for mobile, absolute hover on desktop */}
                                <div className="flex justify-center gap-4 w-full mt-auto pt-4 sm:absolute sm:top-3 sm:left-0 sm:right-0 sm:opacity-0 sm:group-hover:opacity-100 sm:transition-opacity sm:pt-0 sm:mt-0 pointer-events-none">
                                    <button
                                        type="button"
                                        onClick={() => handleSinglePrint(room.id)}
                                        title="Print QR"
                                        aria-label={`Print QR for room ${room.number}`}
                                        className="p-2 w-full max-w-[120px] sm:max-w-none sm:w-auto sm:absolute sm:left-3 sm:top-0 min-h-10 min-w-10 sm:min-h-0 sm:min-w-0 flex items-center justify-center rounded-lg bg-secondary/90 border border-border text-muted-foreground hover:text-primary transition-opacity shadow-sm pointer-events-auto"
                                    >
                                        <QrCode className="w-4 h-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => deleteRoom(room.id)}
                                        title="Delete room"
                                        aria-label={`Delete room ${room.number}`}
                                        className="p-2 w-full max-w-[120px] sm:max-w-none sm:w-auto sm:absolute sm:right-3 sm:top-0 min-h-10 min-w-10 sm:min-h-0 sm:min-w-0 flex items-center justify-center rounded-lg bg-secondary/90 border border-border text-muted-foreground hover:text-red-500 transition-opacity shadow-sm pointer-events-auto"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {/* Add Room Modal */}
                <AnimatePresence>
                    {showModal && (
                        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm pb-[env(safe-area-inset-bottom,0px)]" onClick={() => setShowModal(false)}>
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-sm max-h-[90dvh] overflow-y-auto bg-card border border-border rounded-t-2xl sm:rounded-xl shadow-2xl">
                                <div className="flex justify-between items-center p-4 sm:p-5 border-b border-border bg-muted/20">
                                    <h3 className="font-semibold text-foreground">Add Room</h3>
                                    <button type="button" className="p-2 -m-2 rounded-lg hover:bg-secondary" onClick={() => setShowModal(false)} aria-label="Close"><X className="w-5 h-5 text-muted-foreground" /></button>
                                </div>
                                <form onSubmit={handleCreateRoom} className="p-4 sm:p-6 space-y-4">
                                    <div className="space-y-1.5">
                                        <div className="relative">
                                            <div className="flex items-center gap-1.5">
                                                <label htmlFor="add-room-numbers" className="text-xs font-medium text-muted-foreground">Room number(s)</label>
                                                <button
                                                    type="button"
                                                    className="rounded-full p-1.5 min-h-9 min-w-9 flex items-center justify-center text-muted-foreground outline-none hover:text-foreground hover:bg-secondary"
                                                    aria-label="Room number format help"
                                                    aria-expanded={roomNumberHelpOpen}
                                                    onClick={() => setRoomNumberHelpOpen((o) => !o)}
                                                >
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
                                    <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-2">
                                        <Button type="button" variant="outline" className="flex-1 min-h-11" onClick={() => setShowModal(false)}>Cancel</Button>
                                        <Button type="submit" loading={saving} className="flex-1 min-h-11">
                                            {(() => { const { numbers } = parseRoomNumbersInput(form.number); return numbers.length > 1 ? `Add ${numbers.length} rooms` : "Add room"; })()}
                                        </Button>
                                    </div>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>

            {/* ───── Print QRs modal (multi-room, for print/PDF) ───── */}
            <AnimatePresence>
                {showQrModal && (
                    <div
                        className={cn(
                            "room-qr-print-backdrop fixed inset-0 z-50 flex items-end lg:items-center justify-center p-0 sm:p-2 lg:p-4 bg-black/80 backdrop-blur-sm pb-[env(safe-area-inset-bottom,0px)] print:static print:inset-auto print:flex print:min-h-0 print:items-start print:justify-start print:overflow-visible print:bg-transparent print:backdrop-blur-0",
                            qrPaperSize === "a6" && "room-qr-print-paper-a6",
                        )}
                        onClick={() => setShowQrModal(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.96 }}
                            onClick={(e) => e.stopPropagation()}
                            className="room-qr-print-modal flex flex-col lg:flex-row h-[96dvh] max-h-[96dvh] lg:h-[92vh] lg:max-h-[92vh] w-full max-w-[1200px] sm:mx-auto rounded-t-2xl lg:rounded-xl border border-border bg-card shadow-2xl overflow-hidden print:block print:h-auto print:max-h-none print:min-h-0 print:w-full print:max-w-none print:mx-0 print:overflow-visible print:rounded-none print:border-0 print:bg-white print:shadow-none"
                        >
                            {/* ── Sidebar (screen only) — scrollable panel on mobile, fixed width on lg ── */}
                            <aside className="flex w-full shrink-0 flex-col overflow-hidden border-b border-border bg-muted/30 min-h-0 max-h-[40vh] lg:max-h-none lg:w-[280px] lg:border-b-0 lg:border-r print:hidden">
                                <div className="shrink-0 p-4 border-b border-border">
                                    <h3 className="text-base font-semibold text-foreground">QR Print Settings</h3>
                                    <p className="text-xs text-muted-foreground mt-0.5">Customize before printing</p>
                                </div>

                                <div className="min-h-0 flex-1 overflow-y-auto p-4 space-y-5 text-sm">
                                    {/* Paper size (A6 = one QR per stand insert) */}
                                    <div>
                                        <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-2">
                                            Paper size
                                        </label>
                                        <div className="grid grid-cols-2 gap-1.5">
                                            <button
                                                type="button"
                                                aria-pressed={qrPaperSize === "a4"}
                                                onClick={() => setQrPaperSize("a4")}
                                                className={cn(
                                                    "rounded-lg border px-2 py-2.5 text-center transition-all",
                                                    qrPaperSize === "a4"
                                                        ? "border-primary bg-primary/10 text-primary"
                                                        : "border-border bg-secondary/50 text-muted-foreground hover:border-primary/40",
                                                )}
                                            >
                                                <span className="block text-xs font-semibold">A4 sheet</span>
                                                <span className="block text-[10px] opacity-70 mt-0.5">4 / 6 / 8 per page</span>
                                            </button>
                                            <button
                                                type="button"
                                                aria-pressed={qrPaperSize === "a6"}
                                                onClick={() => setQrPaperSize("a6")}
                                                className={cn(
                                                    "rounded-lg border px-2 py-2.5 text-center transition-all",
                                                    qrPaperSize === "a6"
                                                        ? "border-primary bg-primary/10 text-primary"
                                                        : "border-border bg-secondary/50 text-muted-foreground hover:border-primary/40",
                                                )}
                                            >
                                                <span className="block text-xs font-semibold">A6 stand</span>
                                                <span className="block text-[10px] opacity-70 mt-0.5">2 per A4 landscape</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Layout (A4 only — A6 uses fixed 2× A6 slots on each A4 landscape page) */}
                                    <div>
                                        <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-2">
                                            <LayoutGrid className="w-3.5 h-3.5" /> Layout
                                        </label>
                                        {qrPaperSize === "a6" ? (
                                            <p className="text-[11px] text-muted-foreground leading-snug rounded-lg border border-border bg-secondary/30 px-3 py-2">
                                                Prints on <strong className="text-foreground">A4 landscape</strong>. Each cut area is{" "}
                                                <strong className="text-foreground">105×148&nbsp;mm</strong> (A6) with a{" "}
                                                <strong className="text-foreground">small</strong> QR inside. Two stand cards per sheet. Use{" "}
                                                <strong className="text-foreground">Cut guides</strong> to trim.
                                            </p>
                                        ) : (
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
                                        )}
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
                                            role="switch"
                                            aria-checked={qrShowBranding}
                                            onClick={() => setQrShowBranding(!qrShowBranding)}
                                            className="flex w-full items-center gap-2.5 rounded-lg border border-border bg-secondary/30 px-3 py-2 text-xs transition-colors hover:bg-secondary/60"
                                        >
                                            <Hotel className="w-3.5 h-3.5 text-muted-foreground" />
                                            <span className="flex-1 text-left text-foreground">Hotel name on cards</span>
                                            <span
                                                className={cn(
                                                    "relative flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors",
                                                    qrShowBranding ? "bg-primary" : "bg-muted-foreground/25",
                                                )}
                                                aria-hidden
                                            >
                                                <span
                                                    className={cn(
                                                        "block h-4 w-4 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ease-out",
                                                        qrShowBranding ? "translate-x-4" : "translate-x-0",
                                                    )}
                                                />
                                            </span>
                                        </button>
                                        <button
                                            type="button"
                                            role="switch"
                                            aria-checked={qrShowCutGuides}
                                            onClick={() => setQrShowCutGuides(!qrShowCutGuides)}
                                            className="flex w-full items-center gap-2.5 rounded-lg border border-border bg-secondary/30 px-3 py-2 text-xs transition-colors hover:bg-secondary/60"
                                        >
                                            <Scissors className="w-3.5 h-3.5 text-muted-foreground" />
                                            <span className="flex-1 text-left text-foreground">Cut guides</span>
                                            <span
                                                className={cn(
                                                    "relative flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors",
                                                    qrShowCutGuides ? "bg-primary" : "bg-muted-foreground/25",
                                                )}
                                                aria-hidden
                                            >
                                                <span
                                                    className={cn(
                                                        "block h-4 w-4 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ease-out",
                                                        qrShowCutGuides ? "translate-x-4" : "translate-x-0",
                                                    )}
                                                />
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
                                <div className="shrink-0 border-t border-border p-4 space-y-2">
                                    <Button className="w-full min-h-11" onClick={() => window.print()} disabled={qrSelectedIds.size === 0}>
                                        <Printer className="w-4 h-4 mr-2" /> Print {qrSelectedIds.size > 0 ? `${qrSelectedIds.size} QR${qrSelectedIds.size > 1 ? "s" : ""}` : ""}
                                    </Button>
                                    <button type="button" onClick={() => setShowQrModal(false)} className="w-full text-xs text-muted-foreground hover:text-foreground py-1.5 transition-colors">
                                        Close
                                    </button>
                                </div>
                            </aside>

                            {/* ── Main QR grid (screen + print) ── */}
                            <div className="flex min-h-[45vh] flex-1 flex-col overflow-hidden lg:min-h-0 print:block print:h-auto print:w-full print:min-h-0 print:overflow-visible print:max-h-none">
                                {/* Screen header */}
                                <div className="flex items-center justify-between gap-2 border-b border-border p-3 sm:p-4 print:hidden shrink-0">
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
                                        <p className="mb-2 text-center text-lg font-bold text-black">{hotel.name}</p>
                                    )}
                                    <p className="text-center text-sm text-neutral-500 mb-1">Room QR Codes</p>
                                </div>

                                {/* QR grid */}
                                <div className="min-h-0 flex-1 overflow-y-auto bg-secondary/20 p-3 sm:p-6 print:block print:h-auto print:w-full print:min-h-0 print:overflow-visible print:bg-white print:p-2 print:max-h-none">
                                    {qrPaperSize === "a6"
                                        ? a6PrintChunks.map((row, idx) => (
                                              <div
                                                  key={`${row.floor}-${idx}-${row.pair[0]?.roomId ?? idx}`}
                                                  className={cn(
                                                      "qr-a4l-print-page mb-10 last:mb-0 print:mb-0",
                                                      "print:flex print:min-h-[198mm] print:w-full print:flex-col print:items-center print:justify-center print:box-border",
                                                      idx < a6PrintChunks.length - 1 && "print:break-after-page",
                                                  )}
                                              >
                                                  {floorGroups.length > 1 && row.showFloor && (
                                                      <h4 className="w-full text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1 print:text-black print:text-sm print:mb-3 print:text-center print:max-w-[calc(105mm*2+10mm)]">
                                                          {row.floor === "—" ? "Other Rooms" : `Floor ${row.floor}`}
                                                      </h4>
                                                  )}
                                                  <div
                                                      className={cn(
                                                          "flex w-full max-w-[calc(105mm*2+2.5rem)] flex-row flex-wrap justify-center gap-6 print:max-w-none print:flex-nowrap print:justify-center print:gap-[8mm]",
                                                          qrShowCutGuides && "qr-cut-guides",
                                                      )}
                                                  >
                                                      {row.pair.map((qr) => (
                                                          <QrCard
                                                              key={qr.roomId}
                                                              qr={qr}
                                                              layout={qrLayout}
                                                              paperA6
                                                              tagline={qrTagline}
                                                              wifiName={qrWifiName}
                                                              wifiPass={qrWifiPass}
                                                              showBranding={qrShowBranding}
                                                              hotelName={hotel?.name}
                                                              qrCardBackground={qrPrintFrameBg}
                                                              cardTextOnLight={qrPrintCardLight}
                                                              copiedId={copiedId}
                                                              onDownload={() => downloadQr(qr)}
                                                              onCopy={() => copyUrl(qr)}
                                                          />
                                                      ))}
                                                  </div>
                                              </div>
                                          ))
                                        : printFloorGroups.map(([floor, floorQrs]) => (
                                              <div key={floor} className="qr-print-floor-block mb-6 print:mb-0 last:mb-0">
                                                  {floorGroups.length > 1 && (
                                                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1 print:text-black print:text-sm print:mb-2 print:border-b print:border-neutral-200 print:pb-1">
                                                          {floor === "—" ? "Other Rooms" : `Floor ${floor}`}
                                                      </h4>
                                                  )}
                                                  <div
                                                      className={cn(
                                                          "grid gap-4",
                                                          qrLayout === 4 && "grid-cols-2",
                                                          qrLayout === 6 && "grid-cols-3",
                                                          qrLayout === 8 && "grid-cols-2 md:grid-cols-4",
                                                          layoutCols,
                                                          qrShowCutGuides && "qr-cut-guides",
                                                      )}
                                                  >
                                                      {floorQrs.map((qr) => (
                                                          <QrCard
                                                              key={qr.roomId}
                                                              qr={qr}
                                                              layout={qrLayout}
                                                              paperA6={false}
                                                              tagline={qrTagline}
                                                              wifiName={qrWifiName}
                                                              wifiPass={qrWifiPass}
                                                              showBranding={qrShowBranding}
                                                              hotelName={hotel?.name}
                                                              qrCardBackground={qrPrintFrameBg}
                                                              cardTextOnLight={qrPrintCardLight}
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
                    <div
                        className={cn(
                            "fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm pb-[env(safe-area-inset-bottom,0px)] print:static print:inset-auto print:bg-transparent print:backdrop-blur-0",
                            qrPaperSize === "a6" && "room-qr-print-paper-a6",
                        )}
                        onClick={() => setSingleQr(null)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.96 }}
                            onClick={(e) => e.stopPropagation()}
                            className={cn(
                                "w-full max-w-md max-h-[92dvh] overflow-y-auto rounded-t-2xl sm:rounded-xl border border-border bg-card shadow-2xl print:max-w-none print:rounded-none print:shadow-none",
                                qrPaperSize === "a4" && "print:border print:border-neutral-300",
                                qrPaperSize === "a6" &&
                                    "qr-a4l-print-page qr-a4l-single-room max-w-[105mm] sm:max-w-[105mm] print:max-w-none print:min-h-[198mm] print:flex print:flex-col print:items-center print:justify-center print:box-border print:border-0",
                            )}
                            style={{ backgroundColor: qrPrintFrameBg }}
                        >
                            <div className="flex items-center justify-between border-b border-border bg-card/95 p-4 print:hidden">
                                <h3 className="font-semibold text-foreground">Room {singleQr.roomNumber}</h3>
                                <button type="button" onClick={() => setSingleQr(null)}><X className="w-5 h-5 text-muted-foreground" /></button>
                            </div>
                            <div className="px-4 pb-2 pt-1 print:hidden">
                                <p className="text-[10px] font-medium text-muted-foreground mb-1.5">Print paper</p>
                                <div className="flex gap-1.5">
                                    <button
                                        type="button"
                                        aria-pressed={qrPaperSize === "a4"}
                                        onClick={() => setQrPaperSize("a4")}
                                        className={cn(
                                            "flex-1 rounded-md border px-2 py-1.5 text-[11px] font-medium transition-colors",
                                            qrPaperSize === "a4"
                                                ? "border-primary bg-primary/10 text-primary"
                                                : "border-border bg-secondary/40 text-muted-foreground hover:border-primary/30",
                                        )}
                                    >
                                        A4
                                    </button>
                                    <button
                                        type="button"
                                        aria-pressed={qrPaperSize === "a6"}
                                        onClick={() => setQrPaperSize("a6")}
                                        className={cn(
                                            "flex-1 rounded-md border px-2 py-1.5 text-[11px] font-medium transition-colors",
                                            qrPaperSize === "a6"
                                                ? "border-primary bg-primary/10 text-primary"
                                                : "border-border bg-secondary/40 text-muted-foreground hover:border-primary/30",
                                        )}
                                    >
                                        A6 stand
                                    </button>
                                </div>
                            </div>
                            <div
                                className={cn(
                                    "flex flex-col items-center p-8 print:p-4",
                                    qrPaperSize === "a6" &&
                                        "h-[148mm] min-h-[148mm] w-[min(105mm,calc(100vw-2rem))] max-w-full justify-between rounded-2xl border border-border/80 p-5 print:h-[148mm] print:min-h-0 print:w-[105mm] print:max-h-[148mm] print:rounded-2xl print:border print:border-neutral-300/90 print:px-5 print:py-6 print:shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]",
                                    qrPrintCardLight ? "text-zinc-900" : "text-zinc-100",
                                )}
                                style={qrPaperSize === "a6" ? { backgroundColor: qrPrintFrameBg } : undefined}
                            >
                                {qrPaperSize === "a6" ? (
                                    <QrStandInsertLayout
                                        hotelName={hotel?.name}
                                        showBranding={Boolean(hotel?.name)}
                                        roomNumber={singleQr.roomNumber}
                                        qrCode={singleQr.qrCode}
                                        tagline="Scan to order"
                                        cardTextOnLight={qrPrintCardLight}
                                        wifiName=""
                                        wifiPass=""
                                        qrBoxClassName="h-[38mm] w-[38mm] sm:h-36 sm:w-36 print:h-[36mm] print:w-[36mm]"
                                    />
                                ) : (
                                    <>
                                        {hotel?.name && (
                                            <p
                                                className={cn(
                                                    "mb-4 text-center text-sm font-semibold",
                                                    qrPrintCardLight ? "text-zinc-800" : "text-zinc-200",
                                                )}
                                            >
                                                {hotel.name}
                                            </p>
                                        )}
                                        <div
                                            className={cn(
                                                "h-64 w-64 overflow-hidden rounded-xl p-0 ring-1 print:mx-auto print:h-72 print:w-72",
                                                qrPrintCardLight ? "ring-black/15" : "ring-white/25",
                                            )}
                                            style={{ backgroundColor: qrPrintFrameBg }}
                                        >
                                            <img
                                                src={singleQr.qrCode}
                                                alt={`Room ${singleQr.roomNumber}`}
                                                className="h-full w-full object-contain"
                                            />
                                        </div>
                                        <p className="mt-4 text-2xl font-bold">Room {singleQr.roomNumber}</p>
                                        <p
                                            className={cn(
                                                "mt-1 text-sm",
                                                qrPrintCardLight ? "text-zinc-600" : "text-zinc-400",
                                            )}
                                        >
                                            Scan to order
                                        </p>
                                    </>
                                )}
                            </div>
                            <div className="flex flex-col-reverse sm:flex-row gap-2 p-4 border-t border-border print:hidden">
                                <Button variant="outline" className="flex-1 min-h-11" onClick={() => downloadQr(singleQr)}>
                                    <Download className="w-4 h-4 mr-2" /> Download
                                </Button>
                                <Button className="flex-1 min-h-11" onClick={() => window.print()}>
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

/** Shared layout for A6 stand inserts: serif branding, QR medallion, typographic room block. */
function QrStandInsertLayout({
    hotelName,
    showBranding,
    roomNumber,
    qrCode,
    tagline,
    cardTextOnLight,
    wifiName,
    wifiPass,
    qrBoxClassName,
}: {
    hotelName?: string;
    showBranding: boolean;
    roomNumber: string;
    qrCode: string;
    tagline: string;
    cardTextOnLight: boolean;
    wifiName: string;
    wifiPass: string;
    /** Tailwind classes for the QR image wrapper (mm sizes for print). */
    qrBoxClassName: string;
}) {
    const t = cardTextOnLight;
    const hasWifi = wifiName.trim() || wifiPass.trim();
    return (
        <>
            <header className="flex w-full flex-col items-center shrink-0">
                <div
                    className={cn(
                        "mb-3 h-[3px] w-12 rounded-full print:mb-2.5",
                        t
                            ? "bg-gradient-to-r from-amber-900/20 via-amber-700/50 to-amber-900/20"
                            : "bg-gradient-to-r from-white/15 via-white/45 to-white/15",
                    )}
                    aria-hidden
                />
                {showBranding && hotelName ? (
                    <p
                        className={cn(
                            "font-serif max-w-[92mm] text-center text-[11px] font-medium leading-snug tracking-[0.14em] print:text-[10px] print:leading-tight",
                            t ? "text-zinc-800" : "text-zinc-200",
                        )}
                    >
                        {hotelName}
                    </p>
                ) : (
                    <span className="h-[0.875rem] print:h-2" aria-hidden />
                )}
            </header>

            <div className="flex min-h-0 flex-1 flex-col items-center justify-center py-2 print:py-3">
                <div
                    className={cn(
                        "rounded-2xl p-2.5 shadow-[0_6px_28px_rgba(0,0,0,0.09)] ring-1 ring-inset print:rounded-xl print:p-2 print:shadow-[0_4px_20px_rgba(0,0,0,0.07)]",
                        t ? "bg-white ring-black/[0.07]" : "bg-white ring-black/10",
                    )}
                >
                    <div className={cn("overflow-hidden rounded-lg", qrBoxClassName)}>
                        <img src={qrCode} alt={`Room ${roomNumber}`} className="h-full w-full object-contain" />
                    </div>
                </div>
            </div>

            <footer className="flex w-full flex-col items-center gap-1 shrink-0 text-center">
                <span
                    className={cn(
                        "text-[7px] font-semibold uppercase tracking-[0.42em] print:text-[7px]",
                        t ? "text-zinc-500" : "text-zinc-400",
                    )}
                >
                    Room
                </span>
                <p
                    className={cn(
                        "font-serif text-[1.85rem] font-semibold leading-none tracking-tight print:text-[1.7rem]",
                        t ? "text-zinc-900" : "text-zinc-50",
                    )}
                >
                    {roomNumber}
                </p>
                <div className={cn("my-1.5 h-px w-9 print:my-1", t ? "bg-zinc-300/90" : "bg-zinc-500/80")} aria-hidden />
                <p
                    className={cn(
                        "max-w-[90mm] text-[9px] font-medium uppercase tracking-[0.22em] print:text-[8px]",
                        t ? "text-zinc-500" : "text-zinc-400",
                    )}
                >
                    {tagline?.trim() || "Scan to order"}
                </p>
                {hasWifi && (
                    <div
                        className={cn(
                            "mt-2 flex max-w-[92mm] items-center justify-center gap-1 text-[8px] leading-tight print:mt-1.5 print:text-[7px]",
                            t ? "text-zinc-600" : "text-zinc-400",
                        )}
                    >
                        <Wifi className="h-2.5 w-2.5 shrink-0 opacity-80" />
                        <span className="truncate">
                            {wifiName.trim()}
                            {wifiName.trim() && wifiPass.trim() ? " · " : ""}
                            {wifiPass.trim()}
                        </span>
                    </div>
                )}
            </footer>
        </>
    );
}

/* ─── QR Card Component ─── */
function QrCard({
    qr,
    layout,
    paperA6,
    tagline,
    wifiName,
    wifiPass,
    showBranding,
    hotelName,
    qrCardBackground,
    cardTextOnLight,
    copiedId,
    onDownload,
    onCopy,
}: {
    qr: RoomQr;
    layout: QrLayout;
    /** A6 stand slot (105×148mm) on A4 landscape; small QR inside the slot. */
    paperA6: boolean;
    tagline: string;
    wifiName: string;
    wifiPass: string;
    showBranding: boolean;
    hotelName?: string;
    /** Fills entire card to outer border (same as QR PNG background). */
    qrCardBackground: string;
    /** True → dark text; false → light text (for dark QR backgrounds). */
    cardTextOnLight: boolean;
    copiedId: string | null;
    onDownload: () => void;
    onCopy: () => void;
}) {
    const isLarge = layout === 4 && !paperA6;
    const hasWifi = wifiName.trim() || wifiPass.trim();
    const t = cardTextOnLight;
    const textMain = t ? "text-zinc-900" : "text-zinc-100";
    const textMuted = t ? "text-zinc-600" : "text-zinc-400";
    const textSubtle = t ? "text-zinc-700" : "text-zinc-300";
    const ringQr = t ? "ring-black/15" : "ring-white/25";

    if (paperA6) {
        return (
            <div
                className={cn(
                    "qr-print-card qr-print-card-a6-slot flex h-[148mm] w-[min(105mm,calc(100vw-2rem))] max-w-full shrink-0 flex-col rounded-2xl border border-border/80 p-4 text-center shadow-sm",
                    "print:break-inside-avoid print:h-[148mm] print:w-[105mm] print:max-h-[148mm] print:rounded-2xl print:border print:border-neutral-300/90 print:px-5 print:py-6 print:shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]",
                    textMain,
                )}
                style={{ backgroundColor: qrCardBackground }}
            >
                <QrStandInsertLayout
                    hotelName={hotelName}
                    showBranding={showBranding && Boolean(hotelName)}
                    roomNumber={qr.roomNumber}
                    qrCode={qr.qrCode}
                    tagline={tagline}
                    cardTextOnLight={cardTextOnLight}
                    wifiName={wifiName}
                    wifiPass={wifiPass}
                    qrBoxClassName="h-[38mm] w-[38mm] sm:h-36 sm:w-36 print:h-[36mm] print:w-[36mm]"
                />
                <div className="mt-auto flex w-full gap-1.5 pt-3 print:hidden">
                    <Button variant="outline" size="sm" className="min-h-10 flex-1 px-0 text-[11px] sm:min-h-8" onClick={onDownload}>
                        <Download className="mr-1 h-3 w-3 shrink-0" /> PNG
                    </Button>
                    <Button variant="outline" size="sm" className="min-h-10 flex-1 px-0 text-[11px] sm:min-h-8" onClick={onCopy}>
                        {copiedId === qr.roomId ? (
                            <>
                                <Check className="mr-1 h-3 w-3 text-emerald-500" /> Copied
                            </>
                        ) : (
                            <>
                                <Link className="mr-1 h-3 w-3" /> Link
                            </>
                        )}
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div
            className={cn(
                "qr-print-card flex flex-col items-center rounded-xl border border-border p-3 text-center shadow-sm",
                "print:break-inside-avoid print:border print:border-neutral-300 print:shadow-none print:rounded-lg",
                textMain,
                isLarge && "p-5",
            )}
            style={{ backgroundColor: qrCardBackground }}
        >
            {/* Branding (print only by default, always visible for large) */}
            {showBranding && hotelName && (
                <p
                    className={cn(
                        "mb-2 max-w-full truncate text-center text-[10px] font-semibold",
                        textSubtle,
                        !isLarge && "hidden print:block",
                        "print:mb-1.5 print:text-xs",
                    )}
                >
                    {hotelName}
                </p>
            )}

            {/* QR — full width on A4 layouts */}
            <div
                className={cn(
                    "aspect-square w-full overflow-hidden rounded-lg p-0 ring-1",
                    ringQr,
                    isLarge ? "mb-4" : "mb-2",
                )}
                style={{ backgroundColor: qrCardBackground }}
            >
                <img src={qr.qrCode} alt={`Room ${qr.roomNumber}`} className="h-full w-full object-contain" />
            </div>

            {/* Room number */}
            <p className={cn("font-bold", isLarge ? "text-2xl" : "text-lg")}>Room {qr.roomNumber}</p>

            {/* Tagline */}
            <p
                className={cn(
                    textMuted,
                    isLarge ? "mt-1 text-sm" : "text-[11px]",
                    hasWifi ? "mb-1" : "mb-2 print:mb-0",
                )}
            >
                {tagline || "Scan to order"}
            </p>

            {/* WiFi */}
            {hasWifi && (
                <div
                    className={cn(
                        "mb-2 flex items-center gap-1 print:mb-1",
                        textMuted,
                        isLarge ? "text-xs" : "text-[10px]",
                    )}
                >
                    <Wifi className="h-3 w-3 shrink-0" />
                    <span className="truncate">
                        {wifiName.trim()}
                        {wifiName.trim() && wifiPass.trim() ? " · " : ""}
                        {wifiPass.trim()}
                    </span>
                </div>
            )}

            {/* Actions (screen only) */}
            <div className="mt-auto flex w-full gap-1.5 print:hidden">
                <Button variant="outline" size="sm" className="min-h-10 flex-1 px-0 text-[11px] sm:min-h-8" onClick={onDownload}>
                    <Download className="mr-1 h-3 w-3 shrink-0" /> PNG
                </Button>
                <Button variant="outline" size="sm" className="min-h-10 flex-1 px-0 text-[11px] sm:min-h-8" onClick={onCopy}>
                    {copiedId === qr.roomId ? (
                        <>
                            <Check className="mr-1 h-3 w-3 text-emerald-500" /> Copied
                        </>
                    ) : (
                        <>
                            <Link className="mr-1 h-3 w-3" /> Link
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
