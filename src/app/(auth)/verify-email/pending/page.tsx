"use client";

import { Suspense, useState } from "react";
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
    "The link signs you in and opens your dashboard.",
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

function PendingInner() {
    const params = useSearchParams();
    const emailFromQuery = params.get("email")?.trim() || "";
    const [emailInput, setEmailInput] = useState(emailFromQuery);
    const [sending, setSending] = useState(false);
    const [notice, setNotice] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

    const email = emailFromQuery || emailInput.trim();

    async function resend() {
        if (!email) {
            setNotice({ kind: "error", text: "Enter the email you used to register." });
            return;
        }
        setSending(true);
        setNotice(null);
        try {
            const { message } = await api.resendVerification(email);
            setNotice({ kind: "ok", text: message });
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
                <AuthButton type="submit" variant="outline" loading={sending}>
                    Resend verification email
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
