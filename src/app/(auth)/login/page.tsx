"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Mail, Lock } from "lucide-react";
import { LegalFooter } from "@/components/LegalFooter";
import { GoogleSignInButton, isGoogleSignInEnabled } from "@/components/GoogleSignInButton";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const { admin, login, loading: authLoading } = useAuth();
    const router = useRouter();

    // Reverse guard: if already logged in, go to appropriate page
    useEffect(() => {
        if (!authLoading && admin) {
            router.replace(admin.role === 'KITCHEN' ? '/orders' : '/dashboard');
        }
    }, [authLoading, admin, router]);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const e = params.get("error");
        if (e) {
            setError(decodeURIComponent(e));
            const url = new URL(window.location.href);
            url.searchParams.delete("error");
            window.history.replaceState({}, "", url.pathname + url.search);
        }
    }, []);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const loggedInAdmin = await login(email, password);
            if (loggedInAdmin) {
                router.replace(loggedInAdmin.role === 'KITCHEN' ? '/orders' : '/dashboard');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Login failed");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
            <div className="w-full max-w-sm">
                {/* Brand */}
                <div className="text-center mb-8">
                    <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center mx-auto mb-5">
                        <span className="text-base font-bold text-white">H</span>
                    </div>
                    <h1 className="text-xl font-semibold text-white mb-1">Sign in to your account</h1>
                    <p className="text-sm text-zinc-500">Manage your hotel operations</p>
                </div>

                {/* Form */}
                <div className="p-6 rounded-xl bg-card border border-border space-y-4">
                    {isGoogleSignInEnabled() && (
                        <>
                            <GoogleSignInButton label="Sign in with Google" />
                            <div className="relative py-1">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-border" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-card px-2 text-muted-foreground">or with email</span>
                                </div>
                            </div>
                        </>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg text-center">
                                {error}
                            </div>
                        )}

                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Email</label>
                                <Input
                                    icon={<Mail className="w-4 h-4" />}
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Password</label>
                                <Input
                                    icon={<Lock className="w-4 h-4" />}
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    required
                                />
                                <div className="flex justify-end mt-1.5">
                                    <Link
                                        href="/forgot-password"
                                        className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                                    >
                                        Forgot password?
                                    </Link>
                                </div>
                            </div>
                        </div>

                        <Button type="submit" loading={loading} className="w-full h-10">
                            Sign in
                        </Button>
                    </form>
                </div>

                <p className="text-center text-sm text-zinc-600 mt-5">
                    Don't have an account?{" "}
                    <Link href="/register" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                        Register
                    </Link>
                </p>
                <LegalFooter className="mt-8" />
            </div>
        </div>
    );
}
