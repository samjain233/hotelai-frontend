"use client";

import { useEffect, useState, type ComponentType } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    ExternalLink,
    Smartphone,
    UtensilsCrossed,
    Search,
    Palette,
    QrCode,
    Check,
    LayoutTemplate,
    ListChecks,
    X,
    AlertTriangle,
    RotateCcw,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { AdminPageSkeleton } from "@/components/ui/Skeleton";
import { LegalFooter } from "@/components/LegalFooter";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { buildGuestMenuThemeStyle } from "@/lib/guestMenuTheme";
import {
    GUEST_MENU_TEMPLATES,
    resolveGuestMenuTemplate,
    type GuestMenuTemplate,
} from "@/lib/guestMenuTemplates";
import { GUEST_MENU_TEMPLATE_PREVIEWS } from "@/app/(guest)/menu/[hotelSlug]/templates/previews";

const PICKER_FALLBACK_BG = "#09090b";
const PICKER_FALLBACK_TEXT = "#fafafa";
const PICKER_FALLBACK_ACCENT = "#fb7185";
const PICKER_FALLBACK_QR_FG = "#000000";
const PICKER_FALLBACK_QR_BG = "#ffffff";

type PaletteTone = "premium" | "dark" | "light";
type PalettePreset = { name: string; tone: PaletteTone; bg: string; text: string; accent: string };

/**
 * One-tap palettes. Empty strings mean "use the default", so "Midnight rose" is a true reset.
 * Every pair keeps text on background above 10:1 and accent on background above 3:1.
 */
const PALETTE_PRESETS: PalettePreset[] = [
    // Premium: jewel tones with metallic accents, and restrained stationery-style lights
    { name: "Black & gold", tone: "premium", bg: "#000000", text: "#f5f0e6", accent: "#c9a227" },
    { name: "Onyx & champagne", tone: "premium", bg: "#0d0d0f", text: "#f3ede2", accent: "#d9c3a0" },
    { name: "Emerald & brass", tone: "premium", bg: "#0b2420", text: "#eef5f1", accent: "#c9a961" },
    { name: "Burgundy & rose gold", tone: "premium", bg: "#2b0d12", text: "#f7ecec", accent: "#e0a9a0" },
    { name: "Teal & gold", tone: "premium", bg: "#06232b", text: "#eaf4f4", accent: "#d8b25a" },
    { name: "Imperial plum", tone: "premium", bg: "#22102c", text: "#f4ecf6", accent: "#d5b26a" },
    { name: "Obsidian & platinum", tone: "premium", bg: "#121214", text: "#ececec", accent: "#bfc5cc" },
    { name: "Alabaster & bronze", tone: "premium", bg: "#f8f5ef", text: "#22201c", accent: "#8a6a3b" },
    { name: "Pearl & graphite", tone: "premium", bg: "#f5f5f3", text: "#1a1a1a", accent: "#4b5563" },
    { name: "Ivory & navy", tone: "premium", bg: "#fbf8f1", text: "#15203a", accent: "#1f3a6e" },
    { name: "Cream & espresso", tone: "premium", bg: "#f7f3ec", text: "#2b1d14", accent: "#6b4a2e" },
    // Dark
    { name: "Midnight rose", tone: "dark", bg: "", text: "", accent: "" },
    { name: "Navy & gold", tone: "dark", bg: "#121a33", text: "#f2efe6", accent: "#d4af37" },
    { name: "Heritage maroon", tone: "dark", bg: "#2a1014", text: "#f6e9e4", accent: "#e3a65a" },
    { name: "Forest", tone: "dark", bg: "#0f1a14", text: "#ecf3ee", accent: "#8fd3a5" },
    { name: "Ocean", tone: "dark", bg: "#0b1626", text: "#e8f0fa", accent: "#5ec1e8" },
    { name: "Charcoal & amber", tone: "dark", bg: "#141414", text: "#f5f0e8", accent: "#f0a03c" },
    { name: "Espresso", tone: "dark", bg: "#1c1512", text: "#f1e7dc", accent: "#d19a6a" },
    { name: "Aubergine", tone: "dark", bg: "#1e1424", text: "#f3ecf7", accent: "#c99bd9" },
    { name: "Slate & copper", tone: "dark", bg: "#1a1d21", text: "#e9ecef", accent: "#d08c60" },
    // Light
    { name: "Ivory & gold", tone: "light", bg: "#faf7f2", text: "#1f1a14", accent: "#a67520" },
    { name: "Sand & sage", tone: "light", bg: "#f6f1e9", text: "#2b2622", accent: "#6f8f6a" },
    { name: "Paper & ink", tone: "light", bg: "#ffffff", text: "#111111", accent: "#111111" },
    { name: "Porcelain blue", tone: "light", bg: "#f4f7fb", text: "#1c2533", accent: "#3b6fb6" },
    { name: "Blush", tone: "light", bg: "#fbf3f3", text: "#2a1f22", accent: "#c2566b" },
    { name: "Mint", tone: "light", bg: "#f1f8f4", text: "#1b2a22", accent: "#2f8f6a" },
    { name: "Terracotta", tone: "light", bg: "#f8efe8", text: "#2b1f1a", accent: "#c2603c" },
    { name: "Saffron", tone: "light", bg: "#fff8ee", text: "#2a2118", accent: "#c4680e" },
    { name: "Lavender", tone: "light", bg: "#f6f3fb", text: "#241f2e", accent: "#7c5cbf" },
];

