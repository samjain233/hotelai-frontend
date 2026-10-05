"use client";

import { useEffect, useMemo, useState, useRef, type ReactNode } from "react";
import { useTheme } from "next-themes";
import {
    Sun,
    Moon,
    Monitor,
    Volume2,
    Hotel as HotelIcon,
    Upload,
    Phone,
    Clock,
    Palette,
    Bell,
    UserRound,
    Check,
    Play,
    type LucideIcon,
} from "lucide-react";
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
import type { Admin, Hotel } from "@/lib/types";
import { LegalFooter } from "@/components/LegalFooter";
import { playNotificationSound } from "@/components/NotificationsDropdown";

const NOTIFICATION_SOUND_KEY = "hotel-admin-notification-sound";
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
const DEFAULT_TIMEZONE = "Asia/Kolkata";

const HOTEL_TIMEZONE_OPTIONS = [
    { value: "Asia/Kolkata", label: "India (IST) — Asia/Kolkata" },
    { value: "Asia/Calcutta", label: "India (legacy) — Asia/Calcutta" },
    { value: "Asia/Dubai", label: "UAE — Asia/Dubai" },
    { value: "Asia/Singapore", label: "Singapore — Asia/Singapore" },
] as const;

const ROLE_LABEL: Record<Admin["role"], string> = {
    OWNER: "Owner",
    GENERAL_MANAGER: "General manager",
    MANAGER: "Manager",
    KITCHEN: "Kitchen",
    FRONT_DESK: "Front desk",
};

const LABEL = "mb-1.5 block text-sm font-medium text-foreground";
const FIELD = "h-11 rounded-xl border-border bg-background shadow-none focus:border-brand/60 focus:ring-brand/40";
const HINT = "mt-1.5 text-xs leading-relaxed text-muted-foreground";

/** Normalises stored times like "7:00" to the "07:00" an <input type="time"> expects. */
function toTimeInput(value?: string | null): string {
    const match = value?.trim().match(/^(\d{1,2}):(\d{2})/);
    return match ? `${match[1].padStart(2, "0")}:${match[2]}` : "";
}

