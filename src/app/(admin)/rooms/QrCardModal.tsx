"use client";

import { useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { Check, Download, ExternalLink, Link, Loader2, Printer, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { QrStandInsertLayout } from "./QrCards";
import { downloadDataUrl, isQrPrintBackgroundLight, resolveQrPrintFrameBackground, type QrPaperSize } from "./qrPrint";

export interface QrCardModalProps {
    open: boolean;
    onClose: () => void;
    title: string;
    subtitle: string;
    qr: { qrCode: string; menuUrl: string } | undefined;
    error: unknown;
    /** Small caps line above the label on A6 stands ("Room"); `null` hides it. */
    eyebrow: string | null;
    /** Big text under the QR: a room number or a place such as "Restaurant". */
    label: string;
    tagline: string;
    downloadName: string;
    /** Extra settings shown above the preview (screen only). */
    children?: ReactNode;
}

/** Preview, download, copy or print a single QR card on A4 or an A6 stand. */
export function QrCardModal({ open, onClose, title, subtitle, qr, error, eyebrow, label, tagline, downloadName, children }: QrCardModalProps) {
    const { hotel } = useAuth();
    const frameBg = useMemo(() => resolveQrPrintFrameBackground(hotel?.qrCodeBackgroundHex), [hotel?.qrCodeBackgroundHex]);
    const cardLight = useMemo(() => isQrPrintBackgroundLight(frameBg), [frameBg]);
    const [paper, setPaper] = useState<QrPaperSize>("a4");
    const [copied, setCopied] = useState(false);
    const a4Label = eyebrow ? `${eyebrow} ${label}` : label;

    async function copyLink() {
        if (!qr) return;
        try {
            await navigator.clipboard.writeText(qr.menuUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error("Could not copy the link");
        }
    }

    return (
        <AnimatePresence>
            {open && (
                <div
                    className={cn(
                        "fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm pb-[env(safe-area-inset-bottom,0px)] print:static print:inset-auto print:bg-transparent print:backdrop-blur-0",
                        paper === "a6" && "room-qr-print-paper-a6",
                    )}
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        onClick={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                        aria-label={title}
                        className={cn(
                            "w-full max-w-md max-h-[92dvh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-border bg-card shadow-2xl print:max-w-none print:rounded-none print:shadow-none print:bg-transparent",
                            paper === "a4" && "print:border print:border-neutral-300",
                            paper === "a6" &&
                                "qr-a4l-print-page qr-a4l-single-room print:min-h-[198mm] print:flex print:flex-col print:items-center print:justify-center print:box-border print:border-0",
                        )}
                    >
                        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 print:hidden">
                            <div className="min-w-0">
                                <h3 className="font-semibold text-foreground">{title}</h3>
                                <p className="text-xs text-muted-foreground">{subtitle}</p>
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                aria-label="Close"
                                className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-3 px-4 pt-3 print:hidden">
                            {children}
                            <div role="group" aria-label="Print paper" className="inline-flex w-full rounded-xl border border-border bg-panel p-1">
                                {(
                                    [
                                        { id: "a4", label: "A4 card" },
                                        { id: "a6", label: "A6 stand" },
                                    ] as const
                                ).map((opt) => (
                                    <button
                                        key={opt.id}
                                        type="button"
                                        aria-pressed={paper === opt.id}
                                        onClick={() => setPaper(opt.id)}
                                        className={cn(
                                            "h-8 flex-1 rounded-lg text-xs font-medium transition-colors",
                                            paper === opt.id ? "bg-secondary text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                                        )}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-center p-4 sm:p-6 print:p-0">
                            {!qr ? (
                                <div className="flex h-72 w-full flex-col items-center justify-center gap-3 text-center text-muted-foreground">
                                    {error ? (
                                        <p className="text-sm">{error instanceof Error ? error.message : "Could not load the QR code"}</p>
                                    ) : (
                                        <>
                                            <Loader2 className="h-7 w-7 animate-spin" />
                                            <p className="text-sm">Generating QR code…</p>
                                        </>
                                    )}
                                </div>
                            ) : paper === "a6" ? (
                                <div
                                    className={cn(
                                        "flex h-[148mm] min-h-[148mm] w-[min(105mm,calc(100vw-2rem))] max-w-full flex-col items-center justify-between rounded-2xl border border-border/80 p-5 print:h-[148mm] print:min-h-0 print:w-[105mm] print:max-h-[148mm] print:border-neutral-300/90 print:px-5 print:py-6",
                                        cardLight ? "text-zinc-900" : "text-zinc-100",
                                    )}
                                    style={{ backgroundColor: frameBg }}
                                >
                                    <QrStandInsertLayout
                                        hotelName={hotel?.name}
                                        showBranding={Boolean(hotel?.name)}
                                        eyebrow={eyebrow}
                                        roomNumber={label}
                                        qrCode={qr.qrCode}
                                        tagline={tagline}
                                        cardTextOnLight={cardLight}
                                        wifiName=""
                                        wifiPass=""
                                        qrBoxClassName="h-[46mm] w-[46mm] sm:h-56 sm:w-56 print:h-[56mm] print:w-[56mm]"
                                    />
                                </div>
                            ) : (
                                <div
                                    className={cn(
                                        "flex w-full flex-col items-center rounded-2xl border border-border/80 px-6 py-7 print:border-0",
                                        cardLight ? "text-zinc-900" : "text-zinc-100",
                                    )}
                                    style={{ backgroundColor: frameBg }}
                                >
                                    {hotel?.name && (
                                        <p className={cn("mb-4 text-center text-sm font-semibold", cardLight ? "text-zinc-800" : "text-zinc-200")}>{hotel.name}</p>
                                    )}
                                    <div
                                        className={cn("h-60 w-60 overflow-hidden rounded-xl ring-1 print:mx-auto print:h-72 print:w-72", cardLight ? "ring-black/15" : "ring-white/25")}
                                        style={{ backgroundColor: frameBg }}
                                    >
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={qr.qrCode} alt={a4Label} className="h-full w-full object-contain" />
                                    </div>
                                    {a4Label && <p className="mt-4 max-w-full break-words text-center text-2xl font-bold">{a4Label}</p>}
                                    <p className={cn("mt-1 text-center text-sm", cardLight ? "text-zinc-600" : "text-zinc-400")}>{tagline}</p>
                                </div>
                            )}
                        </div>

                        {qr && (
                            <div className="px-4 pb-1 print:hidden">
                                <a
                                    href={qr.menuUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-1.5 truncate text-xs text-muted-foreground hover:text-foreground"
                                    title="Open the guest menu this QR code links to"
                                >
                                    <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                                    <span className="truncate">{qr.menuUrl}</span>
                                </a>
                            </div>
                        )}

                        <div className="grid grid-cols-3 gap-2 p-4 print:hidden">
                            <Button variant="outline" className="min-h-11" disabled={!qr} onClick={() => qr && downloadDataUrl(qr.qrCode, downloadName)}>
                                <Download className="w-4 h-4 mr-1.5" /> PNG
                            </Button>
                            <Button variant="outline" className="min-h-11" disabled={!qr} onClick={() => void copyLink()}>
                                {copied ? <Check className="w-4 h-4 mr-1.5 text-emerald-500" /> : <Link className="w-4 h-4 mr-1.5" />}
                                {copied ? "Copied" : "Link"}
                            </Button>
                            <Button className="min-h-11" disabled={!qr} onClick={() => window.print()}>
                                <Printer className="w-4 h-4 mr-1.5" /> Print
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
