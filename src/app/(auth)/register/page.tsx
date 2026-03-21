"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { motion } from "framer-motion";
import { User, Lock, Mail, Hotel } from "lucide-react";
import { GoogleSignInButton, isGoogleSignInEnabled } from "@/components/GoogleSignInButton";

const MIN_PASSWORD = 6;

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

                {isGoogleSignInEnabled() && (
                    <div className="space-y-4 mb-6">
                        <GoogleSignInButton label="Sign up with Google" />
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
                        <h3 className="text-xs font-bold text-primary uppercase tracking-widest mb-2">Admin account</h3>
                        <Input
                            icon={<User className="w-4 h-4" />}
                            placeholder="Your name"
                            value={form.adminName}
                            onChange={(e) => update("adminName", e.target.value)}
                            required
                        />
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
                            type="password"
                            placeholder="Password"
                            value={form.password}
                            onChange={(e) => update("password", e.target.value)}
                            required
                            minLength={MIN_PASSWORD}
                            autoComplete="new-password"
                        />
                        <Input
                            icon={<Lock className="w-4 h-4" />}
                            type="password"
                            placeholder="Confirm password"
                            value={form.confirmPassword}
                            onChange={(e) => update("confirmPassword", e.target.value)}
                            required
                            minLength={MIN_PASSWORD}
                            autoComplete="new-password"
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
