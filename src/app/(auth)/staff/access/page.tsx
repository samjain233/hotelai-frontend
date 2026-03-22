"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { KeyRound } from "lucide-react";
import { LegalFooter } from "@/components/LegalFooter";

export default function StaffAccessPage() {
    const [key, setKey] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const { admin, staffAccessWithKey, loading: authLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!authLoading && admin) {
            router.replace(admin.role === "KITCHEN" ? "/orders" : "/dashboard");
        }
    }, [authLoading, admin, router]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const loggedIn = await staffAccessWithKey(key.trim());
            if (loggedIn) {
                router.replace(loggedIn.role === "KITCHEN" ? "/orders" : "/dashboard");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Access failed");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <div className="w-full max-w-sm">
                <div className="mb-8 text-center">
                    <div className="mx-auto mb-5 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600">
                        <KeyRound className="h-5 w-5 text-white" />
                    </div>
                    <h1 className="mb-1 text-xl font-semibold text-white">Staff access</h1>
                    <p className="text-sm text-zinc-500">Enter the key your manager shared with you</p>
                </div>

                <div className="space-y-4 rounded-xl border border-border bg-card p-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-center text-sm text-red-400">
                                {error}
                            </div>
                        )}
                        <div>
                            <label className="mb-1.5 block text-xs font-medium text-zinc-400">Access key</label>
                            <Input
                                type="text"
                                autoComplete="off"
                                placeholder="Paste your key"
                                value={key}
                                onChange={(e) => setKey(e.target.value)}
                                required
                                className="font-mono text-sm"
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? "Signing in…" : "Continue"}
                        </Button>
                    </form>
                    <p className="text-center text-xs text-zinc-500">
                        Hotel owner or manager?{" "}
                        <Link href="/login" className="text-indigo-400 hover:underline">
                            Sign in with email
                        </Link>
                    </p>
                </div>
                <LegalFooter className="mt-8" />
            </div>
        </div>
    );
}
