"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, MailWarning } from "lucide-react";
import { api } from "@/lib/api";
import {
    AuthShell,
    AuthHeading,
    AuthBadge,
    AuthLinkButton,
    AuthFootnote,
    AuthTextLink,
} from "@/components/auth/AuthShell";

const PANEL_POINTS = [
    "Verifying confirms the email belongs to you so password resets reach the right inbox.",
    "You only do this once per account.",
    "Links expire; if this one has, request a fresh email from the next screen.",
] as const;

function Shell({ children }: { children: React.ReactNode }) {
    return (
        <AuthShell panelTitle={<>One more step and you are in.</>} panelPoints={PANEL_POINTS}>
            {children}
        </AuthShell>
    );
}

function VerifyFallback() {
    return (
        <Shell>
            <AuthBadge>
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
            </AuthBadge>
            <AuthHeading title="Verifying your email" subtitle="This takes a second. You will be taken to your dashboard." />
        </Shell>
    );
}

function VerifyEmailInner() {
    const params = useSearchParams();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const token = params.get("token");
        if (!token?.trim()) {
            // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of the URL on mount
            setError("This link is invalid. Open the verification link from your email, or request a new one below.");
            return;
        }

        let cancelled = false;
        api.verifyEmail(token)
            .then(() => {
                if (!cancelled) {
                    window.location.href = "/dashboard";
                }
            })
            .catch((e) => {
                if (!cancelled) {
                    setError(e instanceof Error ? e.message : "Verification failed");
                }
            });
        return () => {
            cancelled = true;
        };
    }, [params]);

    if (error) {
        return (
            <Shell>
                <AuthBadge>
                    <MailWarning className="h-5 w-5" aria-hidden />
                </AuthBadge>
                <AuthHeading title="We could not verify that link" subtitle={error} />
                <AuthLinkButton href="/verify-email/pending">Send a new verification email</AuthLinkButton>
                <AuthFootnote>
                    <AuthTextLink href="/login">Back to sign in</AuthTextLink>
                </AuthFootnote>
            </Shell>
        );
    }

    return <VerifyFallback />;
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={<VerifyFallback />}>
            <VerifyEmailInner />
        </Suspense>
    );
}
