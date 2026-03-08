"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { motion } from "framer-motion";
import { User, Lock, Mail, Hotel, MapPin, Phone } from "lucide-react";

export default function RegisterPage() {
    const [form, setForm] = useState({
        hotelName: "",
        adminName: "",
        email: "",
        password: "",
        hotelAddress: "",
        hotelPhone: "",
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const { admin, register, loading: authLoading } = useAuth();
    const router = useRouter();

    // Reverse guard: if already logged in, go to dashboard
    useEffect(() => {
        if (!authLoading && admin) {
            router.replace("/dashboard");
        }
    }, [authLoading, admin, router]);

    function update(field: string, value: string) {
        setForm((prev) => ({ ...prev, [field]: value }));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            await register(form);
            router.push("/dashboard");
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
                    <h1 className="text-3xl font-bold font-serif text-white mb-2">Partner with Us</h1>
                    <p className="text-slate-400 text-sm">Create your hotel's digital experience</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm p-3 rounded-xl text-center">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-primary uppercase tracking-widest mb-2">Hotel Details</h3>
                        <Input
                            icon={<Hotel className="w-4 h-4" />}
                            placeholder="Hotel Name"
                            value={form.hotelName}
                            onChange={e => update("hotelName", e.target.value)}
                            required
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                icon={<MapPin className="w-4 h-4" />}
                                placeholder="Address"
                                value={form.hotelAddress}
                                onChange={e => update("hotelAddress", e.target.value)}
                            />
                            <Input
                                icon={<Phone className="w-4 h-4" />}
                                placeholder="Phone"
                                value={form.hotelPhone}
                                onChange={e => update("hotelPhone", e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-primary uppercase tracking-widest mb-2">Admin Account</h3>
                        <Input
                            icon={<User className="w-4 h-4" />}
                            placeholder="Your Name"
                            value={form.adminName}
                            onChange={e => update("adminName", e.target.value)}
                            required
                        />
                        <Input
                            icon={<Mail className="w-4 h-4" />}
                            type="email"
                            placeholder="Email Address"
                            value={form.email}
                            onChange={e => update("email", e.target.value)}
                            required
                        />
                        <Input
                            icon={<Lock className="w-4 h-4" />}
                            type="password"
                            placeholder="Password"
                            value={form.password}
                            onChange={e => update("password", e.target.value)}
                            required minLength={6}
                        />
                    </div>

                    <Button type="submit" loading={loading} className="w-full h-12 text-base mt-4">
                        Create Account
                    </Button>

                    <p className="text-center text-sm text-muted-foreground mt-4">
                        Already have an account? <Link href="/login" className="text-primary hover:text-primary/80 font-medium transition-colors">Sign In</Link>
                    </p>
                </form>
            </motion.div>
        </div>
    );
}
