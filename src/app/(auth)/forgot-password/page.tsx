"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import {
    AuthShell,
    AuthHeading,
    AuthError,
    AuthSuccess,
    AuthInput,
    AuthButton,
    AuthFootnote,
    AuthTextLink,
} from "@/components/auth/AuthShell";

const PANEL_POINTS = [
    "Reset links expire after a short while; request a new one if it has lapsed.",
    "Staff who sign in with an access key should ask their manager for a new key instead.",
    "Changing your password signs out any other devices using your account.",
] as const;

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
        <AuthShell panelTitle={<>Locked out? It happens.</>} panelPoints={PANEL_POINTS}>
            <AuthHeading
                title="Reset your password"
                subtitle="Enter the email you sign in with and we will send a link to choose a new password."
            />

            {success ? (
                <>
                    <AuthSuccess>{success}</AuthSuccess>
                    <p className="text-[14px] leading-relaxed text-[#4b5068]">
                        Check your inbox (and spam folder). The link opens a page where you can set a new password.
                    </p>
                    <AuthButton type="button" variant="outline" className="mt-6" onClick={() => setSuccess(null)}>
                        Use a different email
                    </AuthButton>
                </>
            ) : (
                <>
                    <AuthError>{error}</AuthError>
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
                        <AuthButton type="submit" loading={loading} className="mt-2">
                            Send reset link
                        </AuthButton>
                    </form>
                </>
            )}

            <AuthFootnote>
                Remembered it? <AuthTextLink href="/login">Back to sign in</AuthTextLink>
            </AuthFootnote>
            <p className="mt-3 text-center text-[13.5px] text-[#7a7f99]">
                No account yet?{" "}
                <Link href="/register" className="font-medium text-[#4b5068] hover:text-[#14172b]">
                    Create one free
                </Link>
            </p>
        </AuthShell>
    );
}
