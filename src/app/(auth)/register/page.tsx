"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { isGoogleSignInEnabled } from "@/components/GoogleSignInButton";
import {
    AuthShell,
    AuthHeading,
    AuthError,
    AuthSection,
    AuthInput,
    AuthButton,
    AuthDivider,
    AuthFootnote,
    AuthTextLink,
    GoogleMark,
    PasswordToggle,
    consumeErrorParam,
} from "@/components/auth/AuthShell";

const MIN_PASSWORD = 10;

const PANEL_POINTS = [
    "Free plan: one property QR, up to 40 items, no card needed.",
    "Photograph your paper menu and we turn it into a digital one.",
    "Live in about ten minutes, no app for guests to install.",
] as const;

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

    // One-time read of the OAuth callback's ?error= param; must run on the client after mount
    // (window) and cannot be a state initializer without a hydration mismatch.
    useEffect(() => {
        const e = consumeErrorParam();
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (e) setError(e);
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

    const googleEnabled = isGoogleSignInEnabled();
    const pwLen = form.password.length;
    const pwOk = pwLen >= MIN_PASSWORD;
    const confirmTouched = form.confirmPassword.length > 0;
    const confirmMatches = confirmTouched && form.confirmPassword === form.password;

    return (
        <AuthShell
            width="md"
            panelTitle={<>Put your menu in every room tonight.</>}
            panelPoints={PANEL_POINTS}
        >
            <AuthHeading
                title="Create your account"
                subtitle="Start on the Free plan. Upgrade when your guests are scanning."
            />

            <AuthError>{error}</AuthError>

            <form onSubmit={handleSubmit} className="space-y-8">
                <AuthSection title="Your property">
                    <AuthInput
                        label="Hotel name"
                        placeholder="e.g. The Courtyard Inn"
                        autoComplete="organization"
                        value={form.hotelName}
                        onChange={(e) => update("hotelName", e.target.value)}
                        required
                        autoFocus
                    />
                    <AuthInput
                        label="Your name"
                        placeholder="Owner or manager"
                        autoComplete="name"
                        value={form.adminName}
                        onChange={(e) => update("adminName", e.target.value)}
                        required
                    />
                </AuthSection>

                {googleEnabled ? (
                    <div>
                        <AuthButton
                            type="button"
                            variant="outline"
                            loading={googleLoading}
                            onClick={() => void handleGoogleSignUp()}
                        >
                            {!googleLoading && <GoogleMark />}
                            Sign up with Google
                        </AuthButton>
                        <p className="mt-2 text-center text-[12.5px] text-[#7a7f99]">
                            Uses the property details above. You will sign in with your Google account.
                        </p>
                        <AuthDivider>or with email</AuthDivider>
                    </div>
                ) : null}

                <AuthSection title="Sign-in details">
                    <AuthInput
                        label="Email"
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        placeholder="you@yourhotel.com"
                        value={form.email}
                        onChange={(e) => update("email", e.target.value)}
                        required
                        hint="We will send a verification link here."
                    />
                    <AuthInput
                        label="Password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder={`At least ${MIN_PASSWORD} characters`}
                        value={form.password}
                        onChange={(e) => update("password", e.target.value)}
                        required
                        minLength={MIN_PASSWORD}
                        rightElement={<PasswordToggle shown={showPassword} onToggle={() => setShowPassword((v) => !v)} />}
                        hint={
                            pwLen === 0 ? (
                                `Use ${MIN_PASSWORD} or more characters.`
                            ) : pwOk ? (
                                <span className="text-[#2f7f6f]">Good length.</span>
                            ) : (
                                `${MIN_PASSWORD - pwLen} more character${MIN_PASSWORD - pwLen === 1 ? "" : "s"} needed.`
                            )
                        }
                    />
                    <AuthInput
                        label="Confirm password"
                        type={showConfirmPassword ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder="Type it again"
                        value={form.confirmPassword}
                        onChange={(e) => update("confirmPassword", e.target.value)}
                        required
                        minLength={MIN_PASSWORD}
                        rightElement={
                            <PasswordToggle
                                shown={showConfirmPassword}
                                onToggle={() => setShowConfirmPassword((v) => !v)}
                                label="confirm password"
                            />
                        }
                        hint={
                            confirmTouched ? (
                                confirmMatches ? (
                                    <span className="text-[#2f7f6f]">Passwords match.</span>
                                ) : (
                                    <span className="text-[#9b2c20]">Passwords do not match yet.</span>
                                )
                            ) : undefined
                        }
                    />
                </AuthSection>

                <div>
                    <AuthButton type="submit" loading={loading}>
                        Create free account
                    </AuthButton>
                    <p className="mt-3 text-center text-[12.5px] leading-relaxed text-[#7a7f99]">
                        By creating an account you agree to our{" "}
                        <Link href="/terms" className="underline underline-offset-2 hover:text-[#14172b]">
                            Terms
                        </Link>{" "}
                        and{" "}
                        <Link href="/privacy" className="underline underline-offset-2 hover:text-[#14172b]">
                            Privacy Policy
                        </Link>
                        .
                    </p>
                </div>
            </form>

            <AuthFootnote>
                Already have an account? <AuthTextLink href="/login">Sign in</AuthTextLink>
            </AuthFootnote>
        </AuthShell>
    );
}
