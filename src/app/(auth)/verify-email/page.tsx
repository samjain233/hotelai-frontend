"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { LegalFooter } from "@/components/LegalFooter";

function VerifyFallback() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground text-sm">
            Verifying…
        </div>
    );
}

function VerifyEmailInner() {
    const params = useSearchParams();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const token = params.get("token");
        if (!token?.trim()) {
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
            <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
                <div className="w-full max-w-sm p-6 rounded-xl bg-card border border-border text-center space-y-4">
                    <h1 className="text-lg font-semibold text-white">Couldn&apos;t verify email</h1>
                    <p className="text-sm text-muted-foreground">{error}</p>
                    <Link
                        href="/verify-email/pending"
                        className="inline-block text-sm text-indigo-400 hover:text-indigo-300 font-medium"
                    >
                        Resend verification email
                    </Link>
                    <Link href="/login" className="block text-sm text-zinc-500 hover:text-zinc-400">
                        Back to sign in
                    </Link>
                </div>
                <LegalFooter className="mt-8" />
            </div>
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
