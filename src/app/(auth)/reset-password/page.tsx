"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
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
    AuthLinkButton,
    PasswordToggle,
} from "@/components/auth/AuthShell";

const MIN_PASSWORD = 10;

const PANEL_POINTS = [
    "Use at least 10 characters. A short phrase is easier to remember than a jumble.",
    "Changing your password signs out other devices using your account.",
    "Staff access keys are separate and are not affected.",
] as const;

function Shell({ children }: { children: React.ReactNode }) {
    return (
        <AuthShell panelTitle={<>Choose a new password.</>} panelPoints={PANEL_POINTS}>
            {children}
        </AuthShell>
    );
}

function ResetFallback() {
    return (
        <Shell>
            <AuthHeading title="Set a new password" subtitle="Loading…" />
        </Shell>
    );
}

function ResetPasswordInner() {
    const params = useSearchParams();
    const token = params.get("token")?.trim() || "";

    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
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
            <Shell>
                <AuthHeading
                    title="This link is incomplete"
                    subtitle="Open the reset link from your email, or request a new one."
                />
                <AuthLinkButton href="/forgot-password">Request a new link</AuthLinkButton>
                <AuthFootnote>
                    <AuthTextLink href="/login">Back to sign in</AuthTextLink>
                </AuthFootnote>
            </Shell>
        );
    }

    if (success) {
        return (
            <Shell>
                <AuthHeading title="Password updated" />
                <AuthSuccess>{success}</AuthSuccess>
                <AuthLinkButton href="/login">Sign in with your new password</AuthLinkButton>
            </Shell>
        );
    }

    const pwLen = password.length;
    const pwOk = pwLen >= MIN_PASSWORD;
    const confirmTouched = confirm.length > 0;
    const confirmMatches = confirmTouched && confirm === password;

    return (
        <Shell>
            <AuthHeading title="Set a new password" subtitle="Choose a password you have not used here before." />
            <AuthError>{error}</AuthError>
            <form onSubmit={handleSubmit} className="space-y-4">
                <AuthInput
                    label="New password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder={`At least ${MIN_PASSWORD} characters`}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={MIN_PASSWORD}
                    autoFocus
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
                    label="Confirm new password"
                    type={showConfirm ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Type it again"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    minLength={MIN_PASSWORD}
                    rightElement={
                        <PasswordToggle shown={showConfirm} onToggle={() => setShowConfirm((v) => !v)} label="confirm password" />
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
                <AuthButton type="submit" loading={loading} className="mt-2">
                    Update password
                </AuthButton>
            </form>
            <AuthFootnote>
                <AuthTextLink href="/login">Back to sign in</AuthTextLink>
            </AuthFootnote>
        </Shell>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<ResetFallback />}>
            <ResetPasswordInner />
        </Suspense>
    );
}
