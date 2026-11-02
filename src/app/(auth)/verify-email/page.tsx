"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, MailWarning } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import type { VerifyEmailResponse } from "@/lib/types";
import {
    AuthShell,
    AuthHeading,
    AuthBadge,
    AuthLinkButton,
    stripTokenFromUrl,
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

/** The token is single-use; Strict Mode runs the effect twice in dev, so both runs share one request. */
const verifyRequests = new Map<string, Promise<VerifyEmailResponse>>();
function verifyOnce(token: string): Promise<VerifyEmailResponse> {
    let request = verifyRequests.get(token);
    if (!request) {
        request = api.verifyEmail(token);
        verifyRequests.set(token, request);
    }
    return request;
}

function VerifyFallback() {
    return (
        <Shell>
            <AuthBadge>
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
            </AuthBadge>
            <AuthHeading title="Verifying your email" subtitle="This takes a second. You will then sign in with your password." />
        </Shell>
    );
}

function VerifyEmailInner() {
    const params = useSearchParams();
    const router = useRouter();
    // Read once: the token is then removed from the address bar, which updates `params`.
    const [token] = useState(() => params.get("token")?.trim() || "");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        stripTokenFromUrl();
        if (!token) {
            // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of the URL on mount
            setError("It is incomplete. Open the verification link from your email, or request a new one below.");
            return;
        }

        let cancelled = false;
        verifyOnce(token)
            .then(({ email }) => {
                if (!cancelled) {
                    router.replace(`/login?verified=1&email=${encodeURIComponent(email)}`);
                }
            })
            .catch((e) => {
                if (!cancelled) {
                    // The token is cleared once used, so "already verified" and "expired" both arrive as a 400.
                    setError(
                        e instanceof ApiError && e.status === 400
                            ? "It has already been used or has expired. If you already verified your email, just sign in."
                            : e instanceof Error
                              ? e.message
                              : "Verification failed",
                    );
                }
            });
        return () => {
            cancelled = true;
        };
    }, [token, router]);

    if (error) {
        return (
            <Shell>
                <AuthBadge>
                    <MailWarning className="h-5 w-5" aria-hidden />
                </AuthBadge>
                <AuthHeading title="This link can't be used" subtitle={error} />
                <div className="space-y-3">
                    <AuthLinkButton href="/login">Sign in</AuthLinkButton>
                    <AuthLinkButton href="/verify-email/pending" variant="outline">
                        Send a new verification email
                    </AuthLinkButton>
                </div>
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
