"use client";

import { useState } from "react";
import { Settings, Shield, ExternalLink } from "lucide-react";

export default function PlatformSettingsPage() {
    const [keyVisible, setKeyVisible] = useState(false);

    const platformKey = typeof window !== "undefined" ? sessionStorage.getItem("platform_key") || "" : "";
    const maskedKey = platformKey ? platformKey.slice(0, 4) + "•".repeat(Math.max(platformKey.length - 8, 4)) + platformKey.slice(-4) : "—";

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
                <div>
                    <label className="text-xs text-muted-foreground">Platform Key</label>
                    <div className="flex items-center gap-2 mt-1">
                        <code className="flex-1 text-sm font-mono bg-secondary/50 px-3 py-2 rounded-lg border border-border truncate">
                            {keyVisible ? platformKey : maskedKey}
                        </code>
                        <button
                            onClick={() => setKeyVisible((v) => !v)}
                            className="text-xs px-3 py-2 rounded-lg border border-border bg-card hover:bg-secondary transition text-muted-foreground"
                        >
                            {keyVisible ? "Hide" : "Show"}
                        </button>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1.5">
                        Stored in sessionStorage. Cleared when you close the tab.
                    </p>
                </div>
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
