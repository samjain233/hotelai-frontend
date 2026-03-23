import type { CSSProperties } from "react";
import type { Hotel } from "@/lib/types";

type RGB = { r: number; g: number; b: number };

/** When all three are unset → match pre-theming guest menu (zinc + rose/crimson). */
const DEFAULT_BG = "#09090b";
const DEFAULT_TEXT = "#fafafa";
/** Tailwind rose-400 — icons, links, price emphasis */
const DEFAULT_ACCENT = "#fb7185";
/** Tailwind rose-600 — solid CTAs */
const DEFAULT_CTA = "#e11d48";
const DEFAULT_CTA_HOVER = "#f43f5e";

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
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
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

function textAlphaVars(textRgb: RGB): Record<string, string> {
    const t = (a: number) => `rgba(${textRgb.r},${textRgb.g},${textRgb.b},${a})`;
    return {
        "--guest-text-12": t(0.12),
        "--guest-text-15": t(0.15),
        "--guest-text-18": t(0.18),
        "--guest-text-20": t(0.2),
        "--guest-text-25": t(0.25),
        "--guest-text-30": t(0.3),
        "--guest-text-35": t(0.35),
        "--guest-text-40": t(0.4),
        "--guest-text-55": t(0.55),
        "--guest-text-70": t(0.7),
        "--guest-text-90": t(0.9),
    };
}

function accentAlphaVars(accentRgb: RGB): Record<string, string> {
    const ac = (a: number) => `rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},${a})`;
    return {
        "--guest-accent": rgbToHex(accentRgb),
        "--guest-accent-12": ac(0.12),
        "--guest-accent-15": ac(0.15),
        "--guest-accent-18": ac(0.18),
        "--guest-accent-20": ac(0.2),
        "--guest-accent-25": ac(0.25),
        "--guest-accent-30": ac(0.3),
        "--guest-accent-35": ac(0.35),
        "--guest-accent-40": ac(0.4),
        "--guest-accent-55": ac(0.55),
        "--guest-accent-70": ac(0.7),
        "--guest-accent-90": ac(0.9),
    };
}

/** Pixel-close to original Tailwind guest menu (zinc-950 / rose accents). */
function buildLegacyZincRoseTheme(): CSSProperties {
    const textRgb = hexToRgb(DEFAULT_TEXT)!;
    const accentRgb = hexToRgb(DEFAULT_ACCENT)!;

    return {
        "--guest-bg": DEFAULT_BG,
        "--guest-surface": "#18181b",
        "--guest-surface-2": "#27272a",
        "--guest-text": DEFAULT_TEXT,
        "--guest-muted": "#71717a",
        "--guest-subtle": "#52525b",
        "--guest-border": "#52525b",
        "--guest-line": "#27272a",
        "--guest-cta": DEFAULT_CTA,
        "--guest-cta-hover": DEFAULT_CTA_HOVER,
        "--guest-on-cta": "#ffffff",
        "--guest-shimmer": "#3f3f46",
        ...textAlphaVars(textRgb),
        ...accentAlphaVars(accentRgb),
    } as CSSProperties;
}

function buildCustomTheme(bgHex: string, textHex: string, accentHex: string): CSSProperties {
    const bgRgb = hexToRgb(bgHex)!;
    const textRgb = hexToRgb(textHex)!;
    const accentRgb = hexToRgb(accentHex)!;
    const lum = relativeLuminance(bgRgb);
    const isLightBg = lum > 0.55;
    const black = { r: 0, g: 0, b: 0 };
    const white = { r: 255, g: 255, b: 255 };

    const surfaceRgb = isLightBg
        ? mixRgb(bgRgb, black, 0.05)
        : mixRgb(bgRgb, white, 0.07);
    const surface2Rgb = isLightBg
        ? mixRgb(bgRgb, black, 0.09)
        : mixRgb(bgRgb, white, 0.11);
    const mutedRgb = mixRgb(textRgb, bgRgb, 0.45);
    const subtleRgb = mixRgb(textRgb, bgRgb, 0.62);
    const borderRgb = mixRgb(textRgb, bgRgb, isLightBg ? 0.82 : 0.88);
    const lineRgb = mixRgb(borderRgb, bgRgb, 0.5);

    const ctaRgb = isLightBg ? mixRgb(accentRgb, black, 0.15) : mixRgb(accentRgb, black, 0.32);
    const ctaHoverRgb = isLightBg ? mixRgb(accentRgb, black, 0.08) : mixRgb(accentRgb, black, 0.22);
    const onCtaRgb = relativeLuminance(ctaRgb) > 0.45 ? black : white;

    const shimmerRgb = isLightBg ? mixRgb(surfaceRgb, black, 0.12) : mixRgb(surfaceRgb, white, 0.15);

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
        "--guest-shimmer": rgbToHex(shimmerRgb),
        ...textAlphaVars(textRgb),
        ...accentAlphaVars(accentRgb),
    } as CSSProperties;
}

export type GuestMenuThemeHotel =
    | Pick<Hotel, "guestMenuBackgroundHex" | "guestMenuTextHex" | "guestMenuAccentHex">
    | null
    | undefined;

/**
 * Guest menu CSS variables.
 * - All colours unset → legacy dark + rose/crimson (matches pre-customisation UI).
 * - Any colour set → merge with defaults for missing pieces, accent defaults to rose if omitted.
 */
export function buildGuestMenuThemeStyle(hotel: GuestMenuThemeHotel): CSSProperties {
    const bgRaw = hotel?.guestMenuBackgroundHex?.trim();
    const textRaw = hotel?.guestMenuTextHex?.trim();
    const accentRaw = hotel?.guestMenuAccentHex?.trim();

    if (!bgRaw && !textRaw && !accentRaw) {
        return buildLegacyZincRoseTheme();
    }

    const bgHex = bgRaw && hexToRgb(bgRaw) ? expandHex3(bgRaw) : DEFAULT_BG;
    const textHex = textRaw && hexToRgb(textRaw) ? expandHex3(textRaw) : DEFAULT_TEXT;
    const accentHex = accentRaw && hexToRgb(accentRaw) ? expandHex3(accentRaw) : DEFAULT_ACCENT;

    return buildCustomTheme(bgHex, textHex, accentHex);
}
