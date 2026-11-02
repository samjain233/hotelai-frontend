"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { CheckSquare, Hotel, LayoutGrid, Loader2, MinusSquare, Printer, QrCode, Scissors, Square, Wifi, X } from "lucide-react";
import { useAllRoomQrs } from "@/hooks/useSwrApi";
import type { RoomQr } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { QrCard } from "./QrCards";
import {
    LAYOUT_OPTIONS,
    downloadQr,
    floorLabel,
    groupByFloor,
    isQrPrintBackgroundLight,
    resolveQrPrintFrameBackground,
    type A6PrintChunk,
    type QrLayout,
    type QrPaperSize,
} from "./qrPrint";

const sidebarInputClass =
    "w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary";

interface QrPrintModalProps {
    open: boolean;
    onClose: () => void;
    /** Rooms to tick when the modal opens; `null` ticks every room. */
    preselectRoomIds: string[] | null;
}

/** Print or save as PDF the QR cards for many rooms at once, with layout and branding options. */
export function QrPrintModal({ open, onClose, preselectRoomIds }: QrPrintModalProps) {
    const { hotel } = useAuth();
    const qrPrintFrameBg = useMemo(() => resolveQrPrintFrameBackground(hotel?.qrCodeBackgroundHex), [hotel?.qrCodeBackgroundHex]);
    const qrPrintCardLight = useMemo(() => isQrPrintBackgroundLight(qrPrintFrameBg), [qrPrintFrameBg]);

    const { data, error, isLoading: loading, mutate: retry } = useAllRoomQrs(open);
    const qrs = useMemo(() => data ?? [], [data]);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [qrPaperSize, setQrPaperSize] = useState<QrPaperSize>("a4");
    const [qrLayout, setQrLayout] = useState<QrLayout>(8);
    const [qrTagline, setQrTagline] = useState("Scan to order");
    const [qrWifiName, setQrWifiName] = useState("");
    const [qrWifiPass, setQrWifiPass] = useState("");
    const [qrShowBranding, setQrShowBranding] = useState(true);
    const [qrShowCutGuides, setQrShowCutGuides] = useState(false);
    /** `null` until the user changes the selection; until then the preselection (or every room) applies. */
    const [pickedIds, setPickedIds] = useState<Set<string> | null>(null);

    const qrSelectedIds = useMemo(() => {
        if (pickedIds) return pickedIds;
        const wanted = preselectRoomIds ? new Set(preselectRoomIds) : null;
        return new Set(qrs.map((q) => q.roomId).filter((id) => !wanted || wanted.has(id)));
    }, [pickedIds, preselectRoomIds, qrs]);

    function close() {
        setPickedIds(null);
        onClose();
    }

    async function copyUrl(qr: RoomQr) {
        try {
            await navigator.clipboard.writeText(qr.menuUrl);
            setCopiedId(qr.roomId);
            setTimeout(() => setCopiedId(null), 2000);
        } catch {
            toast.error("Could not copy the link");
        }
    }

    function toggleRoom(roomId: string) {
        const next = new Set(qrSelectedIds);
        if (next.has(roomId)) next.delete(roomId);
        else next.add(roomId);
        setPickedIds(next);
    }

    function toggleFloor(floorQrs: RoomQr[]) {
        const next = new Set(qrSelectedIds);
        const ids = floorQrs.map((q) => q.roomId);
        if (ids.every((id) => next.has(id))) ids.forEach((id) => next.delete(id));
        else ids.forEach((id) => next.add(id));
        setPickedIds(next);
    }

    const floorGroups = useMemo(() => groupByFloor(qrs, (q) => q.floor), [qrs]);
    const selectedQrs = useMemo(() => qrs.filter((q) => qrSelectedIds.has(q.roomId)), [qrs, qrSelectedIds]);
    const printFloorGroups = useMemo(() => groupByFloor(selectedQrs, (q) => q.floor), [selectedQrs]);

    /** Pairs of rooms per printed A4 landscape page (two A6 portrait cut areas). */
    const a6PrintChunks = useMemo((): A6PrintChunk[] => {
        const out: A6PrintChunk[] = [];
        for (const [floor, floorQrs] of printFloorGroups) {
            for (let i = 0; i < floorQrs.length; i += 2) {
                out.push({ floor, pair: floorQrs.slice(i, i + 2), showFloor: i === 0 });
            }
        }
        return out;
    }, [printFloorGroups]);

    const layoutCols = LAYOUT_OPTIONS.find((o) => o.value === qrLayout)!.cols;

    const cardProps = (qr: RoomQr) => ({
        qr,
        layout: qrLayout,
        tagline: qrTagline,
        wifiName: qrWifiName,
        wifiPass: qrWifiPass,
        showBranding: qrShowBranding,
        hotelName: hotel?.name,
        qrCardBackground: qrPrintFrameBg,
        cardTextOnLight: qrPrintCardLight,
        copiedId,
        onDownload: () => downloadQr(qr),
        onCopy: () => copyUrl(qr),
    });

    return (
        <AnimatePresence>
            {open && (
                <div
                    className={cn(
                        "room-qr-print-backdrop fixed inset-0 z-50 flex items-end lg:items-center justify-center p-0 sm:p-2 lg:p-4 bg-black/80 backdrop-blur-sm pb-[env(safe-area-inset-bottom,0px)] print:static print:inset-auto print:flex print:min-h-0 print:items-start print:justify-start print:overflow-visible print:bg-transparent print:backdrop-blur-0",
                        qrPaperSize === "a6" && "room-qr-print-paper-a6",
                    )}
                    onClick={close}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        onClick={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                        aria-label="Print QR cards"
                        className="room-qr-print-modal flex flex-col lg:flex-row h-[96dvh] max-h-[96dvh] lg:h-[92vh] lg:max-h-[92vh] w-full max-w-[1200px] sm:mx-auto rounded-t-2xl lg:rounded-2xl border border-border bg-card shadow-2xl overflow-hidden print:block print:h-auto print:max-h-none print:min-h-0 print:w-full print:max-w-none print:mx-0 print:overflow-visible print:rounded-none print:border-0 print:bg-white print:shadow-none"
                    >
                        {/* Settings sidebar (screen only) */}
                        <aside className="flex w-full shrink-0 flex-col overflow-hidden border-b border-border bg-panel min-h-0 max-h-[40vh] lg:max-h-none lg:w-[300px] lg:border-b-0 lg:border-r print:hidden">
                            <div className="shrink-0 px-4 py-3.5 border-b border-border">
                                <h3 className="text-sm font-semibold text-foreground">Print settings</h3>
                                <p className="text-xs text-muted-foreground mt-0.5">Choose paper, layout and which rooms to print</p>
                            </div>

                            <div className="min-h-0 flex-1 overflow-y-auto p-4 space-y-5 text-sm">
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground mb-2">Paper size</p>
                                    <div className="grid grid-cols-2 gap-1.5">
                                        {(
                                            [
                                                { id: "a4", label: "A4 sheet", hint: "4 / 6 / 8 per page" },
                                                { id: "a6", label: "A6 stand", hint: "2 per A4 landscape" },
                                            ] as const
                                        ).map((opt) => (
                                            <button
                                                key={opt.id}
                                                type="button"
                                                aria-pressed={qrPaperSize === opt.id}
                                                onClick={() => setQrPaperSize(opt.id)}
                                                className={cn(
                                                    "rounded-lg border px-2 py-2.5 text-center transition-all",
                                                    qrPaperSize === opt.id
                                                        ? "border-primary bg-primary/10 text-primary"
                                                        : "border-border bg-secondary/50 text-muted-foreground hover:border-primary/40",
                                                )}
                                            >
                                                <span className="block text-xs font-semibold">{opt.label}</span>
                                                <span className="block text-[10px] opacity-70 mt-0.5">{opt.hint}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-2">
                                        <LayoutGrid className="w-3.5 h-3.5" /> Layout
                                    </p>
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
                                                    aria-pressed={qrLayout === opt.value}
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

                                <div>
                                    <label htmlFor="qr-tagline" className="text-xs font-medium text-muted-foreground mb-1.5 block">
                                        Tagline
                                    </label>
                                    <input
                                        id="qr-tagline"
                                        type="text"
                                        value={qrTagline}
                                        onChange={(e) => setQrTagline(e.target.value)}
                                        placeholder="Scan to order"
                                        className={sidebarInputClass}
                                    />
                                </div>

                                <div>
                                    <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1.5">
                                        <Wifi className="w-3.5 h-3.5" /> Wi-Fi (optional)
                                    </p>
                                    <div className="space-y-1.5">
                                        <input
                                            type="text"
                                            value={qrWifiName}
                                            onChange={(e) => setQrWifiName(e.target.value)}
                                            placeholder="Network name"
                                            aria-label="Wi-Fi network name"
                                            className={sidebarInputClass}
                                        />
                                        <input
                                            type="text"
                                            value={qrWifiPass}
                                            onChange={(e) => setQrWifiPass(e.target.value)}
                                            placeholder="Password"
                                            aria-label="Wi-Fi password"
                                            className={sidebarInputClass}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Toggle icon={Hotel} label="Hotel name on cards" checked={qrShowBranding} onChange={setQrShowBranding} />
                                    <Toggle icon={Scissors} label="Cut guides" checked={qrShowCutGuides} onChange={setQrShowCutGuides} />
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-xs font-medium text-muted-foreground">Rooms</p>
                                        <div className="flex gap-1">
                                            <button
                                                type="button"
                                                onClick={() => setPickedIds(new Set(qrs.map((q) => q.roomId)))}
                                                className="text-[11px] text-primary hover:underline"
                                            >
                                                All
                                            </button>
                                            <span className="text-[11px] text-muted-foreground">/</span>
                                            <button type="button" onClick={() => setPickedIds(new Set())} className="text-[11px] text-primary hover:underline">
                                                None
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-2 max-h-[220px] overflow-y-auto rounded-lg border border-border bg-secondary/20 p-2">
                                        {floorGroups.map(([floor, floorQrs]) => {
                                            const floorIds = floorQrs.map((q) => q.roomId);
                                            const allChecked = floorIds.every((id) => qrSelectedIds.has(id));
                                            const someChecked = !allChecked && floorIds.some((id) => qrSelectedIds.has(id));
                                            return (
                                                <div key={floor}>
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleFloor(floorQrs)}
                                                        className="flex w-full items-center gap-1.5 py-1 text-xs font-semibold text-foreground hover:text-primary"
                                                    >
                                                        {allChecked ? (
                                                            <CheckSquare className="w-3.5 h-3.5 text-primary" />
                                                        ) : someChecked ? (
                                                            <MinusSquare className="w-3.5 h-3.5 text-primary/60" />
                                                        ) : (
                                                            <Square className="w-3.5 h-3.5 text-muted-foreground" />
                                                        )}
                                                        {floorLabel(floor)}
                                                        <span className="text-[10px] font-normal text-muted-foreground ml-auto">{floorQrs.length}</span>
                                                    </button>
                                                    <div className="ml-5 flex flex-wrap gap-1 pb-1">
                                                        {floorQrs.map((qr) => (
                                                            <button
                                                                key={qr.roomId}
                                                                type="button"
                                                                aria-pressed={qrSelectedIds.has(qr.roomId)}
                                                                onClick={() => toggleRoom(qr.roomId)}
                                                                className={cn(
                                                                    "rounded px-2 py-0.5 text-[11px] font-medium border transition-all tabular-nums",
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
                                    <p className="text-[11px] text-muted-foreground mt-1 tabular-nums">
                                        {qrSelectedIds.size} of {qrs.length} selected
                                    </p>
                                </div>
                            </div>

                            <div className="shrink-0 border-t border-border p-4 space-y-2">
                                <Button className="w-full min-h-11" onClick={() => window.print()} disabled={qrSelectedIds.size === 0}>
                                    <Printer className="w-4 h-4 mr-2" /> Print{" "}
                                    {qrSelectedIds.size > 0 ? `${qrSelectedIds.size} card${qrSelectedIds.size > 1 ? "s" : ""}` : ""}
                                </Button>
                                <p className="text-center text-[11px] text-muted-foreground">Choose &ldquo;Save as PDF&rdquo; in the print dialog to send to a printer shop.</p>
                            </div>
                        </aside>

                        {/* Preview (screen + print) */}
                        <div className="flex min-h-[45vh] flex-1 flex-col overflow-hidden lg:min-h-0 print:block print:h-auto print:w-full print:min-h-0 print:overflow-visible print:max-h-none">
                            <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3 print:hidden shrink-0">
                                <div>
                                    <h3 className="text-base font-semibold text-foreground">Preview</h3>
                                    <p className="text-xs text-muted-foreground tabular-nums">
                                        {selectedQrs.length} room{selectedQrs.length !== 1 ? "s" : ""}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={close}
                                    aria-label="Close"
                                    className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="hidden print:block px-4 pt-4 pb-2">
                                {qrShowBranding && hotel?.name && <p className="mb-2 text-center text-lg font-bold text-black">{hotel.name}</p>}
                                <p className="text-center text-sm text-neutral-500 mb-1">Room QR Codes</p>
                            </div>

                            <div className="min-h-0 flex-1 overflow-y-auto bg-canvas p-3 sm:p-6 print:block print:h-auto print:w-full print:min-h-0 print:overflow-visible print:bg-white print:p-2 print:max-h-none">
                                {error && !data ? (
                                    <div className="flex flex-col items-center justify-center gap-3 py-20 text-center text-muted-foreground">
                                        <p className="text-sm">{error instanceof Error ? error.message : "Could not load QR codes"}</p>
                                        <Button variant="outline" className="h-10" onClick={() => void retry()}>
                                            Try again
                                        </Button>
                                    </div>
                                ) : loading ? (
                                    <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground">
                                        <Loader2 className="h-7 w-7 animate-spin" />
                                        <p className="text-sm">Generating QR codes…</p>
                                    </div>
                                ) : qrPaperSize === "a6" ? (
                                    a6PrintChunks.map((row, idx) => (
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
                                                    {floorLabel(row.floor)}
                                                </h4>
                                            )}
                                            <div
                                                className={cn(
                                                    "flex w-full max-w-[calc(105mm*2+2.5rem)] flex-row flex-wrap justify-center gap-6 print:max-w-none print:flex-nowrap print:justify-center print:gap-[8mm]",
                                                    qrShowCutGuides && "qr-cut-guides",
                                                )}
                                            >
                                                {row.pair.map((qr) => (
                                                    <QrCard key={qr.roomId} {...cardProps(qr)} paperA6 />
                                                ))}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    printFloorGroups.map(([floor, floorQrs]) => (
                                        <div key={floor} className="qr-print-floor-block mb-6 print:mb-0 last:mb-0">
                                            {floorGroups.length > 1 && (
                                                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1 print:text-black print:text-sm print:mb-2 print:border-b print:border-neutral-200 print:pb-1">
                                                    {floorLabel(floor)}
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
                                                    <QrCard key={qr.roomId} {...cardProps(qr)} paperA6={false} />
                                                ))}
                                            </div>
                                        </div>
                                    ))
                                )}

                                {data && selectedQrs.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                                        <QrCode className="w-10 h-10 mb-3 opacity-30" />
                                        <p className="text-sm">No rooms selected</p>
                                        <p className="text-xs mt-1">Pick rooms in the settings panel to preview their cards</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

function Toggle({
    icon: Icon,
    label,
    checked,
    onChange,
}: {
    icon: typeof Hotel;
    label: string;
    checked: boolean;
    onChange: (next: boolean) => void;
}) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={() => onChange(!checked)}
            className="flex w-full items-center gap-2.5 rounded-lg border border-border bg-secondary/30 px-3 py-2 text-xs transition-colors hover:bg-secondary/60"
        >
            <Icon className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="flex-1 text-left text-foreground">{label}</span>
            <span
                className={cn("relative flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors", checked ? "bg-primary" : "bg-muted-foreground/25")}
                aria-hidden
            >
                <span
                    className={cn(
                        "block h-4 w-4 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ease-out",
                        checked ? "translate-x-4" : "translate-x-0",
                    )}
                />
            </span>
        </button>
    );
}
