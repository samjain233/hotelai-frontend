"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Palette, ExternalLink } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AdminPageSkeleton } from "@/components/ui/Skeleton";
import { LegalFooter } from "@/components/LegalFooter";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { buildGuestMenuThemeStyle } from "@/lib/guestMenuTheme";

function normalizePickerValue(hex: string | null | undefined): string {
    if (!hex?.trim()) return "#09090b";
    const h = hex.trim().startsWith("#") ? hex.trim() : `#${hex.trim()}`;
    return /^#[0-9A-Fa-f]{6}$/.test(h) || /^#[0-9A-Fa-f]{3}$/.test(h) ? h : "#09090b";
}

export default function MenuDesignPage() {
    const { admin, hotel, loading, refreshHotel } = useAuth();
    const router = useRouter();
    const [bgHex, setBgHex] = useState("");
    const [textHex, setTextHex] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!loading && admin && admin.role !== "OWNER" && admin.role !== "MANAGER") {
            router.replace("/dashboard");
        }
    }, [admin, loading, router]);

    useEffect(() => {
        setBgHex(hotel?.guestMenuBackgroundHex?.trim() ?? "");
        setTextHex(hotel?.guestMenuTextHex?.trim() ?? "");
    }, [hotel?.guestMenuBackgroundHex, hotel?.guestMenuTextHex]);

    const previewStyle = buildGuestMenuThemeStyle({
        guestMenuBackgroundHex: bgHex || null,
        guestMenuTextHex: textHex || null,
    });

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
            });
            setBgHex("");
            setTextHex("");
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

    if (admin.role !== "OWNER" && admin.role !== "MANAGER") {
        return null;
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                    <Palette className="w-8 h-8 text-primary" />
                    Menu design
                </h1>
                <p className="text-muted-foreground mt-1 max-w-2xl">
                    Customise background and text colours for your{" "}
                    <strong className="text-foreground">guest-facing digital menu</strong> (QR / room link). Leave blank to use the
                    platform default look.
                </p>
            </div>

            <div className="grid gap-8 max-w-3xl lg:grid-cols-[1fr_280px]">
                <section className="rounded-xl border border-border bg-card p-6">
                    <h2 className="text-lg font-semibold text-foreground mb-1">Colours</h2>
                    <p className="text-sm text-muted-foreground mb-6">
                        Use hex values (e.g. <code className="text-xs bg-secondary px-1 rounded">#fdf6e3</code> and{" "}
                        <code className="text-xs bg-secondary px-1 rounded">#5c4033</code>). Borders and panels are derived automatically.
                    </p>
                    <form onSubmit={handleSave} className="space-y-6">
                        <div className="grid gap-6 sm:grid-cols-2">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">Background</label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="color"
                                        value={normalizePickerValue(bgHex || null)}
                                        onChange={(e) => setBgHex(e.target.value)}
                                        className="h-11 w-14 cursor-pointer rounded-lg border border-border bg-secondary p-1"
                                        aria-label="Background colour"
                                    />
                                    <Input
                                        value={bgHex}
                                        onChange={(e) => setBgHex(e.target.value)}
                                        placeholder="e.g. #09090b (empty = default)"
                                        className="bg-secondary/50 font-mono text-sm flex-1"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">Text &amp; accents</label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="color"
                                        value={normalizePickerValue(textHex || null)}
                                        onChange={(e) => setTextHex(e.target.value)}
                                        className="h-11 w-14 cursor-pointer rounded-lg border border-border bg-secondary p-1"
                                        aria-label="Text colour"
                                    />
                                    <Input
                                        value={textHex}
                                        onChange={(e) => setTextHex(e.target.value)}
                                        placeholder="e.g. #fafafa (empty = default)"
                                        className="bg-secondary/50 font-mono text-sm flex-1"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <Button type="submit" disabled={saving}>
                                {saving ? "Saving…" : "Save changes"}
                            </Button>
                            <Button type="button" variant="outline" disabled={saving} onClick={() => void handleReset()}>
                                Reset to default
                            </Button>
                        </div>
                    </form>
                </section>

                <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Live preview</p>
                    <div
                        className={cn(
                            "rounded-xl border border-border overflow-hidden shadow-md",
                            "min-h-[200px] flex flex-col",
                        )}
                        style={previewStyle}
                    >
                        <div className="px-4 py-3 border-b border-[var(--guest-line)] bg-[var(--guest-bg)]">
                            <div className="h-2 w-24 rounded bg-[var(--guest-shimmer)]/80 mb-2" />
                            <div className="h-8 w-full rounded-full bg-[var(--guest-surface)] border border-[var(--guest-line)]" />
                        </div>
                        <div className="flex-1 p-4 space-y-2 bg-[var(--guest-bg)]">
                            <div className="h-3 w-32 rounded bg-[var(--guest-shimmer)]/80" />
                            <p className="text-sm font-semibold text-[var(--guest-text)]">Sample dish name</p>
                            <p className="text-xs text-[var(--guest-muted)]">Description line uses muted tone.</p>
                            <p className="text-sm font-bold text-[var(--guest-text)]">₹499</p>
                        </div>
                    </div>
                    {menuUrl ? (
                        <Link
                            href={menuUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex h-8 w-full items-center justify-center gap-2 rounded-lg border border-border bg-transparent px-3 text-xs font-medium text-foreground transition-colors hover:bg-secondary/80"
                        >
                            <ExternalLink className="w-4 h-4 shrink-0" />
                            Open guest menu
                        </Link>
                    ) : null}
                </div>
            </div>

            <LegalFooter />
        </div>
    );
}
