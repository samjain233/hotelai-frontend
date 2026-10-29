"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
    AuthShell,
    AuthHeading,
    AuthError,
    AuthInput,
    AuthButton,
    AuthFootnote,
    AuthTextLink,
} from "@/components/auth/AuthShell";

const PANEL_POINTS = [
    "Your manager creates the key from Staff in the dashboard and shares it with you.",
    "Your key opens only the screens your role needs, such as the kitchen queue.",
    "Lost the key? Ask your manager to issue a new one.",
] as const;

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
        <AuthShell panelTitle={<>Staff sign-in, without a password.</>} panelPoints={PANEL_POINTS}>
            <AuthHeading title="Staff access" subtitle="Paste the access key your manager shared with you." />
            <AuthError>{error}</AuthError>
            <form onSubmit={handleSubmit} className="space-y-4">
                <AuthInput
                    label="Access key"
                    type="text"
                    autoComplete="off"
                    autoCapitalize="off"
                    autoCorrect="off"
                    spellCheck={false}
                    placeholder="Paste your key"
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    required
                    autoFocus
                    className="font-mono tracking-wide"
                />
                <AuthButton type="submit" loading={loading} className="mt-2">
                    Continue
                </AuthButton>
            </form>
            <AuthFootnote>
                Hotel owner or manager? <AuthTextLink href="/login">Sign in with email</AuthTextLink>
            </AuthFootnote>
        </AuthShell>
    );
}