const PALETTE_GROUPS: { tone: PaletteTone; label: string }[] = [
    { tone: "premium", label: "Premium" },
    { tone: "dark", label: "Dark" },
    { tone: "light", label: "Light" },
];

function normalizePickerValue(hex: string | null | undefined, emptyFallback: string): string {
    if (!hex?.trim()) return emptyFallback;
    const h = hex.trim().startsWith("#") ? hex.trim() : `#${hex.trim()}`;
    return /^#[0-9A-Fa-f]{6}$/.test(h) || /^#[0-9A-Fa-f]{3}$/.test(h) ? h : emptyFallback;
}

function hexToRgb(hex: string): [number, number, number] | null {
    let h = hex.replace("#", "");
    if (h.length === 3) h = h.split("").map((c) => c + c).join("");
    if (!/^[0-9A-Fa-f]{6}$/.test(h)) return null;
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

/** WCAG contrast ratio between two hex colours; 1 when either is unparseable. */
function contrastRatio(a: string, b: string): number {
    const lum = (hex: string) => {
        const rgb = hexToRgb(hex);
        if (!rgb) return null;
        const [r, g, b2] = rgb.map((v) => {
            const s = v / 255;
            return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b2;
    };
    const la = lum(a);
    const lb = lum(b);
    if (la === null || lb === null) return 1;
    const [hi, lo] = la > lb ? [la, lb] : [lb, la];
    return (hi + 0.05) / (lo + 0.05);
}

function sameHex(a: string, b: string) {
    return normalizePickerValue(a, "").toLowerCase() === normalizePickerValue(b, "").toLowerCase();
}

/* ------------------------------------------------------------------ */
/* Inspector building blocks                                           */
/* ------------------------------------------------------------------ */

type TabId = "layout" | "colours" | "qr" | "details";

const TABS: { id: TabId; label: string; icon: ComponentType<{ className?: string }> }[] = [
    { id: "layout", label: "Layout", icon: LayoutTemplate },
    { id: "colours", label: "Colours", icon: Palette },
    { id: "qr", label: "QR code", icon: QrCode },
    { id: "details", label: "Details", icon: ListChecks },
];

function FieldGroup({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
    return (
        <div>
            <div className="mb-2.5 flex items-baseline justify-between gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
                {hint ? <p className="truncate text-[11px] text-muted-foreground/80">{hint}</p> : null}
            </div>
            {children}
        </div>
    );
}

type ColorRowProps = {
    label: string;
    hint: string;
    value: string;
    onChange: (v: string) => void;
    fallback: string;
    /** Accessible name when the visible label is not unique on the page. */
    name?: string;
};

/** One line per colour: swatch picker, label, hex input, clear. */
function ColorRow({ label, hint, value, onChange, fallback, name }: ColorRowProps) {
    const pickerVal = normalizePickerValue(value || null, fallback);
    const isCustom = value.trim().length > 0;
    const a11yName = name ?? label;
    return (
        <div className="flex items-center gap-3 px-3 py-2.5">
            <label
                className="relative h-9 w-9 shrink-0 cursor-pointer overflow-hidden rounded-lg ring-1 ring-inset ring-white/10 transition-shadow hover:ring-brand/50 focus-within:ring-2 focus-within:ring-brand/60"
                title="Pick colour"
            >
                <input
                    type="color"
                    value={pickerVal}
                    onChange={(e) => onChange(e.target.value)}
                    className="absolute inset-0 h-[200%] w-[200%] -translate-x-1/4 -translate-y-1/4 cursor-pointer border-0 p-0"
                    aria-label={`Pick ${a11yName.toLowerCase()} colour`}
                />
                <span className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-inset ring-black/20" style={{ backgroundColor: pickerVal }} />
            </label>
            <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">{label}</p>
                <p className="truncate text-[11px] text-muted-foreground">{hint}</p>
            </div>
            <div className="relative shrink-0">
                <input
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={fallback}
                    aria-label={`${a11yName} hex code`}
                    spellCheck={false}
                    className={cn(
                        "h-8 w-[112px] rounded-lg border border-border bg-background/60 pl-2.5 font-mono text-xs text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-brand/60 focus:ring-1 focus:ring-brand/40",
                        isCustom ? "pr-7" : "pr-2.5",
                    )}
                />
                {isCustom ? (
                    <button
                        type="button"
                        onClick={() => onChange("")}
                        className="absolute right-1 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-white/10 hover:text-foreground"
                        aria-label={`Clear ${a11yName.toLowerCase()} colour`}
                        title="Use default"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                ) : null}
            </div>
        </div>
    );
}

function PaletteSwatches({
    bg,
    text,
    accent,
    onApply,
}: {
    bg: string;
    text: string;
    accent: string;
    onApply: (p: PalettePreset) => void;
}) {
    const active = PALETTE_PRESETS.find((p) => sameHex(bg, p.bg) && sameHex(text, p.text) && sameHex(accent, p.accent));
    return (
        <div className="space-y-3">
            {PALETTE_GROUPS.map((g) => (
                <div key={g.tone} className="flex items-center gap-3">
                    <span className={cn("w-14 shrink-0 text-[11px]", g.tone === "premium" ? "font-semibold text-brand" : "text-muted-foreground")}>
                        {g.label}
                    </span>
                    <div className="flex flex-wrap gap-1.5" role="group" aria-label={`${g.label} palettes`}>
                        {PALETTE_PRESETS.filter((p) => p.tone === g.tone).map((p) => {
                            const isActive = active?.name === p.name;
                            const swBg = p.bg || PICKER_FALLBACK_BG;
                            const swText = p.text || PICKER_FALLBACK_TEXT;
                            const swAccent = p.accent || PICKER_FALLBACK_ACCENT;
                            return (
                                <button
                                    key={p.name}
                                    type="button"
                                    onClick={() => onApply(p)}
                                    aria-pressed={isActive}
                                    aria-label={p.name}
                                    title={p.name}
                                    className={cn(
                                        "flex h-7 w-7 items-center justify-center rounded-full ring-1 ring-inset ring-white/15 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
                                        isActive && "scale-110 ring-2 ring-brand ring-offset-2 ring-offset-card",
                                    )}
                                    style={{ backgroundColor: swBg }}
                                >
                                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: swAccent, boxShadow: `0 0 0 1.5px ${swText}` }} aria-hidden />
                                </button>
                            );
                        })}
                    </div>
                </div>
            ))}
            <p className="text-xs text-muted-foreground" aria-live="polite">
                {active ? (
                    <>
                        <span className="font-medium text-foreground">{active.name}</span>
                        {active.bg ? "" : " · default theme"}
                    </>
                ) : (
                    <>
                        <span className="font-medium text-foreground">Custom</span> · set below
                    </>
                )}
            </p>
        </div>
    );
}

function TemplateGrid({ value, onChange }: { value: GuestMenuTemplate; onChange: (t: GuestMenuTemplate) => void }) {
    const selected = GUEST_MENU_TEMPLATES.find((t) => t.id === value) ?? GUEST_MENU_TEMPLATES[0];
    return (
        <div className="space-y-3">
            <div role="radiogroup" aria-label="Menu template" className="grid grid-cols-2 gap-2">
                {GUEST_MENU_TEMPLATES.map((t) => {
                    const isSelected = value === t.id;
                    const Thumbnail = GUEST_MENU_TEMPLATE_PREVIEWS[t.id].Thumbnail;
                    return (
                        <button
                            key={t.id}
                            type="button"
                            role="radio"
                            aria-checked={isSelected}
                            aria-label={t.name}
                            title={t.description}
                            onClick={() => onChange(t.id)}
                            className={cn(
                                "group relative overflow-hidden rounded-xl border text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60",
                                isSelected ? "border-brand ring-1 ring-brand" : "border-border hover:border-white/20",
                            )}
                        >
                            <div className="h-[76px] overflow-hidden bg-zinc-900 p-2" aria-hidden>
                                <Thumbnail />
                            </div>
                            <div className="flex items-center justify-between gap-2 px-2.5 py-1.5">
                                <span className={cn("truncate text-xs font-medium", isSelected ? "text-foreground" : "text-muted-foreground group-hover:text-foreground")}>
                                    {t.name}
                                </span>
                                {isSelected ? <Check className="h-3.5 w-3.5 shrink-0 text-brand" strokeWidth={3} aria-hidden /> : null}
                            </div>
                        </button>
                    );
                })}
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground" aria-live="polite">
                <span className="font-medium text-foreground">{selected.name}.</span> {selected.description}
            </p>
        </div>
    );
}

function ToggleSwitch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={label}
            onClick={() => onChange(!checked)}
            className={cn(
                "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60",
                checked ? "border-brand bg-brand" : "border-white/10 bg-secondary",
            )}
        >
            <span
                className={cn(
                    "inline-block h-[18px] w-[18px] rounded-full bg-white shadow transition-transform",
                    checked ? "translate-x-[22px]" : "translate-x-[3px]",
                )}
            />
        </button>
    );
}

