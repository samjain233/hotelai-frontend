"use client";

import { useEffect, useState } from "react";
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
} from "lucide-react";
import { parseRoomNumbersInput } from "@/lib/parseRoomNumbersInput";
import { useAuth } from "@/context/AuthContext";

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

    useEffect(() => { loadRooms(); }, []);

    useEffect(() => {
        if (!showModal) setRoomNumberHelpOpen(false);
    }, [showModal]);

    // ... Keep CRUD logic same ...
    async function loadRooms() {
        try { const r = await api.getRooms(); setRooms(r); }
        catch (err) { console.error(err); }
        finally { setLoading(false); }
    }
    async function handleCreateRoom(e: React.FormEvent) {
        e.preventDefault();
        const { numbers, error: parseError } = parseRoomNumbersInput(form.number);
        if (parseError) {
            alert(parseError);
            return;
        }
        setSaving(true);
        try {
            const floor = form.floor || undefined;
            if (numbers.length === 1) {
                await api.createRoom({ number: numbers[0], floor });
            } else {
                await api.createBulkRooms(numbers.map((number) => ({ number, floor })));
            }
            setShowModal(false);
            setForm({ number: "", floor: "" });
            await loadRooms();
        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : "Failed to create rooms");
        } finally {
            setSaving(false);
        }
    }
    async function deleteRoom(id: string) {
        if (!confirm("Delete this room?")) return;
        try { await api.deleteRoom(id); await loadRooms(); }
        catch (err: any) { alert(err.message); }
    }
    async function showAllQrs() {
        setShowQrModal(true);
        try { const data = await api.getAllRoomQrs(); setQrs(data); }
        catch (err: any) { alert(err.message); }
    }

    function downloadQr(qr: RoomQr) {
        const link = document.createElement("a");
        link.download = `room-${qr.roomNumber}-qr.png`;
        link.href = qr.qrCode;
        link.click();
    }

    async function copyUrl(qr: RoomQr) {
        try {
            await navigator.clipboard.writeText(qr.menuUrl);
            setCopiedId(qr.roomId);
            setTimeout(() => setCopiedId(null), 2000);
        } catch (err) {
            alert("Failed to copy URL");
        }
    }

    const filteredRooms = rooms.filter(r => r.number.toLowerCase().includes(search.toLowerCase()));

    if (loading) return <RoomsSkeleton />;

    return (
        <>
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

            {/* Grid */}
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

            {/* Modal for adding room */}
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
                                            <label htmlFor="add-room-numbers" className="text-xs font-medium text-muted-foreground">
                                                Room number(s)
                                            </label>
                                            <button
                                                type="button"
                                                className="rounded-full p-0.5 text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-card"
                                                aria-label="Room number format help"
                                                aria-expanded={roomNumberHelpOpen}
                                            >
                                                <CircleHelp className="w-4 h-4 shrink-0" aria-hidden />
                                            </button>
                                        </div>
                                        {roomNumberHelpOpen && (
                                            <div
                                                role="tooltip"
                                                className="absolute left-0 top-full z-[100] mt-1.5 w-full min-w-[16rem] max-w-[min(18rem,calc(100vw-3rem))] rounded-lg border border-border bg-popover px-3 py-2.5 text-left text-popover-foreground shadow-xl shadow-black/15"
                                            >
                                                <p className="text-[11px] font-semibold text-foreground mb-2">Formats &amp; examples</p>
                                                <ul className="text-[11px] text-muted-foreground space-y-1.5 list-none">
                                                    <li>
                                                        <span className="font-medium text-foreground">One room:</span>{" "}
                                                        <code className="rounded bg-secondary px-1 py-0.5 text-foreground">101</code>
                                                    </li>
                                                    <li>
                                                        <span className="font-medium text-foreground">List:</span>{" "}
                                                        <code className="rounded bg-secondary px-1 py-0.5 text-foreground">101, 102, 105</code>
                                                    </li>
                                                    <li>
                                                        <span className="font-medium text-foreground">Range:</span>{" "}
                                                        <code className="rounded bg-secondary px-1 py-0.5 text-foreground">101-105</code>
                                                        <span className="block pt-0.5 text-[10px]">→ creates 101, 102, … 105</span>
                                                    </li>
                                                    <li>
                                                        <span className="font-medium text-foreground">Combined:</span>{" "}
                                                        <code className="rounded bg-secondary px-1 py-0.5 text-foreground">101-103, 201</code>
                                                    </li>
                                                </ul>
                                                <p className="mt-2 border-t border-border pt-2 text-[10px] leading-relaxed text-muted-foreground">
                                                    Optional <strong className="text-foreground">floor</strong> applies to every room in this batch.
                                                    Max <strong className="text-foreground">100</strong> rooms per save. Ranges use numbers only (hyphen).
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                    <Input
                                        id="add-room-numbers"
                                        placeholder="101  or  101,102,105  or  101-105"
                                        value={form.number}
                                        onChange={(e) => setForm({ ...form, number: e.target.value })}
                                        required
                                        autoComplete="off"
                                    />
                                </div>
                                <Input placeholder="Floor (Optional) — applies to all" value={form.floor} onChange={(e) => setForm({ ...form, floor: e.target.value })} />
                                <div className="flex gap-3 pt-2">
                                    <Button type="button" variant="outline" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
                                    <Button type="submit" loading={saving} className="flex-1">
                                        {(() => {
                                            const { numbers } = parseRoomNumbersInput(form.number);
                                            return numbers.length > 1 ? `Add ${numbers.length} rooms` : "Add room";
                                        })()}
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>

            {/* QR Modal — outside print:hidden so batch QRs still print; screen: modal; print: clean sheet */}
            <AnimatePresence>
                {showQrModal && (
                    <div
                        className="room-qr-print-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm print:static print:inset-auto print:flex print:min-h-0 print:bg-white print:p-0 print:backdrop-blur-0"
                        onClick={() => setShowQrModal(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            onClick={(e) => e.stopPropagation()}
                            className="room-qr-print-modal flex h-[80vh] w-full max-w-5xl flex-col rounded-xl border border-border bg-card shadow-2xl print:h-auto print:max-h-none print:max-w-none print:rounded-none print:border-0 print:bg-white print:shadow-none"
                        >
                            <div className="flex items-center justify-between border-b border-border p-5 print:hidden">
                                <div>
                                    <h3 className="text-lg font-semibold text-foreground">Room QR Codes</h3>
                                    <p className="text-sm text-muted-foreground">Print these for guest access</p>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" onClick={() => window.print()}>
                                        <Printer className="mr-2 h-4 w-4" /> Print All
                                    </Button>
                                    <button type="button" onClick={() => setShowQrModal(false)} aria-label="Close">
                                        <X className="h-6 w-6 text-muted-foreground" />
                                    </button>
                                </div>
                            </div>

                            {/* Print-only header (browser print / PDF) */}
                            <div className="hidden px-2 pb-4 pt-2 print:block">
                                <h1 className="text-center text-xl font-bold text-black">
                                    {hotel?.name?.trim() ? `${hotel.name} — Room QR codes` : "Room QR codes"}
                                </h1>
                                <p className="mt-1 text-center text-sm text-neutral-600">Scan to open the guest menu for each room</p>
                            </div>

                            <div className="flex-1 overflow-y-auto bg-secondary/30 p-8 print:overflow-visible print:bg-white print:p-4">
                                <div className="grid grid-cols-2 gap-6 md:grid-cols-4 print:grid-cols-4">
                                    {qrs.map((qr) => (
                                        <div
                                            key={qr.roomId}
                                            className="room-qr-print-card flex flex-col items-center rounded-xl border border-border bg-card p-4 text-center text-foreground shadow-sm print:break-inside-avoid print:border print:border-neutral-300 print:bg-white print:shadow-none"
                                        >
                                            <div className="mb-3 aspect-square w-full rounded-lg bg-white p-2 ring-1 ring-black/10 dark:ring-white/20 print:ring-black/20">
                                                <img
                                                    src={qr.qrCode}
                                                    alt={`Room ${qr.roomNumber}`}
                                                    className="h-full w-full object-contain"
                                                />
                                            </div>
                                            <p className="text-lg font-bold print:text-black">Room {qr.roomNumber}</p>
                                            <p className="mb-3 text-xs text-muted-foreground print:mb-0 print:text-neutral-600">
                                                Scan to order
                                            </p>
                                            <div className="flex w-full gap-2 print:hidden">
                                                <Button variant="outline" size="sm" className="flex-1 px-0" onClick={() => downloadQr(qr)}>
                                                    <Download className="mr-1 h-3 w-3" /> PNG
                                                </Button>
                                                <Button variant="outline" size="sm" className="flex-1 px-0" onClick={() => copyUrl(qr)}>
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
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
