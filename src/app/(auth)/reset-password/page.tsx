"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Lock } from "lucide-react";
import { api } from "@/lib/api";
import { LegalFooter } from "@/components/LegalFooter";

const MIN_PASSWORD = 6;

function ResetFallback() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground text-sm">
            Loading…
        </div>
    );
}

function ResetPasswordInner() {
    const params = useSearchParams();
    const token = params.get("token")?.trim() || "";

    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        if (password.length < MIN_PASSWORD) {
            setError(`Password must be at least ${MIN_PASSWORD} characters.`);
            return;
        }
        if (password !== confirm) {
            setError("Passwords do not match.");
            return;
        }
        setLoading(true);
        try {
            const { message } = await api.resetPassword(token, password);
            setSuccess(message);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Reset failed");
        } finally {
            setLoading(false);
        }
    }

    if (!token) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
                <div className="w-full max-w-sm p-6 rounded-xl bg-card border border-border text-center space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Missing reset link. Open the link from your email or request a new one.
                    </p>
                    <Link href="/forgot-password" className="text-sm text-indigo-400 hover:text-indigo-300 font-medium">
                        Request new link
                    </Link>
                    <Link href="/login" className="block text-sm text-zinc-500 hover:text-zinc-400">
                        Back to sign in
                    </Link>
                </div>
                <LegalFooter className="mt-8" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
            <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                    <h1 className="text-xl font-semibold text-white mb-1">Set new password</h1>
                    <p className="text-sm text-zinc-500">Choose a strong password for your account.</p>
                </div>

                <div className="p-6 rounded-xl bg-card border border-border">
                    {success ? (
                        <div className="space-y-4 text-center">
                            <p className="text-sm text-indigo-300/90">{success}</p>
                            <Link
                                href="/login"
                                className="inline-block text-sm text-indigo-400 hover:text-indigo-300 font-medium"
                            >
                                Sign in
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg text-center">
                                    {error}
                                </div>
                            )}
                            <div>
                                <label className="block text-xs font-medium text-zinc-400 mb-1.5">New password</label>
                                <Input
                                    icon={<Lock className="w-4 h-4" />}
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={MIN_PASSWORD}
                                    autoComplete="new-password"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                                    Confirm password
                                </label>
                                <Input
                                    icon={<Lock className="w-4 h-4" />}
                                    type="password"
                                    placeholder="••••••••"
                                    value={confirm}
                                    onChange={(e) => setConfirm(e.target.value)}
                                    required
                                    minLength={MIN_PASSWORD}
                                    autoComplete="new-password"
                                />
                            </div>
                            <Button type="submit" loading={loading} className="w-full h-10">
                                Update password
                            </Button>
                            <Link
                                href="/login"
                                className="block text-center text-sm text-zinc-500 hover:text-zinc-400"
                            >
                                Back to sign in
                            </Link>
                        </form>
                    )}
                </div>
            </div>
            <LegalFooter className="mt-8" />
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<ResetFallback />}>
            <ResetPasswordInner />
        </Suspense>
    );
}