/* ------------------------------------------------------------------ */
/* Preview                                                             */
/* ------------------------------------------------------------------ */

function GuestMenuPreviewMock({ style, template }: { style: React.CSSProperties; template: GuestMenuTemplate }) {
    const PreviewDishes = GUEST_MENU_TEMPLATE_PREVIEWS[template].PreviewDishes;
    return (
        <div className="flex min-h-0 flex-1 flex-col text-left" style={style}>
            <div className="shrink-0 border-b border-[var(--guest-line)] bg-[var(--guest-bg)] px-3 pb-2 pt-2.5">
                <div className="mb-2 flex items-center gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--guest-surface)] text-xs font-bold text-[var(--guest-accent)] ring-1 ring-[var(--guest-line)]">
                        H
                    </div>
                    <div className="min-w-0">
                        <div className="truncate text-xs font-bold text-[var(--guest-text)]">Your hotel</div>
                        <div className="text-[10px] text-[var(--guest-muted)]">Digital menu</div>
                    </div>
                </div>
                <div className="relative">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-[var(--guest-muted)]" />
                    <div className="h-8 w-full rounded-full border border-[var(--guest-line)] bg-[var(--guest-surface)] pl-8 pr-3 text-[10px] leading-8 text-[var(--guest-muted)]">
                        Search dishes…
                    </div>
                </div>
            </div>

            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-[var(--guest-bg)] p-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <div className="flex gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {["All", "Starters", "Mains"].map((c, i) => (
                        <span
                            key={c}
                            className={cn(
                                "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium",
                                i === 1
                                    ? "bg-[var(--guest-accent-20)] text-[var(--guest-accent-90)]"
                                    : "bg-[var(--guest-surface)] text-[var(--guest-muted)] ring-1 ring-[var(--guest-line)]",
                            )}
                        >
                            {c}
                        </span>
                    ))}
                </div>
                <div>
                    <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--guest-muted)]">
                        <UtensilsCrossed className="h-3 w-3 text-[var(--guest-accent)]" aria-hidden />
                        Starters
                    </p>
                    <PreviewDishes />
                </div>
            </div>

            <div className="shrink-0 border-t border-[var(--guest-line)] bg-[var(--guest-surface)] px-3 py-2.5">
                <div className="flex h-9 w-full items-center justify-center rounded-full bg-[var(--guest-cta)] text-xs font-semibold text-[var(--guest-on-cta)] shadow-sm">
                    View cart · 2 items
                </div>
            </div>
        </div>
    );
}

