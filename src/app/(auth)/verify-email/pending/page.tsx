"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Mail } from "lucide-react";
import { api } from "@/lib/api";
import { LegalFooter } from "@/components/LegalFooter";

function PendingFallback() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground text-sm">
            Loading…
        </div>
    );
}

function PendingInner() {
    const params = useSearchParams();
    const emailFromQuery = params.get("email")?.trim() || "";
    const [emailInput, setEmailInput] = useState(emailFromQuery);
    const [sending, setSending] = useState(false);
    const [toast, setToast] = useState<string | null>(null);

    useEffect(() => {
        if (emailFromQuery) setEmailInput(emailFromQuery);
    }, [emailFromQuery]);

    const email = emailFromQuery || emailInput.trim();

    async function resend() {
        if (!email) {
            setToast("Enter the email you used to register.");
            return;
        }
        setSending(true);
        setToast(null);
        try {
            const { message } = await api.resendVerification(email);
            setToast(message);
        } catch (e) {
            setToast(e instanceof Error ? e.message : "Could not resend");
        } finally {
            setSending(false);
        }
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
            <div className="w-full max-w-md p-8 rounded-xl bg-card border border-border text-center space-y-4">
                <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center mx-auto mb-2">
                    <span className="text-base font-bold text-white">✉</span>
                </div>
                <h1 className="text-xl font-semibold text-white">Check your email</h1>
                <p className="text-sm text-muted-foreground leading-relaxed">
                    We sent a verification link
                    {emailFromQuery ? (
                        <>
                            {" "}
                            to <span className="text-foreground font-medium">{emailFromQuery}</span>
                        </>
                    ) : null}
                    . Click the link to activate your account, then sign in.
                </p>
                {!emailFromQuery && (
                    <div className="text-left">
                        <label className="block text-xs font-medium text-zinc-400 mb-1.5 text-center">
                            Email used for sign-up
                        </label>
                        <Input
                            icon={<Mail className="w-4 h-4" />}
                            type="email"
                            placeholder="you@example.com"
                            value={emailInput}
                            onChange={(e) => setEmailInput(e.target.value)}
                        />
                    </div>
                )}
                {toast && <p className="text-sm text-indigo-300/90">{toast}</p>}
                <div className="flex flex-col gap-2 pt-2">
                    <Button type="button" loading={sending} className="w-full h-10" onClick={resend}>
                        Resend verification email
                    </Button>
                    <Link
                        href="/login"
                        className="text-sm text-indigo-400 hover:text-indigo-300 font-medium py-2"
                    >
                        Back to sign in
                    </Link>
                </div>
            </div>
            <LegalFooter className="mt-8" />
        </div>
    );
}

export default function VerifyEmailPendingPage() {
    return (
        <Suspense fallback={<PendingFallback />}>
            <PendingInner />
        </Suspense>
    );
}
