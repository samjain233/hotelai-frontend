"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    Palette,
    ExternalLink,
    Smartphone,
    UtensilsCrossed,
    Search,
    Info,
    Sparkles,
    QrCode,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AdminPageSkeleton } from "@/components/ui/Skeleton";
import { LegalFooter } from "@/components/LegalFooter";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { buildGuestMenuThemeStyle } from "@/lib/guestMenuTheme";

const PICKER_FALLBACK_BG = "#09090b";
const PICKER_FALLBACK_TEXT = "#fafafa";
const PICKER_FALLBACK_ACCENT = "#fb7185";
const PICKER_FALLBACK_QR_FG = "#000000";
const PICKER_FALLBACK_QR_BG = "#ffffff";

function normalizePickerValue(hex: string | null | undefined, emptyFallback: string): string {
    if (!hex?.trim()) return emptyFallback;
    const h = hex.trim().startsWith("#") ? hex.trim() : `#${hex.trim()}`;
    return /^#[0-9A-Fa-f]{6}$/.test(h) || /^#[0-9A-Fa-f]{3}$/.test(h) ? h : emptyFallback;
}

type ColorFieldProps = {
    label: string;
    hint: string;
    value: string;
    onChange: (v: string) => void;
    fallback: string;
    placeholder: string;
    ariaLabel: string;
};

function ColorField({ label, hint, value, onChange, fallback, placeholder, ariaLabel }: ColorFieldProps) {
    const pickerVal = normalizePickerValue(value || null, fallback);
    return (
        <div className="group rounded-xl border border-border/80 bg-secondary/20 p-4 transition-colors hover:border-border hover:bg-secondary/30">
            <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                    <p className="text-sm font-semibold text-foreground">{label}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{hint}</p>
                </div>
                <label
                    className={cn(
                        "relative flex h-12 w-12 shrink-0 cursor-pointer overflow-hidden rounded-xl",
                        "ring-2 ring-white/5 transition-shadow hover:ring-primary/40 focus-within:ring-primary/50",
                    )}
                    title="Pick colour"
                >
                    <input
                        type="color"
                        value={pickerVal}
                        onChange={(e) => onChange(e.target.value)}
                        className="absolute inset-0 h-[200%] w-[200%] -translate-x-1/4 -translate-y-1/4 cursor-pointer border-0 p-0"
                        aria-label={ariaLabel}
                    />
                    <span
                        className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-black/20"
                        style={{ backgroundColor: pickerVal }}
                    />
                </label>
            </div>
            <div className="flex items-center gap-2">
                <span className="select-none font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Hex</span>
                <Input
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="h-9 flex-1 bg-background/60 font-mono text-sm"
                    spellCheck={false}
                />
            </div>
        </div>
    );
}

function GuestMenuPreviewMock({ style }: { style: React.CSSProperties }) {
    return (
        <div
            className="flex min-h-0 flex-1 flex-col text-left"
            style={style}
        >
            {/* Mini header */}
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

            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-[var(--guest-bg)] p-3">
                {/* Category chips */}
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
                    <div className="space-y-2.5">
                        <div className="flex gap-2.5 rounded-xl border border-[var(--guest-line)] bg-[var(--guest-surface)] p-2.5">
                            <div className="h-14 w-14 shrink-0 rounded-lg bg-[var(--guest-shimmer)]/50 ring-1 ring-[var(--guest-line)]" />
                            <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold text-[var(--guest-text)]">Sample dish name</p>
                                <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-[var(--guest-muted)]">
                                    Description uses the muted tone so longer copy stays readable.
                                </p>
                                <p className="mt-1 text-xs font-bold text-[var(--guest-accent)]">₹499</p>
                            </div>
                        </div>
                        <div className="flex gap-2.5 rounded-xl border border-[var(--guest-line)] bg-[var(--guest-surface)] p-2.5">
                            <div className="h-14 w-14 shrink-0 rounded-lg bg-[var(--guest-shimmer)]/50 ring-1 ring-[var(--guest-line)]" />
                            <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold text-[var(--guest-text)]">Second item</p>
                                <p className="mt-1 text-xs font-bold text-[var(--guest-accent)]">₹350</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Cart bar */}
            <div className="shrink-0 border-t border-[var(--guest-line)] bg-[var(--guest-surface)] px-3 py-2.5">
                <div className="flex h-9 w-full items-center justify-center rounded-full bg-[var(--guest-cta)] text-xs font-semibold text-[var(--guest-on-cta)] shadow-sm">
                    View cart · 2 items
                </div>
            </div>
        </div>
    );
}

