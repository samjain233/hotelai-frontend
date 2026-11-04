"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Shield } from "lucide-react";
import { GoogleMark, consumeErrorParam } from "@/components/auth/AuthShell";
import { PLATFORM_GOOGLE_SIGN_IN_URL, platformAuth } from "@/lib/platformApi";

export default function SuperAdminLoginPage() {
    const [error, setError] = useState("");
    const router = useRouter();

    // One-time read of the callback's ?error=; then skip the page if this browser is already signed in.
    useEffect(() => {
        const e = consumeErrorParam();
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (e) setError(e);
        platformAuth
            .me()
            .then(() => router.replace("/superadmin"))
            .catch(() => undefined);
    }, [router]);

    return (
        <div className="min-h-screen bg-background flex items-center justify-center px-4">
            <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                    <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                        <Shield className="w-7 h-7 text-primary" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">DreamCanvas Platform</h1>
                    <p className="text-sm text-muted-foreground mt-1">Super-admin access. Sign in with the platform Google account.</p>
                </div>

                <div className="space-y-4">
                    {/* Full-page navigation: the route handler redirects to Google. */}
                    <a
                        href={PLATFORM_GOOGLE_SIGN_IN_URL}
                        className="w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl border border-border bg-card text-foreground font-medium hover:bg-secondary transition"
                    >
                        <GoogleMark />
                        Sign in with Google
                    </a>

                    {error && <p className="text-sm text-destructive text-center">{error}</p>}

                    <p className="text-xs text-muted-foreground text-center">
                        You stay signed in until you close the browser, for 8 hours at most, or 30 minutes without activity.
                    </p>
                </div>
            </div>
        </div>
    );
}
