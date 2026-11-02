"use client";

import { Check, Download, Link, Wifi } from "lucide-react";
import type { RoomQr } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { QrLayout } from "./qrPrint";

/** Shared layout for A6 stand inserts: serif branding, QR medallion, typographic room block. */
export function QrStandInsertLayout({
    hotelName,
    showBranding,
    eyebrow = "Room",
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
    /** Small caps line above the big label; `null` hides it (e.g. the hotel-wide QR). */
    eyebrow?: string | null;
    /** Big label under the QR: a room number, or a place name for the hotel-wide QR. */
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
                        "mb-2.5 h-[3px] w-14 rounded-full print:mb-1.5",
                        t
                            ? "bg-gradient-to-r from-amber-900/20 via-amber-700/50 to-amber-900/20"
                            : "bg-gradient-to-r from-white/15 via-white/45 to-white/15",
                    )}
                    aria-hidden
                />
                {showBranding && hotelName ? (
                    <p
                        className={cn(
                            "font-serif max-w-[92mm] text-center text-[13px] font-semibold leading-snug tracking-[0.12em] sm:text-sm print:text-[12px] print:leading-snug",
                            t ? "text-zinc-800" : "text-zinc-200",
                        )}
                    >
                        {hotelName}
                    </p>
                ) : (
                    <span className="h-4 print:h-3" aria-hidden />
                )}
            </header>

            <div className="flex min-h-0 flex-1 flex-col items-center justify-center py-1 print:py-1.5">
                <div
                    className={cn(
                        "rounded-2xl p-3 shadow-[0_6px_28px_rgba(0,0,0,0.09)] ring-1 ring-inset print:rounded-xl print:p-2 print:shadow-[0_4px_20px_rgba(0,0,0,0.07)]",
                        t ? "bg-white ring-black/[0.07]" : "bg-white ring-black/10",
                    )}
                >
                    <div className={cn("overflow-hidden rounded-lg", qrBoxClassName)}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={qrCode} alt={eyebrow ? `${eyebrow} ${roomNumber}` : roomNumber || "QR code"} className="h-full w-full object-contain" />
                    </div>
                </div>
            </div>

            <footer className="flex w-full flex-col items-center gap-1.5 shrink-0 text-center">
                {eyebrow && (
                    <span
                        className={cn(
                            "text-[9px] font-semibold uppercase tracking-[0.32em] print:text-[9px]",
                            t ? "text-zinc-600" : "text-zinc-400",
                        )}
                    >
                        {eyebrow}
                    </span>
                )}
                <p
                    className={cn(
                        "max-w-[92mm] break-words font-serif text-[2.1rem] font-semibold leading-none tracking-tight sm:text-[2.2rem] print:text-[2.05rem]",
                        t ? "text-zinc-900" : "text-zinc-50",
                    )}
                >
                    {roomNumber}
                </p>
                <div className={cn("my-1 h-px w-11 print:my-0.5", t ? "bg-zinc-300/90" : "bg-zinc-500/80")} aria-hidden />
                <p
                    className={cn(
                        "max-w-[90mm] text-[11px] font-semibold uppercase tracking-[0.18em] print:text-[10px]",
                        t ? "text-zinc-600" : "text-zinc-400",
                    )}
                >
                    {tagline?.trim() || "Scan to order"}
                </p>
                {hasWifi && (
                    <div
                        className={cn(
                            "mt-1 flex max-w-[92mm] items-center justify-center gap-1.5 text-[10px] leading-snug print:mt-1.5 print:text-[9px]",
                            t ? "text-zinc-600" : "text-zinc-400",
                        )}
                    >
                        <Wifi className="h-3 w-3 shrink-0 opacity-80" />
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

export function QrCard({
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

    const actions = (
        <>
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
        </>
    );

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
                    qrBoxClassName="h-[46mm] w-[46mm] sm:h-56 sm:w-56 print:h-[56mm] print:w-[56mm]"
                />
                <div className="mt-auto flex w-full gap-1.5 pt-3 print:hidden">{actions}</div>
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

            <div
                className={cn("aspect-square w-full overflow-hidden rounded-lg p-0 ring-1", ringQr, isLarge ? "mb-4" : "mb-2")}
                style={{ backgroundColor: qrCardBackground }}
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qr.qrCode} alt={`Room ${qr.roomNumber}`} className="h-full w-full object-contain" />
            </div>

            <p className={cn("font-bold", isLarge ? "text-2xl" : "text-lg")}>Room {qr.roomNumber}</p>

            <p className={cn(textMuted, isLarge ? "mt-1 text-sm" : "text-[11px]", hasWifi ? "mb-1" : "mb-2 print:mb-0")}>
                {tagline || "Scan to order"}
            </p>

            {hasWifi && (
                <div className={cn("mb-2 flex items-center gap-1 print:mb-1", textMuted, isLarge ? "text-xs" : "text-[10px]")}>
                    <Wifi className="h-3 w-3 shrink-0" />
                    <span className="truncate">
                        {wifiName.trim()}
                        {wifiName.trim() && wifiPass.trim() ? " · " : ""}
                        {wifiPass.trim()}
                    </span>
                </div>
            )}

            <div className="mt-auto flex w-full gap-1.5 print:hidden">{actions}</div>
        </div>
    );
}
