"use client";

import { startTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { GuestMenuStatusPage } from "./components/GuestMenuStatusPage";

/**
 * Shown when the menu could not be server-rendered and there is no cached copy to fall back on
 * (menu API down on a cold or freshly purged page). Retry refreshes the server render and resets
 * the boundary in one transition, per the Next.js guidance for server-side errors. The real error
 * is logged, never shown to the guest.
 */
export default function GuestMenuError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    const router = useRouter();

    useEffect(() => {
        console.error("Guest menu render failed", error);
    }, [error]);

    const retry = () => {
        startTransition(() => {
            router.refresh();
            reset();
        });
    };

    return (
        <GuestMenuStatusPage
            title="Menu unavailable"
            message="We couldn't load the menu right now. Please try again in a moment."
            action={
                <Button
                    variant="secondary"
                    className="border-[var(--guest-line)] bg-[var(--guest-surface-2)] text-[var(--guest-text)] hover:opacity-90"
                    onClick={retry}
                >
                    Try again
                </Button>
            }
        />
    );
}
