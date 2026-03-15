"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";
import { AdminPageSkeleton } from "@/components/ui/Skeleton";

const NOTIFICATION_SOUND_KEY = "hotel-admin-notification-sound";

export default function SettingsPage() {
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

                {/* Account (placeholder) */}
                <section className="rounded-xl border border-border bg-card p-6">
                    <h2 className="text-lg font-semibold text-foreground mb-4">Account</h2>
                    <p className="text-sm text-muted-foreground">
                        Account settings such as password and profile will be available in a future update.
                    </p>
                </section>
            </div>
        </div>
    );
}
