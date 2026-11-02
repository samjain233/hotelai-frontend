"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MailCheck } from "lucide-react";
import { api } from "@/lib/api";
import {
    AuthShell,
    AuthHeading,
    AuthBadge,
    AuthError,
    AuthSuccess,
    AuthInput,
    AuthButton,
    AuthFootnote,
    AuthTextLink,
} from "@/components/auth/AuthShell";

const PANEL_POINTS = [
    "The email comes from DreamCanvas; check spam or promotions if it is not in your inbox.",
    "After you open the link, sign in with your password to reach your dashboard.",
    "Wrong address? Go back and register again with the right one.",
] as const;

function Shell({ children }: { children: React.ReactNode }) {
    return (
        <AuthShell panelTitle={<>Check your inbox.</>} panelPoints={PANEL_POINTS}>
            {children}
        </AuthShell>
    );
}

function PendingFallback() {
    return (
        <Shell>
            <AuthBadge>
                <MailCheck className="h-5 w-5" aria-hidden />
            </AuthBadge>
            <AuthHeading title="Check your email" subtitle="Loading…" />
        </Shell>
    );
}

/** Each resend replaces the previous link, so resending while the first email is still arriving breaks it. */
const RESEND_COOLDOWN_SECONDS = 90;

/** Seconds left until `until` (epoch ms), ticking once a second; 0 when it has passed. */
function useSecondsUntil(until: number): number {
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        if (until <= Date.now()) return;
        const id = window.setInterval(() => setNow(Date.now()), 1000);
        return () => window.clearInterval(id);
    }, [until]);
    return Math.max(0, Math.ceil((until - now) / 1000));
}

function PendingInner() {
    const params = useSearchParams();
    const emailFromQuery = params.get("email")?.trim() || "";
    const [emailInput, setEmailInput] = useState(emailFromQuery);
    const [sending, setSending] = useState(false);
    const [notice, setNotice] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
    // Arriving straight from sign-up means an email was just sent, so start the wait right away.
    const [cooldownUntil, setCooldownUntil] = useState(() =>
        emailFromQuery ? Date.now() + RESEND_COOLDOWN_SECONDS * 1000 : 0,
    );
    const secondsLeft = useSecondsUntil(cooldownUntil);

    const email = emailFromQuery || emailInput.trim();

    async function resend() {
        if (!email) {
            setNotice({ kind: "error", text: "Enter the email you used to register." });
            return;
        }
        if (secondsLeft > 0) return;
        setSending(true);
        setNotice(null);
        try {
            const { message } = await api.resendVerification(email);
            setNotice({
                kind: "ok",
                text: `${message} Only the link in this newest email will work; earlier ones no longer do.`,
            });
            setCooldownUntil(Date.now() + RESEND_COOLDOWN_SECONDS * 1000);
        } catch (e) {
            setNotice({ kind: "error", text: e instanceof Error ? e.message : "Could not resend" });
        } finally {
            setSending(false);
        }
    }

    return (
        <Shell>
            <AuthBadge>
                <MailCheck className="h-5 w-5" aria-hidden />
            </AuthBadge>
            <AuthHeading
                title="Check your email"
                subtitle={
                    emailFromQuery ? (
                        <>
                            We sent a verification link to <span className="font-semibold text-[#14172b]">{emailFromQuery}</span>.
                            Open it to activate your account.
                        </>
                    ) : (
                        "We sent a verification link to the address you registered with. Open it to activate your account."
                    )
                }
            />

            {notice?.kind === "ok" ? <AuthSuccess>{notice.text}</AuthSuccess> : null}
            {notice?.kind === "error" ? <AuthError>{notice.text}</AuthError> : null}

            <form
                className="space-y-4"
                onSubmit={(e) => {
                    e.preventDefault();
                    void resend();
                }}
            >
                {!emailFromQuery ? (
                    <AuthInput
                        label="Email used for sign-up"
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        placeholder="you@yourhotel.com"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        required
                    />
                ) : null}
                <AuthButton type="submit" variant="outline" loading={sending} disabled={secondsLeft > 0}>
                    {secondsLeft > 0 ? `Resend available in ${secondsLeft}s` : "Resend verification email"}
                </AuthButton>
            </form>

            <AuthFootnote>
                Already verified? <AuthTextLink href="/login">Sign in</AuthTextLink>
            </AuthFootnote>
        </Shell>
    );
}

export default function VerifyEmailPendingPage() {
    return (
        <Suspense fallback={<PendingFallback />}>
            <PendingInner />
        </Suspense>
    );
}