function formatClock(value: string): string {
    const [h, m] = value.split(":").map(Number);
    const suffix = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return m === 0 ? `${h12} ${suffix}` : `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
}

function SettingsCard({
    id,
    icon: Icon,
    title,
    description,
    children,
}: {
    id: string;
    icon: LucideIcon;
    title: string;
    description: string;
    children: ReactNode;
}) {
    return (
        <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-24 rounded-2xl border border-border bg-panel">
            <header className="flex items-start gap-3 border-b border-border px-5 py-4 sm:px-6">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
                    <Icon className="h-[18px] w-[18px]" aria-hidden />
                </span>
                <div className="min-w-0">
                    <h2 id={`${id}-title`} className="text-base font-semibold text-foreground">
                        {title}
                    </h2>
                    <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
                </div>
            </header>
            <div className="px-5 py-5 sm:px-6">{children}</div>
        </section>
    );
}

function Switch({ checked, onChange, label }: { checked: boolean; onChange: (next: boolean) => void; label: string }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={label}
            onClick={() => onChange(!checked)}
            className={cn(
                "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50",
                checked ? "bg-brand" : "bg-secondary",
            )}
        >
            <span
                className={cn(
                    "inline-block h-5 w-5 rounded-full bg-white shadow transition-transform",
                    checked ? "translate-x-[22px]" : "translate-x-0.5",
                )}
            />
        </button>
    );
}

interface ProfileValues {
    name: string;
    address: string;
    phone: string;
    roomServicePhone: string;
    logoUrl: string;
    timezone: string;
    alwaysOpen: boolean;
    openTime: string;
    closeTime: string;
}

function valuesFromHotel(hotel: Hotel): ProfileValues {
    const openTime = toTimeInput(hotel.openTime);
    const closeTime = toTimeInput(hotel.closeTime);
    return {
        name: hotel.name ?? "",
        address: hotel.address ?? "",
        phone: hotel.phone ?? "",
        roomServicePhone: hotel.roomServicePhone ?? "",
        logoUrl: hotel.logoUrl ?? "",
        timezone: hotel.timezone?.trim() || DEFAULT_TIMEZONE,
        alwaysOpen: !openTime || !closeTime,
        openTime: openTime || "09:00",
        closeTime: closeTime || "23:00",
    };
}

function HotelProfileSection({ hotel, refreshHotel }: { hotel: Hotel; refreshHotel: () => Promise<void> }) {
    const initial = useMemo(() => valuesFromHotel(hotel), [hotel]);
    const [values, setValues] = useState<ProfileValues>(initial);
    const [syncedInitial, setSyncedInitial] = useState(initial);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (syncedInitial !== initial) {
        setSyncedInitial(initial);
        setValues(initial);
    }

    const dirty = (Object.keys(initial) as (keyof ProfileValues)[]).some((key) => {
        if (values.alwaysOpen && initial.alwaysOpen && (key === "openTime" || key === "closeTime")) return false;
        return values[key] !== initial[key];
    });

    function set<K extends keyof ProfileValues>(key: K, value: ProfileValues[K]) {
        setValues((prev) => ({ ...prev, [key]: value }));
    }

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
            set("logoUrl", blob.url);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Upload failed");
        } finally {
            setUploading(false);
        }
    }

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        if (!values.name.trim()) {
            toast.error("Hotel name can't be empty.");
            return;
        }
        if (!values.alwaysOpen && values.openTime === values.closeTime) {
            toast.error("Opening and closing time can't be the same. Turn on “Open 24 hours” instead.");
            return;
        }

        setSaving(true);
        try {
            await api.updateHotel({
                name: values.name.trim(),
                address: values.address.trim() || undefined,
                phone: values.phone.trim() || undefined,
                roomServicePhone: values.roomServicePhone.trim(),
                logoUrl: values.logoUrl || undefined,
                timezone: values.timezone.trim() || DEFAULT_TIMEZONE,
                openTime: values.alwaysOpen ? "" : values.openTime,
                closeTime: values.alwaysOpen ? "" : values.closeTime,
            });
            await refreshHotel();
            toast.success("Hotel profile updated.");
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to save");
        } finally {
            setSaving(false);
        }
    }

    const overnight = !values.alwaysOpen && values.closeTime < values.openTime;
    const initialLetter = values.name.trim().charAt(0).toUpperCase() || "H";

    return (
        <form onSubmit={handleSave} className="space-y-6">
            <SettingsCard id="profile" icon={HotelIcon} title="Hotel profile" description="How your hotel appears to guests on the digital menu.">
                <div className="space-y-5">
                    <div className="flex items-center gap-4">
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            tabIndex={-1}
                            aria-hidden
                            className="group relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-background text-2xl font-semibold text-brand transition-colors hover:border-brand/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
                        >
                            {values.logoUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={values.logoUrl} alt="" className="h-full w-full object-cover" />
                            ) : (
                                initialLetter
                            )}
                            <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100">
                                <Upload className="h-5 w-5" aria-hidden />
                            </span>
                            {uploading && (
                                <span className="absolute inset-0 flex items-center justify-center bg-black/60">
                                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                </span>
                            )}
                        </button>
                        <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground">Logo</p>
                            <p className="mt-0.5 text-xs text-muted-foreground">JPEG, PNG or WebP, up to 5 MB. Square images look best.</p>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept={ALLOWED_IMAGE_CONTENT_TYPES.join(",")}
                                className="hidden"
                                onChange={handleLogoUpload}
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={uploading}
                                onClick={() => fileInputRef.current?.click()}
                                className="mt-2 border-border"
                            >
                                <Upload className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                                {uploading ? "Uploading…" : values.logoUrl ? "Replace logo" : "Upload logo"}
                            </Button>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="hotel-name" className={LABEL}>
                            Hotel name
                        </label>
                        <Input
                            id="hotel-name"
                            value={values.name}
                            onChange={(e) => set("name", e.target.value)}
                            placeholder="e.g. The Grand Residency"
                            maxLength={200}
                            className={FIELD}
                        />
                    </div>
                    <div>
                        <label htmlFor="hotel-address" className={LABEL}>
                            Address
                        </label>
                        <Input
                            id="hotel-address"
                            value={values.address}
                            onChange={(e) => set("address", e.target.value)}
                            placeholder="Street, city, PIN"
                            maxLength={500}
                            className={FIELD}
                        />
                    </div>
                </div>
            </SettingsCard>

            <SettingsCard id="contact" icon={Phone} title="Contact numbers" description="Numbers guests can call from the menu.">
                <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                        <label htmlFor="hotel-phone" className={LABEL}>
                            Reception
                        </label>
                        <Input
                            id="hotel-phone"
                            type="tel"
                            value={values.phone}
                            onChange={(e) => set("phone", e.target.value)}
                            placeholder="+91 98765 43210"
                            maxLength={30}
                            className={FIELD}
                        />
                        <p className={HINT}>Your main contact number.</p>
                    </div>
                    <div>
                        <label htmlFor="hotel-room-service" className={LABEL}>
                            Room service
                        </label>
                        <Input
                            id="hotel-room-service"
                            type="tel"
                            value={values.roomServicePhone}
                            onChange={(e) => set("roomServicePhone", e.target.value)}
                            placeholder="Same as reception"
                            maxLength={30}
                            className={FIELD}
                        />
                        <p className={HINT}>Shown on the guest menu as a tap-to-call button. Leave empty to use reception.</p>
                    </div>
                </div>
            </SettingsCard>

            <SettingsCard id="hours" icon={Clock} title="Opening hours" description="When guests can place orders from the menu.">
                <div className="space-y-5">
                    <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-background px-4 py-3">
                        <div>
                            <p className="text-sm font-medium text-foreground">Open 24 hours</p>
                            <p className="text-xs text-muted-foreground">Accept orders at any time of day.</p>
                        </div>
                        <Switch checked={values.alwaysOpen} onChange={(next) => set("alwaysOpen", next)} label="Open 24 hours" />
                    </div>

                    {!values.alwaysOpen && (
                        <div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label htmlFor="hotel-open" className={LABEL}>
                                        Opens at
                                    </label>
                                    <Input
                                        id="hotel-open"
                                        type="time"
                                        value={values.openTime}
                                        onChange={(e) => set("openTime", e.target.value)}
                                        required
                                        className={cn(FIELD, "tabular-nums")}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="hotel-close" className={LABEL}>
                                        Closes at
                                    </label>
                                    <Input
                                        id="hotel-close"
                                        type="time"
                                        value={values.closeTime}
                                        onChange={(e) => set("closeTime", e.target.value)}
                                        required
                                        className={cn(FIELD, "tabular-nums")}
                                    />
                                </div>
                            </div>
                            {values.openTime && values.closeTime && values.openTime !== values.closeTime && (
                                <p className={HINT}>
                                    Orders accepted from{" "}
                                    <span className="font-medium text-foreground">
                                        {formatClock(values.openTime)} to {formatClock(values.closeTime)}
                                    </span>
                                    {overnight ? " (closes after midnight)" : ""}. Guests can still browse the menu when you&apos;re closed.
                                </p>
                            )}
                        </div>
                    )}

                    <div>
                        <label htmlFor="hotel-timezone" className={LABEL}>
                            Timezone
                        </label>
                        <select
                            id="hotel-timezone"
                            value={values.timezone}
                            onChange={(e) => set("timezone", e.target.value)}
                            className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground focus:border-brand/60 focus:outline-none focus:ring-1 focus:ring-brand/40"
                        >
                            {HOTEL_TIMEZONE_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>
                                    {o.label}
                                </option>
                            ))}
                            {!HOTEL_TIMEZONE_OPTIONS.some((o) => o.value === values.timezone) && values.timezone ? (
                                <option value={values.timezone}>{values.timezone} (current)</option>
                            ) : null}
                        </select>
                        <p className={HINT}>Opening hours and menu category serving times (breakfast, lunch) follow this clock.</p>
                    </div>
                </div>
            </SettingsCard>

            {dirty && (
                <div className="sticky bottom-4 z-20 flex flex-col gap-3 rounded-2xl border border-border bg-panel/95 p-3 pl-4 shadow-xl backdrop-blur animate-in fade-in slide-in-from-bottom-2 duration-200 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-foreground">
                        <span className="mr-2 inline-block h-2 w-2 rounded-full bg-amber-500 align-middle" aria-hidden />
                        You have unsaved changes
                    </p>
                    <div className="flex gap-2">
                        <Button type="button" variant="ghost" disabled={saving} onClick={() => setValues(initial)} className="flex-1 sm:flex-none">
                            Discard
                        </Button>
                        <Button type="submit" disabled={saving || uploading} className="flex-1 sm:flex-none">
                            {saving ? "Saving…" : "Save changes"}
                        </Button>
                    </div>
                </div>
            )}
        </form>
    );
}

const THEME_OPTIONS = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
] as const;

function ThemePreview({ mode }: { mode: "light" | "dark" }) {
    const dark = mode === "dark";
    return (
        <div className={cn("flex h-full w-full gap-1.5 p-2", dark ? "bg-zinc-900" : "bg-zinc-100")}>
            <div className={cn("w-1/4 rounded", dark ? "bg-zinc-800" : "bg-white")} />
            <div className="flex flex-1 flex-col gap-1.5">
                <div className={cn("h-2 w-2/3 rounded-full", dark ? "bg-zinc-700" : "bg-zinc-300")} />
                <div className={cn("flex-1 rounded", dark ? "bg-zinc-800" : "bg-white")} />
            </div>
        </div>
    );
}

function NavLinks({ items }: { items: { id: string; label: string }[] }) {
    return (
        <nav aria-label="Settings sections" className="sticky top-24 hidden space-y-0.5 lg:block">
            {items.map((item) => (
                <a
                    key={item.id}
                    href={`#${item.id}`}
                    className="block rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                    {item.label}
                </a>
            ))}
        </nav>
    );
}

