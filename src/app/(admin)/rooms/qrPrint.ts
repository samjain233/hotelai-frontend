import type { RoomQr } from "@/lib/types";

export type QrLayout = 4 | 6 | 8;

/** A4 = multi-card sheet; A6 = ISO 105×148mm slot with small QR, 2 slots per A4 landscape sheet. */
export type QrPaperSize = "a4" | "a6";

export type A6PrintChunk = { floor: string; pair: RoomQr[]; showFloor: boolean };

export const LAYOUT_OPTIONS: { value: QrLayout; label: string; cols: string; desc: string }[] = [
    { value: 4, label: "Large", cols: "qr-print-cols-2", desc: "4 / page" },
    { value: 6, label: "Medium", cols: "qr-print-cols-3", desc: "6 / page" },
    { value: 8, label: "Compact", cols: "qr-print-cols-4", desc: "8 / page" },
];

/** Label used for rooms saved without a floor. */
export const NO_FLOOR = "—";

/** Matches server QR `light` colour so the print frame has no white margin around the PNG. */
export function resolveQrPrintFrameBackground(hex: string | null | undefined): string {
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
export function isQrPrintBackgroundLight(hex: string): boolean {
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

/** Group anything with a floor by floor, sorted naturally ("2" before "10"); no floor sorts as "—". */
export function groupByFloor<T>(items: T[], floorOf: (item: T) => string | null | undefined): [string, T[]][] {
    const groups = new Map<string, T[]>();
    for (const item of items) {
        const floor = floorOf(item)?.trim() || NO_FLOOR;
        const list = groups.get(floor) ?? [];
        list.push(item);
        groups.set(floor, list);
    }
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }));
}

export function floorLabel(floor: string) {
    return floor === NO_FLOOR ? "No floor" : `Floor ${floor}`;
}

export function downloadDataUrl(dataUrl: string, fileName: string) {
    const a = document.createElement("a");
    a.download = fileName;
    a.href = dataUrl;
    a.click();
}

export function downloadQr(qr: RoomQr) {
    downloadDataUrl(qr.qrCode, `room-${qr.roomNumber}-qr.png`);
}
