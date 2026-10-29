"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { isGoogleSignInEnabled } from "@/components/GoogleSignInButton";
import { getSafeNextPath } from "@/lib/routes";
import {
    AuthShell,
    AuthHeading,
    AuthError,
    AuthInput,
    AuthButton,
    AuthDivider,
    AuthFootnote,
    AuthTextLink,
    GoogleLinkButton,
    PasswordToggle,
    consumeErrorParam,
} from "@/components/auth/AuthShell";

const PANEL_POINTS = [
    "Change a price from your phone; guests see it on the next scan.",
    "Print fresh QR cards for any room in one click.",
    "See how many guests opened the menu today.",
] as const;

/** `?next=` (set when an expired session bounced the user here) wins over the role default. */
function destinationAfterLogin(role: string, next: string | null): string {
    if (next) return next;
    return role === "KITCHEN" ? "/orders" : "/dashboard";
}

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const { admin, login, loading: authLoading } = useAuth();
    const router = useRouter();
    // Read once: the redirect below changes the URL, and this effect re-runs when the profile
    // fetch updates `admin`, so reading `?next=` at that point would find nothing.
    const [nextPath] = useState<string | null>(() =>
        typeof window === "undefined" ? null : getSafeNextPath(window.location.search),
    );

    // Reverse guard: if already logged in, go back to where the user was (?next=) or the default page.
    useEffect(() => {
        if (!authLoading && admin) {
            router.replace(destinationAfterLogin(admin.role, nextPath));
        }
    }, [authLoading, admin, router, nextPath]);

    // One-time read of the OAuth callback's ?error= param; must run on the client after mount
    // (window) and cannot be a state initializer without a hydration mismatch.
    useEffect(() => {
        const e = consumeErrorParam();
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (e) setError(e);
    }, []);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const loggedInAdmin = await login(email, password);
            if (loggedInAdmin) {
                router.replace(destinationAfterLogin(loggedInAdmin.role, nextPath));
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Login failed");
        } finally {
            setLoading(false);
        }
    }

    const googleEnabled = isGoogleSignInEnabled();

    return (
        <AuthShell panelTitle={<>Welcome back. Your rooms are waiting.</>} panelPoints={PANEL_POINTS}>
            <AuthHeading title="Sign in" subtitle="Manage your menu, rooms and QR cards." />

            <AuthError>{error}</AuthError>

            {googleEnabled ? (
                <>
                    <GoogleLinkButton label="Continue with Google" />
                    <AuthDivider>or with email</AuthDivider>
                </>
            ) : null}

            <form onSubmit={handleSubmit} className="space-y-4">
                <AuthInput
                    label="Email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="you@yourhotel.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                />
                <AuthInput
                    label="Password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    labelAside={
                        <Link
                            href="/forgot-password"
                            className="text-[13px] font-medium text-[#4b5068] transition-colors hover:text-[#14172b]"
                        >
                            Forgot password?
                        </Link>
                    }
                    rightElement={<PasswordToggle shown={showPassword} onToggle={() => setShowPassword((v) => !v)} />}
                />

                <AuthButton type="submit" loading={loading} className="mt-2">
                    Sign in
                </AuthButton>
            </form>

            <AuthFootnote>
                New to DreamCanvas? <AuthTextLink href="/register">Create a free account</AuthTextLink>
            </AuthFootnote>
            <p className="mt-3 text-center text-[13.5px] text-[#7a7f99]">
                Staff with an access key?{" "}
                <Link href="/staff/access" className="font-medium text-[#4b5068] hover:text-[#14172b]">
                    Enter it here
                </Link>
            </p>
        </AuthShell>
    );
}
