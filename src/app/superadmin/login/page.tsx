"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, ArrowRight, Loader2, Eye, EyeOff } from "lucide-react";
import { getPlatformRequestBase, setPlatformKey } from "@/lib/platformApi";
import { usePlatformKey } from "@/hooks/usePlatformKey";

export default function SuperAdminLoginPage() {
    const [secret, setSecret] = useState("");
    const [showSecret, setShowSecret] = useState(false);
    const [remember, setRemember] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { key: existingKey, hydrated } = usePlatformKey();

    // Already signed in on this tab/device → straight to the dashboard.
    useEffect(() => {
        if (hydrated && existingKey) router.replace("/superadmin");
    }, [hydrated, existingKey, router]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const key = secret.trim();
            const res = await fetch(`${getPlatformRequestBase()}/platform/overview`, {
                headers: { "Content-Type": "application/json", "x-platform-key": key },
            });

            if (res.status === 401 || res.status === 403) {
                setError("That key was not accepted.");
                return;
            }
            if (!res.ok) {
                setError(`Backend returned ${res.status}. Check the API logs.`);
                return;
            }

            setPlatformKey(key, remember);
            router.replace("/superadmin");
        } catch {
            setError("Could not reach the backend. Is it running?");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center px-4">
            <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                    <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                        <Shield className="w-7 h-7 text-primary" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">DreamCanvas Platform</h1>
                    <p className="text-sm text-muted-foreground mt-1">Super-admin access. Enter the platform key.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative">
                        <input
                            type={showSecret ? "text" : "password"}
                            value={secret}
                            onChange={(e) => setSecret(e.target.value)}
                            placeholder="Platform key"
                            autoFocus
                            autoComplete="off"
                            spellCheck={false}
                            className="w-full pl-4 pr-11 py-3 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                        />
                        <button
                            type="button"
                            onClick={() => setShowSecret((v) => !v)}
                            aria-label={showSecret ? "Hide key" : "Show key"}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                        >
                            {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>

                    <label className="flex items-start gap-2.5 text-sm text-muted-foreground cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={remember}
                            onChange={(e) => setRemember(e.target.checked)}
                            className="mt-0.5 rounded border-border"
                        />
                        <span>
                            Keep me signed in on this device
                            <span className="block text-xs text-muted-foreground/80">
                                Only on your own laptop. Otherwise the key is forgotten when this tab closes.
                            </span>
                        </span>
                    </label>

                    {error && <p className="text-sm text-destructive text-center">{error}</p>}

                    <button
                        type="submit"
                        disabled={!secret.trim() || loading}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90 disabled:opacity-50 transition"
                    >
                        {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <>
                                Sign in
                                <ArrowRight className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
