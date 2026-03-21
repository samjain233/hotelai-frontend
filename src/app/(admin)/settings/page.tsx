"use client";

import { useEffect, useState, useRef } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor, Volume2, VolumeX, Hotel as HotelIcon, Upload, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { AdminPageSkeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { upload } from "@vercel/blob/client";
import { toast } from "sonner";
import {
    ALLOWED_IMAGE_CONTENT_TYPES,
    blobPathnameWithExtension,
    resolveImageContentType,
} from "@/lib/imageUpload";
import type { Hotel } from "@/lib/types";
import { LegalFooter } from "@/components/LegalFooter";

const NOTIFICATION_SOUND_KEY = "hotel-admin-notification-sound";
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
function HotelProfileSection({ hotel, refreshHotel }: { hotel: { id: string; name: string; slug: string; address?: string | null; phone?: string | null; logoUrl?: string | null; openTime?: string | null; closeTime?: string | null }; refreshHotel: () => Promise<void> }) {
    const [name, setName] = useState(hotel?.name ?? "");
    const [address, setAddress] = useState(hotel?.address ?? "");
    const [phone, setPhone] = useState(hotel?.phone ?? "");
    const [logoUrl, setLogoUrl] = useState(hotel?.logoUrl ?? "");
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [logoUnsaved, setLogoUnsaved] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setName(hotel?.name ?? "");
        setAddress(hotel?.address ?? "");
        setPhone(hotel?.phone ?? "");
        setLogoUrl(hotel?.logoUrl ?? "");
        setLogoUnsaved(false);
    }, [hotel]);

    async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        e.target.value = "";
        const contentType = resolveImageContentType(file);
        if (!contentType) {
            toast.error(
                "Please use JPEG, PNG, or WebP. If the file is correct, ensure the name ends in .jpg, .png, or .webp.",
            );
            return;
        }
        if (file.size > MAX_IMAGE_SIZE) {
            toast.error("Image must be 5 MB or smaller.");
            return;
        }
        setUploading(true);
        try {
            const { token } = await api.getUploadToken();
            const { pathname: basePath } = await api.getHotelLogoUploadPathname(token);
            const pathname = blobPathnameWithExtension(basePath, contentType);
            const blob = await upload(pathname, file, {
                access: "public",
                handleUploadUrl: "/api/blob-upload",
                clientPayload: JSON.stringify({ token }),
                contentType,
            });
            setLogoUrl(blob.url);
            setLogoUnsaved(true);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Upload failed");
        } finally {
            setUploading(false);
        }
    }

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();

        setSaving(true);
        try {
            await api.updateHotel({
                name: name || undefined,
                address: address || undefined,
                phone: phone || undefined,
                logoUrl: logoUrl || undefined,
            });
            await refreshHotel();
            setLogoUnsaved(false);
            toast.success("Hotel profile updated.");
        } catch (err: any) {
            toast.error(err?.message || "Failed to save");
        } finally {
            setSaving(false);
        }
    }

    return (
        <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <HotelIcon className="w-5 h-5" />
                Hotel Profile
            </h2>
            <p className="text-sm text-muted-foreground mb-4">Edit your hotel details.</p>
            <form onSubmit={handleSave} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Hotel name</label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Hotel name" className="bg-secondary/50" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Address</label>
                    <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address" className="bg-secondary/50" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Phone</label>
                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" className="bg-secondary/50" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Logo</label>
                    <div className="flex items-center gap-4">
                        {logoUrl && (
                            <img src={logoUrl} alt="Logo" className="w-16 h-16 rounded-lg object-cover border border-border" />
                        )}
                        <div>
                            <input ref={fileInputRef} type="file" accept={ALLOWED_IMAGE_CONTENT_TYPES.join(",")} className="hidden" onChange={handleLogoUpload} />
                            <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
                                {uploading ? "Uploading..." : <><Upload className="w-4 h-4 mr-2" />Change logo</>}
                            </Button>
                            {logoUnsaved && <p className="text-xs text-amber-500 mt-1">Logo uploaded — click Save to apply.</p>}
                        </div>
                    </div>
                </div>
                <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save changes"}</Button>
            </form>
        </section>
    );
}

export default function SettingsPage() {
    const { admin, hotel, refreshHotel } = useAuth();
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [notificationSound, setNotificationSound] = useState(true);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        const stored = localStorage.getItem(NOTIFICATION_SOUND_KEY);
        if (stored !== null) {
            setNotificationSound(stored === "true");
        }
    }, [mounted]);

    function toggleNotificationSound() {
        const next = !notificationSound;
        setNotificationSound(next);
        if (typeof window !== "undefined") {
            localStorage.setItem(NOTIFICATION_SOUND_KEY, String(next));
        }
    }

    if (!mounted) return <AdminPageSkeleton cardCount={1} />;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
                <p className="text-muted-foreground mt-1">
                    Manage your preferences and app behavior.
                </p>
            </div>

            <div className="space-y-6 max-w-2xl">
                {/* Appearance */}
                <section className="rounded-xl border border-border bg-card p-6">
                    <h2 className="text-lg font-semibold text-foreground mb-4">Appearance</h2>
                    <p className="text-sm text-muted-foreground mb-4">
                        Choose how the dashboard looks. You can select light, dark, or follow your system preference.
                    </p>
                    <div className="flex flex-wrap gap-3">
                        {[
                            { value: "light", label: "Light", icon: Sun },
                            { value: "dark", label: "Dark", icon: Moon },
                            { value: "system", label: "System", icon: Monitor },
                        ].map(({ value, label, icon: Icon }) => (
                            <button
                                key={value}
                                onClick={() => setTheme(value)}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border transition-all",
                                    theme === value
                                        ? "bg-primary/10 text-primary border-primary/30"
                                        : "bg-secondary/50 text-muted-foreground border-border hover:bg-secondary hover:text-foreground"
                                )}
                            >
                                <Icon className="w-4 h-4" />
                                {label}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Notifications */}
                <section className="rounded-xl border border-border bg-card p-6">
                    <h2 className="text-lg font-semibold text-foreground mb-4">Notifications</h2>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {notificationSound ? (
                                <Volume2 className="w-5 h-5 text-muted-foreground" />
                            ) : (
                                <VolumeX className="w-5 h-5 text-muted-foreground" />
                            )}
                            <div>
                                <p className="text-sm font-medium text-foreground">Notification sound</p>
                                <p className="text-xs text-muted-foreground">
                                    Play a sound when new orders or service requests arrive
                                </p>
                            </div>
                        </div>
                        <button
                            role="switch"
                            aria-checked={notificationSound}
                            onClick={toggleNotificationSound}
                            className={cn(
                                "relative w-11 h-6 rounded-full transition-colors",
                                notificationSound ? "bg-primary" : "bg-secondary"
                            )}
                        >
                            <span
                                className={cn(
                                    "absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform",
                                    notificationSound ? "translate-x-5" : "translate-x-0"
                                )}
                            />
                        </button>
                    </div>
                </section>

                {/* Hotel Profile (Owner only) */}
                {admin?.role === "OWNER" && hotel && (
                    <HotelProfileSection hotel={hotel} refreshHotel={refreshHotel} />
                )}

                {/* Account (placeholder) */}
                <section className="rounded-xl border border-border bg-card p-6">
                    <h2 className="text-lg font-semibold text-foreground mb-4">Account</h2>
                    <p className="text-sm text-muted-foreground">
                        Account settings such as password and profile will be available in a future update.
                    </p>
                </section>

                <LegalFooter className="pt-2" />
            </div>
        </div>
    );
}
