"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { motion } from "framer-motion";
import { User, Lock, Mail, Hotel, Eye, EyeOff } from "lucide-react";
import { isGoogleSignInEnabled } from "@/components/GoogleSignInButton";

const MIN_PASSWORD = 6;

function GoogleMark() {
    return (
        <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden>
            <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
        </svg>
    );
}

export default function RegisterPage() {
    const [form, setForm] = useState({
        hotelName: "",
        adminName: "",
        email: "",
        password: "",
        confirmPassword: "",
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const { admin, register, loading: authLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!authLoading && admin) {
            router.replace("/dashboard");
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

    function update(field: string, value: string) {
        setForm((prev) => ({ ...prev, [field]: value }));
    }

    async function handleGoogleSignUp() {
        setError("");
        const hotel = form.hotelName.trim();
        const admin = form.adminName.trim();
        if (hotel.length < 2) {
            setError("Please enter your hotel name before signing up with Google.");
            return;
        }
        if (!admin) {
            setError("Please enter your name before signing up with Google.");
            return;
        }
        setGoogleLoading(true);
        try {
            const res = await fetch("/api/auth/google/register-context", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ hotelName: hotel, adminName: admin }),
            });
            const j = (await res.json().catch(() => ({}))) as { message?: string };
            if (!res.ok) {
                setError(typeof j.message === "string" ? j.message : "Could not start Google sign-up");
                return;
            }
            window.location.href = "/api/auth/google";
        } catch {
            setError("Could not start Google sign-up. Try again.");
        } finally {
            setGoogleLoading(false);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        if (form.password.length < MIN_PASSWORD) {
            setError(`Password must be at least ${MIN_PASSWORD} characters.`);
            return;
        }
        if (form.password !== form.confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        setLoading(true);
        try {
            const { email } = await register({
                hotelName: form.hotelName,
                adminName: form.adminName,
                email: form.email,
                password: form.password,
            });
            router.push(`/verify-email/pending?email=${encodeURIComponent(email)}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Registration failed");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10 w-full max-w-lg glass-card p-8"
            >
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold font-serif text-white mb-2">Create your hotel&apos;s digital experience</h1>
                    <p className="text-slate-400 text-sm">Add your property and admin details to get started.</p>
                </div>

                {error && (
                    <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm p-3 rounded-xl text-center mb-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-primary uppercase tracking-widest mb-2">Hotel</h3>
                        <Input
                            icon={<Hotel className="w-4 h-4" />}
                            placeholder="Hotel name"
                            value={form.hotelName}
                            onChange={(e) => update("hotelName", e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-primary uppercase tracking-widest mb-2">Your profile</h3>
                        <Input
                            icon={<User className="w-4 h-4" />}
                            placeholder="Your name"
                            value={form.adminName}
                            onChange={(e) => update("adminName", e.target.value)}
                            required
                        />
                    </div>

                    {isGoogleSignInEnabled() && (
                        <div className="space-y-4">
                            <Button
                                type="button"
                                variant="outline"
                                loading={googleLoading}
                                className="flex h-auto w-full items-center justify-center gap-2 py-2.5 text-sm font-medium shadow-sm"
                                onClick={() => void handleGoogleSignUp()}
                            >
                                {!googleLoading && <GoogleMark />}
                                Sign up with Google
                            </Button>
                            <p className="text-center text-xs text-muted-foreground">
                                Uses the hotel and name above for your property. You will sign in with your Google account.
                            </p>
                            <div className="relative py-1">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-border" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="px-2 text-muted-foreground bg-background">or register with email</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-primary uppercase tracking-widest mb-2">Admin account</h3>
                        <Input
                            icon={<Mail className="w-4 h-4" />}
                            type="email"
                            placeholder="Email address"
                            value={form.email}
                            onChange={(e) => update("email", e.target.value)}
                            required
                        />
                        <Input
                            icon={<Lock className="w-4 h-4" />}
                            type={showPassword ? "text" : "password"}
                            placeholder="Password"
                            value={form.password}
                            onChange={(e) => update("password", e.target.value)}
                            required
                            minLength={MIN_PASSWORD}
                            autoComplete="new-password"
                            rightElement={
                                <button
                                    type="button"
                                    className="rounded-md p-1 text-zinc-500 transition-colors hover:bg-zinc-800/80 hover:text-zinc-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                    aria-pressed={showPassword}
                                    onClick={() => setShowPassword((v) => !v)}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4" aria-hidden />
                                    ) : (
                                        <Eye className="h-4 w-4" aria-hidden />
                                    )}
                                </button>
                            }
                        />
                        <Input
                            icon={<Lock className="w-4 h-4" />}
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm password"
                            value={form.confirmPassword}
                            onChange={(e) => update("confirmPassword", e.target.value)}
                            required
                            minLength={MIN_PASSWORD}
                            autoComplete="new-password"
                            rightElement={
                                <button
                                    type="button"
                                    className="rounded-md p-1 text-zinc-500 transition-colors hover:bg-zinc-800/80 hover:text-zinc-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                                    aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                                    aria-pressed={showConfirmPassword}
                                    onClick={() => setShowConfirmPassword((v) => !v)}
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff className="h-4 w-4" aria-hidden />
                                    ) : (
                                        <Eye className="h-4 w-4" aria-hidden />
                                    )}
                                </button>
                            }
                        />
                    </div>

                    <p className="text-xs text-muted-foreground text-center leading-relaxed">
                        By creating an account, you agree to our{" "}
                        <Link href="/terms" className="text-primary hover:underline">
                            Terms of Service
                        </Link>{" "}
                        and{" "}
                        <Link href="/privacy" className="text-primary hover:underline">
                            Privacy Policy
                        </Link>
                        .
                    </p>

                    <Button type="submit" loading={loading} className="w-full h-12 text-base mt-2">
                        Create account
                    </Button>

                    <p className="text-center text-sm text-muted-foreground mt-4">
                        Already have an account?{" "}
                        <Link href="/login" className="text-primary hover:text-primary/80 font-medium transition-colors">
                            Sign in
                        </Link>
                    </p>
                </form>
            </motion.div>
        </div>
    );
}
