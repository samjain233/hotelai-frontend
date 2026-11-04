"use client";

import { useState } from "react";
import { Settings, Shield, ExternalLink, LogOut, MonitorX } from "lucide-react";
import { platformAuth } from "@/lib/platformApi";
import { usePlatformSession } from "@/hooks/usePlatformSession";

export default function PlatformSettingsPage() {
    const { session } = usePlatformSession();
    const [busy, setBusy] = useState<"one" | "all" | null>(null);
    const [error, setError] = useState("");

    async function signOut(everywhere: boolean) {
        if (everywhere && !window.confirm("Sign out of super-admin on every browser and device, including this one?")) return;
        setBusy(everywhere ? "all" : "one");
        setError("");
        try {
            await (everywhere ? platformAuth.logoutEverywhere() : platformAuth.logout());
            window.location.replace("/superadmin/login");
        } catch (e) {
            setError(e instanceof Error ? e.message : "Sign out failed");
            setBusy(null);
        }
    }

    return (
        <div className="space-y-8 max-w-2xl">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Platform Settings</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Configuration and information for the super admin panel.
                </p>
            </div>

            {/* Current Session */}
            <div className="dashboard-card p-5 space-y-4">
                <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary" />
                    <h2 className="font-semibold">Session</h2>
                </div>
                {session && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <EnvRow label="Google account" value={session.email} />
                        <EnvRow label="Signed in" value={new Date(session.signedInAt).toLocaleString()} />
                        <EnvRow label="Ends at the latest" value={new Date(session.expiresAt).toLocaleString()} />
                        <EnvRow label="Ends after inactivity" value={`${session.idleTimeoutMinutes} minutes`} />
                    </div>
                )}
                <p className="text-[11px] text-muted-foreground">
                    If you think someone else got in, sign out everywhere and secure your Google account.
                </p>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => signOut(false)}
                        disabled={busy !== null}
                        className="inline-flex items-center gap-2 text-xs px-3 py-2 rounded-lg border border-border bg-card hover:bg-secondary transition text-muted-foreground disabled:opacity-50"
                    >
                        <LogOut className="w-3.5 h-3.5" />
                        {busy === "one" ? "Signing out…" : "Sign out"}
                    </button>
                    <button
                        onClick={() => signOut(true)}
                        disabled={busy !== null}
                        className="inline-flex items-center gap-2 text-xs px-3 py-2 rounded-lg border border-border bg-card hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition text-muted-foreground disabled:opacity-50"
                    >
                        <MonitorX className="w-3.5 h-3.5" />
                        {busy === "all" ? "Signing out…" : "Sign out everywhere"}
                    </button>
                </div>
                {error && <p className="text-xs text-destructive">{error}</p>}
            </div>

            {/* Quick Links */}
            <div className="dashboard-card p-5 space-y-4">
                <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4 text-primary" />
                    <h2 className="font-semibold">Quick Links</h2>
                </div>
                <div className="space-y-2">
                    <QuickLink label="Backend Health" href="/api/health" />
                    <QuickLink label="Vercel Dashboard" href="https://vercel.com/dashboard" />
                    <QuickLink label="Resend Dashboard" href="https://resend.com" />
                </div>
            </div>

            {/* Environment Info */}
            <div className="dashboard-card p-5 space-y-4">
                <h2 className="font-semibold">Environment</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <EnvRow label="API URL" value={process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"} />
                    <EnvRow label="Proxy" value={process.env.NEXT_PUBLIC_USE_PROXY || "false"} />
                </div>
            </div>
        </div>
    );
}

function QuickLink({ label, href }: { label: string; href: string }) {
    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-secondary/30 border border-border/50 hover:bg-secondary/60 transition text-sm group"
        >
            <span className="text-foreground">{label}</span>
            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition" />
        </a>
    );
}

function EnvRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="bg-secondary/30 border border-border/50 rounded-lg px-3 py-2">
            <p className="text-[11px] text-muted-foreground">{label}</p>
            <p className="text-sm font-mono truncate">{value}</p>
        </div>
    );
}
