"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Mail } from "lucide-react";
import { api } from "@/lib/api";
import { LegalFooter } from "@/components/LegalFooter";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setSuccess(null);
        setLoading(true);
        try {
            const { message } = await api.forgotPassword(email.trim());
            setSuccess(message);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
            <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                    <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center mx-auto mb-5">
                        <span className="text-base font-bold text-white">H</span>
                    </div>
                    <h1 className="text-xl font-semibold text-white mb-1">Forgot password</h1>
                    <p className="text-sm text-zinc-500">
                        Enter your email and we&apos;ll send a link to reset your password.
                    </p>
                </div>

                <div className="p-6 rounded-xl bg-card border border-border space-y-4">
                    {success ? (
                        <div className="space-y-4 text-center">
                            <p className="text-sm text-indigo-300/90">{success}</p>
                            <Link
                                href="/login"
                                className="inline-block text-sm text-indigo-400 hover:text-indigo-300 font-medium"
                            >
                                Back to sign in
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
                                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Email</label>
                                <Input
                                    icon={<Mail className="w-4 h-4" />}
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    autoComplete="email"
                                />
                            </div>
                            <Button type="submit" loading={loading} className="w-full h-10">
                                Send reset link
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