export default function SettingsPage() {
    const { admin, hotel, refreshHotel } = useAuth();
    const { theme, resolvedTheme, setTheme } = useTheme();
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

    function setSound(next: boolean) {
        setNotificationSound(next);
        localStorage.setItem(NOTIFICATION_SOUND_KEY, String(next));
    }

    if (!mounted) return <AdminPageSkeleton cardCount={1} />;

    const canEditHotel = (admin?.role === "OWNER" || admin?.role === "GENERAL_MANAGER") && !!hotel;
    const navItems = [
        ...(canEditHotel
            ? [
                  { id: "profile", label: "Hotel profile" },
                  { id: "contact", label: "Contact numbers" },
                  { id: "hours", label: "Opening hours" },
              ]
            : []),
        { id: "appearance", label: "Appearance" },
        { id: "notifications", label: "Notifications" },
        { id: "account", label: "Account" },
    ];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[28px]">Settings</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    {canEditHotel ? "Manage your hotel details and how the dashboard works for you." : "Manage how the dashboard works for you."}
                </p>
            </div>

            <div className="grid gap-8 lg:grid-cols-[180px_minmax(0,1fr)]">
                <NavLinks items={navItems} />

                <div className="max-w-3xl space-y-6">
                    {canEditHotel && hotel && <HotelProfileSection hotel={hotel} refreshHotel={refreshHotel} />}

                    <SettingsCard id="appearance" icon={Palette} title="Appearance" description="Only changes this device — your team keeps their own choice.">
                        <div role="radiogroup" aria-label="Theme" className="grid grid-cols-3 gap-3">
                            {THEME_OPTIONS.map(({ value, label, icon: Icon }) => {
                                const selected = theme === value;
                                return (
                                    <button
                                        key={value}
                                        type="button"
                                        role="radio"
                                        aria-checked={selected}
                                        onClick={() => setTheme(value)}
                                        className={cn(
                                            "group overflow-hidden rounded-xl border text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50",
                                            selected ? "border-brand ring-1 ring-brand" : "border-border hover:border-foreground/25",
                                        )}
                                    >
                                        <div className="h-16 w-full border-b border-border sm:h-20">
                                            {value === "system" ? (
                                                <div className="flex h-full">
                                                    <div className="w-1/2 overflow-hidden">
                                                        <ThemePreview mode="light" />
                                                    </div>
                                                    <div className="w-1/2 overflow-hidden">
                                                        <ThemePreview mode="dark" />
                                                    </div>
                                                </div>
                                            ) : (
                                                <ThemePreview mode={value} />
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between gap-2 bg-background px-3 py-2.5">
                                            <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                                                <Icon className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                                                {label}
                                            </span>
                                            {selected && <Check className="h-4 w-4 text-brand" aria-hidden />}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                        {theme === "system" && resolvedTheme && (
                            <p className={HINT}>Following your device — currently {resolvedTheme}.</p>
                        )}
                    </SettingsCard>

                    <SettingsCard id="notifications" icon={Bell} title="Notifications" description="Alerts on this device while the dashboard is open.">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex min-w-0 items-start gap-3">
                                <Volume2 className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
                                <div>
                                    <p className="text-sm font-medium text-foreground">Sound for new orders and requests</p>
                                    <p className="text-xs text-muted-foreground">A short chime when a guest orders or asks for service.</p>
                                </div>
                            </div>
                            <Switch checked={notificationSound} onChange={setSound} label="Notification sound" />
                        </div>
                        {notificationSound && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => playNotificationSound()}
                                className="ml-8 mt-3 border-border"
                            >
                                <Play className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                                Play test sound
                            </Button>
                        )}
                    </SettingsCard>

                    <SettingsCard id="account" icon={UserRound} title="Account" description="The account you're signed in with.">
                        {admin ? (
                            <div className="flex items-center gap-4">
                                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary text-base font-semibold uppercase text-foreground">
                                    {admin.name?.trim().charAt(0) || admin.email.charAt(0)}
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium capitalize text-foreground">{admin.name}</p>
                                    <p className="truncate text-sm text-muted-foreground">{admin.email}</p>
                                </div>
                                <span className="shrink-0 rounded-full border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground">
                                    {ROLE_LABEL[admin.role] ?? admin.role}
                                </span>
                            </div>
                        ) : null}
                        <p className="mt-4 border-t border-border pt-4 text-xs text-muted-foreground">
                            Changing your name, email or password from here is coming soon.
                        </p>
                    </SettingsCard>

                    <LegalFooter className="pt-2" />
                </div>
            </div>
        </div>
    );
}