function PhoneFrame({ children }: { children: React.ReactNode }) {
    return (
        <div className="relative w-[300px] max-w-full rounded-[2.25rem] border-[7px] border-zinc-800 bg-zinc-900 p-1.5 shadow-2xl shadow-black/50 ring-1 ring-white/10">
            <div className="absolute left-1/2 top-0 z-10 h-5 w-24 -translate-x-1/2 rounded-b-xl bg-zinc-800" aria-hidden />
            <div className="relative flex h-[400px] flex-col overflow-hidden rounded-[1.75rem] ring-1 ring-black/40 sm:h-[min(620px,calc(100vh-13rem))] sm:min-h-[460px]">
                {children}
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function MenuDesignPage() {
    const { admin, hotel, loading, refreshHotel } = useAuth();
    const router = useRouter();
    const [bgHex, setBgHex] = useState("");
    const [textHex, setTextHex] = useState("");
    const [accentHex, setAccentHex] = useState("");
    const [qrFgHex, setQrFgHex] = useState("");
    const [qrBgHex, setQrBgHex] = useState("");
    const [showItemInsights, setShowItemInsights] = useState(false);
    const [template, setTemplate] = useState<GuestMenuTemplate>("classic");
    const [saving, setSaving] = useState(false);
    const [tab, setTab] = useState<TabId>("layout");

    useEffect(() => {
        if (
            !loading &&
            admin &&
            admin.role !== "OWNER" &&
            admin.role !== "GENERAL_MANAGER" &&
            admin.role !== "MANAGER"
        ) {
            router.replace("/dashboard");
        }
    }, [admin, loading, router]);

    // What the server currently has. The form re-syncs to it whenever it changes (initial load,
    // after save/reset, impersonation switch) using React's adjust-state-during-render pattern.
    const saved = {
        bg: hotel?.guestMenuBackgroundHex?.trim() ?? "",
        text: hotel?.guestMenuTextHex?.trim() ?? "",
        accent: hotel?.guestMenuAccentHex?.trim() ?? "",
        qrFg: hotel?.qrCodeForegroundHex?.trim() ?? "",
        qrBg: hotel?.qrCodeBackgroundHex?.trim() ?? "",
        insights: Boolean(hotel?.guestMenuShowItemInsights),
        template: resolveGuestMenuTemplate(hotel?.guestMenuTemplate),
    };
    const savedKey = hotel ? JSON.stringify(saved) : null;
    const [syncedKey, setSyncedKey] = useState<string | null>(null);
    if (savedKey !== null && savedKey !== syncedKey) {
        setSyncedKey(savedKey);
        setBgHex(saved.bg);
        setTextHex(saved.text);
        setAccentHex(saved.accent);
        setQrFgHex(saved.qrFg);
        setQrBgHex(saved.qrBg);
        setShowItemInsights(saved.insights);
        setTemplate(saved.template);
    }

    const previewStyle = buildGuestMenuThemeStyle({
        guestMenuBackgroundHex: bgHex || null,
        guestMenuTextHex: textHex || null,
        guestMenuAccentHex: accentHex || null,
    });

    const qrPreviewFg = normalizePickerValue(qrFgHex || null, PICKER_FALLBACK_QR_FG);
    const qrPreviewBg = normalizePickerValue(qrBgHex || null, PICKER_FALLBACK_QR_BG);
    const qrContrast = contrastRatio(qrPreviewFg, qrPreviewBg);
    const qrLowContrast = qrContrast < 4;

    const dirtyByTab: Record<TabId, boolean> = {
        layout: template !== saved.template,
        colours: bgHex.trim() !== saved.bg || textHex.trim() !== saved.text || accentHex.trim() !== saved.accent,
        qr: qrFgHex.trim() !== saved.qrFg || qrBgHex.trim() !== saved.qrBg,
        details: showItemInsights !== saved.insights,
    };
    const dirty = Object.values(dirtyByTab).some(Boolean);

    const selectedTemplateName = GUEST_MENU_TEMPLATES.find((t) => t.id === template)?.name ?? "Classic";

    // This page renders only after auth resolves on the client, so reading window here is safe.
    const menuUrl =
        typeof window !== "undefined" && hotel?.slug
            ? `${window.location.origin}/menu/${hotel.slug}`
            : hotel?.slug
              ? `/menu/${hotel.slug}`
              : "";
    const qrPreviewUrl = menuUrl || "https://example.com/menu";

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        if (!hotel) return;
        setSaving(true);
        try {
            await api.updateGuestMenuTheme({
                guestMenuBackgroundHex: bgHex.trim(),
                guestMenuTextHex: textHex.trim(),
                guestMenuAccentHex: accentHex.trim(),
                qrCodeForegroundHex: qrFgHex.trim(),
                qrCodeBackgroundHex: qrBgHex.trim(),
                guestMenuShowItemInsights: showItemInsights,
                guestMenuTemplate: template,
            });
            await refreshHotel();
            toast.success("Guest menu appearance saved.");
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Failed to save");
        } finally {
            setSaving(false);
        }
    }

    /** Clears menu and QR colours in the form only. Save is the single commit; nothing is sent here. */
    function handleReset() {
        setBgHex("");
        setTextHex("");
        setAccentHex("");
        setQrFgHex("");
        setQrBgHex("");
    }

    const coloursAtDefault = !bgHex && !textHex && !accentHex && !qrFgHex && !qrBgHex;

    if (loading || !admin) {
        return <AdminPageSkeleton cardCount={2} />;
    }

    if (admin.role !== "OWNER" && admin.role !== "GENERAL_MANAGER" && admin.role !== "MANAGER") {
        return null;
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mx-auto max-w-6xl pb-8">
                <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[28px]">Menu design</h1>
                        <p className="mt-1 text-sm text-muted-foreground">Layout, colours and QR codes for your guest menu. Changes preview live.</p>
                    </div>
                    {menuUrl ? (
                        <Link
                            href={menuUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/10 px-3 text-sm font-medium text-foreground transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                        >
                            <ExternalLink className="h-4 w-4" aria-hidden />
                            Open guest menu
                        </Link>
                    ) : null}
                </header>

                <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_400px] xl:grid-cols-[minmax(0,1fr)_420px]">
                    {/* Stage */}
                    <section
                        aria-label="Live preview"
                        className="relative flex flex-col items-center justify-center overflow-hidden rounded-3xl border border-border bg-card px-6 pb-10 pt-14 sm:py-12 lg:sticky lg:top-20 lg:min-h-[calc(100vh-7.5rem)]"
                    >
                        <div
                            className="pointer-events-none absolute inset-0 opacity-70"
                            aria-hidden
                            style={{
                                background:
                                    "radial-gradient(60% 50% at 50% 40%, color-mix(in srgb, var(--color-brand) 14%, transparent), transparent 70%)",
                            }}
                        />
                        <div className="absolute left-5 top-5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                            <Smartphone className="h-3.5 w-3.5" aria-hidden />
                            Live preview
                        </div>
                        <span className="absolute right-5 top-5 rounded-full border border-brand/30 bg-brand/10 px-2.5 py-0.5 text-[11px] font-medium text-brand">
                            {selectedTemplateName}
                        </span>

                        <PhoneFrame>
                            <GuestMenuPreviewMock style={previewStyle} template={template} />
                        </PhoneFrame>
                        <p className="absolute bottom-4 text-[11px] text-muted-foreground">Sample dishes, approximate phone layout.</p>
                    </section>

                    {/* Inspector */}
                    <form
                        onSubmit={handleSave}
                        className="flex flex-col overflow-hidden rounded-3xl border border-border bg-card lg:sticky lg:top-20 lg:max-h-[calc(100vh-7.5rem)]"
                    >
                        <div role="tablist" aria-label="Menu design sections" className="grid shrink-0 grid-cols-4 gap-1 border-b border-border p-2">
                            {TABS.map((t) => {
                                const active = tab === t.id;
                                const Icon = t.icon;
                                return (
                                    <button
                                        key={t.id}
                                        type="button"
                                        role="tab"
                                        aria-selected={active}
                                        aria-controls={`panel-${t.id}`}
                                        id={`tab-${t.id}`}
                                        onClick={() => setTab(t.id)}
                                        className={cn(
                                            "relative flex flex-col items-center gap-1 rounded-xl px-1 py-2 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60",
                                            active ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
                                        )}
                                    >
                                        <Icon className={cn("h-4 w-4", active ? "text-brand" : "")} aria-hidden />
                                        {t.label}
                                        {dirtyByTab[t.id] ? (
                                            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-amber-400" aria-label="Unsaved" />
                                        ) : null}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5" id={`panel-${tab}`} role="tabpanel" aria-labelledby={`tab-${tab}`}>
                            {tab === "layout" && <TemplateGrid value={template} onChange={setTemplate} />}

                            {tab === "colours" && (
                                <div className="space-y-6">
                                    <FieldGroup label="Palette" hint="One tap sets all three">
                                        <PaletteSwatches
                                            bg={bgHex}
                                            text={textHex}
                                            accent={accentHex}
                                            onApply={(p) => {
                                                setBgHex(p.bg);
                                                setTextHex(p.text);
                                                setAccentHex(p.accent);
                                            }}
                                        />
                                    </FieldGroup>
                                    <FieldGroup label="Fine-tune" hint="Empty = default">
                                        <div className="divide-y divide-border rounded-xl border border-border">
                                            <ColorRow label="Background" hint="Page behind the menu" value={bgHex} onChange={setBgHex} fallback={PICKER_FALLBACK_BG} />
                                            <ColorRow label="Text" hint="Titles and primary copy" value={textHex} onChange={setTextHex} fallback={PICKER_FALLBACK_TEXT} />
                                            <ColorRow label="Accent" hint="Prices, chips, buttons" value={accentHex} onChange={setAccentHex} fallback={PICKER_FALLBACK_ACCENT} />
                                        </div>
                                    </FieldGroup>
                                </div>
                            )}

                            {tab === "qr" && (
                                <div className="space-y-5">
                                    <div className="flex flex-col items-center gap-2.5">
                                        <div className="rounded-2xl p-3.5 shadow-sm ring-1 ring-black/10" style={{ backgroundColor: qrPreviewBg }}>
                                            <QRCodeSVG value={qrPreviewUrl} size={148} level="M" bgColor={qrPreviewBg} fgColor={qrPreviewFg} />
                                        </div>
                                        <p className="text-center text-[11px] text-muted-foreground">
                                            Sample. Rooms &amp; QR exports use each room&apos;s own link.
                                        </p>
                                    </div>
                                    <div className="divide-y divide-border rounded-xl border border-border">
                                        <ColorRow label="Modules" name="QR modules" hint="The squares, usually dark" value={qrFgHex} onChange={setQrFgHex} fallback={PICKER_FALLBACK_QR_FG} />
                                        <ColorRow label="Background" name="QR background" hint="Quiet zone, usually light" value={qrBgHex} onChange={setQrBgHex} fallback={PICKER_FALLBACK_QR_BG} />
                                    </div>
                                    {qrLowContrast ? (
                                        <p className="flex items-start gap-2 rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-300" role="status">
                                            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                                            Low contrast ({qrContrast.toFixed(1)}:1). Some phones may fail to scan; aim for 4:1 or higher.
                                        </p>
                                    ) : (
                                        <p className="text-[11px] text-muted-foreground">Contrast {qrContrast.toFixed(1)}:1. Keep it above 4:1 so phones scan reliably.</p>
                                    )}
                                </div>
                            )}

                            {tab === "details" && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between gap-4 rounded-xl border border-border px-3.5 py-3">
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-foreground">Show extra dish details</p>
                                            <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                                                Allergens, spice level, dietary tags, portion, calories, chef&apos;s pick and alcohol.
                                            </p>
                                        </div>
                                        <ToggleSwitch checked={showItemInsights} onChange={setShowItemInsights} label="Show extra dish details" />
                                    </div>
                                    <p className="text-xs leading-relaxed text-muted-foreground">
                                        Chips appear under a dish only for fields you have filled in on the Menu page, so an empty field never shows.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="sticky bottom-0 flex shrink-0 items-center justify-between gap-3 border-t border-border bg-card/95 px-4 py-3 backdrop-blur-md">
                            <p className="flex items-center gap-1.5 text-xs" aria-live="polite">
                                {dirty ? (
                                    <>
                                        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" aria-hidden />
                                        <span className="font-medium text-foreground">Unsaved changes</span>
                                    </>
                                ) : (
                                    <>
                                        <Check className="h-3.5 w-3.5 text-emerald-400" aria-hidden />
                                        <span className="text-muted-foreground">Saved</span>
                                    </>
                                )}
                            </p>
                            <div className="flex items-center gap-1.5">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    disabled={saving || coloursAtDefault}
                                    onClick={handleReset}
                                    title="Clear menu and QR colours to the default theme. Takes effect when you save."
                                    className="gap-1.5"
                                >
                                    <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                                    <span className="hidden sm:inline">Reset colours</span>
                                </Button>
                                <Button type="submit" size="sm" disabled={saving || !dirty} loading={saving} className="min-w-[96px]">
                                    {saving ? "Saving" : "Save"}
                                </Button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            <LegalFooter />
        </div>
    );
}
