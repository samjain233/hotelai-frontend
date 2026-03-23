import type { CSSProperties } from "react";
import type { Hotel } from "@/lib/types";

type RGB = { r: number; g: number; b: number };

const DEFAULT_BG = "#09090b";
const DEFAULT_TEXT = "#fafafa";

function expandHex3(hex: string): string {
    const h = hex.startsWith("#") ? hex.slice(1) : hex;
    if (h.length === 3) {
        return `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`.toLowerCase();
    }
    return hex.startsWith("#") ? hex.toLowerCase() : `#${h.toLowerCase()}`;
}

function hexToRgb(hex: string): RGB | null {
    const h = expandHex3(hex);
    const m = /^#([0-9a-f]{6})$/.exec(h);
    if (!m) return null;
    const n = parseInt(m[1], 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function relativeLuminance({ r, g, b }: RGB): number {
    const lin = (c: number) => {
        const x = c / 255;
        return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
    };
    const R = lin(r);
    const G = lin(g);
    const B = lin(b);
    return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

function mixRgb(a: RGB, b: RGB, t: number): RGB {
    return {
        r: Math.round(a.r + (b.r - a.r) * t),
        g: Math.round(a.g + (b.g - a.g) * t),
        b: Math.round(a.b + (b.b - a.b) * t),
    };
}

function rgbToHex({ r, g, b }: RGB): string {
    return (
        "#" +
        [r, g, b]
            .map((x) => x.toString(16).padStart(2, "0"))
            .join("")
    );
}

export type GuestMenuThemeHotel = Pick<Hotel, "guestMenuBackgroundHex" | "guestMenuTextHex"> | null | undefined;

/**
 * CSS variables for the guest menu. When hotel omits colours, uses current platform defaults (zinc-950 / zinc-100).
 */
export function buildGuestMenuThemeStyle(hotel: GuestMenuThemeHotel): CSSProperties {
    const bgRaw = hotel?.guestMenuBackgroundHex?.trim();
    const textRaw = hotel?.guestMenuTextHex?.trim();
    const bgHex = bgRaw && hexToRgb(bgRaw) ? expandHex3(bgRaw) : DEFAULT_BG;
    const textHex = textRaw && hexToRgb(textRaw) ? expandHex3(textRaw) : DEFAULT_TEXT;

    const bgRgb = hexToRgb(bgHex)!;
    const textRgb = hexToRgb(textHex)!;
    const lum = relativeLuminance(bgRgb);
    const isLightBg = lum > 0.55;

    const surfaceRgb = isLightBg
        ? mixRgb(bgRgb, { r: 0, g: 0, b: 0 }, 0.05)
        : mixRgb(bgRgb, { r: 255, g: 255, b: 255 }, 0.07);
    const surface2Rgb = isLightBg
        ? mixRgb(bgRgb, { r: 0, g: 0, b: 0 }, 0.09)
        : mixRgb(bgRgb, { r: 255, g: 255, b: 255 }, 0.11);
    const mutedRgb = mixRgb(textRgb, bgRgb, 0.45);
    const subtleRgb = mixRgb(textRgb, bgRgb, 0.62);
    const borderRgb = mixRgb(textRgb, bgRgb, isLightBg ? 0.82 : 0.88);
    const lineRgb = mixRgb(borderRgb, bgRgb, 0.5);

    const black = { r: 0, g: 0, b: 0 };
    const white = { r: 255, g: 255, b: 255 };
    const ctaRgb = isLightBg ? mixRgb(textRgb, bgRgb, 0.12) : mixRgb(textRgb, black, 0.35);
    const ctaHoverRgb = isLightBg ? mixRgb(textRgb, bgRgb, 0.2) : mixRgb(textRgb, black, 0.28);

    const onCtaRgb = relativeLuminance(ctaRgb) > 0.45 ? black : white;

    const ta = (a: number) => `rgba(${textRgb.r},${textRgb.g},${textRgb.b},${a})`;

    return {
        "--guest-bg": bgHex,
        "--guest-text": textHex,
        "--guest-surface": rgbToHex(surfaceRgb),
        "--guest-surface-2": rgbToHex(surface2Rgb),
        "--guest-muted": rgbToHex(mutedRgb),
        "--guest-subtle": rgbToHex(subtleRgb),
        "--guest-border": rgbToHex(borderRgb),
        "--guest-line": rgbToHex(lineRgb),
        "--guest-cta": rgbToHex(ctaRgb),
        "--guest-cta-hover": rgbToHex(ctaHoverRgb),
        "--guest-on-cta": rgbToHex(onCtaRgb),
        "--guest-shimmer": rgbToHex(isLightBg ? mixRgb(surfaceRgb, black, 0.12) : mixRgb(surfaceRgb, white, 0.15)),
        "--guest-text-12": ta(0.12),
        "--guest-text-15": ta(0.15),
        "--guest-text-18": ta(0.18),
        "--guest-text-20": ta(0.2),
        "--guest-text-25": ta(0.25),
        "--guest-text-30": ta(0.3),
        "--guest-text-35": ta(0.35),
        "--guest-text-40": ta(0.4),
        "--guest-text-55": ta(0.55),
        "--guest-text-70": ta(0.7),
        "--guest-text-90": ta(0.9),
    } as CSSProperties;
}