export default function MenuDesignPage() {
    const { admin, hotel, loading, refreshHotel } = useAuth();
    const router = useRouter();
    const [bgHex, setBgHex] = useState("");
    const [textHex, setTextHex] = useState("");
    const [accentHex, setAccentHex] = useState("");
    const [qrFgHex, setQrFgHex] = useState("");
    const [qrBgHex, setQrBgHex] = useState("");
    const [showItemInsights, setShowItemInsights] = useState(false);
    const [saving, setSaving] = useState(false);
    const [qrPreviewUrl, setQrPreviewUrl] = useState("https://example.com/menu");

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

    useEffect(() => {
        setBgHex(hotel?.guestMenuBackgroundHex?.trim() ?? "");
        setTextHex(hotel?.guestMenuTextHex?.trim() ?? "");
        setAccentHex(hotel?.guestMenuAccentHex?.trim() ?? "");
        setQrFgHex(hotel?.qrCodeForegroundHex?.trim() ?? "");
        setQrBgHex(hotel?.qrCodeBackgroundHex?.trim() ?? "");
        setShowItemInsights(Boolean(hotel?.guestMenuShowItemInsights));
    }, [
        hotel?.guestMenuBackgroundHex,
        hotel?.guestMenuTextHex,
        hotel?.guestMenuAccentHex,
        hotel?.qrCodeForegroundHex,
        hotel?.qrCodeBackgroundHex,
        hotel?.guestMenuShowItemInsights,
    ]);

    useEffect(() => {
        if (hotel?.slug && typeof window !== "undefined") {
            setQrPreviewUrl(`${window.location.origin}/menu/${hotel.slug}`);
        }
    }, [hotel?.slug]);

    const previewStyle = buildGuestMenuThemeStyle({
        guestMenuBackgroundHex: bgHex || null,
        guestMenuTextHex: textHex || null,
        guestMenuAccentHex: accentHex || null,
    });

    const qrPreviewFg = normalizePickerValue(qrFgHex || null, PICKER_FALLBACK_QR_FG);
    const qrPreviewBg = normalizePickerValue(qrBgHex || null, PICKER_FALLBACK_QR_BG);

    const menuUrl =
        typeof window !== "undefined" && hotel?.slug
            ? `${window.location.origin}/menu/${hotel.slug}`
            : hotel?.slug
              ? `/menu/${hotel.slug}`
              : "";

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
            });
            await refreshHotel();
            toast.success("Guest menu appearance saved.");
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Failed to save");
        } finally {
            setSaving(false);
        }
    }

    async function handleReset() {
        if (!hotel) return;
        setSaving(true);
        try {
            await api.updateGuestMenuTheme({
                guestMenuBackgroundHex: "",
                guestMenuTextHex: "",
                guestMenuAccentHex: "",
                qrCodeForegroundHex: "",
                qrCodeBackgroundHex: "",
            });
            setBgHex("");
            setTextHex("");
            setAccentHex("");
            setQrFgHex("");
            setQrBgHex("");
            await refreshHotel();
            toast.success("Reset to default guest menu theme.");
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Failed to reset");
        } finally {
            setSaving(false);
        }
    }

    if (loading || !admin) {
        return <AdminPageSkeleton cardCount={2} />;
    }

    if (admin.role !== "OWNER" && admin.role !== "GENERAL_MANAGER" && admin.role !== "MANAGER") {
        return null;
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Page backdrop */}
            <div className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-b from-primary/12 via-transparent to-transparent" />

            <div className="mx-auto max-w-6xl space-y-8 pb-8">
                <header className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
                            <Palette className="h-5 w-5 text-primary" aria-hidden />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Menu design</h1>
                            <p className="text-sm text-muted-foreground">
                                Theme your <span className="font-medium text-foreground">guest-facing menu</span> and{" "}
                                <span className="font-medium text-foreground">printed room QR codes</span> (export from Rooms).
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-3 rounded-xl border border-primary/15 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
                        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                        <div className="space-y-1 leading-relaxed">
                            <p>
                                Use the <strong className="font-medium text-foreground">colour tiles</strong> or type a{" "}
                                <code className="rounded bg-secondary px-1 py-0.5 font-mono text-xs">#RRGGBB</code> hex code.
                            </p>
                            <p>
                                Leave <strong className="font-medium text-foreground">all three</strong> empty and save (or use Reset) for the
                                original dark theme with rose accents. <strong className="font-medium text-foreground">Accent</strong> drives
                                prices, chips, icons, and primary buttons.
                            </p>
                        </div>
                    </div>
                </header>

                <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(300px,380px)] xl:gap-10">
                    {/* Colours */}
                    <section className="flex h-full flex-col rounded-2xl border border-border bg-card/80 p-6 shadow-sm backdrop-blur-sm sm:p-8">
                        <div className="mb-6 flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-primary" aria-hidden />
                            <h2 className="text-lg font-semibold text-foreground">Colours</h2>
                        </div>

                        <form onSubmit={handleSave} className="flex flex-1 flex-col gap-6">
                            <div className="space-y-4">
                                <ColorField
                                    label="Background"
                                    hint="Main page colour behind categories and dish cards."
                                    value={bgHex}
                                    onChange={setBgHex}
                                    fallback={PICKER_FALLBACK_BG}
                                    placeholder="#09090b or leave empty for default"
                                    ariaLabel="Pick background colour"
                                />
                                <ColorField
                                    label="Text"
                                    hint="Titles and primary copy. Muted shades are derived automatically."
                                    value={textHex}
                                    onChange={setTextHex}
                                    fallback={PICKER_FALLBACK_TEXT}
                                    placeholder="#fafafa or leave empty for default"
                                    ariaLabel="Pick text colour"
                                />
                                <ColorField
                                    label="Accent"
                                    hint="Prices, category icons, selected chips, links, and CTA emphasis."
                                    value={accentHex}
                                    onChange={setAccentHex}
                                    fallback={PICKER_FALLBACK_ACCENT}
                                    placeholder="#fb7185 or leave empty for default rose"
                                    ariaLabel="Pick accent colour"
                                />
                            </div>

                            <div className="space-y-4 border-t border-border pt-6">
                                <div className="flex items-center gap-2">
                                    <QrCode className="h-4 w-4 text-primary" aria-hidden />
                                    <h3 className="text-base font-semibold text-foreground">Room QR codes</h3>
                                </div>
                                <p className="text-xs leading-relaxed text-muted-foreground">
                                    Applies to QR images from <strong className="font-medium text-foreground">Rooms &amp; QR</strong> (single
                                    download and batch print). Leave both empty for classic <strong className="font-medium text-foreground">black</strong>{" "}
                                    on <strong className="font-medium text-foreground">white</strong>. Use strong contrast so phones scan
                                    reliably.
                                </p>
                                <ColorField
                                    label="QR modules (foreground)"
                                    hint="Squares that encode the link — usually a dark colour."
                                    value={qrFgHex}
                                    onChange={setQrFgHex}
                                    fallback={PICKER_FALLBACK_QR_FG}
                                    placeholder="#000000 or leave empty for default"
                                    ariaLabel="Pick QR foreground colour"
                                />
                                <ColorField
                                    label="QR background"
                                    hint="Quiet zone behind the code — usually light."
                                    value={qrBgHex}
                                    onChange={setQrBgHex}
                                    fallback={PICKER_FALLBACK_QR_BG}
                                    placeholder="#ffffff or leave empty for default"
                                    ariaLabel="Pick QR background colour"
                                />
                                <div className="flex flex-col items-center gap-2 rounded-xl border border-border/80 bg-secondary/10 py-4">
                                    <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">QR preview</p>
                                    <div className="rounded-lg p-2 shadow-sm ring-1 ring-black/10" style={{ backgroundColor: qrPreviewBg }}>
                                        <QRCodeSVG
                                            value={qrPreviewUrl}
                                            size={132}
                                            level="M"
                                            bgColor={qrPreviewBg}
                                            fgColor={qrPreviewFg}
                                        />
                                    </div>
                                    <p className="max-w-[240px] px-2 text-center text-[10px] text-muted-foreground">
                                        Sample URL; exported QRs use your real room link.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3 border-t border-border pt-6">
                                <h3 className="text-base font-semibold text-foreground">Dish details on guest menu</h3>
                                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/80 bg-secondary/10 p-4 transition-colors hover:bg-secondary/20">
                                    <input
                                        type="checkbox"
                                        checked={showItemInsights}
                                        onChange={(e) => setShowItemInsights(e.target.checked)}
                                        className="mt-1 h-4 w-4 shrink-0 rounded border-border text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                                    />
                                    <span className="min-w-0">
                                        <span className="block text-sm font-medium text-foreground">Show extra dish details</span>
                                        <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                                            When enabled, guests see optional chips per dish for allergens, spice level, dietary tags,
                                            portion, calories, chef&apos;s pick, and alcohol — only for fields you set on the{" "}
                                            <strong className="font-medium text-foreground">Menu</strong> page.
                                        </span>
                                    </span>
                                </label>
                            </div>

                            <div className="mt-auto flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:flex-wrap">
                                <Button type="submit" disabled={saving} className="sm:min-w-[140px]">
                                    {saving ? "Saving…" : "Save changes"}
                                </Button>
                                <Button type="button" variant="outline" disabled={saving} onClick={() => void handleReset()}>
                                    Reset to default
                                </Button>
                            </div>
                        </form>
                    </section>

                    {/* Preview column */}
                    <aside className="flex flex-col gap-4 lg:sticky lg:top-20">
                        <div className="flex items-center justify-between gap-2">
                            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                                <Smartphone className="h-3.5 w-3.5" aria-hidden />
                                Live preview
                            </p>
                            <span className="hidden text-[10px] text-muted-foreground sm:inline">Approx. phone layout</span>
                        </div>

                        <div className="mx-auto w-full max-w-[320px] lg:mx-0 lg:max-w-none">
                            <div
                                className={cn(
                                    "relative rounded-[1.85rem] border-[6px] border-zinc-800 bg-zinc-900 p-1.5 shadow-2xl shadow-black/40",
                                    "ring-1 ring-white/10",
                                )}
                            >
                                <div className="absolute left-1/2 top-0 h-4 w-20 -translate-x-1/2 rounded-b-lg bg-zinc-800" aria-hidden />
                                <div className="relative mt-3 flex max-h-[min(520px,calc(100vh-12rem))] min-h-[420px] flex-col overflow-hidden rounded-2xl ring-1 ring-black/30">
                                    <GuestMenuPreviewMock style={previewStyle} />
                                </div>
                            </div>
                        </div>

                        {menuUrl ? (
                            <Link
                                href={menuUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={cn(
                                    "inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-white/5 bg-secondary px-4 text-sm font-medium text-secondary-foreground transition-all duration-200 hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98]",
                                )}
                            >
                                <ExternalLink className="h-4 w-4 shrink-0" />
                                Open real guest menu
                            </Link>
                        ) : null}
                    </aside>
                </div>
            </div>

            <LegalFooter />
        </div>
    );
}
